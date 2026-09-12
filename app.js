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
reviews_quote_author: "— واحد من عملائنا",
reviews_cta_title: "جاهز تنضم لعائلة VelaLight؟ 🕯️",
reviews_cta_sub: "اختار شمعتك الفاخرة واصنع لحظتك الخاصة",
reviews_cta_btn: "تسوق الآن 🛍️",
foot_wishlist: "❤️ المفضلة",
foot_orders: "📦 طلباتي",
      
          /* Shipping & Payment */
      ship_note:
        "🚚 الشحن: يُدفع كاش لمندوب الشحن عند الاستلام.",

      pay_products_note:
        "💳 سيتم إرسال تفاصيل الدفع المتاحة (InstaPay / فودافون كاش / أورنج كاش / تحويل بنكي) عبر الواتساب فور تأكيد الطلب.",

      pay_title:
        "InstaPay / فودافون كاش / أورنج كاش",

      paymethod_d:
        "قيمة المنتجات تُدفع مقدماً (تحويل) عند تأكيد الطلب.",

      /* Scent */
      t_scentwarn:
        "⚠️ من فضلك اختر العطر أولاً.",

      quick_add_scent:
        "🌸 اختر العطر",

      quick_add_qty:
        "الكمية",

      quick_add_add:
        "🛍️ أضف للسلة",

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
        "🌸 اختر العطر:",

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
        "🛍️ أضف للسلة",

      pd_buy:
        "💬 اطلب عبر واتساب",


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
        "اقرأ الكل",

      pd_first_review:
        "كن أول من يشارك رأيه",


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
        "✨ جربت سحرنا؟",

      reviews_cta_link:
        "ابعتلنا رأيك على الواتساب",
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
  "نساعدك تختار الرائحة والتفاصيل المناسبة.",

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
        "تختلف مدة الاحتراق حسب وزن وحجم كل شمعة، وستجد التفاصيل في وصف المنتج. ولأفضل نتيجة، عند الاستخدام الأول اترك الشمعة حتى يذوب سطح الشمع بالكامل ويصل إلى الحواف لتجنب تكون الأنفاق والحصول على احتراق متساوٍ.",

      faq6q:
        "كيف أختار العطر المناسب؟",

      faq6a:
        "لدينا تشكيلة متنوعة من العطور الفاخرة. وإذا كنت محتار، تواصل معنا عبر WhatsApp وسنساعدك في اختيار العطر المناسب حسب ذوقك والمناسبة والأجواء التي تفضلها.",

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
      products_sub: "اكتشف تشكيلتنا الكاملة من الشموع الفاخرة",
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
      cart_empty_sub: "أضف منتجاتك المفضلة",

      /* ═══ Reviews Page ═══ */
      reviews_page_title: "كل آراء عملائنا",
      reviews_page_sub: "شوف تجارب العملاء الحقيقية مع منتجات VelaLight",
      reviews_verified: "عميل موثّق",
      reviews_customer: "عميل سعيد",
      reviews_share_your: "شاركنا رأيك ✨",
      reviews_share_sub: "جرب منتج من VelaLight؟ اكتبلنا تجربتك",

      /* ═══ Products Page ═══ */
      prod_word: "منتج",
      no_products: "لا توجد منتجات",

      /* ═══ Craftsmanship (Behind the Scenes) ═══ */
      craft_kick: "Behind the Scenes",
      craft_title: "إيد مصرية.. تفاصيل ملهاش حدود",
      craft_desc: "شوف ازاي بنصنع كل قطعة بحب ودقة عشان توصلك بالشكل اللي يليق بيك",
      craft_loading: "⏳ جاري التحميل...",
      craft_fallback1_title: "نخلط الزيوت بعناية",
      craft_fallback1_desc: "نستخدم أفضل الزيوت الطبيعية لضمان رائحة تدوم طويلاً",
      craft_fallback2_title: "تغليف فاخر جاهز للإهداء",
      craft_fallback2_desc: "كل قطعة بتتغلف بإيدينا عشان تكون مميزة",
      craft_fallback3_title: "فحص دقيق لكل قطعة",
      craft_fallback3_desc: "نتأكد من الجودة قبل ما توصل لباب بيتك",

      /* ═══ Reviews Enhanced ═══ */
      rev_see_all: "📸 شوف كل التجارب",
      rev_stats_label: "عميل وثق فينا",
      rev_stats_rating: "تقييم 5 نجوم",
      rev_loading: "⏳ جاري تحميل التجارب...",

      /* ═══ FAQ & Misc ═══ */
      faq_kick: "FAQ",
      faq_sub: "كل ما تحتاج معرفته عن الطلب، الشحن، الشموع والعطور.",
      foot_designer_label: "صُمم وتطوير بعناية بواسطة",
      brand_kick: "The VelaLight Touch",
      scents_kick: "Signature Scents",
      prod_kick: "Our Collection",
      prod_sub: "اكتشف أحدث تشكيلتنا من الشموع الفاخرة",
      prod_see_all: "🕯️ استعرض كل المنتجات",
      about_kick: "Our Story",
      ed_kick: "A Moment of Luxury",
      ed_h2: "لحظاتٌ تُحفر في الذاكرة",
      ed_p: "كل شمعة من VelaLight ليست مجرد إضاءة… هي لحظة كاملة. لحظة هدوء، لحظة رومانسية، لحظة فرح. اصنع ذكرياتك الخاصة مع عطورنا الفاخرة.",
      ed_cta: "ابدأ رحلتك ✨",

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
        " Payment details (InstaPay / Vodafone Cash / Orange Cash / Bank Transfer) will be sent via WhatsApp upon order confirmation.",

      pay_title:
        "InstaPay / Vodafone Cash / Orange Cash",

      paymethod_d:
        "Upfront transfer (InstaPay / Vodafone Cash / Orange Cash), shipping cash on delivery.",


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
      // ✅ renderChips بتقرأ التصنيف من URL تلقائياً
      renderChips();
      
      if (typeof renderProductsPage === "function") {
        renderProductsPage();
      } else {
        renderProducts();
      }
      // ← شيلنا الـ setTimeout auto-click — مفيش فلاش للمنتجات المثبتة
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

/* ═══════════════════════════════════════════════════════════
   ✨ [مُعدّلة] renderChips — بتقرأ التصنيف من URL مباشرة
   بتحدد الشيب النشط من الأول — مفيش فلاش للمنتجات
   ═══════════════════════════════════════════════════════════ */
