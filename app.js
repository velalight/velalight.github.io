(function(){
"use strict";

/* ═══ QUICK ADD STATE ═══ */
let quickAddProduct=null;
let quickAddScent="";
let quickAddQty=1;

/* ═══ ✨ WISHLIST STATE ═══ */
const WISHLIST_KEY = "vl_wishlist";

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  } catch(e) {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

function toggleWishlist(productId) {
  let list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx === -1) {
    list.push(productId);
    toast("❤️ تمت الإضافة للمفضلة");
  } else {
    list.splice(idx, 1);
    toast("💔 تمت الإزالة من المفضلة");
  }
  saveWishlist(list);
  renderProducts();
  if (typeof renderWishlistPage === "function") renderWishlistPage();
  return list.includes(productId);
}

function isInWishlist(productId) {
  return getWishlist().includes(productId);
}

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
  if(typeof I18N==="undefined")return;
  const add={
    ar:{
      ship_note:"🚚 الشحن: يُدفع كاش لمندوب الشحن عند الاستلام.",
      pay_products_note:"💳 قيمة المنتجات تُدفع مقدمًا عبر InstaPay.",
      t_scentwarn:"⚠️ من فضلك اختار العطر الأول.",
      scent_req:"مطلوب",
      handmade_note:"قطعة يدوية تُجهّز بعناية عند الطلب"
    },
    en:{
      ship_note:"🚚 Shipping: paid cash to courier on delivery.",
      pay_products_note:"💳 Products paid upfront via InstaPay.",
      t_scentwarn:"⚠️ Please choose a scent first.",
      scent_req:"Required",
      handmade_note:"Handmade piece prepared with care upon order"
    }
  };
  Object.keys(add).forEach(L=>{
    if(!I18N[L])I18N[L]={};
    Object.keys(add[L]).forEach(k=>{
      if(!I18N[L][k])I18N[L][k]=add[L][k];
    });
  });
})();

/* ═══ INIT ═══ */
document.addEventListener("DOMContentLoaded",()=>{
  initLang();
  initMarquee();
  initEmbers();
  initReveal();
  loadAll().then(()=>{
    renderChips();
    renderProducts();
    renderScents();
    renderFAQ();
    initProductRealtimeSync();
    requestIdle(() => prefetchProductPages());
  });
  initCart();
  initAccount();
  initSearch();
  initChat();
  initNav();
  initQuickAdd();
  initHeroIntro();
});

window.addEventListener("data-refresh",()=>{renderProducts();});

function prefetchProductPages(){
  if(!('requestIdleCallback' in window)) return;
  const products = typeof ALL_PRODUCTS !== 'undefined' ? ALL_PRODUCTS.slice(0, 8) : [];
  products.forEach(p => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `product.html?p=${p.id}`;
    link.as = 'document';
    document.head.appendChild(link);
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
  productRealtimeUnsubscribe=DB.watch("products",cloud=>{
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
    console.error("Products realtime sync error:",error);
  });
}

function initLang(){
  const btn=$("#langBtn");
  if(!btn)return;
  updateLangBtn();
  btn.addEventListener("click",()=>{
    LANG=LANG==="ar"?"en":"ar";
    localStorage.setItem("vl_lang",LANG);
    document.documentElement.dir=LANG==="ar"?"rtl":"ltr";
    document.documentElement.lang=LANG;
    applyI18n();
    updateHeroCopy();
    updateLangBtn();
    renderChips();
    renderProducts();
    renderScents();
    renderFAQ();
    fillCitySelect($("#accCity"));
    fillCitySelect($("#coCity"));
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
  const btn=$("#langBtn");
  if(btn){btn.textContent=LANG==="ar"?"EN":"ع";}
}

function applyI18n(){
  document.title=t("docTitle");
  $$("[data-i18n]").forEach(el=>{
    const k=el.dataset.i18n,v=t(k);
    if(v&&v!==k)el.textContent=v;
  });
  $$("[data-i18n-ph]").forEach(el=>{
    const k=el.dataset.i18nPh,v=t(k);
    if(v&&v!==k)el.placeholder=v;
  });
  const mq=$("#mqTrack");
  if(mq){
    const txt=t("mq");
    mq.innerHTML=`<span>${txt}</span><span>${txt}</span>`;
  }
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
  if(!('IntersectionObserver' in window)) {
    $$(".rv").forEach(el => el.classList.add("on"));
    return;
  }
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("on");
        io.unobserve(e.target);
      }
    });
  },{threshold:.08, rootMargin:"0px 0px -50px 0px"});
  $$(".rv").forEach(el=>io.observe(el));
}

