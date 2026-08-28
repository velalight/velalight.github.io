(function(){
"use strict";

// ☢️ تنظيف ذاتي آمن: إلغاء تسجيل أي Service Worker قديم عالق ومسح الكاش التالف
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
  
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   ✨ FIX: Global Image Error Handler (يمنع اختفاء المنتجات)
   ═══════════════════════════════════════════════════════════ */
window.handleImageError = function(imgElement, productId) {
  if (!imgElement) return;
  if (imgElement.dataset.fallback === "true") return; 
  
  console.warn(`⚠️ Image failed to load for product: ${productId}. Applying fallback.`);
  imgElement.dataset.fallback = "true";
  
  const products = (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);
  const p = products.find(x => x.id === productId);
  
  if (p && typeof ph === "function") {
    imgElement.src = ph(p);
  } else {
    imgElement.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='%23f5efe5' width='400' height='400'/><text x='200' y='200' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-size='24' fill='%23d9ab5f'>✦</text></svg>";
  }
};

/* ═══════════════════════════════════════════════════════════
   ✨ TRACKING DATA CAPTURE (UTM & Click IDs)
   ═══════════════════════════════════════════════════════════ */
function captureTrackingData() {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'gclid', 'ttclid'];
  const trackingData = {};
  
  keys.forEach(key => {
    const val = params.get(key) || localStorage.getItem('vl_' + key) || '';
    trackingData[key] = val;
    if (val) localStorage.setItem('vl_' + key, val);
  });
  return trackingData;
}
const sessionTracking = captureTrackingData();

/* ═══════════════════════════════════════════════════════════
   ✨ WISHLIST — مع Cache للأداء
   ═══════════════════════════════════════════════════════════ */
const WISHLIST_KEY = "vl_wishlist";
let wishlistCache = null;

function getWishlist() {
  if (wishlistCache !== null) return wishlistCache;
  try {
    wishlistCache = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    if (!Array.isArray(wishlistCache)) wishlistCache = [];
  } catch(e) {
    wishlistCache = [];
  }
  return wishlistCache;
}

function saveWishlist(list) {
  wishlistCache = list;
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  } catch(e) {
    console.warn("⚠️ Failed to save wishlist:", e);
  }
}

function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  let added;
  if (idx === -1) {
    list.push(productId);
    added = true;
    toast("❤️ تمت الإضافة للمفضلة");
  } else {
    list.splice(idx, 1);
    added = false;
    toast("💔 تمت الإزالة من المفضلة");
  }
  saveWishlist(list);
  renderProducts();
  if (typeof renderWishlistPage === "function") renderWishlistPage();
  return added;
}

function isInWishlist(productId) {
  return getWishlist().includes(productId);
}

/* ═══ QUICK ADD STATE ═══ */
let quickAddProduct=null;
let quickAddScent="";
let quickAddQty=1;
let quickAddMaxStock=99;
let productGridClickBound=false;

/* ═══ PERFORMANCE OPTIMIZATIONS ═══ */
const requestIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
const cancelIdle = window.cancelIdleCallback || clearTimeout;

