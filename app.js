(function(){
"use strict";

// ☢️ تنظيف ذاتي آمن
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) registration.unregister();
  });
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) caches.delete(name);
    });
  }
}

/* ═══ Global Image Error Handler ═══ */
window.handleImageError = function(imgElement, productId) {
  if (!imgElement || imgElement.dataset.fallback === "true") return;
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

/* ═══ TRACKING DATA CAPTURE ═══ */
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

/* ═══ WISHLIST ═══ */
const WISHLIST_KEY = "vl_wishlist";
let wishlistCache = null;
function getWishlist() {
  if (wishlistCache !== null) return wishlistCache;
  try {
    wishlistCache = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    if (!Array.isArray(wishlistCache)) wishlistCache = [];
  } catch(e) { wishlistCache = []; }
  return wishlistCache;
}
function saveWishlist(list) {
  wishlistCache = list;
  try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); } catch(e) {}
}
function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  let added;
  if (idx === -1) {
    list.push(productId); added = true; toast("❤️ تمت الإضافة للمفضلة");
  } else {
    list.splice(idx, 1); added = false; toast("💔 تمت الإزالة من المفضلة");
  }
  saveWishlist(list);
  renderProducts();
  if (typeof renderWishlistPage === "function") renderWishlistPage();
  return added;
}
function isInWishlist(productId) { return getWishlist().includes(productId); }

/* ═══ QUICK ADD STATE ═══ */
let quickAddProduct=null, quickAddScent="", quickAddQty=1, quickAddMaxStock=99;
let productGridClickBound=false;

/* ═══ PERFORMANCE ═══ */
const requestIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
function debounce(fn, ms=300){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

/* ═══ VELA SCENTS ═══ */
const VELA_SCENTS=[
  ["فانيلا","Vanilla"],["سينامون سبايس فانيلا","Cinnamon Spice Vanilla"],["لافندر","Lavender"],["موكا","Mocha"],
  ["كراميل","Caramel"],["كاريبيان فروت","Caribbean Fruit"],["فل","Jasmine Sambac"],["ياسمين","Jasmine"],
  ["اناناس","Pineapple"],["شيكولاتة","Chocolate"],["كوكونات","Coconut"],["كاسيليا","Cassilia — Massage"],
  ["اينتو زانايت","Into Zanaite — Massage"],["بوكيت روز","Bouquet Rose"],["ورد بلدى","Egyptian Rose"],
  ["تيوليب","Tulip"],["قهوة","Coffee"],["قهوة فانيلا","Vanilla Coffee"],["قهوة بندق","Hazelnut Coffee"],
  ["عود فانيليا","Vanilla Oud"],["عنبر","Amber"],["فراولة","Strawberry"],["عود خشب صندل","Sandalwood Oud"]
];
const velaScentTr=name=>{
  const f=VELA_SCENTS.find(s=>s[0]===name||s[1]===name);
  return f?(LANG==="en"?f[1]:f[0]):(name||"");
};

/* ═══ INIT ═══ */
let isFirstRenderComplete = false;
let pendingDataRefresh = false;

document.addEventListener("DOMContentLoaded", () => {
  initLang();
  initMarquee();
  initEmbers();
  initReveal();
  
  const grid = $("#pgrid");
  if (grid) {
    grid.innerHTML = `<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1.4rem; padding:1rem;"> ${Array(4).fill(`<div class="skel" style="height:380px;border-radius:18px;"></div>`).join('')} </div>`;
  }
  
  loadAll().then(() => {
    try {
      localStorage.setItem("vl_products_v3", JSON.stringify(ALL_PRODUCTS.slice(0, 200)));
      localStorage.setItem("vl_products_v3_time", String(Date.now()));
    } catch(e) {}
    
    isFirstRenderComplete = true;
    if (pendingDataRefresh) { pendingDataRefresh = false; renderProducts(); } 
    else { renderChips(); renderProducts(); }
    
    renderScents();
    renderFAQ();
    initProductRealtimeSync();
    requestIdle(() => prefetchProductPages());
  }).catch(err => {
    console.warn("⚠️ loadAll failed, falling back to cache: ", err);
    const hasCache = (typeof loadFromCache === "function") && loadFromCache();
    if (hasCache && typeof ALL_PRODUCTS !== "undefined" && ALL_PRODUCTS.length > 0) {
      isFirstRenderComplete = true;
      renderChips(); renderProducts(); renderScents(); renderFAQ();
    } else {
      if (grid) grid.innerHTML = `<div class="empty">⚠️ تعذر تحميل المنتجات، يرجى التحقق من اتصال الإنترنت</div>`;
    }
  });
  
  initCart(); initAccount(); initSearch(); initChat(); initNav(); initQuickAdd(); initHeroIntro();
});

window.addEventListener("data-refresh", () => {
  if (!isFirstRenderComplete) { pendingDataRefresh = true; return; }
  renderProducts();
});

function prefetchProductPages(){
  if(!('requestIdleCallback' in window)) return;
  const products = typeof ALL_PRODUCTS !== 'undefined' ? ALL_PRODUCTS.slice(0, 4) : [];
  products.forEach((p, i) => {
    setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch'; link.href = `product.html?p=${p.id}`; link.as = 'document';
      document.head.appendChild(link);
    }, i * 500);
  });
}

