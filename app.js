(function(){
"use strict";

/* ═══════════════════════════════════════
   QUICK ADD
   ═══════════════════════════════════════ */

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

const velaScentTr=name=>{
  const found=VELA_SCENTS.find(s=>s[0]===name||s[1]===name);
  return found ? (LANG==="en" ? found[1] : found[0]) : (name||"");
};


/* ═══════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════ */

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


window.addEventListener(
  "data-refresh",
  ()=>{
    renderProducts();
  }
);




/* ═══════════════════════════════════════
   CINEMATIC HERO INTRO
   Runs once per page load; slide changes never replay the copy animation.
   ═══════════════════════════════════════ */

function initHeroIntro(){
  const hero=document.querySelector('.hero-content');
  if(!hero)return;

  requestAnimationFrame(()=>{
    setTimeout(()=>hero.classList.add('hero-intro'),40);
  });
}

/* ═══════════════════════════════════════
   PRODUCTS REALTIME SYNC
   Firebase is the live source for product changes.
   data.js remains the local fallback/seed.
   Reviews, orders, cart and auth are untouched.
   ═══════════════════════════════════════ */

let productRealtimeStarted=false;
let productRealtimeUnsubscribe=null;

function initProductRealtimeSync(){

  if(productRealtimeStarted)return;

  if(
    typeof DB === "undefined" ||
    typeof DB.watch !== "function"
  ){
    return;
  }

  productRealtimeStarted=true;

  productRealtimeUnsubscribe=
    DB.watch(
      "products",
      cloud=>{

        const map=
          new Map(
            (typeof PRODUCTS !== "undefined" ? PRODUCTS : [])
              .map(p=>[p.id,{...p}])
          );

        (cloud||[]).forEach(d=>{

          const slug=
            d.id_ ||
            d.slug ||
            d.pid ||
            d.id;

          if(!slug)return;

          if(d.active===false){
            map.delete(slug);
            return;
          }

          map.set(
            slug,
            {
              ...(map.get(slug)||{}),
              ...d,
              id:slug,
              _fid:d.id || null
            }
          );

        });

        ALL_PRODUCTS=[...map.values()];

        window.dispatchEvent(
          new Event("data-refresh")
        );

      },
      error=>{
        console.error(
          "Products realtime sync error:",
          error
        );
      }
    );
}


/* ═══════════════════════════════════════
   LANGUAGE
   ═══════════════════════════════════════ */

function initLang(){

  const btn=$("#langBtn");

  if(!btn)return;

  updateLangBtn();

  btn.addEventListener("click",()=>{

    LANG=LANG==="ar"?"en":"ar";

    localStorage.setItem(
      "vl_lang",
      LANG
    );

    document.documentElement.dir=
      LANG==="ar"?"rtl":"ltr";

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

    toast(
      t(
        LANG==="ar"
        ?"t_lang_ar"
        :"t_lang_en"
      )
    );

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
    title.textContent='ضوءٌ يُشبهكِ.';
    lead.textContent='شموع تُضيء… لتنير يومكِ بلحظاتٍ تستحقينها.';
    cta.innerHTML='اكتشفي مجموعتكِ <span aria-hidden="true">✦</span>';
  }
}


function updateLangBtn(){

  const btn=$("#langBtn");

  if(btn){

    btn.textContent=
      LANG==="ar"
      ?"EN"
      :"ع";

  }

}


function applyI18n(){

  document.title=t("docTitle");

  $$("[data-i18n]").forEach(el=>{

    el.textContent=
      t(el.dataset.i18n);

  });


  $$("[data-i18n-ph]").forEach(el=>{

    el.placeholder=
      t(el.dataset.i18nPh);

  });


  const mq=$("#mqTrack");

  if(mq){

    const txt=t("mq");

    mq.innerHTML=
      `<span>${txt}</span>
       <span>${txt}</span>`;

  }

}


/* ═══════════════════════════════════════
   MARQUEE
   ═══════════════════════════════════════ */

function initMarquee(){}


/* ═══════════════════════════════════════
   HERO EMBERS
   ═══════════════════════════════════════ */

function initEmbers(){

  const w=$("#embers");

  if(!w)return;

  w.innerHTML="";

  for(let i=0;i<12;i++){

    const s=
      document.createElement("span");

    s.style.left=
      Math.random()*100+"%";

    s.style.animationDelay=
      Math.random()*7+"s";

    s.style.animationDuration=
      (5+Math.random()*5)+"s";

    w.appendChild(s);

  }

}


/* ═══════════════════════════════════════
   REVEAL
   ═══════════════════════════════════════ */

function initReveal(){

  const io=
    new IntersectionObserver(
      es=>{
        es.forEach(e=>{

          if(e.isIntersecting){

            e.target.classList.add("on");

            io.unobserve(e.target);

          }

        });
      },
      {threshold:.12}
    );

  $$(".rv").forEach(
    el=>io.observe(el)
  );

}


/* ═══════════════════════════════════════
   CATEGORIES
   ═══════════════════════════════════════ */

function renderChips(){

  const w=$("#chips");

  if(!w)return;

  const keys=[
    "all",
    "wood",
    "glass",
    "crystal",
    "metal",
    "massage",
    "gift",
    "bride"
  ];

  w.innerHTML=
    keys.map(
      k=>
      `<button
        class="chip${k==="all"?" on":""}"
        data-cat="${k}"
      >
        ${cat(k)}
      </button>`
    ).join("");

  w.querySelectorAll(".chip")
    .forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          w.querySelectorAll(".chip")
            .forEach(
              x=>x.classList.remove("on")
            );

          b.classList.add("on");

          renderProducts();

        }
      );

    });

}