function debounce(fn, ms=300){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

/* ═══ VELA SCENTS ═══ */
const VELA_SCENTS=[
["فانيلا","Vanilla"],
["سينامون سبايس فانيلا","Cinnamon Spice Vanilla"],
["لافندر","Lavender"],
["موكا","Mocha"],
["كراميل","Caramel"],
["كاريبيان فروت","Caribbean Fruit"],
["فل","Jasmine Sambac"],
["ياسمين","Jasmine"],
["اناناس","Pineapple"],
["شيكولاتة","Chocolate"],
["كوكونات","Coconut"],
["كاسيليا","Cassilia — Massage"],
["اينتو زانايت","Into Zanaite — Massage"],
["بوكيت روز","Bouquet Rose"],
["ورد بلدى","Egyptian Rose"],
["تيوليب","Tulip"],
["قهوة","Coffee"],
["قهوة فانيلا","Vanilla Coffee"],
["قهوة بندق","Hazelnut Coffee"],
["عود فانيليا","Vanilla Oud"],
["عنبر","Amber"],
["فراولة","Strawberry"],
["عود خشب صندل","Sandalwood Oud"]
];

const velaScentTr=name=>{
  const f=VELA_SCENTS.find(s=>s[0]===name||s[1]===name);
  return f?(LANG==="en"?f[1]:f[0]):(name||"");
};

/* ═══ FILL MISSING TRANSLATIONS ═══ */
(function fillMissingI18n(){
  if(typeof I18N==="undefined") return;

  const add = {

    /* ═══════════════════════════════════════
       🇪🇬 ARABIC
       ═══════════════════════════════════════ */
    ar: {
/* ═══ Reviews Page (reviews.html) ═══ */
reviews_back: "← الرجوع للرئيسية",
reviews_stats_trust: "ثقة تتجدد",
reviews_quote: "مش مجرد شمعة… دي لحظة بتتعاش!",
reviews_quote_author: "— واحدة من عملائنا",
reviews_cta_title: "جاهزة تنضمي لعائلة VelaLight؟ 🕯️",
reviews_cta_sub: "اختاري شمعتك الفاخرة واصنعي لحظتك الخاصة",
reviews_cta_btn: "تسوقي الآن 🛍️",
foot_wishlist: "❤️ المفضلة",
foot_orders: "📦 طلباتي",
      
      /* Shipping & Payment */
      ship_note:
        "🚚 الشحن: يُدفع كاش لمندوب الشحن عند الاستلام.",

      pay_products_note:
        "💳 سيتم إرسال تفاصيل الدفع المتاحة (InstaPay / فودافون كاش / تحويل بنكي) عبر الواتساب فور تأكيد الطلب.",

      pay_title:
        "الدفع عبر InstaPay",

      paymethod_d:
        "قيمة المنتجات تُدفع مقدماً عند تأكيد الطلب.",


      /* Scent */
      t_scentwarn:
        "⚠️ من فضلك اختاري العطر أولاً.",

      quick_add_scent:
        "🌸 اختاري العطر",

      quick_add_qty:
        "الكمية",

      quick_add_add:
        "🛍️ أضيفي للسلة",

      quick_add_added:
        "✓ تمت الإضافة للسلة",

      scent_req:
        "مطلوب",


      /* Handmade */
      handmade_note:
        "قطعة يدوية تُجهّز بعناية عند الطلب — كل شمعة فريدة ومميزة",

      pd_handmade_note:
        "قطعة يدوية تُجهّز بعناية عند الطلب — كل شمعة فريدة ومميزة",


      /* Product tabs */
      pd_desc_tab:
        "📝 الوصف",

      pd_specs_tab:
        "📋 المواصفات",

      pd_reviews_tab:
        "⭐ المراجعات",


      /* Product gallery */
      pd_zoom:
        "🔍 تكبير",

      pd_gallery_count:
        "الصور",


      /* Product options */
      pd_scent_t:
        "🌸 اختاري العطر:",

      pd_qty_t:
        "الكمية:",

      pd_required:
        "مطلوب",

      pd_decrease:
        "تقليل الكمية",

      pd_increase:
        "زيادة الكمية",

      pd_wishlist:
        "إضافة إلى المفضلة",


      /* Product actions */
      pd_add:
        "🛍️ أضيفي للسلة",

      pd_buy:
        "💬 اطلبي عبر واتساب",


      /* Product information */
      pd_hours:
        "مدة الاشتعال:",

      pd_materials:
        "الخامات:",

      pd_ship:
        "التوصيل:",

      pd_ship_v:
        "3–7 أيام",


      /* Reviews */
      pd_review_word:
        "مراجعة",

      pd_read_all:
        "اقرئي الكل",

      pd_first_review:
        "كوني أول من يشارك رأيه",


      /* Related Products */
      pd_rel_h2:
        "✨ منتجات هتعجبك",


      /* Share */
      pd_share:
        "مشاركة:",

      pd_copy_link:
        "📋 نسخ الرابط",


      /* Product Not Found */
      pd_product:
        "المنتج",

      pd_not_found_title:
        "😕 المنتج غير متاح",

      pd_not_found_desc:
        "عذراً، لم نتمكن من العثور على هذا المنتج",

      pd_browse_products:
        "تصفح المنتجات",


      /* ═══ Homepage Reviews ═══ */
      reviews_kicker:
        "💛 كلامكم أحلى هدية",

      reviews_title:
        "آراء عملائنا",

      reviews_desc:
        "مش بنكتب كلام، بنعرض الحقيقة. دي لقطات حقيقية من محادثات عملائنا بعد ما استلموا طلباتهم.",

      reviews_cta:
        "✨ جربتي سحرنا؟",

      reviews_cta_link:
        "ابعتيلنا رأيك على الواتساب",
/* ═══ Brand Promise ═══ */
brand_promise_title:
  "تفاصيل تصنع الفرق",

brand_promise_desc:
  "شموع يدوية فاخرة، عطور مختارة، وهدايا مصممة لتضيف لمسة خاصة لكل لحظة.",

brand_point1_title:
  "صناعة يدوية",

brand_point1_desc:
  "كل قطعة تُصنع وتُجهّز بعناية.",

brand_point2_title:
  "هدية لكل مناسبة",

brand_point2_desc:
  "اختيارات تليق بكل لحظة واحتفال.",

brand_point3_title:
  "اختيار يناسبك",

brand_point3_desc:
  "نساعدك تختاري الرائحة والتفاصيل المناسبة.",

       /* ═══ FAQ ═══ */
      faq1q:
        "كيف يمكنني الطلب وما طرق الدفع المتاحة؟",

      faq1a:
        "يمكنك إضافة المنتجات إلى سلة الشراء وإتمام طلبك بسهولة. يتم دفع قيمة المنتجات مقدمًا عبر InstaPay أو Vodafone Cash أو تحويل بنكي، بينما تُدفع تكلفة الشحن نقدًا لمندوب التوصيل عند الاستلام.",

      faq2q:
        "هل تقومون بالشحن إلى جميع محافظات مصر؟",

      faq2a:
        "نعم، نوفر خدمة التوصيل إلى جميع محافظات مصر، مع الحرص على وصول طلبك بأمان.",

      faq3q:
        "كم تستغرق مدة تجهيز وشحن الطلب؟",

      faq3a:
        "لأن منتجات VelaLight تُصنع يدويًا بعناية، تستغرق مدة التجهيز عادةً من 3 إلى 7 أيام عمل، بالإضافة إلى مدة الشحن حسب المحافظة.",

      faq4q:
        "هل شموع VelaLight مصنوعة من شمع الصويا؟",

      faq4a:
        "نعم، نستخدم شمع الصويا الطبيعي 100%، الذي يتميز باحتراق أبطأ وأنظف ويساعد على انتشار العطر بكفاءة.",

      faq5q:
        "كم تبلغ مدة احتراق الشمعة وكيف أحافظ على أفضل أداء لها؟",

      faq5a:
        "تختلف مدة الاحتراق حسب وزن وحجم كل شمعة، وستجدين التفاصيل في وصف المنتج. ولأفضل نتيجة، عند الاستخدام الأول اتركي الشمعة حتى يذوب سطح الشمع بالكامل ويصل إلى الحواف لتجنب تكون الأنفاق والحصول على احتراق متساوٍ.",

      faq6q:
        "كيف أختار العطر المناسب؟",

      faq6a:
        "لدينا تشكيلة متنوعة من العطور الفاخرة. وإذا كنتِ محتارة، تواصلي معنا عبر WhatsApp وسنساعدك في اختيار العطر المناسب حسب ذوقك والمناسبة والأجواء التي تفضلينها.",

      faq7q:
        "هل تتوفر خدمة تغليف الهدايا؟",

      faq7a:
        "نعم، جميع منتجات VelaLight تأتي بتغليف أنيق وفاخر وجاهز للإهداء.",

      faq8q:
        "ما سياسة الاستبدال والاسترجاع؟",

      faq8a:
        "نظرًا لطبيعة منتجاتنا المصنوعة يدويًا، لا يمكن الاستبدال أو الاسترجاع بعد فتح المنتج أو استخدامه، أو بسبب تغيير الرغبة بعد تأكيد الطلب. وفي حالة وصول المنتج بعيب مصنعي أو تلف بسبب الشحن، يرجى التواصل معنا خلال 24 ساعة من الاستلام وسنعمل على حل المشكلة.",

      /* ═══ Top Marquee ═══ */
      mq_delivery:
        "🚚 توصيل سريع لكل محافظات مصر",

      mq_discounts:
        "🏷️ خصومات حصرية على مجموعات مختارة",

      mq_gift:
        "🎁 تغليف هدايا مجاني مع كل طلب",

      mq_handmade:
        "🤲 صناعة يدوية 100% بخامات طبيعية",

      mq_scents:
        "🕯️ أكثر من 23 عطر فاخر متاح",

      mq_shipping:
        "📦 شحن آمن من الورشة لحد باب بيتك",

      mq_support:
        "💬 دعم فني يومي لخدمتك",

      /* ═══ Products Page ═══ */
      products_title: "كل المنتجات",
      products_sub: "اكتشفي تشكيلتنا الكاملة من الشموع الفاخرة",
      filter_all: "الكل",
      filter_wood: "خشبية",
      filter_glass: "زجاجية",
      filter_crystal: "كريستالية",
      filter_metal: "معدنية",
      filter_massage: "مساج",
      filter_gift: "هدايا",
      filter_bride: "بوكس العروسة",
      sort_new: "الأحدث",
      sort_asc: "السعر: من الأقل",
      sort_desc: "السعر: من الأعلى",
      sort_rating: "التقييم",
      sort_best: "الأكثر مبيعاً",
      sort_disc: "أكبر خصم",
      no_products_filter: "لا توجد منتجات تطابق الفلتر المختار",
      view_details: "عرض التفاصيل",
      add_cart: "أضف للسلة",
      price_lbl: "السعر:",
      scent_lbl: "العطر:",
      cart_empty: "السلة فارغة",
      cart_empty_sub: "أضيفي منتجاتك المفضلة",

      /* ═══ Reviews Page ═══ */
      reviews_page_title: "كل آراء عملائنا",
      reviews_page_sub: "شوفي تجارب العملاء الحقيقية مع منتجات VelaLight",
      reviews_verified: "عميلة موثّقة",
      reviews_customer: "عميلة سعيدة",
      reviews_share_your: "شاركينا رأيك ✨",
      reviews_share_sub: "جربتي منتج من VelaLight؟ اكتبيلنا تجربتك",

      /* ═══ Products Page ═══ */
      prod_word: "منتج",
      no_products: "لا توجد منتجات",

      /* ═══ Craftsmanship (Behind the Scenes) ═══ */
      craft_kick: "Behind the Scenes",
      craft_title: "إيد مصرية.. تفاصيل ملهاش حدود",
      craft_desc: "شوفي ازاي بنصنع كل قطعة بحب ودقة عشان توصلك بالشكل اللي يليق بيكي",
      craft_loading: "⏳ جاري التحميل...",
      craft_fallback1_title: "نخلط الزيوت بعناية",
      craft_fallback1_desc: "نستخدم أفضل الزيوت الطبيعية لضمان رائحة تدوم طويلاً",
      craft_fallback2_title: "تغليف فاخر جاهز للإهداء",
      craft_fallback2_desc: "كل قطعة بتتغلف بإيدينا عشان تكون مميزة",
      craft_fallback3_title: "فحص دقيق لكل قطعة",
      craft_fallback3_desc: "نتأكد من الجودة قبل ما توصل لباب بيتك",

      /* ═══ Reviews Enhanced ═══ */
      rev_see_all: "📸 شوفي كل التجارب",
      rev_stats_label: "عميلة وثقت فينا",
      rev_stats_rating: "تقييم 5 نجوم",
      rev_loading: "⏳ جاري تحميل التجارب...",

      /* ═══ FAQ & Misc ═══ */
      faq_kick: "FAQ",
      faq_sub: "كل ما تحتاجين معرفته عن الطلب، الشحن، الشموع والعطور.",
      foot_designer_label: "صُمم وتطوير بعناية بواسطة",
      brand_kick: "The VelaLight Touch",
      scents_kick: "Signature Scents",
      prod_kick: "Our Collection",
      prod_sub: "اكتشفي أحدث تشكيلتنا من الشموع الفاخرة",
      prod_see_all: "🕯️ استعرضي كل المنتجات",
      about_kick: "Our Story",
      ed_kick: "A Moment of Luxury",
      ed_h2: "لحظاتٌ تُحفر في الذاكرة",
      ed_p: "كل شمعة من VelaLight ليست مجرد إضاءة… هي لحظة كاملة. لحظة هدوء، لحظة رومانسية، لحظة فرح. اصنعي ذكرياتك الخاصة مع عطورنا الفاخرة.",
      ed_cta: "ابدئي رحلتك ✨",

    },


    /* ═══════════════════════════════════════
       🇬🇧 ENGLISH
       ═══════════════════════════════════════ */
    en: {
/* ═══ Reviews Page (reviews.html) ═══ */
reviews_back: "← Back to Home",
reviews_stats_trust: "Trust Renewed",
reviews_quote: "Not just a candle… it's a moment to live!",
reviews_quote_author: "— One of our customers",
reviews_cta_title: "Ready to join the VelaLight family? 🕯️",
reviews_cta_sub: "Choose your luxury candle and create your own moment",
reviews_cta_btn: "Shop Now 🛍️",
foot_wishlist: "❤️ Wishlist",
foot_orders: "📦 My Orders",
      
      /* Shipping & Payment */
      ship_note:
        "🚚 Shipping: paid cash to the courier on delivery.",

      pay_products_note:
        "💳 Payment details (InstaPay / Wallet / Bank Transfer) will be sent via WhatsApp upon order confirmation.",

      pay_title:
        "Payment via InstaPay",

      paymethod_d:
        "Product payment is made upfront upon order confirmation.",


      /* Scent */
      t_scentwarn:
        "⚠️ Please choose a scent first.",

      quick_add_scent:
        "🌸 Choose a scent",

      quick_add_qty:
        "Quantity",

      quick_add_add:
        "🛍️ Add to Cart",

      quick_add_added:
        "✓ Added to Cart",

      scent_req:
        "Required",


      /* Handmade */
      handmade_note:
        "Handmade piece prepared with care upon order — every candle is unique and special",

      pd_handmade_note:
        "Handmade piece prepared with care upon order — every candle is unique and special",


      /* Product tabs */
      pd_desc_tab:
        "📝 Description",

      pd_specs_tab:
        "📋 Specifications",

      pd_reviews_tab:
        "⭐ Reviews",


      /* Product gallery */
      pd_zoom:
        "🔍 Zoom",

      pd_gallery_count:
        "Images",


      /* Product options */
      pd_scent_t:
        "🌸 Scent:",

      pd_qty_t:
        "Quantity:",

      pd_required:
        "Required",

      pd_decrease:
        "Decrease quantity",

      pd_increase:
        "Increase quantity",

      pd_wishlist:
        "Add to favorites",


      /* Product actions */
      pd_add:
        "🛍️ Add to Cart",

      pd_buy:
        "💬 Order via WhatsApp",


      /* Product information */
      pd_hours:
        "Burn time:",

      pd_materials:
        "Materials:",

      pd_ship:
        "Delivery:",

      pd_ship_v:
        "3–7 days",


      /* Reviews */
      pd_review_word:
        "reviews",

      pd_read_all:
        "Read all",

      pd_first_review:
        "Be the first to review",


      /* Related Products */
      pd_rel_h2:
        "✨ You May Also Like",


      /* Share */
      pd_share:
        "Share:",

      pd_copy_link:
        "📋 Copy Link",


      /* Product Not Found */
      pd_product:
        "Product",

      pd_not_found_title:
        "😕 Product Not Available",

      pd_not_found_desc:
        "Sorry, we couldn't find this product",

      pd_browse_products:
        "Browse Products",


      /* ═══ Homepage Reviews ═══ */
      reviews_kicker:
        "💛 Your Words Mean the Most",

      reviews_title:
        "Our Customers' Reviews",

      reviews_desc:
        "We don't just write claims — we show the real experience. These are genuine screenshots from our customers after receiving their orders.",

      reviews_cta:
        "✨ Tried our candles?",

      reviews_cta_link:
        "Send us your review on WhatsApp",

/* ═══ Brand Promise ═══ */
brand_promise_title:
  "Details That Make the Difference",

brand_promise_desc:
  "Handcrafted candles, carefully selected scents, and thoughtful gifts made for every special moment.",

brand_point1_title:
  "Handcrafted",

brand_point1_desc:
  "Every piece is made and prepared with care.",

brand_point2_title:
  "A Gift for Every Occasion",

brand_point2_desc:
  "Thoughtful choices for every moment and celebration.",

brand_point3_title:
  "Made for You",

brand_point3_desc:
  "We help you choose the right scent and details for your taste.",

      /* ═══ FAQ ═══ */
      faq1q:
        "How can I place an order and what payment methods are available?",

      faq1a:
        "You can add your selected products to the cart and complete your order easily. Product payment is made upfront via InstaPay, Vodafone Cash, or bank transfer, while the shipping fee is paid in cash to the courier upon delivery.",

      faq2q:
        "Do you ship to all governorates in Egypt?",

      faq2a:
        "Yes, we deliver safely and reliably to all governorates across Egypt.",

      faq3q:
        "How long does it take to prepare and ship my order?",

      faq3a:
        "Because VelaLight products are carefully handmade, preparation usually takes 3 to 7 business days, in addition to the shipping time depending on your governorate.",

      faq4q:
        "Are VelaLight candles made from soy wax?",

      faq4a:
        "Yes, we use 100% natural soy wax. It burns more slowly and cleanly and helps the fragrance diffuse effectively.",

      faq5q:
        "How long does a candle burn, and how can I get the best performance?",

      faq5a:
        "Burn time varies depending on the candle's weight and size, as detailed in each product description. For the best results, during the first use, allow the wax to melt completely across the surface and reach the edges to prevent tunneling and ensure an even burn.",

      faq6q:
        "How can I choose the right scent?",

      faq6a:
        "We offer a variety of luxurious fragrances. If you're unsure which one to choose, contact us via WhatsApp and we'll be happy to help you select the perfect scent based on your taste, occasion, and desired atmosphere.",

      faq7q:
        "Do you offer gift wrapping?",

      faq7a:
        "Yes. All VelaLight products come in elegant, luxurious packaging that is ready for gifting.",

      faq8q:
        "What is your return and exchange policy?",

      faq8a:
        "Due to the nature of our handmade products, returns or exchanges are not accepted after the product has been opened or used, or due to a change of mind after the order has been confirmed. If your order arrives with a manufacturing defect or shipping damage, please contact us within 24 hours of delivery and we will be happy to resolve the issue.",

      /* ═══ Top Marquee ═══ */
      
      mq_delivery:
        "🚚 Fast delivery across Egypt",

      mq_discounts:
        "🏷️ Exclusive discounts on selected collections",

      mq_gift:
        "🎁 Free gift wrapping with every order",

      mq_handmade:
        "🤲 100% handmade with natural materials",

      mq_scents:
        "🕯️ More than 23 luxury scents available",

      mq_shipping:
        "📦 Safe shipping from our workshop to your door",

      mq_support:
        "💬 Daily customer support",

      /* ═══ Products Page ═══ */
      products_title: "All Products",
      products_sub: "Discover our full collection of luxury candles",
      filter_all: "All",
      filter_wood: "Wooden",
      filter_glass: "Glass",
      filter_crystal: "Crystal",
      filter_metal: "Metal",
      filter_massage: "Massage",
      filter_gift: "Gifts",
      filter_bride: "Bride Box",
      sort_new: "Newest",
      sort_asc: "Price: Low to High",
      sort_desc: "Price: High to Low",
      sort_rating: "Rating",
      sort_best: "Best Sellers",
      sort_disc: "Biggest Discount",
      no_products_filter: "No products match your filter",
      view_details: "View Details",
      add_cart: "Add to Cart",
      price_lbl: "Price:",
      scent_lbl: "Scent:",
      cart_empty: "Cart is empty",
      cart_empty_sub: "Add your favorite products",

      /* ═══ Reviews Page ═══ */
      reviews_page_title: "All Customer Reviews",
      reviews_page_sub: "See real experiences from VelaLight customers",
      reviews_verified: "Verified Customer",
      reviews_customer: "Happy Customer",
      reviews_share_your: "Share Your Review ✨",
      reviews_share_sub: "Tried a VelaLight product? Tell us about your experience",

      /* ═══ Products Page ═══ */
      prod_word: "products",
      no_products: "No products found",

      /* ═══ Craftsmanship (Behind the Scenes) ═══ */
      craft_kick: "Behind the Scenes",
      craft_title: "Egyptian Hands.. Details Beyond Limits",
      craft_desc: "See how we craft every piece with love and precision to deliver it to you in the way that suits you.",
      craft_loading: "⏳ Loading...",
      craft_fallback1_title: "Mixing oils with care",
      craft_fallback1_desc: "We use the finest natural oils to ensure a long-lasting scent",
      craft_fallback2_title: "Luxury gift wrapping ready",
      craft_fallback2_desc: "Every piece is wrapped by our hands to make it special",
      craft_fallback3_title: "Quality inspection for every piece",
      craft_fallback3_desc: "We ensure quality before it reaches your doorstep",

      /* ═══ Reviews Enhanced ═══ */
      rev_see_all: "📸 See All Experiences",
      rev_stats_label: "Customers Trusted Us",
      rev_stats_rating: "5-Star Rating",
      rev_loading: "⏳ Loading experiences...",

      /* ═══ FAQ & Misc ═══ */
      faq_kick: "FAQ",
      faq_sub: "Everything you need to know about ordering, shipping, candles and scents.",
      foot_designer_label: "Designed & Developed with care by",
      brand_kick: "The VelaLight Touch",
      scents_kick: "Signature Scents",
      prod_kick: "Our Collection",
      prod_sub: "Discover our latest collection of luxury candles",
      prod_see_all: "🕯️ Browse All Products",
      about_kick: "Our Story",
      ed_kick: "A Moment of Luxury",
      ed_h2: "Moments Etched in Memory",
      ed_p: "Every VelaLight candle is more than just a light… it's a complete moment. A moment of calm, a moment of romance, a moment of joy. Create your own memories with our luxury scents.",
      ed_cta: "Start Your Journey ✨",

    }

  };


  /* ═══ Add only missing keys — never overwrite existing translations ═══ */
  Object.keys(add).forEach(L => {

    if(!I18N[L]) {
      I18N[L] = {};
    }

    Object.keys(add[L]).forEach(k => {

      if(
        I18N[L][k] === undefined ||
        I18N[L][k] === null ||
        I18N[L][k] === ""
      ){
        I18N[L][k] = add[L][k];
      }

    });

  });

})();
  /* ═══════════════════════════════════════════════════════════
   ✨ INIT — الحل الجذري النهائي: منع الوميض وتوحيد البيانات
   ═══════════════════════════════════════════════════════════ */
let isFirstRenderComplete = false;
let pendingDataRefresh = false;

document.addEventListener("DOMContentLoaded", () => {
  initLang();
  initMarquee();
  initEmbers();
  initReveal();
  initSubscriptionForm(); // ═══ تعديل: تهيئة نموذج الاشتراك

  // تحقق إذا كنا في صفحة المنتجات أو الآراء
  const isProductsPage = window.location.pathname.includes('products.html');
  const isReviewsPage = window.location.pathname.includes('reviews.html');
  const isProductPage = window.location.pathname.includes('product.html');

  // 1. اعرض هيكل التحميل فوراً لمنع ظهور أي بيانات قديمة
  const grid = document.getElementById("pgrid");
  if (grid && !isProductPage) {
    grid.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1.4rem; padding:1rem;">
        ${Array(4).fill(`<div class="skel" style="height:380px;border-radius:18px;"></div>`).join('')}
      </div>
    `;
  }

  // 2. اطلب البيانات الجديدة من Firebase مباشرة
  loadAll().then(() => {
    // 3. حفظ البيانات الجديدة في الكاش الآن
    try {
      localStorage.setItem("vl_products_v3", JSON.stringify(ALL_PRODUCTS.slice(0, 200)));
      localStorage.setItem("vl_products_v3_time", String(Date.now()));
    } catch(e) {}

    // 4. السماح بالتحديثات اللاحقة
    isFirstRenderComplete = true;

    // 5. الرسم حسب الصفحة
    if (isProductsPage) {
      if (typeof renderProductsPage === "function") {
        renderProductsPage();
      } else {
        renderChips();
        renderProducts();
      }
    } else if (isReviewsPage) {
      if (typeof renderReviewsPage === "function") {
        renderReviewsPage();
      }
    } else if (!isProductPage) {
      // الصفحة الرئيسية
      renderChips();
      renderProducts();
    }
    
    renderScents();
    renderFAQ();
    initProductRealtimeSync();
    requestIdle(() => prefetchProductPages());
    
  }).catch(err => {
    console.warn("⚠️ loadAll failed, falling back to cache:", err);
    // في حالة فشل Firebase فقط، نستخدم الكاش كملاذ أخير
    const hasCache = (typeof loadFromCache === "function") && loadFromCache();
    if (hasCache && typeof ALL_PRODUCTS !== "undefined" && ALL_PRODUCTS.length > 0) {
      isFirstRenderComplete = true;
      if (isProductsPage && typeof renderProductsPage === "function") {
        renderProductsPage();
      } else if (!isProductPage) {
        renderChips();
        renderProducts();
      }
      renderScents();
      renderFAQ();
    } else {
      if (grid && !isProductPage) grid.innerHTML = `<div class="empty">⚠️ تعذر تحميل المنتجات، يرجى التحقق من اتصال الإنترنت</div>`;
    }
  });

  initCart();
  initAccount();
  initSearch();
  initChat();
  initNav();
  initQuickAdd();
  initHeroIntro();
  
  // تحديث عدد التجارب في قسم الآراء
  if (typeof window.updateReviewsCount === 'function') {
    window.updateReviewsCount();
  }
});

// التعامل مع تحديثات Firebase اللاحقة (Realtime)
window.addEventListener("data-refresh", () => {
  if (!isFirstRenderComplete) {
    pendingDataRefresh = true; // انتظر حتى ينتهي التحميل الأولي
    return;
  }
  const isProductsPage = window.location.pathname.includes('products.html');
  const isProductPage = window.location.pathname.includes('product.html');
  
  if (isProductsPage && typeof renderProductsPage === "function") {
    renderProductsPage();
  } else if (!isProductPage) {
    renderProducts();
  }
});

function prefetchProductPages(){
  if(!('requestIdleCallback' in window)) return;
  const products = typeof ALL_PRODUCTS !== 'undefined' ? ALL_PRODUCTS.slice(0, 4) : [];
  products.forEach((p, i) => {
    setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `product.html?p=${p.id}`;
      link.as = 'document';
      document.head.appendChild(link);
    }, i * 500);
  });
}

function initHeroIntro(){
  const hero=document.querySelector('.hero-content');
  if(!hero)return;
  requestAnimationFrame(()=>{
    setTimeout(()=>hero.classList.add('hero-intro'),40);
  });
}

let productRealtimeStarted=false;
let productRealtimeUnsubscribe=null;

function initProductRealtimeSync(){
  if(productRealtimeStarted)return;
  if(typeof DB==="undefined"||typeof DB.watch!=="function")return;
  productRealtimeStarted=true;
  
  let lastHash = "";
  
  productRealtimeUnsubscribe=DB.watch("products",cloud=>{
    const hash = JSON.stringify(cloud||[]).length + "-" + (cloud||[]).length;
    if (hash === lastHash) return; 
    lastHash = hash;
    
    const map=new Map(
      (typeof PRODUCTS!=="undefined"?PRODUCTS:[]).map(p=>[p.id,{...p}])
    );
    (cloud||[]).forEach(d=>{
      const slug=d.id_||d.slug||d.pid||d.id;
      if(!slug)return;
      if(d.active===false){map.delete(slug);return;}
      map.set(slug,{...(map.get(slug)||{}),...d,id:slug,_fid:d.id||null});
    });
    ALL_PRODUCTS=[...map.values()];
    window.dispatchEvent(new Event("data-refresh"));
  },error=>{
    console.warn("⚠️ Products realtime sync error:",error);
  });
}

function initLang(){
  const btn=document.getElementById("langBtn");
  if(!btn)return;
  updateLangBtn();
  btn.addEventListener("click",()=>{
    LANG=LANG==="ar"?"en":"ar";
    try { localStorage.setItem("vl_lang",LANG); } catch(e){}
    document.documentElement.dir=LANG==="ar"?"rtl":"ltr";
    document.documentElement.lang=LANG;
    applyI18n();
    updateHeroCopy();
    updateLangBtn();
    
    const isProductsPage = window.location.pathname.includes('products.html');
    const isReviewsPage = window.location.pathname.includes('reviews.html');
    
    if (isProductsPage && typeof renderProductsPage === "function") {
      renderProductsPage();
    } else if (isReviewsPage && typeof renderReviewsPage === "function") {
      renderReviewsPage();
    } else {
      renderChips();
      renderProducts();
    }
    renderScents();
    renderFAQ();
    fillCitySelect(document.getElementById("accCity"));
    fillCitySelect(document.getElementById("coCity"));
    fillCartForm();
    initChatWelcome();
    toast(t(LANG==="ar"?"t_lang_ar":"t_lang_en"));
  });
  applyI18n();
  updateHeroCopy();
}

function updateHeroCopy(){
  const kick=document.querySelector('.hero-kick');
  const title=document.querySelector('.hero-title-main');
  const lead=document.querySelector('.hero-lead');
  const cta=document.querySelector('.hero-cta');
  if(!kick||!title||!lead||!cta)return;
  if(LANG==='en'){
    kick.textContent='✦ Hand-poured luxury candles';
    title.textContent='Light that feels like you.';
    lead.textContent='Candles that glow… illuminating your day with moments you deserve.';
    cta.innerHTML='Discover your collection <span aria-hidden="true">✦</span>';
  }else{
    kick.textContent='✦ شموع يدوية فاخرة';
    title.textContent='ضوءٌ يُشبهك.';
    lead.textContent='شموع تُضيء… لتنير يومك بلحظاتٍ تستحقها.';
    cta.innerHTML='اكتشف مجموعتك <span aria-hidden="true">✦</span>';
  }
}

function updateLangBtn(){
  const btn=document.getElementById("langBtn");
  if(btn){btn.textContent=LANG==="ar"?"EN":"ع";}
}

function applyI18n(){
  document.title=t("docTitle");

  /* ═══ Normal translations ═══ */
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k=el.dataset.i18n;
    const v=t(k);
    if(v&&v!==k){
      el.textContent=v;
    }
  });

  /* ═══ Placeholder translations ═══ */
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
    const k=el.dataset.i18nPh;
    const v=t(k);
    if(v&&v!==k){
      el.placeholder=v;
    }
  });

  /* ═══ Title attributes ═══ */
  document.querySelectorAll("[data-i18n-title]").forEach(el=>{
    const k=el.dataset.i18nTitle;
    const v=t(k);
    if(v&&v!==k){
      el.title=v;
    }
  });

  /* ═══ Top Marquee ═══ */
  const mq=document.getElementById("mqTrack");
  if(mq){
    const marqueeKeys=[
      "mq_delivery",
      "mq_discounts",
      "mq_gift",
      "mq_handmade",
      "mq_scents",
      "mq_shipping",
      "mq_support"
    ];
    mq.innerHTML="";
    for(let i=0;i<2;i++){
      marqueeKeys.forEach(key=>{
        const span=document.createElement("span");
        span.textContent=t(key);
        mq.appendChild(span);
      });
    }
  }

  /* ═══ FAQ ═══ */
  const faqWrap=document.getElementById("faqWrap");
  if(faqWrap&&typeof renderFAQ==="function"){
    renderFAQ();
  }
}

function initMarquee(){}

function initEmbers(){
  const w=document.getElementById("embers");
  if(!w)return;
  w.innerHTML="";
  const frag = document.createDocumentFragment();
  for(let i=0;i<12;i++){
    const s=document.createElement("span");
    s.style.left=Math.random()*100+"%";
    s.style.animationDelay=Math.random()*7+"s";
    s.style.animationDuration=(5+Math.random()*5)+"s";
    frag.appendChild(s);
  }
  w.appendChild(frag);
}

function initReveal(){
  if(!('IntersectionObserver' in window)) {
    document.querySelectorAll(".rv").forEach(el => el.classList.add("on"));
    return;
  }
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("on");
        io.unobserve(e.target);
      }
    });
  },{threshold:.05, rootMargin:"0px 0px 100px 0px"});
  
  document.querySelectorAll(".rv").forEach(el=>{
    if (el.getBoundingClientRect().top < window.innerHeight + 100) {
      el.classList.add("on");
    } else {
      io.observe(el);
    }
  });
}

function renderChips(){
  const w=document.getElementById("chips");
  if(!w)return;
  w.style.display="none";
  w.setAttribute("aria-hidden","true");
  const keys=["all","wood","glass","crystal","metal","massage","gift","bride"];
  const frag = document.createDocumentFragment();
  keys.forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (k==="all" ? " on" : "");
    btn.dataset.cat = k;
    btn.textContent = cat(k);
    btn.addEventListener("click",()=>{
      w.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));
      btn.classList.add("on");
      const isProductsPage = window.location.pathname.includes('products.html');
      if (isProductsPage && typeof renderProductsPage === "function") {
        renderProductsPage();
      } else {
        renderProducts();
      }
    });
    frag.appendChild(btn);
  });
  w.innerHTML = '';
  w.appendChild(frag);
}

function activeCat(){
  const c=document.querySelector("#chips .chip.on");
  return c?c.dataset.cat:"all";
}

function renderProducts(){
  const grid=document.getElementById("pgrid");
  if(!grid)return;

  const products = (typeof ALL_PRODUCTS !== "undefined" && Array.isArray(ALL_PRODUCTS)) 
    ? ALL_PRODUCTS 
    : (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);

  const catF=activeCat();
  const min=+(document.getElementById("priceMin")?.value||0);
  const max=+(document.getElementById("priceMax")?.value||0);
  const sort=document.getElementById("sortSel")?.value||"new";

  let list=products.filter(p=>{
    if(!p || !p.id) return false;
    if(catF!=="all"&&p.cat!==catF)return false;
    if(min&&p.price<min)return false;
    if(max&&p.price>max)return false;
    if(p.active===false) return false;
    return true;
  });

  // ✨ منطق الترتيب الجديد: المنتجات المثبتة تأتي أولاً دائماً
  list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.pinned && b.pinned) {
      return (b.pinnedAt || 0) - (a.pinnedAt || 0);
    }
    
    switch(sort){
      case "asc": return (a.price||0) - (b.price||0);
      case "desc": return (b.price||0) - (a.price||0);
      case "rating": return ((typeof ratingOf==="function"?ratingOf(b.id)?.avg:0)||0) - ((typeof ratingOf==="function"?ratingOf(a.id)?.avg:0)||0);
      case "best": return (b.sold||0) - (a.sold||0);
      case "disc": return ((b.old-b.price)/Math.max(b.old,1)) - ((a.old-a.price)/Math.max(a.old,1));
      default: return (b.createdAt||0) - (a.createdAt||0);
    }
  });

  const cnt=document.getElementById("prodCount");
  if(cnt){cnt.textContent=list.length+" "+t("prod_word");}

  if(!list.length){
    grid.innerHTML=`<div class="empty">${t("no_products")}</div>`;
    return;
  }

  const readMoreText=LANG==="en"?"Read more →":"عرض المزيد ←";
  const isMobile = window.innerWidth <= 768;
  const eagerCount = isMobile ? 4 : 8;

  const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='%23f5efe5' width='400' height='400'/><text x='200' y='200' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-size='24' fill='%23d9ab5f'>✦</text></svg>`;

  const frag = document.createDocumentFragment();
  
  list.forEach((p, index) => {
    try {
      const r=(typeof ratingOf==="function")?ratingOf(p.id):null;
      
      const pinBadge = p.pinned ? `<span class="p-pin-badge">📌 مميز</span>` : "";
      const badge = (typeof pbadge === "function") ? pbadge(p) : "";
      
      const rawDesc=LANG==="en"?(p.descEn||p.desc||""):(p.desc||p.descEn||"");
      const productDesc=String(rawDesc).trim();
      
      const isFirstBatch = index < eagerCount;
      const loadingAttr = isFirstBatch ? 'eager' : 'lazy';
      const fetchPriority = isFirstBatch ? 'high' : 'low';
      
      let imgSrc = "";
      try {
        imgSrc = (typeof imgOf === "function") ? imgOf(p) : (p.img || "");
      } catch(e) {
        imgSrc = placeholderSvg;
      }
      
      if (!imgSrc) imgSrc = placeholderSvg;
      
      const inWishlist = isInWishlist(p.id);
      const stockNum = Number(p.stock);
      const isOutOfStock = !isNaN(stockNum) && stockNum === 0;
      const stockBadg = (typeof stockBadge === "function") ? stockBadge(p) : "";
      
      const article = document.createElement('article');
      article.className = 'p-card';
      article.dataset.id = p.id;
      
      const isBrideBox = String(p.id) === "pmt2u7xq749e";

const brideVideoUrl = "https://velalight.github.io/box.mp4?v=v5";

const mediaContent = isBrideBox
  ? `
    <video
      src="${brideVideoUrl}"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      poster="${imgSrc}"
      style="
        width:100%;
        height:100%;
        object-fit:contain;
        background:#000;
        display:block;
        border-radius:inherit;
      "
      aria-label="${pname(p)}"
    ></video>
  `
  : `
    <img
      src="${imgSrc}"
      alt="${pname(p)}"
      loading="${loadingAttr}"
      decoding="async"
      fetchpriority="${fetchPriority}"
      width="400"
      height="400"
      onload="this.classList.add('loaded')"
      onerror="window.handleImageError(this, '${p.id}')"
    >
  `;

   article.innerHTML = `
     <a class="p-media" href="product.html?p=${p.id}" aria-label="${pname(p)}">
       ${mediaContent}
       ${p.pinned ? `<span class="p-pin-badge">📌 مميز</span>` : ""}
       ${badge ? `<span class="p-badge">${badge}</span>` : ""}
       ${stockBadg}
       <span class="p-quick">${t("view_details")}</span>
     </a>
     <div class="p-body">
       <span class="p-cat">${cat(p.cat)}</span>
       <h3><a href="product.html?p=${p.id}">${pname(p)}</a></h3>
       ${r ? `<span class="stars" aria-label="${Math.round(r.avg)} stars">${"★".repeat(Math.round(r.avg))}</span>` : ""}
       <p class="p-desc">${productDesc}</p>
       ${productDesc.length > 30 ? `<a href="product.html?p=${p.id}" class="p-desc-link">${readMoreText}</a>` : ""}
       <div class="p-foot">
         <div class="p-price">
           <span class="current-price">${money(p.price)}</span>
           ${p.old > p.price ? `<del>${money(p.old)}</del>` : ""}
         </div>
         <div style="display:flex; gap:6px; width:100%; margin-top:4px;">
           <button class="p-add" data-id="${p.id}" ${isOutOfStock ? "disabled" : ""} style="flex:1;">
             ${isOutOfStock ? (LANG === "en" ? "Out of stock" : "نفدت الكمية") : t("add_cart")}
           </button>
           <button class="p-wish" data-wish="${p.id}" type="button" aria-label="أضف للمفضلة" style="background:${inWishlist ? '#fee' : 'var(--bg)'}; border:1px solid ${inWishlist ? '#e74c3c' : 'var(--line)'}; border-radius:10px; cursor:pointer; font-size:1.1rem; transition:.2s; color:${inWishlist ? '#e74c3c' : 'inherit'}; display:flex; align-items:center; justify-content:center; width:42px; height:42px; padding:0; flex-shrink:0;">
             ${inWishlist ? "❤️" : "🤍"}
           </button>
         </div>
       </div>
     </div>
   `;      
      frag.appendChild(article);
    } catch(e) {
      console.warn("⚠️ Failed to render product:", p.id, e);
    }
  });

  grid.innerHTML = '';
  grid.appendChild(frag);

  // ✨ Event delegation: اربط مستمع النقر مرة واحدة فقط
  if (!productGridClickBound) {
    grid.addEventListener('click', handleProductGridClick);
    productGridClickBound = true;
  }
}

/* ═══ PRODUCTS PAGE — عرض كل المنتجات مع فلترة وترتيب ═══ */
function renderProductsPage() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  const products = (typeof ALL_PRODUCTS !== "undefined" && Array.isArray(ALL_PRODUCTS)) 
    ? ALL_PRODUCTS 
    : (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);

  const catF = activeCat();
  const sort = document.getElementById("sortSelect")?.value || "new";

  let list = products.filter(p => {
    if (!p || !p.id) return false;
    if (catF !== "all" && p.cat !== catF) return false;
    if (p.active === false) return false;
    return true;
  });

  // ⚠️ ترتيب المنتجات (تم إصلاح المنطق ليعمل مع جميع خيارات الترتيب)
  list.sort((a, b) => {
    // 1. المنتجات المثبتة (Pinned) تأتي أولاً
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.pinned && b.pinned) {
      return (b.pinnedAt || 0) - (a.pinnedAt || 0);
    }
    
    // 2. الترتيب حسب الاختيار
    switch(sort) {
      case "asc": // السعر: من الأقل إلى الأعلى
        return (a.price || 0) - (b.price || 0);
      case "desc": // السعر: من الأعلى إلى الأقل
        return (b.price || 0) - (a.price || 0);
      case "rating": // التقييم (النجوم)
        return ((typeof ratingOf === "function" ? ratingOf(b.id)?.avg : 0) || 0) - ((typeof ratingOf === "function" ? ratingOf(a.id)?.avg : 0) || 0);
      case "best": // الأكثر مبيعاً
        return (b.sold || 0) - (a.sold || 0);
      case "disc": // أكبر خصم
        return ((b.old - b.price) / Math.max(b.old, 1)) - ((a.old - a.price) / Math.max(a.old, 1));
      case "new": // الأحدث (افتراضي)
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });

  const countEl = document.getElementById("productsCount");
  if (countEl) countEl.textContent = list.length + " " + t("prod_word");

  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="padding:3rem 0;">${t("no_products_filter")}</div>`;
    return;
  }

  const isMobile = window.innerWidth <= 768;
  const eagerCount = isMobile ? 4 : 8;
  const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='%23f5efe5' width='400' height='400'/><text x='200' y='200' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-size='24' fill='%23d9ab5f'>✦</text></svg>`;

  const frag = document.createDocumentFragment();

  list.forEach((p, index) => {
    try {
      const r = (typeof ratingOf === "function") ? ratingOf(p.id) : null;
      const badge = (typeof pbadge === "function") ? pbadge(p) : "";
      const rawDesc = LANG === "en" ? (p.descEn || p.desc || "") : (p.desc || p.descEn || "");
      const productDesc = String(rawDesc).trim();
      
      const isFirstBatch = index < eagerCount;
      const loadingAttr = isFirstBatch ? 'eager' : 'lazy';
      const fetchPriority = isFirstBatch ? 'high' : 'low';
      
      let imgSrc = "";
      try {
        imgSrc = (typeof imgOf === "function") ? imgOf(p) : (p.img || "");
      } catch(e) {
        imgSrc = placeholderSvg;
      }
      if (!imgSrc) imgSrc = placeholderSvg;

      const inWishlist = isInWishlist(p.id);
      const stockNum = Number(p.stock);
      const isOutOfStock = !isNaN(stockNum) && stockNum === 0;
      const stockBadg = (typeof stockBadge === "function") ? stockBadge(p) : "";

      const article = document.createElement('article');
      article.className = 'p-card';
      article.dataset.id = p.id;

      article.innerHTML = `
        <a class="p-media" href="product.html?p=${p.id}" aria-label="${pname(p)}">
          <img
            src="${imgSrc}"
            alt="${pname(p)}"
            loading="${loadingAttr}"
            decoding="async"
            fetchpriority="${fetchPriority}"
            width="400"
            height="400"
            onload="this.classList.add('loaded')"
            onerror="window.handleImageError(this, '${p.id}')"
          >
          ${p.pinned ? `<span class="p-pin-badge">📌 مميز</span>` : ""}
          ${badge ? `<span class="p-badge">${badge}</span>` : ""}
          ${stockBadg}
          <span class="p-quick">${t("view_details")}</span>
        </a>
        <div class="p-body">
          <span class="p-cat">${cat(p.cat)}</span>
          <h3><a href="product.html?p=${p.id}">${pname(p)}</a></h3>
          ${r ? `<span class="stars" aria-label="${Math.round(r.avg)} stars">${"★".repeat(Math.round(r.avg))}</span>` : ""}
          <p class="p-desc">${productDesc}</p>
          <div class="p-foot">
            <div class="p-price">
              <span class="current-price">${money(p.price)}</span>
              ${p.old > p.price ? `<del>${money(p.old)}</del>` : ""}
            </div>
            <div style="display:flex; gap:6px; width:100%; margin-top:4px;">
              <button class="p-add" data-id="${p.id}" ${isOutOfStock ? "disabled" : ""} style="flex:1;">
                ${isOutOfStock ? (LANG === "en" ? "Out of stock" : "نفدت الكمية") : t("add_cart")}
              </button>
              <button class="p-wish" data-wish="${p.id}" type="button" aria-label="أضف للمفضلة" style="background:${inWishlist ? '#fee' : 'var(--bg)'}; border:1px solid ${inWishlist ? '#e74c3c' : 'var(--line)'}; border-radius:10px; cursor:pointer; font-size:1.1rem; transition:.2s; color:${inWishlist ? '#e74c3c' : 'inherit'}; display:flex; align-items:center; justify-content:center; width:42px; height:42px; padding:0; flex-shrink:0;">
                ${inWishlist ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        </div>
      `;
      frag.appendChild(article);
    } catch(e) {
      console.warn("⚠️ Failed to render product:", p.id, e);
    }
  });

  grid.innerHTML = '';
  grid.appendChild(frag);

  // Event delegation
  if (!productGridClickBound) {
    grid.addEventListener('click', handleProductGridClick);
    productGridClickBound = true;
  }
}

/* ═══ REVIEWS PAGE — عرض كل الآراء ═══ */
function renderReviewsPage() {
  const grid = document.getElementById("reviewsGrid");
  if (!grid) return;

  // استخدام REVIEWS_IMAGES أو بيانات من Firebase
  let reviews = [];
  
  if (typeof REVIEWS_IMAGES !== "undefined" && Array.isArray(REVIEWS_IMAGES)) {
    reviews = REVIEWS_IMAGES.map((name, index) => ({
      id: index,
      image: name,
      name: LANG === "en" ? `Customer #${index + 1}` : `عميلة سعيدة #${index + 1}`,
      verified: true,
      rating: 5,
      text: LANG === "en" ? "Amazing candles! Highly recommend." : "شموع رائعة! أنصح بها بشدة."
    }));
  }

  // إذا كانت هناك مراجعات من Firebase، ندمجها
  if (typeof ALL_REVIEWS !== "undefined" && Array.isArray(ALL_REVIEWS) && ALL_REVIEWS.length > 0) {
    const fbReviews = ALL_REVIEWS.map(r => ({
      id: r.id || Date.now() + Math.random(),
      image: r.image || null,
      name: r.name || (LANG === "en" ? "Customer" : "عميلة"),
      verified: r.verified !== false,
      rating: r.rating || 5,
      text: r.text || (LANG === "en" ? "Great product!" : "منتج رائع!")
    }));
    reviews = [...fbReviews, ...reviews];
  }

  if (!reviews.length) {
    grid.innerHTML = `
      <div class="empty" style="padding:3rem 0;">
        <div style="font-size:3rem;margin-bottom:1rem;">💛</div>
        <p style="color:var(--mut);">${LANG === "en" ? "No reviews yet. Be the first!" : "لسة مفيش مراجعات. كوني أول من يشارك رأيه!"}</p>
      </div>
    `;
    return;
  }

  const frag = document.createDocumentFragment();

  reviews.forEach((r) => {
    const card = document.createElement('article');
    card.className = 'vl-review-card-full';
    card.style.cssText = `
      background:var(--panel);
      border:1px solid var(--line);
      border-radius:18px;
      overflow:hidden;
      padding:1.5rem;
      display:flex;
      gap:1.5rem;
      align-items:center;
      transition:.3s;
      margin-bottom:1.2rem;
    `;

    const imgSrc = r.image ? (typeof CDN === "function" ? CDN("testimonials/" + r.image) : "https://velalight.github.io/testimonials/" + r.image) : null;

    card.innerHTML = `
      ${imgSrc ? `
        <div style="flex:0 0 120px; border-radius:12px; overflow:hidden; border:1px solid var(--line);">
          <img src="${imgSrc}" alt="${r.name}" loading="lazy" style="width:120px;height:120px;object-fit:cover;display:block;">
        </div>
      ` : `
        <div style="flex:0 0 80px; height:80px; border-radius:50%; background:var(--gold); display:grid; place-items:center; font-size:2.5rem; color:#fff;">
          ${r.name.charAt(0)}
        </div>
      `}
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:.8rem; flex-wrap:wrap; margin-bottom:.4rem;">
          <strong style="font-family:var(--fd); font-size:1.05rem;">${r.name}</strong>
          ${r.verified ? `<span style="background:#d4edda; color:#155724; padding:2px 10px; border-radius:99px; font-size:.7rem; font-weight:700;">✓ ${LANG === "en" ? "Verified" : "موثّقة"}</span>` : ""}
          <span class="stars" style="color:var(--gold); letter-spacing:2px;">${"★".repeat(r.rating || 5)}</span>
        </div>
        <p style="color:var(--mut); line-height:1.8; font-size:.95rem; margin:0;">${r.text}</p>
      </div>
    `;
    frag.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(frag);
}

/* ═══ EVENT HANDLER FOR PRODUCT GRID ═══ */
function handleProductGridClick(e){
  const shareBtn = e.target.closest('.p-share');
  if (shareBtn) {
    e.preventDefault();
    e.stopPropagation();
    const pId = shareBtn.dataset.id;
    const pName = shareBtn.dataset.name;
    const shareUrl = `${window.location.origin}/product.html?p=${pId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `VelaLight - ${pName}`,
        text: `شوفي الشمعة الفاخرة دي من VelaLight 🕯️✨`,
        url: shareUrl
      }).catch(err => console.log('Share canceled'));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast("🔗 تم نسخ رابط المنتج للمشاركة!");
      });
    }
    return;
  }

  const wishBtn = e.target.closest('.p-wish');
  if (wishBtn) {
    e.preventDefault();
    e.stopPropagation();
    const pid = wishBtn.dataset.wish;
    if (pid) toggleWishlist(pid);
    return;
  }
  
  const addBtn = e.target.closest('.p-add');
  if(!addBtn) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const id = addBtn.dataset.id;
  const products = (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : [];
  const p = products.find(x => x.id === id);
  if(p && Number(p.stock)!==0){
    addBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { addBtn.style.transform = ''; }, 150);
    openQuickAdd(p);
  }
}

function initQuickAdd(){
  const closeBtn = document.getElementById("closeScent");
  const overlay = document.getElementById("scentOv");
  const minusBtn = document.getElementById("smQMinus");
  const plusBtn = document.getElementById("smQPlus");
  const addBtn = document.getElementById("scentModalAdd");

  closeBtn?.addEventListener("click",()=>closeModal("scentOv"));

  overlay?.addEventListener("click",e=>{
    if(e.target.id==="scentOv") closeModal("scentOv");
  });

  minusBtn?.addEventListener("click",()=>{
    if(quickAddQty>1){
      quickAddQty--;
      updateQuickAddQtyUI();
    }
  });

  plusBtn?.addEventListener("click",()=>{
    if(quickAddQty < quickAddMaxStock){
      quickAddQty++;
      updateQuickAddQtyUI();
    } else {
      toast(LANG === "en"
        ? `⚠️ Only ${quickAddMaxStock} available`
        : `⚠️ المتاح ${quickAddMaxStock} قطعة فقط`);
    }
  });

  addBtn?.addEventListener("click",()=>{
    if(!quickAddProduct) return;

    const modalSelect = document.getElementById("modalScentSelect");
    if(modalSelect && !quickAddScent) quickAddScent = modalSelect.value;

    if(!quickAddScent){
      toast(t("t_scentwarn"));
      modalSelect?.focus();
      return;
    }

    if(quickAddQty < 1) quickAddQty = 1;

    const added = addToCart(quickAddProduct,{
      scent:quickAddScent,
      qty:quickAddQty
    });

    if(added){
      const originalText = addBtn.textContent;
      addBtn.disabled = true;
      addBtn.textContent = t("quick_add_added");

      setTimeout(()=>{
        addBtn.disabled = false;
        addBtn.textContent = originalText || t("quick_add_add");
        closeModal("scentOv");
      },450);
    }
  });
}

function updateQuickAddQtyUI(){
  const qv = document.getElementById("smQVal");
  if(qv) qv.textContent = quickAddQty;

  const minus = document.getElementById("smQMinus");
  const plus = document.getElementById("smQPlus");

  if(minus){
    minus.disabled = quickAddQty <= 1;
    minus.setAttribute("aria-disabled", String(quickAddQty <= 1));
  }

  if(plus){
    plus.disabled = quickAddQty >= quickAddMaxStock;
    plus.setAttribute("aria-disabled", String(quickAddQty >= quickAddMaxStock));
  }
}

function openQuickAdd(p){
  if(!p) return;

  quickAddProduct=p;
  quickAddScent="";
  quickAddQty=1;

  const stockNum = Number(p.stock);
  quickAddMaxStock = Number.isFinite(stockNum) && stockNum > 0
    ? Math.floor(stockNum)
    : 99;

  const title=document.getElementById("scentModalTitle");
  if(title){
    title.textContent=pname(p);
    title.setAttribute("aria-label", pname(p));
  }

  const qv=document.getElementById("smQVal");
  if(qv) qv.textContent="1";

  const minus=document.getElementById("smQMinus");
  const plus=document.getElementById("smQPlus");
  if(minus) minus.disabled=true;
  if(plus) plus.disabled=quickAddMaxStock <= 1;

  const addBtn=document.getElementById("scentModalAdd");
  if(addBtn){
    addBtn.disabled=true;
    addBtn.textContent=t("quick_add_add");
  }

  const w=document.getElementById("scentModalScents");
  if(!w) return;

  let imgSrc="";
  try{
    imgSrc=(typeof imgOf === "function") ? imgOf(p) : (p.img || "");
  }catch(e){
    imgSrc=p.img || "";
  }

  if(!imgSrc){
    imgSrc="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect fill='%23f5efe5' width='120' height='120'/><text x='60' y='60' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-size='18' fill='%23d9ab5f'>✦</text></svg>";
  }

  const safeName = pname(p);
  const priceText = money(p.price);

  w.innerHTML = `
    <div class="vl-quick-preview" style="display:flex;align-items:center;gap:.9rem;margin-bottom:1rem;padding:.65rem;border:1px solid var(--line);border-radius:14px;background:var(--bg);">
      <img src="${imgSrc}" alt="${safeName}" width="72" height="72" loading="eager" decoding="async" style="width:72px;height:72px;object-fit:cover;border-radius:11px;flex:0 0 72px;" onerror="this.style.display='none'">
      <div style="min-width:0;flex:1;">
        <strong style="display:block;font-size:.98rem;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeName}</strong>
        <span style="display:block;margin-top:.25rem;font-weight:800;color:var(--gold2);">${priceText}</span>
        ${quickAddMaxStock < 99 ? `<small style="display:block;margin-top:.2rem;color:var(--mut);">${LANG === "en" ? `${quickAddMaxStock} available` : `متاح ${quickAddMaxStock} فقط`}</small>` : ""}
      </div>
    </div>

    <label for="modalScentSelect" style="display:block;font-weight:700;margin-bottom:.45rem;">${t("quick_add_scent")}</label>
    <select id="modalScentSelect" aria-required="true" style="width:100%;padding:.85rem;border:1px solid var(--line);border-radius:11px;background:var(--bg);color:var(--dark);font-family:inherit;font-size:1rem;cursor:pointer;outline:none;">
      <option value="">${LANG === "en" ? "Choose a scent..." : "اختاري العطر..."}</option>
      ${VELA_SCENTS.map(s => `<option value="${s[0]}">${velaScentTr(s[0])}</option>`).join('')}
    </select>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:.8rem;margin-top:1rem;">
      <span style="font-weight:700;">${t("quick_add_qty")}</span>
      <div style="display:flex;align-items:center;gap:.65rem;border:1px solid var(--line);border-radius:11px;padding:.25rem;background:var(--bg);">
        <button id="smQMinus" type="button" aria-label="${LANG === "en" ? "Decrease quantity" : "تقليل الكمية"}" style="width:36px;height:36px;border:0;border-radius:8px;background:transparent;font-size:1.25rem;cursor:pointer;">−</button>
        <b id="smQVal" style="min-width:22px;text-align:center;">1</b>
        <button id="smQPlus" type="button" aria-label="${LANG === "en" ? "Increase quantity" : "زيادة الكمية"}" style="width:36px;height:36px;border:0;border-radius:8px;background:transparent;font-size:1.25rem;cursor:pointer;">+</button>
      </div>
    </div>
  `;

  // إعادة ربط أزرار الكمية بعد إعادة بناء محتوى الـ Quick Add.
  const newMinus=document.getElementById("smQMinus");
  const newPlus=document.getElementById("smQPlus");
  const newSelect=document.getElementById("modalScentSelect");

  newMinus?.addEventListener("click",()=>{
    if(quickAddQty>1){
      quickAddQty--;
      updateQuickAddQtyUI();
    }
  });

  newPlus?.addEventListener("click",()=>{
    if(quickAddQty < quickAddMaxStock){
      quickAddQty++;
      updateQuickAddQtyUI();
    } else {
      toast(LANG === "en"
        ? `⚠️ Only ${quickAddMaxStock} available`
        : `⚠️ المتاح ${quickAddMaxStock} قطعة فقط`);
    }
  });

  newSelect?.addEventListener("change",e=>{
    quickAddScent=e.target.value;
    const modalAdd=document.getElementById("scentModalAdd");
    if(modalAdd) modalAdd.disabled=!quickAddScent;
  });

  updateQuickAddQtyUI();
  openDrawer("scentOv");

  setTimeout(()=>newSelect?.focus(),60);
}

const debouncedRenderProducts = debounce(renderProducts, 250);

document.addEventListener("change",e=>{
  if(e.target.id==="priceMin"||e.target.id==="priceMax"||e.target.id==="sortSel"){
    const isProductsPage = window.location.pathname.includes('products.html');
    if (isProductsPage && typeof renderProductsPage === "function") {
      renderProductsPage();
    } else {
      renderProducts();
    }
  }
});
document.addEventListener("input",e=>{
  if(e.target.id==="priceMin"||e.target.id==="priceMax"){
    debouncedRenderProducts();
  }
});

function renderScents(){
  const w=document.getElementById("scentGrid");
  if(!w)return;
  const frag = document.createDocumentFragment();
  VELA_SCENTS.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'scent';
    div.innerHTML = `
      <i>${i+1}</i>
      <div>
        <b>${LANG==="en"?s[1]:s[0]}</b>
        <small>${LANG==="en"?s[0]:s[1]}</small>
      </div>
    `;
    frag.appendChild(div);
  });
  w.innerHTML = '';
  w.appendChild(frag);
}

function renderFAQ(){
  const w = document.getElementById("faqWrap");
  if(!w) return;

  const items = [
    [t("faq1q"), t("faq1a")],
    [t("faq2q"), t("faq2a")],
    [t("faq3q"), t("faq3a")],
    [t("faq4q"), t("faq4a")],
    [t("faq5q"), t("faq5a")],
    [t("faq6q"), t("faq6a")],
    [t("faq7q"), t("faq7a")],
    [t("faq8q"), t("faq8a")]
  ];

  const frag = document.createDocumentFragment();

  items.forEach(([question, answer]) => {
    const item = document.createElement("div");
    item.className = "faq-item";

    item.innerHTML = `
      <button
        class="faq-q"
        type="button"
        aria-expanded="false"
      >
        <span>${question}</span>
        <span class="faq-icon" aria-hidden="true">+</span>
      </button>

      <div class="faq-a">
        <div>${answer}</div>
      </div>
    `;

    frag.appendChild(item);
  });

  w.innerHTML = "";
  w.appendChild(frag);

  w.querySelectorAll(".faq-item").forEach(item => {
    const button = item.querySelector(".faq-q");
    const answer = item.querySelector(".faq-a");

    if(!button || !answer) return;

    button.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");

      w.querySelectorAll(".faq-item").forEach(other => {
        other.classList.remove("open");

        const otherAnswer = other.querySelector(".faq-a");
        const otherButton = other.querySelector(".faq-q");

        if(otherAnswer){
          otherAnswer.style.maxHeight = null;
        }

        if(otherButton){
          otherButton.setAttribute("aria-expanded", "false");

          const otherIcon = otherButton.querySelector(".faq-icon");
          if(otherIcon){
            otherIcon.textContent = "+";
          }
        }
      });

      if(!wasOpen){
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
        button.setAttribute("aria-expanded", "true");

        const icon = button.querySelector(".faq-icon");
        if(icon){
          icon.textContent = "−";
        }
      }
    });
  });
}

function initCart(){
  cartBadge();
  fillCitySelect(document.getElementById("coCity"));
  fillCartForm();
  
  document.getElementById("cartBtn")?.addEventListener("click",()=>{
    fillCartForm();
    renderCart();
    openDrawer("cartDrawer","cartOv");
  });
  document.getElementById("closeCart")?.addEventListener("click",closeDrawers);
  document.getElementById("cartOv")?.addEventListener("click",closeDrawers);
  renderCart();

  if(new URLSearchParams(location.search).get("cart")==="1"){
    fillCartForm();
    renderCart();
    openDrawer("cartDrawer","cartOv");
  }

  document.getElementById("emptyCartBtn")?.addEventListener("click",()=>{
    if(!confirm(t("t_confirm_empty")))return;
    saveCart([]);
    renderCart();
  });

  document.getElementById("checkoutBtn")?.addEventListener("click",checkout);
  document.getElementById("applyCouponBtn")?.addEventListener("click",applyCoupon);

  const saveCustomer = debounce(() => saveCartCustomer(), 500);
  
  ["#coName","#coPhone","#coEmail","#coCity","#coAddr","#coNotes"].forEach(selector=>{
    document.addEventListener("input",e=>{
      if(e.target.matches(selector)){saveCustomer();}
    });
    document.addEventListener("change",e=>{
      if(e.target.matches(selector)){saveCustomer();}
    });
  });

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn && !document.getElementById('trustBadges')) {
    const badges = document.createElement('div');
    badges.id = 'trustBadges';
    badges.style.cssText = 'display:flex; justify-content:center; gap:1rem; margin: 0.8rem 0 0.5rem; font-size: 0.75rem; color: var(--mut); flex-wrap: wrap;';
    badges.innerHTML = `
      <span style="display:flex; align-items:center; gap:4px;">🔒 دفع آمن</span>
      <span style="display:flex; align-items:center; gap:4px;">🔄 ضمان استرجاع</span>
      <span style="display:flex; align-items:center; gap:4px;">🚚 توصيل موثوق</span>
    `;
    checkoutBtn.parentNode.insertBefore(badges, checkoutBtn);
  }
}

function renderCart(){
  const c=getCart();
  const w=document.getElementById("cartItems");
  if(!w)return;

  if(!c.length){
    w.innerHTML=`
      <div class="empty" style="padding:2rem 0">
        ${t("cart_empty")}
        <br>
        <small>${t("cart_empty_sub")}</small>
      </div>
    `;
    updateTotals(c);
    return;
  }

  const frag = document.createDocumentFragment();
  
  c.forEach((it, i) => {
    const lineTotal=Number(it.price||0)*Number(it.qty||1);
    const item = document.createElement('div');
    item.className = 'citem';
    item.innerHTML = `
      <div class="citem-media">
        <img src="${it.img||''}" alt="${pname({name:it.name,nameEn:it.nameEn})}" loading="lazy" width="62" height="62" onerror="window.handleImageError(this, '${it.id}')">
      </div>
      <div class="citem-info">
        <h5>${pname({name:it.name,nameEn:it.nameEn})}</h5>
        <label class="cart-scent-picker">
          <span class="cart-scent-label">🌸 ${t("scent_lbl")}</span>
          <select class="cart-scent-select" data-i="${i}" aria-label="${t("scent_lbl")}">
            <option value="">${LANG==="en"?"Choose a scent":"اختار العطر"}</option>
            ${VELA_SCENTS.map(scent=>`
              <option value="${scent[0]}" ${String(it.scent||"")===String(scent[0])?"selected":""}>
                ${velaScentTr(scent[0])}
              </option>
            `).join("")}
          </select>
        </label>
        <div class="cs">${t("price_lbl")} <strong>${money(it.price)}</strong></div>
        <div class="cart-line-total">
          <span>${LANG==="en"?"Item total:":"إجمالي الصنف:"}</span>
          <strong>${money(lineTotal)}</strong>
        </div>
        <div class="qty">
          <button class="cq-minus" type="button" data-i="${i}" aria-label="minus">−</button>
          <b>${it.qty}</b>
          <button class="cq-plus" type="button" data-i="${i}" aria-label="plus">+</button>
        </div>
      </div>
      <button class="rm" type="button" data-i="${i}" aria-label="remove">✕</button>
    `;
    frag.appendChild(item);
  });

  w.innerHTML = '';
  w.appendChild(frag);

  const products = (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : [];
  const cartProductIds = c.map(it => it.id);
  
  const suggestedProduct = products.find(p => {
    if (!p || cartProductIds.includes(p.id)) return false;
    if (p.active === false) return false;
    
    const searchText = [
      p.name || "",
      p.nameEn || "",
      p.desc || "",
      p.descEn || "",
      p.cat || ""
    ].join(" ").toLowerCase();
    
    return searchText.includes("فواحة") || 
           searchText.includes("دولاب") || 
           searchText.includes("freshener") ||
           searchText.includes("closet");
  });
  
  if (suggestedProduct) {
    const suggestDiv = document.createElement('div');
    suggestDiv.className = 'cross-sell-box';
    suggestDiv.style.cssText = 'background:var(--c-warm); padding:1rem; border-radius:12px; margin-top:1rem; border:1px dashed var(--c-gold);';
    suggestDiv.innerHTML = `
      <div style="display:flex; align-items:center; gap:1rem;">
        <img src="${suggestedProduct.img || ''}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;" onerror="this.style.display='none'">
        <div style="flex:1">
          <div style="font-weight:700; font-size:0.9rem;">💡 أرشح لك فوحات شمع معطره لدولابك: ${pname(suggestedProduct)}</div>
          <div style="font-size:0.8rem; color:var(--mut); margin:0.2rem 0;">${money(suggestedProduct.price)} فقط</div>
          <button class="btn sm" id="addSuggestBtn" style="margin-top:0.3rem; width:100%;">أضف للسلة</button>
        </div>
      </div>
    `;
    w.appendChild(suggestDiv);
    setTimeout(() => {
      const btn = document.getElementById('addSuggestBtn');
      if(btn) {
        btn.addEventListener('click', () => {
          addToCart(suggestedProduct, {scent: suggestedProduct.scent || "بدون عطر", qty: 1});
          renderCart();
          cartBadge();
        });
      }
    }, 0);
  }

  const dfoot = document.querySelector("#cartDrawer .dfoot");
  if (dfoot) {
    if (!document.getElementById('qtyDiscountRow')) {
      const qtyRow = document.createElement('div');
      qtyRow.id = 'qtyDiscountRow';
      qtyRow.className = 'trow';
      qtyRow.style.cssText = 'display:none; margin-top:0.5rem; color:var(--ok);';
      qtyRow.innerHTML = `<span>🎁 خصم الكمية (3+ قطع من نفس المنتج):</span><b id="qtyDiscountVal">-0</b>`;
      const subRow = dfoot.querySelector('.trow'); 
      if (subRow) dfoot.insertBefore(qtyRow, subRow);
      else dfoot.appendChild(qtyRow);
    }

    if (!document.getElementById('freeShippingRow')) {
      const shipRow = document.createElement('div');
      shipRow.id = 'freeShippingRow';
      shipRow.className = 'trow';
      shipRow.style.cssText = 'display:none; margin-top:0.5rem; color:#27ae60; font-weight:700; background:#eafaf1; padding:0.5rem; border-radius:8px; text-align:center;';
      shipRow.innerHTML = `<span>🚚 مبروك! طلبك مؤهل لشحن مجاني</span>`;
      const totalRow = dfoot.querySelector('.trow.total');
      if (totalRow) totalRow.parentNode.insertBefore(shipRow, totalRow.nextSibling);
      else dfoot.appendChild(shipRow);
    }
  }

  w.addEventListener('click', handleCartClick);
  w.addEventListener('change', handleCartChange);
  
  updateTotals(c);
}
  function handleCartClick(e){
  const rmBtn = e.target.closest('.rm');
  const plusBtn = e.target.closest('.cq-plus');
  const minusBtn = e.target.closest('.cq-minus');
  
  const c = getCart();
  
  if(rmBtn){
    c.splice(+rmBtn.dataset.i, 1);
    saveCart(c);
    renderCart();
    cartBadge();
  } else if(plusBtn){
    const idx = +plusBtn.dataset.i;
    c[idx].qty = Number(c[idx].qty || 1) + 1;
    saveCart(c);
    renderCart();
  } else if(minusBtn){
    const idx = +minusBtn.dataset.i;
    c[idx].qty = Number(c[idx].qty || 1) - 1;
    if(c[idx].qty <= 0){ c.splice(idx, 1); }
    saveCart(c);
    renderCart();
  }
}

function handleCartChange(e){
  if(e.target.matches('.cart-scent-select')){
    const select = e.target;
    const idx = +select.dataset.i;
    const c = getCart();
    if(!c[idx]) return;
    c[idx].scent = select.value;
    saveCart(c);
    renderCart();
  }
}

function updateTotals(c){
  const sub=c.reduce((a,i)=>a+(Number(i.price||0)*Number(i.qty||1)),0);
  
  let qtyDiscount = 0;
  c.forEach(it => {
    if (Number(it.qty) >= 3) {
      qtyDiscount += (Number(it.price||0) * Number(it.qty||1) * 0.05);
    }
  });

  const couponDisc = (typeof calcCouponDiscount === "function") ? calcCouponDiscount(sub) : 0;
  const totalDisc = qtyDiscount + couponDisc;
  const total = Math.max(0, sub - totalDisc);

  if(document.getElementById("cartSub")){document.getElementById("cartSub").textContent=money(sub);}
  
  const qtyDiscRow = document.getElementById("qtyDiscountRow");
  if (qtyDiscRow) {
    if (qtyDiscount > 0) {
      qtyDiscRow.style.display = "flex";
      if(document.getElementById("qtyDiscountVal")) document.getElementById("qtyDiscountVal").textContent = "-" + money(qtyDiscount);
    } else {
      qtyDiscRow.style.display = "none";
    }
  }

  const dRow=document.getElementById("discountRow");
  if(dRow){dRow.style.display=couponDisc>0?"flex":"none";}
  if(document.getElementById("cartDiscount")){document.getElementById("cartDiscount").textContent="-"+money(couponDisc);}
  if(document.getElementById("couponCodeLbl")&&appliedCoupon){document.getElementById("couponCodeLbl").textContent=appliedCoupon.code;}
  
    // ✨ تكتيك زيادة المبيعات: شريط الشحن المجاني التفاعلي
  const freeShippingThreshold = 3000; // حد الشحن المجاني
  const remaining = Math.max(0, freeShippingThreshold - sub);
  const progressPercent = Math.min(100, (sub / freeShippingThreshold) * 100);

  const freeShipRow = document.getElementById("freeShippingRow");
  const shipNote = document.querySelector('.cart-shipping-note');
  
  if (freeShipRow && shipNote) {
    if (sub >= freeShippingThreshold) {
      // حالة تحقيق الشحن المجاني
      freeShipRow.style.display = "flex";
      freeShipRow.innerHTML = `<span style="color:#27ae60; font-weight:700;">🎉 مبروك! طلبك مؤهل لشحن مجاني</span>`;
      shipNote.style.display = "none";
    } else {
      // حالة عدم تحقيق الشحن المجاني (عرض الشريط التحفيزي)
      freeShipRow.style.display = "block";
      freeShipRow.style.background = "#fdf5ed";
      freeShipRow.style.padding = "1rem";
      freeShipRow.style.borderRadius = "12px";
      freeShipRow.style.border = "1px solid var(--c-gold)";
      
      freeShipRow.innerHTML = `
        <div style="text-align:center; margin-bottom:0.5rem; font-size:0.85rem; color:var(--dark);">
          أضف <strong style="color:#d4af37;">${money(remaining)}</strong> للحصول على <strong>شحن مجاني! 🚚</strong>
        </div>
        <div style="background:#e0d6c8; height:8px; border-radius:4px; overflow:hidden;">
          <div style="background:linear-gradient(90deg, #d4af37, #f9d877); height:100%; width:${progressPercent}%; transition:width 0.5s ease-in-out; border-radius:4px;"></div>
        </div>
      `;
      shipNote.style.display = "none"; // إخفاء ملاحظة الشحن العادية لاستبدالها بالشريط التحفيزي
    }
  }
  
  if(document.getElementById("cartTotal")){document.getElementById("cartTotal").textContent=money(total);}
}

function getSavedUser(){
  try{return JSON.parse(localStorage.getItem("vl_user")||"{}");}
  catch(e){return {};}
}

function fillCartForm(){
  const u=getSavedUser();
  if(document.getElementById("coName")){document.getElementById("coName").value=u.name||"";}
  if(document.getElementById("coPhone")){document.getElementById("coPhone").value=u.phone||"";}
  if(document.getElementById("coEmail")){document.getElementById("coEmail").value=u.email||"";}
  if(document.getElementById("coCity")){document.getElementById("coCity").value=u.city||"";}
  if(document.getElementById("coAddr")){document.getElementById("coAddr").value=u.addr||"";}
  if(document.getElementById("coNotes")){document.getElementById("coNotes").value=u.notes||"";}
}

function saveUserFromCart(name,phone,email,city,addr,notes=""){
  const old=getSavedUser();
  const u={...old,name,phone,email,city,addr,notes,orders:old.orders||0};
  try {
    localStorage.setItem("vl_user",JSON.stringify(u));
  } catch(e) {
    console.warn("⚠️ Failed to save user:", e);
  }
  if(document.getElementById("accName"))document.getElementById("accName").value=name;
  if(document.getElementById("accPhone"))document.getElementById("accPhone").value=phone;
  if(document.getElementById("accCity"))document.getElementById("accCity").value=city;
  if(document.getElementById("accAddr"))document.getElementById("accAddr").value=addr;
}

function saveCartCustomer(){
  const name=document.getElementById("coName")?.value.trim()||"";
  const phone=document.getElementById("coPhone")?.value.trim()||"";
  const email=document.getElementById("coEmail")?.value.trim()||"";
  const city=document.getElementById("coCity")?.value||"";
  const addr=document.getElementById("coAddr")?.value.trim()||"";
  const notes=document.getElementById("coNotes")?.value.trim()||"";
  const old=getSavedUser();
  try {
    localStorage.setItem("vl_user",JSON.stringify({...old,name,phone,email,city,addr,notes,orders:old.orders||0}));
  } catch(e) {
    console.warn("⚠️ Failed to save cart customer:", e);
  }
}

function genOrderId(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s="";
  for(let i=0;i<6;i++){s+=chars[Math.floor(Math.random()*chars.length)];}
  return "VL-"+s;
}

async function checkout(){
  const c=getCart();

  if(!c.length){toast(t("t_empty"));return;}

  const missingScent=c.some(it=>!it.scent||!String(it.scent).trim());
  if(missingScent){toast(t("t_scentwarn"));return;}

  const name=document.getElementById("coName")?.value.trim()||"";
  const phone=document.getElementById("coPhone")?.value.trim()||"";
  const email=document.getElementById("coEmail")?.value.trim()||"";
  const city=document.getElementById("coCity")?.value||"";
  const addr=document.getElementById("coAddr")?.value.trim()||"";
  const notes=document.getElementById("coNotes")?.value.trim()||"";

  if(!name){
    toast(LANG==="en"?"⚠️ Please enter your full name.":"⚠️ من فضلك اكتب الاسم بالكامل.");
    document.getElementById("coName")?.focus();return;
  }
  if(!phone){
    toast(LANG==="en"?"⚠️ Please enter your mobile number.":"⚠️ من فضلك اكتب رقم الموبايل.");
    document.getElementById("coPhone")?.focus();return;
  }
  if(!addr){
    toast(LANG==="en"?"⚠️ Please enter the detailed address.":"⚠️ من فضلك اكتب العنوان بالتفصيل.");
    document.getElementById("coAddr")?.focus();return;
  }

  const waWindow = window.open("", "_blank");

  saveUserFromCart(name,phone,email,city,addr,notes);

  const orderId=genOrderId();
  const subTotal=c.reduce((a,i)=>a+(Number(i.price||0)*Number(i.qty||1)),0);
  
  let qtyDiscount = 0;
  c.forEach(it => {
    if (Number(it.qty) >= 3) {
      qtyDiscount += (Number(it.price||0) * Number(it.qty||1) * 0.05);
    }
  });
  
  const couponDiscount=(typeof calcCouponDiscount==="function")?calcCouponDiscount(subTotal):0;
  const totalDiscount = qtyDiscount + couponDiscount;
  const total=Math.max(0,subTotal-totalDiscount);
  
  if (typeof fbq === "function") {
    fbq("track", "InitiateCheckout", {
      value: total,
      currency: "EGP",
      num_items: c.length
    });
  }
  
  let userId = null;
  let userEmail = null;
  if(window.FB && window.FB.auth && window.FB.auth.currentUser){
    userId = window.FB.auth.currentUser.uid;
    userEmail = window.FB.auth.currentUser.email;
  }

  let msg=`${t("wa_head")}\n`;
  msg+=`${t("wa_order")} ${orderId}\n`;
  msg+=`━━━━━━━━━━━━━━━━━━━━\n\n`;

  c.forEach(it=>{
    const qty=Number(it.qty||1);
    const unitPrice=Number(it.price||0);
    const itemTotal=unitPrice*qty;
    msg+=`${t("wa_item")} ${pname({name:it.name,nameEn:it.nameEn})}\n`;
    msg+=`${t("wa_scent")}: ${velaScentTr(it.scent)}\n`;
    msg+=`${LANG==="en"?"Quantity:":"الكمية:"} ${qty}\n`;
    msg+=`${LANG==="en"?"Unit price:":"سعر الوحدة:"} ${money(unitPrice)}\n`;
    msg+=`${LANG==="en"?"Item total:":"إجمالي الصنف:"} ${money(itemTotal)}\n\n`;
  });

  msg+=`━━━━━━━━━━━━━━━━━━━━\n`;
  
  if(qtyDiscount > 0){
    msg+=`🎁 خصم الكمية (3+ قطع): -${money(qtyDiscount)}\n`;
  }
  if(couponDiscount>0&&appliedCoupon){
    msg+=`🎟️ كوبون ${appliedCoupon.code}: -${money(couponDiscount)}\n`;
  }
  msg+=`🎁 هدية ليك: كود THANKS10 لخصم 10% على طلبك الجاي\n`;
  
  msg+=`${waTotalLabel()} ${money(total)}\n`;
  msg+=`💳 طريقة الدفع: سيتم إرسال تفاصيل الدفع المتاحة (InstaPay / فودافون كاش / تحويل بنكي) عبر الواتساب فور تأكيد الطلب.\n`;
  
  msg+=`${t("ship_note")}\n\n`;
  msg+=`${t("wa_name")} ${name}\n`;
  msg+=`${t("wa_phone")} ${phone}\n`;
  if(email){msg+=`${LANG==="en"?"Email:":"الإيميل:"} ${email}\n`;}
  if(city){msg+=`${t("wa_city")} ${city}\n`;}
  msg+=`${t("wa_addr")} ${addr}\n`;
  if(notes){msg+=`${t("wa_notes")} ${notes}\n`;}

  const trackingData = {
    utm_source: localStorage.getItem('vl_utm_source') || '',
    utm_medium: localStorage.getItem('vl_utm_medium') || '',
    utm_campaign: localStorage.getItem('vl_utm_campaign') || '',
    utm_content: localStorage.getItem('vl_utm_content') || '',
    fbclid: localStorage.getItem('vl_fbclid') || '',
    gclid: localStorage.getItem('vl_gclid') || '',
    ttclid: localStorage.getItem('vl_ttclid') || ''
  };

  const orderData={
    orderId,
    userId,
    userEmail,
    customer:{name,phone,email,city,address:addr},
    name,phone,email,city,address:addr,notes,
    products:c.map(it=>({
      id:it.id,name:it.name,nameEn:it.nameEn||"",
      scent:it.scent,scentName:velaScentTr(it.scent),
      quantity:Number(it.qty||1),price:Number(it.price||0),
      total:Number(it.price||0)*Number(it.qty||1),img:it.img||""
    })),
    items:c,
    total,
    productsTotal:subTotal,
    discount: totalDiscount,
    qtyDiscount: qtyDiscount,
    couponDiscount: couponDiscount,
    couponCode:appliedCoupon?appliedCoupon.code:"",
    paymentMethod:"WhatsApp Confirmation",
    shippingPayment:"Cash to courier",
    shippingIncluded: subTotal >= 3000,
    status:"قيد المراجعة",statusEn:"Under Review",
    tracking: trackingData,
    createdAt:Date.now(),
    orderDate:new Date().toISOString()
  };

  let savedToFirebase = false;
  let retries = 3;
  while (retries > 0 && !savedToFirebase) {
    try {
      await DB.add("orders", orderData);
      savedToFirebase = true;
    } catch(e) {
      console.warn(`⚠️ Order save attempt failed (${retries} left):`, e);
      retries--;
      if (retries > 0) await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  if (!savedToFirebase) {
    console.error("❌ Failed to save order to Firebase after retries");
  }
  
  try {
    await decrementStock(c);
  } catch(e) {
    console.warn("⚠️ Stock decrement failed:", e);
  }
  
  try {
    if (typeof consumeCoupon === "function") consumeCoupon();
  } catch(e) {
    console.warn("⚠️ Coupon consume failed:", e);
  }
  
  const u=getSavedUser();
  u.orders=(u.orders||0)+1;
  u.name=name;u.phone=phone;u.email=email;u.city=city;u.addr=addr;u.notes=notes;
  try {
    localStorage.setItem("vl_user",JSON.stringify(u));
  } catch(e) {
    console.warn("⚠️ Failed to save user:", e);
  }
  const oc=document.getElementById("ordCount");
  if(oc){oc.textContent=u.orders;}

  if(userId && window.FB && window.FB.db){
    try{
      const { doc, updateDoc, increment } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const userRef = doc(window.FB.db, "users", userId);
      await updateDoc(userRef, {
        ordersCount: increment(1),
        totalSpent: increment(total)
      });
    }catch(err){
      console.warn("⚠️ Failed to update user order count:", err);
    }
  }

  saveCart([]);
  renderCart();
  cartBadge();
  
  let emailSent = false;
  try {
    emailSent = await sendOrderConfirmationEmail(orderData);
  } catch (err) {
    console.warn("⚠️ Email notification failed:", err);
  }
  
  if (emailSent) {
    toast(LANG==="en" ? "✅ Order placed! Check your email." : "✅ تم إرسال الطلب! تم إرسال تأكيد للأدمن.");
  } else {
    toast(t("t_order"));
  }
  
  openWhatsAppConfirmation(orderData, waWindow);

  try {
    if (typeof gtag === "function") {
      gtag("event", "purchase", {
        transaction_id: orderId,
        value: total,
        currency: "EGP",
        items: c.map(it => ({
          item_id: it.id,
          item_name: it.name,
          price: it.price,
          quantity: it.qty
        }))
      });
    }
    if (typeof fbq === "function") {
      fbq("track", "Purchase", {
        value: total,
        currency: "EGP",
        content_ids: c.map(it => it.id),
        num_items: c.length
      });
    }
    ['vl_utm_source','vl_utm_medium','vl_utm_campaign','vl_utm_content','vl_fbclid','vl_gclid','vl_ttclid'].forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Tracking event fire failed:", e);
  }
}

function waTotalLabel(){
  if(I18N&&I18N[LANG]&&I18N[LANG].wa_total){return I18N[LANG].wa_total;}
  return LANG==="en"?"💰 Products Total:":"💰 إجمالي المنتجات:";
}

const WEB3FORMS_KEY = "a23e1d50-37ee-4aec-a465-aeeb819c02a1";

async function sendOrderConfirmationEmail(orderData) {
  try {
    const itemsText = (orderData.items || []).map(item => {
      const name = item.name || item.title || "منتج";
      const qty = item.qty || 1;
      const price = Number(item.price || 0) * qty;
      const scent = item.scent ? ` (${velaScentTr(item.scent)})` : "";
      return `• ${name}${scent} × ${qty} = ${price} جنيه`;
    }).join("\n") || "منتجات متعددة";
    
    let discountText = "";
    if(orderData.qtyDiscount > 0) discountText += `🎁 خصم الكمية: -${orderData.qtyDiscount} جنيه\n`;
    if(orderData.couponDiscount > 0) discountText += `🎟️ كوبون ${orderData.couponCode}: -${orderData.couponDiscount} جنيه\n`;

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `🛒 طلب جديد من VelaLight - ${orderData.orderId}`,
        from_name: "VelaLight Store",
        reply_to: orderData.email || orderData.phone || "",
        message: `
═══════════════════════════════════════
🛒 طلب جديد من موقع VelaLight
═══════════════════════════════════════

📋 رقم الطلب: ${orderData.orderId}
📅 التاريخ: ${new Date().toLocaleString("ar-EG")}

═══════════════════════════════════════
👤 بيانات العميل:
═══════════════════════════════════════
الاسم: ${orderData.name}
الموبايل: ${orderData.phone}
الإيميل: ${orderData.email || "غير متوفر"}
المدينة: ${orderData.city || "غير محدد"}
العنوان: ${orderData.address}
ملاحظات: ${orderData.notes || "لا توجد"}

═══════════════════════════════════════
🛍️ المنتجات:
═══════════════════════════════════════
${itemsText}

═══════════════════════════════════════
💰 الإجمالي: ${orderData.total} جنيه
${discountText ? discountText : ""}
${orderData.shippingIncluded ? "🚚 الشحن: مجاني\n" : ""}
═══════════════════════════════════════

═══════════════════════════════════════
💳 طريقة الدفع:
═══════════════════════════════════════
• سيتم إرسال تفاصيل الدفع (InstaPay / فودافون كاش / تحويل بنكي) للعميل عبر الواتساب.
• الشحن: كاش للمندوب عند الاستلام.
═══════════════════════════════════════

⏳ الحالة: قيد المراجعة

— VelaLight Admin Panel
        `.trim()
      })
    });
    
    if (response.ok) {
      console.log("✅ Admin notification sent");
      return true;
    } else {
      console.error("Email failed:", await response.text());
      return false;
    }
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
}

function openWhatsAppConfirmation(orderData, waWindow) {
  if (!CFG || !CFG.WHATSAPP) return;
  
  const whatsappNumber = String(CFG.WHATSAPP).replace(/\D/g, "");
  
  const itemsSummary = (orderData.items || [])
    .map(i => {
      const name = i.name || i.title || "منتج";
      const qty = i.qty || 1;
      const scent = i.scent ? ` (${velaScentTr(i.scent)})` : "";
      return `• ${name}${scent} × ${qty}`;
    })
    .join("\n");
  
  let discountText = "";
  if(orderData.qtyDiscount > 0) discountText += `🎁 خصم الكمية: -${orderData.qtyDiscount} جنيه\n`;
  if(orderData.couponDiscount > 0) discountText += `🎟️ كوبون ${orderData.couponCode}: -${orderData.couponDiscount} جنيه\n`;

  const message = `✨ أهلاً VelaLight!

تم تقديم طلبي بنجاح 🕯️

📋 رقم الطلب: ${orderData.orderId}
👤 الاسم: ${orderData.name}
💰 الإجمالي: ${orderData.total} جنيه
${discountText}
${orderData.shippingIncluded ? "🚚 الشحن: مجاني\n" : ""}
📍 العنوان:
${orderData.city || ""} - ${orderData.address}

🛍️ المنتجات:
${itemsSummary}

🎁 هدية: كود THANKS10 لخصم 10% على طلبك الجاي

⏳ في انتظار إرسال تفاصيل الدفع وتأكيد الطلب 📱

شكراً لكم!`;
  
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  if (waWindow && !waWindow.closed) {
    waWindow.location.href = waUrl;
  } else {
    window.open(waUrl, "_blank");
  }
}

/* ═══════════════════════════════════════════════════════════
   ✨ اصلاح جذري وبسيط لحساب المستخدم (بدون تعديل HTML)
   ═══════════════════════════════════════════════════════════ */
function initAccount() {
  document.getElementById("accBtn")?.addEventListener("click", async () => {
    const isFirebaseLogged = window.FB && window.FB.auth && window.FB.auth.currentUser;

    const fieldsToToggle = ["accName", "accPhone", "accCity", "accAddr", "saveAccBtn"];
    const accSub = document.querySelector('[data-i18n="acc_sub"]');
    let welcomeMsg = document.getElementById("accWelcomeMsg");

    if (!isFirebaseLogged) {
      fieldsToToggle.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "";
      });
      if (accSub) accSub.style.display = "";
      if (welcomeMsg) welcomeMsg.style.display = "none";
      
      if (typeof openAuthModal === "function") {
        openAuthModal();
      } else {
        toast("⚠️ يرجى تسجيل الدخول أولاً");
      }
      return;
    }

    fieldsToToggle.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
    if (accSub) accSub.style.display = "none";

    if (!welcomeMsg) {
      welcomeMsg = document.createElement("div");
      welcomeMsg.id = "accWelcomeMsg";
      welcomeMsg.style.cssText = "background:var(--c-warm); padding:1rem; border-radius:12px; margin-bottom:1rem; text-align:center; border:1px solid var(--line);";
      const form = document.querySelector("#accOv .co-form");
      if (form) form.insertBefore(welcomeMsg, form.firstChild);
    }
    welcomeMsg.style.display = "block";

    try {
      let userData = null;
      if (typeof VL_GetCurrentUser === "function") {
        userData = await VL_GetCurrentUser();
      }
      
      if (!userData) {
        const localUser = getSavedUser();
        const fbUser = window.FB.auth.currentUser;
        userData = {
          name: localUser?.name || fbUser?.displayName || "عميلنا العزيز",
          email: fbUser?.email || localUser?.email || "",
          phone: localUser?.phone || "",
          ordersCount: localUser?.orders || 0
        };
      }

      welcomeMsg.innerHTML = `
        <div style="font-weight:700; color:var(--gold2); font-size:1.1rem; margin-bottom:0.3rem;">
          أهلاً بك، ${userData.name || "عميلنا العزيز"} 👋
        </div>
        <div style="font-size:0.85rem; color:var(--mut); word-break:break-all;">
          ${userData.email || ""}
        </div>
      `;

      if (document.getElementById("ordCount")) {
        document.getElementById("ordCount").textContent = userData.ordersCount || 0;
      }
      
      localStorage.setItem("vl_user", JSON.stringify({
        uid: window.FB.auth.currentUser.uid,
        email: userData.email || "",
        name: userData.name || "",
        phone: userData.phone || "",
        orders: userData.ordersCount || 0
      }));

    } catch (error) {
      console.warn("⚠️ Error loading user data:", error);
      const fbUser = window.FB.auth.currentUser;
      welcomeMsg.innerHTML = `
        <div style="font-weight:700; color:var(--gold2); font-size:1.1rem; margin-bottom:0.3rem;">
          أهلاً بك 👋
        </div>
        <div style="font-size:0.85rem; color:var(--mut);">
          ${fbUser?.email || ""}
        </div>
      `;
    }
    
    openDrawer("accOv");
  });

  document.getElementById("closeAcc")?.addEventListener("click", () => closeModal("accOv"));
  document.getElementById("accOv")?.addEventListener("click", e => {
    if (e.target.id === "accOv") { closeModal("accOv"); }
  });

  document.getElementById("saveAccBtn")?.addEventListener("click", async () => {
    const name = document.getElementById("accName")?.value.trim();
    const phone = document.getElementById("accPhone")?.value.trim();
    if (!name || !phone) { toast("⚠️ اكتب الاسم ورقم الموبايل."); return; }
    
    const old = getSavedUser();
    try {
      localStorage.setItem("vl_user", JSON.stringify({ ...old, name, phone, orders: old.orders || 0 }));
    } catch (e) { console.warn("⚠️ Failed to save account:", e); }
    
    if (typeof fillCartForm === "function") fillCartForm();
    toast("✅ تم حفظ البيانات بنجاح");
    closeModal("accOv");
  });

  document.getElementById("guestLoginBtn")?.addEventListener("click", () => {
    if (typeof openAuthModal === "function") {
      closeModal("accOv");
      openAuthModal();
    } else {
      toast("⚠️ يرجى تسجيل الدخول من الصفحة الرئيسية");
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    if (window.FB && window.FB.auth && typeof VL_Logout === "function") {
      await VL_Logout();
    }
    try {
      localStorage.removeItem("vl_user");
    } catch (e) {
      console.warn("⚠️ Failed to clear user:", e);
    }
    toast("✅ تم تسجيل الخروج بنجاح");
    closeModal("accOv");
    setTimeout(() => window.location.reload(), 500); 
  });
}
   
async function loadUserData(isLoggedIn) {
  if (isLoggedIn && typeof VL_GetCurrentUser === "function") {
    const userData = await VL_GetCurrentUser();
    if (userData) {
      const displayNameEl = document.getElementById("displayName");
      if(displayNameEl) displayNameEl.textContent = userData.name || "عميلنا العزيز";
      const displayEmailEl = document.getElementById("displayEmail");
      if(displayEmailEl) displayEmailEl.textContent = userData.email || "غير متوفر";
      const displayPhoneEl = document.getElementById("displayPhone");
      if(displayPhoneEl) displayPhoneEl.textContent = userData.phone || "غير متوفر";
      const ordCountLoggedInEl = document.getElementById("ordCountLoggedIn");
      if(ordCountLoggedInEl) ordCountLoggedInEl.textContent = userData.ordersCount || 0;
    }
  }
}

function fillCitySelect(sel){
  if(!sel)return;
  const arr=LANG==="en"?GOVS_EN:GOVS;
  sel.innerHTML=`<option value="">${t("ph_city")}</option>`+
    arr.map(g=>`<option value="${g}">${g}</option>`).join("");
}

function initSearch(){
  document.getElementById("searchBtn")?.addEventListener("click",()=>{
    openDrawer("searchOv");
    setTimeout(()=>{document.getElementById("searchInput")?.focus();},200);
  });
  document.getElementById("closeSearch")?.addEventListener("click",()=>closeModal("searchOv"));
  document.getElementById("searchOv")?.addEventListener("click",e=>{
    if(e.target.id==="searchOv"){closeModal("searchOv");}
  });
  
  const debouncedSearch = debounce((q) => performSearch(q), 200);
  
  document.getElementById("searchInput")?.addEventListener("input",e=>{
    const q=e.target.value.trim().toLowerCase();
    debouncedSearch(q);
  });
}

function performSearch(q){
  const w=document.getElementById("searchResults");
  if(!w)return;
  if(!q){w.innerHTML="";return;}
  
  const products = (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : [];
  const res=products.filter(p=>{
    if(!p) return false;
    const hay=(p.name+" "+(p.nameEn||"")+" "+(p.desc||"")+" "+(p.descEn||"")+" "+cat(p.cat)).toLowerCase();
    return hay.includes(q);
  }).slice(0,8);
  
  w.innerHTML=res.map(p=>`
    <div class="sr-item" data-id="${p.id}">
      <img src="${imgOf(p)}" alt="" loading="lazy" width="50" height="50" onerror="window.handleImageError(this, '${p.id}')">
      <div><b>${pname(p)}</b><br><small>${money(p.price)}</small></div>
    </div>
  `).join("");
  
  w.querySelectorAll(".sr-item").forEach(it=>{
    it.addEventListener("click",()=>{location.href="product.html?p="+it.dataset.id;});
  });
}

function initChat(){
  document.getElementById("chatFab")?.addEventListener("click",()=>{document.getElementById("chatOv")?.classList.toggle("open");});
  document.getElementById("closeChat")?.addEventListener("click",()=>{document.getElementById("chatOv")?.classList.remove("open");});
  initChatWelcome();
  const quick=[
    [t("q_gift"),"a_gift"],
    [t("q_relax"),"a_relax"],
    [t("q_scents"),"a_scents"],
    [t("q_ship"),"a_ship"],
    [t("q_bride"),"a_bride"]
  ];
  const qw=document.getElementById("chatQuick");
  if(qw){
    qw.innerHTML=quick.map(q=>`<button type="button" data-a="${q[1]}">${q[0]}</button>`).join("");
    qw.querySelectorAll("button").forEach(b=>{
      b.addEventListener("click",()=>{
        addMsg(b.textContent,"user");
        setTimeout(()=>{addMsg(t(b.dataset.a),"bot");},400);
      });
    });
  }
}

function initChatWelcome(){
  const w=document.getElementById("chatMsgs");
  if(w&&!w.children.length){addMsg(t("chat_welcome"),"bot");}
}

function addMsg(txt,who){
  const w=document.getElementById("chatMsgs");
  if(!w)return;
  const d=document.createElement("div");
  d.className="msg "+who;
  d.textContent=txt;
  w.appendChild(d);
  w.scrollTop=w.scrollHeight;
}

function initNav(){
  document.getElementById("navToggle")?.addEventListener("click",()=>{
    document.getElementById("mnav")?.classList.toggle("open");
    document.getElementById("ovl")?.classList.toggle("open");
  });
  document.getElementById("ovl")?.addEventListener("click",closeDrawers);
  document.querySelectorAll(".mnav a").forEach(a=>{
    a.addEventListener("click",()=>{
      document.getElementById("mnav")?.classList.remove("open");
      document.getElementById("ovl")?.classList.remove("open");
    });
  });
  document.querySelectorAll("[data-cat]").forEach(a=>{
    if(a.closest(".mnav")||a.closest(".mainnav")||a.closest("footer")){
      a.addEventListener("click",()=>{
        setTimeout(()=>{
          const chip=document.querySelector(`#chips .chip[data-cat="${a.dataset.cat}"]`);
          if(chip){chip.click();}
        },100);
      });
    }
  });
}

