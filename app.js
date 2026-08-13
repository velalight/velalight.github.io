(function(){
"use strict";

let quickAddProduct=null;
let quickAddScent="";
let quickAddQty=1;

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
  });
  initCart();
  initAccount();
  initSearch();
  initChat();
  initNav();
  initQuickAdd();
  initHeroIntro();
});

window.addEventListener("data-refresh",()=>{renderProducts()});

let productRealtimeStarted=false;
let productRealtimeUnsubscribe=null;

function initProductRealtimeSync(){
  if(productRealtimeStarted)return;
  if(typeof DB==="undefined"||typeof DB.watch!=="function")return;
  productRealtimeStarted=true;
  productRealtimeUnsubscribe=DB.watch("products",cloud=>{
    const map=new Map((typeof PRODUCTS!=="undefined"?PRODUCTS:[]).map(p=>[p.id,{...p}]));
    (cloud||[]).forEach(d=>{
      const slug=d.id_||d.slug||d.pid||d.id;
      if(!slug)return;
      if(d.active===false){map.delete(slug);return}
      map.set(slug,{...(map.get(slug)||{}),...d,id:slug,_fid:d.id||null});
    });
    ALL_PRODUCTS=[...map.values()];
    window.ALL_PRODUCTS=ALL_PRODUCTS;
    window.dispatchEvent(new Event("data-refresh"));
  },error=>{console.error("Products realtime sync error:",error)});
}

