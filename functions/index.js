/* ═══════════════════════════════════════════════════════════
   VelaLight — Firebase Cloud Functions
   AI Chat + customer stats + secure coupon validation/redemption
   + auto coupon emails (THANKS10 / LOYAL15)
   ═══════════════════════════════════════════════════════════ */

const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getAppCheck } = require("firebase-admin/app-check");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const COMPLETED_ORDER_STATUS = 5;
const CANCELLED_ORDER_STATUS = 4;
const LOYALTY_CODE = "LOYAL15";
const LOYALTY_REQUIRED_ORDERS = 3;
const COUPON_CORS = [
  "https://velalight.github.io",
  "https://velalight.firebaseapp.com",
  /localhost/
];
const MAX_ORDER_LINES = 50;
const FREE_GIFT_IDS = new Set(["pmvj8cij7c34", "pmvj8qxhca70"]);
const FREE_GIFT_MIN_SUBTOTAL = 1000;
const FREE_SHIPPING_THRESHOLD = 3000;

/* ═══════════════════════════════════════════════════════════
   ✉️  إعدادات إيميل المتجر (Gmail)
   ⚠️ غيّر الباسورد الجديد بعد ما تعمله من Google
   ═══════════════════════════════════════════════════════════ */
const STORE_EMAIL = "velalight.orders@gmail.com";
const STORE_APP_PASSWORD = "czewmyelnrhhwsji"; // ← ⚠️ غيّرها للأمان

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: STORE_EMAIL, pass: STORE_APP_PASSWORD }
});

/* ═══════════════════════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════════════════════ */

function asString(value) {
  return String(value == null ? "" : value).trim();
}

function orderError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

async function verifyAppCheckRequest(req) {
  const token = asString(req.get("X-Firebase-AppCheck"));
  if (!token) throw orderError(401, "تعذر التحقق من أمان الاتصال. حدّث الصفحة وحاول مرة أخرى.");
  try {
    await getAppCheck().verifyToken(token);
  } catch (error) {
    throw orderError(401, "تعذر التحقق من أمان الاتصال. حدّث الصفحة وحاول مرة أخرى.");
  }
}

function htmlEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

function normalizeEmail(value) {
  return asString(value).toLowerCase();
}

function normalizePhone(value) {
  return asString(value).replace(/\D/g, "");
}