function renderChips(){
  const w=$("#chips");
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
      frag.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));
      btn.classList.add("on");
      renderProducts();
    });
    frag.appendChild(btn);
  });
  w.innerHTML = '';
  w.appendChild(frag);
  
  w.querySelectorAll(".chip").forEach(b=>{
    b.addEventListener("click",()=>{
      w.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));
      b.classList.add("on");
      renderProducts();
    });
  });
}

function activeCat(){
  const c=$("#chips .chip.on");
  return c?c.dataset.cat:"all";
}

function renderProducts(){
  const grid=$("#pgrid");
  if(!grid)return;

  const catF=activeCat();
  const min=+($("#priceMin")?.value||0);
  const max=+($("#priceMax")?.value||0);
  const sort=$("#sortSel")?.value||"new";

  let list=ALL_PRODUCTS.filter(p=>{
    if(catF!=="all"&&p.cat!==catF)return false;
    if(min&&p.price<min)return false;
    if(max&&p.price>max)return false;
    return true;
  });

  switch(sort){
    case "asc":list.sort((a,b)=>a.price-b.price);break;
    case "desc":list.sort((a,b)=>b.price-a.price);break;
    case "rating":list.sort((a,b)=>(ratingOf(b.id)?.avg||0)-(ratingOf(a.id)?.avg||0));break;
    case "best":list.sort((a,b)=>(b.sold||0)-(a.sold||0));break;
    case "disc":list.sort((a,b)=>((b.old-b.price)/Math.max(b.old,1))-((a.old-a.price)/Math.max(a.old,1)));break;
    default:list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  }

  const cnt=$("#prodCount");
  if(cnt){cnt.textContent=list.length+" "+t("prod_word");}

  if(!list.length){
    grid.innerHTML=`<div class="empty">${t("no_products")}</div>`;
    return;
  }

  const readMoreText=LANG==="en"?"Read more →":"عرض المزيد ←";
  const isMobile = window.innerWidth <= 768;
  const eagerCount = isMobile ? 4 : 8;

  const htmlChunks = [];
  
  list.forEach((p, index) => {
    const r=ratingOf(p.id);
    const badge=pbadge(p);
    const rawDesc=LANG==="en"?(p.descEn||p.desc||""):(p.desc||p.descEn||"");
    const productDesc=String(rawDesc).trim();
    
    const isFirstBatch = index < eagerCount;
    const loadingAttr = isFirstBatch ? 'loading="eager"' : 'loading="lazy"';
    const fetchPriority = isFirstBatch ? 'fetchpriority="high"' : 'fetchpriority="low"';
    
    const imgAttrs = `src="${imgOf(p)}" alt="${pname(p)}" ${loadingAttr} decoding="async" ${fetchPriority} width="400" height="400" onload="this.classList.add('loaded')" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='%23f5efe5' width='400' height='400'/><text x='200' y='200' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-size='24' fill='%23d9ab5f'>✦</text></svg>'"`;

    htmlChunks.push(`
      <article class="p-card" data-id="${p.id}">
        <a class="p-media" href="product.html?p=${p.id}" aria-label="${pname(p)}">
          <img ${imgAttrs}>
          ${badge?`<span class="p-badge">${badge}</span>`:""}
          ${stockBadge(p)}
          <span class="p-quick">${t("view_details")}</span>
        </a>
        <div class="p-body">
          <span class="p-cat">${cat(p.cat)}</span>
          <h3><a href="product.html?p=${p.id}">${pname(p)}</a></h3>
          ${r?`<span class="stars" aria-label="${Math.round(r.avg)} stars">${"★".repeat(Math.round(r.avg))}</span>`:""}
          <p class="p-desc">${productDesc}</p>
          ${productDesc.length>30?`<a href="product.html?p=${p.id}" class="p-desc-link">${readMoreText}</a>`:""}
          <div class="p-foot">
            <div class="p-price">
              ${money(p.price)}
              ${p.old>p.price?`<del>${money(p.old)}</del>`:""}
            </div>
            <button class="p-add" data-id="${p.id}" ${Number(p.stock)===0?"disabled":""} aria-label="${t("add_cart")} ${pname(p)}">${Number(p.stock)===0?(LANG==="en"?"Out of stock":"نفدت الكمية"):t("add_cart")}</button>
            <button class="p-wish" data-wish="${p.id}" type="button" aria-label="أضف للمفضلة" style="background:none;border:1px solid var(--line);border-radius:10px;padding:.4rem .6rem;cursor:pointer;font-size:1rem;transition:.2s;${isInWishlist(p.id)?'background:#fee;color:#e74c3c;border-color:#e74c3c;':''}">${isInWishlist(p.id)?"❤️":"🤍"}</button>
          </div>
        </div>
      </article>
    `);
  });

  grid.innerHTML = htmlChunks.join('');
  grid.addEventListener('click', handleProductGridClick);
}