function activeCat(){

  const c=
    $("#chips .chip.on");

  return c
    ?c.dataset.cat
    :"all";

}


/* ═══════════════════════════════════════
   PRODUCTS
   ═══════════════════════════════════════ */

function renderProducts(){

  const grid=$("#pgrid");

  if(!grid)return;

  const catF=activeCat();

  const min=
    +($("#priceMin")?.value||0);

  const max=
    +($("#priceMax")?.value||0);

  const sort=
    $("#sortSel")?.value||"new";


  let list=
    ALL_PRODUCTS.filter(p=>{

      if(
        catF!=="all" &&
        p.cat!==catF
      ){
        return false;
      }

      if(
        min &&
        p.price<min
      ){
        return false;
      }

      if(
        max &&
        p.price>max
      ){
        return false;
      }

      return true;

    });


  switch(sort){

    case "asc":

      list.sort(
        (a,b)=>
          a.price-b.price
      );

      break;


    case "desc":

      list.sort(
        (a,b)=>
          b.price-a.price
      );

      break;


    case "rating":

      list.sort(
        (a,b)=>
          (ratingOf(b.id)?.avg||0)-
          (ratingOf(a.id)?.avg||0)
      );

      break;


    case "best":

      list.sort(
        (a,b)=>
          (b.sold||0)-
          (a.sold||0)
      );

      break;


    case "disc":

      list.sort(
        (a,b)=>
          (
            (b.old-b.price)/
            Math.max(b.old,1)
          )-
          (
            (a.old-a.price)/
            Math.max(a.old,1)
          )
      );

      break;


    default:

      list.sort(
        (a,b)=>
          (b.createdAt||0)-
          (a.createdAt||0)
      );

  }


  const cnt=$("#prodCount");

  if(cnt){

    cnt.textContent=
      list.length+
      " "+
      t("prod_word");

  }


  if(!list.length){

    grid.innerHTML=
      `<div class="empty">
        ${t("no_products")}
      </div>`;

    return;

  }


  grid.innerHTML=
    list.map(p=>{

      const r=
        ratingOf(p.id);

      const badge=
        pbadge(p);

      const rawDesc =
        LANG === "en"
          ? (p.descEn || p.desc || "")
          : (p.desc || p.descEn || "");

      const productDesc =
        String(rawDesc).trim();


      return `
        <article class="p-card">

          <a
            class="p-media"
            href="product.html?p=${p.id}"
          >

            <img
              src="${imgOf(p)}"
              alt="${pname(p)}"
              loading="lazy"
            >

            ${
              badge
              ?`
                <span class="p-badge">
                  ${badge}
                </span>
              `
              :""
            }

            <span class="p-quick">
              ${t("view_details")}
            </span>

          </a>


          <div class="p-body">

            <span class="p-cat">
              ${cat(p.cat)}
            </span>

            <h3>
              <a href="product.html?p=${p.id}">
                ${pname(p)}
              </a>
            </h3>

            ${
              r
              ?`
                <span class="stars">
                  ${"★".repeat(
                    Math.round(r.avg)
                  )}
                </span>
              `
              :""
            }

            <p class="p-desc">
              ${productDesc}
            </p>

            <a
              class="p-more"
              href="product.html?p=${p.id}"
              aria-label="${LANG === "en" ? "View more details" : "عرض المزيد من تفاصيل المنتج"}"
            >
              ${LANG === "en" ? "View more" : "عرض المزيد"}
            </a>

            <div class="p-foot">

              <div class="p-price">

                ${money(p.price)}

                ${
                  p.old>p.price
                  ?`
                    <del>
                      ${money(p.old)}
                    </del>
                  `
                  :""
                }

              </div>


              <button
                class="p-add"
                data-id="${p.id}"
              >
                ${t("add_cart")}
              </button>

            </div>

          </div>

        </article>
      `;

    }).join("");


  grid.querySelectorAll(".p-add")
    .forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          const p=
            ALL_PRODUCTS.find(
              x=>x.id===b.dataset.id
            );

          if(p){

            openQuickAdd(p);

          }

        }
      );

    });

}