function asMillis(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value.toMillis === "function") return value.toMillis();
  if (value && typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(asString(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function identityHashes(phone, email) {
  const tokens = [];
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  if (normalizedPhone) tokens.push(`phone:${normalizedPhone}`);
  if (normalizedEmail) tokens.push(`email:${normalizedEmail}`);
  return [...new Set(tokens)].map(sha256);
}

function redemptionDocumentIds(couponId, hashes) {
  return hashes.map((identityHash) => sha256(`${couponId}:${identityHash}`));
}

function hasLegacyUsedBy(coupon, phone, email) {
  const oldValues = Array.isArray(coupon.usedBy) ? coupon.usedBy.map(asString) : [];
  const phoneRaw = asString(phone);
  const phoneDigits = normalizePhone(phone);
  const emailRaw = asString(email);
  const emailLower = normalizeEmail(email);
  return oldValues.some((value) => {
    const lower = value.toLowerCase();
    const digits = value.replace(/\D/g, "");
    return (phoneRaw && value === phoneRaw)
      || (phoneDigits && digits === phoneDigits)
      || (emailRaw && value === emailRaw)
      || (emailLower && lower === emailLower);
  });
}

function couponPublicFields(id, coupon) {
  return {
    id,
    code: asString(coupon.code).toUpperCase(),
    type: asString(coupon.type),
    value: Number(coupon.value || 0),
    maxUses: coupon.maxUses == null ? null : Number(coupon.maxUses),
    usedCount: Number(coupon.usedCount || 0),
    active: coupon.active !== false,
    startDate: coupon.startDate || null,
    expiresAt: coupon.expiresAt || null,
    minOrder: Number(coupon.minOrder || 0),
    maxDiscount: Number(coupon.maxDiscount || 0),
    firstOrderOnly: coupon.firstOrderOnly === true
  };
}

function calculateCouponDiscount(coupon, subtotal) {
  let discount = coupon.type === "percent"
    ? subtotal * (Number(coupon.value || 0) / 100)
    : Number(coupon.value || 0);
  const maxDiscount = Number(coupon.maxDiscount || 0);
  if (maxDiscount > 0 && discount > maxDiscount) discount = maxDiscount;
  return Math.min(subtotal, Math.max(0, Math.round(discount)));
}

async function findCoupon(code, preferredId = "") {
  if (preferredId) {
    const doc = await db.collection("coupons").doc(preferredId).get();
    if (doc.exists) return doc;
  }
  const result = await db.collection("coupons").where("code", "==", code).limit(1).get();
  return result.empty ? null : result.docs[0];
}

async function getPriorOrders(phone, email, excludedOrderId = "") {
  const orders = db.collection("orders");
  const queries = [];
  if (asString(phone)) queries.push(orders.where("phone", "==", asString(phone)).get());
  if (asString(email)) queries.push(orders.where("email", "==", asString(email)).get());
  const snapshots = await Promise.all(queries);
  const matches = new Map();
  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      if (doc.id === excludedOrderId) continue;
      const order = doc.data();
      if (Number(order.status || 0) === COMPLETED_ORDER_STATUS) matches.set(doc.id, order);
    }
  }
  return [...matches.values()];
}

async function hasActiveRedemption(couponId, hashes) {
  if (!hashes.length) return false;
  const ids = redemptionDocumentIds(couponId, hashes);
  const snapshots = await Promise.all(ids.map((id) => db.collection("couponRedemptions").doc(id).get()));
  return snapshots.some((snapshot) => snapshot.exists && snapshot.data().status === "active");
}

async function validateCouponData(couponDoc, { code, subtotal, phone, email, excludedOrderId = "" }) {
  if (!couponDoc || !couponDoc.exists) return { ok: false, status: 404, message: "كود الكوبون غير صحيح." };
  const coupon = couponDoc.data();
  const normalizedCode = asString(coupon.code).toUpperCase();
  const now = Date.now();
  const startDate = asMillis(coupon.startDate);
  const expiresAt = asMillis(coupon.expiresAt);
  const maxUses = Number(coupon.maxUses || 0);
  const usedCount = Number(coupon.usedCount || 0);
  const minOrder = Number(coupon.minOrder || 0);
  const hashes = identityHashes(phone, email);

  if (normalizedCode !== code) return { ok: false, status: 404, message: "كود الكوبون غير صحيح." };
  if (coupon.active === false) return { ok: false, status: 400, message: "الكوبون متوقف." };
  if (startDate && now < startDate) return { ok: false, status: 400, message: "الكوبون لم يبدأ بعد." };
  if (expiresAt && now > expiresAt) return { ok: false, status: 400, message: "انتهت صلاحية الكوبون." };
  if (maxUses > 0 && usedCount >= maxUses) return { ok: false, status: 409, message: "انتهت استخدامات الكوبون." };
  if (!Number.isFinite(subtotal) || subtotal < minOrder) {
    return { ok: false, status: 400, message: `الحد الأدنى للطلب هو ${minOrder} ج.م.` };
  }
  if (hashes.length && hasLegacyUsedBy(coupon, phone, email)) {
    return { ok: false, status: 409, message: "لقد استخدمت هذا الكوبون من قبل." };
  }
  if (hashes.length && await hasActiveRedemption(couponDoc.id, hashes)) {
    return { ok: false, status: 409, message: "لقد استخدمت هذا الكوبون من قبل." };
  }

  const needsOrderIdentity = coupon.firstOrderOnly === true || code === LOYALTY_CODE;
  if (needsOrderIdentity && !asString(phone) && !asString(email)) {
    return { ok: false, status: 400, message: "أدخل رقم الهاتف أو البريد الإلكتروني للتحقق من أهلية الكوبون." };
  }
  const priorOrders = needsOrderIdentity
    ? await getPriorOrders(phone, email, excludedOrderId)
    : [];
  if (coupon.firstOrderOnly === true && priorOrders.length > 0) {
    return { ok: false, status: 409, message: "هذا الكوبون مخصص لأول طلب فقط." };
  }
  if (code === LOYALTY_CODE && priorOrders.length < LOYALTY_REQUIRED_ORDERS) {
    return { ok: false, status: 409, message: "كود الولاء متاح بعد إكمال 3 طلبات مكتملة." };
  }

  return {
    ok: true,
    coupon,
    publicCoupon: couponPublicFields(couponDoc.id, coupon),
    discount: calculateCouponDiscount(coupon, subtotal),
    identityHashes: hashes,
    priorOrdersCount: priorOrders.length
  };
}

async function findCustomerRef(phone, email) {
  if (phone) {
    const byPhone = await db.collection("users").where("phone", "==", phone).limit(1).get();
    if (!byPhone.empty) return byPhone.docs[0].ref;
  }
  if (email) {
    const byEmail = await db.collection("users").where("email", "==", email).limit(1).get();
    if (!byEmail.empty) return byEmail.docs[0].ref;
  }
  const identity = phone ? `phone:${phone}` : `email:${email.toLowerCase()}`;
  const id = `customer_${sha256(identity).slice(0, 32)}`;
  return db.collection("users").doc(id);
}

/* ═══════════════════════════════════════════════════════════
   🎁 Auto Coupons
   ═══════════════════════════════════════════════════════════ */

async function ensureCoupon(code, value, type, description) {
  const existing = await db.collection("coupons").where("code", "==", code).limit(1).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    const data = doc.data();
    if (data.active === false) {
      await doc.ref.update({ active: true, updatedAt: Date.now() });
    }
    return { id: doc.id, code, value: Number(data.value || value), type: data.type || type, expiresAt: data.expiresAt || null, existed: true };
  }
  const couponRef = db.collection("coupons").doc();
  const now = Date.now();
  const expiresAt = now + (90 * 24 * 60 * 60 * 1000);
  await couponRef.set({
    code,
    type,
    value,
    active: true,
    startDate: new Date(now).toISOString().slice(0, 10),
    expiresAt,
    minOrder: 0,
    maxDiscount: null,
    maxUses: null,
    usedCount: 0,
    usedBy: [],
    firstOrderOnly: false,
    createdAt: now,
    description,
    source: "auto"
  });
  return { id: couponRef.id, code, value, type, expiresAt, existed: false };
}

async function sendCouponEmail(toEmail, customerName, couponCode, discountValue, discountType, reason) {
  const discountText = discountType === "percent" ? `${discountValue}%` : `${discountValue} ج.م`;
  const reasonText = reason === "thanks"
    ? "شكراً لأول طلب ليك معانا! 🎉"
    : "ولائك خلّص 3 طلبات معانا! 🏆";

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f6f0; padding: 20px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #d4af37; font-size: 28px; margin: 0;">🕯️ VelaLight</h1>
      </div>
      <h2 style="color: #333; font-size: 20px;">أهلاً ${htmlEscape(customerName || "عميلنا العزيز")}،</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.8;">
        ${reasonText}<br>
        استخدم الكود ده عند الشراء الجاي واطلب خصم <b style="color: #d4af37; font-size: 20px;">${discountText}</b>.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: #fff; border: 2px dashed #d4af37; border-radius: 12px; padding: 15px 30px;">
          <p style="margin: 0 0 5px 0; color: #888; font-size: 12px;">كود الخصم</p>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #d4af37; letter-spacing: 3px; font-family: monospace;">${htmlEscape(couponCode)}</p>
        </div>
      </div>
      <p style="color: #555; font-size: 14px;">⏳ الكود صالح لمدة <b>90 يوم</b> من تاريخ الإرسال.</p>
      <p style="color: #555; font-size: 14px;">🛒 اطلب دلوقتي من <a href="https://velalight.github.io" style="color: #d4af37; font-weight: bold;">velalight.github.io</a></p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">VelaLight — شموع يدوية فاخرة</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"VelaLight" <${STORE_EMAIL}>`,
    to: toEmail,
    subject: `🎁 كود خصم ${discountText} — VelaLight`,
    html
  });
}