function initHeroIntro(){
  const hero=document.querySelector('.hero-content');
  if(!hero)return;
  requestAnimationFrame(()=>{ setTimeout(()=>hero.classList.add('hero-intro'),40); });
}

let productRealtimeStarted=false;
function initProductRealtimeSync(){
  if(productRealtimeStarted || typeof DB==="undefined" || typeof DB.watch!=="function") return;
  productRealtimeStarted=true;
  let lastHash = "";
  DB.watch("products", cloud => {
    const hash = JSON.stringify(cloud||[]).length + "-" + (cloud||[]).length;
    if (hash === lastHash) return;
    lastHash = hash;
    const map=new Map((typeof PRODUCTS!=="undefined"?PRODUCTS:[]).map(p=>[p.id,{...p}]));
    (cloud||[]).forEach(d=>{
      const slug=d.id_||d.slug||d.pid||d.id;
      if(!slug)return;
      if(d.active===false){map.delete(slug);return;}
      map.set(slug,{...(map.get(slug)||{}),...d,id:slug,_fid:d.id||null});
    });
    ALL_PRODUCTS=[...map.values()];
    window.dispatchEvent(new Event("data-refresh"));
  });
}

function initLang(){
  const btn=$("#langBtn");
  if(!btn)return;
  updateLangBtn();
  btn.addEventListener("click", ()=>{
    LANG=LANG==="ar"?"en":"ar";
    try { localStorage.setItem("vl_lang",LANG); } catch(e){}
    document.documentElement.dir=LANG==="ar"?"rtl":"ltr";
    document.documentElement.lang=LANG;
    applyI18n(); updateHeroCopy(); updateLangBtn();
    renderChips(); renderProducts(); renderScents(); renderFAQ();
    fillCitySelect($("#accCity")); fillCitySelect($("#coCity")); fillCartForm();
    initChatWelcome(); toast(t(LANG==="ar"?"t_lang_ar":"t_lang_en"));
  });
  applyI18n(); updateHeroCopy();
}

function updateHeroCopy(){
  const kick=document.querySelector('.hero-kick');
  const title=document.querySelector('.hero-title-main');
  const lead=document.querySelector('.hero-lead');
  if(!kick||!title||!lead)return;
  if(LANG==='en'){
    kick.textContent='✦ Hand-poured luxury candles';
    title.innerHTML='<span data-i18n="hero_t1">A Light</span> <span data-i18n="hero_t2">That Resembles You.</span>';
    lead.textContent='Candles that glow… illuminating your day with moments you deserve.';
  }else{
    kick.textContent='✦ شموع يدوية فاخرة';
    title.innerHTML='<span data-i18n="hero_t1">ضوءٌ</span> <span data-i18n="hero_t2">يُشبهكِ.</span>';
    lead.textContent='شموع تُضيء… لتنير يومكِ بلحظاتٍ تستحقينها.';
  }
}

function updateLangBtn(){
  const btn=$("#langBtn");
  if(btn){ btn.textContent=LANG==="ar"?"EN":"ع"; }
}

function applyI18n(){
  document.title=t("docTitle");
  $$("[data-i18n]").forEach(el=>{
    const k=el.dataset.i18n, v=t(k);
    if(v && v!==k) el.textContent=v;
  });
  $$("[data-i18n-ph]").forEach(el=>{
    const k=el.dataset.i18nPh, v=t(k);
    if(v && v!==k) el.placeholder=v;
  });
  
  const mq=$("#mqTrack");
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
  const faqWrap=$("#faqWrap");
  if(faqWrap && typeof renderFAQ==="function") renderFAQ();
}

function initMarquee(){}
function initEmbers(){
  const w=$("#embers");
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
  if(!('IntersectionObserver' in window)) { $$(".rv").forEach(el => el.classList.add("on")); return; }
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add("on"); io.unobserve(e.target); }
    });
  },{threshold:.05, rootMargin:"0px 0px 100px 0px"});
  $$(".rv").forEach(el=>{
    if (el.getBoundingClientRect().top < window.innerHeight + 100) el.classList.add("on");
    else io.observe(el);
  });
}

function renderChips(){
  const w=$("#chips");
  if(!w)return;
  // Chips are now hidden by default in CSS for cleaner look, but logic remains for modal/filtering if needed
}
function activeCat(){ return "all"; } // Simplified for homepage grid

