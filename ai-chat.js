/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Smart Assistant (Fixed v2)
   إصلاح: تكرار حقل الكتابة + تحسين معالجة الأخطاء
   ═══════════════════════════════════════════════════════════ */

const GEMINI_API_KEY = "AIzaSyAWKkRA3aGtr2O32dGTOayEuCoun2jOybo";

/* ✨ نماذج بديلة لو واحد فيهم مش شغال */
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

const SYSTEM_PROMPT = `/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Smart Assistant (Dynamic Context v3)
   الميزة الجديدة: يقرأ المنتجات والأسئلة الشائعة من data.js تلقائياً
   ═══════════════════════════════════════════════════════════ */

const GEMINI_API_KEY = "AIzaSyAWKkRA3aGtr2O32dGTOayEuCoun2jOybo"; // ⚠️ تنبيه: يُفضل تقييد هذا المفتاح في Google Cloud Console

/* ✨ نماذج بديلة لضمان العمل المستمر */
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

const BASE_SYSTEM_PROMPT = `
أنت مساعد VelaLight الذكي، متجر شموع يدوية فاخرة في مصر.
مهمتك: الرد على أسئلة العملاء بالعربية بشكل ودود، مهني، ومختصر.

معلومات أساسية:
- الاسم: VelaLight (فيلا لايت)
- التخصص: شموع يدوية فاخرة بعطور مميزة
- الموقع: https://velalight.github.io
- الشحن: لكل محافظات مصر (3-7 أيام عمل)، تكلفة الشحن كاش عند الاستلام.
- الدفع: قيمة المنتجات تحول مقدمًا عبر InstaPay أو فودافون كاش.
- التغليف: فاخر ومجاني مع كل طلب.
- الاستبدال: خلال 24 ساعة من الاستلام في حالة وجود عيب مصنعي فقط.

