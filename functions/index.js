/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Chat Cloud Function (Proxy لـ Gemini)
   + مزامنة آمنة لإحصاءات العملاء بعد اكتمال الطلب
   ═══════════════════════════════════════════════════════════ */

const crypto = require("node:crypto");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const COMPLETED_ORDER_STATUS = 5; // مطابق لخيار "مكتمل" في لوحة الإدارة

function asString(value) {
  return String(value == null ? "" : value).trim();
}

function asMillis(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value.toMillis === "function") return value.toMillis();
  if (value && typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
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

  // معرّف غير كاشف للهاتف أو البريد، ثابت لتجنب إنشاء سجل جديد لكل طلب.
  const identity = phone ? `phone:${phone}` : `email:${email.toLowerCase()}`;
  const id = `customer_${crypto.createHash("sha256").update(identity).digest("hex").slice(0, 32)}`;
  return db.collection("users").doc(id);
}

/**
 * لا نثق بعدّادات أو إجماليات يرسلها المتصفح.
 * نعيد حسابها من الطلبات التي أكّد المدير اكتمالها (status = 5) فقط.
 * كتابة Admin SDK تتجاوز قواعد العميل، لذلك تبقى مجموعة users مقفلة للمدير.
 */
exports.syncCustomerStats = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB"
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const beforeStatus = Number(before.status || 0);
    const afterStatus = Number(after.status || 0);

    // لا نعمل إلا عند دخول الطلب إلى حالة مكتمل أو خروجه منها.
    if (beforeStatus === afterStatus) return;
    if (beforeStatus !== COMPLETED_ORDER_STATUS && afterStatus !== COMPLETED_ORDER_STATUS) return;

    const customer = after.customer || {};
    const phone = asString(after.phone || customer.phone);
    const email = asString(after.email || customer.email);
    if (!phone && !email) {
      logger.warn("Customer stats skipped: completed order has no phone or email", {
        orderDocId: event.params.orderId
      });
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
      for (const snapshot of snapshots) {
        for (const orderDoc of snapshot.docs) matched.set(orderDoc.id, orderDoc.data());
      }

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

      const currentCustomer = customerSnapshot.exists ? customerSnapshot.data() : {};
      const latestCustomer = {
        name: asString(after.name || customer.name || currentCustomer.name),
        phone: phone || asString(currentCustomer.phone),
        email: email || asString(currentCustomer.email),
        city: asString(after.city || customer.city || currentCustomer.city),
        address: asString(after.address || customer.address || currentCustomer.address),
        ordersCount,
        totalSpent,
        lastOrder,
        updatedAt: Date.now(),
        provider: currentCustomer.provider || "server-order-sync"
      };

      if (!customerSnapshot.exists) latestCustomer.createdAt = Date.now();
      transaction.set(customerRef, latestCustomer, { merge: true });
    });

    logger.info("Customer stats synchronized from completed orders", {
      orderDocId: event.params.orderId
    });
  }
);

// مساعد المحادثة الحالي — أبقيناه كما هو.
exports.aiChat = onRequest(
  {
    secrets: [GEMINI_API_KEY],
    cors: [
      "https://velalight.github.io",
      "https://velalight.firebaseapp.com",
      /localhost/
    ],
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { contents, generationConfig } = req.body || {};
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const key = GEMINI_API_KEY.value();
    const models = ["gemini-2.0-flash", "gemini-2.5-flash"];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: generationConfig || { temperature: 0.7, maxOutputTokens: 500 }
          })
        });

        if (r.ok) {
          const data = await r.json();
          return res.status(200).json(data);
        }

        logger.warn(`Model ${model} failed: ${r.status}`);
      } catch (e) {
        logger.error(`Error with ${model}:`, e);
      }
    }

    return res.status(502).json({ error: "All models failed" });
  }
);
