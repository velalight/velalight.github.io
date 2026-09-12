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

/* ═══════════════════════════════════════════════════════════
   ✨ CART UI STYLES — النسخة المضغوطة + Sticky Actions
   ═══════════════════════════════════════════════════════════ */
function injectCartStyles(){
  if(document.getElementById('vl-cart-luxe-styles')) return;
  const style = document.createElement('style');
  style.id = 'vl-cart-luxe-styles';
  style.textContent = `
    /* ═══ Free Shipping Progress Bar ═══ */
    .vl-ship-bar{
      background: linear-gradient(135deg,#fdf5ed 0%,#faf0e6 100%);
      border: 1px solid rgba(212,175,55,.35);
      border-radius: 14px;
      padding: 12px 14px;
      margin: 0 0 10px;
      box-shadow: 0 2px 12px rgba(212,175,55,.08);
      position: relative;
      overflow: hidden;
    }
    .vl-ship-bar.vl-ship-success{
      background: linear-gradient(135deg,#eafaf1 0%,#d5f5e3 100%);
      border-color: rgba(39,174,96,.4);
      animation: vlShipPulse 2s ease-in-out infinite;
    }
    @keyframes vlShipPulse{
      0%,100%{ box-shadow: 0 2px 12px rgba(39,174,96,.12); }
      50%{ box-shadow: 0 4px 22px rgba(39,174,96,.28); }
    }
    .vl-ship-bar .vl-ship-txt{
      text-align: center;
      font-size: .82rem;
      color: var(--dark,#3d2f1f);
      margin-bottom: 7px;
      font-weight: 500;
      line-height: 1.4;
    }
    .vl-ship-bar .vl-ship-txt strong{ color: #b8860b; font-weight: 800; }
    .vl-ship-bar.vl-ship-success .vl-ship-txt strong{ color: #1e8449; }
    .vl-ship-track{
      background: #e8dcc9;
      height: 8px;
      border-radius: 999px;
      overflow: hidden;
      position: relative;
      box-shadow: inset 0 1px 2px rgba(0,0,0,.08);
    }
    .vl-ship-fill{
      background: linear-gradient(90deg,#d4af37 0%,#f9d877 50%,#d4af37 100%);
      background-size: 200% 100%;
      height: 100%;
      width: 0%;
      border-radius: 999px;
      transition: width .8s cubic-bezier(.22,1,.36,1);
      animation: vlShimmer 3s linear infinite;
      box-shadow: 0 0 10px rgba(212,175,55,.5);
    }
    .vl-ship-bar.vl-ship-success .vl-ship-fill{
      background: linear-gradient(90deg,#27ae60 0%,#2ecc71 50%,#27ae60 100%);
      background-size: 200% 100%;
      box-shadow: 0 0 12px rgba(39,174,96,.6);
    }
    @keyframes vlShimmer{
      0%{ background-position: 200% 0; }
      100%{ background-position: -200% 0; }
    }

    /* ═══ Confetti ═══ */
    .vl-confetti-piece{
      position: fixed;
      width: 10px;
      height: 10px;
      z-index: 99999;
      pointer-events: none;
      opacity: 1;
      animation: vlConfettiFall linear forwards;
    }
    @keyframes vlConfettiFall{
      0%{ transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
      100%{ transform: translateY(100vh) rotate(720deg) scale(.4); opacity: 0; }
    }

    /* ═══════════════════════════════════════════════════════
       ✨ COMPACT LUXURY ITEM CARDS — نسخة محسّنة
       السعر + إجمالي الصنف + الكمية في صف واحد
       ═══════════════════════════════════════════════════════ */
    .citem{
      display: flex;
      gap: 10px;
      padding: 10px;
      background: linear-gradient(135deg,#fffbf5 0%,#fdf8f0 100%);
      border: 1px solid rgba(212,175,55,.18);
      border-radius: 14px;
      margin-bottom: 8px;
      position: relative;
      transition: all .25s ease;
      align-items: flex-start;
      box-shadow: 0 1px 6px rgba(139,90,43,.05);
    }
    .citem:hover{
      border-color: rgba(212,175,55,.4);
      box-shadow: 0 4px 18px rgba(139,90,43,.1);
    }
    .citem-media{
      flex: 0 0 68px;
      width: 68px;
      height: 68px;
      border-radius: 10px;
      overflow: hidden;
      background: #f5efe5;
      display: grid;
      place-items: center;
      border: 1px solid rgba(212,175,55,.15);
      box-shadow: 0 2px 8px rgba(139,90,43,.08);
    }
    .citem-media img{
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .citem-info{
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding-inline-end: 32px;
    }
    .citem-info h5{
      font-family: var(--fd,serif);
      font-size: .92rem;
      margin: 0;
      font-weight: 700;
      color: var(--dark,#3d2f1f);
      line-height: 1.25;
    }

    /* Scent Pill Selector — صف واحد مع الاسم */
    .cart-scent-picker{
      display: flex;
      align-items: center;
      gap: 5px;
      margin: 0;
    }
    .cart-scent-label{
      font-size: .68rem;
      color: var(--mut,#9a8874);
      display: flex;
      align-items: center;
      gap: 3px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .cart-scent-select{
      flex: 1;
      min-width: 0;
      padding: 5px 24px 5px 10px;
      border-radius: 999px;
      border: 1.5px solid rgba(212,175,55,.3);
      background: #fff url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23d4af37' stroke-width='3' stroke-linecap='round'><polyline points='6 9 12 15 18 9'/></svg>") no-repeat right 8px center;
      background-size: 10px;
      font-family: inherit;
      font-size: .76rem;
      color: var(--dark,#3d2f1f);
      cursor: pointer;
      outline: none;
      transition: all .2s ease;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      font-weight: 500;
      box-shadow: 0 1px 4px rgba(212,175,55,.08);
      text-overflow: ellipsis;
    }
    html[dir="rtl"] .cart-scent-select{
      background-position: left 8px center;
      padding: 5px 10px 5px 24px;
    }
    .cart-scent-select:hover{
      border-color: rgba(212,175,55,.6);
      background-color: #fffdf9;
    }
    .cart-scent-select:focus{
      border-color: #d4af37;
      box-shadow: 0 0 0 3px rgba(212,175,55,.15);
    }
    .cart-scent-select option{ padding: 8px; }

    /* ✨ الصف الموحد: السعر + إجمالي الصنف + الكمية في صف واحد */
    .citem-foot{
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      padding-top: 5px;
      border-top: 1px dashed rgba(212,175,55,.2);
      margin-top: 2px;
    }
    .citem-price{
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
      flex-shrink: 0;
    }
    .citem-price .lbl{
      font-size: .62rem;
      color: var(--mut,#9a8874);
      font-weight: 500;
      line-height: 1;
    }
    .citem-price .val{
      font-size: .88rem;
      color: #b8860b;
      font-weight: 800;
      line-height: 1.1;
      white-space: nowrap;
    }
    .citem-price .val-total{
      font-size: .88rem;
      color: var(--dark,#3d2f1f);
      font-weight: 800;
      line-height: 1.1;
      white-space: nowrap;
    }
    .citem-divider{
      width: 1px;
      height: 26px;
      background: rgba(212,175,55,.25);
      flex-shrink: 0;
    }
    /* Qty أصغر وأنيق */
    .qty{
      display: inline-flex;
      align-items: center;
      gap: 0;
      border: 1.5px solid rgba(212,175,55,.3);
      border-radius: 999px;
      padding: 1px;
      background: #fff;
      margin-inline-start: auto;
      box-shadow: 0 1px 4px rgba(212,175,55,.08);
      flex-shrink: 0;
    }
    .qty button{
      width: 30px;
      height: 30px;
      border: none;
      background: transparent;
      border-radius: 50%;
      font-size: 1.1rem;
      font-weight: 700;
      color: #b8860b;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all .18s ease;
      line-height: 1;
      -webkit-tap-highlight-color: transparent;
    }
    .qty button:hover{
      background: rgba(212,175,55,.12);
      transform: scale(1.06);
    }
    .qty button:active{
      background: rgba(212,175,55,.25);
      transform: scale(.94);
    }
    .qty b{
      min-width: 26px;
      text-align: center;
      font-size: .88rem;
      font-weight: 800;
      color: var(--dark,#3d2f1f);
      padding: 0 2px;
    }

    /* Trash Button — مضغوط */
    .rm{
      position: absolute;
      top: 8px;
      inset-inline-end: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(231,76,60,.08);
      color: #e74c3c;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all .22s ease;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .rm svg{
      width: 13px;
      height: 13px;
      stroke: currentColor;
      stroke-width: 2;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .rm:hover{
      background: #e74c3c;
      color: #fff;
      transform: rotate(8deg) scale(1.08);
      box-shadow: 0 4px 12px rgba(231,76,60,.35);
    }
    .rm:active{
      transform: rotate(8deg) scale(.94);
    }

    /* ═══ Cross-Sell Compact ═══ */
    .cross-sell-box{
      background: linear-gradient(135deg,#fdf5ed 0%,#faf0e6 100%);
      border: 1px dashed rgba(212,175,55,.45);
      border-radius: 14px;
      padding: 10px 12px;
      margin-top: 8px;
      position: relative;
      overflow: hidden;
    }
    .cross-sell-box::before{
      content: "";
      position: absolute;
      top: -40px;
      inset-inline-end: -40px;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle,rgba(212,175,55,.14),transparent 70%);
      pointer-events: none;
    }
    .vl-cross-head{
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      font-weight: 800;
      font-size: .82rem;
      color: #b8860b;
      position: relative;
      z-index: 1;
    }
    .vl-cross-head span.emoji{
      font-size: 1rem;
      animation: vlSparkle 2.4s ease-in-out infinite;
    }
    @keyframes vlSparkle{
      0%,100%{ transform: scale(1) rotate(0); }
      50%{ transform: scale(1.12) rotate(8deg); }
    }
    .vl-cross-row{
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
      z-index: 1;
    }
    .vl-cross-img{
      flex: 0 0 52px;
      width: 52px;
      height: 52px;
      border-radius: 10px;
      overflow: hidden;
      background: #f5efe5;
      border: 1px solid rgba(212,175,55,.2);
      display: grid;
      place-items: center;
    }
    .vl-cross-img img{
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .vl-cross-meta{
      flex: 1;
      min-width: 0;
    }
    .vl-cross-meta .nm{
      font-weight: 700;
      font-size: .82rem;
      color: var(--dark,#3d2f1f);
      line-height: 1.25;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .vl-cross-meta .pr{
      font-size: .76rem;
      color: #b8860b;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .vl-quick-add{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      padding: 7px 10px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(135deg,#d4af37,#f9d877);
      color: #3d2f1f;
      font-family: inherit;
      font-size: .76rem;
      font-weight: 800;
      cursor: pointer;
      transition: all .22s ease;
      box-shadow: 0 2px 8px rgba(212,175,55,.3);
      -webkit-tap-highlight-color: transparent;
    }
    .vl-quick-add:hover{
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(212,175,55,.45);
    }
    .vl-quick-add:active{ transform: translateY(0) scale(.98); }
    .vl-quick-add.vl-added{
      background: linear-gradient(135deg,#27ae60,#2ecc71);
      color: #fff;
    }

    /* ═══ Discount Badges ═══ */
    .vl-disc-row{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      border-radius: 10px;
      margin: 4px 0;
      font-size: .78rem;
      transition: all .3s ease;
    }
    .vl-disc-row.vl-disc-active{
      background: linear-gradient(135deg,#eafaf1 0%,#d5f5e3 100%);
      border: 1px solid rgba(39,174,96,.35);
      color: #1e8449;
      font-weight: 700;
    }
    .vl-disc-row.vl-disc-active .vl-disc-val{
      color: #1e8449;
      font-weight: 800;
      font-size: .88rem;
    }
    .vl-disc-row.vl-disc-cancelled{
      background: #f5f5f5;
      border: 1px dashed rgba(0,0,0,.08);
      color: #aaa;
      text-decoration: line-through;
      opacity: .7;
    }
    .vl-disc-row.vl-disc-cancelled .vl-disc-val{
      color: #aaa;
      text-decoration: line-through;
    }
    .vl-disc-label{
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .vl-disc-hint{
      display: block;
      font-size: .62rem;
      font-weight: 500;
      color: #7f8c8d;
      margin-top: 1px;
      text-decoration: none;
    }

    /* ═══ Checkout Button Pulse ═══ */
    .vl-checkout-pulse{
      position: relative;
      animation: vlCheckoutPulse 2.4s ease-in-out infinite;
    }
    @keyframes vlCheckoutPulse{
      0%,100%{
        box-shadow: 0 4px 14px rgba(212,175,55,.35), 0 0 0 0 rgba(212,175,55,.4);
      }
      50%{
        box-shadow: 0 6px 24px rgba(212,175,55,.55), 0 0 0 8px rgba(212,175,55,0);
      }
    }

    /* ═══ Trust Badges ═══ */
    .vl-trust-wrap{
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
      margin: 6px 0 4px;
      flex-wrap: wrap;
      padding: 5px 6px;
      background: linear-gradient(135deg,rgba(253,245,237,.6),rgba(250,240,230,.6));
      border-radius: 12px;
      border: 1px solid rgba(212,175,55,.15);
    }
    .vl-trust-item{
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: .62rem;
      color: #8b6f47;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 999px;
      background: rgba(255,255,255,.7);
    }
    .vl-trust-item .ic{ font-size: .8rem; }

    /* ═══ Empty State ═══ */
    .vl-empty-cart{
      padding: 1.5rem 1rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .vl-empty-candle{
      font-size: 2.8rem;
      opacity: .55;
      animation: vlCandleFloat 3.2s ease-in-out infinite;
      filter: drop-shadow(0 6px 14px rgba(212,175,55,.28));
    }
    @keyframes vlCandleFloat{
      0%,100%{ transform: translateY(0) rotate(-2deg); }
      50%{ transform: translateY(-9px) rotate(2deg); }
    }
    .vl-empty-title{
      font-family: var(--fd,serif);
      font-size: 1rem;
      color: #b8860b;
      font-weight: 800;
      line-height: 1.4;
      max-width: 240px;
    }
    .vl-empty-sub{
      font-size: .76rem;
      color: #9a8874;
      line-height: 1.5;
      max-width: 240px;
    }
    .vl-empty-cta{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 22px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(135deg,#d4af37,#f9d877);
      color: #3d2f1f;
      font-family: inherit;
      font-size: .85rem;
      font-weight: 800;
      cursor: pointer;
      margin-top: 4px;
      transition: all .25s ease;
      box-shadow: 0 5px 18px rgba(212,175,55,.35);
      -webkit-tap-highlight-color: transparent;
    }
    .vl-empty-cta:hover{
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(212,175,55,.5);
    }

    /* ═══════════════════════════════════════════════════════
       ✨ CART LAYOUT — Flex: رأس ثابت + محتوى scroll + فوتر ثابت
       ═══════════════════════════════════════════════════════ */
    #cartDrawer{
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
      height: 100dvh !important;
      max-height: 100vh !important;
      max-height: 100dvh !important;
      overflow: hidden !important;
    }
    #cartDrawer > .dhead,
    #cartDrawer > .drawer-head{
      flex-shrink: 0;
    }
    #cartDrawer > .dbody,
    #cartDrawer > .drawer-body{
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
      padding-bottom: 6px !important;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    #cartItems{
      padding-bottom: 4px !important;
    }
    #cartDrawer .dfoot{
      flex-shrink: 0;
      background: #ffffff !important;
      border-top: 1px solid rgba(212,175,55,.25);
      box-shadow: 0 -4px 14px rgba(139,90,43,.06);
      padding: 8px 12px 10px !important;
      max-height: 50vh;
      overflow-y: auto;
      position: relative;
      z-index: 5;
      -webkit-overflow-scrolling: touch;
    }

    /* ═══ Compact Cart Form ═══ */
    #cartDrawer .co-form,
    #cartDrawer form{
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    #cartDrawer .co-form > *,
    #cartDrawer form > *{
      margin: 0 !important;
    }
    #cartDrawer input[type="text"],
    #cartDrawer input[type="tel"],
    #cartDrawer input[type="email"],
    #cartDrawer input:not([type]),
    #cartDrawer select,
    #cartDrawer textarea{
      padding: 7px 10px !important;
      font-size: .8rem !important;
      border-radius: 9px !important;
      line-height: 1.3 !important;
      min-height: 0 !important;
      height: auto !important;
    }
    #cartDrawer textarea{
      min-height: 34px !important;
      max-height: 56px !important;
      resize: none !important;
    }
    #cartDrawer label{
      font-size: .72rem !important;
      margin-bottom: 1px !important;
      font-weight: 600;
    }
    /* صف مزدوج للفورم (اسم/تليفون في سطر واحد) */
    .vl-form-row{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    @media (max-width: 380px){
      .vl-form-row{ grid-template-columns: 1fr; }
    }

    /* ═══ Compact Payment Info ═══ */
    #cartDrawer .pay-note,
    #cartDrawer .payment-info,
    #cartDrawer [class*="payment"],
    #cartDrawer [class*="pay-"]{
      padding: 6px 10px !important;
      font-size: .7rem !important;
      line-height: 1.4 !important;
      margin: 4px 0 !important;
      border-radius: 9px !important;
    }

    /* ═══ Totals Row Compact ═══ */
    #cartDrawer .trow{
      padding: 3px 0 !important;
      font-size: .8rem !important;
    }
    #cartDrawer .trow.total{
      padding-top: 6px !important;
      margin-top: 3px !important;
      border-top: 1px dashed rgba(212,175,55,.3) !important;
      font-size: .98rem !important;
      font-weight: 800 !important;
    }

    /* ═══════════════════════════════════════════════════════
       ✨ Sticky Actions Bar — زر الواتساب + إفراغ السلة ثابتين
       ═══════════════════════════════════════════════════════ */
    .vl-sticky-actions{
      position: sticky;
      bottom: 0;
      background: linear-gradient(180deg, rgba(255,255,255,.85) 0%, #ffffff 22%);
      padding: 8px 0 2px;
      margin-top: 4px;
      z-index: 10;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .vl-sticky-actions .vl-sticky-row{
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 6px;
      align-items: stretch;
    }
    .vl-empty-btn{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1.5px solid rgba(231,76,60,.35);
      background: #fff;
      color: #c0392b;
      font-family: inherit;
      font-size: .78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s ease;
      white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
    }
    .vl-empty-btn:hover{
      background: #fef2f0;
      border-color: #e74c3c;
    }
    .vl-empty-btn:active{ transform: scale(.97); }

    .vl-checkout-sticky{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 16px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(135deg,#d4af37,#f9d877);
      color: #3d2f1f;
      font-family: inherit;
      font-size: .9rem;
      font-weight: 800;
      cursor: pointer;
      transition: all .25s ease;
      box-shadow: 0 6px 20px rgba(212,175,55,.4);
      -webkit-tap-highlight-color: transparent;
      width: 100%;
    }
    .vl-checkout-sticky:hover{
      transform: translateY(-1px);
      box-shadow: 0 8px 26px rgba(212,175,55,.55);
    }
    .vl-checkout-sticky:active{ transform: translateY(0) scale(.98); }

    /* ═══ Mobile ═══ */
    @media (max-width: 768px){
      #cartDrawer{
        height: 100vh !important;
        height: 100dvh !important;
        max-height: 100vh !important;
        max-height: 100dvh !important;
      }
      .citem{
        padding: 9px;
        gap: 9px;
        margin-bottom: 7px;
      }
      .citem-media{
        flex: 0 0 60px;
        width: 60px;
        height: 60px;
      }
      .citem-info h5{ font-size: .86rem; }
      .citem-price .val,
      .citem-price .val-total{ font-size: .84rem; }
      #cartDrawer .dfoot{
        max-height: 55vh;
      }
    }

    @media (max-width: 380px){
      .citem-media{
        flex: 0 0 54px;
        width: 54px;
        height: 54px;
      }
      .citem-info h5{ font-size: .82rem; }
      .qty button{
        width: 27px;
        height: 27px;
        font-size: .98rem;
      }
      .qty b{ font-size: .82rem; min-width: 22px; }
      .citem-price .val,
      .citem-price .val-total{ font-size: .8rem; }
    }

    /* ✨ إخفاء الفوتر الثابت للموقع لما السلة تفتح */
    body.vl-cart-open #bottomNav,
    body.vl-cart-open .bottom-nav,
    body.vl-cart-open .mobile-nav,
    body.vl-cart-open nav[class*="bottom"],
    body.vl-cart-open .site-footer,
    body.vl-cart-open footer.fixed{
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════
   ✨ adjustCartDrawerPadding — مع Flex Layout ما بنحتاجش padding
   ═══════════════════════════════════════════════════════════ */
function adjustCartDrawerPadding(){
  const items = document.getElementById('cartItems');
  if(!items) return;
  items.style.paddingBottom = '4px';
}

/* ═══════════════════════════════════════════════════════════
   ✨ Confetti Animation
   ═══════════════════════════════════════════════════════════ */
function triggerConfetti(count){
  count = count || 55;
  const colors = ['#d4af37','#f9d877','#27ae60','#e74c3c','#3498db','#e67e22','#9b59b6','#f1c40f'];
  const frag = document.createDocumentFragment();
  for(let i = 0; i < count; i++){
    const p = document.createElement('div');
    p.className = 'vl-confetti-piece';
    const size = 6 + Math.random() * 8;
    p.style.width = size + 'px';
    p.style.height = size * (0.6 + Math.random() * 0.9) + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = '-20px';
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    const dur = 2.4 + Math.random() * 2;
    p.style.animationDuration = dur + 's';
    p.style.animationDelay = (Math.random() * 0.6) + 's';
    frag.appendChild(p);
    setTimeout(() => p.remove(), (dur + 0.8) * 1000);
  }
  document.body.appendChild(frag);
}

/* ═══════════════════════════════════════════════════════════
   ✨ FREE SHIPPING — Threshold
   ═══════════════════════════════════════════════════════════ */
const FREE_SHIP_THRESHOLD = 3000;
let freeShipCelebrated = false;

/* ═══ FILL MISSING TRANSLATIONS ═══ */
(function fillMissingI18n(){
  if(typeof I18N==="undefined") return;

  const add = {

    ar: {
reviews_back: "← الرجوع للرئيسية",
reviews_stats_trust: "ثقة تتجدد",
reviews_quote: "مش مجرد شمعة… دي لحظة بتتعاش!",
reviews_quote_author: "— واحد من عملائنا",
reviews_cta_title: "جاهز تنضم لعائلة VelaLight؟ 🕯️",
reviews_cta_sub: "اختار شمعتك الفاخرة واصنع لحظتك الخاصة",
reviews_cta_btn: "تسوق الآن 🛍️",
foot_wishlist: "❤️ المفضلة",
foot_orders: "📦 طلباتي",

      ship_note:
        "🚚 الشحن: يُدفع كاش لمندوب الشحن عند الاستلام.",

      pay_products_note:
        "💳 سيتم إرسال تفاصيل الدفع المتاحة (InstaPay / فودافون كاش / أورنج كاش / تحويل بنكي) عبر الواتساب فور تأكيد الطلب.",

      pay_title:
        "InstaPay / فودافون كاش / أورنج كاش",

      paymethod_d:
        "قيمة المنتجات تُدفع مقدماً (تحويل) عند تأكيد الطلب.",

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

      handmade_note:
        "قطعة يدوية تُجهّز بعناية عند الطلب — كل شمعة فريدة ومميزة",

      pd_handmade_note:
        "قطعة يدوية تُجهّز بعناية عند الطلب — كل شمعة فريدة ومميزة",

      pd_desc_tab:
        "📝 الوصف",

      pd_specs_tab:
        "📋 المواصفات",

      pd_reviews_tab:
        "⭐ المراجعات",

      pd_zoom:
        "🔍 تكبير",

      pd_gallery_count:
        "الصور",

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

      pd_add:
        "🛍️ أضف للسلة",

      pd_buy:
        "💬 اطلب عبر واتساب",

      pd_hours:
        "مدة الاشتعال:",

      pd_materials:
        "الخامات:",

      pd_ship:
        "التوصيل:",

      pd_ship_v:
        "3–7 أيام",

      pd_review_word:
        "مراجعة",

      pd_read_all:
        "اقرأ الكل",

      pd_first_review:
        "كن أول من يشارك رأيه",

      pd_rel_h2:
        "✨ منتجات هتعجبك",

      pd_share:
        "مشاركة:",

      pd_copy_link:
        "📋 نسخ الرابط",

      pd_product:
        "المنتج",

      pd_not_found_title:
        "😕 المنتج غير متاح",

      pd_not_found_desc:
        "عذراً، لم نتمكن من العثور على هذا المنتج",

      pd_browse_products:
        "تصفح المنتجات",

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

      reviews_page_title: "كل آراء عملائنا",
      reviews_page_sub: "شوف تجارب العملاء الحقيقية مع منتجات VelaLight",
      reviews_verified: "عميل موثّق",
      reviews_customer: "عميل سعيد",
      reviews_share_your: "شاركنا رأيك ✨",
      reviews_share_sub: "جرب منتج من VelaLight؟ اكتبلنا تجربتك",

      prod_word: "منتج",
      no_products: "لا توجد منتجات",

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

      rev_see_all: "📸 شوف كل التجارب",
      rev_stats_label: "عميل وثق فينا",
      rev_stats_rating: "تقييم 5 نجوم",
      rev_loading: "⏳ جاري تحميل التجارب...",

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

      cart_luxe_empty_title: "سلتك تنتظر بعض الدفء والروائح الفاخرة...",
      cart_luxe_empty_sub: "اختار شمعتك المفضلة وابدأ لحظتك الخاصة",
      cart_luxe_empty_cta: "تصفح تشكيلتنا الآن ✨",
      cart_luxe_cross_title: "أكمل مجموعتك",
      cart_luxe_cross_sub: "أضيف لمسة ساحرة لطلبك",
      cart_luxe_cross_add: "أضف بضغطة واحدة",
      cart_luxe_cross_added: "تمت الإضافة",
      cart_luxe_ship_add: "أضف",
      cart_luxe_ship_to_go: "للحصول على شحن مجاني! 🚚",
      cart_luxe_ship_success: "مبروك! فتحت خيار الشحن المجاني 🥳",
      cart_luxe_disc_applied: "تم تطبيق الخصم الأكبر لك!",
      cart_luxe_disc_qty: "خصم الكمية",
      cart_luxe_disc_coupon: "كوبون",
      cart_luxe_disc_not_applied: "غير مطبق — تم تطبيق الخصم الأكبر",
      cart_luxe_checkout: "تأكيد الطلب عبر الواتساب 💬",
      cart_luxe_trust1: "دفع آمن",
      cart_luxe_trust2: "صناعة يدوية 100%",
      cart_luxe_trust3: "ضمان التوصيل",
      cart_luxe_clear: "إفراغ السلة",
    },

    en: {
reviews_back: "← Back to Home",
reviews_stats_trust: "Trust Renewed",
reviews_quote: "Not just a candle… it's a moment to live!",
reviews_quote_author: "— One of our customers",
reviews_cta_title: "Ready to join the VelaLight family? 🕯️",
reviews_cta_sub: "Choose your luxury candle and create your own moment",
reviews_cta_btn: "Shop Now 🛍️",
foot_wishlist: "❤️ Wishlist",
foot_orders: "📦 My Orders",

      ship_note:
        "🚚 Shipping: paid cash to the courier on delivery.",

      pay_products_note:
        "Payment details (InstaPay / Vodafone Cash / Orange Cash / Bank Transfer) will be sent via WhatsApp upon order confirmation.",

      pay_title:
        "InstaPay / Vodafone Cash / Orange Cash",

      paymethod_d:
        "Upfront transfer (InstaPay / Vodafone Cash / Orange Cash), shipping cash on delivery.",

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

      handmade_note:
        "Handmade piece prepared with care upon order — every candle is unique and special",

      pd_handmade_note:
        "Handmade piece prepared with care upon order — every candle is unique and special",

      pd_desc_tab: "📝 Description",
      pd_specs_tab: "📋 Specifications",
      pd_reviews_tab: "⭐ Reviews",

      pd_zoom: "🔍 Zoom",
      pd_gallery_count: "Images",

      pd_scent_t: "🌸 Scent:",
      pd_qty_t: "Quantity:",
      pd_required: "Required",
      pd_decrease: "Decrease quantity",
      pd_increase: "Increase quantity",
      pd_wishlist: "Add to favorites",

      pd_add: "🛍️ Add to Cart",
      pd_buy: "💬 Order via WhatsApp",

      pd_hours: "Burn time:",
      pd_materials: "Materials:",
      pd_ship: "Delivery:",
      pd_ship_v: "3–7 days",

      pd_review_word: "reviews",
      pd_read_all: "Read all",
      pd_first_review: "Be the first to review",

      pd_rel_h2: "✨ You May Also Like",

      pd_share: "Share:",
      pd_copy_link: "📋 Copy Link",

      pd_product: "Product",
      pd_not_found_title: "😕 Product Not Available",
      pd_not_found_desc: "Sorry, we couldn't find this product",
      pd_browse_products: "Browse Products",

      reviews_kicker: "💛 Your Words Mean the Most",
      reviews_title: "Our Customers' Reviews",
      reviews_desc: "We don't just write claims — we show the real experience. These are genuine screenshots from our customers after receiving their orders.",
      reviews_cta: "✨ Tried our candles?",
      reviews_cta_link: "Send us your review on WhatsApp",

brand_promise_title:
  "Details That Make the Difference",

brand_promise_desc:
  "Handcrafted candles, carefully selected scents, and thoughtful gifts made for every special moment.",

brand_point1_title: "Handcrafted",
brand_point1_desc: "Every piece is made and prepared with care.",
brand_point2_title: "A Gift for Every Occasion",
brand_point2_desc: "Thoughtful choices for every moment and celebration.",
brand_point3_title: "Made for You",
brand_point3_desc: "We help you choose the right scent and details for your taste.",

      faq1q:
        "How can I place an order and what payment methods are available?",
      faq1a:
        "You can add your selected products to the cart and complete your order easily. Product payment is made upfront via InstaPay, Vodafone Cash, or bank transfer, while the shipping fee is paid in cash to the courier upon delivery.",

      faq2q: "Do you ship to all governorates in Egypt?",
      faq2a: "Yes, we deliver safely and reliably to all governorates across Egypt.",

      faq3q: "How long does it take to prepare and ship my order?",
      faq3a: "Because VelaLight products are carefully handmade, preparation usually takes 3 to 7 business days, in addition to the shipping time depending on your governorate.",

      faq4q: "Are VelaLight candles made from soy wax?",
      faq4a: "Yes, we use 100% natural soy wax. It burns more slowly and cleanly and helps the fragrance diffuse effectively.",

      faq5q: "How long does a candle burn, and how can I get the best performance?",
      faq5a: "Burn time varies depending on the candle's weight and size, as detailed in each product description. For the best results, during the first use, allow the wax to melt completely across the surface and reach the edges to prevent tunneling and ensure an even burn.",

      faq6q: "How can I choose the right scent?",
      faq6a: "We offer a variety of luxurious fragrances. If you're unsure which one to choose, contact us via WhatsApp and we'll be happy to help you select the perfect scent based on your taste, occasion, and desired atmosphere.",

      faq7q: "Do you offer gift wrapping?",
      faq7a: "Yes. All VelaLight products come in elegant, luxurious packaging that is ready for gifting.",

      faq8q: "What is your return and exchange policy?",
      faq8a: "Due to the nature of our handmade products, returns or exchanges are not accepted after the product has been opened or used, or due to a change of mind after the order has been confirmed. If your order arrives with a manufacturing defect or shipping damage, please contact us within 24 hours of delivery and we will be happy to resolve the issue.",

      mq_delivery: "🚚 Fast delivery across Egypt",
      mq_discounts: "🏷️ Exclusive discounts on selected collections",
      mq_gift: "🎁 Free gift wrapping with every order",
      mq_handmade: "🤲 100% handmade with natural materials",
      mq_scents: "🕯️ More than 23 luxury scents available",
      mq_shipping: "📦 Safe shipping from our workshop to your door",
      mq_support: "💬 Daily customer support",

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

      reviews_page_title: "All Customer Reviews",
      reviews_page_sub: "See real experiences from VelaLight customers",
      reviews_verified: "Verified Customer",
      reviews_customer: "Happy Customer",
      reviews_share_your: "Share Your Review ✨",
      reviews_share_sub: "Tried a VelaLight product? Tell us about your experience",

      prod_word: "products",
      no_products: "No products found",

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

      rev_see_all: "📸 See All Experiences",
      rev_stats_label: "Customers Trusted Us",
      rev_stats_rating: "5-Star Rating",
      rev_loading: "⏳ Loading experiences...",

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

      cart_luxe_empty_title: "Your cart is waiting for some warmth and luxury scents...",
      cart_luxe_empty_sub: "Choose your favorite candle and start your own moment",
      cart_luxe_empty_cta: "Browse Our Collection Now ✨",
      cart_luxe_cross_title: "Complete Your Set",
      cart_luxe_cross_sub: "Add a magical touch to your order",
      cart_luxe_cross_add: "Quick Add",
      cart_luxe_cross_added: "Added",
      cart_luxe_ship_add: "Add",
      cart_luxe_ship_to_go: "to unlock FREE shipping! 🚚",
      cart_luxe_ship_success: "Congrats! You unlocked FREE shipping 🥳",
      cart_luxe_disc_applied: "The biggest discount was applied for you!",
      cart_luxe_disc_qty: "Quantity Discount",
      cart_luxe_disc_coupon: "Coupon",
      cart_luxe_disc_not_applied: "Not applied — bigger discount was used",
      cart_luxe_checkout: "Confirm Order via WhatsApp 💬",
      cart_luxe_trust1: "Secure Payment",
      cart_luxe_trust2: "100% Handmade",
      cart_luxe_trust3: "Delivery Guarantee",
      cart_luxe_clear: "Empty Cart",
    }

  };

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
  injectCartStyles();

  initLang();
  initMarquee();
  initEmbers();
  initReveal();

  const isProductsPage = window.location.pathname.includes('products.html');
  const isReviewsPage = window.location.pathname.includes('reviews.html');
  const isProductPage = window.location.pathname.includes('product.html');

  const grid = document.getElementById("pgrid");
  if (grid && !isProductPage) {
    grid.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1.4rem; padding:1rem;">
        ${Array(4).fill(`<div class="skel" style="height:380px;border-radius:18px;"></div>`).join('')}
      </div>
    `;
  }

  loadAll().then(() => {
    try {
      localStorage.setItem("vl_products_v3", JSON.stringify(ALL_PRODUCTS.slice(0, 200)));
      localStorage.setItem("vl_products_v3_time", String(Date.now()));
    } catch(e) {}

    isFirstRenderComplete = true;

    if (isProductsPage) {
      renderChips();
      if (typeof renderProductsPage === "function") {
        renderProductsPage();
      } else {
        renderProducts();
      }
    } else if (isReviewsPage) {
      if (typeof renderReviewsPage === "function") {
        renderReviewsPage();
      }
    } else if (!isProductPage) {
      renderChips();
      renderProducts();
    }
    
    renderScents();
    renderFAQ();
    initProductRealtimeSync();
    requestIdle(() => prefetchProductPages());
    
  }).catch(err => {
    console.warn("⚠️ loadAll failed, falling back to cache:", err);
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
  
  if (typeof window.updateReviewsCount === 'function') {
    window.updateReviewsCount();
  }
});

