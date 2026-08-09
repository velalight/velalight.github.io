(function(){
"use strict";

/* ═══════ حالة إضافة سريعة (اختيار العطر) ═══════ */
let quickAddProduct=null,
    quickAddScent="",
    quickAddQty=1;

/* ═══════ تهيئة الصفحة ═══════ */
document.addEventListener("DOMContentLoaded",()=>{
  initLang();
  initMarquee();
  initEmbers();
  initHeroSlider();
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
});

window.addEventListener("data-refresh",()=>{
  renderProducts();
});

/* ═══════ اللغة ═══════ */

function initLang(){
  const btn=$("#langBtn");
  if(!btn)return;

  updateLangBtn();

  btn.addEventListener("click",()=>{
    LANG=LANG==="ar"?"en":"ar";

    localStorage.setItem("vl_lang",LANG);

    document.documentElement.dir=
      LANG==="ar"?"rtl":"ltr";

    document.documentElement.lang=LANG;

    applyI18n();
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
    el.textContent=t(el.dataset.i18n);
  });

  $$("[data-i18n-ph]").forEach(el=>{
    el.placeholder=t(el.dataset.i18nPh);
  });

  const mq=$("#mqTrack");

  if(mq){
    const txt=t("mq");

    mq.innerHTML=
      `<span>${txt}</span><span>${txt}</span>`;
  }
}

/* ═══════ الشريط المتحرك ═══════ */

function initMarquee(){}

/* ═══════ شرارات الهيرو ═══════ */

function initEmbers(){
  const w=$("#embers");

  if(!w)return;

  for(let i=0;i<12;i++){

    const s=document.createElement("span");

    s.style.left=
      Math.random()*100+"%";

    s.style.animationDelay=
      Math.random()*7+"s";

    s.style.animationDuration=
      (5+Math.random()*5)+"s";

    w.appendChild(s);
  }
}

/* ═══════ HERO SLIDER ═══════ */

function initHeroSlider(){

  const hero=
    document.querySelector(".hero");

  if(!hero)return;

  /*
    الصور مأخوذة من صور المنتجات الموجودة
    داخل الموقع نفسه.
  */

  const images=[
    "RR.jpg",
    "heart2.jpg",
    "candle1.jpg",
    "iccoffe1.jpg",
    "mandle.jpg",
    "gift1.jpg",
    "candle13.jpg",
    "candle14.jpg",
    "candle9.jpg",
    "candle10.jpg"
  ];

  /*
    نحاول العثور على عنصر الصورة
    الموجود أصلًا داخل الهيرو.
  */

  const frame=
    hero.querySelector(".frame");

  if(!frame)return;

  const oldImg=
    frame.querySelector("img");

  /*
    نخلي الـHero نفسه يحتوي على
    صورة واحدة فقط.
  */

  frame.innerHTML="";

  const slider=
    document.createElement("div");

  slider.className="hero-slider";

  const slides=[];

  images.forEach((src,index)=>{

    const slide=
      document.createElement("div");

    slide.className=
      "hero-slide"+
      (index===0?" active":"");

    const img=
      document.createElement("img");

    img.src=src;

    img.alt=
      LANG==="ar"
      ?"VelaLight"
      :"VelaLight Candles";

    img.loading=
      index===0
      ?"eager"
      :"lazy";

    slide.appendChild(img);

    slider.appendChild(slide);

    slides.push(slide);
  });

  frame.appendChild(slider);

  /*
    نقاط التنقل
  */

  const dots=
    document.createElement("div");

  dots.className=
    "hero-dots";

  images.forEach((_,index)=>{

    const dot=
      document.createElement("button");

    dot.type="button";

    dot.className=
      "hero-dot"+
      (index===0?" active":"");

    dot.setAttribute(
      "aria-label",
      `Slide ${index+1}`
    );

    dot.addEventListener(
      "click",
      ()=>{
        showHeroSlide(index);
        restartHeroTimer();
      }
    );

    dots.appendChild(dot);
  });

  frame.appendChild(dots);

  let current=0;
  let timer=null;
  let paused=false;

  function showHeroSlide(index){

    if(!slides.length)return;

    current=
      (index+slides.length)
      %slides.length;

    slides.forEach((slide,i)=>{

      slide.classList.toggle(
        "active",
        i===current
      );
    });

    dots
      .querySelectorAll(".hero-dot")
      .forEach((dot,i)=>{

        dot.classList.toggle(
          "active",
          i===current
        );

      });
  }

  function startHeroTimer(){

    clearInterval(timer);

    timer=setInterval(()=>{

      if(paused)return;

      showHeroSlide(
        current+1
      );

    },3800);
  }

  function restartHeroTimer(){

    clearInterval(timer);

    startHeroTimer();
  }

  /*
    إيقاف الحركة أثناء وضع الماوس
    على الصورة.
  */

  frame.addEventListener(
    "mouseenter",
    ()=>{
      paused=true;
    }
  );

  frame.addEventListener(
    "mouseleave",
    ()=>{
      paused=false;
    }
  );

  /*
    دعم اللمس على الموبايل:
    Swipe يمين/شمال
  */

  let touchStartX=0;
  let touchEndX=0;

  frame.addEventListener(
    "touchstart",
    e=>{
      if(!e.touches.length)return;

      touchStartX=
        e.touches[0].clientX;
    },
    {passive:true}
  );

  frame.addEventListener(
    "touchend",
    e=>{

      if(!e.changedTouches.length)return;

      touchEndX=
        e.changedTouches[0].clientX;

      const diff=
        touchEndX-touchStartX;

      if(Math.abs(diff)<40)return;

      if(diff<0){
        showHeroSlide(
          current+1
        );
      }else{
        showHeroSlide(
          current-1
        );
      }

      restartHeroTimer();

    },
    {passive:true}
  );

  startHeroTimer();
}

/* ═══════ ظهور العناصر ═══════ */

function initReveal(){

  const io=
    new IntersectionObserver(
      es=>es.forEach(e=>{

        if(e.isIntersecting){

          e.target.classList.add("on");

          io.unobserve(e.target);
        }

      }),
      {
        threshold:.12
      }
    );

  $$(".rv").forEach(el=>{
    io.observe(el);
  });
}

/* ═══════ التصنيفات ═══════ */

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
    keys.map(k=>
      `<button class="chip${
        k==="all"?" on":""
      }"
      data-cat="${k}">
      ${cat(k)}
      </button>`
    ).join("");

  w.querySelectorAll(".chip")
    .forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          w.querySelectorAll(".chip")
            .forEach(x=>
              x.classList.remove("on")
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

/* ═══════ المنتجات ═══════ */

function renderProducts(){

  const w=
    $("#productsGrid");

  if(!w)return;

  const catKey=
    activeCat();

  let list=
    ALL_PRODUCTS||[];

  if(catKey!=="all"){

    list=
      list.filter(
        p=>p.cat===catKey
      );

  }

  if(!list.length){

    w.innerHTML=
      `<div class="empty">
        ${t("no_products")}
      </div>`;

    return;
  }

  w.innerHTML=
    list.map(
      productCard
    ).join("");

  w.querySelectorAll(
    "[data-add]"
  ).forEach(btn=>{

    btn.addEventListener(
      "click",
      ()=>{

        const id=
          btn.dataset.add;

        const p=
          ALL_PRODUCTS.find(
            x=>String(x.id)===String(id)
          );

        if(p){
          openQuickAdd(p);
        }

      }
    );

  });

  w.querySelectorAll(
    "[data-product]"
  ).forEach(card=>{

    card.addEventListener(
      "click",
      e=>{

        if(
          e.target.closest("[data-add]")
        )return;

        const id=
          card.dataset.product;

        location.href=
          `product.html?id=${encodeURIComponent(id)}`;

      }
    );

  });
}

/* ═══════ كارت المنتج ═══════ */

function productCard(p){

  const img=
    typeof imgOf==="function"
    ?imgOf(p)
    :"";

  const price=
    money(p.price);

  const old=
    p.old>p.price
    ?money(p.old)
    :"";

  return `
    <article
      class="product-card rv"
      data-product="${p.id}"
    >

      <div class="product-image">

        <img
          src="${img}"
          alt="${
            LANG==="ar"
            ?p.name
            :p.nameEn
          }"
          loading="lazy"
        >

        ${
          p.badge
          ?
          `<span class="badge">
            ${
              LANG==="ar"
              ?p.badge
              :p.badgeEn||p.badge
            }
          </span>`
          :""
        }

      </div>

      <div class="product-info">

        <h3>
          ${
            LANG==="ar"
            ?p.name
            :p.nameEn
          }
        </h3>

        <div class="product-price">

          <b>${price}</b>

          ${
            old
            ?
            `<del>${old}</del>`
            :""
          }

        </div>

        <button
          class="btn"
          type="button"
          data-add="${p.id}"
        >
          ${t("cta_add")}
        </button>

      </div>

    </article>
  `;
}

/* ═══════ العطور ═══════ */

function renderScents(){

  const w=
    $("#scentsGrid");

  if(!w)return;

  const list=
    typeof SCENTS!=="undefined"
    ?SCENTS
    :[];

  w.innerHTML=
    list.map(
      s=>{

        const ar=
          Array.isArray(s)
          ?s[0]
          :s;

        const en=
          Array.isArray(s)
          ?s[1]
          :s;

        return `
          <div class="scent-item">
            ${
              LANG==="ar"
              ?ar
              :en
            }
          </div>
        `;

      }
    ).join("");
}

/* ═══════ الأسئلة الشائعة ═══════ */

function renderFAQ(){

  const w=
    $("#faq");

  if(!w)return;

  if(typeof FAQ==="undefined")return;

  w.innerHTML=
    FAQ.map(
      item=>`

        <details class="faq-item">

          <summary>
            ${
              LANG==="ar"
              ?item.q
              :item.qEn
            }
          </summary>

          <div>
            ${
              LANG==="ar"
              ?item.a
              :item.aEn
            }
          </div>

        </details>

      `
    ).join("");
}

/* ═══════ الإضافة السريعة ═══════ */

function initQuickAdd(){

  const modal=
    $("#quickAddModal");

  if(!modal)return;

  const close=
    modal.querySelector(
      "[data-close]"
    );

  if(close){

    close.addEventListener(
      "click",
      closeQuickAdd
    );

  }

  modal.addEventListener(
    "click",
    e=>{

      if(e.target===modal){
        closeQuickAdd();
      }

    }
  );
}

function openQuickAdd(p){

  quickAddProduct=p;
  quickAddScent="";
  quickAddQty=1;

  const modal=
    $("#quickAddModal");

  if(!modal)return;

  const title=
    modal.querySelector(
      "[data-qa-title]"
    );

  if(title){

    title.textContent=
      LANG==="ar"
      ?p.name
      :p.nameEn;

  }

  const scents=
    modal.querySelector(
      "[data-qa-scents]"
    );

  if(scents){

    const list=
      typeof SCENTS!=="undefined"
      ?SCENTS
      :[];

    scents.innerHTML=
      list.map(
        s=>{

          const ar=
            Array.isArray(s)
            ?s[0]
            :s;

          const en=
            Array.isArray(s)
            ?s[1]
            :s;

          return `
            <button
              type="button"
              class="scent-option"
              data-scent="${ar}"
            >
              ${
                LANG==="ar"
                ?ar
                :en
              }
            </button>
          `;

        }
      ).join("");

    scents
      .querySelectorAll(
        "[data-scent]"
      )
      .forEach(btn=>{

        btn.addEventListener(
          "click",
          ()=>{

            scents
              .querySelectorAll(
                ".scent-option"
              )
              .forEach(x=>
                x.classList.remove("on")
              );

            btn.classList.add("on");

            quickAddScent=
              btn.dataset.scent;

          }
        );

      });

  }

  modal.classList.add("open");
}

function closeQuickAdd(){

  const modal=
    $("#quickAddModal");

  if(modal){
    modal.classList.remove("open");
  }

  quickAddProduct=null;
  quickAddScent="";
  quickAddQty=1;
}

/* ═══════ البحث ═══════ */

function initSearch(){

  const input=
    $("#searchInput");

  if(!input)return;

  input.addEventListener(
    "input",
    ()=>{

      const q=
        input.value
          .trim()
          .toLowerCase();

      if(!q){

        renderProducts();

        return;
      }

      const w=
        $("#productsGrid");

      if(!w)return;

      const list=
        (ALL_PRODUCTS||[])
        .filter(p=>{

          const ar=
            String(p.name||"")
              .toLowerCase();

          const en=
            String(p.nameEn||"")
              .toLowerCase();

          return(
            ar.includes(q)||
            en.includes(q)
          );

        });

      w.innerHTML=
        list.map(
          productCard
        ).join("");

    }
  );
}

/* ═══════ القائمة ═══════ */

function initNav(){

  const btn=
    $("#menuBtn");

  const nav=
    $("#mobileNav");

  if(!btn||!nav)return;

  btn.addEventListener(
    "click",
    ()=>{
      nav.classList.toggle("open");
    }
  );

  nav.querySelectorAll("a")
    .forEach(a=>{

      a.addEventListener(
        "click",
        ()=>{
          nav.classList.remove("open");
        }
      );

    });
}

/* ═══════ باقي وظائف الموقع ═══════ */

/*
  يتم الاعتماد هنا على الدوال الموجودة
  أصلًا في ملفات المشروع:
  
  initCart
  initAccount
  initChat
  loadAll
  fillCitySelect
  fillCartForm
  toast
  track
  money
  imgOf
  cat
  t
  $
  $$
  ALL_PRODUCTS
  SCENTS
  LANG
  FAQ

  وعدم إعادة تعريفها هنا مهم حتى لا
  يحصل تعارض مع data.js / ملفات المشروع.
*/

})();