قواعد الرد الذهبية:
1. رد بالعربي فقط (إلا لو العميل كتب بالإنجليزي).
2. كن ودوداً، استخدم emojis باعتدال، والردود مختصرة (2-4 جمل).
3. ⚠️ استخدم فقط أسماء المنتجات وأسعارها المذكورة في "معلومات المنتجات الحالية" أدناه.
4. ⚠️ إذا كان سؤال العميل موجوداً في "الأسئلة الشائعة" أدناه، استخدم تلك الإجابة بدقة.
5. لا تخترع معلومات أو أسعاراً غير موجودة.
6. لو مش عارف الإجابة، قل: "هحولك على خدمة العملاء على واتساب 📱".
`;

let chatHistory = [];
let isTyping = false;

/* ═══ دالة بناء السياق الديناميكي من data.js ═══ */
function getDynamicContext() {
    let context = "### 📦 معلومات المنتجات الحالية (استخدم هذه البيانات بدقة):\n";
    
    // التحقق من وجود متغير PRODUCTS من data.js
    if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
        PRODUCTS.forEach(p => {
            const name = p.name || "منتج";
            const price = p.price ? `${p.price} ج.م` : "سعر غير محدد";
            const scents = (p.scents && p.scents.length > 0) ? p.scents.join('، ') : "عطور متنوعة";
            const desc = p.desc || "";
            context += `- ${name} (${price}): ${scents}. ${desc}\n`;
        });
    } else {
        context += "- (جاري تحميل المنتجات... يرجى توجيه العميل للموقع)\n";
    }

    context += "\n### ❓ الأسئلة الشائعة (استخدم هذه الإجابات):\n";
    // التحقق من وجود متغير I18N من data.js
    if (typeof I18N !== 'undefined' && I18N.ar) {
        for (let i = 1; i <= 8; i++) {
            const q = I18N.ar[`faq${i}q`];
            const a = I18N.ar[`faq${i}a`];
            if (q && a) {
                context += `س: ${q}\nج: ${a}\n`;
            }
        }
    }

    return context;
}

/* ═══ إرسال لـ Gemini مع دمج السياق الديناميكي ═══ */
async function sendToGemini(userMessage) {
    // دمج البرومبت الأساسي مع البيانات الحية من الموقع
    const finalPrompt = BASE_SYSTEM_PROMPT + "\n\n" + getDynamicContext();

    const contents = [
        { role: "user", parts: [{ text: finalPrompt }] },
        { role: "model", parts: [{ text: "فهمت تماماً. سأستخدم قائمة المنتجات والأسئلة الشائعة المحدثة للرد بدقة واحترافية." }] },
        ...chatHistory.slice(-8), // الاحتفاظ بآخر 8 رسائل لتوفير الـ Tokens والحفاظ على السياق
        { role: "user", parts: [{ text: userMessage }] }
    ];

    let lastError = null;

    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig: { temperature: 0.6, maxOutputTokens: 350 } // درجة حرارة أقل لدقة أعلى في الأسعار
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) return reply;
                lastError = new Error("رد فاضي");
            } else if (response.status === 404) {
                lastError = new Error("النموذج " + model + " مش متاح");
                continue; /* جرّب النموذج التالي */
            } else {
                const errData = await response.json().catch(() => null);
                lastError = new Error(errData?.error?.message || ("HTTP " + response.status));
                break; /* الخطأ ليس في اسم النموذج، توقف */
            }
        } catch (networkError) {
            lastError = networkError;
            break;
        }
    }

    console.error("Gemini Error:", lastError);
    return translateGeminiError(lastError);
}

/* ═══ ترجمة الأخطاء لعربي واضح ═══ */
function translateGeminiError(err) {
    const msg = (err && err.message) ? err.message.toLowerCase() : "";
    if (msg.includes("api key not valid")) return "⚠️ مفتاح الـ API غير صحيح.";
    if (msg.includes("403") || msg.includes("permission_denied") || msg.includes("has not been used") || msg.includes("is disabled")) return "⚠️ خدمة Gemini مش مفعلة في المشروع. يرجى تفعيل Generative Language API من Google Cloud.";
    if (msg.includes("429") || msg.includes("quota")) return "⚠️ وصلت للحد المجاني اليوم، جربي بعد شوية.";
    if (msg.includes("failed to fetch")) return "⚠️ مشكلة في الاتصال بالإنترنت.";
    return "⚠️ معلش، فيه مشكلة مؤقتة في الاتصال. جربي تاني بعد شوية أو تواصلي معانا على واتساب. 📱";
}

/* ═══ دوال واجهة المستخدم (UI) ═══ */
function addAIChatMessage(text, who) {
    const w = document.getElementById("chatMsgs");
    if (!w) return;
    const d = document.createElement("div");
    d.className = "msg " + who;
    // تحويل الأسطر الجديدة إلى <br> لعرض أفضل
    d.innerHTML = text.replace(/\n/g, '<br>'); 
    w.appendChild(d);
    w.scrollTop = w.scrollHeight;
}

function showTypingIndicator() {
    const w = document.getElementById("chatMsgs");
    if (!w) return;
    const d = document.createElement("div");
    d.className = "msg bot";
    d.id = "typingIndicator";
    d.innerHTML = "⏳ جاري الكتابة...";
    w.appendChild(d);
    w.scrollTop = w.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
}

async function handleUserMessage(text) {
    if (!text.trim() || isTyping) return;
    isTyping = true;
    addAIChatMessage(text, "user");
    chatHistory.push({ role: "user", parts: [{ text }] });
    showTypingIndicator();
    
    const reply = await sendToGemini(text);
    
    removeTypingIndicator();
    addAIChatMessage(reply, "bot");
    chatHistory.push({ role: "model", parts: [{ text: reply }] });
    isTyping = false;
}

/* ═══ التهيئة — مع حماية من التكرار ═══ */
function initAIChat() {
    const chatQuick = document.getElementById("chatQuick");
    const chatMsgs = document.getElementById("chatMsgs");
    if (!chatQuick || !chatMsgs) return;

    /* ✨ إصلاح: لو الحقل موجود خلاص، متكررش التهيئة */
    if (document.getElementById("aiChatInput")) return;

    chatMsgs.innerHTML = "";
    chatQuick.innerHTML = "";

    addAIChatMessage("أهلاً بيكي في VelaLight! ✨ أنا مساعدك الذكي. اسأليني عن أسعار الشموع، العطور، أو طريقة الطلب. 🕯️", "bot");

    const quickQuestions = [
        "🕯️ إيه أنواع الشموع وأسعارها؟", 
        "🌸 إيه أحلى العطور المتاحة؟", 
        "🚚 الشحن والتوصيل بيكون إزاي؟", 
        "💳 طرق الدفع إيه؟",
        "🎁 عايزة اقتراح هدية"
    ];

    quickQuestions.forEach(q => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quick-btn"; // يُفضل إضافة ستايل لهذا الكلاس في CSS
        btn.textContent = q;
        btn.addEventListener("click", () => handleUserMessage(q));
        chatQuick.appendChild(btn);
    });

    const inputArea = document.createElement("div");
    inputArea.style.cssText = "display:flex;gap:.5rem;padding:.7rem;border-top:1px solid var(--line, #ddd);background:var(--panel, #fff);";
    inputArea.innerHTML = `
        <input type="text" id="aiChatInput" placeholder="اكتبي سؤالك هنا..."
               style="flex:1;padding:.6rem .9rem;border:1px solid var(--line, #ddd);border-radius:99px;font-size:.85rem;outline:none;">
        <button id="aiChatSend" style="background:linear-gradient(135deg,var(--gold,#d4af37),#b8863f);color:#fff;border:none;border-radius:50%;width:42px;height:42px;cursor:pointer;font-size:1rem;">➤</button>
    `;
    
    const chatOv = document.getElementById("chatOv");
    if (chatOv) chatOv.appendChild(inputArea);

    document.getElementById("aiChatSend").addEventListener("click", () => {
        const inp = document.getElementById("aiChatInput");
        handleUserMessage(inp.value);
        inp.value = "";
    });
    
    document.getElementById("aiChatInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const inp = document.getElementById("aiChatInput");
            handleUserMessage(inp.value);
            inp.value = "";
        }
    });
}

// تشغيل الدالة عند جاهزية الصفحة
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAIChat);
} else {
    initAIChat();
}أنت مساعد VelaLight الذكي، متجر شموع يدوية فاخرة في مصر.
مهمتك: الرد على أسئلة العملاء بالعربية بشكل ودود ومهني.

معلومات المتجر:
- الاسم: VelaLight (فيلا لايت)
- التخصص: شموع يدوية فاخرة بعطور مميزة
- الموقع: https://velalight.github.io

أنواع الشموع:
شموعنا كلها طبيعه 100% باشكال متنوعه حسب اختيارك وعطورنا تبقى طويلا

العطور المتاحة (23 عطر):
فانيلا، سينامون سبايس فانيلا، لافندر، موكا، كراميل، كاريبيان فروت، فل، ياسمين، اناناس، شيكولاتة، كوكونات، كاسيليا، بوكيت روز، ورد بلدي، تيوليب، قهوة، قهوة فانيلا، قهوة بندق، عود فانيليا، عنبر، فراولة، عود خشب صندل

الشحن والدفع:
- بنوصل لكل محافظات مصر
- قيمة المنتجات بتتحول مقدمًا عبر InstaPay
- تكلفة الشحن بتدفع كاش لمندوب الشحن عند الاستلام
- التغليف فاخر ومجاني مع كل طلب

سياسة الاستبدال:
- ضمان استبدال خلال 3 أيام من الاستلام

قواعد مهمة:
1. رد بالعربي فقط (إلا لو العميل كتب بالإنجليزي)
2. كن ودوداً ومهنياً
3. استخدم emojis باعتدال
4. لو مش عارف الإجابة، قول "هحولك على خدمة العملاء على واتساب 📱"
5. لا تتحدث في مواضيع سياسية أو دينية
6. لا تخترع معلومات غير موجودة
7. الردود مختصرة (2-4 جمل)
8. اقترح منتجات أو عطور مناسبة
`;