/* ═══════════════════════════════════════
   QUICK ADD / SCENT SELECTOR
   ═══════════════════════════════════════ */

function initQuickAdd(){

  $("#closeScent")?.addEventListener(
    "click",
    ()=>closeModal("scentOv")
  );


  $("#scentOv")?.addEventListener(
    "click",
    e=>{
      if(
        e.target.id==="scentOv"
      ){
        closeModal("scentOv");
      }
    }
  );


  $("#smQMinus")?.addEventListener(
    "click",
    ()=>{

      if(quickAddQty>1){

        quickAddQty--;

      }

      $("#smQVal").textContent=
        quickAddQty;

    }
  );


  $("#smQPlus")?.addEventListener(
    "click",
    ()=>{

      quickAddQty++;

      $("#smQVal").textContent=
        quickAddQty;

    }
  );


  $("#scentModalAdd")
    ?.addEventListener(
      "click",
      ()=>{

        if(!quickAddProduct){
          return;
        }


        if(!quickAddScent){

          toast(
            t("t_scentwarn")
          );

          return;

        }


        if(
          addToCart(
            quickAddProduct,
            {
              scent:quickAddScent,
              qty:quickAddQty
            }
          )
        ){

          closeModal(
            "scentOv"
          );

        }

      }
    );

}


function openQuickAdd(p){

  quickAddProduct=p;

  quickAddScent="";

  quickAddQty=1;


  const title=
    $("#scentModalTitle");

  if(title){

    title.textContent=
      pname(p);

  }


  const qv=
    $("#smQVal");

  if(qv){

    qv.textContent="1";

  }


  const w=
    $("#scentModalScents");

  if(!w)return;


  /*
    مهم:
    لا يوجد عطر مختار تلقائيًا.
    العميل لازم يضغط بنفسه.
  */

  w.innerHTML=
    VELA_SCENTS.map(
      s=>
      `
        <button
          class="chip"
          type="button"
          data-s="${s[0]}"
        >
          ${velaScentTr(s[0])}
        </button>
      `
    ).join("");


  w.querySelectorAll(".chip")
    .forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          w.querySelectorAll(".chip")
            .forEach(
              x=>x.classList.remove("on")
            );

          b.classList.add("on");

          quickAddScent=
            b.dataset.s;

        }
      );

    });


  openDrawer(
    "scentOv"
  );

}


/* ═══════════════════════════════════════
   FILTERS
   ═══════════════════════════════════════ */

document.addEventListener(
  "change",
  e=>{

    if(
      e.target.id==="priceMin" ||
      e.target.id==="priceMax" ||
      e.target.id==="sortSel"
    ){

      renderProducts();

    }

  }
);


document.addEventListener(
  "input",
  e=>{

    if(
      e.target.id==="priceMin" ||
      e.target.id==="priceMax"
    ){

      renderProducts();

    }

  }
);


/* ═══════════════════════════════════════
   SCENTS
   ═══════════════════════════════════════ */

function renderScents(){

  const w=$("#scentGrid");

  if(!w)return;

  w.innerHTML=
    VELA_SCENTS.map(
      (s,i)=>
      `
        <div class="scent">

          <i>${i+1}</i>

          <div>

            <b>
              ${
                LANG==="en"
                ?s[1]
                :s[0]
              }
            </b>

            <small>
              ${
                LANG==="en"
                ?s[0]
                :s[1]
              }
            </small>

          </div>

        </div>
      `
    ).join("");

}


/* ═══════════════════════════════════════
   FAQ
   ═══════════════════════════════════════ */

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


  w.innerHTML=
    items.map(
      q=>
      `
        <div class="faq-item">

          <button class="faq-q">

            <span>
              ${q[0]}
            </span>

            <span>
              +
            </span>

          </button>

          <div class="faq-a">

            <div>
              ${q[1]}
            </div>

          </div>

        </div>
      `
    ).join("");


  w.querySelectorAll(".faq-item")
    .forEach(item=>{

      item
        .querySelector(".faq-q")
        .addEventListener(
          "click",
          ()=>{

            const was=
              item.classList.contains(
                "open"
              );


            w.querySelectorAll(
              ".faq-item"
            ).forEach(x=>{

              x.classList.remove(
                "open"
              );

              x.querySelector(
                ".faq-a"
              ).style.maxHeight=null;

            });


            if(!was){

              item.classList.add(
                "open"
              );

              const a=
                item.querySelector(
                  ".faq-a"
                );

              a.style.maxHeight=
                a.scrollHeight+
                "px";

            }

          }
        );

    });

}


