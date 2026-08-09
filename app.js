(function(){

"use strict";


/* =========================================================
   VelaLight APP
   Cart + Checkout + Products + Account + WhatsApp
   ========================================================= */


/* =========================================================
   QUICK ADD STATE
   ========================================================= */

let quickAddProduct = null;
let quickAddScent = "";
let quickAddQty = 1;


/* =========================================================
   FIXED VELALIGHT SCENTS
   المصدر الثابت لكل أماكن اختيار العطر
   ========================================================= */

const VL_SCENTS = [

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

  ["كاسيليا","Cassilia Massage"],

  ["اينتو زانايت","Into Zenite Massage"],

  ["بوكيت روز","Bouquet Rose"],

  ["ورد بلدى","Egyptian Rose"],

  ["تيوليب","Tulip"],

  ["قهوة","Coffee"],

  ["قهوة فانيلا","Coffee Vanilla"],

  ["قهوة بندق","Hazelnut Coffee"],

  ["عود فانيليا","Oud Vanilla"],

  ["عنبر","Amber"],

  ["فراولة","Strawberry"],

  ["عود خشب صندل","Sandalwood Oud"]

];


/*
 * نجعل SCENTS المستخدمة في بقية الموقع
 * مساوية للقائمة الثابتة.
 *
 * لو data.js يحتوي SCENTS قديمة، لن تستخدم هنا.
 */

try{

  if(typeof window !== "undefined"){

    window.VL_SCENTS = VL_SCENTS;

  }

}catch(e){}



/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  ()=>{

    initLang();

    initMarquee();

    initEmbers();

    initReveal();


    loadAll().then(()=>{

      renderChips();

      renderProducts();

      renderScents();

      renderFAQ();

    });


    initCart();

    initAccount();

    initSearch();

    initChat();

    initNav();

    initQuickAdd();

  }
);



/* =========================================================
   DATA REFRESH
   ========================================================= */

window.addEventListener(
  "data-refresh",
  ()=>{

    renderProducts();

  }
);



/* =========================================================
   LANGUAGE
   ========================================================= */

function initLang(){

  const btn =
    $("#langBtn");


  if(!btn){

    applyI18n();

    return;

  }


  updateLangBtn();


  btn.addEventListener(
    "click",
    ()=>{

      LANG =
        LANG === "ar"
          ? "en"
          : "ar";


      localStorage.setItem(
        "vl_lang",
        LANG
      );


      document.documentElement.dir =
        LANG === "ar"
          ? "rtl"
          : "ltr";


      document.documentElement.lang =
        LANG;


      applyI18n();

      updateLangBtn();

      renderChips();

      renderProducts();

      renderScents();

      renderFAQ();

      fillCitySelect(
        $("#accCity")
      );

      fillCitySelect(
        $("#coCity")
      );

      fillCartForm();

      initChatWelcome();


      toast(
        t(
          LANG === "ar"
            ? "t_lang_ar"
            : "t_lang_en"
        )
      );

    }
  );


  applyI18n();

}



function updateLangBtn(){

  const btn =
    $("#langBtn");


  if(btn){

    btn.textContent =
      LANG === "ar"
        ? "EN"
        : "ع";

  }

}



function applyI18n(){

  document.title =
    t("docTitle");


  $$("[data-i18n]")
    .forEach(
      el=>{

        el.textContent =
          t(
            el.dataset.i18n
          );

      }
    );


  $$("[data-i18n-ph]")
    .forEach(
      el=>{

        el.placeholder =
          t(
            el.dataset.i18nPh
          );

      }
    );


  const mq =
    $("#mqTrack");


  if(mq){

    const txt =
      t("mq");


    mq.innerHTML =
      `
        <span>${txt}</span>
        <span>${txt}</span>
      `;

  }

}



/* =========================================================
   MARQUEE
   ========================================================= */

function initMarquee(){}



/* =========================================================
   HERO EMBERS
   ========================================================= */

function initEmbers(){

  const w =
    $("#embers");


  if(!w)return;


  /*
   * منع التكرار لو تم استدعاء الوظيفة مرة أخرى.
   */

  w.innerHTML = "";


  for(
    let i=0;
    i<12;
    i++
  ){

    const s =
      document.createElement(
        "span"
      );


    s.style.left =
      Math.random()*100+
      "%";


    s.style.animationDelay =
      Math.random()*7+
      "s";


    s.style.animationDuration =
      (5+Math.random()*5)+
      "s";


    w.appendChild(s);

  }

}



/* =========================================================
   REVEAL
   ========================================================= */

function initReveal(){

  if(
    !("IntersectionObserver" in window)
  ){

    $$(".rv")
      .forEach(
        el=>el.classList.add("on")
      );

    return;

  }


  const io =
    new IntersectionObserver(
      es=>{

        es.forEach(
          e=>{

            if(
              e.isIntersecting
            ){

              e.target.classList.add(
                "on"
              );


              io.unobserve(
                e.target
              );

            }

          }
        );

      },
      {
        threshold:.12
      }
    );


  $$(".rv")
    .forEach(
      el=>io.observe(el)
    );

}



/* =========================================================
   CATEGORIES
   ========================================================= */

function renderChips(){

  const w =
    $("#chips");


  if(!w)return;


  const keys = [
    "all",
    "wood",
    "glass",
    "crystal",
    "metal",
    "massage",
    "gift",
    "bride"
  ];


  w.innerHTML =
    keys
      .map(
        k=>`

          <button
            class="chip${k==="all"?" on":""}"
            data-cat="${k}"
            type="button">

            ${cat(k)}

          </button>

        `
      )
      .join("");


  w.querySelectorAll(".chip")
    .forEach(
      b=>{

        b.addEventListener(
          "click",
          ()=>{

            w.querySelectorAll(
              ".chip"
            )
            .forEach(
              x=>
                x.classList.remove(
                  "on"
                )
            );


            b.classList.add(
              "on"
            );


            renderProducts();

          }
        );

      }
    );

}



function activeCat(){

  const c =
    $("#chips .chip.on");


  return c
    ? c.dataset.cat
    : "all";

}



/* =========================================================
   PRODUCTS
   ========================================================= */

function renderProducts(){

  const grid =
    $("#pgrid");


  if(!grid)return;


  const catF =
    activeCat();


  const min =
    +(
      $("#priceMin")
        ?.value || 0
    );


  const max =
    +(
      $("#priceMax")
        ?.value || 0
    );


  const sort =
    $("#sortSel")
      ?.value ||
    "new";


  let list =
    ALL_PRODUCTS.filter(
      p=>{

        if(
          catF !== "all" &&
          p.cat !== catF
        ){

          return false;

        }


        if(
          min &&
          p.price < min
        ){

          return false;

        }


        if(
          max &&
          p.price > max
        ){

          return false;

        }


        return true;

      }
    );



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
          (
            ratingOf(b.id)?.avg || 0
          ) -
          (
            ratingOf(a.id)?.avg || 0
          )
      );

      break;


    case "best":

      list.sort(
        (a,b)=>
          (b.sold||0) -
          (a.sold||0)
      );

      break;


    case "disc":

      list.sort(
        (a,b)=>
          (
            ((b.old-b.price) /
            Math.max(b.old,1))
          ) -
          (
            ((a.old-a.price) /
            Math.max(a.old,1))
          )
      );

      break;


    default:

      list.sort(
        (a,b)=>
          (b.createdAt||0) -
          (a.createdAt||0)
      );

  }



  const cnt =
    $("#prodCount");


  if(cnt){

    cnt.textContent =
      list.length +
      " " +
      t("prod_word");

  }



  if(!list.length){

    grid.innerHTML =
      `
        <div class="empty">
          ${t("no_products")}
        </div>
      `;

    return;

  }



  grid.innerHTML =
    list
      .map(
        p=>{

          const r =
            ratingOf(p.id);


          const badge =
            pbadge(p);


          /*
           * عرض العطور الخاصة بالمنتج
           * في الكروت، إن وجدت.
           * لكن الاختيار الفعلي عند الإضافة
           * يستخدم القائمة الثابتة VL_SCENTS.
           */

          const sc =
            VL_SCENTS
              .map(
                s=>
                  LANG === "en"
                    ? s[1]
                    : s[0]
              )
              .join(" · ");


          return `

            <article
              class="p-card">


              <a
                class="p-media"
                href="product.html?p=${encodeURIComponent(p.id)}">


                <img
                  src="${imgOf(p)}"
                  alt="${escapeHtml(pname(p))}"
                  loading="lazy">


                ${
                  badge
                    ? `
                      <span
                        class="p-badge">
                        ${badge}
                      </span>
                    `
                    : ""
                }


                <span
                  class="p-quick">

                  ${t("view_details")}

                </span>


              </a>



              <div class="p-body">


                <span class="p-cat">

                  ${cat(p.cat)}

                </span>


                <h3>

                  <a
                    href="product.html?p=${encodeURIComponent(p.id)}">

                    ${escapeHtml(
                      pname(p)
                    )}

                  </a>

                </h3>


                ${
                  r
                    ? `
                      <span class="stars">

                        ${
                          "★".repeat(
                            Math.round(
                              r.avg
                            )
                          )
                        }

                      </span>
                    `
                    : ""
                }


                <div class="p-scents">

                  🌸

                  ${sc}

                </div>



                <div class="p-foot">


                  <div class="p-price">

                    ${money(p.price)}

                    ${
                      p.old > p.price
                        ? `
                          <del>
                            ${money(p.old)}
                          </del>
                        `
                        : ""
                    }

                  </div>


                  <button
                    class="p-add"
                    data-id="${p.id}"
                    type="button">

                    ${t("add_cart")}

                  </button>


                </div>


              </div>


            </article>

          `;

        }
      )
      .join("");



  grid
    .querySelectorAll(".p-add")
    .forEach(
      b=>{

        b.addEventListener(
          "click",
          ()=>{

            const p =
              ALL_PRODUCTS.find(
                x=>
                  String(x.id) ===
                  String(b.dataset.id)
              );


            if(p){

              openQuickAdd(p);

            }

          }
        );

      }
    );

}