function handleProductGridClick(e){
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
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if(p && Number(p.stock)!==0){
    addBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { addBtn.style.transform = ''; }, 150);
    openQuickAdd(p);
  }
}

function initQuickAdd(){
  $("#closeScent")?.addEventListener("click",()=>closeModal("scentOv"));
  $("#scentOv")?.addEventListener("click",e=>{
    if(e.target.id==="scentOv"){closeModal("scentOv");}
  });
  $("#smQMinus")?.addEventListener("click",()=>{
    if(quickAddQty>1){quickAddQty--;}
    $("#smQVal").textContent=quickAddQty;
  });
  $("#smQPlus")?.addEventListener("click",()=>{
    quickAddQty++;
    $("#smQVal").textContent=quickAddQty;
  });
  $("#scentModalAdd")?.addEventListener("click",()=>{
    if(!quickAddProduct)return;
    if(!quickAddScent){toast(t("t_scentwarn"));return;}
    if(addToCart(quickAddProduct,{scent:quickAddScent,qty:quickAddQty})){
      closeModal("scentOv");
    }
  });
}

function openQuickAdd(p){
  quickAddProduct=p;
  quickAddScent="";
  quickAddQty=1;

  const title=$("#scentModalTitle");
  if(title){title.textContent=pname(p);}

  const qv=$("#smQVal");
  if(qv){qv.textContent="1";}

  const w=$("#scentModalScents");
  if(!w)return;

  const frag = document.createDocumentFragment();
  VELA_SCENTS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.dataset.s = s[0];
    btn.textContent = velaScentTr(s[0]);
    btn.addEventListener('click', () => {
      w.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      btn.classList.add('on');
      quickAddScent = s[0];
    });
    frag.appendChild(btn);
  });
  w.innerHTML = '';
  w.appendChild(frag);

  openDrawer("scentOv");
}

const debouncedRenderProducts = debounce(renderProducts, 250);

document.addEventListener("change",e=>{
  if(e.target.id==="priceMin"||e.target.id==="priceMax"||e.target.id==="sortSel"){
    renderProducts();
  }
});
document.addEventListener("input",e=>{
  if(e.target.id==="priceMin"||e.target.id==="priceMax"){
    debouncedRenderProducts();
  }
});

