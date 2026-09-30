/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Smart Assistant (v8 - Rich Context + Secure Proxy)
   ✅ سياق غني من كل بيانات الصفحة (منتجات + أسعار + تقييمات + FAQ + سياسات)
   ✅ استخدام Cloud Function لإخفاء مفتاح API
   ✅ Fallback ذكي يعتمد على البيانات الحقيقية
   ═══════════════════════════════════════════════════════════ */

/* 🔒 لا يوجد مفتاح مكشوف هنا. المفتاح محفوظ في Cloud Function. */
const AI_PROXY_URL = "https://us-central1-velalight.cloudfunctions.net/aiChat";
const AI_DIRECT_FALLBACK = ""; // ← اتركه فاضي (احتياطي فقط لو حبيت)

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"];

let chatHistory = [];
let isTyping = false;
let isProxyBlocked = false;

/* ═══════════════════════════════════════════════════════════
   🧠 بناء السياق الديناميكي الغني من كل بيانات الصفحة
   ═══════════════════════════════════════════════════════════ */
function getDynamicContext() {
    const parts = [];

    /* ---- 1) المنتجات مع الأسعار والعطور والوصف ---- */
    parts.push("### 📦 قائمة المنتجات الكاملة (استخدم الأسعار والأسماء بالحرف):");
    const list = (typeof window.ALL_PRODUCTS !== "undefined" && Array.isArray(window.ALL_PRODUCTS) && window.ALL_PRODUCTS.length)
        ? window.ALL_PRODUCTS
        : (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);

    if (list.length) {
        list.slice(0, 30).forEach(p => {
            const price = p.price ? `${p.price} ج.م` : "غير محدد";
            const old   = p.old && p.old > p.price ? ` (قبل الخصم: ${p.old} ج.م)` : "";
            const sc    = (p.scents && p.scents.length) ? p.scents.join("، ") : "حسب المتاح";
            const cat   = p.cat || "";
            const badge = p.badge ? ` [${p.badge}]` : "";
            const hrs   = p.hours || "";
            parts.push(`- **${p.name}**${badge} | السعر: ${price}${old} | التصنيف: ${cat} | العطور: ${sc} | ${hrs}`);
        });
    } else {
        parts.push("(لا توجد منتجات محملة بعد)");
    }

    /* ---- 2) التقييمات الفعلية ---- */
    const reviews = (typeof window.ALL_REVIEWS !== "undefined" && Array.isArray(window.ALL_REVIEWS))
        ? window.ALL_REVIEWS.filter(r => r && r.approved !== false)
        : [];
    if (reviews.length) {
        parts.push("\n### ⭐ آراء العملاء (حقيقية):");
        reviews.slice(0, 5).forEach(r => {
            const name = r.name || "عميل";
            const rating = r.rating || 5;
            const text = (r.text || r.review || "").slice(0, 120);
            if (text) parts.push(`- ${name} (${rating}⭐): "${text}"`);
        });
    }

    /* ---- 3) الأسئلة الشائعة ---- */
    parts.push("\n### ❓ الأسئلة الشائعة:");
    parts.push("- **الشحن:** لكل محافظات مصر، 3-7 أيام عمل، يُدفع كاش للمندوب عند الاستلام.");
    parts.push("- **الدفع:** InstaPay / فودافون كاش / أورنج كاش / تحويل بنكي — مقدمًا.");
    parts.push("- **التغليف:** فاخر ومجاني 100% جاهز للإهداء.");
    parts.push("- **الشمع:** صويا طبيعي 100%، فتايل خشب وقطن آمنة.");
    parts.push("- **الاستبدال:** لا يوجد بعد الفتح/الاستخدام. عيوب مصنعية: خلال 24 ساعة.");
    parts.push("- **مدة الاحتراق:** تختلف حسب الحجم (72-96 ساعة للشموع العادية).");

    /* ---- 4) معلومات التواصل ---- */
    parts.push("\n### 📞 التواصل:");
    parts.push("- WhatsApp: 201223526105");
    parts.push("- Instagram: @velaa_lighttt");
    parts.push("- Facebook: velalight");

    return parts.join("\n");
}

/* ═══════════════════════════════════════════════════════════
   🛡️ Fallback ذكي — يعتمد على البيانات الحقيقية
   ═══════════════════════════════════════════════════════════ */