window.addEventListener("data-refresh", () => {
  if (!isFirstRenderComplete) {
    pendingDataRefresh = true;
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
    renderCart();
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

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k=el.dataset.i18n;
    const v=t(k);
    if(v&&v!==k){ el.textContent=v; }
  });

  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
    const k=el.dataset.i18nPh;
    const v=t(k);
    if(v&&v!==k){ el.placeholder=v; }
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el=>{
    const k=el.dataset.i18nTitle;
    const v=t(k);
    if(v&&v!==k){ el.title=v; }
  });

  const mq=document.getElementById("mqTrack");
  if(mq){
    const marqueeKeys=["mq_delivery","mq_discounts","mq_gift","mq_handmade","mq_scents","mq_shipping","mq_support"];
    mq.innerHTML="";
    for(let i=0;i<2;i++){
      marqueeKeys.forEach(key=>{
        const span=document.createElement("span");
        span.textContent=t(key);
        mq.appendChild(span);
      });
    }
  }

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
  const isProductsPage = window.location.pathname.includes('products.html');
  
  if (!isProductsPage) {
    w.style.display="none";
    w.setAttribute("aria-hidden","true");
  } else {
    w.style.display="";
    w.removeAttribute("aria-hidden");
  }
  
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
        ? `<video src="${brideVideoUrl}" autoplay muted loop playsinline preload="metadata" poster="${imgSrc}" style="width:100%;height:100%;object-fit:contain;background:#000;display:block;border-radius:inherit;" aria-label="${pname(p)}"></video>`
        : `<img src="${imgSrc}" alt="${pname(p)}" loading="${loadingAttr}" decoding="async" fetchpriority="${fetchPriority}" width="400" height="400" onload="this.classList.add('loaded')" onerror="window.handleImageError(this, '${p.id}')">`;

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

  if (!productGridClickBound) {
    grid.addEventListener('click', handleProductGridClick);
    productGridClickBound = true;
  }
}

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

  list.sort((a, b) => {
    if (catF === "all") {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.pinned && b.pinned) { return (b.pinnedAt || 0) - (a.pinnedAt || 0); }
    }
    
    switch(sort) {
      case "asc": return (a.price || 0) - (b.price || 0);
      case "desc": return (b.price || 0) - (a.price || 0);
      case "rating": return ((typeof ratingOf === "function" ? ratingOf(b.id)?.avg : 0) || 0) - ((typeof ratingOf === "function" ? ratingOf(a.id)?.avg : 0) || 0);
      case "best": return (b.sold || 0) - (a.sold || 0);
      case "disc": return ((b.old - b.price) / Math.max(b.old, 1)) - ((a.old - a.price) / Math.max(a.old, 1));
      case "new":
      default: return (b.createdAt || 0) - (a.createdAt || 0);
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
      try { imgSrc = (typeof imgOf === "function") ? imgOf(p) : (p.img || ""); }
      catch(e) { imgSrc = placeholderSvg; }
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
          <img src="${imgSrc}" alt="${pname(p)}" loading="${loadingAttr}" decoding="async" fetchpriority="${fetchPriority}" width="400" height="400" onload="this.classList.add('loaded')" onerror="window.handleImageError(this, '${p.id}')">
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

  if (!productGridClickBound) {
    grid.addEventListener('click', handleProductGridClick);
    productGridClickBound = true;
  }
}

function renderReviewsPage() {
  const grid = document.getElementById("reviewsGrid");
  if (!grid) return;

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
    card.style.cssText = `background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;padding:1.5rem;display:flex;gap:1.5rem;align-items:center;transition:.3s;margin-bottom:1.2rem;`;

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
      if (quickAddQty > 1) { quickAddQty--; updateQuickAddQtyUI(); }
    } else if (e.target.id === "smQPlus") {
      if (quickAddQty < quickAddMaxStock) { quickAddQty++; updateQuickAddQtyUI(); }
      else { toast(LANG === "en" ? `⚠️ Only ${quickAddMaxStock} available` : `⚠️ المتاح ${quickAddMaxStock} قطعة فقط`); }
    }
  });

  overlay?.addEventListener("change", (e) => {
    if (e.target.id === "modalScentSelect") { quickAddScent = e.target.value; }
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

    const added = addToCart(quickAddProduct, { scent: currentScent, qty: currentQty });

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
    addBtn.textContent = t("quick_add_add") || "🛍️ أضف للسلة";
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
      <button class="faq-q" type="button" aria-expanded="false">
        <span>${question}</span>
        <span class="faq-icon" aria-hidden="true">+</span>
      </button>
      <div class="faq-a"><div>${answer}</div></div>
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
        if(otherAnswer){ otherAnswer.style.maxHeight = null; }
        if(otherButton){
          otherButton.setAttribute("aria-expanded", "false");
          const otherIcon = otherButton.querySelector(".faq-icon");
          if(otherIcon){ otherIcon.textContent = "+"; }
        }
      });

      if(!wasOpen){
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
        button.setAttribute("aria-expanded", "true");
        const icon = button.querySelector(".faq-icon");
        if(icon){ icon.textContent = "−"; }
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   ✨ initCart — يبني زر الـ Sticky ويضيفه للفوتر
   ═══════════════════════════════════════════════════════════ */
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
    freeShipCelebrated = false;
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
  if (checkoutBtn) {
    checkoutBtn.classList.add('vl-checkout-pulse');

    if (!document.getElementById('trustBadges')) {
      const badges = document.createElement('div');
      badges.id = 'trustBadges';
      badges.className = 'vl-trust-wrap';
      badges.innerHTML = `
        <span class="vl-trust-item"><span class="ic">🔒</span> ${t("cart_luxe_trust1") || "دفع آمن"}</span>
        <span class="vl-trust-item"><span class="ic">🤲</span> ${t("cart_luxe_trust2") || "صناعة يدوية 100%"}</span>
        <span class="vl-trust-item"><span class="ic">🚚</span> ${t("cart_luxe_trust3") || "ضمان التوصيل"}</span>
      `;
      checkoutBtn.parentNode.insertBefore(badges, checkoutBtn);
    }
  }

  window.addEventListener('resize', debounce(adjustCartDrawerPadding, 200));
}