exports.issueAutoCoupons = onDocumentUpdated(
  { document: "orders/{orderId}", region: "us-central1", timeoutSeconds: 60, memory: "256MiB" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const beforeStatus = Number(before.status || 0);
    const afterStatus = Number(after.status || 0);
    if (afterStatus !== COMPLETED_ORDER_STATUS || beforeStatus === COMPLETED_ORDER_STATUS) return;

    const phone = asString(after.phone || after.customer?.phone);
    const email = asString(after.email || after.customer?.email);
    const name = asString(after.name || after.customer?.name);

    if (!phone && !email) {
      logger.warn("Auto coupon skipped: no phone or email", { orderDocId: event.params.orderId });
      return;
    }

    try {
      const orders = db.collection("orders");
      const filters = [];
      if (phone) filters.push(orders.where("phone", "==", phone).get());
      if (email) filters.push(orders.where("email", "==", email).get());
      const snapshots = await Promise.all(filters);
      const matched = new Map();
      for (const snap of snapshots) {
        for (const d of snap.docs) {
          if (Number(d.data().status || 0) === COMPLETED_ORDER_STATUS) matched.set(d.id, d.data());
        }
      }
      const completedCount = matched.size;

      let couponInfo = null;
      let reason = "";

      if (completedCount === 1) {
        couponInfo = await ensureCoupon("THANKS10", 10, "percent", "كوبون شكر لأول طلب");
        reason = "thanks";
      }

      if (completedCount === 3) {
        couponInfo = await ensureCoupon("LOYAL15", 15, "percent", "كوبون ولاء بعد 3 طلبات");
        reason = "loyalty";
      }

      if (!couponInfo) return;

      if (email) {
        try {
          await sendCouponEmail(email, name, couponInfo.code, couponInfo.value, couponInfo.type, reason);
          logger.info("Coupon email sent", { to: email, code: couponInfo.code, reason });
        } catch (emailError) {
          logger.error("Failed to send coupon email", emailError);
        }
      } else {
        logger.info("No email found; coupon ready but not emailed", { phone, code: couponInfo.code });
      }
    } catch (error) {
      logger.error("issueAutoCoupons failed", error);
    }
  }
);

/* ═══════════════════════════════════════════════════════════
   Customer stats
   ═══════════════════════════════════════════════════════════ */

exports.syncCustomerStats = onDocumentUpdated(
  { document: "orders/{orderId}", region: "us-central1", timeoutSeconds: 60, memory: "256MiB" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;
    const beforeStatus = Number(before.status || 0);
    const afterStatus = Number(after.status || 0);
    if (beforeStatus === afterStatus) return;
    if (beforeStatus !== COMPLETED_ORDER_STATUS && afterStatus !== COMPLETED_ORDER_STATUS) return;

    const customer = after.customer || {};
    const phone = asString(after.phone || customer.phone);
    const email = asString(after.email || customer.email);
    if (!phone && !email) {
      logger.warn("Customer stats skipped: completed order has no phone or email", { orderDocId: event.params.orderId });
      return;
    }

    const customerRef = await findCustomerRef(phone, email);
    const orders = db.collection("orders");
    const byPhone = phone ? orders.where("phone", "==", phone) : null;
    const byEmail = email ? orders.where("email", "==", email) : null;

    await db.runTransaction(async (transaction) => {
      const snapshots = [];
      if (byPhone) snapshots.push(await transaction.get(byPhone));
      if (byEmail) snapshots.push(await transaction.get(byEmail));
      const customerSnapshot = await transaction.get(customerRef);
      const matched = new Map();
      for (const snapshot of snapshots) for (const orderDoc of snapshot.docs) matched.set(orderDoc.id, orderDoc.data());

      let ordersCount = 0;
      let totalSpent = 0;
      let lastOrder = 0;
      for (const order of matched.values()) {
        if (Number(order.status || 0) !== COMPLETED_ORDER_STATUS) continue;
        ordersCount += 1;
        const total = Number(order.total || 0);
        if (Number.isFinite(total) && total > 0) totalSpent += total;
        lastOrder = Math.max(lastOrder, asMillis(order.createdAt || order.orderDate));
      }

      const current = customerSnapshot.exists ? customerSnapshot.data() : {};
      const summary = {
        name: asString(after.name || customer.name || current.name),
        phone: phone || asString(current.phone),
        email: email || asString(current.email),
        city: asString(after.city || customer.city || current.city),
        address: asString(after.address || customer.address || current.address),
        ordersCount,
        totalSpent,
        lastOrder,
        updatedAt: Date.now(),
        provider: current.provider || "server-order-sync"
      };
      if (!customerSnapshot.exists) summary.createdAt = Date.now();
      transaction.set(customerRef, summary, { merge: true });
    });
    logger.info("Customer stats synchronized from completed orders", { orderDocId: event.params.orderId });
  }
);

/* ═══════════════════════════════════════════════════════════
   Loyalty status
   ═══════════════════════════════════════════════════════════ */

exports.getLoyaltyStatus = onRequest(
  { cors: COUPON_CORS, region: "us-central1", timeoutSeconds: 30, memory: "256MiB", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    const body = req.body || {};
    const phone = asString(body.phone);
    const email = asString(body.email);
    const idToken = asString(body.idToken);
    let uid = "";

    if (idToken) {
      try {
        const decoded = await getAuth().verifyIdToken(idToken);
        uid = asString(decoded.uid);
      } catch (error) {
        logger.warn("Loyalty check received an invalid auth token");
        return res.status(401).json({ message: "انتهت جلسة تسجيل الدخول؛ حدّث الصفحة وحاول مرة أخرى." });
      }
    }
    if (!uid && !phone && !email) {
      return res.status(400).json({ message: "لا توجد بيانات كافية للتحقق من أهلية الولاء." });
    }

    try {
      const orders = db.collection("orders");
      const filters = [];
      if (phone) {
        filters.push(["phone", phone], ["customer.phone", phone]);
        const digits = normalizePhone(phone);
        if (digits && digits !== phone) filters.push(["phone", digits], ["customer.phone", digits]);
      }
      if (email) {
        filters.push(["email", email], ["customer.email", email]);
        const lowerEmail = normalizeEmail(email);
        if (lowerEmail && lowerEmail !== email) filters.push(["email", lowerEmail], ["customer.email", lowerEmail]);
      }
      if (uid) filters.push(["userId", uid]);

      const snapshots = await Promise.all(filters.map(([field, value]) => orders.where(field, "==", value).get()));
      const matchingOrders = new Map();
      for (const snapshot of snapshots) {
        for (const orderDoc of snapshot.docs) {
          if (Number(orderDoc.data().status || 0) === COMPLETED_ORDER_STATUS) {
            matchingOrders.set(orderDoc.id, orderDoc.data());
          }
        }
      }
      const eligible = matchingOrders.size >= LOYALTY_REQUIRED_ORDERS;
      if (!eligible) return res.status(200).json({ eligible: false });

      const couponDoc = await findCoupon(LOYALTY_CODE);
      if (!couponDoc) {
        return res.status(200).json({ eligible: true, serverManaged: false });
      }

      const hashes = identityHashes(phone, email);
      const alreadyUsed = hashes.length ? await hasActiveRedemption(couponDoc.id, hashes) : false;

      return res.status(200).json({
        eligible: true,
        serverManaged: true,
        unlocked: !alreadyUsed,
        code: alreadyUsed ? null : LOYALTY_CODE,
        expiresAt: couponDoc.data().expiresAt || null,
        alreadyUsed
      });
    } catch (error) {
      logger.error("Loyalty status check failed", error);
      return res.status(500).json({ message: "تعذر التحقق من مكافأة الولاء حاليًا." });
    }
  }
);