/* =========================================================
   QUICK SCENT ADD
   ========================================================= */

function initQuickAdd(){

  $("#closeScent")
    ?.addEventListener(
      "click",
      ()=>closeModal("scentOv")
    );


  $("#scentOv")
    ?.addEventListener(
      "click",
      e=>{

        if(
          e.target.id ===
          "scentOv"
        ){

          closeModal(
            "scentOv"
          );

        }

      }
    );


  $("#smQMinus")
    ?.addEventListener(
      "click",
      ()=>{

        if(
          quickAddQty > 1
        ){

          quickAddQty--;

        }


        const q =
          $("#smQVal");


        if(q){

          q.textContent =
            quickAddQty;

        }

      }
    );


  $("#smQPlus")
    ?.addEventListener(
      "click",
      ()=>{

        quickAddQty++;


        const q =
          $("#smQVal");


        if(q){

          q.textContent =
            quickAddQty;

        }

      }
    );


  $("#scentModalAdd")
    ?.addEventListener(
      "click",
      ()=>{

        if(
          !quickAddProduct
        ){

          return;

        }


        if(
          !quickAddScent
        ){

          toast(
            scentWarning()
          );

          return;

        }


        const added =
          addToCart(
            quickAddProduct,
            {
              scent:quickAddScent,
              qty:quickAddQty
            }
          );


        if(
          added !== false
        ){

          closeModal(
            "scentOv"
          );


          toast(
            LANG === "ar"
              ? "✅ تمت إضافة المنتج للسلة"
              : "✅ Product added to cart"
          );

        }

      }
    );

}