/* ═══════════════════════════════════════
   CART INITIALIZATION
   ═══════════════════════════════════════ */

function initCart(){

  cartBadge();

  fillCitySelect(
    $("#coCity")
  );

  fillCartForm();


  $("#cartBtn")?.addEventListener(
    "click",
    ()=>{

      fillCartForm();

      renderCart();

      openDrawer(
        "cartDrawer",
        "cartOv"
      );

    }
  );


  $("#closeCart")?.addEventListener(
    "click",
    closeDrawers
  );


  $("#cartOv")?.addEventListener(
    "click",
    closeDrawers
  );


  renderCart();


  if(
    new URLSearchParams(
      location.search
    ).get("cart")==="1"
  ){

    fillCartForm();

    renderCart();

    openDrawer(
      "cartDrawer",
      "cartOv"
    );

  }


  $("#emptyCartBtn")
    ?.addEventListener(
      "click",
      ()=>{

        if(
          !confirm(
            t("t_confirm_empty")
          )
        ){

          return;

        }


        saveCart([]);

        renderCart();

      }
    );


  $("#checkoutBtn")
    ?.addEventListener(
      "click",
      checkout
    );


  /*
    حفظ بيانات العميل مباشرة
    أثناء الكتابة.
  */

  [
    "#coName",
    "#coPhone",
    "#coCity",
    "#coAddr",
    "#coNotes"
  ].forEach(selector=>{

    document.addEventListener(
      "input",
      e=>{

        if(
          e.target.matches(selector)
        ){

          saveCartCustomer();

        }

      }
    );


    document.addEventListener(
      "change",
      e=>{

        if(
          e.target.matches(selector)
        ){

          saveCartCustomer();

        }

      }
    );

  });

}


/* ═══════════════════════════════════════
   CART RENDER
   ═══════════════════════════════════════ */

function renderCart(){

  const c=getCart();

  const w=$("#cartItems");

  if(!w)return;


  if(!c.length){

    w.innerHTML=
      `
        <div
          class="empty"
          style="padding:2rem 0"
        >

          ${t("cart_empty")}

          <br>

          <small>
            ${t("cart_empty_sub")}
          </small>

        </div>
      `;

    updateTotals(c);

    return;

  }


  w.innerHTML=
    c.map(
      (it,i)=>{

        const lineTotal=
          Number(it.price||0)*
          Number(it.qty||1);


        return `
          <div class="citem">

            <div class="citem-media">

              <img
                src="${it.img||""}"
                alt="${pname({
                  name:it.name,
                  nameEn:it.nameEn
                })}"
                loading="lazy"
              >

            </div>


            <div class="citem-info">

              <h5>
                ${pname({
                  name:it.name,
                  nameEn:it.nameEn
                })}
              </h5>


              <label class="cart-scent-picker">
                <span class="cart-scent-label">
                  🌸 ${t("scent_lbl")}
                </span>

                <select
                  class="cart-scent-select"
                  data-i="${i}"
                  aria-label="${t("scent_lbl")}"
                >
                  <option value="">
                    ${LANG === "en" ? "Choose a scent" : "اختاري العطر"}
                  </option>
                  ${VELA_SCENTS.map(
                    scent => `
                      <option
                        value="${scent[0]}"
                        ${String(it.scent||"") === String(scent[0]) ? "selected" : ""}
                      >
                        ${velaScentTr(scent[0])}
                      </option>
                    `
                  ).join("")}
                </select>
              </label>


              <div class="cs">

                ${t("price_lbl")}

                <strong>
                  ${money(it.price)}
                </strong>

              </div>


              <div class="cart-line-total">

                <span>
                  ${LANG==="en"
                    ?"Item total:"
                    :"إجمالي الصنف:"
                  }
                </span>

                <strong>
                  ${money(lineTotal)}
                </strong>

              </div>


              <div class="qty">

                <button
                  class="cq-minus"
                  type="button"
                  data-i="${i}"
                  aria-label="minus"
                >
                  −
                </button>

                <b>
                  ${it.qty}
                </b>

                <button
                  class="cq-plus"
                  type="button"
                  data-i="${i}"
                  aria-label="plus"
                >
                  +
                </button>

              </div>

            </div>


            <button
              class="rm"
              type="button"
              data-i="${i}"
              aria-label="remove"
            >
              ✕
            </button>

          </div>
        `;

      }
    ).join("");


  w.querySelectorAll(".cart-scent-select")
    .forEach(select=>{

      select.addEventListener(
        "change",
        ()=>{

          const idx=+select.dataset.i;

          if(!c[idx])return;

          c[idx].scent=select.value;

          saveCart(c);
          renderCart();

        }
      );

    });


  w.querySelectorAll(".rm")
    .forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          c.splice(
            +b.dataset.i,
            1
          );

          saveCart(c);

          renderCart();

        }
      );

    });


  w.querySelectorAll(".cq-plus")
    .forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          const idx=
            +b.dataset.i;

          c[idx].qty=
            Number(c[idx].qty||1)+1;

          saveCart(c);

          renderCart();

        }
      );

    });


  w.querySelectorAll(".cq-minus")
    .forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          const idx=
            +b.dataset.i;

          c[idx].qty=
            Number(c[idx].qty||1)-1;


          if(c[idx].qty<=0){

            c.splice(idx,1);

          }


          saveCart(c);

          renderCart();

        }
      );

    });


  updateTotals(c);

}