let chatHistory = [];
let isTyping = false;

/* ═══ إرسال لـ Gemini مع تجربة نماذج بديلة ═══ */
async function sendToGemini(userMessage) {
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "فهمت، أنا جاهز للرد على أسئلة العملاء." }] },
    ...chatHistory.slice(-10),
    { role: "user", parts: [{ text: userMessage }] }
  ];

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply;
        lastError = new Error("رد فاضي");
      } else if (response.status === 404) {
        lastError = new Error("النموذج " + model + " مش متاح");
        continue; /* جرّب النموذج الجاي */
      } else {
        const errData = await response.json().catch(() => null);
        lastError = new Error(errData?.error?.message || ("HTTP " + response.status));
        break; /* الخطأ مش في النموذج، وقف */
      }
    } catch (networkError) {
      lastError = networkError;
      break;
    }
  }

  console.error("Gemini Error:", lastError);
  return translateGeminiError(lastError);
}

/* ═══ ترجمة الأخطاء لعربي واضح ═══ */
function translateGeminiError(err) {
  const msg = (err && err.message) ? err.message : "";
  if (msg.includes("API key not valid")) return "⚠️ مفتاح الـ API غير صحيح.";
  if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("has not been used") || msg.includes("is disabled")) return "⚠️ خدمة Gemini مش مفعلة في المشروع. فعّل Generative Language API من Google Cloud.";
  if (msg.includes("429") || msg.includes("Quota")) return "⚠️ وصلت للحد المجاني، جربي بعد شوية.";
  if (msg.includes("Failed to fetch")) return "⚠️ مشكلة في الاتصال بالإنترنت.";
  return "⚠️ معلش، فيه مشكلة في الاتصال. جربي تاني بعد شوية أو تواصلي معانا على واتساب. 📱";
}