function getSmartFallbackResponse(msg) {
    const m = (msg || "").toLowerCase();
    const list = (typeof window.ALL_PRODUCTS !== "undefined" && Array.isArray(window.ALL_PRODUCTS) && window.ALL_PRODUCTS.length)
        ? window.ALL_PRODUCTS
        : (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);

    const findByName = (kw) => list.find(p => p.name && p.name.includes(kw));
    const cheapest  = list.slice().sort((a,b)=>(a.price||0)-(b.price||0))[0];
    const priciest  = list.slice().sort((a,b)=>(b.price||0)-(a.price||0))[0];

    /* --- هدايا --- */
    if (/(هدي|هدية|اقترح|عروسة|مناسبة)/.test(m)) {
        const bride = findByName("عروسة") || findByName("بوكس");
        const gift  = findByName("هدية") || findByName("مانديلا");
        let reply = "🎁 أنصحك بـ ";
        if (bride) reply += `**${bride.name}** (${bride.price} ج.م) — أفخم بوكس عندنا، `;
        if (gift)  reply += `أو **${gift.name}** (${gift.price} ج.م). `;
        reply += "\nكلاهما بتغليف فاخر مجاني. تحب أقولك تفاصيل أكتر عن أيهم؟";
        return reply;
    }

    /* --- استرخاء / مساج --- */
    if (/(استرخاء|مساج|تعب|راحة|نوم)/.test(m)) {
        const msg1 = findByName("مساج");
        if (msg1) {
            return `🧖‍♀️ للاسترخاء، **${msg1.name}** هي الأنسب (${msg1.price} ج.م).\nالعطور المتاحة: ${(msg1.scents||[]).join("، ")}.\nتُستخدم كزيت تدليك دافئ بعد إذابة الشمع. تحب أضيفها للسلة؟`;
        }
    }

    /* --- عطور --- */
    if (/(عطر|عطور|رائحة|ريحة|نوتة)/.test(m)) {
        const scents = new Set();
        list.forEach(p => (p.scents||[]).forEach(s => scents.add(s)));
        const arr = [...scents].slice(0, 12);
        return `🌸 عندنا تشكيلة فاخرة: ${arr.join("، ")}.\nكل شمعة تقدر تختار عطرها عند الإضافة للسلة. تفضل عطور هادئة ولا دافئة؟`;
    }

    /* --- شحن --- */
    if (/(شحن|توصيل|محافظ|كام)/.test(m)) {
        return "🚚 نوصل لكل محافظات مصر خلال 3-7 أيام عمل.\n💵 الشحن يُدفع كاش للمندوب عند الاستلام، وقيمة المنتج تحويل مقدّم عبر InstaPay.";
    }

    /* --- أسعار --- */
    if (/(سعر|بكام|أسعار|رخيص|غالي)/.test(m)) {
        let reply = "💰 أسعارنا محدثة على الموقع:";
        if (cheapest) reply += `\n• أرخص: **${cheapest.name}** — ${cheapest.price} ج.م`;
        if (priciest && priciest !== cheapest) reply += `\n• أعلى: **${priciest.name}** — ${priciest.price} ج.م`;
        reply += "\n\nكل الأسعار شاملة تغليف فاخر مجاني. تبحث عن ميزانية معينة؟";
        return reply;
    }

    /* --- طلب / شراء --- */
    if (/(اطلب|شراء|أشتري|اشتري|كيف)/.test(m)) {
        return "🛍️ الطلب سهل جدًا:\n1) اختر المنتج من صفحة التسوق.\n2) اختر العطر والكمية.\n3) أضف للسلة وأكمل بياناتك.\n4) هيتم تأكيد الطلب عبر واتساب فورًا.\nتحب أساعدك تختار؟";
    }

    /* --- افتراضي --- */
    return "✨ يسعدني أساعدك! أقدر أجاوبك عن:\n• الأسعار والمنتجات\n• العطور المتاحة\n• الشحن والدفع\n• اقتراحات الهدايا\n\nاسألني عن أي حاجة منهم أو تواصل معنا مباشرة على واتساب 📱";
}

/* ═══════════════════════════════════════════════════════════
   📡 إرسال الطلب — عبر Cloud Function (آمن)
   ═══════════════════════════════════════════════════════════ */
