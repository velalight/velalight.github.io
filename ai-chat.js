/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Smart Assistant (v3 - Fallback Only / Safe)
   ✅ لا يستخدم أي API خارجي
   ✅ لا يوجد مفتاح مكشوف
   ✅ ردود ذكية مبنية على بيانات المنتجات الحقيقية
   ✅ نفس الشكل والـ UI — بدون أي فرق بصري
   ═══════════════════════════════════════════════════════════ */

let chatHistory = [];
let isTyping = false;

/* ═══════════════════════════════════════════════════════════
   🧠 ردود ذكية مبنية على البيانات الحقيقية من ALL_PRODUCTS
   ═══════════════════════════════════════════════════════════ */

function getProducts() {
  try {
    if (window.ALL_PRODUCTS && Array.isArray(window.ALL_PRODUCTS) && window.ALL_PRODUCTS.length) {
      return window.ALL_PRODUCTS.filter(p => p && p.active !== false);
    }
  } catch (e) {}
  try {
    if (typeof ALL_PRODUCTS !== "undefined" && Array.isArray(ALL_PRODUCTS) && ALL_PRODUCTS.length) {
      return ALL_PRODUCTS.filter(p => p && p.active !== false);
    }
  } catch (e) {}
  try {
    if (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)) {
      return PRODUCTS;
    }
  } catch (e) {}
  return [];
}

function findProduct(keyword) {
  const list = getProducts();
  if (!keyword || !list.length) return null;
  const kw = String(keyword).toLowerCase().trim();
  return list.find(p => {
    const name = String(p.name || "").toLowerCase();
    const nameEn = String(p.nameEn || "").toLowerCase();
    const cat = String(p.cat || "").toLowerCase();
    return name.includes(kw) || nameEn.includes(kw) || cat === kw;
  }) || null;
}

function getCheapest() {
  const list = getProducts();
  if (!list.length) return null;
  return list.slice().sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0];
}

function getMostExpensive() {
  const list = getProducts();
  if (!list.length) return null;
  return list.slice().sort((a, b) => Number(b.price || 0) - Number(a.price || 0))[0];
}

function getAllScents() {
  const list = getProducts();
  const scents = new Set();
  list.forEach(p => {
    if (Array.isArray(p.scents)) {
      p.scents.forEach(s => s && scents.add(String(s).trim()));
    }
  });
  return [...scents];
}

function formatPrice(p) {
  if (!p || p.price === undefined) return "السعر غير محدد";
  return Number(p.price || 0) + " ج.م";
}

/* ═══════════════════════════════════════════════════════════
   🎯 الردود الذكية
   ═══════════════════════════════════════════════════════════ */

