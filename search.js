/* ═══════════════════════════════════════════════════════════
   SEARCH — البحث داخل الموقع
   
   - بيضيف زر البحث في الهيدر أوتوماتيك
   - بيدور بالاسم/النوع/الوصف
   - ترتيب: الأكثر صلة، الأرخص، الأغلى، الأكثر مبيعًا، أكبر خصم
   - مش بيتأثر بالمنتجات المثبتة (بحث طبيعي)
   - شغال على الموبايل والكمبيوتر
   ═══════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var SORTS = {
    "relevance": "الأكثر صلة",
    "price-asc": "الأرخص",
    "price-desc": "الأغلى",
    "best": "الأكثر مبيعاً",
    "discount": "أكبر خصم"
  };

  var currentSort = "relevance";
  var input, resultsBox, modal, debounceTimer;

  /* ═══ أدوات مساعدة ═══ */
  function escapeHtml(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c];
    });
  }

  function getProducts(){
    if(typeof ALL_PRODUCTS !== "undefined" && Array.isArray(ALL_PRODUCTS) && ALL_PRODUCTS.length){
      return ALL_PRODUCTS.filter(function(p){ return p && p.id && p.active !== false; });
    }
    if(typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)){
      return PRODUCTS.filter(function(p){ return p && p.id && p.active !== false; });
    }
    return [];
  }

  function getCat(p){
    if(typeof cat === "function"){ try { return cat(p.cat) || ""; } catch(e){} }
    return p.cat || "";
  }

  function getName(p){
    if(typeof pname === "function"){ try { return pname(p) || p.name || ""; } catch(e){} }
    return p.name || "";
  }

  function getMoney(v){
    if(typeof money === "function"){ try { return money(v); } catch(e){} }
    return String(v) + " ج.م";
  }

  function getImage(p){
    try {
      if(typeof imgOf === "function") return imgOf(p);
    } catch(e){}
    if(Array.isArray(p.imgs) && p.imgs.length){
      var first = p.imgs[0];
      if(typeof CDN === "function") return CDN(first);
      return first;
    }
    return p.img || "";
  }

  /* ═══ البحث ═══ */
  function matches(p, q){
    if(!q) return true;
    var fields = [
      p.name, p.nameEn, p.desc, p.descEn, p.cat, getCat(p)
    ];
    for(var i = 0; i < fields.length; i++){
      var f = String(fields[i] || "").toLowerCase();
      if(f.indexOf(q) !== -1) return true;
    }
    return false;
  }

  function score(p, q){
    var s = 0;
    var name = String(p.name || "").toLowerCase();
    var nameEn = String(p.nameEn || "").toLowerCase();
    if(name === q || nameEn === q) s += 200;
    if(name.indexOf(q) === 0 || nameEn.indexOf(q) === 0) s += 100;
    if(name.indexOf(q) !== -1 || nameEn.indexOf(q) !== -1) s += 50;
    if(String(getCat(p)).toLowerCase().indexOf(q) !== -1) s += 30;
    if(String(p.desc || "").toLowerCase().indexOf(q) !== -1) s += 10;
    if(String(p.descEn || "").toLowerCase().indexOf(q) !== -1) s += 10;
    return s;
  }

  function sortList(list, sortBy){
    var arr = list.slice();
    switch(sortBy){
      case "price-asc":
        arr.sort(function(a,b){ return Number(a.price || 0) - Number(b.price || 0); });
        break;
      case "price-desc":
        arr.sort(function(a,b){ return Number(b.price || 0) - Number(a.price || 0); });
        break;
      case "best":
        arr.sort(function(a,b){ return Number(b.sold || 0) - Number(a.sold || 0); });
        break;
      case "discount":
        arr.sort(function(a,b){
          var da = a.old > a.price ? (a.old - a.price) / a.old : 0;
          var db = b.old > b.price ? (b.old - b.price) / b.old : 0;
          return db - da;
        });
        break;
    }
    return arr;
  }

  /* ═══ عرض كارت المنتج ═══ */
  function renderCard(p){
    var name = getName(p);
    var cat = getCat(p);
    var price = Number(p.price || 0);
    var old = Number(p.old || 0);
    var hasDisc = old > price;
    var img = getImage(p);
    var id = String(p.id || "");
    var disc = hasDisc ? '<span class="vl-search-disc">−' + Math.round((old - price) / old * 100) + '%</span>' : '';
    var oldPrice = hasDisc ? '<del>' + escapeHtml(getMoney(old)) + '</del>' : '';

    return '' +
      '<div class="vl-search-card" data-id="' + escapeHtml(id) + '" role="button" tabindex="0">' +
        '<div class="vl-search-card-img">' +
          '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(name) + '" loading="lazy" decoding="async" onerror="this.style.opacity=0">' +
          disc +
        '</div>' +
        '<div class="vl-search-card-info">' +
          '<span class="vl-search-card-cat">' + escapeHtml(cat) + '</span>' +
          '<strong class="vl-search-card-name">' + escapeHtml(name) + '</strong>' +
          '<div class="vl-search-card-price"><b>' + escapeHtml(getMoney(price)) + '</b>' + oldPrice + '</div>' +
        '</div>' +
      '</div>';
  }

  /* ═══ تنفيذ البحث ═══ */
  function perform(){
    if(!resultsBox) return;
    var products = getProducts();

    if(!products.length){
      resultsBox.innerHTML = '<div class="vl-search-empty"><p>⏳ جاري التحميل...</p></div>';
      setTimeout(perform, 500);
      return;
    }

    var q = String(input.value || "").trim().toLowerCase();
    var list;

    if(!q){
      /* مفيش كلمة بحث — نعرض المنتجات حسب الترتيب المختار فقط */
      /* بدون أي منطق للتثبيت */
      list = sortList(products, currentSort).slice(0, 15);
    } else {
      var filtered = products.filter(function(p){ return matches(p, q); });

      if(currentSort === "relevance"){
        list = filtered
          .map(function(p){ return { p: p, s: score(p, q) }; })
          .sort(function(a,b){ return b.s - a.s; })
          .map(function(x){ return x.p; })
          .slice(0, 30);
      } else {
        list = sortList(filtered, currentSort).slice(0, 30);
      }
    }

    if(!list.length){
      resultsBox.innerHTML =
        '<div class="vl-search-empty">' +
          '<div style="font-size:2.5rem;margin-bottom:.5rem">🕯️</div>' +
          '<p>مفيش نتائج لـ "' + escapeHtml(input.value) + '"</p>' +
        '</div>';
      return;
    }

    var html = '';
    for(var i = 0; i < list.length; i++){
      html += renderCard(list[i]);
    }
    resultsBox.innerHTML = html;

    /* ربط النقر */
    var cards = resultsBox.querySelectorAll(".vl-search-card");
    for(var j = 0; j < cards.length; j++){
      (function(card){
        card.addEventListener("click", function(){
          var id = card.getAttribute("data-id");
          if(id) window.location.href = "product.html?p=" + encodeURIComponent(id);
        });
        card.addEventListener("keydown", function(e){
          if(e.key === "Enter" || e.key === " "){
            e.preventDefault();
            card.click();
          }
        });
      })(cards[j]);
    }

    /* إرسال event لجوجل أناليتكس */
    if(q && typeof window.gtag === "function"){
      try {
        window.gtag("event", "search", {
          search_term: q,
          results_count: list.length
        });
      } catch(e){}
    }
  }

  function onInput(){
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(perform, 150);
  }

  /* ═══ فتح / إغلاق ═══ */
  function openModal(){
    if(!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(function(){ if(input) input.focus(); }, 80);
    perform();
  }

  function closeModal(){
    if(!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if(input) input.value = "";
  }

  /* ═══ حقن زر البحث في الهيدر ═══ */
  function injectButton(){
    if(document.getElementById("vlSearchBtn")) return;

    var hact = document.querySelector(".hact");
    if(!hact) return;

    var btn = document.createElement("button");
    btn.className = "icobtn search-btn";
    btn.id = "vlSearchBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "بحث");
    btn.innerHTML = '<span aria-hidden="true">🔍</span>';

    /* نحطه قبل أول أيقونة في المجموعة (جنب حسابي/السلة) */
    var first = hact.firstElementChild;
    if(first && first.nextSibling){
      hact.insertBefore(btn, first.nextSibling);
    } else {
      hact.appendChild(btn);
    }

    btn.addEventListener("click", openModal);
  }

  /* ═══ حقن المودال ═══ */
  function injectModal(){
    if(document.getElementById("vlSearchModal")) return;

    var chips = Object.keys(SORTS).map(function(k){
      var on = k === "relevance" ? " on" : "";
      return '<button class="vl-search-chip' + on + '" data-sort="' + k + '" type="button">' + SORTS[k] + '</button>';
    }).join("");

    modal = document.createElement("div");
    modal.className = "vl-search-modal";
    modal.id = "vlSearchModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML =
      '<div class="vl-search-box" role="document">' +
        '<div class="vl-search-head">' +
          '<span class="vl-search-icon" aria-hidden="true">🔍</span>' +
          '<input type="search" class="vl-search-input" id="vlSearchInput" placeholder="ابحث عن شمعة..." autocomplete="off" aria-label="بحث">' +
          '<button class="vl-search-close" id="vlSearchClose" type="button" aria-label="إغلاق">✕</button>' +
        '</div>' +
        '<div class="vl-search-chips">' + chips + '</div>' +
        '<div class="vl-search-results" id="vlSearchResults" aria-live="polite"></div>' +
      '</div>';

    document.body.appendChild(modal);

    input = modal.querySelector("#vlSearchInput");
    resultsBox = modal.querySelector("#vlSearchResults");

    /* إغلاق */
    modal.addEventListener("click", function(e){
      if(e.target === modal) closeModal();
    });
    modal.querySelector("#vlSearchClose").addEventListener("click", closeModal);

    /* كتابة */
    input.addEventListener("input", onInput);

    /* شرائح الترتيب */
    modal.querySelectorAll(".vl-search-chip").forEach(function(chip){
      chip.addEventListener("click", function(){
        modal.querySelectorAll(".vl-search-chip").forEach(function(c){ c.classList.remove("on"); });
        chip.classList.add("on");
        currentSort = chip.getAttribute("data-sort") || "relevance";
        perform();
      });
    });

    /* ESC */
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    /* رسالة البداية */
    resultsBox.innerHTML = '<div class="vl-search-empty"><p>✨ اكتب اسم المنتج أو نوعه</p></div>';
  }

  /* ═══ بدء ═══ */
  function init(){
    injectButton();
    injectModal();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 150);
  }
})();