async function sendToAI(userMessage) {
    if (isProxyBlocked) {
        return getSmartFallbackResponse(userMessage);
    }

    const systemPrompt = `أنت "مساعد VelaLight الذكي" — خبير شموع وعطور فاخرة في مصر.
- رد بأسلوب ودود، أنيق، مختصر (3-6 جمل).
- استخدم **الأسعار الفعلية** من السياق أدناه ولا تخترع أي رقم.
- اذكر اسم المنتج والعطور المتاحة والسعر عند الاقتراح.
- اختم بسؤال بسيط يشجع العميل.
- لو السؤال خارج نطاق المتجر، وجّه العميل بلطف للتواصل عبر واتساب.

${getDynamicContext()}`;

    const contents = [
        { role: "user",  parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "تمام، سأرد كمساعد مبيعات محترف بالأسعار الحقيقية." }] },
        ...chatHistory.slice(-6),
        { role: "user",  parts: [{ text: userMessage }] }
    ];

    const payload = {
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
    };

    /* ---- حاول Cloud Function أولاً ---- */
    if (AI_PROXY_URL) {
        try {
            const res = await fetch(AI_PROXY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
                           || data?.reply;
                if (reply) return reply;
            } else if (res.status === 403 || res.status === 429) {
                isProxyBlocked = true;
                console.warn("AI proxy blocked, using fallback");
            }
        } catch (e) {
            console.warn("AI proxy error:", e);
        }
    }

    /* ---- احتياطي: API مباشر (فقط لو المفتاح محدد) ---- */
    if (AI_DIRECT_FALLBACK) {
        for (const model of GEMINI_MODELS) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI_DIRECT_FALLBACK}`;
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const data = await res.json();
                    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (reply) return reply;
                } else if (res.status === 403) {
                    isProxyBlocked = true;
                    break;
                }
            } catch (e) { /* try next */ }
        }
    }

    return getSmartFallbackResponse(userMessage);
}

/* ═══════════════════════════════════════════════════════════
   💬 واجهة المستخدم
   ═══════════════════════════════════════════════════════════ */
function addAIChatMessage(text, who) {
    const w = document.getElementById("chatMsgs");
    if (!w) return;
    const d = document.createElement("div");
    d.className = "msg " + who;
    d.innerHTML = String(text || "").replace(/\n/g, "<br>");
    w.appendChild(d);
    w.scrollTop = w.scrollHeight;
}

function showTypingIndicator() {
    const w = document.getElementById("chatMsgs");
    if (!w) return;
    const d = document.createElement("div");
    d.className = "msg bot";
    d.id = "typingIndicator";
    d.textContent = "⏳ بحضّرلك أفضل اقتراح...";
    w.appendChild(d);
    w.scrollTop = w.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
}

async function handleUserMessage(text) {
    const msg = (text || "").trim();
    if (!msg || isTyping) return;
    isTyping = true;
    addAIChatMessage(msg, "user");
    chatHistory.push({ role: "user", parts: [{ text: msg }] });
    showTypingIndicator();

    let reply = "";
    try {
        reply = await sendToAI(msg);
    } catch (e) {
        console.error("AI error:", e);
        reply = getSmartFallbackResponse(msg);
    }

    removeTypingIndicator();
    addAIChatMessage(reply, "bot");
    chatHistory.push({ role: "model", parts: [{ text: reply }] });
    isTyping = false;
}

/* ═══════════════════════════════════════════════════════════
   🚀 التهيئة
   ═══════════════════════════════════════════════════════════ */
function initAIChat() {
    const chatQuick = document.getElementById("chatQuick");
    const chatMsgs  = document.getElementById("chatMsgs");
    if (!chatQuick || !chatMsgs) return;
    if (document.getElementById("aiChatInput")) return;

    chatMsgs.innerHTML = "";
    chatQuick.innerHTML = "";

    addAIChatMessage("أهلاً بيك في VelaLight! ✨\nأنا مساعدك الذكي — اسألني عن الأسعار، العطور، الشحن، أو اقتراحات الهدايا 🕯️", "bot");

    const quickQuestions = [
        "🎁 اقترح لي هدية فاخرة",
        "🧖‍♀️ عايز حاجة للاسترخاء",
        "🌸 إيه العطور المتاحة؟",
        "🚚 تفاصيل الشحن والدفع",
        "💰 إيه أسعار الشموع؟",
        "👰 تفاصيل بوكس العروسة"
    ];

    quickQuestions.forEach(q => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quick-btn";
        btn.textContent = q;
        btn.style.cssText = "display:block;width:100%;text-align:right;padding:8px 12px;margin-bottom:6px;background:var(--panel,#f9f9f9);border:1px solid var(--line,#ddd);border-radius:8px;cursor:pointer;font-size:.85rem;transition:.2s;";
        btn.onmouseover = () => btn.style.background = "#f0f0f0";
        btn.onmouseout  = () => btn.style.background = "var(--panel,#f9f9f9)";
        btn.addEventListener("click", () => handleUserMessage(q));
        chatQuick.appendChild(btn);
    });

    const inputArea = document.createElement("div");
    inputArea.style.cssText = "display:flex;gap:.5rem;padding:.7rem;border-top:1px solid var(--line,#ddd);background:var(--panel,#fff);";
    inputArea.innerHTML = `
        <input type="text" id="aiChatInput" placeholder="اكتب سؤالك هنا..."
               style="flex:1;padding:.6rem .9rem;border:1px solid var(--line,#ddd);border-radius:99px;font-size:.85rem;outline:none;">
        <button id="aiChatSend" aria-label="إرسال"
                style="background:linear-gradient(135deg,var(--gold,#d4af37),#b8863f);color:#fff;border:none;border-radius:50%;width:42px;height:42px;cursor:pointer;font-size:1rem;">➤</button>
    `;

    const chatOv = document.getElementById("chatOv");
    if (chatOv) chatOv.appendChild(inputArea);

    const send = () => {
        const inp = document.getElementById("aiChatInput");
        if (!inp) return;
        const v = inp.value;
        inp.value = "";
        handleUserMessage(v);
    };

    document.getElementById("aiChatSend").addEventListener("click", send);
    document.getElementById("aiChatInput").addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); send(); }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAIChat);
} else {
    initAIChat();
}