function getSmartResponse(msg) {
  const m = (msg || "").toLowerCase().trim();

  if (!m) {
    return "أهلاً بيك في VelaLight ✨ اسألني عن الأسعار، العطور، الشحن، أو أقترحلك هدية مناسبة 🕯️";
  }

  /* ═══ 1) هدايا / اقتراحات ═══ */
  if (/(هدي|هديه|هدية|اقترح|عروسه|عروسة|مناسبة|جift|gift)/.test(m)) {
    const bride = findProduct("عروسة") || findProduct("bride") || findProduct("بوكس");
    const gift = findProduct("هدية") || findProduct("مانديلا") || findProduct("mandala");

    let reply = "🎁 أفضل اقتراحاتي للهدايا:\n";
    if (bride) {
      reply += `\n👰 **${bride.name}** — ${formatPrice(bride)}\n   (أفخم بوكس عندنا، مثالي للمناسبات الكبيرة)`;
    }
    if (gift && gift !== bride) {
      reply += `\n\n🕯️ **${gift.name}** — ${formatPrice(gift)}\n   (اختيار أنيق لكل مناسبة)`;
    }
    reply += "\n\nكل الهدايا بتتغلف تغليف فاخر مجاني. تحب أعرفك تفاصيل أكتر عن أي واحدة؟";
    return reply;
  }

  /* ═══ 2) استرخاء / مساج ═══ */
  if (/(استرخاء|مساج|راحة|تعب|نوم|spa|سبا|massage|relax)/.test(m)) {
    const massage = findProduct("مساج") || findProduct("massage") || findProduct("relax");
    const lavender = findProduct("لافندر") || findProduct("lavender");

    let reply = "🧖‍♀️ للاسترخاء، أنصحك بالتالي:\n";
    if (massage) {
      reply += `\n💆 **${massage.name}** — ${formatPrice(massage)}\n   عطور: ${(massage.scents || []).slice(0, 4).join("، ") || "لافندر، ياسمين"}\n   (تُستخدم كزيت تدليك دافئ بعد إذابة الشمع)`;
    }
    if (lavender && lavender !== massage) {
      reply += `\n\n🕯️ **${lavender.name}** — ${formatPrice(lavender)}\n   (رائحة اللافندر المهدئة للاسترخاء العميق)`;
    }
    reply += "\n\nتحب أضيف أي واحدة للسلة؟";
    return reply;
  }

  /* ═══ 3) عطور ═══ */
  if (/(عطر|عطور|رائحة|ريحه|ريحة|نوتة|نوت|scent)/.test(m)) {
    const scents = getAllScents();
    if (scents.length) {
      const shown = scents.slice(0, 12);
      return `🌸 عندنا تشكيلة عطور فاخرة تضم:\n\n${shown.map(s => "• " + s).join("\n")}\n\nوكل شمعة تقدر تختار عطرها المفضل عند الإضافة للسلة. تحب عطور هادئة ولا دافئة؟`;
    }
    return "🌸 عندنا تشكيلة عطور فاخرة: عود، عنبر، فانيليا، لافندر، ياسمين، ورد، مسك أبيض. كل شمعة تقدر تختار عطرها عند الإضافة للسلة. تحب أرشحلك عطر معين؟";
  }

  /* ═══ 4) شحن / توصيل ═══ */
  if (/(شحن|توصيل|محافظ|توصيل|deliver|shipping|أسوان|أسكندرية|القاهرة|الجيزة)/.test(m)) {
    return "🚚 بنوصل لكل محافظات مصر خلال 3-7 أيام عمل.\n\n💰 تكلفة الشحن بتُدفع كاش لمندوب الشحن عند الاستلام.\n💳 قيمة المنتجات بس هي اللي بتتحول مقدمًا عبر InstaPay / فودافون كاش / أورنج كاش.\n\nتحب أضيفلك حاجة للسلة؟";
  }

  /* ═══ 5) أسعار ═══ */
  if (/(سعر|بكام|أسعار|رخيص|غالي|price|cost)/.test(m)) {
    const cheapest = getCheapest();
    const priciest = getMostExpensive();

    let reply = "💰 أسعارنا بتناسب كل الميزانيات:";
    if (cheapest) {
      reply += `\n\n• أرخص منتج: **${cheapest.name}** — ${formatPrice(cheapest)}`;
    }
    if (priciest && priciest !== cheapest) {
      reply += `\n• أعلى منتج: **${priciest.name}** — ${formatPrice(priciest)}`;
    }
    reply += "\n\n✨ كل الأسعار شاملة تغليف فاخر مجاني.\nتبحث عن ميزانية معينة؟ قولي وأنا أقترحلك الأفضل.";
    return reply;
  }

  /* ═══ 6) طلب / شراء ═══ */
  if (/(اطلب|أشتري|اشتري|كيف أطلب|شراء|order|buy)/.test(m)) {
    return "🛍️ الطلب سهل جدًا:\n\n1️⃣ اختر المنتج من صفحة التسوق\n2️⃣ اختر العطر والكمية\n3️⃣ اضغط \"أضف للسلة\"\n4️⃣ كمّل بياناتك واضغط \"إتمام الطلب\"\n\nهيتم تحويلك مباشرة على واتساب لتأكيد الطلب ✨\n\nتحب أساعدك تختار منتج معين؟";
  }

  /* ═══ 7) دفع ═══ */
  if (/(دفع|فيزا|instapay|فودافون|كاش|payment|pay)/.test(m)) {
    return "💳 طرق الدفع المتاحة:\n\n• InstaPay (تحويل بنكي)\n• فودافون كاش\n• أورنج كاش\n\n💰 قيمة المنتجات تُدفع مقدمًا، أما الشحن فبيتحدد لاحقًا ويُدفع كاش للمندوب.\n\nكل التفاصيل هتتوصلك على واتساب بعد تأكيد الطلب ✨";
  }

  /* ═══ 8) استرجاع / استبدال ═══ */
  if (/(استرجاع|استبدال|مرتجع|return|refund)/.test(m)) {
    return "📦 للأسف، نظرًا لأن منتجاتنا مصنوعة يدويًا، **مفيش استرجاع أو استبدال** بعد فتح المنتج أو استخدامه.\n\nلكن لو وصلك المنتج بعيب مصنعي أو تلف، **تواصل معنا خلال 24 ساعة** من الاستلام وهنحل المشكلة فورًا 💛";
  }

  /* ═══ 9) صناعة يدوية ═══ */
  if (/(صناعة|يدوي|خامات|شمع|soy|صويا|handmade)/.test(m)) {
    return "🕯️ كل منتجاتنا **مصنوعة يدويًا بعناية**، بخامات طبيعية 100%:\n\n• شمع صويا نقي\n• فتايل خشب وقطن آمنة\n• عطور فاخرة مستوردة\n\nكل شمعة بتُجهّز خصيصًا عند الطلب، وده اللي يخليها مميزة ✨";
  }

  /* ═══ 10) تواصل ═══ */
  if (/(تواصل|اتصال|واتس|whatsapp|contact|رقم)/.test(m)) {
    return "📱 تقدر تتواصل معنا عبر:\n\n💬 واتساب: 01223526105\n📷 انستجرام: @velaa_lighttt\n📘 فيسبوك: VelaLight\n\nفريقنا جاهز يرد على كل استفساراتك ✨";
  }

  /* ═══ 11) سلة ═══ */
  if (/(سلة|عربة|cart)/.test(m)) {
    return "🛍️ تقدر تشوف سلتك من:\n\n• زر السلة في الهيدر (فوق)\n• أو الشريط السفلي في الموبايل\n\nبعد ما تخلص، اضغط \"إتمام الطلب\" وهيتم تحويلك على واتساب لتأكيد الطلب ✨";
  }

  /* ═══ 12) عروض / خصومات ═══ */
  if (/(خصم|عرض|كوبون|تخفيض|discount|offer|coupon|sale)/.test(m)) {
    return "🏷️ عندنا عروض على مجموعات مختارة!\n\n💛 وأحسن حاجة: **كود THANKS10** لخصم 10% على طلبك الجاي (هيوصلك على واتساب بعد أول طلب).\n\nشوف قسم الخصومات على صفحة المنتجات، أو قولي أي منتج يهمك وأقولك لو عليه عرض 🎁";
  }

  /* ═══ 13) رد افتراضي ═══ */
  return "✨ يسعدني أساعدك!\n\nأقدر أجاوبك عن:\n• 💰 الأسعار والمنتجات\n• 🌸 العطور المتاحة\n• 🚚 الشحن والدفع\n• 🎁 اقتراحات الهدايا\n• 📱 التواصل معنا\n\nاسألني عن أي حاجة منهم، أو تواصل معنا مباشرة على واتساب 📱\n\n01223526105";
}