/* ═══════════════════════════════════════════════════════════
   Coupon validation & redemption
   ═══════════════════════════════════════════════════════════ */

exports.validateCoupon = onRequest(
  { cors: COUPON_CORS, region: "us-central1", timeoutSeconds: 30, memory: "256MiB", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    const body = req.body || {};
    const code = asString(body.code).toUpperCase();
    const subtotal = Number(body.subtotal);
    const phone = asString(body.phone);
    const email = asString(body.email);
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return res.status(400).json({ message: "كود الكوبون غير صالح." });
    if (!Number.isFinite(subtotal) || subtotal < 0 || subtotal > 1000000) {
      return res.status(400).json({ message: "قيمة الطلب غير صالحة للتحقق من الكوبون." });
    }

    try {
      const couponDoc = await findCoupon(code);
      const result = await validateCouponData(couponDoc, { code, subtotal, phone, email });
      if (!result.ok) return res.status(result.status).json({ message: result.message });
      return res.status(200).json({ coupon: result.publicCoupon, discount: result.discount });
    } catch (error) {
      logger.error("Coupon validation failed", error);
      return res.status(500).json({ message: "تعذر التحقق من الكوبون حاليًا." });
    }
  }
);

/* ═══════════════════════════════════════════════════════════
   Secure order creation
   Prices, discounts and stock are re-checked on the server.
   ═══════════════════════════════════════════════════════════ */