function renderProducts(){
  const grid=$("#pgrid");
  if(!grid)return;
  const products = (typeof ALL_PRODUCTS !== "undefined" && Array.isArray(ALL_PRODUCTS)) ? ALL_PRODUCTS : (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);
  const catF=activeCat();
  const sort=$("#sortSel")?.value||"new";
  
  let list=products.filter(p=>{
    if(!p || !p.id) return false;
    if(catF!=="all" && p.cat!==catF) return false;
    if(p.active===false) return false;
    return true;
  });
  
  list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.pinned && b.pinned) return (b.pinnedAt || 0) - (a.pinnedAt || 0);
    switch(sort){
      case "asc": return (a.price||0) - (b.price||0);
      case "desc": return (b.price||0) - (a.price||0);
      case "rating": return ((typeof ratingOf==="function"?ratingOf(b.id)?.avg:0)||0) - ((typeof ratingOf==="function"?ratingOf(a.id)?.avg:0)||0);
      case "best": return (b.sold||0) - (a.sold||0);
      case "disc": return ((b.old-b.price)/Math.max(b.old,1)) - ((a.old-a.price)/Math.max(a.old,1));
      default: return (b.createdAt||0) - (a.createdAt||0);
    }
  });
  
  if(!list.length){ grid.innerHTML=`<div class="empty">${t("no_products")||"لا توجد منتجات"}</div>`; return; }
  
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
      try { imgSrc = (typeof imgOf === "function") ? imgOf(p) : (p.img || ""); } catch(e) { imgSrc = placeholderSvg; }
      if (!imgSrc) imgSrc = placeholderSvg;
      
      const inWishlist = isInWishlist(p.id);
      const stockNum = Number(p.stock);
      const isOutOfStock = !isNaN(stockNum) && stockNum === 0;
      const stockBadg = (typeof stockBadge === "function") ? stockBadge(p) : "";
      
      const article = document.createElement('article');
      article.className = 'p-card';
      article.dataset.id = p.id;
      
      const isBrideBox = String(p.id) === "14" || String(p.id) === "pmt2u7xq749e"; // Adjust ID as per your data
      const brideVideoUrl = "https://velalight.github.io/box.mp4?v=v5";
      
      const mediaContent = (isBrideBox && p.video)
        ? `<video src="${brideVideoUrl}" autoplay muted loop playsinline preload="metadata" poster="${imgSrc}" style="width:100%;height:100%;object-fit:cover;background:#000;display:block;" aria-label="${pname(p)}"></video>`
        : `<img src="${imgSrc}" alt="${pname(p)}" loading="${loadingAttr}" decoding="async" fetchpriority="${fetchPriority}" width="400" height="400" onload="this.classList.add('loaded')" onerror="window.handleImageError(this, '${p.id}')">`;
      
      const priceHtml = p.old > p.price 
        ? `<span class="current">${money(p.price)}</span><del>${money(p.old)}</del>` 
        : `<span class="current">${money(p.price)}</span>`;

      article.innerHTML = `
        <a class="p-media" href="product.html?p=${p.id}" aria-label="${pname(p)}">
          ${mediaContent}
          ${pinBadge}
          ${badge ? `<span class="p-badge">${badge}</span>` : ""}
          ${stockBadg}
          <span class="p-quick">${t("view_details")||"عرض التفاصيل"}</span>
        </a>
        <div class="p-body">
          <span class="p-cat">${cat(p.cat)}</span>
          <h3><a href="product.html?p=${p.id}">${pname(p)}</a></h3>
          ${r ? `<span class="stars" aria-label="${Math.round(r.avg)} stars">${"★".repeat(Math.round(r.avg))}</span>` : ""}
          <p class="p-desc">${productDesc}</p>
          ${productDesc.length>40 ? `<a href="product.html?p=${p.id}" class="p-desc-link">${readMoreText}</a>` : ""}
          <div class="p-foot">
            <div class="p-price">${priceHtml}</div>
            <div style="display:flex; gap:6px; flex-shrink:0; align-items:center; width: 100%; margin-top: 4px;">
              <button class="p-add" data-id="${p.id}" ${isOutOfStock?"disabled":""} style="flex:1;">
                ${isOutOfStock ? (LANG==="en"?"Out of stock":"نفدت الكمية") : (t("add_cart")||"+ أضيفي للسلة")}
              </button>
              <button class="p-wish" data-wish="${p.id}" type="button" aria-label="أضف للمفضلة" style="background:${inWishlist?'#fee':'none'};border:1px solid ${inWishlist?'#e74c3c':'var(--line)'};border-radius:10px;cursor:pointer;font-size:1.1rem;transition:.2s;color:${inWishlist?'#e74c3c':'inherit'}; display:flex; align-items:center; justify-content:center; width:42px; height:42px; padding:0; flex-shrink:0;">
                ${inWishlist?"❤️":"🤍"}
              </button>
            </div
</tool_response>