/* ═══════════════════════════════════════
   TOTALS
   PRODUCTS ONLY
   ═══════════════════════════════════════ */

function updateTotals(c){

  const sub=
    c.reduce(
      (a,i)=>
        a+
        (
          Number(i.price||0)*
          Number(i.qty||1)
        ),
      0
    );


  if($("#cartSub")){

    $("#cartSub").textContent=
      money(sub);

  }


  if($("#cartTotal")){

    $("#cartTotal").textContent=
      money(sub);

  }


  /*
    مهم:
    لا يوجد SHIPPING هنا.
    لا يوجد +60.
  */

}


/* ═══════════════════════════════════════
   CUSTOMER DATA
   ═══════════════════════════════════════ */

function getSavedUser(){

  try{

    return JSON.parse(
      localStorage.getItem(
        "vl_user"
      )||"{}"
    );

  }catch(e){

    return {};

  }

}


function fillCartForm(){

  const u=
    getSavedUser();


  if($("#coName")){

    $("#coName").value=
      u.name||"";

  }


  if($("#coPhone")){

    $("#coPhone").value=
      u.phone||"";

  }


  if($("#coCity")){

    $("#coCity").value=
      u.city||"";

  }


  if($("#coAddr")){

    $("#coAddr").value=
      u.addr||"";

  }


  if($("#coNotes")){

    $("#coNotes").value=
      u.notes||"";

  }

}


function saveUserFromCart(
  name,
  phone,
  city,
  addr,
  notes=""
){

  const old=
    getSavedUser();


  const u={
    ...old,
    name,
    phone,
    city,
    addr,
    notes,
    orders:old.orders||0
  };


  localStorage.setItem(
    "vl_user",
    JSON.stringify(u)
  );


  if($("#accName"))
    $("#accName").value=name;


  if($("#accPhone"))
    $("#accPhone").value=phone;


  if($("#accCity"))
    $("#accCity").value=city;


  if($("#accAddr"))
    $("#accAddr").value=addr;

}


function saveCartCustomer(){

  const name=
    $("#coName")?.value.trim()||"";

  const phone=
    $("#coPhone")?.value.trim()||"";

  const city=
    $("#coCity")?.value||"";

  const addr=
    $("#coAddr")?.value.trim()||"";

  const notes=
    $("#coNotes")?.value.trim()||"";


  const old=
    getSavedUser();


  localStorage.setItem(
    "vl_user",
    JSON.stringify({
      ...old,
      name,
      phone,
      city,
      addr,
      notes,
      orders:old.orders||0
    })
  );

}


/* ═══════════════════════════════════════
   ORDER ID
   ═══════════════════════════════════════ */

function genOrderId(){

  const chars=
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let s="";


  for(
    let i=0;
    i<6;
    i++
  ){

    s+=
      chars[
        Math.floor(
          Math.random()*
          chars.length
        )
      ];

  }


  return "VL-"+s;

}


/* ═══════════════════════════════════════
   CHECKOUT
   ═══════════════════════════════════════ */