/* ═══════════════════════════════════════════════════════════
   💬 واجهة المستخدم
   ═══════════════════════════════════════════════════════════ */

function addAIChatMessage(text, who) {
  const w = document.getElementById("chatMsgs");
  if (!w) return;
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.innerHTML = String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
  w.appendChild(d);
  w.scrollTop = w.scrollHeight;
}

function showTypingIndicator() {
  const w = document.getElementById("chatMsgs");
  if (!w) return;
  const d = document.createElement("div");
  d.className = "msg bot";
  d.id = "typingIndicator";
  d.textContent = "⏳ بحضّرلك أفضل رد...";
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
  chatHistory.push({ role: "user", text: msg });
  showTypingIndicator();

  await new Promise(r => setTimeout(r, 400));

  let reply = "";
  try {
    reply = getSmartResponse(msg);
  } catch (e) {
    console.error("AI Fallback error:", e);
    reply = "⚠️ حدث خطأ بسيط، لكن أقدر أساعدك عبر واتساب: 01223526105";
  }

  removeTypingIndicator();
  addAIChatMessage(reply, "bot");
  chatHistory.push({ role: "bot", text: reply });
  isTyping = false;
}

/* ═══════════════════════════════════════════════════════════
   🚀 التهيئة
   ═══════════════════════════════════════════════════════════ */