function openQuickAdd(p){

  quickAddProduct =
    p;


  /*
   * مهم جدًا:
   * لا يوجد عطر مختار تلقائيًا.
   */

  quickAddScent =
    "";


  quickAddQty =
    1;


  const title =
    $("#scentModalTitle");


  if(title){

    title.textContent =
      pname(p);

  }


  const qv =
    $("#smQVal");


  if(qv){

    qv.textContent =
      "1";

  }


  const w =
    $("#scentModalScents");


  if(!w)return;


  w.innerHTML =
    VL_SCENTS
      .map(
        (s,index)=>`

          <button
            class="chip"
            type="button"
            data-scent-index="${index}"
            aria-pressed="false">

            ${
              LANG === "en"
                ? s[1]
                : s[0]
            }

          </button>

        `
      )
      .join("");


  w.querySelectorAll(
    ".chip"
  )
  .forEach(
    b=>{

      b.addEventListener(
        "click",
        ()=>{

          w.querySelectorAll(
            ".chip"
          )
          .forEach(
            x=>{

              x.classList.remove(
                "on"
              );

              x.setAttribute(
                "aria-pressed",
                "false"
              );

            }
          );


          b.classList.add(
            "on"
          );


          b.setAttribute(
            "aria-pressed",
            "true"
          );


          const index =
            Number(
              b.dataset.scentIndex
            );


          quickAddScent =
            VL_SCENTS[index][0];

        }
      );

    }
  );


  openDrawer(
    "scentOv"
  );

}



/* =========================================================
   FILTERS
   ========================================================= */

document.addEventListener(
  "change",
  e=>{

    if(
      e.target.id ===
      "priceMin" ||

      e.target.id ===
      "priceMax" ||

      e.target.id ===
      "sortSel"
    ){

      renderProducts();

    }

  }
);


document.addEventListener(
  "input",
  e=>{

    if(
      e.target.id ===
      "priceMin" ||

      e.target.id ===
      "priceMax"
    ){

      renderProducts();

    }

  }
);



/* =========================================================
   SCENTS SECTION
   ========================================================= */

function renderScents(){

  const w =
    $("#scentGrid");


  if(!w)return;


  w.innerHTML =
    VL_SCENTS
      .map(
        (s,i)=>`

          <div class="scent">

            <i>
              ${i+1}
            </i>


            <div>

              <b>

                ${
                  LANG === "en"
                    ? s[1]
                    : s[0]
                }

              </b>


              <small>

                ${
                  LANG === "en"
                    ? s[0]
                    : s[1]
                }

              </small>

            </div>

          </div>

        `
      )
      .join("");

}



/* =========================================================
   FAQ
   ========================================================= */

function renderFAQ(){

  const w =
    $("#faqWrap");


  if(!w)return;


  const items = [

    [
      t("faq1q"),
      t("faq1a")
    ],

    [
      t("faq2q"),
      t("faq2a")
    ],

    [
      t("faq3q"),
      t("faq3a")
    ],

    [
      t("faq4q"),
      t("faq4a")
    ],

    [
      t("faq5q"),
      t("faq5a")
    ],

    [
      t("faq6q"),
      t("faq6a")
    ]

  ];


  w.innerHTML =
    items
      .map(
        q=>`

          <div
            class="faq-item">


            <button
              class="faq-q"
              type="button">


              <span>
                ${q[0]}
              </span>


              <span>
                +
              </span>


            </button>


            <div
              class="faq-a">


              <div>
                ${q[1]}
              </div>


            </div>


          </div>

        `
      )
      .join("");


  w.querySelectorAll(
    ".faq-item"
  )
  .forEach(
    item=>{

      item
        .querySelector(
          ".faq-q"
        )
        .addEventListener(
          "click",
          ()=>{

            const was =
              item.classList.contains(
                "open"
              );


            w.querySelectorAll(
              ".faq-item"
            )
            .forEach(
              x=>{

                x.classList.remove(
                  "open"
                );


                const a =
                  x.querySelector(
                    ".faq-a"
                  );


                if(a){

                  a.style.maxHeight =
                    null;

                }

              }
            );


            if(!was){

              item.classList.add(
                "open"
              );


              const a =
                item.querySelector(
                  ".faq-a"
                );


              if(a){

                a.style.maxHeight =
                  a.scrollHeight +
                  "px";

              }

            }

          }
        );

    }
  );

}



