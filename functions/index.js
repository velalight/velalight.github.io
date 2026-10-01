/* ═══════════════════════════════════════════════════════════
   VelaLight — Firebase Cloud Functions
   AI Chat + customer stats + secure coupon validation/redemption
   ═══════════════════════════════════════════════════════════ */

const crypto = require("node:crypto");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const COMPLETED_ORDER_STATUS = 5; // "مكتمل" في لوحة الإدارة
const CANCELLED_ORDER_STATUS = 4;
const LOYALTY_CODE = "LOYAL15";
const LOYALTY_REQUIRED_ORDERS = 3;
const COUPON_CORS = [
  "https://velalight.github.io",
  "https://velalight.firebaseapp.com",
  /localhost/
];

function asString(value) {
  return String(value == null ? "" : value).trim();
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
      if (Number(order.status || 0) !== CANCELLED_ORDER_STATUS) matches.set(doc.id, order);
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
    return { ok: false, status: 409, message: "كود الولاء متاح بعد إكمال 3 طلبات غير ملغاة." };
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

// يحسب إحصاءات العملاء من الطلبات التي أكملها المدير فقط (status = 5).
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

// يعرض بيانات كوبون آمنة فقط؛ لا يعيد usedBy أو أي بيانات تخص عملاء آخرين.
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

// يثبت استخدام الكوبون بعد إنشاء الطلب؛ سجل الاستخدام ومعرفات العملاء المشتقة مخفية عن الزوار.
exports.recordCouponUse = onRequest(
  { cors: COUPON_CORS, region: "us-central1", timeoutSeconds: 30, memory: "256MiB", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    const orderDocId = asString(req.body?.orderDocId);
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(orderDocId)) return res.status(400).json({ message: "معرف الطلب غير صالح." });

    const orderRef = db.collection("orders").doc(orderDocId);
    try {
      const orderSnapshot = await orderRef.get();
      if (!orderSnapshot.exists) return res.status(404).json({ message: "الطلب غير موجود." });
      const order = orderSnapshot.data();
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

// إعادة إتاحة الكوبون عند إلغاء طلب سبق تسجيل استخدامه.
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

// مساعد المحادثة الحالي — أبقيناه كما هو.
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