function initAIChat() {
  const chatQuick = document.getElementById("chatQuick");
  const chatMsgs = document.getElementById("chatMsgs");
  if (!chatQuick || !chatMsgs) return;
  if (document.getElementById("aiChatInput")) return;

  chatMsgs.innerHTML = "";
  chatQuick.innerHTML = "";

  addAIChatMessage(
    "أهلاً بيك في VelaLight! ✨\nأنا مساعدك الذكي — اسألني عن الأسعار، العطور، الشحن، أو أقترحلك هدية مناسبة 🕯️",
    "bot"
  );

  const quickQuestions = [
    "🎁 اقترح لي هدية فاخرة",
    "🧖‍♀️ عايز حاجة للاسترخاء",
    "🌸 إيه العطور المتاحة؟",
    "💰 إيه أسعار الشموع؟",
    "🚚 تفاصيل الشحن والدفع",
    "👰 تفاصيل بوكس العروسة"
  ];

  quickQuestions.forEach(q => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quick-btn";
    btn.textContent = q;
    btn.style.cssText =
      "display:block;width:100%;text-align:right;padding:8px 12px;margin-bottom:6px;" +
      "background:var(--panel,#f9f9f9);border:1px solid var(--line,#ddd);" +
      "border-radius:8px;cursor:pointer;font-size:.85rem;transition:.2s;";
    btn.onmouseover = () => (btn.style.background = "#f0f0f0");
    btn.onmouseout = () => (btn.style.background = "var(--panel,#f9f9f9)");
    btn.addEventListener("click", () => handleUserMessage(q));
    chatQuick.appendChild(btn);
  });

  const inputArea = document.createElement("div");
  inputArea.style.cssText =
    "display:flex;gap:.5rem;padding:.7rem;border-top:1px solid var(--line,#ddd);" +
    "background:var(--panel,#fff);";
  inputArea.innerHTML = `
    <input type="text" id="aiChatInput" placeholder="اكتب سؤالك هنا..."
           style="flex:1;padding:.6rem .9rem;border:1px solid var(--line,#ddd);
                  border-radius:99px;font-size:.85rem;outline:none;">
    <button id="aiChatSend" aria-label="إرسال"
            style="background:linear-gradient(135deg,var(--gold,#d4af37),#b8863f);
                   color:#fff;border:none;border-radius:50%;width:42px;height:42px;
                   cursor:pointer;font-size:1rem;">➤</button>
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

  const sendBtn = document.getElementById("aiChatSend");
  if (sendBtn) sendBtn.addEventListener("click", send);

  const inputEl = document.getElementById("aiChatInput");
  if (inputEl) {
    inputEl.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        send();
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAIChat);
} else {
  initAIChat();
}