/* =========================================================
   CART INITIALIZATION
   ========================================================= */

function initCart(){

  cartBadge();


  fillCitySelect(
    $("#coCity")
  );


  fillCartForm();


  $("#cartBtn")
    ?.addEventListener(
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


  $("#closeCart")
    ?.addEventListener(
      "click",
      closeDrawers
    );


  $("#cartOv")
    ?.addEventListener(
      "click",
      closeDrawers
    );


  renderCart();


  if(
    new URLSearchParams(
      location.search
    ).get("cart") === "1"
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

        cartBadge();

      }
    );


  $("#checkoutBtn")
    ?.addEventListener(
      "click",
      checkout
    );



  /*
   * حفظ بيانات العميل أثناء الكتابة.
   */

  [
    "#coName",
    "#coPhone",
    "#coCity",
    "#coAddr",
    "#coNotes"

  ].forEach(
    selector=>{

      document.addEventListener(
        "input",
        e=>{

          if(
            e.target.matches(
              selector
            )
          ){

            saveCartCustomer();

          }

        }
      );


      document.addEventListener(
        "change",
        e=>{

          if(
            e.target.matches(
              selector
            )
          ){

            saveCartCustomer();

          }

        }
      );

    }
  );

}



/* =========================================================
   CART RENDER
   ========================================================= */

