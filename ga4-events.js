/* ═══════════════════════════════════════════════════════════
   GA4 EVENTS — تتبع أحداث Google Analytics 4 (v2 - محسّن)
   ملف مستقل، بيعتمد على gtag() الموجودة في الصفحة

   التعديلات:
   - إزالة bindSearch (search.js الجديد بيسجل search بنفسه)
   - إضافة listener لـ data-refresh لتسريع view_item/view_item_list
   - إضافة retry لـ firePromotions
   - استخدام window.ALL_PRODUCTS كـ fallback
   ═══════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  /* ✅ helper آمن — ما يكسرش الموقع لو gtag مش موجود */
  function ga4(name, params){
    try {
      if(typeof window.gtag === "function"){
        window.gtag("event", name, params || {});
      }
    } catch(e){}
  }

  /* ✅ [تعديل] — قراءة المنتجات من المصدر المتاح دايمًا */
  function getProducts(){
    try {
      if(typeof ALL_PRODUCTS !== "undefined" && Array.isArray(ALL_PRODUCTS) && ALL_PRODUCTS.length){
        return ALL_PRODUCTS;
      }
    } catch(e){}
    try {
      if(window.ALL_PRODUCTS && Array.isArray(window.ALL_PRODUCTS) && window.ALL_PRODUCTS.length){
        return window.ALL_PRODUCTS;
      }
    } catch(e){}
    try {
      if(typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)){
        return PRODUCTS;
      }
    } catch(e){}
    return [];
  }

  /* ✅ تحويل cart items لصيغة GA4 */
  function toGa4Items(cartItems){
    return (cartItems || []).map(function(it){
      return {
        item_id: String(it.id || ""),
        item_name: it.name || "",
        price: Number(it.price || 0),
        quantity: Number(it.qty || 1)
      };
    });
  }

  /* ✅ product → ga4 item */
  function productToGa4Item(p){
    if(!p) return null;
    return {
      item_id: String(p.id || ""),
      item_name: p.name || "",
      item_category: p.cat || "",
      price: Number(p.price || 0),
      quantity: 1
    };
  }

  /* ═══════════════════════════════════════════════════════════
     1) view_item — على product.html
     ═══════════════════════════════════════════════════════════ */
  let viewItemFired = false;
  function fireViewItem(){
    if(viewItemFired) return true;
    if(!window.location.pathname.includes("product.html")) return true;
    const pid = new URLSearchParams(window.location.search).get("p");
    if(!pid) return true;

    const products = getProducts();
    if(!products.length) return false;

    const p = products.find(function(x){ return String(x.id) === String(pid); });
    if(p){
      ga4("view_item", {
        currency: "EGP",
        value: Number(p.price || 0),
        items: [productToGa4Item(p)]
      });
    }
    viewItemFired = true;
    return true;
  }

  /* ═══════════════════════════════════════════════════════════
     2) view_item_list — على products.html
     ═══════════════════════════════════════════════════════════ */
  let itemListFired = false;
  function fireViewItemList(){
    if(itemListFired) return true;
    if(!window.location.pathname.includes("products.html")) return true;

    const products = getProducts();
    if(!products.length) return false;

    itemListFired = true;
    ga4("view_item_list", {
      item_list_id: "products_page",
      item_list_name: "All Products",
      items: products.slice(0, 20).map(productToGa4Item).filter(Boolean)
    });
    return true;
  }

  /* ═══════════════════════════════════════════════════════════
     3) add_to_cart — نلف addToCart
     ═══════════════════════════════════════════════════════════ */
  function wrapAddToCart(){
    if(typeof window.addToCart !== "function") return false;
    if(window.addToCart.__ga4Wrapped) return true;

    const original = window.addToCart;
    const wrapped = function(product, options){
      const result = original.apply(this, arguments);
      try {
        if(product && product.id){
          const qty = Number((options && options.qty) || 1);
          ga4("add_to_cart", {
            currency: "EGP",
            value: Number(product.price || 0) * qty,
            items: [{
              item_id: String(product.id),
              item_name: product.name || "",
              item_category: product.cat || "",
              item_variant: (options && options.scent) || "",
              price: Number(product.price || 0),
              quantity: qty
            }]
          });
        }
      } catch(e){}
      return result;
    };
    wrapped.__ga4Wrapped = true;
    window.addToCart = wrapped;
    return true;
  }

  /* ═══════════════════════════════════════════════════════════
     4) remove_from_cart — listener على #cartItems
     ═══════════════════════════════════════════════════════════ */
  function bindRemoveFromCart(){
    const cartItems = document.getElementById("cartItems");
    if(!cartItems || cartItems.__ga4Bound) return;
    cartItems.__ga4Bound = true;

    cartItems.addEventListener("click", function(e){
      const rmBtn = e.target.closest(".rm");
      if(!rmBtn) return;
      try {
        const idx = +rmBtn.dataset.i;
        const c = JSON.parse(localStorage.getItem("vl_cart") || "[]");
        const item = c[idx];
        if(item){
          ga4("remove_from_cart", {
            currency: "EGP",
            value: Number(item.price || 0) * Number(item.qty || 1),
            items: [{
              item_id: String(item.id),
              item_name: item.name || "",
              price: Number(item.price || 0),
              quantity: Number(item.qty || 1)
            }]
          });
        }
      } catch(err){}
    });
  }

  /* ═══════════════════════════════════════════════════════════
     5) view_cart — لما المستخدم يفتح السلة
     ═══════════════════════════════════════════════════════════ */
  let lastViewCartGA4 = 0;
  function bindViewCart(){
    const cartBtn = document.getElementById("cartBtn");
    if(!cartBtn || cartBtn.__ga4Bound) return;
    cartBtn.__ga4Bound = true;

    cartBtn.addEventListener("click", function(){
      const now = Date.now();
      if(now - lastViewCartGA4 < 30000) return;
      lastViewCartGA4 = now;

      try {
        const c = JSON.parse(localStorage.getItem("vl_cart") || "[]");
        if(!c.length) return;
        const value = c.reduce(function(s,i){ return s + Number(i.price||0)*Number(i.qty||1); }, 0);
        ga4("view_cart", {
          currency: "EGP",
          value: value,
          items: toGa4Items(c)
        });
      } catch(e){}
    });
  }

  /* ═══════════════════════════════════════════════════════════
     6) begin_checkout — زر إتمام الطلب
     ═══════════════════════════════════════════════════════════ */
  function bindBeginCheckout(){
    const checkoutBtn = document.getElementById("checkoutBtn");
    if(!checkoutBtn || checkoutBtn.__ga4Bound) return;
    checkoutBtn.__ga4Bound = true;

    checkoutBtn.addEventListener("click", function(){
      try {
        const c = JSON.parse(localStorage.getItem("vl_cart") || "[]");
        if(!c.length) return;
        const value = c.reduce(function(s,i){ return s + Number(i.price||0)*Number(i.qty||1); }, 0);
        ga4("begin_checkout", {
          currency: "EGP",
          value: value,
          items: toGa4Items(c)
        });
      } catch(e){}
    });
  }

  /* ═══════════════════════════════════════════════════════════
     7) [تم الحذف] bindSearch — search.js الجديد بيسجل الحدث بنفسه
     ═══════════════════════════════════════════════════════════ */

  /* ═══════════════════════════════════════════════════════════
     8) select_item — لما يضغط على كارت منتج
     ═══════════════════════════════════════════════════════════ */
  function bindSelectItem(){
    ["pgrid", "productsGrid"].forEach(function(gridId){
      const grid = document.getElementById(gridId);
      if(!grid || grid.__ga4Bound) return;
      grid.__ga4Bound = true;

      grid.addEventListener("click", function(e){
        const mediaLink = e.target.closest("a.p-media");
        const titleLink = e.target.closest(".p-body h3 a");
        const link = mediaLink || titleLink;
        if(!link) return;

        const article = link.closest("article.p-card");
        if(!article) return;
        const pid = article.dataset.id;
        if(!pid) return;

        try {
          const products = getProducts();
          const p = products.find(function(x){ return String(x.id) === String(pid); });
          if(p){
            ga4("select_item", {
              item_list_id: gridId === "productsGrid" ? "products_page" : "home_products",
              item_list_name: gridId === "productsGrid" ? "All Products" : "Home Collection",
              items: [productToGa4Item(p)]
            });
          }
        } catch(err){}
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     9) whatsapp_click — كل لينكات واتساب
     ═══════════════════════════════════════════════════════════ */
  function bindWhatsAppClicks(){
    if(document.__waBound) return;
    document.__waBound = true;

    document.addEventListener("click", function(e){
      const waLink = e.target.closest('a[href*="wa.me"], a[href*="whatsapp"], .whatsapp-float');
      if(!waLink) return;
      ga4("whatsapp_click", {
        link_url: waLink.href || "",
        page_location: window.location.href
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     10) add_to_wishlist — نلف toggleWishlist
     ═══════════════════════════════════════════════════════════ */
  function wrapToggleWishlist(){
    if(typeof window.toggleWishlist !== "function") return false;
    if(window.toggleWishlist.__ga4Wrapped) return true;

    const original = window.toggleWishlist;
    const wrapped = function(productId){
      const wasAdded = original.apply(this, arguments);
      try {
        if(wasAdded){
          const products = getProducts();
          const p = products.find(function(x){ return String(x.id) === String(productId); });
          if(p){
            ga4("add_to_wishlist", {
              currency: "EGP",
              value: Number(p.price || 0),
              items: [productToGa4Item(p)]
            });
          }
        }
      } catch(e){}
      return wasAdded;
    };
    wrapped.__ga4Wrapped = true;
    window.toggleWishlist = wrapped;
    return true;
  }

  /* ═══════════════════════════════════════════════════════════
     11) view_promotion — بانر الهيرو (مع retry)
     ═══════════════════════════════════════════════════════════ */
  let promotionFired = false;
  function firePromotions(){
    if(promotionFired) return true;
    const hero = document.querySelector(".vl-chroma-hero, .hero");
    if(!hero) return false;
    ga4("view_promotion", {
      promotion_id: "hero_main",
      promotion_name: "VelaLight Hero Banner"
    });
    promotionFired = true;
    return true;
  }

  /* ═══════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════ */
  function init(){
    function doBind(){
      bindRemoveFromCart();
      bindViewCart();
      bindBeginCheckout();
      bindSelectItem();
      bindWhatsAppClicks();
      firePromotions();
    }

    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", doBind);
    } else {
      doBind();
    }

    /* ✅ [تعديل] — interval واحد بيتابع كل حاجة، وبيتوقف بمجرد ما كله يخلص */
    let tries = 0;
    const MAX_TRIES = 40;
    const timer = setInterval(function(){
      tries++;

      const doneViewItem    = fireViewItem();
      const doneViewList    = fireViewItemList();
      const doneAddWrap     = wrapAddToCart();
      const doneWishWrap    = wrapToggleWishlist();
      const donePromotion   = firePromotions();

      if((doneViewItem && doneViewList && doneAddWrap && doneWishWrap && donePromotion) || tries >= MAX_TRIES){
        clearInterval(timer);
      }
    }, 400);

    /* ✅ [تعديل] — تسريع الفحص عند وصول البيانات من Firebase */
    window.addEventListener("data-refresh", function(){
      fireViewItem();
      fireViewItemList();
      wrapAddToCart();
      wrapToggleWishlist();
      firePromotions();
    });

    /* ✅ [تعديل] — مراقبة DOM عشان نربط الكروت اللي بتظهر متأخر */
    const mo = new MutationObserver(function(){
      bindSelectItem();
    });
    try {
      mo.observe(document.body, { childList: true, subtree: true });
    } catch(e){}
  }

  init();

  window.ga4Event = ga4;
})();