function renderChips(){
  const w=document.getElementById("chips");
  if(!w)return;
  const isProductsPage = window.location.pathname.includes('products.html');
  
  if (!isProductsPage) {
    w.style.display="none";
    w.setAttribute("aria-hidden","true");
  } else {
    w.style.display="";
    w.removeAttribute("aria-hidden");
  }
  
  // ✅ اقرأ التصنيف من URL مباشرة (بدون auto-click بعد كده)
  const urlCat = new URLSearchParams(window.location.search).get('cat');
  const activeValue = (urlCat && urlCat.trim()) ? urlCat.trim() : "all";
  
  const keys=["all","wood","glass","crystal","metal","massage","gift","bride"];
 
  const frag = document.createDocumentFragment();
  keys.forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (k===activeValue ? " on" : "");
    btn.dataset.cat = k;
    btn.textContent = cat(k);
    btn.addEventListener("click",()=>{
      w.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));
      btn.classList.add("on");
      
      // ✅ حدّث الرابط عشان يفضل على نفس التصنيف لو عمل refresh
      try {
        const url = new URL(window.location);
        if(k === "all") url.searchParams.delete('cat');
        else url.searchParams.set('cat', k);
        history.replaceState(null, '', url);
      } catch(e) {}
      
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

  // ✨ منطق الترتيب: التثبيت بيشتغل بس في "all"
  list.sort((a, b) => {
    if (catF === "all") {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.pinned && b.pinned) {
        return (b.pinnedAt || 0) - (a.pinnedAt || 0);
      }
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

  // ⚠️ ترتيب المنتجات — التثبيت بيشتغل بس في "all"
  list.sort((a, b) => {
    if (catF === "all") {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.pinned && b.pinned) {
        return (b.pinnedAt || 0) - (a.pinnedAt || 0);
      }
    }
    
    switch(sort) {
      case "asc":
        return (a.price || 0) - (b.price || 0);
      case "desc":
        return (b.price || 0) - (a.price || 0);
      case "rating":
        return ((typeof ratingOf === "function" ? ratingOf(b.id)?.avg : 0) || 0) - ((typeof ratingOf === "function" ? ratingOf(a.id)?.avg : 0) || 0);
      case "best":
        return (b.sold || 0) - (a.sold || 0);
      case "disc":
        return ((b.old - b.price) / Math.max(b.old, 1)) - ((a.old - a.price) / Math.max(a.old, 1));
      case "new":
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
      name: LANG === "en" ? `Customer #${index + 1}` : `عميل سعيد #${index + 1}`,
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
      name: r.name || (LANG === "en" ? "Customer" : "عميل"),
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
        <p style="color:var(--mut);">${LANG === "en" ? "No reviews yet. Be the first!" : "لسة مفيش مراجعات. كن أول من يشارك رأيه!"}</p>
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
          ${r.verified ? `<span style="background:#d4edda; color:#155724; padding:2px 10px; border-radius:99px; font-size:.7rem; font-weight:700;">✓ ${LANG === "en" ? "Verified" : "موثّق"}</span>` : ""}
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
        text: `شوف الشمعة الفاخرة دي من VelaLight 🕯️✨`,
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

/* ═══ QUICK ADD MODAL ═══ */
function initQuickAdd() {
  const closeBtn = document.getElementById("closeScent");
  const overlay = document.getElementById("scentOv");
  const addBtn = document.getElementById("scentModalAdd");

  closeBtn?.addEventListener("click", () => closeModal("scentOv"));
  overlay?.addEventListener("click", e => {
    if (e.target.id === "scentOv") closeModal("scentOv");
  });

  overlay?.addEventListener("click", (e) => {
    if (e.target.id === "smQMinus") {
      if (quickAddQty > 1) {
        quickAddQty--;
        updateQuickAddQtyUI();
      }
    } else if (e.target.id === "smQPlus") {
      if (quickAddQty < quickAddMaxStock) {
        quickAddQty++;
        updateQuickAddQtyUI();
      } else {
        toast(LANG === "en" ? `⚠️ Only ${quickAddMaxStock} available` : `⚠️ المتاح ${quickAddMaxStock} قطعة فقط`);
      }
    }
  });

  overlay?.addEventListener("change", (e) => {
    if (e.target.id === "modalScentSelect") {
      quickAddScent = e.target.value;
    }
  });

  addBtn?.addEventListener("click", () => {
    if (!quickAddProduct) return;

    const modalSelect = document.getElementById("modalScentSelect");
    const currentScent = modalSelect ? modalSelect.value : quickAddScent;
    const currentQty = parseInt(document.getElementById("smQVal")?.textContent || "1", 10) || 1;

    if (!currentScent) {
      toast("⚠️ من فضلك اختر العطر أولاً");
      if (modalSelect) modalSelect.focus();
      return;
    }

    const added = addToCart(quickAddProduct, {
      scent: currentScent,
      qty: currentQty
    });

    if (added) {
      const originalText = addBtn.textContent;
      addBtn.textContent = "✓ تمت الإضافة";

      setTimeout(() => {
        addBtn.textContent = originalText || "🛍️ أضف للسلة";
        closeModal("scentOv");
        quickAddProduct = null;
        quickAddScent = "";
        quickAddQty = 1;
      }, 450);
    }
  });
}

function updateQuickAddQtyUI() {
  const qv = document.getElementById("smQVal");
  if (qv) qv.textContent = quickAddQty;

  const minus = document.getElementById("smQMinus");
  const plus = document.getElementById("smQPlus");

  if (minus) {
    minus.style.opacity = quickAddQty <= 1 ? "0.4" : "1";
    minus.style.pointerEvents = quickAddQty <= 1 ? "none" : "auto";
  }
  if (plus) {
    plus.style.opacity = quickAddQty >= quickAddMaxStock ? "0.4" : "1";
    plus.style.pointerEvents = quickAddQty >= quickAddMaxStock ? "none" : "auto";
  }
}

function openQuickAdd(p) {
  if (!p) return;

  quickAddProduct = p;
  quickAddScent = "";
  quickAddQty = 1;

  const stockNum = Number(p.stock);
  quickAddMaxStock = Number.isFinite(stockNum) && stockNum > 0 ? Math.floor(stockNum) : 99;

  const title = document.getElementById("scentModalTitle");
  if (title) {
    title.textContent = pname(p);
    title.setAttribute("aria-label", pname(p));
  }

  const addBtn = document.getElementById("scentModalAdd");
  if (addBtn) {
    addBtn.disabled = false;
    addBtn.textContent = t("quick_add_add") || "️ أضف للسلة";
  }

  const w = document.getElementById("scentModalScents");
  if (!w) return;

  let imgSrc = "";
  try { imgSrc = (typeof imgOf === "function") ? imgOf(p) : (p.img || ""); } catch (e) { imgSrc = p.img || ""; }
  if (!imgSrc) {
    imgSrc = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect fill='%23f5efe5' width='120' height='120'/><text x='60' y='60' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-size='18' fill='%23d9ab5f'>✦</text></svg>";
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
      <option value="">${LANG === "en" ? "Choose a scent..." : "اختر العطر..."}</option>
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

  updateQuickAddQtyUI();
  openDrawer("scentOv");

  setTimeout(() => {
    const newSelect = document.getElementById("modalScentSelect");
    if (newSelect) newSelect.focus();
  }, 60);
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


/* ═══════════════════════════════════════════════════════════
   ✦ VelaLight Luxury Cart / Checkout Experience
   - UI/UX only: preserves the existing business logic.
   - One natural scroll: products → coupon → customer details → payment note.
   - Sticky compact footer: total + primary checkout + secondary clear.
   - Keeps smart cross-sell, but makes it quiet and premium.
   - Events are delegated once; no duplicate listeners after re-render.
   ═══════════════════════════════════════════════════════════ */

let cartEventsBound = false;
let cartCustomerEventsBound = false;
let luxuryCartStyleInjected = false;

function injectLuxuryCartStyles(){
  if(luxuryCartStyleInjected || document.getElementById("vlLuxuryCartStyles")) return;
  const style=document.createElement("style");
  style.id="vlLuxuryCartStyles";
  style.textContent=`
    /* ---------- drawer shell ---------- */
    #cartDrawer{
      display:flex !important;
      flex-direction:column !important;
      width:min(520px, 100vw) !important;
      max-width:100vw !important;
      height:100dvh !important;
      max-height:100dvh !important;
      overflow:hidden !important;
      box-sizing:border-box;
    }

    #cartDrawer .dhead{
      position:sticky !important;
      top:0 !important;
      z-index:30 !important;
      flex:0 0 auto !important;
      min-height:64px !important;
      background:rgba(255,252,247,.97) !important;
      backdrop-filter:blur(16px) saturate(120%) !important;
      -webkit-backdrop-filter:blur(16px) saturate(120%) !important;
      border-bottom:1px solid rgba(115,91,61,.12) !important;
    }

    #cartDrawer .dbody{
      flex:1 1 auto !important;
      min-height:0 !important;
      height:auto !important;
      overflow-y:auto !important;
      overflow-x:hidden !important;
      overscroll-behavior:contain !important;
      -webkit-overflow-scrolling:touch !important;
      padding:14px 16px 22px !important;
      box-sizing:border-box !important;
    }

    #cartDrawer .dfoot{
      position:relative !important;
      flex:0 0 auto !important;
      z-index:35 !important;
      background:rgba(255,252,247,.985) !important;
      backdrop-filter:blur(18px) saturate(120%) !important;
      -webkit-backdrop-filter:blur(18px) saturate(120%) !important;
      border-top:1px solid rgba(115,91,61,.14) !important;
      box-shadow:0 -10px 30px rgba(73,48,25,.08) !important;
      padding:10px 14px calc(10px + env(safe-area-inset-bottom)) !important;
      max-height:none !important;
      overflow:visible !important;
    }

    #cartDrawer .dfoot #trustBadges{display:none !important;}

    /* ---------- micro intro ---------- */
    #vlCartIntro{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin:0 0 12px;
      padding:2px 2px 4px;
    }
    #vlCartIntro .vl-ci-title{
      font-size:1rem;
      font-weight:800;
      letter-spacing:-.02em;
      color:var(--dark,#2f241b);
      margin:0;
    }
    #vlCartIntro .vl-ci-sub{
      font-size:.75rem;
      color:var(--mut,#8b7c6c);
      margin-top:3px;
    }
    #vlCartIntro .vl-ci-count{
      min-width:30px;
      height:30px;
      padding:0 9px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      border:1px solid rgba(181,139,75,.22);
      border-radius:999px;
      background:#fffaf3;
      color:#8a632d;
      font-size:.75rem;
      font-weight:800;
      box-sizing:border-box;
    }

    /* ---------- product list ---------- */
    #cartDrawer #cartItems{
      display:flex !important;
      flex-direction:column !important;
      gap:10px !important;
      margin:0 !important;
    }

    #cartDrawer .citem{
      position:relative !important;
      display:grid !important;
      grid-template-columns:72px minmax(0,1fr) 30px !important;
      align-items:start !important;
      gap:11px !important;
      padding:11px !important;
      margin:0 !important;
      border:1px solid rgba(115,91,61,.12) !important;
      border-radius:16px !important;
      background:rgba(255,255,255,.82) !important;
      box-shadow:0 6px 20px rgba(73,48,25,.045) !important;
      box-sizing:border-box !important;
    }

    #cartDrawer .citem-media{
      width:72px !important;
      height:72px !important;
      border-radius:12px !important;
      overflow:hidden !important;
      background:#f7f1e8 !important;
      flex:none !important;
    }
    #cartDrawer .citem-media img{
      width:100% !important;
      height:100% !important;
      object-fit:cover !important;
      display:block !important;
    }
    #cartDrawer .citem-info{
      min-width:0 !important;
      display:flex !important;
      flex-direction:column !important;
      gap:7px !important;
      padding-top:1px !important;
    }
    #cartDrawer .citem-info h5{
      margin:0 !important;
      font-size:.93rem !important;
      line-height:1.3 !important;
      font-weight:800 !important;
      color:var(--dark,#2f241b) !important;
      white-space:nowrap !important;
      overflow:hidden !important;
      text-overflow:ellipsis !important;
    }
    #cartDrawer .cs{
      margin:0 !important;
      color:var(--mut,#8b7c6c) !important;
      font-size:.73rem !important;
      line-height:1.2 !important;
    }
    #cartDrawer .cart-line-total{
      margin:0 !important;
      display:flex !important;
      align-items:center !important;
      justify-content:space-between !important;
      gap:8px !important;
      font-size:.75rem !important;
    }
    #cartDrawer .cart-line-total span{
      color:var(--mut,#8b7c6c) !important;
    }
    #cartDrawer .cart-line-total strong{
      color:var(--dark,#2f241b) !important;
      font-size:.86rem !important;
    }

    /* ---------- scent control ---------- */
    #cartDrawer .cart-scent-picker{
      display:flex !important;
      align-items:center !important;
      gap:7px !important;
      margin:0 !important;
      min-width:0 !important;
    }
    #cartDrawer .cart-scent-label{
      flex:0 0 auto !important;
      color:var(--mut,#8b7c6c) !important;
      font-size:.72rem !important;
      font-weight:700 !important;
    }
    #cartDrawer .cart-scent-select{
      min-width:0 !important;
      width:100% !important;
      height:34px !important;
      padding:0 31px 0 10px !important;
      border-radius:9px !important;
      border:1px solid rgba(181,139,75,.24) !important;
      background:#fffdf9 !important;
      color:var(--dark,#2f241b) !important;
      font-size:.75rem !important;
      outline:none !important;
      box-sizing:border-box !important;
    }
    #cartDrawer .cart-scent-select:focus{
      border-color:rgba(181,139,75,.68) !important;
      box-shadow:0 0 0 3px rgba(181,139,75,.10) !important;
    }

    /* ---------- quantity / remove ---------- */
    #cartDrawer .qty{
      align-self:flex-start !important;
      display:inline-flex !important;
      align-items:center !important;
      gap:2px !important;
      width:max-content !important;
      min-height:30px !important;
      border:1px solid rgba(115,91,61,.14) !important;
      border-radius:9px !important;
      overflow:hidden !important;
      background:#fbf8f3 !important;
      margin:0 !important;
    }
    #cartDrawer .qty button,
    #cartDrawer .qty b{
      width:29px !important;
      height:29px !important;
      border:0 !important;
      padding:0 !important;
      display:inline-flex !important;
      align-items:center !important;
      justify-content:center !important;
      background:transparent !important;
      color:var(--dark,#2f241b) !important;
      font-size:.9rem !important;
      font-weight:800 !important;
      box-sizing:border-box !important;
    }
    #cartDrawer .qty button{
      cursor:pointer !important;
      transition:background .18s ease, transform .12s ease !important;
    }
    #cartDrawer .qty button:hover{background:#f2eadf !important;}
    #cartDrawer .qty button:active{transform:scale(.92) !important;}
    #cartDrawer .rm{
      width:30px !important;
      height:30px !important;
      border:0 !important;
      padding:0 !important;
      display:inline-flex !important;
      align-items:center !important;
      justify-content:center !important;
      border-radius:999px !important;
      background:transparent !important;
      color:#9c9083 !important;
      cursor:pointer !important;
      transition:background .18s ease,color .18s ease,transform .12s ease !important;
    }
    #cartDrawer .rm:hover{
      background:#f8eeee !important;
      color:#a53d3d !important;
    }

    /* ---------- empty state ---------- */
    #cartDrawer .vl-empty-cart{
      padding:36px 12px 42px !important;
      text-align:center !important;
    }
    #cartDrawer .vl-empty-cart .vl-empty-icon{
      width:58px;
      height:58px;
      margin:0 auto 12px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#fbf5ec;
      border:1px solid rgba(181,139,75,.16);
      font-size:1.25rem;
    }
    #cartDrawer .vl-empty-cart strong{
      display:block;
      margin-bottom:5px;
      font-size:1rem;
      color:var(--dark,#2f241b);
    }
    #cartDrawer .vl-empty-cart small{
      display:block;
      font-size:.78rem;
      color:var(--mut,#8b7c6c);
    }

    /* ---------- smart recommendation ---------- */
    #cartDrawer .cross-sell-box.vl-luxury-recommendation{
      order:2 !important;
      margin:4px 0 0 !important;
      padding:10px !important;
      border:1px solid rgba(181,139,75,.18) !important;
      border-radius:14px !important;
      background:linear-gradient(180deg,#fffaf3 0%,#fffdf9 100%) !important;
    }
    #cartDrawer .vl-reco-inner{
      display:grid !important;
      grid-template-columns:52px minmax(0,1fr) auto !important;
      gap:10px !important;
      align-items:center !important;
    }
    #cartDrawer .vl-reco-inner img{
      width:52px !important;
      height:52px !important;
      object-fit:cover !important;
      border-radius:10px !important;
      background:#f5eee5 !important;
    }
    #cartDrawer .vl-reco-kicker{
      font-size:.65rem !important;
      letter-spacing:.08em !important;
      text-transform:uppercase !important;
      color:#9a7847 !important;
      margin-bottom:2px !important;
    }
    #cartDrawer .vl-reco-title{
      font-size:.78rem !important;
      font-weight:800 !important;
      line-height:1.25 !important;
      color:var(--dark,#2f241b) !important;
    }
    #cartDrawer .vl-reco-price{
      font-size:.72rem !important;
      color:var(--mut,#8b7c6c) !important;
      margin-top:2px !important;
    }
    #cartDrawer .vl-reco-btn{
      min-width:76px !important;
      height:32px !important;
      padding:0 10px !important;
      border-radius:9px !important;
      border:1px solid rgba(181,139,75,.34) !important;
      background:#fff !important;
      color:#7a5727 !important;
      font-size:.7rem !important;
      font-weight:800 !important;
      cursor:pointer !important;
    }

    /* ---------- scroll content helpers ---------- */
    #cartDrawer #vlCartAfterItems{
      display:flex !important;
      flex-direction:column !important;
      gap:14px !important;
      margin-top:14px !important;
    }
    #cartDrawer .vl-cart-section{
      display:flex !important;
      flex-direction:column !important;
      gap:8px !important;
      padding-top:2px !important;
    }
    #cartDrawer .vl-section-title{
      display:flex !important;
      align-items:center !important;
      justify-content:space-between !important;
      gap:10px !important;
      font-size:.76rem !important;
      font-weight:850 !important;
      color:var(--dark,#2f241b) !important;
      letter-spacing:.01em !important;
    }
    #cartDrawer .vl-section-title span:last-child{
      color:var(--mut,#8b7c6c) !important;
      font-weight:600 !important;
      font-size:.68rem !important;
    }

    /* Move form controls into the natural scroll area */
    #cartDrawer .vl-cart-form-host{
      display:flex !important;
      flex-direction:column !important;
      gap:9px !important;
      padding:11px !important;
      border:1px solid rgba(115,91,61,.10) !important;
      border-radius:15px !important;
      background:#fff !important;
    }
    #cartDrawer .vl-cart-payment-note{
      padding:10px 11px !important;
      border-radius:12px !important;
      border:1px solid rgba(181,139,75,.14) !important;
      background:#fffaf3 !important;
      color:var(--mut,#7f7265) !important;
      font-size:.72rem !important;
      line-height:1.55 !important;
    }

    /* ---------- footer summary / actions ---------- */
    #vlCartFooterSummary{
      display:grid !important;
      grid-template-columns:1fr auto !important;
      gap:3px 10px !important;
      align-items:end !important;
      margin:0 0 9px !important;
    }
    #vlCartFooterSummary .vl-foot-sub{
      font-size:.68rem !important;
      color:var(--mut,#8b7c6c) !important;
    }
    #vlCartFooterSummary .vl-foot-total{
      font-size:1.28rem !important;
      line-height:1.1 !important;
      font-weight:900 !important;
      color:var(--dark,#2f241b) !important;
    }
    #vlCartFooterSummary .vl-foot-hint{
      grid-column:1/-1 !important;
      font-size:.65rem !important;
      color:var(--mut,#8b7c6c) !important;
      margin-top:2px !important;
    }

    #cartDrawer #checkoutBtn{
      width:100% !important;
      min-height:46px !important;
      border-radius:13px !important;
      font-size:.84rem !important;
      font-weight:850 !important;
      letter-spacing:.01em !important;
      margin:0 !important;
      box-shadow:0 7px 18px rgba(72,49,27,.12) !important;
    }
    #cartDrawer #emptyCartBtn{
      min-height:33px !important;
      padding:0 10px !important;
      border-radius:9px !important;
      border:0 !important;
      background:transparent !important;
      color:#93877b !important;
      font-size:.68rem !important;
      font-weight:700 !important;
      margin:4px auto 0 !important;
      display:block !important;
    }
    #cartDrawer #emptyCartBtn:hover{
      color:#9d4d4d !important;
      background:#fbf1f1 !important;
    }

    /* prevent floating WhatsApp from colliding with checkout */
    @media (max-width:768px){
      #cartDrawer .dbody{
        padding:12px 12px 18px !important;
      }
      #cartDrawer .dfoot{
        padding:9px 11px calc(9px + env(safe-area-inset-bottom)) !important;
      }
      #cartDrawer .citem{
        grid-template-columns:64px minmax(0,1fr) 28px !important;
        gap:9px !important;
        padding:10px !important;
        border-radius:14px !important;
      }
      #cartDrawer .citem-media{
        width:64px !important;
        height:64px !important;
      }
      #cartDrawer .citem-info h5{font-size:.88rem !important;}
      #cartDrawer .cart-scent-select{height:33px !important;}
      #cartDrawer #checkoutBtn{min-height:44px !important;}
      #cartDrawer #emptyCartBtn{min-height:30px !important;}
    }

    @media (min-width:769px){
      #cartDrawer{
        box-shadow:-20px 0 60px rgba(61,41,24,.12) !important;
      }
    }

    /* language direction */
    html[dir="rtl"] #cartDrawer .citem{grid-template-columns:30px minmax(0,1fr) 72px !important;}
    html[dir="rtl"] #cartDrawer .citem-media{grid-column:3;}
    html[dir="rtl"] #cartDrawer .citem-info{grid-column:2;}
    html[dir="rtl"] #cartDrawer .rm{grid-column:1;}
    html[dir="rtl"] #cartDrawer .citem h5{text-align:right;}
    html[dir="ltr"] #cartDrawer .citem-media{grid-column:1;}
    html[dir="ltr"] #cartDrawer .citem-info{grid-column:2;}
    html[dir="ltr"] #cartDrawer .rm{grid-column:3;}
  `;
  document.head.appendChild(style);
  luxuryCartStyleInjected=true;
}

function getCartDrawerParts(){
  const drawer=document.getElementById("cartDrawer");
  if(!drawer)return null;
  return {
    drawer,
    head:drawer.querySelector(".dhead"),
    body:drawer.querySelector(".dbody"),
    foot:drawer.querySelector(".dfoot"),
    items:document.getElementById("cartItems")
  };
}

function findFieldWrapper(el){
  if(!el)return null;
  let node=el;
  for(let i=0;i<5 && node && node.parentElement;i++){
    const cls=String(node.className||"");
    if(
      /form-group|form-row|field|input-wrap|form-control|checkout-field/i.test(cls) ||
      node.tagName==="LABEL"
    ) return node;
    node=node.parentElement;
  }
  return el.parentElement || el;
}

function ensureLuxuryCartStructure(){
  const parts=getCartDrawerParts();
  if(!parts || !parts.body || !parts.foot || !parts.items)return parts;

  injectLuxuryCartStyles();

  if(!document.getElementById("vlCartIntro")){
    const intro=document.createElement("div");
    intro.id="vlCartIntro";
    intro.innerHTML=`
      <div>
        <div class="vl-ci-title">${LANG==="en"?"Your selection":"اختياراتك"}</div>
        <div class="vl-ci-sub">${LANG==="en"?"Everything is ready for one elegant checkout.":"كل شيء جاهز لإتمام طلبك في خطوة واحدة."}</div>
      </div>
      <span class="vl-ci-count" id="vlCartCount">0</span>
    `;
    parts.body.insertBefore(intro,parts.body.firstChild);
  }

  let after=document.getElementById("vlCartAfterItems");
  if(!after){
    after=document.createElement("div");
    after.id="vlCartAfterItems";
    parts.body.appendChild(after);
  }

  // Keep coupon area in the scroll content rather than the footer.
  const couponInput=document.getElementById("couponInput");
  const couponBtn=document.getElementById("applyCouponBtn");
  if(couponInput){
    const couponWrapper=findFieldWrapper(couponInput);
    if(couponWrapper && !couponWrapper.closest("#vlCartAfterItems")){
      const sec=document.createElement("section");
      sec.className="vl-cart-section";
      sec.id="vlCouponSection";
      sec.innerHTML=`
        <div class="vl-section-title">
          <span>${LANG==="en"?"Offer code":"كود الخصم"}</span>
          <span>${LANG==="en"?"Optional":"اختياري"}</span>
        </div>
      `;
      const host=document.createElement("div");
      host.className="vl-cart-form-host";
      sec.appendChild(host);
      host.appendChild(couponWrapper);
      after.appendChild(sec);
    }
  }else if(couponBtn){
    const btnWrapper=findFieldWrapper(couponBtn);
    if(btnWrapper && !btnWrapper.closest("#vlCartAfterItems")){
      const sec=document.createElement("section");
      sec.className="vl-cart-section";
      sec.id="vlCouponSection";
      sec.innerHTML=`<div class="vl-section-title"><span>${LANG==="en"?"Offer code":"كود الخصم"}</span></div>`;
      const host=document.createElement("div");
      host.className="vl-cart-form-host";
      sec.appendChild(host);
      host.appendChild(btnWrapper);
      after.appendChild(sec);
    }
  }

  // Gather delivery fields into ONE cohesive section in the single scroll.
  const fieldIds=["coName","coPhone","coEmail","coCity","coAddr","coNotes"];
  const fieldNodes=[];
  fieldIds.forEach(id=>{
    const el=document.getElementById(id);
    if(el){
      const wrapper=findFieldWrapper(el);
      if(wrapper && !fieldNodes.includes(wrapper))fieldNodes.push(wrapper);
    }
  });

  if(fieldNodes.length){
    let sec=document.getElementById("vlCustomerSection");
    if(!sec){
      sec=document.createElement("section");
      sec.className="vl-cart-section";
      sec.id="vlCustomerSection";
      sec.innerHTML=`
        <div class="vl-section-title">
          <span>${LANG==="en"?"Delivery details":"بيانات التوصيل"}</span>
          <span>${LANG==="en"?"Saved securely":"تُحفظ تلقائيًا"}</span>
        </div>
      `;
      const host=document.createElement("div");
      host.className="vl-cart-form-host";
      sec.appendChild(host);
      after.appendChild(sec);
    }
    const host=sec.querySelector(".vl-cart-form-host");
    fieldNodes.forEach(node=>{
      if(node && !host.contains(node))host.appendChild(node);
    });
  }

  // Convert any existing shipping/payment note into a quiet information block.
  const oldShipNote=parts.body.querySelector(".cart-shipping-note");
  if(oldShipNote){
    oldShipNote.classList.add("vl-cart-payment-note");
    if(!oldShipNote.closest("#vlCartAfterItems")) after.appendChild(oldShipNote);
  }

  // Dedicated payment section: informational only; no payment logic is changed.
  let paymentSection=document.getElementById("vlCartPaymentSection");
  if(!paymentSection){
    paymentSection=document.createElement("section");
    paymentSection.className="vl-cart-section";
    paymentSection.id="vlCartPaymentSection";
    paymentSection.innerHTML=`
      <div class="vl-section-title">
        <span>${LANG==="en"?"Payment":"الدفع"}</span>
        <span>${LANG==="en"?"No card form":"بدون إدخال بطاقة"}</span>
      </div>
      <div class="vl-cart-payment-note">
        <strong style="display:block;margin-bottom:3px;color:var(--dark,#2f241b);font-size:.74rem;">
          ${t("pay_title")}
        </strong>
        ${t("paymethod_d")}
      </div>
    `;
    after.appendChild(paymentSection);
  }

  // Payment note — informational only; checkout logic remains unchanged.
  let pay=document.getElementById("vlCartPaymentNote");
  if(!pay){
    pay=document.createElement("div");
    pay.id="vlCartPaymentNote";
    pay.className="vl-cart-payment-note";
    pay.textContent=LANG==="en"
      ? "Payment details are sent via WhatsApp after confirming your order. Shipping is paid to the courier on delivery."
      : "تفاصيل الدفع تُرسل لك عبر واتساب بعد تأكيد الطلب، وتكلفة الشحن تُدفع لمندوب التوصيل عند الاستلام.";
    after.appendChild(pay);
  }

  // Summary footer: stays in place while the single content area scrolls.
  let summary=document.getElementById("vlCartFooterSummary");
  if(!summary){
    summary=document.createElement("div");
    summary.id="vlCartFooterSummary";
    summary.innerHTML=`
      <div>
        <div class="vl-foot-sub">${LANG==="en"?"Order total":"إجمالي الطلب"}</div>
        <div class="vl-foot-hint" id="vlCartFooterHint"></div>
      </div>
      <div class="vl-foot-total" id="vlCartFooterTotal">0 ج.م</div>
    `;
    const firstAction=parts.foot.querySelector("#checkoutBtn,.btn-primary");
    if(firstAction) parts.foot.insertBefore(summary,firstAction);
    else parts.foot.prepend(summary);
  }

  return parts;
}

function renderCart(){
  const parts=ensureLuxuryCartStructure();
  if(!parts || !parts.items)return;

  const c=getCart();
  const w=parts.items;

  const countEl=document.getElementById("vlCartCount");
  if(countEl)countEl.textContent=String(c.reduce((n,it)=>n+Number(it.qty||1),0));

  if(!c.length){
    w.innerHTML=`
      <div class="vl-empty-cart">
        <div class="vl-empty-icon" aria-hidden="true">🕯️</div>
        <strong>${t("cart_empty")}</strong>
        <small>${t("cart_empty_sub")}</small>
      </div>
    `;
    const after=document.getElementById("vlCartAfterItems");
    if(after) after.style.display="none";
    updateTotals(c);
    return;
  }

  const after=document.getElementById("vlCartAfterItems");
  if(after) after.style.display="flex";

  const frag=document.createDocumentFragment();

  c.forEach((it,i)=>{
    const lineTotal=Number(it.price||0)*Number(it.qty||1);
    const item=document.createElement("div");
    item.className="citem";
    item.dataset.index=i;

    const safeName=pname({name:it.name,nameEn:it.nameEn});
    item.innerHTML=`
      <div class="citem-media">
        <img
          src="${it.img||""}"
          alt="${safeName}"
          loading="lazy"
          width="72"
          height="72"
          onerror="window.handleImageError(this, '${it.id}')"
        >
      </div>

      <div class="citem-info">
        <h5 title="${safeName}">${safeName}</h5>

        <label class="cart-scent-picker">
          <span class="cart-scent-label">${t("scent_lbl")}</span>
          <select class="cart-scent-select" data-i="${i}" aria-label="${t("scent_lbl")}">
            <option value="">${LANG==="en"?"Choose":"اختر العطر"}</option>
            ${VELA_SCENTS.map(s=>`
              <option value="${s[0]}" ${String(it.scent||"")===String(s[0])?"selected":""}>
                ${velaScentTr(s[0])}
              </option>
            `).join("")}
          </select>
        </label>

        <div class="cs">${t("price_lbl")} <strong>${money(it.price)}</strong></div>

        <div class="cart-line-total">
          <span>${LANG==="en"?"Item total":"إجمالي القطعة"}</span>
          <strong>${money(lineTotal)}</strong>
        </div>

        <div class="qty" aria-label="${LANG==="en"?"Quantity":"الكمية"}">
          <button class="cq-minus" type="button" data-i="${i}" aria-label="${LANG==="en"?"Decrease":"تقليل"}">−</button>
          <b>${Number(it.qty||1)}</b>
          <button class="cq-plus" type="button" data-i="${i}" aria-label="${LANG==="en"?"Increase":"زيادة"}">+</button>
        </div>
      </div>

      <button class="rm" type="button" data-i="${i}" aria-label="${LANG==="en"?"Remove item":"حذف المنتج"}" title="${LANG==="en"?"Remove":"حذف"}">×</button>
    `;
    frag.appendChild(item);
  });

  w.innerHTML="";
  w.appendChild(frag);

  // Keep the smart recommendation — but quiet, compact, and below the chosen products.
  const products=(typeof ALL_PRODUCTS!=="undefined")?ALL_PRODUCTS:[];
  const cartProductIds=new Set(c.map(it=>it.id));

  const suggestedProduct=products.find(p=>{
    if(!p || cartProductIds.has(p.id) || p.active===false) return false;
    const searchText=[p.name||"",p.nameEn||"",p.desc||"",p.descEn||"",p.cat||""].join(" ").toLowerCase();
    return searchText.includes("فواحة") ||
           searchText.includes("دولاب") ||
           searchText.includes("freshener") ||
           searchText.includes("closet");
  });

  let recommendation=document.getElementById("vlCartRecommendation");
  if(recommendation) recommendation.remove();

  if(suggestedProduct){
    recommendation=document.createElement("div");
    recommendation.id="vlCartRecommendation";
    recommendation.className="cross-sell-box vl-luxury-recommendation";
    recommendation.innerHTML=`
      <div class="vl-reco-inner">
        <img
          src="${suggestedProduct.img||""}"
          alt="${pname(suggestedProduct)}"
          loading="lazy"
          onerror="this.style.visibility='hidden'"
        >
        <div>
          <div class="vl-reco-kicker">${LANG==="en"?"A thoughtful add-on":"إضافة صغيرة تكمل طلبك"}</div>
          <div class="vl-reco-title">${pname(suggestedProduct)}</div>
          <div class="vl-reco-price">${money(suggestedProduct.price)}</div>
        </div>
        <button class="vl-reco-btn" type="button" id="addSuggestBtn">${LANG==="en"?"Add":"أضف"}</button>
      </div>
    `;
    w.appendChild(recommendation);
  }

  updateTotals(c);
}

function bindLuxuryCartEvents(){
  if(cartEventsBound)return;
  const drawer=document.getElementById("cartDrawer");
  const items=document.getElementById("cartItems");
  if(!drawer || !items)return;

  items.addEventListener("click",handleCartClick);
  items.addEventListener("change",handleCartChange);

  drawer.addEventListener("click",e=>{
    const suggest=e.target.closest("#addSuggestBtn");
    if(suggest){
      const c=getCart();
      const products=(typeof ALL_PRODUCTS!=="undefined")?ALL_PRODUCTS:[];
      const cartIds=new Set(c.map(it=>it.id));
      const p=products.find(x=>{
        if(!x || cartIds.has(x.id) || x.active===false)return false;
        const txt=[x.name||"",x.nameEn||"",x.desc||"",x.descEn||"",x.cat||""].join(" ").toLowerCase();
        return txt.includes("فواحة")||txt.includes("دولاب")||txt.includes("freshener")||txt.includes("closet");
      });
      if(p){
        addToCart(p,{scent:p.scent||"بدون عطر",qty:1});
        renderCart();
        cartBadge();
        toast(LANG==="en"?"Added to your selection.":"تمت إضافة المنتج لاختياراتك.");
      }
    }
  });

  cartEventsBound=true;
}

function bindLuxuryCustomerPersistence(){
  if(cartCustomerEventsBound)return;
  const drawer=document.getElementById("cartDrawer");
  if(!drawer)return;

  const saveCustomer=debounce(()=>saveCartCustomer(),500);
  ["#coName","#coPhone","#coEmail","#coCity","#coAddr","#coNotes"].forEach(selector=>{
    drawer.addEventListener("input",e=>{
      if(e.target.matches(selector))saveCustomer();
    });
    drawer.addEventListener("change",e=>{
      if(e.target.matches(selector))saveCustomer();
    });
  });

  cartCustomerEventsBound=true;
}

function handleCartClick(e){
  const rmBtn=e.target.closest(".rm");
  const plusBtn=e.target.closest(".cq-plus");
  const minusBtn=e.target.closest(".cq-minus");
  if(!rmBtn && !plusBtn && !minusBtn)return;

  const c=getCart();

  if(rmBtn){
    const idx=+rmBtn.dataset.i;
    if(!Number.isInteger(idx) || !c[idx])return;
    c.splice(idx,1);
    saveCart(c);
    renderCart();
    cartBadge();
    return;
  }

  if(plusBtn){
    const idx=+plusBtn.dataset.i;
    if(!Number.isInteger(idx) || !c[idx])return;
    const stock=Number(c[idx].stock);
    const next=Number(c[idx].qty||1)+1;
    if(Number.isFinite(stock) && stock>0 && next>stock){
      toast(LANG==="en"?"Maximum available quantity reached.":"وصلت للكمية المتاحة من المنتج.");
      return;
    }
    c[idx].qty=next;
    saveCart(c);
    renderCart();
    return;
  }

  if(minusBtn){
    const idx=+minusBtn.dataset.i;
    if(!Number.isInteger(idx) || !c[idx])return;
    c[idx].qty=Number(c[idx].qty||1)-1;
    if(c[idx].qty<=0)c.splice(idx,1);
    saveCart(c);
    renderCart();
    cartBadge();
  }
}

function handleCartChange(e){
  if(!e.target.matches(".cart-scent-select"))return;
  const select=e.target;
  const idx=+select.dataset.i;
  const c=getCart();
  if(!Number.isInteger(idx) || !c[idx])return;

  c[idx].scent=select.value;
  saveCart(c);

  // Update only the affected visual state; keep the scroll position stable.
  const card=select.closest(".citem");
  if(card){
    card.classList.toggle("scent-selected",!!select.value);
  }
  updateTotals(c);
}

function initCart(){
  injectLuxuryCartStyles();
  const parts=ensureLuxuryCartStructure();

  cartBadge();
  fillCitySelect(document.getElementById("coCity"));
  fillCartForm();
  bindLuxuryCartEvents();
  bindLuxuryCustomerPersistence();

  document.getElementById("cartBtn")?.addEventListener("click",()=>{
    fillCartForm();
    renderCart();
    openDrawer("cartDrawer","cartOv");
  });
  document.getElementById("closeCart")?.addEventListener("click",closeDrawers);
  document.getElementById("cartOv")?.addEventListener("click",closeDrawers);

  if(new URLSearchParams(location.search).get("cart")==="1"){
    fillCartForm();
    renderCart();
    openDrawer("cartDrawer","cartOv");
  }

  document.getElementById("emptyCartBtn")?.addEventListener("click",()=>{
    if(!confirm(t("t_confirm_empty")))return;
    saveCart([]);
    renderCart();
    cartBadge();
  });

  document.getElementById("checkoutBtn")?.addEventListener("click",checkout);
  document.getElementById("applyCouponBtn")?.addEventListener("click",applyCoupon);

  renderCart();

  if(parts?.foot){
    // Hide redundant reassurance strip: luxury checkout should feel calm, not crowded.
    const oldBadges=document.getElementById("trustBadges");
    if(oldBadges)oldBadges.remove();
  }
}

function updateTotals(c){
  const sub=c.reduce((a,i)=>a+(Number(i.price||0)*Number(i.qty||1)),0);

  // 1. Quantity discount
  let qtyDiscount=0;
  c.forEach(it=>{
    if(Number(it.qty)>=3){
      qtyDiscount += (Number(it.price||0)*Number(it.qty||1)*0.05);
    }
  });
  qtyDiscount=Math.round(qtyDiscount*100)/100;

  // 2. Coupon discount
  const couponDisc=(typeof calcCouponDiscount==="function")?calcCouponDiscount(sub):0;

  // 3. Apply one discount only: the higher one.
  let finalDiscount=0;
  let appliedType="none";

  if(qtyDiscount>0 && couponDisc>0){
    if(qtyDiscount>=couponDisc){
      finalDiscount=qtyDiscount;
      appliedType="qty";
    }else{
      finalDiscount=couponDisc;
      appliedType="coupon";
    }
  }else if(qtyDiscount>0){
    finalDiscount=qtyDiscount;
    appliedType="qty";
  }else if(couponDisc>0){
    finalDiscount=couponDisc;
    appliedType="coupon";
  }

  const total=Math.max(0,sub-finalDiscount);

  // Existing legacy totals remain supported.
  if(document.getElementById("cartSub")){
    document.getElementById("cartSub").textContent=money(sub);
  }

  const qtyDiscRow=document.getElementById("qtyDiscountRow");
  if(qtyDiscRow){
    if(appliedType==="qty"){
      qtyDiscRow.style.display="flex";
      qtyDiscRow.style.color="var(--ok)";
      if(document.getElementById("qtyDiscountVal")){
        document.getElementById("qtyDiscountVal").textContent="-"+money(finalDiscount);
      }
      const s=qtyDiscRow.querySelector("span");
      if(s)s.textContent="خصم الكمية (مطبق)";
    }else if(appliedType==="coupon" && qtyDiscount>0){
      qtyDiscRow.style.display="flex";
      qtyDiscRow.style.color="var(--dim)";
      qtyDiscRow.style.textDecoration="line-through";
      if(document.getElementById("qtyDiscountVal")){
        document.getElementById("qtyDiscountVal").textContent="-"+money(qtyDiscount)+" (غير مطبق)";
      }
      const s=qtyDiscRow.querySelector("span");
      if(s)s.textContent="خصم الكمية";
    }else{
      qtyDiscRow.style.display="none";
    }
  }

  const dRow=document.getElementById("discountRow");
  if(dRow){
    if(appliedType==="coupon"){
      dRow.style.display="flex";
      dRow.style.color="var(--ok)";
      dRow.style.textDecoration="none";
      if(document.getElementById("cartDiscount")){
        document.getElementById("cartDiscount").textContent="-"+money(finalDiscount);
      }
      if(document.getElementById("couponCodeLbl") && appliedCoupon){
        document.getElementById("couponCodeLbl").textContent=appliedCoupon.code+" (مطبق)";
      }
    }else if(appliedType==="qty" && couponDisc>0){
      dRow.style.display="flex";
      dRow.style.color="var(--dim)";
      dRow.style.textDecoration="line-through";
      if(document.getElementById("cartDiscount")){
        document.getElementById("cartDiscount").textContent="-"+money(couponDisc)+" (غير مطبق)";
      }
      if(document.getElementById("couponCodeLbl") && appliedCoupon){
        document.getElementById("couponCodeLbl").textContent=appliedCoupon.code+" (غير مطبق)";
      }
    }else{
      dRow.style.display="none";
    }
  }

  // Free-shipping messaging keeps its current threshold/business rule.
  const freeShippingThreshold=3000;
  const remaining=Math.max(0,freeShippingThreshold-sub);
  const progressPercent=Math.min(100,(sub/freeShippingThreshold)*100);

  const freeShipRow=document.getElementById("freeShippingRow");
  const shipNote=document.querySelector("#cartDrawer .cart-shipping-note");

  if(freeShipRow && shipNote){
    if(sub>=freeShippingThreshold){
      freeShipRow.style.display="flex";
      freeShipRow.innerHTML=`<span style="color:#27734a;font-weight:800;">🎉 مبروك! طلبك مؤهل لشحن مجاني</span>`;
      shipNote.style.display="none";
    }else{
      freeShipRow.style.display="block";
      freeShipRow.innerHTML=`
        <div style="text-align:center;font-size:.74rem;color:var(--dark);">
          أضف <strong style="color:#9a6f31;">${money(remaining)}</strong> لتحصل على <strong>شحن مجاني</strong>
        </div>
        <div style="margin-top:7px;background:#eee5d9;height:6px;border-radius:99px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,#b88a47,#e3c27b);height:100%;width:${progressPercent}%;transition:width .35s ease;border-radius:99px;"></div>
        </div>
      `;
      freeShipRow.style.background="#fffaf3";
      freeShipRow.style.padding=".55rem .7rem";
      freeShipRow.style.borderRadius="10px";
      freeShipRow.style.border="1px solid rgba(181,139,75,.16)";
      shipNote.style.display="none";
    }
  }

  if(document.getElementById("cartTotal")){
    document.getElementById("cartTotal").textContent=money(total);
  }

  const footerTotal=document.getElementById("vlCartFooterTotal");
  if(footerTotal){
    footerTotal.textContent=money(total);
  }

  const footerHint=document.getElementById("vlCartFooterHint");
  if(footerHint){
    const totalQty=c.reduce((n,it)=>n+Number(it.qty||1),0);
    footerHint.textContent=LANG==="en"
      ? `${totalQty} item${totalQty===1?"":"s"} • shipping calculated at confirmation`
      : `${totalQty} ${totalQty===1?"قطعة":"قطع"} • الشحن يُؤكد عند تسجيل الطلب`;
  }

  const countEl=document.getElementById("vlCartCount");
  if(countEl)countEl.textContent=String(c.reduce((n,it)=>n+Number(it.qty||1),0));

  const checkoutBtn=document.getElementById("checkoutBtn");
  if(checkoutBtn){
    const hasMissingScent=c.some(it=>!it.scent||!String(it.scent).trim());
    checkoutBtn.setAttribute("aria-disabled",hasMissingScent?"true":"false");
  }
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

/* ═══════════════════════════════════════════════════════════
   ✨ [إضافة جديدة] تسجيل/تحديث العميل في مجموعة users
   ═══════════════════════════════════════════════════════════ */
async function saveOrUpdateCustomer(orderData){
  if(!window.FB || typeof window.FB.list !== "function") return null;
  try {
    let users = [];
    try { users = await window.FB.list("users") || []; } catch(e) { users = []; }

    const phone = String(orderData.phone || "").trim();
    const email = String(orderData.email || "").trim();

    let existing = null;
    if (phone) existing = users.find(u => String(u.phone || "").trim() === phone);
    if (!existing && email) existing = users.find(u => String(u.email || "").trim() === email);

    if (existing) {
      const newOrdersCount = (Number(existing.ordersCount) || 0) + 1;
      const newTotalSpent = (Number(existing.totalSpent) || 0) + Number(orderData.total || 0);
      await window.FB.update("users", existing.id, {
        ordersCount: newOrdersCount,
        totalSpent: newTotalSpent,
        lastOrder: Date.now(),
        name: existing.name || orderData.name || "",
        phone: existing.phone || phone,
        email: existing.email || email,
        city: existing.city || orderData.city || "",
        address: existing.address || orderData.address || ""
      });
      console.log("✅ Customer updated:", existing.id);
      return existing.id;
    } else {
      const userId = "u" + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);
      const newUser = {
        name: orderData.name || "",
        phone: phone,
        email: email,
        city: orderData.city || "",
        address: orderData.address || "",
        ordersCount: 1,
        totalSpent: Number(orderData.total || 0),
        createdAt: Date.now(),
        lastOrder: Date.now(),
        provider: "guest-checkout"
      };
      await window.FB.set("users", userId, newUser);
      console.log("✅ Customer created:", userId);
      return userId;
    }
  } catch(err) {
    console.error("❌ saveOrUpdateCustomer failed:", err);
    return null;
  }
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

/* ═══════════════════════════════════════════════════════════
   ✨ ADVANCED MATCHING — تحسين دقة تتبع فيسبوك
   ═══════════════════════════════════════════════════════════ */

// دالة تشفير SHA-256
async function hashSHA256(str){
  if(!str) return null;
  try{
    const normalized = String(str).trim().toLowerCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }catch(e){
    console.warn("⚠️ Hash failed:", e);
    return null;
  }
}

// دالة تجهيز بيانات Advanced Matching
async function buildAdvancedMatching(userData){
  if(!userData) return {};
  
  const result = {};
  
  // الإيميل
  if(userData.email){
    const em = await hashSHA256(userData.email);
    if(em) result.em = em;
  }
  
  // الموبايل (بدون 20 أو +، بأرقام إنجليزية)
  if(userData.phone){
    let phone = String(userData.phone).replace(/\D/g, "");
    if(phone.startsWith("20")) phone = phone.slice(2);
    if(phone.startsWith("0")) phone = phone.slice(1);
    const ph = await hashSHA256(phone);
    if(ph) result.ph = ph;
  }
  
  // الاسم الأول والأخير
  if(userData.name){
    const parts = String(userData.name).trim().split(/\s+/);
    if(parts[0]){
      const fn = await hashSHA256(parts[0]);
      if(fn) result.fn = fn;
    }
    if(parts.length > 1){
      const ln = await hashSHA256(parts[parts.length - 1]);
      if(ln) result.ln = ln;
    }
  }
  
  // المدينة
  if(userData.city){
    const ct = await hashSHA256(userData.city);
    if(ct) result.ct = ct;
  }
  
  // البلد (ثابت لمصر)
  result.country = "eg";
  
  // Facebook Browser ID (من كوكيز _fbp)
  const fbp = getCookie("_fbp");
  if(fbp) result.fbp = fbp;
  
  // Facebook Click ID (من URL أو localStorage)
  const fbc = localStorage.getItem("vl_fbclid");
  if(fbc) result.fbc = `fb.1.${Date.now()}.${fbc}`;
  
  return result;
}

// دالة قراءة الكوكيز
function getCookie(name){
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if(parts.length === 2) return parts.pop().split(";").shift();
  return null;
}
 
// ═══════════════════════════════════════════════════════════
//   التعديلات الجديدة على دالة checkout (منع الطلبات الوهمية)
// ═══════════════════════════════════════════════════════════
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

  // ✅ هام جداً: افتح نافذة فارغة فوراً عند الضغط قبل أي await
  const waWindow = window.open("", "_blank");

  saveUserFromCart(name,phone,email,city,addr,notes);

  const orderId=genOrderId();
  const subTotal=c.reduce((a,i)=>a+(Number(i.price||0)*Number(i.qty||1)),0);
  
  // حساب الخصمين واختيار الأعلى
  let qtyDiscount = 0;
  c.forEach(it => {
    if (Number(it.qty) >= 3) {
      qtyDiscount += (Number(it.price||0) * Number(it.qty||1) * 0.05);
    }
  });
  qtyDiscount = Math.round(qtyDiscount * 100) / 100;
  
  const couponDiscount = (typeof calcCouponDiscount==="function") ? calcCouponDiscount(subTotal) : 0;

  let finalDiscount = 0;
  let appliedType = "none";
  if (qtyDiscount > 0 && couponDiscount > 0) {
    if (qtyDiscount >= couponDiscount) {
      finalDiscount = qtyDiscount;
      appliedType = "qty";
    } else {
      finalDiscount = couponDiscount;
      appliedType = "coupon";
    }
  } else if (qtyDiscount > 0) {
    finalDiscount = qtyDiscount;
    appliedType = "qty";
  } else if (couponDiscount > 0) {
    finalDiscount = couponDiscount;
    appliedType = "coupon";
  }

  const total = Math.max(0, subTotal - finalDiscount);
  
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

 /* ✨ ADVANCED MATCHING — تحسين دقة التتبع */
const advancedMatching = await buildAdvancedMatching({name, phone, email, city});
if(typeof fbq === "function" && Object.keys(advancedMatching).length > 0){
  fbq("init", "1377896053806991", advancedMatching);
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
  
  // عرض الخصم المطبق فقط
  if (finalDiscount > 0) {
    if (appliedType === "qty") {
      msg+=`🎁 خصم الكمية (مطبق): -${money(finalDiscount)}\n`;
    } else if (appliedType === "coupon") {
      msg+=`🎟️ كوبون ${appliedCoupon ? appliedCoupon.code : ''} (مطبق): -${money(finalDiscount)}\n`;
    }
  }
  if (qtyDiscount > 0 && appliedType !== "qty") {
    msg+=`💡 خصم الكمية (غير مطبق - تم اختيار الخصم الأعلى)\n`;
  }
  if (couponDiscount > 0 && appliedType !== "coupon") {
    msg+=`💡 خصم الكوبون (غير مطبق - تم اختيار الخصم الأعلى)\n`;
  }

  msg+=`🎁 هدية ليك: كود THANKS10 لخصم 10% على طلبك الجاي\n`;
  
  msg+=`${waTotalLabel()} ${money(total)}\n`;
msg+=`💳 طريقة الدفع: سيتم إرسال تفاصيل الدفع المتاحة (InstaPay / فودافون كاش / أورنج كاش / تحويل بنكي) عبر الواتساب فور تأكيد الطلب.\n`;
  
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

  // ⭐ إضافة statusHistory عند إنشاء الطلب
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
    discount: finalDiscount,
    qtyDiscount: qtyDiscount,
    couponDiscount: couponDiscount,
    couponCode: appliedCoupon ? appliedCoupon.code : "",
    appliedType: appliedType,
    paymentMethod:"WhatsApp Confirmation",
    paymentStatus:"pending",
    shippingPayment:"Cash to courier",
    shippingIncluded: subTotal >= 3000,
    status: 0,
    statusHistory: [
      { status: 0, changedAt: Date.now(), changedBy: "customer" }
    ],
    tracking: trackingData,
    createdAt:Date.now(),
    updatedAt:Date.now(),
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

  /* ✨ تسجيل/تحديث العميل في مجموعة users */
  try {
    await saveOrUpdateCustomer(orderData);
  } catch(e) {
    console.warn("⚠️ Customer registration failed:", e);
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

  /* ✅ هام جداً: افتح واتساب أولاً قبل أي رسالة نجاح */
  const waOpened = openWhatsAppConfirmation(orderData, waWindow);

  if (waOpened) {
    if (emailSent) {
      toast(LANG==="en" ? "✅ Order placed! Opening WhatsApp..." : "✅ تم تسجيل الطلب! جاري تحويلك للواتساب...");
    } else {
      toast(LANG==="en" ? "✅ Opening WhatsApp..." : "✅ جاري تحويلك للواتساب...");
    }
  } else {
    toast(t("t_order"));
  }

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
        num_items: c.length,
        content_type: "product",
        order_id: orderId,
        em: advancedMatching.em,
        ph: advancedMatching.ph,
        fn: advancedMatching.fn,
        ln: advancedMatching.ln,
        ct: advancedMatching.ct,
        country: "eg"
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
    if (orderData.discount > 0) {
      if (orderData.appliedType === "qty") {
        discountText += `🎁 خصم الكمية (مطبق): -${orderData.discount} جنيه\n`;
      } else if (orderData.appliedType === "coupon") {
        discountText += `🎟️ كوبون ${orderData.couponCode || ''} (مطبق): -${orderData.discount} جنيه\n`;
      }
    }
    if (orderData.qtyDiscount > 0 && orderData.appliedType !== "qty") {
      discountText += `💡 خصم الكمية (غير مطبق): -${orderData.qtyDiscount} جنيه (تم اختيار الخصم الأعلى)\n`;
    }
    if (orderData.couponDiscount > 0 && orderData.appliedType !== "coupon") {
      discountText += `💡 خصم الكوبون (غير مطبق): -${orderData.couponDiscount} جنيه (تم اختيار الخصم الأعلى)\n`;
    }

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
• سيتم إرسال تفاصيل الدفع (InstaPay / فودافون كاش / أورنج كاش / تحويل بنكي) للعميل عبر الواتساب.
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

/* ═══════════════════════════════════════════════════════════
   ✨ فتح واتساب — يستخدم رقم المتجر + normalizeWhatsApp
   ═══════════════════════════════════════════════════════════ */
function openWhatsAppConfirmation(orderData, waWindow) {
  if (!CFG || !CFG.WHATSAPP) return false;
  
  const whatsappNumber = (typeof normalizeWhatsApp === "function")
    ? normalizeWhatsApp(CFG.WHATSAPP)
    : String(CFG.WHATSAPP).replace(/\D/g, "");
  
  const itemsSummary = (orderData.items || [])
    .map(i => {
      const name = i.name || i.title || "منتج";
      const qty = i.qty || 1;
      const scent = i.scent ? ` (${velaScentTr(i.scent)})` : "";
      return `• ${name}${scent} × ${qty}`;
    })
    .join("\n");
  
  let discountText = "";
  if(orderData.qtyDiscount > 0 && orderData.appliedType === "qty") {
    discountText += `🎁 خصم الكمية: -${orderData.discount} جنيه\n`;
  } else if(orderData.couponDiscount > 0 && orderData.appliedType === "coupon") {
    discountText += `🎟️ كوبون ${orderData.couponCode}: -${orderData.discount} جنيه\n`;
  }

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

  try {
    if (waWindow && !waWindow.closed) {
      waWindow.location.href = waUrl;
      return true;
    }
    
    const newWin = window.open(waUrl, "_blank");
    if (newWin) return true;
    
    window.location.href = waUrl;
    return true;
  } catch(e) {
    console.warn("⚠️ WhatsApp open failed:", e);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════
   ✨ اصلاح جذري وبسيط لحساب المستخدم
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
      // ✨ [إضافة] إرجاع السكرول — حل مشكلة القفل بعد اختيار تصنيف
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    });
  });  
  /* ✨ روابط التصنيفات — تنقل مع ?cat= على أي صفحة */
  document.querySelectorAll("[data-cat]").forEach(a=>{
    if(a.closest(".mnav")||a.closest(".mainnav")||a.closest("footer")){
      a.addEventListener("click",(e)=>{
        const cat = a.dataset.cat;
        if(!cat) return;
        
        const isProductsPage = window.location.pathname.includes('products.html');
        
        if(isProductsPage){
          // في نفس الصفحة → اضغط الشيب مباشرة
          e.preventDefault();
          setTimeout(()=>{
            const chip=document.querySelector(`#chips .chip[data-cat="${cat}"]`);
            if(chip){chip.click();}
          },50);
        } else {
          // في صفحة تانية → انتقل مع تمرير التصنيف في الرابط
          e.preventDefault();
          window.location.href = "products.html?cat=" + encodeURIComponent(cat);
        }
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

  if(p.stock === undefined || p.stock === null || p.stock === "") return "";

  const s = Number(p.stock);
  if(isNaN(s)) return "";

  const baseStyle = `
    position:absolute;
    top:12px;
    inset-inline-end:12px;
    inset-inline-start:auto;
    color:#fff;
    font-size:.7rem;
    font-weight:800;
    padding:.3rem .75rem;
    border-radius:99px;
    z-index:4;
    pointer-events:none;
    white-space:nowrap;
  `;

  if(s === 0){
    return `<span class="stock-badge" style="${baseStyle}background:#e74c3c;">نفدت الكمية</span>`;
  }

  if(s <= 5){
    return `<span class="stock-badge" style="${baseStyle}background:#e67e22;">باقي ${s} فقط</span>`;
  }

  return `<span class="stock-badge" style="${baseStyle}background:#27ae60;">متوفر</span>`;
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

// ================================================================
// ✨ COUPONS SYSTEM — النسخة الذكية المطورة
// ================================================================

let appliedCoupon = null;

function calcCouponDiscount(sub){
  if(!appliedCoupon) return 0;
  let d = 0;
  if(appliedCoupon.type === "percent"){
    d = sub * (Number(appliedCoupon.value || 0) / 100);
  } else {
    d = Number(appliedCoupon.value || 0);
  }
  if(appliedCoupon.maxDiscount && d > appliedCoupon.maxDiscount) {
    d = appliedCoupon.maxDiscount;
  }
  return Math.min(sub, Math.round(d));
}

// ═══ applyCoupon ═══
async function applyCoupon(){
  const code = (document.getElementById("couponInput")?.value || "").trim().toUpperCase();
  if(!code){ toast("⚠️ اكتب كود الكوبون"); return; }
  
  let list = [];
  try { list = await window.FB.list("coupons") || []; }
  catch(e){ toast("⚠️ تعذر التحقق من الكوبون"); return; }
  
  const c = list.find(x => (x.code || "").toUpperCase() === code);
  if(!c){ toast("❌ كود الكوبون غير صحيح"); return; }
  if(c.active === false){ toast("❌ الكوبون ده متوقف"); return; }
  
  const now = Date.now();
  if(c.startDate && now < new Date(c.startDate).getTime()) {
    toast("⏳ هذا الكوبون لم يبدأ بعد.");
    return;
  }
  if(c.expiresAt && now > Number(c.expiresAt)) {
    toast("⚠️ الكوبون منتهي الصلاحية");
    return;
  }
  if(c.maxUses && Number(c.usedCount || 0) >= Number(c.maxUses)){
    toast("⚠️ انتهت استخدامات الكوبون");
    return;
  }
  
  const cart = getCart();
  const sub = cart.reduce((a,i) => a + (Number(i.price || 0) * Number(i.qty || 1)), 0);
  if(c.minOrder && sub < c.minOrder) {
    toast(`⚠️ الحد الأدنى للطلب هو ${c.minOrder} ج.م`);
    return;
  }
  
  if(c.firstOrderOnly) {
    const user = getSavedUser();
    const userEmail = user.email || "";
    const userPhone = user.phone || "";
    
    let allOrders = [];
    try {
      allOrders = await window.FB.list("orders") || [];
    } catch(e) {
      console.warn("⚠️ Could not fetch orders for first-order check", e);
      toast("⚠️ تعذر التحقق من الطلبات السابقة");
      return;
    }
    
    const customerOrders = allOrders.filter(order => {
      const orderEmail = order.email || order.customer?.email || "";
      const orderPhone = order.phone || order.customer?.phone || "";
      return (userEmail && orderEmail === userEmail) || (userPhone && orderPhone === userPhone);
    });
    
    const nonCancelledOrders = customerOrders.filter(order => order.status !== 4);
    
    if(nonCancelledOrders.length > 0) {
      toast("⚠️ هذا الكوبون مخصص للطلبات الأولى فقط (الطلبات الملغية غير محسوبة).");
      return;
    }
  }
  
  const user = getSavedUser();
  const identifier = user.email || user.phone;
  if(identifier && c.usedBy && Array.isArray(c.usedBy) && c.usedBy.includes(identifier)) {
    toast("⚠️ لقد استخدمت هذا الكوبون من قبل.");
    return;
  }
  
  let discount = 0;
  if(c.type === "percent"){
    discount = sub * (Number(c.value || 0) / 100);
  } else {
    discount = Number(c.value || 0);
  }
  if(c.maxDiscount && discount > c.maxDiscount) {
    discount = c.maxDiscount;
  }
  discount = Math.round(discount);
  
  appliedCoupon = { ...c, _fid: c.id, discount: discount };
  toast("🎟️ تم تطبيق الكوبون! وفرت " + money(discount));
  renderCart();
}

// ═══ consumeCoupon ═══
async function consumeCoupon(){
  if(!appliedCoupon || !appliedCoupon._fid) return;
  
  const user = getSavedUser();
  const identifier = user.email || user.phone;
  if(identifier) {
    const usedBy = appliedCoupon.usedBy || [];
    if(!usedBy.includes(identifier)) {
      usedBy.push(identifier);
      try {
        await window.FB.update("coupons", appliedCoupon._fid, {
          usedCount: (Number(appliedCoupon.usedCount || 0) + 1),
          usedBy: usedBy
        });
      } catch(e) {
        console.warn("⚠️ coupon update failed", e);
      }
    }
  } else {
    try {
      await window.FB.update("coupons", appliedCoupon._fid, {
        usedCount: (Number(appliedCoupon.usedCount || 0) + 1)
      });
    } catch(e) {
      console.warn("⚠️ coupon update failed", e);
    }
  }
  
  appliedCoupon = null;
  if(document.getElementById("couponInput")) document.getElementById("couponInput").value = "";
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


/* ═══ EXPOSE GLOBALLY ═══ */
window.renderProductsPage = renderProductsPage;
window.renderReviewsPage = renderReviewsPage;
window.getWishlist = getWishlist;
window.toggleWishlist = toggleWishlist;
window.isInWishlist = isInWishlist;
window.WISHLIST_KEY = WISHLIST_KEY;
window.updateReviewsCount = updateReviewsCount;
window.getReviewsCount = getReviewsCount;

})();