function renderCart(){

  const c =
    getCart();


  const w =
    $("#cartItems");


  if(!w)return;


  if(!c.length){

    w.innerHTML =
      `
        <div
          class="empty"
          style="padding:2rem 0">

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



  /*
   * تنظيف أي بيانات ناقصة من السلة القديمة
   * بدون تغيير المنتجات الصحيحة.
   */

  const cleanCart =
    c.map(
      it=>({

        ...it,

        qty:
          Math.max(
            1,
            Number(
              it.qty || 1
            )
          ),

        price:
          Number(
            it.price || 0
          ),

        scent:
          it.scent || ""

      })
    );


  /*
   * لا نعرض عطرًا افتراضيًا.
   */

  w.innerHTML =
    cleanCart
      .map(
        (it,i)=>{

          const itemTotal =
            Number(it.price || 0) *
            Number(it.qty || 1);


          const productName =
            pname({
              name:it.name || "",
              nameEn:it.nameEn || ""
            });


          const scentName =
            it.scent
              ? scentTr(it.scent)
              : (
                  LANG === "ar"
                    ? "لم يتم اختيار عطر"
                    : "No scent selected"
                );


          return `

            <div
              class="citem"
              data-cart-index="${i}">


              <div class="citem-media">

                <img
                  src="${escapeAttr(it.img || "")}"
                  alt="${escapeHtml(productName)}"
                  loading="lazy">

              </div>


              <div
                class="citem-info"
                style="flex:1">


                <h5>

                  ${escapeHtml(
                    productName
                  )}

                </h5>


                <div class="cs">

                  🌸

                  ${
                    LANG === "ar"
                      ? "العطر:"
                      : "Scent:"
                  }

                  <strong>
                    ${escapeHtml(
                      scentName
                    )}
                  </strong>

                </div>


                <div class="cs">

                  ${
                    LANG === "ar"
                      ? "سعر الوحدة:"
                      : "Unit price:"
                  }

                  ${money(
                    it.price
                  )}

                </div>


                <div class="cs">

                  ${
                    LANG === "ar"
                      ? "الإجمالي:"
                      : "Item total:"
                  }

                  <strong>
                    ${money(
                      itemTotal
                    )}
                  </strong>

                </div>


                <div class="qty">


                  <button
                    class="cq-minus"
                    data-i="${i}"
                    type="button">

                    −

                  </button>


                  <b>

                    ${it.qty}

                  </b>


                  <button
                    class="cq-plus"
                    data-i="${i}"
                    type="button">

                    +

                  </button>


                </div>


              </div>


              <button
                class="rm"
                data-i="${i}"
                type="button"
                aria-label="${
                  LANG === "ar"
                    ? "حذف"
                    : "Remove"
                }">

                ✕

              </button>


            </div>

          `;

        }
      )
      .join("");


  /*
   * Delete
   */

  w.querySelectorAll(
    ".rm"
  )
  .forEach(
    b=>{

      b.addEventListener(
        "click",
        ()=>{

          const idx =
            Number(
              b.dataset.i
            );


          cleanCart.splice(
            idx,
            1
          );


          saveCart(
            cleanCart
          );


          renderCart();

          cartBadge();

        }
      );

    }
  );



  /*
   * Plus
   */

  w.querySelectorAll(
    ".cq-plus"
  )
  .forEach(
    b=>{

      b.addEventListener(
        "click",
        ()=>{

          const idx =
            Number(
              b.dataset.i
            );


          cleanCart[idx].qty =
            Number(
              cleanCart[idx].qty || 1
            ) + 1;


          saveCart(
            cleanCart
          );


          renderCart();

          cartBadge();

        }
      );

    }
  );



  /*
   * Minus
   */

  w.querySelectorAll(
    ".cq-minus"
  )
  .forEach(
    b=>{

      b.addEventListener(
        "click",
        ()=>{

          const idx =
            Number(
              b.dataset.i
            );


          cleanCart[idx].qty =
            Number(
              cleanCart[idx].qty || 1
            ) - 1;


          if(
            cleanCart[idx].qty <= 0
          ){

            cleanCart.splice(
              idx,
              1
            );

          }


          saveCart(
            cleanCart
          );


          renderCart();

          cartBadge();

        }
      );

    }
  );



  /*
   * حفظ البيانات النظيفة.
   */

  saveCart(
    cleanCart
  );


  updateTotals(
    cleanCart
  );

}



/* =========================================================
   TOTALS
   مهم:
   الشحن لا يدخل هنا نهائيًا.
   ========================================================= */

function updateTotals(c){

  const sub =
    c.reduce(
      (total,item)=>
        total +
        (
          Number(
            item.price || 0
          ) *
          Number(
            item.qty || 1
          )
        ),
      0
    );


  /*
   * إجمالي المنتجات فقط.
   * لا يوجد CFG.SHIPPING.
   */

  if(
    $("#cartSub")
  ){

    $("#cartSub")
      .textContent =
      money(sub);

  }


  if(
    $("#cartTotal")
  ){

    $("#cartTotal")
      .textContent =
      money(sub);

  }


  /*
   * لو فيه عنصر قديم خاص بالشحن داخل HTML،
   * نخليه نصًا فقط وليس قيمة.
   */

  const ship =
    $("#cartShipping");


  if(ship){

    ship.textContent =
      LANG === "ar"
        ? "🚚 الشحن: يُدفع كاش لمندوب الشحن عند الاستلام."
        : "🚚 Shipping: Paid cash to the courier upon delivery.";

  }


  /*
   * لا نعرض أبدًا:
   * الشحن: 60 ج.م
   */

  const oldShipping =
    document.querySelectorAll(
      ".shipping-price,.shipping-cost,[data-shipping-price]"
    );


  oldShipping.forEach(
    el=>{

      if(
        el.id !== "cartShipping"
      ){

        el.textContent =
          "";

      }

    }
  );

}



/* =========================================================
   CUSTOMER DATA
   ========================================================= */

function fillCartForm(){

  const u =
    getSavedUser();


  if(
    $("#coName")
  ){

    $("#coName")
      .value =
      u.name || "";

  }


  if(
    $("#coPhone")
  ){

    $("#coPhone")
      .value =
      u.phone || "";

  }


  if(
    $("#coCity")
  ){

    fillCitySelect(
      $("#coCity")
    );


    $("#coCity")
      .value =
      u.city || "";

  }


  if(
    $("#coAddr")
  ){

    $("#coAddr")
      .value =
      u.addr || "";

  }


  if(
    $("#coNotes")
  ){

    $("#coNotes")
      .value =
      u.notes || "";

  }

}



function saveCartCustomer(){

  const name =
    $("#coName")
      ?.value
      .trim() || "";


  const phone =
    $("#coPhone")
      ?.value
      .trim() || "";


  const city =
    $("#coCity")
      ?.value || "";


  const addr =
    $("#coAddr")
      ?.value
      .trim() || "";


  const notes =
    $("#coNotes")
      ?.value
      .trim() || "";


  const old =
    getSavedUser();


  const u = {

    ...old,

    name,

    phone,

    city,

    addr,

    notes,

    orders:
      old.orders || 0

  };


  localStorage.setItem(
    "vl_user",
    JSON.stringify(u)
  );


  syncAccountFields(
    u
  );

}



function saveUserFromCart(
  name,
  phone,
  city,
  addr,
  notes
){

  const old =
    getSavedUser();


  const u = {

    ...old,

    name,

    phone,

    city,

    addr,

    notes,

    orders:
      old.orders || 0

  };


  localStorage.setItem(
    "vl_user",
    JSON.stringify(u)
  );


  syncAccountFields(
    u
  );

}



function getSavedUser(){

  try{

    return JSON.parse(
      localStorage.getItem(
        "vl_user"
      ) || "{}"
    );

  }catch(e){

    return {};

  }

}



function syncAccountFields(u){

  if(
    $("#accName")
  ){

    $("#accName")
      .value =
      u.name || "";

  }


  if(
    $("#accPhone")
  ){

    $("#accPhone")
      .value =
      u.phone || "";

  }


  if(
    $("#accCity")
  ){

    fillCitySelect(
      $("#accCity")
    );


    $("#accCity")
      .value =
      u.city || "";

  }


  if(
    $("#accAddr")
  ){

    $("#accAddr")
      .value =
      u.addr || "";

  }

}



/* =========================================================
   ORDER ID
   ========================================================= */

function genOrderId(){

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


  let s = "";


  for(
    let i=0;
    i<6;
    i++
  ){

    s +=
      chars[
        Math.floor(
          Math.random() *
          chars.length
        )
      ];

  }


  return "VL-" + s;

}



/* =========================================================
   CHECKOUT
   ========================================================= */

async function checkout(){

  const c =
    getCart();


  /*
   * 1. لازم يكون فيه منتجات.
   */

  if(!c.length){

    toast(
      t("t_empty")
    );

    return;

  }



  /*
   * 2. لازم كل منتج يكون له عطر.
   */

  const missingScent =
    c.some(
      it=>
        !it.scent ||
        !String(it.scent).trim()
    );


  if(missingScent){

    toast(
      scentWarning()
    );

    return;

  }



  /*
   * 3. بيانات العميل.
   */

  const name =
    $("#coName")
      ?.value
      .trim() || "";


  const phone =
    $("#coPhone")
      ?.value
      .trim() || "";


  const city =
    $("#coCity")
      ?.value || "";


  const addr =
    $("#coAddr")
      ?.value
      .trim() || "";


  const notes =
    $("#coNotes")
      ?.value
      .trim() || "";



  /*
   * 4. البيانات الإلزامية:
   * الاسم + الموبايل + العنوان.
   */

  if(
    !name ||
    !phone ||
    !addr
  ){

    toast(
      t("t_fill")
    );


    /*
     * أول حقل ناقص يتم التركيز عليه.
     */

    if(!name){

      $("#coName")
        ?.focus();

    }else if(!phone){

      $("#coPhone")
        ?.focus();

    }else if(!addr){

      $("#coAddr")
        ?.focus();

    }


    return;

  }



  /*
   * 5. حفظ بيانات العميل.
   */

  saveUserFromCart(
    name,
    phone,
    city,
    addr,
    notes
  );



  /*
   * 6. حساب قيمة المنتجات فقط.
   *
   * لا CFG.SHIPPING
   * لا 60 جنيه
   * لا أي تكلفة شحن.
   */

  const productsTotal =
    c.reduce(
      (total,item)=>
        total +
        (
          Number(
            item.price || 0
          ) *
          Number(
            item.qty || 1
          )
        ),
      0
    );


  const total =
    productsTotal;



  /*
   * 7. إنشاء رقم الطلب.
   */

  const orderId =
    genOrderId();



  /*
   * 8. رسالة WhatsApp.
   */

  let msg = "";


  msg +=
    `${t("wa_head")}\n`;


  msg +=
    `${t("wa_order")} ${orderId}\n\n`;


  msg +=
    `━━━━━━━━━━━━━━━━━━━━\n`;



  c.forEach(
    it=>{

      const itemTotal =
        Number(
          it.price || 0
        ) *
        Number(
          it.qty || 1
        );


      const itemName =
        pname({
          name:
            it.name || "",
          nameEn:
            it.nameEn || ""
        });


      msg +=
        `${t("wa_item")} ${itemName}\n`;


      msg +=
        `${t("wa_scent")}: ${scentTr(it.scent)}\n`;


      msg +=
        `${t("wa_qty")} ${Number(it.qty||1)}\n`;


      msg +=
        `${t("wa_price")} ${money(it.price)}\n`;


      msg +=
        `${LANG==="en" ? "Item total:" : "إجمالي الصنف:"} ${money(itemTotal)}\n\n`;

    }
  );



  msg +=
    `━━━━━━━━━━━━━━━━━━━━\n`;


  /*
   * الإجمالي = المنتجات فقط.
   */

  msg +=
    `${waTotalLabel()} ${money(total)}\n`;


  /*
   * الدفع.
   */

  msg +=
    `${t("pay_products_note")}\n`;



  /*
   * InstaPay:
   *
   * لا نضع velalight@instapay.
   *
   * نقرأ فقط الحساب الصحيح إذا كان موجودًا
   * في الإعدادات باسم INSTAPAY_PHONE.
   */

  const instaPay =
    getInstaPayAccount();


  if(instaPay){

    msg +=
      `${t("wa_insta")} ${instaPay}\n`;

  }



  /*
   * الشحن كاش فقط.
   * لا قيمة مالية للشحن.
   */

  msg +=
    `${t("ship_note")}\n\n`;



  /*
   * بيانات العميل.
   */

  msg +=
    `${t("wa_name")} ${name}\n`;


  msg +=
    `${t("wa_phone")} ${phone}\n`;


  if(city){

    msg +=
      `${t("wa_city")} ${city}\n`;

  }


  msg +=
    `${t("wa_addr")} ${addr}\n`;


  if(notes){

    msg +=
      `${t("wa_notes")} ${notes}\n`;

  }



  /*
   * 9. Firestore
   *
   * نحفظ الشكل الجديد كاملًا.
   */

  const orderData = {

    orderId,

    customer:{

      name,

      phone,

      city,

      address:addr,

      notes

    },


    name,

    phone,

    city,

    address:addr,

    notes,


    products:
      c.map(
        it=>({

          id:
            it.id || "",

          name:
            it.name || "",

          nameEn:
            it.nameEn || "",

          scent:
            it.scent || "",

          scentName:
            scentTr(
              it.scent || ""
            ),

          quantity:
            Number(
              it.qty || 1
            ),

          price:
            Number(
              it.price || 0
            ),

          total:
            Number(
              it.price || 0
            ) *
            Number(
              it.qty || 1
            ),

          img:
            it.img || ""

        })
      ),


    items:
      c,


    total,

    productsTotal:


      productsTotal,


    paymentMethod:
      "InstaPay",


    shippingPayment:
      "Cash to courier",


    shippingIncluded:
      false,


    shippingCost:
      0,


    status:
      "قيد المراجعة",


    statusEn:
      "Under Review",


    createdAt:
      Date.now(),


    orderDate:
      new Date().toISOString()

  };



  /*
   * 10. حفظ الطلب قبل تفريغ السلة.
   *
   * ده مهم جدًا.
   */

  try{

    await DB.add(
      "orders",
      orderData
    );

  }catch(e){

    console.warn(
      "Order save error:",
      e
    );


    toast(
      LANG === "ar"
        ? "⚠️ حصلت مشكلة أثناء تسجيل الطلب. لم يتم تفريغ السلة."
        : "⚠️ There was a problem saving the order. Your cart was not cleared."
    );


    return;

  }



  /*
   * 11. زيادة عدد الطلبات.
   */

  const u =
    getSavedUser();


  u.orders =
    Number(
      u.orders || 0
    ) + 1;


  u.name =
    name;


  u.phone =
    phone;


  u.city =
    city;


  u.addr =
    addr;


  u.notes =
    notes;


  localStorage.setItem(
    "vl_user",
    JSON.stringify(u)
  );


  const oc =
    $("#ordCount");


  if(oc){

    oc.textContent =
      u.orders;

  }



  /*
   * 12. تفريغ السلة بعد نجاح Firestore.
   */

  saveCart([]);

  renderCart();

  cartBadge();



  /*
   * 13. رسالة نجاح.
   */

  toast(
    t("t_order")
  );



  /*
   * 14. WhatsApp.
   */

  const whatsapp =
    getWhatsAppNumber();


  if(!whatsapp){

    console.warn(
      "WhatsApp number is not configured."
    );

    return;

  }


  const wa =
    "https://wa.me/" +
    whatsapp +
    "?text=" +
    encodeURIComponent(msg);


  window.open(
    wa,
    "_blank",
    "noopener"
  );

}



/* =========================================================
   INSTA PAY ACCOUNT
   ========================================================= */

function getInstaPayAccount(){

  /*
   * الأولوية للرقم الصحيح الجديد:
   * CFG.INSTAPAY_PHONE
   *
   * لو مش موجود، نبحث عن INSTAPAY.
   *
   * لكن نرفض القيمة القديمة المعروفة:
   * velalight@instapay
   */

  try{

    const phone =
      CFG?.INSTAPAY_PHONE;


    if(
      phone &&
      String(phone).trim()
    ){

      return String(
        phone
      ).trim();

    }


    const configured =
      CFG?.INSTAPAY;


    if(
      configured &&
      String(
        configured
      ).trim() &&
      String(
        configured
      ).trim().toLowerCase() !==
      "velalight@instapay"
    ){

      return String(
        configured
      ).trim();

    }

  }catch(e){}


  /*
   * لا نرسل الحساب القديم.
   */

  return "";

}



/* =========================================================
   WHATSAPP NUMBER
   ========================================================= */

function getWhatsAppNumber(){

  try{

    if(
      CFG &&
      CFG.WHATSAPP
    ){

      return String(
        CFG.WHATSAPP
      )
      .replace(
        /[^0-9]/g,
        ""
      );

    }

  }catch(e){}


  return "";

}



/* =========================================================
   ACCOUNT
   ========================================================= */

function initAccount(){

  fillCitySelect(
    $("#accCity")
  );


  const u =
    getSavedUser();


  if(
    $("#accName")
  ){

    $("#accName")
      .value =
      u.name || "";

  }


  if(
    $("#accPhone")
  ){

    $("#accPhone")
      .value =
      u.phone || "";

  }


  if(
    $("#accCity")
  ){

    $("#accCity")
      .value =
      u.city || "";

  }


  if(
    $("#accAddr")
  ){

    $("#accAddr")
      .value =
      u.addr || "";

  }


  if(
    $("#ordCount")
  ){

    $("#ordCount")
      .textContent =
      u.orders || 0;

  }



  $("#accBtn")
    ?.addEventListener(
      "click",
      ()=>{

        openDrawer(
          "accOv"
        );

      }
    );


  $("#closeAcc")
    ?.addEventListener(
      "click",
      ()=>closeModal(
        "accOv"
      )
    );


  $("#accOv")
    ?.addEventListener(
      "click",
      e=>{

        if(
          e.target.id ===
          "accOv"
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

        const name =
          $("#accName")
            ?.value
            .trim() || "";


        const phone =
          $("#accPhone")
            ?.value
            .trim() || "";


        const city =
          $("#accCity")
            ?.value || "";


        const addr =
          $("#accAddr")
            ?.value
            .trim() || "";


        if(
          !name ||
          !phone
        ){

          toast(
            t("t_fill")
          );

          return;

        }


        const old =
          getSavedUser();


        const u = {

          ...old,

          name,

          phone,

          city,

          addr,

          notes:
            old.notes || "",

          orders:
            old.orders || 0

        };


        localStorage.setItem(
          "vl_user",
          JSON.stringify(u)
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


        if(
          $("#accName")
        ){

          $("#accName").value =
            "";

        }


        if(
          $("#accPhone")
        ){

          $("#accPhone").value =
            "";

        }


        if(
          $("#accAddr")
        ){

          $("#accAddr").value =
            "";

        }


        if(
          $("#ordCount")
        ){

          $("#ordCount")
            .textContent =
            "0";

        }


        toast(
          t("t_saved")
        );

      }
    );

}



function fillCitySelect(sel){

  if(!sel)return;


  const arr =
    LANG === "en"
      ? GOVS_EN
      : GOVS;


  sel.innerHTML =
    `
      <option value="">
        ${t("ph_city")}
      </option>
    ` +
    arr
      .map(
        g=>
          `
            <option value="${escapeAttr(g)}">
              ${escapeHtml(g)}
            </option>
          `
      )
      .join("");

}



/* =========================================================
   SEARCH
   ========================================================= */

function initSearch(){

  $("#searchBtn")
    ?.addEventListener(
      "click",
      ()=>{

        openDrawer(
          "searchOv"
        );


        setTimeout(
          ()=>
            $("#searchInput")
              ?.focus(),
          200
        );

      }
    );


  $("#closeSearch")
    ?.addEventListener(
      "click",
      ()=>closeModal(
        "searchOv"
      )
    );


  $("#searchOv")
    ?.addEventListener(
      "click",
      e=>{

        if(
          e.target.id ===
          "searchOv"
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

        const q =
          e.target.value
            .trim()
            .toLowerCase();


        const w =
          $("#searchResults");


        if(!w)return;


        if(!q){

          w.innerHTML =
            "";

          return;

        }


        const res =
          ALL_PRODUCTS
            .filter(
              p=>{

                const hay =
                  (
                    p.name +
                    " " +
                    (
                      p.nameEn ||
                      ""
                    ) +
                    " " +
                    (
                      p.desc ||
                      ""
                    ) +
                    " " +
                    (
                      p.descEn ||
                      ""
                    ) +
                    " " +
                    cat(p.cat)
                  )
                  .toLowerCase();


                return hay.includes(
                  q
                );

              }
            )
            .slice(0,8);


        w.innerHTML =
          res
            .map(
              p=>`

                <div
                  class="sr-item"
                  data-id="${escapeAttr(p.id)}">


                  <img
                    src="${escapeAttr(imgOf(p))}"
                    alt="${escapeHtml(pname(p))}">


                  <div>

                    <b>
                      ${escapeHtml(
                        pname(p)
                      )}
                    </b>


                    <br>


                    <small>
                      ${money(p.price)}
                    </small>

                  </div>


                </div>

              `
            )
            .join("");


        w.querySelectorAll(
          ".sr-item"
        )
        .forEach(
          it=>{

            it.addEventListener(
              "click",
              ()=>{

                location.href =
                  "product.html?p=" +
                  encodeURIComponent(
                    it.dataset.id
                  );

              }
            );

          }
        );

      }
    );

}



/* =========================================================
   CHAT
   ========================================================= */

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


  const quick = [

    [
      t("q_gift"),
      "a_gift"
    ],

    [
      t("q_relax"),
      "a_relax"
    ],

    [
      t("q_scents"),
      "a_scents"
    ],

    [
      t("q_ship"),
      "a_ship"
    ],

    [
      t("q_bride"),
      "a_bride"
    ]

  ];


  const qw =
    $("#chatQuick");


  if(qw){

    qw.innerHTML =
      quick
        .map(
          q=>`

            <button
              data-a="${q[1]}"
              type="button">

              ${q[0]}

            </button>

          `
        )
        .join("");


    qw.querySelectorAll(
      "button"
    )
    .forEach(
      b=>{

        b.addEventListener(
          "click",
          ()=>{

            addMsg(
              b.textContent,
              "user"
            );


            setTimeout(
              ()=>
                addMsg(
                  t(
                    b.dataset.a
                  ),
                  "bot"
                ),
              400
            );

          }
        );

      }
    );

  }

}



function initChatWelcome(){

  const w =
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

  const w =
    $("#chatMsgs");


  if(!w)return;


  const d =
    document.createElement(
      "div"
    );


  d.className =
    "msg " +
    who;


  d.textContent =
    txt;


  w.appendChild(
    d
  );


  w.scrollTop =
    w.scrollHeight;

}



/* =========================================================
   NAVIGATION
   ========================================================= */

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
    .forEach(
      a=>{

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

      }
    );


  $$("[data-cat]")
    .forEach(
      a=>{

        if(
          a.closest(".mnav") ||
          a.closest(".mainnav") ||
          a.closest("footer")
        ){

          a.addEventListener(
            "click",
            ()=>{

              setTimeout(
                ()=>{

                  const chip =
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

      }
    );

}



/* =========================================================
   DRAWERS / MODALS
   ========================================================= */

function openDrawer(
  id,
  ovlId
){

  $("#" + id)
    ?.classList
    .add("open");


  if(ovlId){

    $("#" + ovlId)
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

  $("#" + id)
    ?.classList
    .remove("open");

}



/* =========================================================
   HELPERS
   ========================================================= */

function scentWarning(){

  return (
    t("t_scentwarn") ||
    (
      LANG === "ar"
        ? "🌸 من فضلك اختاري العطر أولًا"
        : "🌸 Please choose a scent first"
    )
  );

}



function escapeHtml(value){

  return String(
    value ?? ""
  )
  .replaceAll(
    "&",
    "&amp;"
  )
  .replaceAll(
    "<",
    "&lt;"
  )
  .replaceAll(
    ">",
    "&gt;"
  )
  .replaceAll(
    '"',
    "&quot;"
  )
  .replaceAll(
    "'",
    "&#039;"
  );

}



function escapeAttr(value){

  return escapeHtml(
    value
  );

}



})();
