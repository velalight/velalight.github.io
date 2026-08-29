/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Smart Assistant (v6 - Smart Fallback)
   الميزة: إذا حظر جوجل الـ API، يرد النظام بذكاء باستخدام بيانات الموقع مباشرة
   ═══════════════════════════════════════════════════════════ */

const GEMINI_API_KEY = "AIzaSyAWKkRA3aGtr2O32dGTOayEuCoun2jOybo"; 
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

const BASE_SYSTEM_PROMPT = `
أنت "مساعد فيلا لايت (VelaLight) الذكي"، خبير عطور وشموع يدوية فاخرة في مصر. 
دورك: مساعدة العميل على اختيار وشراء المنتج المناسب بأسلوب ودود، أنيق، واحترافي.

قواعد الرد:
1. اذكر دائماً (اسم المنتج + سعره + العطور المتاحة).
2. لا تقل "عندنا عطور كثيرة"، بل اذكر أمثلة: اللافندر، العود، الفانيلا، الياسمين.
3. اختم ردك بسؤال بسيط يشجع العميل (مثال: "هل تفضلين العطور الهادئة أم القوية؟").
4. الرد يجب أن يكون 3-5 جمل.
5. استخدم فقط البيانات الموجودة في "معلومات الموقع" أدناه.
`;

let chatHistory = [];
let isTyping = false;
let isApiBlocked = false; // متغير لتتبع حالة الحظر

/* ═══ دالة بناء السياق الديناميكي ═══ */
function getDynamicContext() {
    let context = "### 📦 قائمة المنتجات (استخدم هذه الأسماء والأسعار):\n";
    if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
        PRODUCTS.slice(0, 8).forEach(p => {
            context += `- ${p.name}: ${p.price} ج.م | عطور: ${p.scents ? p.scents.join('، ') : 'متنوعة'}\n`;
        });
    }
    context += "\n### ❓ معلومات عامة:\n";
    context += "- الشحن: لكل محافظات مصر (3-7 أيام)، كاش عند الاستلام.\n";
    context += "- الدفع: InstaPay أو فودافون كاش مقدماً.\n";
    context += "- التغليف: فاخر ومجاني 100%.\n";
    return context;
}

/* ═══ النظام البديل الذكي (يعمل إذا كان الـ API محظوراً) ═══ */
function getSmartFallbackResponse(msg) {
    msg = msg.toLowerCase();
    
    if (msg.includes("هدي") || msg.includes("اقترح") || msg.includes("عروسة")) {
        return "🎁 أنصحكِ بشدة بـ **بوكس العروسة** أو **شمعة المانديلا**، فهما من أكثر هدايانا طلباً لفخامتهما. هل تفضلين معرفة السعر وإضافته للسلة؟";
    }
    if (msg.includes("استرخاء") || msg.includes("مساج") || msg.includes("تعب")) {
        return "🧖‍♀️ للاسترخاء التام، شموع **المساج (Massage Candles)** هي الخيار الأمثل. تتوفر بعطور اللافندر والياسمين المهدئة. هل أشرح لكِ طريقة استخدامها؟";
    }
    if (msg.includes("عطور") || msg.includes("رائحة") || msg.includes("ريحه")) {
        return "🌸 لدينا تشكيلة فاخرة تشمل: اللافندر، العود، الفانيلا، الياسمين، والورد البلدي. هل تفضلين العطور الهادئة والمنعشة أم القوية والدافئة؟";
    }
    if (msg.includes("شحن") || msg.includes("توصيل") || msg.includes("كام الشحن")) {
        return "🚚 نوصل لجميع محافظات مصر خلال 3-7 أيام عمل. تكلفة الشحن تدفع كاش لمندوب التوصيل عند الاستلام، بينما قيمة المنتج تحول مقدماً عبر InstaPay.";
    }
    if (msg.includes("سعر") || msg.includes("بكام") || msg.includes("أسعار")) {
        return "💰 أسعارنا تبدأ من 325 ج.م (مثل شمعة المانديلا) وتصل لمجموعات فاخرة مثل الجولدن كاندل بـ 2850 ج.م. جميع الأسعار تشمل تغليفاً فاخراً ومجانياً. هل تبحثين عن فئة سعرية محددة؟";
    }
    
    // الرد الافتراضي إذا لم يفهم السؤال
    return "عذراً، نظام الذكاء الاصطناعي السحابي متوقف مؤقتاً بسبب تحديثات أمنية. لكن يسعدني مساعدتك يدوياً! يمكنك سؤالي عن: الأسعار، العطور، الشحن، أو اقتراحات الهدايا. أو يمكنك التواصل معنا مباشرة عبر واتساب 📱";
}

/* ═══ إرسال لـ Gemini ═══ */
async function sendToGemini(userMessage) {
    // إذا تم اكتشاف الحظر مسبقاً، استخدم النظام البديل فوراً لتوفير الوقت
    if (isApiBlocked) {
        return getSmartFallbackResponse(userMessage);
    }

    const finalPrompt = BASE_SYSTEM_PROMPT + "\n\n" + getDynamicContext();
    const contents = [
        { role: "user", parts: [{ text: finalPrompt }] },
        { role: "model", parts: [{ text: "فهمت، سأرد كمساعد مبيعات محترف." }] },
        ...chatHistory.slice(-4),
        { role: "user", parts: [{ text: userMessage }] }
    ];

    let lastError = null;

    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 400 } })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) return reply;
                lastError = new Error("رد فارغ");
            } else {
                const errData = await response.json().catch(() => null);
                const errMsg = errData?.error?.message || "";
                
                // 🔥 الكشف عن كلمة "blocked" وتفعيل النظام البديل
                if (errMsg.includes("blocked") || response.status === 403) {
                    isApiBlocked = true;
                    console.warn("⚠️ تم اكتشاف حظر للـ API. جاري التحويل للنظام البديل الذكي.");
                    return getSmartFallbackResponse(userMessage);
                }
                
                lastError = new Error(errMsg || ("HTTP " + response.status));
                break; 
            }
        } catch (networkError) {
            lastError = networkError;
            break;
        }
    }

    // إذا فشل لسبب آخر غير الحظر، نستخدم النظام البديل أيضاً كخطة طوارئ
    return getSmartFallbackResponse(userMessage);
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
    
    // محاكاة تأخير بسيط لجعل الرد يبدو طبيعياً حتى لو كان بديلاً
    await new Promise(r => setTimeout(r, 800)); 
    
    const reply = await sendToGemini(text);
    
    removeTypingIndicator();
    addAIChatMessage(reply, "bot");
    chatHistory.push({ role: "model", parts: [{ text: reply }] });
    isTyping = false;
}

/* ═══ التهيئة ═══ */
function initAIChat() {
    const chatQuick = document.getElementById("chatQuick");
    const chatMsgs = document.getElementById("chatMsgs");
    if (!chatQuick || !chatMsgs) return;
    if (document.getElementById("aiChatInput")) return;

    chatMsgs.innerHTML = "";
    chatQuick.innerHTML = "";

    addAIChatMessage("أهلاً بيكِ في VelaLight! ✨ أنا مساعدك الذكي. اسأليني عن أسعار الشموع، العطور، أو اقتراحات الهدايا. 🕯️", "bot");

    const quickQuestions = [
        "🎁 اقترحي لي هدية فاخرة", 
        "🧖‍♀️ عايزة حاجة للاسترخاء في البيت", 
        "🌸 إيه أحلى العطور المتاحة؟", 
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