function openDrawer(id,ovlId){
  document.getElementById(id)?.classList.add("open");
  if(ovlId){document.getElementById(ovlId)?.classList.add("open");}
  document.body.style.overflow = 'hidden';
}
function closeDrawers(){
  document.querySelectorAll(".drawer,.ovl").forEach(el=>el.classList.remove("open"));
  document.body.style.overflow = '';
}
function closeModal(id){
  document.getElementById(id)?.classList.remove("open");
  const stillOpen = document.querySelector('.drawer.open, .ovl.open');
  if(!stillOpen){
    document.body.style.overflow = '';
  }
}

function stockBadge(p){
  if(!p) return "";
  // إذا كان المخزون غير محدد أو null أو فارغ، لا تظهر رسالة (يعني غير محدود)
  if(p.stock === undefined || p.stock === null || p.stock === "") return "";
  
  const s = Number(p.stock);
  if(isNaN(s)) return "";
  
  // حالة المخزون الصفر
  if(s === 0) return `<span class="p-badge" style="background:#e74c3c">نفدت الكمية</span>`;
  
  // حالة المخزون المتبقي (أقل من أو يساوي 5)
  if(s <= 5) return `<span class="p-badge" style="background:#e67e22">باقي ${s} فقط</span>`;
  
  // حالة المخزون المتوفر (أكثر من 5)
  return `<span class="p-badge" style="background:#27ae60">متوفر</span>`;
}
async function decrementStock(items){
  if(!window.FB || !window.FB.db) return;
  
  const { runTransaction, doc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const db = window.FB.db;
  const products = (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : [];
  
  for(const it of items){
    const p = products.find(x => x.id === it.id);
    if(!p) continue;
    
    if(p.stock === undefined || p.stock === null || p.stock === "" || isNaN(Number(p.stock))) continue;
    
    const docId = p._fid || p.id;
    const docRef = doc(db, "products", docId);
    const qtyToSubtract = Number(it.qty || 1);
    
    try {
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(docRef);
        
        if (!sfDoc.exists()) {
          throw new Error("Product document does not exist!");
        }
        
        const currentStock = Number(sfDoc.data().stock || 0);
        const newStock = Math.max(0, currentStock - qtyToSubtract);
        
        transaction.update(docRef, { stock: newStock });
      });
      
      console.log(`✅ Stock updated for ${p.id}: ${qtyToSubtract} subtracted`);
    } catch(e) {
      console.warn("⚠️ stock transaction failed for", p.id, e);
    }
  }
}