/* ═══ إضافة رسالة ═══ */
function addAIChatMessage(text, who) {
  const w = document.getElementById("chatMsgs");
  if (!w) return;
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.textContent = text;
  w.appendChild(d);
  w.scrollTop = w.scrollHeight;
}

function showTypingIndicator() {
  const w = document.getElementById("chatMsgs");
  if (!w) return;
  const d = document.createElement("div");
  d.className = "msg bot";
  d.id = "typingIndicator";
  d.innerHTML = "⏳ جاري الكتابة...";
  w.appendChild(d);
  w.scrollTop = w.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

async function handleUserMessage(text) {
  if (!text.trim() || isTyping) return;
  isTyping = true;
  addAIChatMessage(text, "user");
  chatHistory.push({ role: "user", parts: [{ text }] });
  showTypingIndicator();
  const reply = await sendToGemini(text);
  removeTypingIndicator();
  addAIChatMessage(reply, "bot");
  chatHistory.push({ role: "model", parts: [{ text: reply }] });
  isTyping = false;
}

/* ═══ التهيئة — مع حماية من التكرار ═══ */
function initAIChat() {
  const chatQuick = document.getElementById("chatQuick");
  const chatMsgs = document.getElementById("chatMsgs");
  if (!chatQuick || !chatMsgs) return;

  /* ✨ إصلاح: لو الحقل موجود خلاص، متكررش التهيئة */
  if (document.getElementById("aiChatInput")) return;

  chatMsgs.innerHTML = "";
  chatQuick.innerHTML = "";

  addAIChatMessage("أهلاً بيكي في VelaLight! ✨ أنا مساعدك الذكي. اسأليني عن أي حاجة. 🕯️", "bot");

  ["🕯️ إيه أنواع الشموع؟", "💰 الأسعار عاملة إزاي؟", "🌸 إيه أحلى العطور؟", "🚚 الشحن بيكون إزاي؟", "🎁 عايزة هدية لصاحبتي", "💳 طرق الدفع إيه؟"].forEach(q => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = q;
    btn.addEventListener("click", () => handleUserMessage(q));
    chatQuick.appendChild(btn);
  });

  const inputArea = document.createElement("div");
  inputArea.style.cssText = "display:flex;gap:.5rem;padding:.7rem;border-top:1px solid var(--line);background:var(--panel);";
  inputArea.innerHTML = `
    <input type="text" id="aiChatInput" placeholder="اكتبي سؤالك هنا..."
           style="flex:1;padding:.6rem .9rem;border:1px solid var(--line);border-radius:99px;font-size:.85rem;outline:none;">
    <button id="aiChatSend" style="background:linear-gradient(135deg,var(--gold),#b8863f);color:#fff;border:none;border-radius:50%;width:42px;height:42px;cursor:pointer;font-size:1rem;">➤</button>
  `;
  const chatOv = document.getElementById("chatOv");
  if (chatOv) chatOv.appendChild(inputArea);

  document.getElementById("aiChatSend").addEventListener("click", () => {
    const inp = document.getElementById("aiChatInput");
    handleUserMessage(inp.value);
    inp.value = "";
  });
  document.getElementById("aiChatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const inp = document.getElementById("aiChatInput");
      handleUserMessage(inp.value);
      inp.value = "";
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAIChat);
} else {
  initAIChat();
}
