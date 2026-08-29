/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Smart Assistant (Pro Sales v4)
   الميزة: مساعد مبيعات ذكي، يذكر الأسعار، الأسماء، ويطرح أسئلة تفاعلية
   ═══════════════════════════════════════════════════════════ */

const GEMINI_API_KEY = "AIzaSyAWKkRA3aGtr2O32dGTOayEuCoun2jOybo"; 
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

const BASE_SYSTEM_PROMPT = `
أنت "مساعد فيلا لايت (VelaLight) الذكي"، خبير عطور وشموع يدوية فاخرة في مصر. 
دورك ليس مجرد الرد، بل "مساعدة العميل على اختيار وشراء المنتج المناسب" بأسلوب ودود، أنيق، واحترافي.

قواعد الرد الذهبية (التزم بها بدقة):
1. 🎯 التفاصيل الدقيقة: عند اقتراح منتج، اذكر دائماً (اسم المنتج + سعره + العطور المتاحة فيه).
2. 🌸 الغنى بالمعلومات: لا تقل "عندنا عطور كثيرة". بل قل: "نوفر عطوراً مثل اللافندر، العود، الفانيلا، والياسمين...".
3. 💬 التفاعل: اختم ردك بسؤال بسيط يشجع العميل على الاستمرار (مثال: "هل تفضلين العطور الهادئة أم القوية؟" أو "هل المناسبة هدية أم للاستخدام الشخصي؟").
4. 📏 الطول المثالي: الرد يجب أن يكون مفيداً وغنياً بالمعلومات (3-5 جمل)، ليس قصيراً جداً ومملاً، وليس طويلاً جداً ومملاً.
5. 🛡️ المصداقية: استخدم فقط البيانات الموجودة في "معلومات الموقع الحالية" أدناه. لا تخترع أسعاراً أو منتجات.
6. 🚨 الخروج عن المألوف: إذا لم تجد الإجابة، قل بلباقة: "سأقوم بتحويلك فوراً لخدمة العملاء على واتساب لإتمام طلبك بأفضل طريقة 📱".

معلومات الموقع الأساسية:
- الشحن: لكل محافظات مصر خلال 3-7 أيام عمل.
- الدفع: قيمة المنتجات تحول مقدمًا (InstaPay / فودافون كاش)، والشحن كاش عند الاستلام.
- التغليف: فاخر ومجاني 100% مع كل طلب.
- الاستبدال: خلال 24 ساعة من الاستلام في حالة وجود عيب مصنعي فقط.
`;

let chatHistory = [];
let isTyping = false;

/* ═══ دالة بناء السياق الديناميكي الغني من data.js ═══ */
function getDynamicContext() {
    let context = "### 📦 قائمة المنتجات الحالية (استخدم هذه الأسماء والأسعار بدقة):\n";
    
    if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
        // نأخذ أول 10 منتجات كعينة قوية للذكاء الاصطناعي لتوفير الـ Tokens مع إعطاء أمثلة دقيقة
        const sampleProducts = PRODUCTS.slice(0, 10); 
        sampleProducts.forEach(p => {
            const name = p.name || "منتج";
            const price = p.price ? `${p.price} ج.م` : "سعر غير محدد";
            const scents = (p.scents && p.scents.length > 0) ? p.scents.join('، ') : "عطور متنوعة";
            context += `- ${name}: سعره ${price}. متاح بعطور مثل: ${scents}. (${p.desc || 'منتج فاخر'})\n`;
        });
        context += "(ملاحظة: هناك منتجات أخرى في الموقع، يمكنك توجيه العميل لصفحة 'تسوق' لرؤية الكل).\n";
    } else {
        console.warn("⚠️ تحذير: متغير PRODUCTS غير موجود. تأكد من تحميل data.js قبل ai-chat.js");
        context += "- (جاري تحميل المنتجات... يرجى توجيه العميل للموقع).\n";
    }

    context += "\n### ❓ إجابات الأسئلة الشائعة (استخدم هذه المعلومات): \n";
    if (typeof I18N !== 'undefined' && I18N.ar) {
        context += `- طرق الدفع: InstaPay أو فودافون كاش مقدمًا، والشحن كاش عند الاستلام.\n`;
        context += `- مدة التجهيز والشحن: 3 إلى 7 أيام عمل لجميع المحافظات.\n`;
        context += `- خامات الشموع: شمع صويا طبيعي 100% مع فتايل خشبية أو قطنية آمنة.\n`;
        context += `- سياسة الاستبدال: خلال 24 ساعة من الاستلام في حالة وجود عيب مصنعي فقط.\n`;
    }

    return context;
}

/* ═══ إرسال لـ Gemini مع دمج السياق الديناميكي ═══ */
async function sendToGemini(userMessage) {
    const finalPrompt = BASE_SYSTEM_PROMPT + "\n\n" + getDynamicContext();

    const contents = [
        { role: "user", parts: [{ text: finalPrompt }] },
        { role: "model", parts: [{ text: "فهمت تماماً. سأعمل كمساعد مبيعات محترف لـ VelaLight، وسأذكر أسماء المنتجات، أسعارها، والعطور بدقة، وسأحرص على أن تكون ردودي مفيدة وجذابة." }] },
        ...chatHistory.slice(-6), // الاحتفاظ بآخر 6 رسائل للحفاظ على سياق المحادثة دون استهلاك Tokens كثيرة
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
                    generationConfig: { 
                        temperature: 0.7, // رفعنا الحرارة قليلاً لجعل الردود أكثر طبيعية وجاذبية
                        maxOutputTokens: 400 // السماح بردود أطول وأكثر تفصيلاً
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) return reply;
                lastError = new Error("رد فاضي");
            } else if (response.status === 404) {
                continue; 
            } else {
                const errData = await response.json().catch(() => null);
                lastError = new Error(errData?.error?.message || ("HTTP " + response.status));
                break; 
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
    // تحويل الأسطر الجديدة إلى <br> لعرض أفضل، وتحويل الروابط أو الأسماء بشكل أنيق
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
    d.innerHTML = "⏳ جاري تحضير أفضل اقتراح لكِ...";
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

    if (document.getElementById("aiChatInput")) return;

    chatMsgs.innerHTML = "";
    chatQuick.innerHTML = "";

    addAIChatMessage("أهلاً بيكِ في VelaLight! ✨ أنا مساعدك الذكي. اسأليني عن أسعار الشموع، العطور، أو اقتراحات الهدايا، وسأسعد جداً بمساعدتك في اختيار الأنسب لكِ. 🕯️", "bot");

    const quickQuestions = [
        "🎁 اقترحي لي هدية فاخرة", 
        "🧖‍♀️ عايزة حاجة للاسترخاء في البيت", 
        "🌸 إيه أحلى العطور المتاحة عندكم؟", 
        "🚚 إزاي الطلب والشحن؟", 
        "👰 عايزة أعرف تفاصيل بوكس العروسة"
    ];

    quickQuestions.forEach(q => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quick-btn"; 
        btn.textContent = q;
        btn.style.cssText = "display:block; width:100%; text-align:right; padding:8px 12px; margin-bottom:6px; background:var(--panel, #f9f9f9); border:1px solid var(--line, #ddd); border-radius:8px; cursor:pointer; font-size:0.85rem; transition:0.2s;";
        btn.onmouseover = () => btn.style.background = "#f0f0f0";
        btn.onmouseout = () => btn.style.background = "var(--panel, #f9f9f9)";
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

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAIChat);
} else {
    initAIChat();
}