/* ═══════════════════════════════════════════════════════════
   ✨ renderCart — النسخة النهائية: صف موحد (سعر + إجمالي + كمية)
   ═══════════════════════════════════════════════════════════ */
function renderCart(){
  const c=getCart();
  const w=document.getElementById("cartItems");
  if(!w)return;

  /* ═══ EMPTY STATE ═══ */
  if(!c.length){
    freeShipCelebrated = false;
    w.innerHTML=`
      <div class="vl-empty-cart">
        <div class="vl-empty-candle">🕯️</div>
        <div class="vl-empty-title">${t("cart_luxe_empty_title") || "سلتك تنتظر بعض الدفء والروائح الفاخرة..."}</div>
        <div class="vl-empty-sub">${t("cart_luxe_empty_sub") || "اختار شمعتك المفضلة وابدأ لحظتك الخاصة"}</div>
        <button class="vl-empty-cta" id="vlEmptyShopBtn" type="button">
          ${t("cart_luxe_empty_cta") || "تصفح تشكيلتنا الآن ✨"}
        </button>
      </div>
    `;
    
    setTimeout(()=>{
      const shopBtn = document.getElementById("vlEmptyShopBtn");
      if(shopBtn){
        shopBtn.addEventListener("click", ()=>{
          closeDrawers();
          window.location.href = "products.html";
        });
      }
    }, 0);
    
    updateTotals(c);
    adjustCartDrawerPadding();
    return;
  }

  /* ═══ ITEMS — الصف الموحد الجديد ═══ */
  const frag = document.createDocumentFragment();
  
  c.forEach((it, i) => {
    const unitPrice = Number(it.price||0);
    const lineTotal = unitPrice * Number(it.qty||1);
    const item = document.createElement('div');
    item.className = 'citem';
    item.innerHTML = `
      <div class="citem-media">
        <img src="${it.img||''}" alt="${pname({name:it.name,nameEn:it.nameEn})}" loading="lazy" width="68" height="68" onerror="window.handleImageError(this, '${it.id}')">
      </div>
      <div class="citem-info">
        <h5>${pname({name:it.name,nameEn:it.nameEn})}</h5>
        
        <label class="cart-scent-picker">
          <span class="cart-scent-label">🌸 ${t("scent_lbl")}</span>
          <select class="cart-scent-select" data-i="${i}" aria-label="${t("scent_lbl")}">
            <option value="">${LANG==="en"?"Choose a scent":"اختر العطر"}</option>
            ${VELA_SCENTS.map(scent=>`
              <option value="${scent[0]}" ${String(it.scent||"")===String(scent[0])?"selected":""}>
                ${velaScentTr(scent[0])}
              </option>
            `).join("")}
          </select>
        </label>
        
        <div class="citem-foot">
          <div class="citem-price">
            <span class="lbl">${LANG==="en"?"Unit:":"السعر:"}</span>
            <span class="val">${money(unitPrice)}</span>
          </div>
          <div class="citem-divider"></div>
          <div class="citem-price">
            <span class="lbl">${LANG==="en"?"Total:":"إجمالي الصنف:"}</span>
            <span class="val-total">${money(lineTotal)}</span>
          </div>
          <div class="qty">
            <button class="cq-minus" type="button" data-i="${i}" aria-label="${LANG==="en"?"Decrease":"تقليل"}">−</button>
            <b>${it.qty}</b>
            <button class="cq-plus" type="button" data-i="${i}" aria-label="${LANG==="en"?"Increase":"زيادة"}">+</button>
          </div>
        </div>
      </div>
      <button class="rm" type="button" data-i="${i}" aria-label="${LANG==="en"?"Remove":"حذف المنتج"}">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    `;
    frag.appendChild(item);
  });

  w.innerHTML = '';
  w.appendChild(frag);

  /* ═══ CROSS-SELL ═══ */
  const products = (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : [];
  const cartProductIds = c.map(it => it.id);
  
  const suggestedProduct = products.find(p => {
    if (!p || cartProductIds.includes(p.id)) return false;
    if (p.active === false) return false;
    
    const searchText = [
      p.name || "", p.nameEn || "", p.desc || "", p.descEn || "", p.cat || ""
    ].join(" ").toLowerCase();
    
    return searchText.includes("فواحة") || 
           searchText.includes("دولاب") || 
           searchText.includes("freshener") ||
           searchText.includes("closet");
  });
  
  if (suggestedProduct) {
    const suggestDiv = document.createElement('div');
    suggestDiv.className = 'cross-sell-box';
    
    let suggestImg = "";
    try { suggestImg = (typeof imgOf === "function") ? imgOf(suggestedProduct) : (suggestedProduct.img || ""); }
    catch(e){ suggestImg = suggestedProduct.img || ""; }
    
    suggestDiv.innerHTML = `
      <div class="vl-cross-head">
        <span class="emoji">✨</span>
        <span>${t("cart_luxe_cross_title") || "أكمل مجموعتك"}</span>
      </div>
      <div style="font-size:.7rem; color:#8b6f47; margin:-4px 0 8px 26px; position:relative; z-index:1;">${t("cart_luxe_cross_sub") || "أضيف لمسة ساحرة لطلبك"}</div>
      <div class="vl-cross-row">
        <div class="vl-cross-img">
          <img src="${suggestImg}" alt="${pname(suggestedProduct)}" loading="lazy" onerror="this.style.display='none'">
        </div>
        <div class="vl-cross-meta">
          <div class="nm">${pname(suggestedProduct)}</div>
          <div class="pr">${money(suggestedProduct.price)}</div>
          <button class="vl-quick-add" id="addSuggestBtn" type="button">
            <span class="ic">+</span>
            <span class="lbl">${t("cart_luxe_cross_add") || "أضف بضغطة واحدة"}</span>
          </button>
        </div>
      </div>
    `;
    w.appendChild(suggestDiv);
    
    setTimeout(() => {
      const btn = document.getElementById('addSuggestBtn');
      if(btn) {
        btn.addEventListener('click', () => {
          const added = addToCart(suggestedProduct, {scent: suggestedProduct.scent || "فانيلا", qty: 1});
          if(added !== false){
            btn.classList.add('vl-added');
            btn.innerHTML = `<span class="ic">✓</span><span class="lbl">${t("cart_luxe_cross_added") || "تمت الإضافة"}</span>`;
            setTimeout(()=>{
              renderCart();
              cartBadge();
            }, 700);
          }
        });
      }
    }, 0);
  }

  /* ═══ FOOTER ROWS SETUP ═══ */
  const dfoot = document.querySelector("#cartDrawer .dfoot");
  if (dfoot) {
    if (!document.getElementById('freeShippingRow')) {
      const shipRow = document.createElement('div');
      shipRow.id = 'freeShippingRow';
      shipRow.style.cssText = 'margin: 6px 0;';
      const totalRow = dfoot.querySelector('.trow.total');
      if (totalRow) totalRow.parentNode.insertBefore(shipRow, totalRow);
      else dfoot.appendChild(shipRow);
    }

    if (!document.getElementById('qtyDiscountRow')) {
      const qtyRow = document.createElement('div');
      qtyRow.id = 'qtyDiscountRow';
      qtyRow.className = 'vl-disc-row';
      qtyRow.style.display = 'none';
      qtyRow.innerHTML = `<span class="vl-disc-label">🎁 <span>${t("cart_luxe_disc_qty") || "خصم الكمية"}</span></span><b class="vl-disc-val">-0</b>`;
      const subRow = dfoot.querySelector('.trow'); 
      if (subRow) dfoot.insertBefore(qtyRow, subRow);
      else dfoot.appendChild(qtyRow);
    }
  }

  /* ═══════════════════════════════════════════════════════
     ✨ STICKY ACTIONS — زر الواتساب + إفراغ السلة ثابتين
     ═══════════════════════════════════════════════════════ */
  const footer = document.querySelector("#cartDrawer .dfoot");
  if (footer) {
    // شيل أي sticky actions قديمة
    footer.querySelectorAll('.vl-sticky-actions').forEach(el => el.remove());

    // أنشئ الشريط الجديد
    const stickyBar = document.createElement('div');
    stickyBar.className = 'vl-sticky-actions';
    stickyBar.innerHTML = `
      <div class="vl-sticky-row">
        <button type="button" class="vl-checkout-sticky" id="vlStickyCheckout">
          ${t("cart_luxe_checkout") || "تأكيد الطلب عبر الواتساب 💬"}
        </button>
        <button type="button" class="vl-empty-btn" id="vlStickyEmpty" title="${t("cart_luxe_clear") || "إفراغ السلة"}">
          🗑️
        </button>
      </div>
    `;
    footer.appendChild(stickyBar);

    // اربط الأحداث
    setTimeout(() => {
      document.getElementById('vlStickyCheckout')?.addEventListener('click', () => {
        // نادِ على checkout الأصلي
        if (typeof checkout === "function") checkout();
      });

      document.getElementById('vlStickyEmpty')?.addEventListener('click', () => {
        if(!confirm(t("t_confirm_empty") || "هل تريد إفراغ السلة؟")) return;
        saveCart([]);
        freeShipCelebrated = false;
        renderCart();
        cartBadge();
      });
    }, 0);
  }

  w.addEventListener('click', handleCartClick);
  w.addEventListener('change', handleCartChange);
  
  updateTotals(c);
  adjustCartDrawerPadding();
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
  }
}