let appliedCoupon=null;

function calcCouponDiscount(sub){
  if(!appliedCoupon)return 0;
  let d=0;
  if(appliedCoupon.type==="percent"){
    d=sub*(Number(appliedCoupon.value||0)/100);
  }else{
    d=Number(appliedCoupon.value||0);
  }
  return Math.min(sub,Math.round(d));
}

async function applyCoupon(){
  const code=(document.getElementById("couponInput")?.value||"").trim().toUpperCase();
  if(!code){toast("⚠️ اكتب كود الكوبون");return;}
  
  let list=[];
  try{list=await window.FB.list("coupons")||[];}
  catch(e){toast("⚠️ تعذر التحقق من الكوبون");return;}
  
  const c=list.find(x=>(x.code||"").toUpperCase()===code);
  if(!c){toast("❌ كود الكوبون غير صحيح");return;}
  if(c.active===false){toast("❌ الكوبون ده متوقف");return;}
  if(c.expiresAt&&Date.now()>Number(c.expiresAt)){toast("⚠️ الكوبون منتهي الصلاحية");return;}
  if(c.maxUses&&Number(c.usedCount||0)>=Number(c.maxUses)){toast("⚠️ انتهت استخدامات الكوبون");return;}
  
  appliedCoupon={...c,_fid:c.id};
  const sub=getCart().reduce((a,i)=>a+(Number(i.price||0)*Number(i.qty||1)),0);
  toast("🎟️ تم تطبيق الكوبون! وفرت "+money(calcCouponDiscount(sub)));
  renderCart();
}