function renderScents(){
  const w=$("#scentGrid");
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
  const w=$("#faqWrap");
  if(!w)return;
  const items=[
    [t("faq1q"),t("faq1a")],
    [t("faq2q"),t("faq2a")],
    [t("faq3q"),t("faq3a")],
    [t("faq4q"),t("faq4a")],
    [t("faq5q"),t("faq5a")],
    [t("faq6q"),t("faq6a")]
  ];
  const frag = document.createDocumentFragment();
  items.forEach(q => {
    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <button class="faq-q" aria-expanded="false"><span>${q[0]}</span><span>+</span></button>
      <div class="faq-a"><div>${q[1]}</div></div>
    `;
    frag.appendChild(item);
  });
  w.innerHTML = '';
  w.appendChild(frag);
  
  w.querySelectorAll(".faq-item").forEach(item=>{
    item.querySelector(".faq-q").addEventListener("click",()=>{
      const was=item.classList.contains("open");
      w.querySelectorAll(".faq-item").forEach(x=>{
        x.classList.remove("open");
        x.querySelector(".faq-a").style.maxHeight=null;
        x.querySelector(".faq-q").setAttribute("aria-expanded","false");
      });
      if(!was){
        item.classList.add("open");
        const a=item.querySelector(".faq-a");
        a.style.maxHeight=a.scrollHeight+"px";
        item.querySelector(".faq-q").setAttribute("aria-expanded","true");
      }
    });
  });
}

function initCart(){
  cartBadge();
  fillCitySelect($("#coCity"));
  fillCartForm();

  $("#cartBtn")?.addEventListener("click",()=>{
    fillCartForm();
    renderCart();
    openDrawer("cartDrawer","cartOv");
  });
  $("#closeCart")?.addEventListener("click",closeDrawers);
  $("#cartOv")?.addEventListener("click",closeDrawers);
  renderCart();

  if(new URLSearchParams(location.search).get("cart")==="1"){
    fillCartForm();
    renderCart();
    openDrawer("cartDrawer","cartOv");
  }

  $("#emptyCartBtn")?.addEventListener("click",()=>{
    if(!confirm(t("t_confirm_empty")))return;
    saveCart([]);
    renderCart();
  });

  $("#checkoutBtn")?.addEventListener("click",checkout);

  const saveCustomer = debounce(() => saveCartCustomer(), 500);
  
  ["#coName","#coPhone","#coEmail","#coCity","#coAddr","#coNotes"].forEach(selector=>{
    document.addEventListener("input",e=>{
      if(e.target.matches(selector)){saveCustomer();}
    });
    document.addEventListener("change",e=>{
      if(e.target.matches(selector)){saveCustomer();}
    });
  });
}

function renderCart(){
  const c=getCart();
  const w=$("#cartItems");
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
        <img src="${it.img||''}" alt="${pname({name:it.name,nameEn:it.nameEn})}" loading="lazy" width="62" height="62">
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

  w.addEventListener('click', handleCartClick);
  w.addEventListener('change', handleCartChange);
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
  if($("#cartSub")){$("#cartSub").textContent=money(sub);}
  if($("#cartTotal")){$("#cartTotal").textContent=money(sub);}
}

function getSavedUser(){
  try{return JSON.parse(localStorage.getItem("vl_user")||"{}");}
  catch(e){return {};}
}

function fillCartForm(){
  const u=getSavedUser();
  if($("#coName")){$("#coName").value=u.name||"";}
  if($("#coPhone")){$("#coPhone").value=u.phone||"";}
  if($("#coEmail")){$("#coEmail").value=u.email||"";}
  if($("#coCity")){$("#coCity").value=u.city||"";}
  if($("#coAddr")){$("#coAddr").value=u.addr||"";}
  if($("#coNotes")){$("#coNotes").value=u.notes||"";}
}

function saveUserFromCart(name,phone,email,city,addr,notes=""){
  const old=getSavedUser();
  const u={...old,name,phone,email,city,addr,notes,orders:old.orders||0};
  localStorage.setItem("vl_user",JSON.stringify(u));
  if($("#accName"))$("#accName").value=name;
  if($("#accPhone"))$("#accPhone").value=phone;
  if($("#accCity"))$("#accCity").value=city;
  if($("#accAddr"))$("#accAddr").value=addr;
}

function saveCartCustomer(){
  const name=$("#coName")?.value.trim()||"";
  const phone=$("#coPhone")?.value.trim()||"";
  const email=$("#coEmail")?.value.trim()||"";
  const city=$("#coCity")?.value||"";
  const addr=$("#coAddr")?.value.trim()||"";
  const notes=$("#coNotes")?.value.trim()||"";
  const old=getSavedUser();
  localStorage.setItem("vl_user",JSON.stringify({...old,name,phone,email,city,addr,notes,orders:old.orders||0}));
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

  const name=$("#coName")?.value.trim()||"";
  const phone=$("#coPhone")?.value.trim()||"";
  const email=$("#coEmail")?.value.trim()||"";
  const city=$("#coCity")?.value||"";
  const addr=$("#coAddr")?.value.trim()||"";
  const notes=$("#coNotes")?.value.trim()||"";

  if(!name){
    toast(LANG==="en"?"⚠️ Please enter your full name.":"⚠️ من فضلك اكتب الاسم بالكامل.");
    $("#coName")?.focus();return;
  }
  if(!phone){
    toast(LANG==="en"?"⚠️ Please enter your mobile number.":"⚠️ من فضلك اكتب رقم الموبايل.");
    $("#coPhone")?.focus();return;
  }
  if(!addr){
    toast(LANG==="en"?"⚠️ Please enter the detailed address.":"⚠️ من فضلك اكتب العنوان بالتفصيل.");
    $("#coAddr")?.focus();return;
  }

  saveUserFromCart(name,phone,email,city,addr,notes);

  const orderId=genOrderId();
  const total=c.reduce((a,i)=>a+(Number(i.price||0)*Number(i.qty||1)),0);

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
  msg+=`${waTotalLabel()} ${money(total)}\n`;
  msg+=`${t("pay_products_note")}\n`;
  if(CFG&&CFG.INSTAPAY&&String(CFG.INSTAPAY).trim()){
    msg+=`${t("wa_insta")} ${CFG.INSTAPAY}\n`;
  }
  msg+=`${t("ship_note")}\n\n`;
  msg+=`${t("wa_name")} ${name}\n`;
  msg+=`${t("wa_phone")} ${phone}\n`;
  if(email){msg+=`${LANG==="en"?"Email:":"الإيميل:"} ${email}\n`;}
  if(city){msg+=`${t("wa_city")} ${city}\n`;}
  msg+=`${t("wa_addr")} ${addr}\n`;
  if(notes){msg+=`${t("wa_notes")} ${notes}\n`;}

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
    total,productsTotal:total,
    paymentMethod:"InstaPay",
    shippingPayment:"Cash to courier",
    shippingIncluded:false,
    status:"قيد المراجعة",statusEn:"Under Review",
    createdAt:Date.now(),
    orderDate:new Date().toISOString()
  };

  try{await DB.add("orders",orderData);}
  catch(e){console.warn("Order save warning:",e);}
  
  decrementStock(c);
  
  const u=getSavedUser();
  u.orders=(u.orders||0)+1;
  u.name=name;u.phone=phone;u.email=email;u.city=city;u.addr=addr;u.notes=notes;
  localStorage.setItem("vl_user",JSON.stringify(u));
  const oc=$("#ordCount");
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
      console.warn("Failed to update user order count:", err);
    }
  }

  saveCart([]);
  renderCart();
  cartBadge();
  
  try {
    await sendOrderConfirmationEmail(orderData);
    toast(LANG==="en" ? "✅ Order placed! Check your email." : "✅ تم إرسال الطلب! تم إرسال تأكيد للأدمن.");
  } catch (err) {
    console.warn("Email notification failed:", err);
    toast(t("t_order"));
  }
  
  openWhatsAppConfirmation(orderData);
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
═══════════════════════════════════════

═══════════════════════════════════════
💳 طريقة الدفع:
═══════════════════════════════════════
• قيمة المنتجات: InstaPay (مقدم)
• الشحن: كاش للمندوب عند الاستلام

═══════════════════════════════════════
⏳ الحالة: قيد المراجعة
═══════════════════════════════════════

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

function openWhatsAppConfirmation(orderData) {
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
  
  const message = `✨ أهلاً VelaLight!

تم تقديم طلبي بنجاح 🕯️

📋 رقم الطلب: ${orderData.orderId}
👤 الاسم: ${orderData.name}
💰 الإجمالي: ${orderData.total} جنيه

📍 العنوان:
${orderData.city || ""} - ${orderData.address}

🛍️ المنتجات:
${itemsSummary}

في انتظار تأكيدكم وترتيب الشحن 📱

شكراً لكم!`;
  
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  
  setTimeout(() => {
    window.open(waUrl, "_blank");
  }, 1500);
}

function initAccount(){
  fillCitySelect($("#accCity"));
  const u=getSavedUser();
  if(u.name){$("#accName").value=u.name;}
  if(u.phone){$("#accPhone").value=u.phone;}
  if(u.city){$("#accCity").value=u.city;}
  if(u.addr){$("#accAddr").value=u.addr;}
  if(u.orders){$("#ordCount").textContent=u.orders;}

  $("#accBtn")?.addEventListener("click", async ()=>{
    if(window.FB && window.FB.auth && window.FB.auth.currentUser){
      await loadUserData();
      openDrawer("accOv");
    }else{
      if(typeof openAuthModal === "function"){
        openAuthModal();
      }else{
        openDrawer("accOv");
      }
    }
  });
  $("#closeAcc")?.addEventListener("click",()=>closeModal("accOv"));
  $("#accOv")?.addEventListener("click",e=>{
    if(e.target.id==="accOv"){closeModal("accOv");}
  });

  $("#saveAccBtn")?.addEventListener("click", async ()=>{
    const name=$("#accName").value.trim();
    const phone=$("#accPhone").value.trim();
    const city=$("#accCity").value;
    const addr=$("#accAddr").value.trim();
    if(!name){toast(LANG==="en"?"⚠️ Enter your name.":"⚠️ اكتب الاسم.");return;}
    if(!phone){toast(LANG==="en"?"⚠️ Enter your phone.":"⚠️ اكتب رقم الموبايل.");return;}

    if(window.FB && window.FB.auth && window.FB.auth.currentUser && typeof VL_UpdateProfile === "function"){
      const result = await VL_UpdateProfile({name, phone, city, address: addr});
      if(result.success){
        toast(t("t_saved"));
        closeModal("accOv");
        return;
      }
    }

    const old=getSavedUser();
    localStorage.setItem("vl_user",JSON.stringify({...old,name,phone,city,addr,orders:old.orders||0}));
    fillCartForm();
    toast(t("t_saved"));
    closeModal("accOv");
  });

  $("#logoutBtn")?.addEventListener("click", async ()=>{
    if(window.FB && window.FB.auth && window.FB.auth.currentUser && typeof VL_Logout === "function"){
      await VL_Logout();
    }
    localStorage.removeItem("vl_user");
    $("#accName").value="";
    $("#accPhone").value="";
    $("#accAddr").value="";
    if($("#accCity")){$("#accCity").value="";}
    $("#ordCount").textContent="0";
    toast(t("t_saved"));
    closeModal("accOv");
  });
}

async function loadUserData(){
  if(typeof VL_GetCurrentUser !== "function") return;
  const userData = await VL_GetCurrentUser();
  if(!userData) return;

  if($("#accName"))  $("#accName").value  = userData.name     || "";
  if($("#accPhone")) $("#accPhone").value = userData.phone    || "";
  if($("#accCity"))  $("#accCity").value  = userData.city     || "";
  if($("#accAddr"))  $("#accAddr").value  = userData.address  || "";
  if($("#ordCount")) $("#ordCount").textContent = userData.ordersCount || 0;
}

function fillCitySelect(sel){
  if(!sel)return;
  const arr=LANG==="en"?GOVS_EN:GOVS;
  sel.innerHTML=`<option value="">${t("ph_city")}</option>`+
    arr.map(g=>`<option value="${g}">${g}</option>`).join("");
}

function initSearch(){
  $("#searchBtn")?.addEventListener("click",()=>{
    openDrawer("searchOv");
    setTimeout(()=>{$("#searchInput")?.focus();},200);
  });
  $("#closeSearch")?.addEventListener("click",()=>closeModal("searchOv"));
  $("#searchOv")?.addEventListener("click",e=>{
    if(e.target.id==="searchOv"){closeModal("searchOv");}
  });
  
  const debouncedSearch = debounce((q) => performSearch(q), 200);
  
  $("#searchInput")?.addEventListener("input",e=>{
    const q=e.target.value.trim().toLowerCase();
    debouncedSearch(q);
  });
}

function performSearch(q){
  const w=$("#searchResults");
  if(!w)return;
  if(!q){w.innerHTML="";return;}
  
  const res=ALL_PRODUCTS.filter(p=>{
    const hay=(p.name+" "+(p.nameEn||"")+" "+(p.desc||"")+" "+(p.descEn||"")+" "+cat(p.cat)).toLowerCase();
    return hay.includes(q);
  }).slice(0,8);
  
  w.innerHTML=res.map(p=>`
    <div class="sr-item" data-id="${p.id}">
      <img src="${imgOf(p)}" alt="" loading="lazy" width="50" height="50">
      <div><b>${pname(p)}</b><br><small>${money(p.price)}</small></div>
    </div>
  `).join("");
  
  w.querySelectorAll(".sr-item").forEach(it=>{
    it.addEventListener("click",()=>{location.href="product.html?p="+it.dataset.id;});
  });
}

function initChat(){
  $("#chatFab")?.addEventListener("click",()=>{$("#chatOv")?.classList.toggle("open");});
  $("#closeChat")?.addEventListener("click",()=>{$("#chatOv")?.classList.remove("open");});
  initChatWelcome();
  const quick=[
    [t("q_gift"),"a_gift"],
    [t("q_relax"),"a_relax"],
    [t("q_scents"),"a_scents"],
    [t("q_ship"),"a_ship"],
    [t("q_bride"),"a_bride"]
  ];
  const qw=$("#chatQuick");
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
  const w=$("#chatMsgs");
  if(w&&!w.children.length){addMsg(t("chat_welcome"),"bot");}
}

function addMsg(txt,who){
  const w=$("#chatMsgs");
  if(!w)return;
  const d=document.createElement("div");
  d.className="msg "+who;
  d.textContent=txt;
  w.appendChild(d);
  w.scrollTop=w.scrollHeight;
}

function initNav(){
  $("#navToggle")?.addEventListener("click",()=>{
    $("#mnav")?.classList.toggle("open");
    $("#ovl")?.classList.toggle("open");
  });
  $("#ovl")?.addEventListener("click",closeDrawers);
  $$(".mnav a").forEach(a=>{
    a.addEventListener("click",()=>{
      $("#mnav")?.classList.remove("open");
      $("#ovl")?.classList.remove("open");
    });
  });
  $$("[data-cat]").forEach(a=>{
    if(a.closest(".mnav")||a.closest(".mainnav")||a.closest("footer")){
      a.addEventListener("click",()=>{
        setTimeout(()=>{
          const chip=$(`#chips .chip[data-cat="${a.dataset.cat}"]`);
          if(chip){chip.click();}
        },100);
      });
    }
  });
}

