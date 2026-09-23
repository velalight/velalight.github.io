/* ═══════════════════════════════════════════════════════════
   GA4 EVENTS — تتبع أحداث Google Analytics 4
   ملف مستقل، بيعتمد على gtag() الموجودة في الصفحة
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
  function fireViewItem(){
    if(!window.location.pathname.includes("product.html")) return;
    const pid = new URLSearchParams(window.location.search).get("p");
    if(!pid) return;

    let tries = 0;
    const timer = setInterval(function(){
      tries++;
      const products = (typeof ALL_PRODUCTS !== "undefined" && Array.isArray(ALL_PRODUCTS))
        ? ALL_PRODUCTS : [];
      if(products.length){
        const p = products.find(function(x){ return String(x.id) === String(pid); });
        if(p){
          ga4("view_item", {
            currency: "EGP",
            value: Number(p.price || 0),
            items: [productToGa4Item(p)]
          });
        }
        clearInterval(timer);
      }
      if(tries >= 20) clearInterval(timer);
    }, 400);
  }

  /* ═══════════════════════════════════════════════════════════
     2) view_item_list — على products.html
     ═══════════════════════════════════════════════════════════ */
  let itemListFired = false;
  function fireViewItemList(){
    if(!window.location.pathname.includes("products.html")) return;
    if(itemListFired) return;

    let tries = 0;
    const timer = setInterval(function(){
      tries++;
      const products = (typeof ALL_PRODUCTS !== "undefined" && Array.isArray(ALL_PRODUCTS))
        ? ALL_PRODUCTS : [];
      if(products.length){
        itemListFired = true;
        ga4("view_item_list", {
          item_list_id: "products_page",
          item_list_name: "All Products",
          items: products.slice(0, 20).map(productToGa4Item).filter(Boolean)
        });
        clearInterval(timer);
      }
      if(tries >= 25) clearInterval(timer);
    }, 400);
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
     7) search — listener على حقل البحث
     ═══════════════════════════════════════════════════════════ */
  let searchTimer = null;
  function bindSearch(){
    const input = document.getElementById("searchInput");
    if(!input || input.__ga4Bound) return;
    input.__ga4Bound = true;

    input.addEventListener("input", function(e){
      clearTimeout(searchTimer);
      const q = (e.target.value || "").trim();
      if(q.length < 2) return;
      searchTimer = setTimeout(function(){
        ga4("search", { search_term: q });
      }, 1200);
    });
  }

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
          const products = (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : [];
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
          const products = (typeof ALL_PRODUCTS !== "undefined") ? ALL_PRODUCTS : [];
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
     11) view_promotion — بانر الهيرو
     ═══════════════════════════════════════════════════════════ */
  function firePromotions(){
    const hero = document.querySelector(".vl-chroma-hero");
    if(hero){
      ga4("view_promotion", {
        promotion_id: "hero_main",
        promotion_name: "VelaLight Hero Banner"
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════ */
  function init(){
    fireViewItem();
    fireViewItemList();

    let tries = 0;
    const maxTries = 40;
    const timer = setInterval(function(){
      tries++;
      const done1 = wrapAddToCart();
      const done2 = wrapToggleWishlist();
      if((done1 && done2) || tries >= maxTries){
        clearInterval(timer);
      }
    }, 500);

    function doBind(){
      bindRemoveFromCart();
      bindViewCart();
      bindBeginCheckout();
      bindSearch();
      bindSelectItem();
      bindWhatsAppClicks();
      firePromotions();
    }

    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", doBind);
    } else {
      doBind();
    }

    const mo = new MutationObserver(function(){
      bindSelectItem();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  init();

  window.ga4Event = ga4;
})();