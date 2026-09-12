/* ═══════════════════════════════════════════════════════════
   ✨ VelaLight — Bottom Navigation Bar (v2 — Performance)
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  if (window.__vlBottomNavLoaded) return;
  window.__vlBottomNavLoaded = true;

  const TRANSLATIONS = {
    ar: { home: "الرئيسية", account: "حسابي", cart: "العربة", menu: "القائمة" },
    en: { home: "Home", account: "Account", cart: "Cart", menu: "Menu" }
  };

  function getCurrentLang() {
    try {
      const stored = localStorage.getItem("vl_lang");
      if (stored === "en" || stored === "ar") return stored;
    } catch (e) {}
    const htmlLang = (document.documentElement.lang || "ar").toLowerCase();
    return htmlLang.startsWith("en") ? "en" : "ar";
  }

  function updateLabels() {
    const lang = getCurrentLang();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    const nav = document.getElementById("vlBottomNav");
    if (!nav) return;

    const set = (sel, txt) => {
      const el = nav.querySelector(sel);
      if (el) el.textContent = txt;
    };

    set('[data-nav="home"] .vl-nav-label', t.home);
    set('[data-nav="account"] .vl-nav-label', t.account);
    set('[data-nav="cart"] .vl-nav-label', t.cart);
    set('[data-nav="menu"] .vl-nav-label', t.menu);

    const homeBtn = nav.querySelector('[data-nav="home"]');
    const accBtn = nav.querySelector('[data-nav="account"]');
    const cartBtn = nav.querySelector('[data-nav="cart"]');
    const menuBtn = nav.querySelector('[data-nav="menu"]');
    if (homeBtn) homeBtn.setAttribute("aria-label", t.home);
    if (accBtn) accBtn.setAttribute("aria-label", t.account);
    if (cartBtn) cartBtn.setAttribute("aria-label", t.cart);
    if (menuBtn) menuBtn.setAttribute("aria-label", t.menu);
  }

  function injectStyles() {
    if (document.getElementById("vl-bottom-nav-styles")) return;
    const css = `
      .vl-bottom-nav {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        width: 100%; height: 64px;
        background: #fff;
        border-top: 1px solid rgba(26,21,18,0.08);
        box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
        display: none;
        align-items: center;
        justify-content: space-around;
        z-index: 9998;
        padding: 0 4px;
        padding-bottom: env(safe-area-inset-bottom, 0);
        direction: rtl;
        font-family: 'Tajawal', 'El Messiri', sans-serif;
        contain: layout style paint;
      }
      @media (max-width: 768px) {
        .vl-bottom-nav { display: flex; }
        body { padding-bottom: 72px !important; }
        .whatsapp-float { bottom: 80px !important; }
      }
      .vl-bottom-nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        background: transparent;
        border: 0;
        padding: 6px 2px;
        cursor: pointer;
        color: #8a7d70;
        text-decoration: none;
        transition: color 0.2s ease, transform 0.15s ease;
        position: relative;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .vl-bottom-nav-item:active { transform: scale(0.92); }
      .vl-bottom-nav-item:hover,
      .vl-bottom-nav-item.vl-active { color: #b8863f; }
      .vl-bottom-nav-item .vl-nav-icon {
        font-size: 22px; line-height: 1;
        display: flex; align-items: center; justify-content: center;
        width: 26px; height: 26px;
        position: relative;
        transition: transform 0.2s ease;
      }
      .vl-bottom-nav-item.vl-active .vl-nav-icon { transform: translateY(-2px); }
      .vl-bottom-nav-item .vl-nav-label {
        font-size: 11px; font-weight: 600;
        line-height: 1; white-space: nowrap; letter-spacing: 0.2px;
      }
      .vl-nav-badge {
        position: absolute;
        top: -4px; right: -8px;
        min-width: 18px; height: 18px;
        padding: 0 4px;
        background: #e74c3c; color: #fff;
        font-size: 10px; font-weight: 700;
        border-radius: 99px;
        display: flex; align-items: center; justify-content: center;
        line-height: 1;
        box-shadow: 0 2px 6px rgba(231,76,60,0.4);
        transform: scale(0);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .vl-nav-badge.vl-show { transform: scale(1); }
      .vl-bottom-nav-item.vl-active::before {
        content: "";
        position: absolute;
        top: 0; left: 50%;
        transform: translateX(-50%);
        width: 30px; height: 3px;
        background: linear-gradient(90deg, #d4af37, #b8863f);
        border-radius: 0 0 4px 4px;
      }
      html[dir="ltr"] .vl-bottom-nav { direction: ltr; }
    `;
    const style = document.createElement("style");
    style.id = "vl-bottom-nav-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildNav() {
    if (document.getElementById("vlBottomNav")) return;
    const nav = document.createElement("nav");
    nav.id = "vlBottomNav";
    nav.className = "vl-bottom-nav";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Bottom navigation");

    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const isHome = currentPath === "index.html" || currentPath === "" || currentPath === "/";

    nav.innerHTML = `
      <a href="index.html" class="vl-bottom-nav-item ${isHome ? "vl-active" : ""}" data-nav="home" aria-label="Home">
        <span class="vl-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </span>
        <span class="vl-nav-label">الرئيسية</span>
      </a>
      <button type="button" class="vl-bottom-nav-item" data-nav="account" aria-label="Account">
        <span class="vl-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span class="vl-nav-label">حسابي</span>
      </button>
      <button type="button" class="vl-bottom-nav-item" data-nav="cart" aria-label="Cart">
        <span class="vl-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span class="vl-nav-badge" id="vlNavCartBadge">0</span>
        </span>
        <span class="vl-nav-label">العربة</span>
      </button>
      <button type="button" class="vl-bottom-nav-item" data-nav="menu" aria-label="Menu">
        <span class="vl-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </span>
        <span class="vl-nav-label">القائمة</span>
      </button>
    `;
    document.body.appendChild(nav);
  }

  /* ═══ Badge — بدون Polling ثقيل ═══ */
  let badgeRaf = null;
  function updateCartBadge() {
    if (badgeRaf) return;
    badgeRaf = requestAnimationFrame(() => {
      badgeRaf = null;
      const badge = document.getElementById("vlNavCartBadge");
      if (!badge) return;
      let count = 0;
      try {
        const cart = JSON.parse(localStorage.getItem("vl_cart") || "[]");
        if (Array.isArray(cart)) {
          count = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
        }
      } catch (e) { count = 0; }
      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.classList.add("vl-show");
      } else {
        badge.classList.remove("vl-show");
      }
    });
  }

  function watchCartChanges() {
    // الأحداث المخصصة (الأساسية)
    window.addEventListener("vl-cart-updated", updateCartBadge);
    window.addEventListener("storage", (e) => {
      if (e.key === "vl_cart") updateCartBadge();
    });
    // Polling خفيف جداً كل 3 ثواني (بدل 1 ثانية)
    setInterval(updateCartBadge, 3000);
  }

  function watchLangChanges() {
    const observer = new MutationObserver(() => updateLabels());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    window.addEventListener("storage", (e) => {
      if (e.key === "vl_lang") updateLabels();
    });
    // Polling خفيف كل 3 ثواني
    let lastLang = getCurrentLang();
    setInterval(() => {
      const currentLang = getCurrentLang();
      if (currentLang !== lastLang) {
        lastLang = currentLang;
        updateLabels();
      }
    }, 3000);
  }

  function handleNavClick(e) {
    const btn = e.target.closest("[data-nav]");
    if (!btn) return;
    const action = btn.dataset.nav;

    if (action === "home") {
      const currentPath = window.location.pathname.split("/").pop() || "index.html";
      if (currentPath === "index.html" || currentPath === "" || currentPath === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    e.preventDefault();

    if (action === "account") {
      closeAllOverlays();
      const accBtn = document.getElementById("accBtn");
      if (accBtn) accBtn.click();
      else if (typeof window.openAuthModal === "function") window.openAuthModal();
      else window.location.href = "my-orders.html";
      return;
    }
    if (action === "cart") {
      closeAllOverlays();
      const cartBtn = document.getElementById("cartBtn");
      if (cartBtn) cartBtn.click();
      else {
        const drawer = document.getElementById("cartDrawer");
        const ovl = document.getElementById("cartOv");
        if (drawer) {
          drawer.classList.add("open");
          if (ovl) ovl.classList.add("open");
          document.body.style.overflow = "hidden";
        }
      }
      return;
    }
    if (action === "menu") {
      closeAllOverlays();
      const mnav = document.getElementById("mnav");
      const ovl = document.getElementById("ovl");
      if (mnav) {
        mnav.classList.add("open");
        if (ovl) ovl.classList.add("open");
        document.body.style.overflow = "hidden";
      } else {
        window.location.href = "products.html";
      }
      return;
    }
  }

  function closeAllOverlays() {
    const toClose = ["cartDrawer", "cartOv", "mnav", "ovl", "accOv", "scentOv", "searchOv", "chatOv"];
    toClose.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.classList.contains("open")) el.classList.remove("open");
    });
    document.body.style.overflow = "";
  }

  function updateActiveState() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const nav = document.getElementById("vlBottomNav");
    if (!nav) return;
    nav.querySelectorAll("[data-nav]").forEach((item) => item.classList.remove("vl-active"));
    if (currentPath === "index.html" || currentPath === "" || currentPath === "/") {
      const active = nav.querySelector('[data-nav="home"]');
      if (active) active.classList.add("vl-active");
    }
  }

  function resetBodyOverflow() {
    const hasOpenOverlay = document.querySelector(
      '.drawer.open, .ovl.open, .modal.open, .mnav.open, #mnav.open, #accOv.open, #scentOv.open'
    );
    if (!hasOpenOverlay) {
      document.body.style.overflow = "";
      document.body.style.overflowX = "";
      document.body.style.overflowY = "";
    }
  }

  function init() {
    injectStyles();
    buildNav();
    updateCartBadge();
    watchCartChanges();
    updateActiveState();
    updateLabels();
    watchLangChanges();

    const nav = document.getElementById("vlBottomNav");
    if (nav) nav.addEventListener("click", handleNavClick);

    window.addEventListener("popstate", updateActiveState);

    resetBodyOverflow();
    window.addEventListener("pageshow", resetBodyOverflow);
    window.addEventListener("load", () => setTimeout(resetBodyOverflow, 100));

    console.log("✅ Bottom Nav v2 loaded");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