function renderChips(){
  const w=$("#chips");
  if(!w)return;
  const keys=["all","wood","glass","crystal","metal","massage","gift","bride"];
  w.innerHTML=keys.map(k=>`<button class="chip${k==="all"?" on":""}" data-cat="${k}">${cat(k)}</button>`).join("");
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

/* ═══════════════════════════════════════
   PRODUCTS - محسّنة لاستخدام srcset responsive images
   ═══════════════════════════════════════ */
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
  if(cnt)cnt.textContent=list.length+" "+t("prod_word");
  if(!list.length){
    grid.innerHTML=`<div class="empty">${t("no_products")}</div>`;
    return;
  }
  grid.innerHTML=list.map(p=>{
    const r=ratingOf(p.id);
    const badge=pbadge(p);
    const rawDesc=LANG==="en"?(p.descEn||p.desc||""):(p.desc||p.descEn||"");
    const productDesc=String(rawDesc).trim();
    // ═══════════════════════════════════════
    // صور محسّنة - srcset لتحميل نسخة حسب حجم الشاشة
    // الموبايل يحصل على 400px، الديسكتوب يحصل على 800px
    // ═══════════════════════════════════════
    const imgSm = imgOf(p, 400);
    const imgMd = imgOf(p, 800);
    return `
      <article class="p-card rv">
        <a class="p-media" href="product.html?p=${p.id}">
          <img
            src="${imgSm}"
            srcset="${imgSm} 400w, ${imgMd} 800w"
            sizes="(max-width: 600px) 90vw, 300px"
            alt="${pname(p)}"
            loading="lazy"
            decoding="async"
            width="400"
            height="400"
          >
          ${badge?`<span class="p-badge">${badge}</span>`:""}
          <span class="p-quick">${t("view_details")}</span>
        </a>
        <div class="p-body">
          <span class="p-cat">${cat(p.cat)}</span>
          <h3><a href="product.html?p=${p.id}">${pname(p)}</a></h3>
          ${r?`<span class="stars">${"★".repeat(Math.round(r.avg))}</span>`:""}
          <p class="p-desc">${productDesc}</p>
          <div class="p-foot">
            <div class="p-price">
              ${money(p.price)}
              ${p.old>p.price?`<del>${money(p.old)}</del>`:""}
            </div>
            <button class="p-add" data-id="${p.id}">${t("add_cart")}</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
  grid.querySelectorAll(".p-add").forEach(b=>{
    b.addEventListener("click",()=>{
      const p=ALL_PRODUCTS.find(x=>x.id===b.dataset.id);
      if(p)openQuickAdd(p);
    });
  });
  // Re-trigger reveal animations
  $$(".p-card.rv:not(.on)").forEach(el=>{
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("on");io.unobserve(e.target)}});
    },{threshold:0.05});
    io.observe(el);
  });
}

function renderScents(){
  const w=$("#scentGrid");
  if(!w)return;
  w.innerHTML=VELA_SCENTS.map((s,i)=>`
    <div class="scent rv">
      <i>${i+1}</i>
      <div>
        <b>${LANG==="en"?s[1]:s[0]}</b>
        <small>${LANG==="en"?s[0]:s[1]}</small>
      </div>
    </div>
  `).join("");
}

/* ═══════════════════════════════════════
   CART RENDER - صور مصغرة خفيفة جداً للسلة
   ═══════════════════════════════════════ */
function renderCart(){
  const c=getCart();
  const w=$("#cartItems");
  if(!w)return;
  if(!c.length){
    w.innerHTML=`<div class="empty" style="padding:2rem 0">${t("cart_empty")}<br><small>${t("cart_empty_sub")}</small></div>`;
    updateTotals(c);
    return;
  }
  w.innerHTML=c.map((it,i)=>{
    const lineTotal=Number(it.price||0)*Number(it.qty||1);
    // ═══════════════════════════════════════
    // صورة مصغرة للسلة - 100px فقط، WebP
    // ═══════════════════════════════════════
    const thumbUrl = it.imgHi 
      ? IMG_OPT(it.imgHi, 150, 70)
      : (it.img ? IMG_OPT(it.img, 150, 70) : "");
    return `
      <div class="citem">
        <div class="citem-media">
          <img
            src="${thumbUrl}"
            alt="${pname({name:it.name,nameEn:it.nameEn})}"
            loading="lazy"
            decoding="async"
            width="100"
            height="100"
          >
        </div>
        <div class="citem-info">
          <h5>${pname({name:it.name,nameEn:it.nameEn})}</h5>
          <label class="cart-scent-picker">
            <span class="cart-scent-label">🌸 ${t("scent_lbl")}</span>
            <select class="cart-scent-select" data-i="${i}" aria-label="${t("scent_lbl")}">
              <option value="">${LANG==="en"?"Choose a scent":"اختاري العطر"}</option>
              ${VELA_SCENTS.map(scent=>`<option value="${scent[0]}" ${String(it.scent||"")===String(scent[0])?"selected":""}>${velaScentTr(scent[0])}</option>`).join("")}
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
      </div>
    `;
  }).join("");
  w.querySelectorAll(".cart-scent-select").forEach(select=>{
    select.addEventListener("change",()=>{
      const idx=+select.dataset.i;
      if(!c[idx])return;
      c[idx].scent=select.value;
      saveCart(c);
      renderCart();
    });
  });
  w.querySelectorAll(".rm").forEach(b=>{
    b.addEventListener("click",()=>{c.splice(+b.dataset.i,1);saveCart(c);renderCart()});
  });
  w.querySelectorAll(".cq-plus").forEach(b=>{
    b.addEventListener("click",()=>{
      const idx=+b.dataset.i;
      c[idx].qty=Number(c[idx].qty||1)+1;
      saveCart(c);renderCart();
    });
  });
  w.querySelectorAll(".cq-minus").forEach(b=>{
    b.addEventListener("click",()=>{
      const idx=+b.dataset.i;
      c[idx].qty=Number(c[idx].qty||1)-1;
      if(c[idx].qty<=0)c.splice(idx,1);
      saveCart(c);renderCart();
    });
  });
  updateTotals(c);
}

async function checkout(){
  const c=getCart();
  if(!c.length){toast(t("t_empty"));return}
  const missingScent=c.some(it=>!it.scent||!String(it.scent).trim());
  if(missingScent){toast(t("t_scentwarn"));return}
  const name=$("#coName")?.value.trim()||"";
  const phone=$("#coPhone")?.value.trim()||"";
  const city=$("#coCity")?.value||"";
  const addr=$("#coAddr")?.value.trim()||"";
  const notes=$("#coNotes")?.value.trim()||"";
  if(!name){toast(LANG==="en"?"⚠️ Please enter your full name.":"⚠️ من فضلك اكتبي الاسم بالكامل.");$("#coName")?.focus();return}
  if(!phone){toast(LANG==="en"?"⚠️ Please enter your mobile number.":"⚠️ من فضلك اكتبي رقم الموبايل.");$("#coPhone")?.focus();return}
  if(!addr){toast(LANG==="en"?"⚠️ Please enter the detailed address.":"⚠️ من فضلك اكتبي العنوان بالتفصيل.");$("#coAddr")?.focus();return}
  saveUserFromCart(name,phone,city,addr,notes);
  const orderId=genOrderId();
  const total=c.reduce((a,i)=>a+Number(i.price||0)*Number(i.qty||1),0);
  let msg=`${t("wa_head")}\n${t("wa_order")} ${orderId}\n━━━━━━━━━━━━━━━━━━━━\n\n`;
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
  msg+=`━━━━━━━━━━━━━━━━━━━━\n${waTotalLabel()} ${money(total)}\n${t("pay_products_note")}\n`;
  if(CFG&&CFG.INSTAPAY&&String(CFG.INSTAPAY).trim())msg+=`${t("wa_insta")} ${CFG.INSTAPAY}\n`;
  msg+=`${t("ship_note")}\n\n${t("wa_name")} ${name}\n${t("wa_phone")} ${phone}\n`;
  if(city)msg+=`${t("wa_city")} ${city}\n`;
  msg+=`${t("wa_addr")} ${addr}\n`;
  if(notes)msg+=`${t("wa_notes")} ${notes}\n`;
  const orderData={orderId,customer:{name,phone,city,address:addr},name,phone,city,address:addr,notes,products:c.map(it=>({id:it.id,name:it.name,nameEn:it.nameEn||"",scent:it.scent,scentName:velaScentTr(it.scent),quantity:Number(it.qty||1),price:Number(it.price||0),total:Number(it.price||0)*Number(it.qty||1),img:it.img||""})),items:c,total,productsTotal:total,paymentMethod:"InstaPay",shippingPayment:"Cash to courier",shippingIncluded:false,status:"قيد المراجعة",statusEn:"Under Review",createdAt:Date.now(),orderDate:new Date().toISOString()};
  try{await DB.add("orders",orderData)}catch(e){console.warn("Order save warning:",e)}
  const u=getSavedUser();
  u.orders=(u.orders||0)+1;
  u.name=name;u.phone=phone;u.city=city;u.addr=addr;u.notes=notes;
  localStorage.setItem("vl_user",JSON.stringify(u));
  const oc=$("#ordCount");
  if(oc)oc.textContent=u.orders;
  saveCart([]);
  renderCart();
  cartBadge();
  toast(t("t_order"));
  const wa="https://wa.me/"+CFG.WHATSAPP+"?text="+encodeURIComponent(msg);
  window.open(wa,"_blank");
}

})();