async function consumeCoupon(){
  if(!appliedCoupon||!appliedCoupon._fid)return;
  if(window.FB&&typeof window.FB.update==="function"){
    try{
      await window.FB.update("coupons",appliedCoupon._fid,{
        usedCount:Number(appliedCoupon.usedCount||0)+1
      });
    }catch(e){console.warn("⚠️ coupon update failed",e);}
  }
  appliedCoupon=null;
  if(document.getElementById("couponInput"))document.getElementById("couponInput").value="";
}

/* ═══ REVIEWS COUNT HELPER ═══ */
window.getReviewsCount = function() {
  if (typeof REVIEWS_IMAGES !== 'undefined' && Array.isArray(REVIEWS_IMAGES)) {
    return REVIEWS_IMAGES.length;
  }
  return 0;
};

window.updateReviewsCount = function() {
  const el = document.getElementById('totalReviewsCount');
  if (el) {
    const count = window.getReviewsCount();
    el.textContent = count > 0 ? count + '+' : '0';
  }
};

if (typeof window.addToCart === "function") {
  const _originalAddToCart = window.addToCart;
  window.addToCart = function(product, options) {
    const result = _originalAddToCart(product, options);
    if (result && typeof fbq === "function") {
      fbq("track", "AddToCart", {
        content_ids: [product.id],
        content_name: product.name,
        content_category: product.cat,
        value: Number(product.price) * Number(options?.qty || 1),
        currency: "EGP"
      });
    }
    return result;
  };
}