/* ═══════════════════════════════════════════════════════════
   ✨ updateTotals — الشحن المجاني بعد الخصم
   ═══════════════════════════════════════════════════════════ */
function updateTotals(c){
  const sub = c.reduce((a,i) => a + (Number(i.price||0) * Number(i.qty||1)), 0);
  
  let qtyDiscount = 0;
  c.forEach(it => {
    if (Number(it.qty) >= 3) {
      qtyDiscount += (Number(it.price||0) * Number(it.qty||1) * 0.05);
    }
  });
  qtyDiscount = Math.round(qtyDiscount * 100) / 100;

  const couponDisc = (typeof calcCouponDiscount === "function") ? calcCouponDiscount(sub) : 0;

  let finalDiscount = 0;
  let appliedType = "none";

  if (qtyDiscount > 0 && couponDisc > 0) {
    if (qtyDiscount >= couponDisc) { finalDiscount = qtyDiscount; appliedType = "qty"; }
    else { finalDiscount = couponDisc; appliedType = "coupon"; }
  } else if (qtyDiscount > 0) { finalDiscount = qtyDiscount; appliedType = "qty"; }
  else if (couponDisc > 0) { finalDiscount = couponDisc; appliedType = "coupon"; }

  const total = Math.max(0, sub - finalDiscount);

  if(document.getElementById("cartSub")) {
    document.getElementById("cartSub").textContent = money(sub);
  }

  const qtyDiscRow = document.getElementById("qtyDiscountRow");
  if (qtyDiscRow) {
    const qtyValEl = qtyDiscRow.querySelector('.vl-disc-val');
    const qtyLblEl = qtyDiscRow.querySelector('.vl-disc-label');
    
    if (appliedType === "qty") {
      qtyDiscRow.style.display = "flex";
      qtyDiscRow.className = 'vl-disc-row vl-disc-active';
      if(qtyValEl) qtyValEl.textContent = "-" + money(finalDiscount);
      if(qtyLblEl) qtyLblEl.innerHTML = `🎁 <span>${t("cart_luxe_disc_qty") || "خصم الكمية"} <small class="vl-disc-hint">✓ ${t("cart_luxe_disc_applied") || "تم تطبيق الخصم الأكبر لك!"}</small></span>`;
    } else if (appliedType === "coupon" && qtyDiscount > 0) {
      qtyDiscRow.style.display = "flex";
      qtyDiscRow.className = 'vl-disc-row vl-disc-cancelled';
      if(qtyValEl) qtyValEl.textContent = "-" + money(qtyDiscount);
      if(qtyLblEl) qtyLblEl.innerHTML = `🎁 <span>${t("cart_luxe_disc_qty") || "خصم الكمية"} <small class="vl-disc-hint">${t("cart_luxe_disc_not_applied") || "غير مطبق — تم تطبيق الخصم الأكبر"}</small></span>`;
    } else {
      qtyDiscRow.style.display = "none";
    }
  }

  const dRow = document.getElementById("discountRow");
  if (dRow) {
    if (appliedType === "coupon") {
      dRow.style.display = "flex";
      dRow.className = 'vl-disc-row vl-disc-active';
      if(document.getElementById("cartDiscount")) {
        document.getElementById("cartDiscount").textContent = "-" + money(finalDiscount);
      }
      if(document.getElementById("couponCodeLbl") && appliedCoupon) {
        document.getElementById("couponCodeLbl").textContent = appliedCoupon.code + " ✓";
      }
    } else if (appliedType === "qty" && couponDisc > 0) {
      dRow.style.display = "flex";
      dRow.className = 'vl-disc-row vl-disc-cancelled';
      if(document.getElementById("cartDiscount")) {
        document.getElementById("cartDiscount").textContent = "-" + money(couponDisc);
      }
      if(document.getElementById("couponCodeLbl") && appliedCoupon) {
        document.getElementById("couponCodeLbl").textContent = appliedCoupon.code + " ✗";
      }
    } else {
      dRow.style.display = "none";
    }
  }

  /* ═══ FREE SHIPPING — على total بعد الخصم ═══ */
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - total);
  const progressPercent = Math.min(100, (total / FREE_SHIP_THRESHOLD) * 100);
  const reached = total >= FREE_SHIP_THRESHOLD;

  const freeShipRow = document.getElementById("freeShippingRow");
  const shipNote = document.querySelector('.cart-shipping-note');
  
  if (freeShipRow && c.length > 0) {
    freeShipRow.style.display = "block";
    
    const isSuccess = reached;
    const barClass = isSuccess ? 'vl-ship-bar vl-ship-success' : 'vl-ship-bar';
    
    const txt = isSuccess
      ? `🎉 <strong>${t("cart_luxe_ship_success") || "مبروك! فتحت خيار الشحن المجاني 🥳"}</strong>`
      : `${t("cart_luxe_ship_add") || "أضف"} <strong>${money(remaining)}</strong> ${t("cart_luxe_ship_to_go") || "للحصول على شحن مجاني! 🚚"}`;
    
    freeShipRow.innerHTML = `
      <div class="${barClass}">
        <div class="vl-ship-txt">${txt}</div>
        <div class="vl-ship-track">
          <div class="vl-ship-fill" style="width:${progressPercent}%"></div>
        </div>
      </div>
    `;
    
    if (isSuccess && !freeShipCelebrated) {
      freeShipCelebrated = true;
      setTimeout(() => {
        triggerConfetti(65);
        toast(LANG==="en" ? "🎉 Congrats! Free shipping unlocked 🥳" : "🎉 مبروك! فتحت خيار الشحن المجاني 🥳");
      }, 250);
    }
    
    if (!isSuccess && freeShipCelebrated) {
      freeShipCelebrated = false;
    }
    
    if (shipNote) shipNote.style.display = "none";
  } else if (freeShipRow) {
    freeShipRow.style.display = "none";
  }
  
  if(document.getElementById("cartTotal")) {
    document.getElementById("cartTotal").textContent = money(total);
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

async function buildAdvancedMatching(userData){
  if(!userData) return {};
  
  const result = {};
  
  if(userData.email){
    const em = await hashSHA256(userData.email);
    if(em) result.em = em;
  }
  
  if(userData.phone){
    let phone = String(userData.phone).replace(/\D/g, "");
    if(phone.startsWith("20")) phone = phone.slice(2);
    if(phone.startsWith("0")) phone = phone.slice(1);
    const ph = await hashSHA256(phone);
    if(ph) result.ph = ph;
  }
  
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
  
  if(userData.city){
    const ct = await hashSHA256(userData.city);
    if(ct) result.ct = ct;
  }
  
  result.country = "eg";
  
  const fbp = getCookie("_fbp");
  if(fbp) result.fbp = fbp;
  
  const fbc = localStorage.getItem("vl_fbclid");
  if(fbc) result.fbc = `fb.1.${Date.now()}.${fbc}`;
  
  return result;
}

function getCookie(name){
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if(parts.length === 2) return parts.pop().split(";").shift();
  return null;
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
  qtyDiscount = Math.round(qtyDiscount * 100) / 100;
  
  const couponDiscount = (typeof calcCouponDiscount==="function") ? calcCouponDiscount(subTotal) : 0;

  let finalDiscount = 0;
  let appliedType = "none";
  if (qtyDiscount > 0 && couponDiscount > 0) {
    if (qtyDiscount >= couponDiscount) { finalDiscount = qtyDiscount; appliedType = "qty"; }
    else { finalDiscount = couponDiscount; appliedType = "coupon"; }
  } else if (qtyDiscount > 0) { finalDiscount = qtyDiscount; appliedType = "qty"; }
  else if (couponDiscount > 0) { finalDiscount = couponDiscount; appliedType = "coupon"; }

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
  
  if (finalDiscount > 0) {
    if (appliedType === "qty") msg+=`🎁 خصم الكمية (مطبق): -${money(finalDiscount)}\n`;
    else if (appliedType === "coupon") msg+=`🎟️ كوبون ${appliedCoupon ? appliedCoupon.code : ''} (مطبق): -${money(finalDiscount)}\n`;
  }
  if (qtyDiscount > 0 && appliedType !== "qty") msg+=`💡 خصم الكمية (غير مطبق - تم اختيار الخصم الأعلى)\n`;
  if (couponDiscount > 0 && appliedType !== "coupon") msg+=`💡 خصم الكوبون (غير مطبق - تم اختيار الخصم الأعلى)\n`;

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
    shippingIncluded: total >= FREE_SHIP_THRESHOLD,
    status: 0,
    statusHistory: [{ status: 0, changedAt: Date.now(), changedBy: "customer" }],
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

  try { await saveOrUpdateCustomer(orderData); } catch(e) { console.warn("⚠️ Customer registration failed:", e); }
  try { await decrementStock(c); } catch(e) { console.warn("⚠️ Stock decrement failed:", e); }
  try { if (typeof consumeCoupon === "function") consumeCoupon(); } catch(e) { console.warn("⚠️ Coupon consume failed:", e); }
  
  const u=getSavedUser();
  u.orders=(u.orders||0)+1;
  u.name=name;u.phone=phone;u.email=email;u.city=city;u.addr=addr;u.notes=notes;
  try { localStorage.setItem("vl_user",JSON.stringify(u)); } catch(e) { console.warn("⚠️ Failed to save user:", e); }
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
  freeShipCelebrated = false;
  renderCart();
  cartBadge();
  
  let emailSent = false;
  try { emailSent = await sendOrderConfirmationEmail(orderData); } catch (err) { console.warn("⚠️ Email notification failed:", err); }

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
        items: c.map(it => ({ item_id: it.id, item_name: it.name, price: it.price, quantity: it.qty }))
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
      if (orderData.appliedType === "qty") discountText += `🎁 خصم الكمية (مطبق): -${orderData.discount} جنيه\n`;
      else if (orderData.appliedType === "coupon") discountText += `🎟️ كوبون ${orderData.couponCode || ''} (مطبق): -${orderData.discount} جنيه\n`;
    }
    if (orderData.qtyDiscount > 0 && orderData.appliedType !== "qty") discountText += `💡 خصم الكمية (غير مطبق): -${orderData.qtyDiscount} جنيه (تم اختيار الخصم الأعلى)\n`;
    if (orderData.couponDiscount > 0 && orderData.appliedType !== "coupon") discountText += `💡 خصم الكوبون (غير مطبق): -${orderData.couponDiscount} جنيه (تم اختيار الخصم الأعلى)\n`;

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
    
    if (response.ok) { console.log("✅ Admin notification sent"); return true; }
    else { console.error("Email failed:", await response.text()); return false; }
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
}

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
  if(orderData.qtyDiscount > 0 && orderData.appliedType === "qty") discountText += `🎁 خصم الكمية: -${orderData.discount} جنيه\n`;
  else if(orderData.couponDiscount > 0 && orderData.appliedType === "coupon") discountText += `🎟️ كوبون ${orderData.couponCode}: -${orderData.discount} جنيه\n`;

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
    if (waWindow && !waWindow.closed) { waWindow.location.href = waUrl; return true; }
    const newWin = window.open(waUrl, "_blank");
    if (newWin) return true;
    window.location.href = waUrl;
    return true;
  } catch(e) {
    console.warn("⚠️ WhatsApp open failed:", e);
    return false;
  }
}

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
      
      if (typeof openAuthModal === "function") openAuthModal();
      else toast("⚠️ يرجى تسجيل الدخول أولاً");
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
      if (typeof VL_GetCurrentUser === "function") userData = await VL_GetCurrentUser();
      
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
        <div style="font-weight:700; color:var(--gold2); font-size:1.1rem; margin-bottom:0.3rem;">أهلاً بك، ${userData.name || "عميلنا العزيز"} 👋</div>
        <div style="font-size:0.85rem; color:var(--mut); word-break:break-all;">${userData.email || ""}</div>
      `;

      if (document.getElementById("ordCount")) document.getElementById("ordCount").textContent = userData.ordersCount || 0;
      
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
        <div style="font-weight:700; color:var(--gold2); font-size:1.1rem; margin-bottom:0.3rem;">أهلاً بك 👋</div>
        <div style="font-size:0.85rem; color:var(--mut);">${fbUser?.email || ""}</div>
      `;
    }
    
    openDrawer("accOv");
  });

  document.getElementById("closeAcc")?.addEventListener("click", () => closeModal("accOv"));
  document.getElementById("accOv")?.addEventListener("click", e => {
    if (e.target.id === "accOv") closeModal("accOv");
  });

  document.getElementById("saveAccBtn")?.addEventListener("click", async () => {
    const name = document.getElementById("accName")?.value.trim();
    const phone = document.getElementById("accPhone")?.value.trim();
    if (!name || !phone) { toast("⚠️ اكتب الاسم ورقم الموبايل."); return; }
    
    const old = getSavedUser();
    try { localStorage.setItem("vl_user", JSON.stringify({ ...old, name, phone, orders: old.orders || 0 })); }
    catch (e) { console.warn("⚠️ Failed to save account:", e); }
    
    if (typeof fillCartForm === "function") fillCartForm();
    toast("✅ تم حفظ البيانات بنجاح");
    closeModal("accOv");
  });

  document.getElementById("guestLoginBtn")?.addEventListener("click", () => {
    if (typeof openAuthModal === "function") { closeModal("accOv"); openAuthModal(); }
    else toast("⚠️ يرجى تسجيل الدخول من الصفحة الرئيسية");
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    if (window.FB && window.FB.auth && typeof VL_Logout === "function") await VL_Logout();
    try { localStorage.removeItem("vl_user"); } catch (e) { console.warn("⚠️ Failed to clear user:", e); }
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
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    });
  });  
  document.querySelectorAll("[data-cat]").forEach(a=>{
    if(a.closest(".mnav")||a.closest(".mainnav")||a.closest("footer")){
      a.addEventListener("click",(e)=>{
        const cat = a.dataset.cat;
        if(!cat) return;
        
        const isProductsPage = window.location.pathname.includes('products.html');
        
        if(isProductsPage){
          e.preventDefault();
          setTimeout(()=>{
            const chip=document.querySelector(`#chips .chip[data-cat="${cat}"]`);
            if(chip){chip.click();}
          },50);
        } else {
          e.preventDefault();
          window.location.href = "products.html?cat=" + encodeURIComponent(cat);
        }
      });
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   ✨ openDrawer — يضيف كلاس vl-cart-open لإخفاء الفوتر الثابت
   ═══════════════════════════════════════════════════════════ */
function openDrawer(id,ovlId){
  document.getElementById(id)?.classList.add("open");
  if(ovlId){document.getElementById(ovlId)?.classList.add("open");}
  document.body.style.overflow = 'hidden';
  
  if(id === 'cartDrawer'){
    document.body.classList.add('vl-cart-open');
    setTimeout(adjustCartDrawerPadding, 80);
  }
}
function closeDrawers(){
  document.querySelectorAll(".drawer,.ovl").forEach(el=>el.classList.remove("open"));
  document.body.style.overflow = '';
  document.body.classList.remove('vl-cart-open');
}
function closeModal(id){
  document.getElementById(id)?.classList.remove("open");
  const stillOpen = document.querySelector('.drawer.open, .ovl.open');
  if(!stillOpen){ document.body.style.overflow = ''; }
}

function stockBadge(p){
  if(!p) return "";
  if(p.stock === undefined || p.stock === null || p.stock === "") return "";
  const s = Number(p.stock);
  if(isNaN(s)) return "";

  const baseStyle = `position:absolute;top:12px;inset-inline-end:12px;inset-inline-start:auto;color:#fff;font-size:.7rem;font-weight:800;padding:.3rem .75rem;border-radius:99px;z-index:4;pointer-events:none;white-space:nowrap;`;

  if(s === 0) return `<span class="stock-badge" style="${baseStyle}background:#e74c3c;">نفدت الكمية</span>`;
  if(s <= 5) return `<span class="stock-badge" style="${baseStyle}background:#e67e22;">باقي ${s} فقط</span>`;
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
        if (!sfDoc.exists()) { throw new Error("Product document does not exist!"); }
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

let appliedCoupon = null;

function calcCouponDiscount(sub){
  if(!appliedCoupon) return 0;
  let d = 0;
  if(appliedCoupon.type === "percent"){ d = sub * (Number(appliedCoupon.value || 0) / 100); }
  else { d = Number(appliedCoupon.value || 0); }
  if(appliedCoupon.maxDiscount && d > appliedCoupon.maxDiscount) { d = appliedCoupon.maxDiscount; }
  return Math.min(sub, Math.round(d));
}

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
  if(c.startDate && now < new Date(c.startDate).getTime()) { toast("⏳ هذا الكوبون لم يبدأ بعد."); return; }
  if(c.expiresAt && now > Number(c.expiresAt)) { toast("⚠️ الكوبون منتهي الصلاحية"); return; }
  if(c.maxUses && Number(c.usedCount || 0) >= Number(c.maxUses)){ toast("⚠️ انتهت استخدامات الكوبون"); return; }
  
  const cart = getCart();
  const sub = cart.reduce((a,i) => a + (Number(i.price || 0) * Number(i.qty || 1)), 0);
  if(c.minOrder && sub < c.minOrder) { toast(`⚠️ الحد الأدنى للطلب هو ${c.minOrder} ج.م`); return; }
  
  if(c.firstOrderOnly) {
    const user = getSavedUser();
    const userEmail = user.email || "";
    const userPhone = user.phone || "";
    
    let allOrders = [];
    try { allOrders = await window.FB.list("orders") || []; }
    catch(e) { console.warn("⚠️ Could not fetch orders for first-order check", e); toast("⚠️ تعذر التحقق من الطلبات السابقة"); return; }
    
    const customerOrders = allOrders.filter(order => {
      const orderEmail = order.email || order.customer?.email || "";
      const orderPhone = order.phone || order.customer?.phone || "";
      return (userEmail && orderEmail === userEmail) || (userPhone && orderPhone === userPhone);
    });
    
    const nonCancelledOrders = customerOrders.filter(order => order.status !== 4);
    if(nonCancelledOrders.length > 0) { toast("⚠️ هذا الكوبون مخصص للطلبات الأولى فقط (الطلبات الملغية غير محسوبة)."); return; }
  }
  
  const user = getSavedUser();
  const identifier = user.email || user.phone;
  if(identifier && c.usedBy && Array.isArray(c.usedBy) && c.usedBy.includes(identifier)) { toast("⚠️ لقد استخدمت هذا الكوبون من قبل."); return; }
  
  let discount = 0;
  if(c.type === "percent"){ discount = sub * (Number(c.value || 0) / 100); }
  else { discount = Number(c.value || 0); }
  if(c.maxDiscount && discount > c.maxDiscount) { discount = c.maxDiscount; }
  discount = Math.round(discount);
  
  appliedCoupon = { ...c, _fid: c.id, discount: discount };
  toast("🎟️ تم تطبيق الكوبون! وفرت " + money(discount));
  renderCart();
}

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
      } catch(e) { console.warn("⚠️ coupon update failed", e); }
    }
  } else {
    try {
      await window.FB.update("coupons", appliedCoupon._fid, {
        usedCount: (Number(appliedCoupon.usedCount || 0) + 1)
      });
    } catch(e) { console.warn("⚠️ coupon update failed", e); }
  }
  
  appliedCoupon = null;
  if(document.getElementById("couponInput")) document.getElementById("couponInput").value = "";
}

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
window.triggerConfetti = triggerConfetti;
window.injectCartStyles = injectCartStyles;
window.adjustCartDrawerPadding = adjustCartDrawerPadding;

})();
