/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Smart Assistant (Pro Sales v5 - Debug Mode)
   الميزة: يظهر سبب الخطأ الحقيقي على الشاشة، ويذكر الأسعار والأسماء بدقة
   ═══════════════════════════════════════════════════════════ */

const GEMINI_API_KEY = "AIzaSyAWKkRA3aGtr2O32dGTOayEuCoun2jOybo"; 
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

const BASE_SYSTEM_PROMPT = `
أنت "مساعد فيلا لايت (VelaLight) الذكي"، خبير عطور وشموع يدوية فاخرة في مصر. 
دورك ليس مجرد الرد، بل "مساعدة العميل على اختيار وشراء المنتج المناسب" بأسلوب ودود، أنيق، واحترافي.

قواعد الرد الذهبية (التزم بها بدقة):
1. 🎯 التفاصيل الدقيقة: عند اقتراح منتج، اذكر دائماً (اسم المنتج + سعره + العطور المتاحة فيه).
2. 🌸 الغنى بالمعلومات: لا تقل "عندنا عطور كثيرة". بل قل: "نوفر عطوراً مثل اللافندر، العود، الفانيلا، والياسمين...".
3. 💬 التفاعل: اختم ردك بسؤال بسيط يشجع العميل على الاستمرار (مثال: "هل تفضلين العطور الهادئة أم القوية؟").
4. 📏 الطول المثالي: الرد يجب أن يكون مفيداً وغنياً بالمعلومات (3-5 جمل).
5. 🛡️ المصداقية: استخدم فقط البيانات الموجودة في "معلومات الموقع الحالية" أدناه. لا تخترع أسعاراً أو منتجات.
6. 🚨 الخروج عن المألوف: إذا لم تجد الإجابة، قل بلباقة: "سأقوم بتحويلك فوراً لخدمة العملاء على واتساب لإتمام طلبك 📱".

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
        const sampleProducts = PRODUCTS.slice(0, 10); 
        sampleProducts.forEach(p => {
            const name = p.name || "منتج";
            const price = p.price ? `${p.price} ج.م` : "سعر غير محدد";
            const scents = (p.scents && p.scents.length > 0) ? p.scents.join('، ') : "عطور متنوعة";
            context += `- ${name}: سعره ${price}. متاح بعطور مثل: ${scents}. (${p.desc || 'منتج فاخر'})\n`;
        });
        context += "(ملاحظة: هناك منتجات أخرى في الموقع، يمكنك توجيه العميل لصفحة 'تسوق' لرؤية الكل).\n";
    } else {
        // هذا التنبيه سيظهر للذكاء الاصطناعي ليعرف أن هناك مشكلة في تحميل البيانات
        context += "⚠️ تنبيه هام: متغير PRODUCTS غير موجود. لم يتم تحميل ملف data.js بشكل صحيح. أخبر العميل بذلك بلباقة.\n";
    }

    context += "\n### ❓ إجابات الأسئلة الشائعة (استخدم هذه المعلومات): \n";
    if (typeof I18N !== 'undefined' && I18N.ar) {
        context += `- طرق الدفع: InstaPay أو فودافون كاش مقدمًا، والشحن كاش عند الاستلام.\n`;
        context += `- مدة التجهيز والشحن: 3 إلى 7 أيام عمل لجميع المحافظات.\n`;
        context += `- خامات الشموع: شمع صويا طبيعي 100% مع فتايل خشبية أو قطنية آمنة.\n`;
        context += `- سياسة الاستبدال: خلال 24 ساعة من الاستلام في حالة وجود عيب مصنعي فقط.\n`;
    } else {
        context += "⚠️ تنبيه هام: متغير I18N غير موجود. لم يتم تحميل ملف data.js بشكل صحيح.\n";
    }

    return context;
}

/* ═══ إرسال لـ Gemini مع دمج السياق الديناميكي ═══ */
async function sendToGemini(userMessage) {
    const finalPrompt = BASE_SYSTEM_PROMPT + "\n\n" + getDynamicContext();

    const contents = [
        { role: "user", parts: [{ text: finalPrompt }] },
        { role: "model", parts: [{ text: "فهمت تماماً. سأعمل كمساعد مبيعات محترف، وسأذكر أسماء المنتجات، أسعارها، والعطور بدقة." }] },
        ...chatHistory.slice(-6), 
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
                        temperature: 0.7, 
                        maxOutputTokens: 400 
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) return reply;
                lastError = new Error("الذكاء الاصطناعي أرجع رداً فارغاً");
            } else if (response.status === 404) {
                continue; 
            } else {
                const errData = await response.json().catch(() => null);
                lastError = new Error(errData?.error?.message || ("خطأ في الخادم: HTTP " + response.status));
                break; 
            }
        } catch (networkError) {
            lastError = networkError;
            break;
        }
    }

    // إرجاع رسالة الخطأ الحقيقية ليتم عرضها على الشاشة
    return translateGeminiError(lastError);
}

/* ═══ ترجمة الأخطاء وعرضها بوضوح على الشاشة للمساعدة في التشخيص ═══ */
function translateGeminiError(err) {
    const rawMessage = (err && err.message) ? err.message : String(err);
    
    // هذه الرسالة ستظهر مباشرة في الشات لتعرف السبب الحقيقي
    return `⚠️ حدث خطأ تقني يمنع الذكاء الاصطناعي من الرد: \n\n"${rawMessage}"\n\n💡 حل سريع: تأكد من أن ملف <script src="data.js"><\/script> مكتوب في index.html قبل ملف ai-chat.js.`;
}

/* ═══ دوال واجهة المستخدم (UI) ═══ */
function addAIChatMessage(text, who) {
    const w = document.getElementById("chatMsgs");
    if (!w) return;
    const d = document.createElement("div");
    d.className = "msg " + who;
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

    addAIChatMessage("أهلاً بيكِ في VelaLight! ✨ أنا مساعدك الذكي. اسأليني عن أسعار الشموع، العطور، أو اقتراحات الهدايا، وسأسعد جداً بمساعدتك. 🕯️", "bot");

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