function openDrawer(id,ovlId){
  $("#"+id)?.classList.add("open");
  if(ovlId){$("#"+ovlId)?.classList.add("open");}
  document.body.style.overflow = 'hidden';
}
function closeDrawers(){
  $$(".drawer,.ovl").forEach(el=>el.classList.remove("open"));
  document.body.style.overflow = '';
}
function closeModal(id){
  $("#"+id)?.classList.remove("open");
  const stillOpen = document.querySelector('.drawer.open, .ovl.open');
  if(!stillOpen){
    document.body.style.overflow = '';
  }
}

function stockBadge(p){
  if(p.stock===undefined||p.stock===null||p.stock==="")return"";
  const s=Number(p.stock);
  if(isNaN(s))return"";
  if(s===0)return`<span class="p-badge" style="background:#e74c3c">نفدت الكمية</span>`;
  if(s<=5)return`<span class="p-badge" style="background:#e67e22">باقي ${s} فقط</span>`;
  return"";
}

async function decrementStock(items){
  if(!window.FB||typeof window.FB.update!=="function")return;
  for(const it of items){
    const p=ALL_PRODUCTS.find(x=>x.id===it.id);
    if(!p)continue;
    if(p.stock===undefined||p.stock===null||p.stock===""||isNaN(Number(p.stock)))continue;
    const newStock=Math.max(0,Number(p.stock)-Number(it.qty||1));
    try{
      if(p._fid){await window.FB.update("products",p._fid,{stock:newStock});}
      else{await window.FB.set("products",p.id,{id_:p.id,stock:newStock});}
    }catch(e){console.warn("stock update failed",e);}
  }
}

/* ═══ ✨ تصدير الدوال عالمياً لصفحة wishlist.html ═══ */
window.getWishlist = getWishlist;
window.toggleWishlist = toggleWishlist;
window.isInWishlist = isInWishlist;
window.WISHLIST_KEY = WISHLIST_KEY;
window.ALL_PRODUCTS_REF = () => (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : [];
window.imgOfRef = (p) => (typeof imgOf === "function") ? imgOf(p) : (p.img || "");
window.pnameRef = (p) => (typeof pname === "function") ? pname(p) : (p.name || "");
window.moneyRef = (n) => (typeof money === "function") ? money(n) : (n + " ج.م");
window.catRef = (c) => (typeof cat === "function") ? cat(c) : (c || "");
window.toastRef = (m) => (typeof toast === "function") ? toast(m) : console.log(m);
window.addToCartRef = (p, o) => (typeof addToCart === "function") ? addToCart(p, o) : false;
window.openQuickAddRef = (p) => (typeof openQuickAdd === "function") ? openQuickAdd(p) : null;
window.tRef = (k) => (typeof t === "function") ? t(k) : k;
window.LANGRef = () => (typeof LANG !== "undefined") ? LANG : "ar";

})();
