/* ═══════════════════════════════════════════════════════════
   ✨ VelaLight — Bottom Navigation Bar (زي أمازون)
   ملف مستقل تماماً — مش بيعتمد على app.js
   يعرض شريط تنقل ثابت في أسفل الشاشة للموبايل فقط
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // منع التشغيل مرتين
  if (window.__vlBottomNavLoaded) return;
  window.__vlBottomNavLoaded = true;

  /* ═══ 1. حقن الـ CSS ═══ */
  function injectStyles() {
    if (document.getElementById("vl-bottom-nav-styles")) return;

    const css = `
      /* ═══ Bottom Navigation Bar ═══ */
      .vl-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: 64px;
        background: #ffffff;
        border-top: 1px solid rgba(26, 21, 18, 0.08);
        box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
        display: none;
        align-items: center;
        justify-content: space-around;
        z-index: 9998;
        padding: 0 4px;
        padding-bottom: env(safe-area-inset-bottom, 0);
        direction: rtl;
        font-family: 'Tajawal', 'El Messiri', sans-serif;
      }

      /* يظهر على الموبايل بس */
      @media (max-width: 768px) {
        .vl-bottom-nav {
          display: flex;
        }

        /* إضافة مساحة أسفل الصفحة عشان الشريط ميغطي المحتوى */
        body {
          padding-bottom: 72px !important;
        }

        /* تحريك زر الواتساب فوق الشريط */
        .whatsapp-float {
          bottom: 80px !important;
        }
      }

      /* ═══ كل زر ═══ */
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

      .vl-bottom-nav-item:active {
        transform: scale(0.92);
      }

      .vl-bottom-nav-item:hover,
      .vl-bottom-nav-item.vl-active {
        color: #b8863f;
      }

      .vl-bottom-nav-item .vl-nav-icon {
        font-size: 22px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        position: relative;
        transition: transform 0.2s ease;
      }

      .vl-bottom-nav-item.vl-active .vl-nav-icon {
        transform: translateY(-2px);
      }

      .vl-bottom-nav-item .vl-nav-label {
        font-size: 11px;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        letter-spacing: 0.2px;
      }

      /* ═══ Badge على أيقونة السلة ═══ */
      .vl-nav-badge {
        position: absolute;
        top: -4px;
        right: -8px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        background: #e74c3c;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        border-radius: 99px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        box-shadow: 0 2px 6px rgba(231, 76, 60, 0.4);
        transform: scale(0);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .vl-nav-badge.vl-show {
        transform: scale(1);
      }

      /* ═══ مؤشر الصفحة النشطة ═══ */
      .vl-bottom-nav-item.vl-active::before {
        content: "";
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 3px;
        background: linear-gradient(90deg, #d4af37, #b8863f);
        border-radius: 0 0 4px 4px;
      }

      /* ═══ تنسيقات خاصة عند وجود RTL ═══ */
      html[dir="ltr"] .vl-bottom-nav {
        direction: ltr;
      }

      /* ═══ إخفاء إذا كان الشريط مخفي بـ JS ═══ */
      .vl-bottom-nav.vl-hidden {
        display: none !important;
      }
    `;

    const style = document.createElement("style");
    style.id = "vl-bottom-nav-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ═══ 2. بناء HTML للشريط ═══ */
  function buildNav() {
    if (document.getElementById("vlBottomNav")) return;

    const nav = document.createElement("nav");
    nav.id = "vlBottomNav";
    nav.className = "vl-bottom-nav";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "شريط التنقل السفلي");

    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const isHome = currentPath === "index.html" || currentPath === "" || currentPath === "/";

    nav.innerHTML = `
      <a href="index.html" class="vl-bottom-nav-item ${isHome ? "vl-active" : ""}" data-nav="home" aria-label="الرئيسية">
        <span class="vl-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </span>
        <span class="vl-nav-label">الرئيسية</span>
      </a>

      <button type="button" class="vl-bottom-nav-item" data-nav="account" aria-label="حسابي">
        <span class="vl-nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span class="vl-nav-label">حسابي</span>
      </button>

      <button type="button" class="vl-bottom-nav-item" data-nav="cart" aria-label="سلة الشراء">
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

      <button type="button" class="vl-bottom-nav-item" data-nav="menu" aria-label="القائمة">
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
    return nav;
  }

  /* ═══ 3. تحديث Badge السلة ═══ */
  function updateCartBadge() {
    const badge = document.getElementById("vlNavCartBadge");
    if (!badge) return;

    let count = 0;
    try {
      const cart = JSON.parse(localStorage.getItem("vl_cart") || "[]");
      if (Array.isArray(cart)) {
        count = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      }
    } catch (e) {
      count = 0;
    }

    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.classList.add("vl-show");
    } else {
      badge.classList.remove("vl-show");
    }
  }

  /* ═══ 4. مراقبة تغييرات السلة (Realtime) ═══ */
  function watchCartChanges() {
    // مراقبة الحدث المخصص لو موجود
    window.addEventListener("vl-cart-updated", updateCartBadge);

    // مراقبة تغييرات localStorage من تبويبات تانية
    window.addEventListener("storage", function (e) {
      if (e.key === "vl_cart") updateCartBadge();
    });

    // Polling كل ثانية كخطة احتياطية (خفيف جداً)
    setInterval(updateCartBadge, 1000);
  }

  /* ═══ 5. معالجة النقر على الأزرار ═══ */
  function handleNavClick(e) {
    const btn = e.target.closest("[data-nav]");
    if (!btn) return;

    const action = btn.dataset.nav;

    // ═══ Home ═══
    if (action === "home") {
      // لو إحنا في الصفحة الرئيسية بالفعل → نعمل scroll لفوق
      const currentPath = window.location.pathname.split("/").pop() || "index.html";
      if (currentPath === "index.html" || currentPath === "" || currentPath === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      // لو في صفحة تانية → الرابط شغال طبيعي
      return;
    }

    e.preventDefault();

    // ═══ Account ═══
    if (action === "account") {
      // إغلاق أي حاجة مفتوحة
      closeAllOverlays();

      // نبحث عن الزر الأصلي "accBtn" ونضغط عليه
      const accBtn = document.getElementById("accBtn");
      if (accBtn) {
        accBtn.click();
      } else if (typeof window.openAuthModal === "function") {
        window.openAuthModal();
      } else {
        // fallback: لو مفيش modal، نروح لصفحة الحساب
        window.location.href = "my-orders.html";
      }
      return;
    }

    // ═══ Cart ═══
    if (action === "cart") {
      // إغلاق أي overlay مفتوح
      closeAllOverlays();

      // نبحث عن زر السلة الأصلي
      const cartBtn = document.getElementById("cartBtn");
      if (cartBtn) {
        cartBtn.click();
      } else {
        // fallback: نفتح السلة يدوياً
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

    // ═══ Menu ═══
    if (action === "menu") {
      // إغلاق أي overlay مفتوح
      closeAllOverlays();

      const mnav = document.getElementById("mnav");
      const ovl = document.getElementById("ovl");
      if (mnav) {
        mnav.classList.add("open");
        if (ovl) ovl.classList.add("open");
        document.body.style.overflow = "hidden";
      } else {
        // fallback: نروح لصفحة المنتجات
        window.location.href = "products.html";
      }
      return;
    }
  }

  /* ═══ 6. إغلاق جميع الـ Overlays المفتوحة ═══ */
  function closeAllOverlays() {
    const toClose = ["cartDrawer", "cartOv", "mnav", "ovl", "accOv", "scentOv", "searchOv", "chatOv"];
    toClose.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && el.classList.contains("open")) {
        el.classList.remove("open");
      }
    });
    // إعادة overflow للـ body
    document.body.style.overflow = "";
  }

  /* ═══ 7. تحديث حالة الزر النشط حسب الصفحة ═══ */
  function updateActiveState() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const nav = document.getElementById("vlBottomNav");
    if (!nav) return;

    nav.querySelectorAll("[data-nav]").forEach(function (item) {
      item.classList.remove("vl-active");
    });

    let activeAction = null;
    if (currentPath === "index.html" || currentPath === "" || currentPath === "/") {
      activeAction = "home";
    }

    if (activeAction) {
      const active = nav.querySelector(`[data-nav="${activeAction}"]`);
      if (active) active.classList.add("vl-active");
    }
  }

  /* ═══ 8. التهيئة ═══ */
  function init() {
    injectStyles();
    buildNav();
    updateCartBadge();
    watchCartChanges();
    updateActiveState();

    // ربط الأحداث (Event Delegation)
    const nav = document.getElementById("vlBottomNav");
    if (nav) {
      nav.addEventListener("click", handleNavClick);
    }

    // مراقبة تغييرات الـ URL (لو SPA)
    window.addEventListener("popstate", updateActiveState);

    console.log("✅ Bottom Nav loaded");
  }

  /* ═══ تشغيل عند جاهزية الـ DOM ═══ */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();