async function checkout(){

  const c=getCart();


  /* 1 — PRODUCTS */

  if(!c.length){

    toast(
      t("t_empty")
    );

    return;

  }


  /* 2 — SCENTS */

  const missingScent=
    c.some(
      it=>
        !it.scent ||
        !String(it.scent).trim()
    );


  if(missingScent){

    toast(
      t("t_scentwarn")
    );

    return;

  }


  /* 3 — CUSTOMER */

  const name=
    $("#coName")?.value.trim()||"";

  const phone=
    $("#coPhone")?.value.trim()||"";

  const city=
    $("#coCity")?.value||"";

  const addr=
    $("#coAddr")?.value.trim()||"";

  const notes=
    $("#coNotes")?.value.trim()||"";


  if(!name){

    toast(
      LANG==="en"
      ?"⚠️ Please enter your full name."
      :"⚠️ من فضلك اكتبي الاسم بالكامل."
    );

    $("#coName")?.focus();

    return;

  }


  if(!phone){

    toast(
      LANG==="en"
      ?"⚠️ Please enter your mobile number."
      :"⚠️ من فضلك اكتبي رقم الموبايل."
    );

    $("#coPhone")?.focus();

    return;

  }


  if(!addr){

    toast(
      LANG==="en"
      ?"⚠️ Please enter the detailed address."
      :"⚠️ من فضلك اكتبي العنوان بالتفصيل."
    );

    $("#coAddr")?.focus();

    return;

  }


  /* SAVE CUSTOMER */

  saveUserFromCart(
    name,
    phone,
    city,
    addr,
    notes
  );


  /* ORDER ID */

  const orderId=
    genOrderId();


  /* PRODUCTS TOTAL ONLY */

  const total=
    c.reduce(
      (a,i)=>
        a+
        (
          Number(i.price||0)*
          Number(i.qty||1)
        ),
      0
    );


  /*
    WhatsApp message
    No shipping price.
  */

  let msg=
    `${t("wa_head")}\n`;

  msg+=
    `${t("wa_order")} ${orderId}\n`;

  msg+=
    `━━━━━━━━━━━━━━━━━━━━\n\n`;


  c.forEach(it=>{

    const qty=
      Number(it.qty||1);

    const unitPrice=
      Number(it.price||0);

    const itemTotal=
      unitPrice*qty;


    msg+=
      `${t("wa_item")} ${pname({
        name:it.name,
        nameEn:it.nameEn
      })}\n`;

    msg+=
      `${t("wa_scent")}: ${velaScentTr(
        it.scent
      )}\n`;

    msg+=
      `${LANG==="en"
        ?"Quantity:"
        :"الكمية:"
      } ${qty}\n`;

    msg+=
      `${LANG==="en"
        ?"Unit price:"
        :"سعر الوحدة:"
      } ${money(unitPrice)}\n`;

    msg+=
      `${LANG==="en"
        ?"Item total:"
        :"إجمالي الصنف:"
      } ${money(itemTotal)}\n\n`;

  });


  msg+=
    `━━━━━━━━━━━━━━━━━━━━\n`;

  msg+=
    `${waTotalLabel()} ${money(total)}\n`;

  msg+=
    `${t("pay_products_note")}\n`;


  /*
    Only include InstaPay account
    if it was actually configured.
  */

  if(
    CFG &&
    CFG.INSTAPAY &&
    String(CFG.INSTAPAY).trim()
  ){

    msg+=
      `${t("wa_insta")} ${CFG.INSTAPAY}\n`;

  }


  msg+=
    `${t("ship_note")}\n\n`;


  msg+=
    `${t("wa_name")} ${name}\n`;

  msg+=
    `${t("wa_phone")} ${phone}\n`;


  if(city){

    msg+=
      `${t("wa_city")} ${city}\n`;

  }


  msg+=
    `${t("wa_addr")} ${addr}\n`;


  if(notes){

    msg+=
      `${t("wa_notes")} ${notes}\n`;

  }


  /*
    Firestore
  */

  const orderData={

    orderId,

    customer:{
      name,
      phone,
      city,
      address:addr
    },

    name,
    phone,
    city,
    address:addr,

    notes,

    products:c.map(it=>({

      id:it.id,

      name:it.name,

      nameEn:it.nameEn||"",

      scent:it.scent,

      scentName:
        velaScentTr(it.scent),

      quantity:
        Number(it.qty||1),

      price:
        Number(it.price||0),

      total:
        Number(it.price||0)*
        Number(it.qty||1),

      img:it.img||""

    })),

    items:c,

    total,

    productsTotal:total,

    paymentMethod:"InstaPay",

    shippingPayment:
      "Cash to courier",

    shippingIncluded:false,

    status:"قيد المراجعة",

    statusEn:"Under Review",

    createdAt:Date.now(),

    orderDate:
      new Date().toISOString()

  };


  try{

    await DB.add(
      "orders",
      orderData
    );

  }catch(e){

    console.warn(
      "Order save warning:",
      e
    );

  }


  /*
    Increase orders count.
  */

  const u=
    getSavedUser();

  u.orders=
    (u.orders||0)+1;

  u.name=name;
  u.phone=phone;
  u.city=city;
  u.addr=addr;
  u.notes=notes;


  localStorage.setItem(
    "vl_user",
    JSON.stringify(u)
  );


  const oc=
    $("#ordCount");

  if(oc){

    oc.textContent=
      u.orders;

  }


  /*
    Clear cart ONLY after order data
    was prepared/sent to Firestore.
  */

  saveCart([]);

  renderCart();

  cartBadge();

  toast(
    t("t_order")
  );


  /*
    Open WhatsApp
  */

  const wa=
    "https://wa.me/"+
    CFG.WHATSAPP+
    "?text="+
    encodeURIComponent(msg);


  window.open(
    wa,
    "_blank"
  );

}