/* ═══ تعديل: دالة الاشتراك ═══ */
async function subscribeUser(email, phone) {
  if (!email && !phone) {
    toast("⚠️ من فضلك اكتب الإيميل أو رقم الهاتف");
    return false;
  }
  try {
    if (typeof DB !== "undefined" && typeof DB.add === "function") {
      await DB.add("subscribers", {
        email: email || "",
        phone: phone || "",
        createdAt: Date.now(),
        source: window.location.pathname
      });
      toast("✅ تم الاشتراك بنجاح! شكراً لانضمامك لعائلة VelaLight 💛");
      return true;
    } else {
      // تخزين محلي إذا لم يكن Firebase جاهزاً
      let subs = JSON.parse(localStorage.getItem("vl_subscribers") || "[]");
      subs.push({ email, phone, createdAt: Date.now() });
      localStorage.setItem("vl_subscribers", JSON.stringify(subs));
      toast("✅ تم الاشتراك بنجاح (محلياً) 💛");
      return true;
    }
  } catch(e) {
    console.error("Subscription error:", e);
    toast("⚠️ حدث خطأ أثناء الاشتراك، حاول مرة أخرى");
    return false;
  }
}

/* ═══ تعديل: تهيئة نموذج الاشتراك ═══ */
function initSubscriptionForm() {
  const form = document.getElementById("subscribeForm");
  if (!form) return;
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("subEmail")?.value.trim() || "";
    const phone = document.getElementById("subPhone")?.value.trim() || "";
    const success = await subscribeUser(email, phone);
    if (success) {
      form.reset();
      const msg = document.getElementById("subMsg");
      if (msg) {
        msg.textContent = "✅ شكراً لك! تم الاشتراك بنجاح.";
        msg.style.display = "block";
        setTimeout(() => { msg.style.display = "none"; }, 5000);
      }
    }
  });
}

/* ═══ EXPOSE GLOBALLY ═══ */
window.renderProductsPage = renderProductsPage;
window.renderReviewsPage = renderReviewsPage;
window.getWishlist = getWishlist;
window.toggleWishlist = toggleWishlist;
window.isInWishlist = isInWishlist;
window.WISHLIST_KEY = WISHLIST_KEY;
window.updateReviewsCount = updateReviewsCount;
window.getReviewsCount = getReviewsCount;
window.subscribeUser = subscribeUser; // تصدير الدالة للاستخدام العام

})();
