/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Smart Assistant (Powered by Gemini)
   ═══════════════════════════════════════════════════════════ */

/* ⚠️⚠️⚠️ مهم جداً: حط الـ API Key بتاعك هنا بين علامتين التنصيص */
const GEMINI_API_KEY = "AIzaSyAWKkRA3aGtr2O32dGTOayEuCoun2jOybo";
/* مثال: const GEMINI_API_KEY = "AIzaSyB3xK9mNpQ7rT2wY5uZ8vA1bC4dE6fG9hI"; */

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/* ═══════ معلومات الموقع (Knowledge Base) ═══════ */
const SYSTEM_PROMPT = `
أنت مساعد VelaLight الذكي، متجر شموع يدوية فاخرة في مصر.

مهمتك: الرد على أسئلة العملاء بالعربية بشكل ودود ومهني.

معلومات المتجر:
- الاسم: VelaLight (فيلا لايت)
- التخصص: شموع يدوية فاخرة بعطور مميزة
- الموقع: https://velalight.github.io

أنواع الشموع:
1. شموع خشبية - تبدأ من 150 جنيه
2. شموع زجاجية - تبدأ من 120 جنيه
3. شموع كريستالية - تبدأ من 200 جنيه
4. شموع معدنية - تبدأ من 180 جنيه
5. شموع المساج - تبدأ من 250 جنيه
6. بوكسات الهدايا - تبدأ من 350 جنيه
7. بوكس العروسة - يبدأ من 500 جنيه

العطور المتاحة (23 عطر):
فانيلا، سينامون سبايس فانيلا، لافندر، موكا، كراميل، كاريبيان فروت، فل، ياسمين، اناناس، شيكولاتة، كوكونات، كاسيليا، بوكيت روز، ورد بلدي، تيوليب، قهوة، قهوة فانيلا، قهوة بندق، عود فانيليا، عنبر، فراولة، عود خشب صندل

الشحن والدفع:
- بنوصل لكل محافظات مصر
- قيمة المنتجات بتتحول مقدمًا عبر InstaPay
- تكلفة الشحن بتدفع كاش لمندوب الشحن عند الاستلام
- التغليف فاخر ومجاني مع كل طلب

سياسة الاستبدال:
- ضمان استبدال خلال 3 أيام من الاستلام
- لو المنتج وصل تالف أو مختلف عن المطلوب

قواعد مهمة:
1. رد بالعربي فقط (إلا لو العميل كتب بالإنجليزي)
2. كن ودوداً ومهنياً
3. استخدم emojis باعتدال
4. لو مش عارف الإجابة، قول "هحولك على خدمة العملاء على واتساب 📱"
5. لا تتحدث في مواضيع سياسية أو دينية أو خارج نطاق المتجر
6. لا تخترع معلومات غير موجودة في البيانات فوق
7. الردود تكون مختصرة (2-4 جمل)
8. اقترح منتجات أو عطور مناسبة حسب سؤال العميل
9. لو العميل سأل عن أسعار محددة، استخدم النطاقات المذكورة
`;

let chatHistory = [];
let isTyping = false;

/* ═══════ إرسال رسالة لـ Gemini ═══════ */
async function sendToGemini(userMessage) {
  try {
    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "فهمت، أنا جاهز للرد على أسئلة العملاء." }] },
      ...chatHistory.slice(-10),
      { role: "user", parts: [{ text: userMessage }] }
    ];

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        }
      })
    });

    if (!response.ok) {
      throw new Error("API Error: " + response.status);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      || "معلش، حصل خطأ. جربي تاني. 🙏";

    return reply;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "⚠️ معلش، فيه مشكلة في الاتصال. جربي تاني بعد شوية أو تواصلي معانا على واتساب. 📱";
  }
}

/* ═══════ إضافة رسالة للـ Chat ═══════ */
function addAIChatMessage(text, who) {
  const w = document.getElementById("chatMsgs");
  if (!w) return;

  const d = document.createElement("div");
  d.className = "msg " + who;
  d.textContent = text;
  w.appendChild(d);
  w.scrollTop = w.scrollHeight;
}

/* ═══════ مؤشر الكتابة ═══════ */
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

/* ═══════ معالجة رسالة المستخدم ═══════ */
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

/* ═══════ استبدال الـ Chat القديم بالجديد ═══════ */
function initAIChat() {
  const chatQuick = document.getElementById("chatQuick");
  const chatMsgs = document.getElementById("chatMsgs");

  if (!chatQuick || !chatMsgs) {
    console.warn("Chat elements not found");
    return;
  }

  /* مسح الرسائل القديمة والـ quick buttons */
  chatMsgs.innerHTML = "";
  chatQuick.innerHTML = "";

  /* رسالة ترحيب */
  addAIChatMessage("أهلاً بيكي في VelaLight! ✨ أنا مساعدك الذكي. اسأليني عن أي حاجة: المنتجات، الأسعار، العطور، الشحن، أو أي استفسار تاني. 🕯️", "bot");

  /* أزرار سريعة ذكية */
  const quickButtons = [
    "🕯️ إيه أنواع الشموع؟",
    "💰 الأسعار عاملة إزاي؟",
    "🌸 إيه أحلى العطور؟",
    "🚚 الشحن بيكون إزاي؟",
    "🎁 عايزة هدية لصاحبتي",
    "💳 طرق الدفع إيه؟"
  ];

  quickButtons.forEach(q => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = q;
    btn.addEventListener("click", () => handleUserMessage(q));
    chatQuick.appendChild(btn);
  });

  /* إضافة حقل كتابة */
  const inputArea = document.createElement("div");
  inputArea.style.cssText = "display:flex;gap:.5rem;padding:.7rem;border-top:1px solid var(--line);background:var(--panel);";
  inputArea.innerHTML = `
    <input type="text" id="aiChatInput" placeholder="اكتبي سؤالك هنا..." 
           style="flex:1;padding:.6rem .9rem;border:1px solid var(--line);border-radius:99px;font-size:.85rem;outline:none;">
    <button id="aiChatSend" style="background:linear-gradient(135deg,var(--gold),#b8863f);color:#fff;border:none;border-radius:50%;width:42px;height:42px;cursor:pointer;font-size:1rem;">➤</button>
  `;

  const chatOv = document.getElementById("chatOv");
  if (chatOv) chatOv.appendChild(inputArea);

  /* ربط الأحداث */
  const input = document.getElementById("aiChatInput");
  const sendBtn = document.getElementById("aiChatSend");

  sendBtn.addEventListener("click", () => {
    handleUserMessage(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleUserMessage(input.value);
      input.value = "";
    }
  });
}

/* ═══════ بدء التشغيل ═══════ */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAIChat);
} else {
  initAIChat();
}

/* إعادة التهيئة لو الـ chat اتفتح بعد تغيير اللغة */
window.addEventListener("vl-auth-change", () => {
  setTimeout(initAIChat, 500);
});