/* ═══════════════════════════════════════
   WHATSAPP TOTAL LABEL
   ═══════════════════════════════════════ */

function waTotalLabel(){

  if(
    I18N &&
    I18N[LANG] &&
    I18N[LANG].wa_total
  ){

    return I18N[LANG].wa_total;

  }

  return LANG==="en"
    ?"💰 Products Total:"
    :"💰 إجمالي المنتجات:";

}


/* ═══════════════════════════════════════
   ACCOUNT
   ═══════════════════════════════════════ */

function initAccount(){

  fillCitySelect(
    $("#accCity")
  );


  const u=
    getSavedUser();


  if(u.name){

    $("#accName").value=
      u.name;

  }


  if(u.phone){

    $("#accPhone").value=
      u.phone;

  }


  if(u.city){

    $("#accCity").value=
      u.city;

  }


  if(u.addr){

    $("#accAddr").value=
      u.addr;

  }


  if(u.orders){

    $("#ordCount").textContent=
      u.orders;

  }


  $("#accBtn")
    ?.addEventListener(
      "click",
      ()=>{
        openDrawer("accOv");
      }
    );


  $("#closeAcc")
    ?.addEventListener(
      "click",
      ()=>closeModal("accOv")
    );


  $("#accOv")
    ?.addEventListener(
      "click",
      e=>{

        if(
          e.target.id==="accOv"
        ){

          closeModal(
            "accOv"
          );

        }

      }
    );


  $("#saveAccBtn")
    ?.addEventListener(
      "click",
      ()=>{

        const name=
          $("#accName")
            .value
            .trim();

        const phone=
          $("#accPhone")
            .value
            .trim();

        const city=
          $("#accCity").value;

        const addr=
          $("#accAddr")
            .value
            .trim();


        if(!name){

          toast(
            LANG==="en"
            ?"⚠️ Enter your name."
            :"⚠️ اكتبي الاسم."
          );

          return;

        }


        if(!phone){

          toast(
            LANG==="en"
            ?"⚠️ Enter your phone."
            :"⚠️ اكتبي رقم الموبايل."
          );

          return;

        }


        const old=
          getSavedUser();


        localStorage.setItem(
          "vl_user",
          JSON.stringify({

            ...old,

            name,
            phone,
            city,
            addr,

            orders:
              old.orders||0

          })
        );


        fillCartForm();

        toast(
          t("t_saved")
        );

        closeModal(
          "accOv"
        );

      }
    );


  $("#logoutBtn")
    ?.addEventListener(
      "click",
      ()=>{

        localStorage.removeItem(
          "vl_user"
        );


        $("#accName").value="";
        $("#accPhone").value="";
        $("#accAddr").value="";


        if($("#accCity")){

          $("#accCity").value="";

        }


        $("#ordCount").textContent=
          "0";


        toast(
          t("t_saved")
        );

      }
    );

}


function fillCitySelect(sel){

  if(!sel)return;

  const arr=
    LANG==="en"
    ?GOVS_EN
    :GOVS;


  sel.innerHTML=
    `<option value="">
      ${t("ph_city")}
    </option>`+
    arr.map(
      g=>
      `<option value="${g}">
        ${g}
      </option>`
    ).join("");

}


/* ═══════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════ */