exports.createOrder = onRequest(
  { cors: COUPON_CORS, region: "us-central1", timeoutSeconds: 60, memory: "512MiB", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

    try {
      await verifyAppCheckRequest(req);

      const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
      const authorization = asString(req.get("authorization"));
      const bearer = authorization.match(/^Bearer\s+(.+)$/i);
      let authenticatedUser = null;
      if (bearer) {
        try {
          authenticatedUser = await getAuth().verifyIdToken(asString(bearer[1]));
        } catch (error) {
          return res.status(401).json({ message: "انتهت جلسة تسجيل الدخول؛ سجّل الدخول مجددًا أو أعد المحاولة كزائر." });
        }
      }

      const customerInput = body.customer && typeof body.customer === "object" ? body.customer : {};
      const name = asString(customerInput.name || body.name);
      const phone = asString(customerInput.phone || body.phone);
      const phoneDigits = normalizePhone(phone);
      const email = normalizeEmail(customerInput.email || body.email || authenticatedUser?.email);
      const city = asString(customerInput.city || body.city);
      const address = asString(customerInput.address || customerInput.addr || body.address);
      const notes = asString(customerInput.notes || body.notes);

      if (name.length < 2 || name.length > 100) throw orderError(400, "اكتب الاسم كاملًا (من حرفين إلى 100 حرف).");
      if (phoneDigits.length < 10 || phoneDigits.length > 20) throw orderError(400, "رقم الهاتف غير صالح.");
      if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) throw orderError(400, "البريد الإلكتروني غير صالح.");
      if (city.length > 100 || address.length < 3 || address.length > 500 || notes.length > 1000) {
        throw orderError(400, "راجع المدينة والعنوان والملاحظات؛ توجد قيمة غير صالحة أو طويلة جدًا.");
      }

      const idempotencyKey = asString(body.idempotencyKey);
      if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) throw orderError(400, "تعذر تأكيد الطلب. حدّث السلة وحاول مرة أخرى.");
      const identityKey = authenticatedUser ? `uid:${authenticatedUser.uid}` : `phone:${phoneDigits}`;
      const idempotencyRef = db.collection("orderRequests").doc(sha256(`${identityKey}:${idempotencyKey}`));

      const existingRequest = await idempotencyRef.get();
      if (existingRequest.exists) {
        const existingData = existingRequest.data();
        const existingOrder = await db.collection("orders").doc(asString(existingData.orderDocId)).get();
        if (!existingOrder.exists) throw orderError(409, "تعذر استعادة الطلب السابق؛ تواصل مع خدمة العملاء قبل إعادة الإرسال.");
        const saved = existingOrder.data();
        return res.status(200).json({
          ok: true,
          alreadyCreated: true,
          orderDocId: existingOrder.id,
          orderId: saved.orderId,
          total: saved.total,
          productsTotal: saved.productsTotal,
          discount: saved.discount,
          qtyDiscount: saved.qtyDiscount,
          couponDiscount: saved.couponDiscount,
          appliedType: saved.appliedType
        });
      }

      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length < 1 || rawItems.length > MAX_ORDER_LINES) throw orderError(400, "السلة فارغة أو تحتوي عددًا غير صالح من الأصناف.");

      const catalogSnapshot = await db.collection("products").limit(500).get();
      if (catalogSnapshot.empty) throw orderError(503, "الكتالوج غير متاح حاليًا؛ لم يتم إنشاء الطلب.");

      const preparedItems = [];
      let giftCount = 0;
      for (const rawItem of rawItems) {
        if (!rawItem || typeof rawItem !== "object") throw orderError(400, "يوجد صنف غير صالح في السلة.");
        const productId = asString(rawItem.id || rawItem.productId);
        const quantity = Number(rawItem.qty ?? rawItem.quantity);
        const scent = asString(rawItem.scent);
        const isGift = rawItem.isGift === true;
        if (!/^[A-Za-z0-9_-]{1,120}$/.test(productId)) throw orderError(400, "معرّف أحد المنتجات غير صالح.");
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw orderError(400, "كمية أحد الأصناف غير صالحة.");

        const matches = catalogSnapshot.docs.filter((productDoc) => {
          const product = productDoc.data();
          return [productDoc.id, product.id, product.id_, product.pid, product.slug]
            .some((candidate) => asString(candidate) === productId);
        });
        if (matches.length !== 1) throw orderError(409, "تعذر التحقق من أحد المنتجات في السلة. حدّث الصفحة وحاول مرة أخرى.");
        const productDoc = matches[0];
        const product = productDoc.data();
        if (product.active === false) throw orderError(409, "أحد المنتجات لم يعد متاحًا.");

        if (isGift) {
          giftCount += 1;
          if (!FREE_GIFT_IDS.has(productId) || quantity !== 1 || giftCount > 1) throw orderError(400, "بيانات الهدية في السلة غير صالحة.");
        }

        const allowedScents = Array.isArray(product.scents) ? product.scents.map(asString).filter(Boolean) : [];
        if (!isGift && allowedScents.length > 0 && (!scent || !allowedScents.includes(scent))) {
          throw orderError(400, "اختر عطرًا متاحًا لكل منتج قبل إرسال الطلب.");
        }

        const unitPrice = isGift ? 0 : Number(product.price);
        if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 100000) throw orderError(409, "تعذر التحقق من سعر أحد المنتجات.");
        preparedItems.push({ productId, productRef: productDoc.ref, productData: product, quantity, scent: isGift ? "" : scent, isGift, unitPrice });
      }

      const productsTotal = preparedItems.reduce((sum, item) => sum + (item.isGift ? 0 : item.unitPrice * item.quantity), 0);
      if (!Number.isFinite(productsTotal) || productsTotal <= 0 || productsTotal > 100000) throw orderError(400, "إجمالي المنتجات غير صالح.");
      if (giftCount && productsTotal < FREE_GIFT_MIN_SUBTOTAL) throw orderError(400, "الهدية المجانية غير مستحقة لهذا الإجمالي.");

      let qtyDiscount = 0;
      for (const item of preparedItems) {
        if (!item.isGift && item.quantity >= 3) qtyDiscount += item.unitPrice * item.quantity * 0.05;
      }
      qtyDiscount = Math.round(qtyDiscount * 100) / 100;

      const requestedCouponCode = asString(body.couponCode).toUpperCase();
      let checkedCoupon = null;
      if (requestedCouponCode) {
        if (!/^[A-Z0-9]{3,20}$/.test(requestedCouponCode)) throw orderError(400, "كود الكوبون غير صالح.");
        const couponDoc = await findCoupon(requestedCouponCode);
        checkedCoupon = await validateCouponData(couponDoc, {
          code: requestedCouponCode,
          subtotal: productsTotal,
          phone,
          email
        });
        if (!checkedCoupon.ok) throw orderError(checkedCoupon.status, checkedCoupon.message);
      }

      const offeredCouponDiscount = checkedCoupon ? checkedCoupon.discount : 0;
      const appliedType = offeredCouponDiscount > qtyDiscount ? "coupon" : (qtyDiscount > 0 ? "qty" : "none");
      const couponDiscount = appliedType === "coupon" ? offeredCouponDiscount : 0;
      const discount = Math.max(qtyDiscount, couponDiscount);
      const total = Math.max(0, productsTotal - discount);
      const couponId = appliedType === "coupon" ? checkedCoupon.publicCoupon.id : "";
      const couponHashes = appliedType === "coupon" ? checkedCoupon.identityHashes : [];
      if (appliedType === "coupon" && couponHashes.length === 0) throw orderError(400, "أدخل رقم الهاتف أو البريد الإلكتروني لاستخدام هذا الكوبون.");

      const couponRef = couponId ? db.collection("coupons").doc(couponId) : null;
      const redemptionRefs = couponRef
        ? redemptionDocumentIds(couponId, couponHashes).map((id) => db.collection("couponRedemptions").doc(id))
        : [];
      const orderRef = db.collection("orders").doc();
      const orderId = `VL-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      const now = Date.now();
      const trackingInput = body.tracking && typeof body.tracking === "object" ? body.tracking : {};
      const tracking = {};
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid", "gclid", "ttclid"]) {
        tracking[key] = asString(trackingInput[key]).slice(0, 120);
      }

      const result = await db.runTransaction(async (transaction) => {
        const idempotencySnapshot = await transaction.get(idempotencyRef);
        if (idempotencySnapshot.exists) {
          const priorOrderRef = db.collection("orders").doc(asString(idempotencySnapshot.data().orderDocId));
          const priorOrderSnapshot = await transaction.get(priorOrderRef);
          if (!priorOrderSnapshot.exists) throw orderError(409, "تعذر استعادة الطلب السابق؛ تواصل مع خدمة العملاء.");
          const priorOrder = priorOrderSnapshot.data();
          return {
            alreadyCreated: true,
            orderDocId: priorOrderSnapshot.id,
            orderId: priorOrder.orderId,
            total: priorOrder.total,
            productsTotal: priorOrder.productsTotal,
            discount: priorOrder.discount,
            qtyDiscount: priorOrder.qtyDiscount,
            couponDiscount: priorOrder.couponDiscount,
            appliedType: priorOrder.appliedType
          };
        }

        const productRefs = [...new Map(preparedItems.map((item) => [item.productRef.path, item.productRef])).values()];
        const productSnapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
        const freshProducts = new Map();
        productSnapshots.forEach((snapshot) => {
          if (!snapshot.exists) throw orderError(409, "أحد المنتجات لم يعد متاحًا.");
          const data = snapshot.data();
          if (data.active === false) throw orderError(409, "أحد المنتجات لم يعد متاحًا.");
          freshProducts.set(snapshot.ref.path, { ref: snapshot.ref, data });
        });

        const inventoryNeeds = new Map();
        const orderItems = preparedItems.map((item) => {
          const fresh = freshProducts.get(item.productRef.path);
          if (!fresh) throw orderError(409, "تعذر التحقق من كتالوج المنتجات.");
          const data = fresh.data;
          const currentPrice = item.isGift ? 0 : Number(data.price);
          if (!Number.isFinite(currentPrice) || currentPrice !== item.unitPrice) throw orderError(409, "تغير سعر أحد المنتجات. حدّث السلة لمراجعة الإجمالي.");
          const allowedScents = Array.isArray(data.scents) ? data.scents.map(asString).filter(Boolean) : [];
          if (!item.isGift && allowedScents.length > 0 && !allowedScents.includes(item.scent)) throw orderError(409, "تغيرت العطور المتاحة لأحد المنتجات. حدّث الصفحة وحاول مرة أخرى.");

          const stockValue = data.stock;
          const stockTracked = stockValue !== undefined && stockValue !== null && stockValue !== "" && Number.isFinite(Number(stockValue));
          if (stockTracked) {
            const previous = inventoryNeeds.get(item.productRef.path) || { ref: item.productRef, quantity: 0, stock: Number(stockValue) };
            previous.quantity += item.quantity;
            inventoryNeeds.set(item.productRef.path, previous);
          }

          const lineTotal = item.unitPrice * item.quantity;
          const productName = asString(data.name || data.title || item.productId);
          return {
            id: item.productId,
            name: item.isGift ? `🎁 ${productName} — هدية` : productName,
            nameEn: asString(data.nameEn || data.en || ""),
            cat: asString(data.cat || data.category || ""),
            scent: item.scent,
            scentName: item.scent,
            quantity: item.quantity,
            qty: item.quantity,
            price: item.unitPrice,
            total: lineTotal,
            img: asString((Array.isArray(data.images) && data.images[0]) || data.img || data.image || ""),
            isGift: item.isGift
          };
        });

        for (const need of inventoryNeeds.values()) {
          if (!Number.isFinite(need.stock) || need.stock < need.quantity) throw orderError(409, "الكمية المطلوبة غير متاحة حاليًا. حدّث السلة أو تواصل معنا.");
        }

        let couponSnapshot = null;
        let redemptionSnapshots = [];
        if (couponRef) {
          couponSnapshot = await transaction.get(couponRef);
          redemptionSnapshots = await Promise.all(redemptionRefs.map((ref) => transaction.get(ref)));
          if (!couponSnapshot.exists) throw orderError(409, "الكوبون لم يعد متاحًا.");
          const freshCoupon = couponSnapshot.data();
          const freshCode = asString(freshCoupon.code).toUpperCase();
          const freshMaxUses = Number(freshCoupon.maxUses || 0);
          const freshUsedCount = Number(freshCoupon.usedCount || 0);
          const freshStart = asMillis(freshCoupon.startDate);
          const freshExpiry = asMillis(freshCoupon.expiresAt);
          if (freshCode !== requestedCouponCode || freshCoupon.active === false) throw orderError(409, "الكوبون لم يعد صالحًا.");
          if ((freshStart && Date.now() < freshStart) || (freshExpiry && Date.now() > freshExpiry)) throw orderError(409, "انتهت صلاحية الكوبون أو لم يبدأ بعد.");
          if (freshMaxUses > 0 && freshUsedCount >= freshMaxUses) throw orderError(409, "انتهت استخدامات الكوبون.");
          if (productsTotal < Number(freshCoupon.minOrder || 0)) throw orderError(409, "لم يعد إجمالي الطلب يحقق الحد الأدنى للكوبون.");
          if (hasLegacyUsedBy(freshCoupon, phone, email)) throw orderError(409, "لقد استخدمت هذا الكوبون من قبل.");
          if (Math.abs(calculateCouponDiscount(freshCoupon, productsTotal) - offeredCouponDiscount) > 1) throw orderError(409, "تغيرت قيمة الكوبون. أعد تطبيقه قبل إرسال الطلب.");
          if (redemptionSnapshots.some((snapshot) => snapshot.exists && snapshot.data().status === "active")) throw orderError(409, "لقد استخدمت هذا الكوبون من قبل.");
        }

        const inventoryReservations = [];
        for (const need of inventoryNeeds.values()) {
          const remaining = need.stock - need.quantity;
          transaction.update(need.ref, { stock: remaining, updatedAt: now });
          inventoryReservations.push({ productDocId: need.ref.id, quantity: need.quantity });
        }

        if (couponRef && couponSnapshot) {
          redemptionRefs.forEach((ref) => transaction.set(ref, {
            couponId,
            orderDocId: orderRef.id,
            status: "active",
            createdAt: now
          }));
          transaction.update(couponRef, { usedCount: Number(couponSnapshot.data().usedCount || 0) + 1, updatedAt: now });
        }

        const order = {
          orderId,
          userId: authenticatedUser ? authenticatedUser.uid : "",
          userEmail: authenticatedUser ? asString(authenticatedUser.email) : email,
          customer: { name, phone, email, city, address },
          name,
          phone,
          email,
          city,
          address,
          notes,
          products: orderItems,
          items: orderItems,
          productsTotal,
          total,
          discount,
          qtyDiscount,
          couponDiscount,
          couponCode: couponId ? requestedCouponCode : "",
          couponId,
          appliedType,
          couponValidation: couponId ? "accepted" : "",
          couponRedemptionRecorded: Boolean(couponId),
          couponRedemptionIds: couponId ? redemptionRefs.map((ref) => ref.id) : [],
          couponRedemptionReleased: false,
          paymentMethod: "WhatsApp Confirmation",
          paymentStatus: "pending",
          shippingPayment: "Cash to courier",
          shippingIncluded: productsTotal >= FREE_SHIPPING_THRESHOLD,
          status: 0,
          statusHistory: [{ status: 0, changedAt: now, changedBy: "customer" }],
          tracking,
          inventoryReservations,
          inventoryReleased: false,
          source: "website",
          createdAt: now,
          updatedAt: now,
          orderDate: new Date(now).toISOString()
        };

        transaction.create(orderRef, order);
        transaction.create(idempotencyRef, { orderDocId: orderRef.id, orderId, createdAt: now });
        return {
          alreadyCreated: false,
          orderDocId: orderRef.id,
          orderId,
          total,
          productsTotal,
          discount,
          qtyDiscount,
          couponDiscount,
          appliedType
        };
      });

      return res.status(200).json({ ok: true, ...result });
    } catch (error) {
      const status = Number(error.statusCode) || 500;
      if (status >= 500) logger.error("Secure order creation failed", error);
      return res.status(status).json({ message: status === 500 ? "تعذر حفظ الطلب حاليًا. لم يتم تأكيده؛ حاول مرة أخرى." : asString(error.message) });
    }
  }
);

exports.recordCouponUse = onRequest(
  { cors: COUPON_CORS, region: "us-central1", timeoutSeconds: 30, memory: "256MiB", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    let requester;
    try {
      await verifyAppCheckRequest(req);
      const authorization = asString(req.get("authorization"));
      const bearer = authorization.match(/^Bearer\s+(.+)$/i);
      if (!bearer) return res.status(401).json({ message: "سجّل الدخول قبل تسجيل استخدام الكوبون." });
      requester = await getAuth().verifyIdToken(asString(bearer[1]));
    } catch (error) {
      const status = Number(error.statusCode) || 401;
      return res.status(status).json({ message: "تعذر التحقق من صلاحية الطلب. سجّل الدخول وحاول مرة أخرى." });
    }
    const orderDocId = asString(req.body?.orderDocId);
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(orderDocId)) return res.status(400).json({ message: "معرف الطلب غير صالح." });

    const orderRef = db.collection("orders").doc(orderDocId);
    try {
      const orderSnapshot = await orderRef.get();
      if (!orderSnapshot.exists) return res.status(404).json({ message: "الطلب غير موجود." });
      const order = orderSnapshot.data();
      if (!order.userId || order.userId !== requester.uid) return res.status(403).json({ message: "لا تملك صلاحية تعديل هذا الطلب." });
      if (order.couponRedemptionRecorded === true) return res.status(200).json({ ok: true, alreadyRecorded: true });

      const code = asString(order.couponCode).toUpperCase();
      const couponId = asString(order.couponId);
      const phone = asString(order.phone || order.customer?.phone);
      const email = asString(order.email || order.customer?.email);
      if (!code || !couponId) return res.status(400).json({ message: "بيانات الكوبون غير موجودة في الطلب." });
      if (!phone && !email) return res.status(400).json({ message: "بيانات العميل غير كافية لتسجيل استخدام الكوبون." });
      if (Number(order.status || 0) === CANCELLED_ORDER_STATUS) return res.status(409).json({ message: "لا يمكن تسجيل كوبون لطلب ملغي." });

      const couponRef = db.collection("coupons").doc(couponId);
      const couponSnapshot = await couponRef.get();
      if (!couponSnapshot.exists) return res.status(404).json({ message: "الكوبون لم يعد موجودًا." });
      const coupon = couponSnapshot.data();
      if (asString(coupon.code).toUpperCase() !== code) return res.status(409).json({ message: "كود الكوبون لا يطابق بيانات الطلب." });

      const subtotal = Number(order.productsTotal || 0);
      const checked = await validateCouponData(couponSnapshot, {
        code,
        subtotal,
        phone,
        email,
        excludedOrderId: orderDocId
      });
      if (!checked.ok) {
        await orderRef.set({ couponValidation: "rejected", couponValidationReason: checked.message, updatedAt: Date.now() }, { merge: true });
        return res.status(checked.status).json({ message: checked.message });
      }

      const expectedDiscount = checked.discount;
      const actualDiscount = Number(order.couponDiscount || 0);
      if (!Number.isFinite(actualDiscount) || Math.abs(actualDiscount - expectedDiscount) > 1) {
        await orderRef.set({ couponValidation: "rejected", couponValidationReason: "discount_mismatch", updatedAt: Date.now() }, { merge: true });
        return res.status(409).json({ message: "قيمة الخصم في الطلب لا تطابق الكوبون، وسيحتاج الطلب إلى مراجعة." });
      }

      const hashes = checked.identityHashes;
      if (!hashes.length) return res.status(400).json({ message: "تعذر تحديد العميل لتسجيل الاستخدام." });
      const redemptionIds = redemptionDocumentIds(couponId, hashes);
      const redemptionRefs = redemptionIds.map((id) => db.collection("couponRedemptions").doc(id));
      const now = Date.now();

      await db.runTransaction(async (transaction) => {
        const [freshOrderSnapshot, freshCouponSnapshot, ...redemptionSnapshots] = await Promise.all([
          transaction.get(orderRef),
          transaction.get(couponRef),
          ...redemptionRefs.map((ref) => transaction.get(ref))
        ]);
        if (!freshOrderSnapshot.exists || !freshCouponSnapshot.exists) throw Object.assign(new Error("record_missing"), { statusCode: 404 });
        const freshOrder = freshOrderSnapshot.data();
        const freshCoupon = freshCouponSnapshot.data();
        if (freshOrder.couponRedemptionRecorded === true) return;
        if (Number(freshOrder.status || 0) === CANCELLED_ORDER_STATUS) throw Object.assign(new Error("order_cancelled"), { statusCode: 409 });
        if (asString(freshOrder.couponCode).toUpperCase() !== code) throw Object.assign(new Error("coupon_mismatch"), { statusCode: 409 });
        if (hasLegacyUsedBy(freshCoupon, phone, email)) throw Object.assign(new Error("coupon_already_used"), { statusCode: 409 });

        for (const redemptionSnapshot of redemptionSnapshots) {
          if (!redemptionSnapshot.exists) continue;
          const redemption = redemptionSnapshot.data();
          if (redemption.status === "active" && redemption.orderDocId !== orderDocId) {
            throw Object.assign(new Error("coupon_already_used"), { statusCode: 409 });
          }
        }

        const maxUses = Number(freshCoupon.maxUses || 0);
        const usedCount = Number(freshCoupon.usedCount || 0);
        if (maxUses > 0 && usedCount >= maxUses) throw Object.assign(new Error("coupon_exhausted"), { statusCode: 409 });
        if (freshCoupon.active === false) throw Object.assign(new Error("coupon_inactive"), { statusCode: 409 });

        const expiry = asMillis(freshCoupon.expiresAt);
        const start = asMillis(freshCoupon.startDate);
        if ((start && Date.now() < start) || (expiry && Date.now() > expiry)) {
          throw Object.assign(new Error("coupon_date_invalid"), { statusCode: 409 });
        }

        for (const ref of redemptionRefs) {
          transaction.set(ref, {
            couponId,
            orderDocId,
            status: "active",
            createdAt: now
          }, { merge: true });
        }
        transaction.update(couponRef, { usedCount: usedCount + 1, updatedAt: now });
        transaction.update(orderRef, {
          couponValidation: "accepted",
          couponValidationReason: "",
          couponRedemptionRecorded: true,
          couponRedemptionIds: redemptionIds,
          couponRedemptionReleased: false,
          updatedAt: now
        });
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      const status = Number(error.statusCode) || 500;
      if (status >= 500) logger.error("Coupon redemption recording failed", error);
      try {
        await orderRef.set({ couponValidation: "needs_review", couponValidationReason: asString(error.message).slice(0, 80), updatedAt: Date.now() }, { merge: true });
      } catch (writeError) {
        logger.warn("Unable to mark coupon order for review", writeError);
      }
      return res.status(status).json({ message: status === 500 ? "تعذر تسجيل استخدام الكوبون، وسيحتاج الطلب إلى مراجعة." : "تعذر اعتماد الكوبون لهذا الطلب؛ سيحتاج الطلب إلى مراجعة." });
    }
  }
);

exports.releaseCouponOnCancellation = onDocumentUpdated(
  { document: "orders/{orderId}", region: "us-central1", timeoutSeconds: 30, memory: "256MiB" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;
    if (Number(before.status || 0) === CANCELLED_ORDER_STATUS || Number(after.status || 0) !== CANCELLED_ORDER_STATUS) return;
    if (after.couponRedemptionRecorded !== true || after.couponRedemptionReleased === true) return;

    const couponId = asString(after.couponId);
    const ids = Array.isArray(after.couponRedemptionIds) ? after.couponRedemptionIds : [];
    if (!couponId || ids.length === 0) return;
    const couponRef = db.collection("coupons").doc(couponId);
    const orderRef = event.data.after.ref;
    const redemptionRefs = ids.map((id) => db.collection("couponRedemptions").doc(asString(id))).filter((ref) => ref.id);

    await db.runTransaction(async (transaction) => {
      const [orderSnapshot, couponSnapshot, ...redemptionSnapshots] = await Promise.all([
        transaction.get(orderRef), transaction.get(couponRef), ...redemptionRefs.map((ref) => transaction.get(ref))
      ]);
      if (!orderSnapshot.exists || !couponSnapshot.exists) return;
      const currentOrder = orderSnapshot.data();
      if (currentOrder.couponRedemptionReleased === true) return;
      let active = false;
      redemptionSnapshots.forEach((snapshot, index) => {
        if (snapshot.exists && snapshot.data().status === "active" && snapshot.data().orderDocId === event.params.orderId) {
          active = true;
          transaction.set(redemptionRefs[index], { status: "cancelled", cancelledAt: Date.now() }, { merge: true });
        }
      });
      if (!active) return;
      const coupon = couponSnapshot.data();
      transaction.update(couponRef, { usedCount: Math.max(0, Number(coupon.usedCount || 0) - 1), updatedAt: Date.now() });
      transaction.update(orderRef, {
        couponValidation: "cancelled",
        couponRedemptionRecorded: false,
        couponRedemptionReleased: true,
        updatedAt: Date.now()
      });
    });
  }
);

exports.releaseReservedStockOnCancellation = onDocumentUpdated(
  { document: "orders/{orderId}", region: "us-central1", timeoutSeconds: 30, memory: "256MiB" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;
    if (Number(before.status || 0) === CANCELLED_ORDER_STATUS || Number(after.status || 0) !== CANCELLED_ORDER_STATUS) return;
    if (after.inventoryReleased === true) return;

    const reservations = Array.isArray(after.inventoryReservations) ? after.inventoryReservations : [];
    const validReservations = reservations.filter((entry) =>
      entry && /^[A-Za-z0-9_-]{1,150}$/.test(asString(entry.productDocId))
      && Number.isInteger(Number(entry.quantity)) && Number(entry.quantity) > 0
    );
    if (!validReservations.length) return;

    const orderRef = event.data.after.ref;
    const productRefs = [...new Map(validReservations.map((entry) => {
      const ref = db.collection("products").doc(asString(entry.productDocId));
      return [ref.path, ref];
    })).values()];

    await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) return;
      const order = orderSnapshot.data();
      if (Number(order.status || 0) !== CANCELLED_ORDER_STATUS || order.inventoryReleased === true) return;

      const productSnapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
      const productsById = new Map(productSnapshots.map((snapshot) => [snapshot.id, snapshot]));
      const quantitiesById = new Map();
      for (const entry of validReservations) {
        const productDocId = asString(entry.productDocId);
        quantitiesById.set(productDocId, (quantitiesById.get(productDocId) || 0) + Number(entry.quantity));
      }

      for (const [productDocId, quantity] of quantitiesById) {
        const snapshot = productsById.get(productDocId);
        if (!snapshot || !snapshot.exists) continue;
        const stock = snapshot.data().stock;
        if (stock === undefined || stock === null || stock === "" || !Number.isFinite(Number(stock))) continue;
        transaction.update(snapshot.ref, { stock: Number(stock) + quantity, updatedAt: Date.now() });
      }
      transaction.update(orderRef, { inventoryReleased: true, inventoryReleasedAt: Date.now(), updatedAt: Date.now() });
    });
  }
);

/* ═══════════════════════════════════════════════════════════
   AI Chat
   ═══════════════════════════════════════════════════════════ */

exports.aiChat = onRequest(
  {
    secrets: [GEMINI_API_KEY],
    cors: COUPON_CORS,
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { contents, generationConfig } = req.body || {};
    if (!contents || !Array.isArray(contents)) return res.status(400).json({ error: "Invalid payload" });

    const key = GEMINI_API_KEY.value();
    const models = ["gemini-2.0-flash", "gemini-2.5-flash"];
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: generationConfig || { temperature: 0.7, maxOutputTokens: 500 }
          })
        });
        if (response.ok) return res.status(200).json(await response.json());
        logger.warn(`Model ${model} failed: ${response.status}`);
      } catch (error) {
        logger.error(`Error with model ${model}:`, error);
      }
    }
    return res.status(502).json({ error: "All models failed" });
  }
);