function initSearch(){

  $("#searchBtn")
    ?.addEventListener(
      "click",
      ()=>{

        openDrawer(
          "searchOv"
        );

        setTimeout(
          ()=>{
            $("#searchInput")
              ?.focus();
          },
          200
        );

      }
    );


  $("#closeSearch")
    ?.addEventListener(
      "click",
      ()=>closeModal("searchOv")
    );


  $("#searchOv")
    ?.addEventListener(
      "click",
      e=>{

        if(
          e.target.id==="searchOv"
        ){

          closeModal(
            "searchOv"
          );

        }

      }
    );


  $("#searchInput")
    ?.addEventListener(
      "input",
      e=>{

        const q=
          e.target.value
            .trim()
            .toLowerCase();


        const w=
          $("#searchResults");

        if(!w)return;


        if(!q){

          w.innerHTML="";

          return;

        }


        const res=
          ALL_PRODUCTS
            .filter(p=>{

              const hay=
                (
                  p.name+
                  " "+
                  (p.nameEn||"")+
                  " "+
                  (p.desc||"")+
                  " "+
                  (p.descEn||"")+
                  " "+
                  cat(p.cat)
                )
                .toLowerCase();


              return hay.includes(q);

            })
            .slice(0,8);


        w.innerHTML=
          res.map(
            p=>
            `
              <div
                class="sr-item"
                data-id="${p.id}"
              >

                <img
                  src="${imgOf(p)}"
                  alt=""
                >

                <div>

                  <b>
                    ${pname(p)}
                  </b>

                  <br>

                  <small>
                    ${money(p.price)}
                  </small>

                </div>

              </div>
            `
          ).join("");


        w.querySelectorAll(
          ".sr-item"
        ).forEach(it=>{

          it.addEventListener(
            "click",
            ()=>{

              location.href=
                "product.html?p="+
                it.dataset.id;

            }
          );

        });

      }
    );

}


/* ═══════════════════════════════════════
   CHAT
   ═══════════════════════════════════════ */

function initChat(){

  $("#chatFab")
    ?.addEventListener(
      "click",
      ()=>{
        $("#chatOv")
          ?.classList
          .toggle("open");
      }
    );


  $("#closeChat")
    ?.addEventListener(
      "click",
      ()=>{
        $("#chatOv")
          ?.classList
          .remove("open");
      }
    );


  initChatWelcome();


  const quick=[
    [t("q_gift"),"a_gift"],
    [t("q_relax"),"a_relax"],
    [t("q_scents"),"a_scents"],
    [t("q_ship"),"a_ship"],
    [t("q_bride"),"a_bride"]
  ];


  const qw=
    $("#chatQuick");


  if(qw){

    qw.innerHTML=
      quick.map(
        q=>
        `
          <button
            type="button"
            data-a="${q[1]}"
          >
            ${q[0]}
          </button>
        `
      ).join("");


    qw.querySelectorAll(
      "button"
    ).forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          addMsg(
            b.textContent,
            "user"
          );


          setTimeout(
            ()=>{
              addMsg(
                t(b.dataset.a),
                "bot"
              );
            },
            400
          );

        }
      );

    });

  }

}


function initChatWelcome(){

  const w=
    $("#chatMsgs");


  if(
    w &&
    !w.children.length
  ){

    addMsg(
      t("chat_welcome"),
      "bot"
    );

  }

}


function addMsg(
  txt,
  who
){

  const w=
    $("#chatMsgs");

  if(!w)return;


  const d=
    document.createElement(
      "div"
    );


  d.className=
    "msg "+
    who;


  d.textContent=
    txt;


  w.appendChild(d);


  w.scrollTop=
    w.scrollHeight;

}


/* ═══════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════ */

function initNav(){

  $("#navToggle")
    ?.addEventListener(
      "click",
      ()=>{

        $("#mnav")
          ?.classList
          .toggle("open");

        $("#ovl")
          ?.classList
          .toggle("open");

      }
    );


  $("#ovl")
    ?.addEventListener(
      "click",
      closeDrawers
    );


  $$(".mnav a")
    .forEach(a=>{

      a.addEventListener(
        "click",
        ()=>{

          $("#mnav")
            ?.classList
            .remove("open");

          $("#ovl")
            ?.classList
            .remove("open");

        }
      );

    });


  $$("[data-cat]")
    .forEach(a=>{

      if(
        a.closest(".mnav")||
        a.closest(".mainnav")||
        a.closest("footer")
      ){

        a.addEventListener(
          "click",
          ()=>{

            setTimeout(
              ()=>{

                const chip=
                  $(
                    `#chips .chip[data-cat="${a.dataset.cat}"]`
                  );


                if(chip){

                  chip.click();

                }

              },
              100
            );

          }
        );

      }

    });

}


/* ═══════════════════════════════════════
   DRAWERS / MODALS
   ═══════════════════════════════════════ */

function openDrawer(
  id,
  ovlId
){

  $("#"+id)
    ?.classList
    .add("open");


  if(ovlId){

    $("#"+ovlId)
      ?.classList
      .add("open");

  }

}


function closeDrawers(){

  $$(".drawer,.ovl")
    .forEach(
      el=>
        el.classList.remove(
          "open"
        )
    );

}


function closeModal(id){

  $("#"+id)
    ?.classList
    .remove("open");

}


})();
