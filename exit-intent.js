/* ═══════════════════════════════════════════════════════════
   EXIT INTENT — عرض ديناميكي يجيب الكوبونات من Firebase
   
   - بيقرأ الكوبونات الفعّالة فقط
   - بيفلتر المنتهية والمتوقفة
   - بيختار الأقوى (أعلى قيمة)
   - لو مفيش كوبون متاح، النافذة متظهرش
   ═══════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var STORAGE_KEY = "vl_exit_shown";
  var SHOWN_DURATION = 7 * 24 * 60 * 60 * 1000; /* أسبوع */
  var COUPON_CODE = ""; /* يتحدد ديناميكيًا */
  var COUPON_LABEL = ""; /* "خصم 10%" */

  /* ─── 1) يختار الكوبون الأفضل من القائمة ─── */
  function pickBestCoupon(coupons){
    if(!Array.isArray(coupons) || !coupons.length) return null;
    var now = Date.now();

    /* فلترة الكوبونات الصالحة */
    var valid = coupons.filter(function(c){
      if(!c || !c.code) return false;
      if(c.active === false) return false;
      /* لازم يكون نوعه percent أو fixed */
      var type = String(c.type || "").toLowerCase();
      if(type !== "percent" && type !== "percentage" && type !== "fixed") return false;
      /* مش بدأ بعد */
      if(c.startDate){
        var startTs = c.startDate > 1e12 ? c.startDate : new Date(c.startDate).getTime();
        if(now < startTs) return false;
      }
      /* منتهي */
      if(c.expiresAt){
        var endTs = Number(c.expiresAt);
        if(!isNaN(endTs) && now > endTs) return false;
      }
      /* استنفد الاستخدامات */
      if(c.maxUses && Number(c.usedCount || 0) >= Number(c.maxUses)) return false;

      return true;
    });

    if(!valid.length) return null;

    /* اختيار الأقوى:
       - نرتب حسب "القيمة" تنازليًا
       - لو القيم متساوية، نختار الأطول صلاحية */
    valid.sort(function(a, b){
      var diff = Number(b.value || 0) - Number(a.value || 0);
      if(diff !== 0) return diff;
      return Number(b.expiresAt || 0) - Number(a.expiresAt || 0);
    });

    return valid[0];
  }

  /* ─── 2) نجيب الكوبونات من Firebase ─── */
  function fetchCoupons(cb){
    var tries = 0;
    var maxTries = 20;
    var timer = setInterval(function(){
      tries++;
      if(window.FB && typeof window.FB.list === "function"){
        clearInterval(timer);
        window.FB.list("coupons").then(function(list){
          cb(Array.isArray(list) ? list : []);
        }).catch(function(e){
          console.warn("⚠️ Coupons fetch failed:", e);
          cb([]);
        });
        return;
      }
      if(tries >= maxTries){
        clearInterval(timer);
        console.warn("⚠️ Firebase not ready for coupons");
        cb([]);
      }
    }, 500);
  }

  /* ─── 3) نتأكد إنه لسه مناسب نعرض ─── */
  function shouldShow(){
    try {
      var lastShown = localStorage.getItem(STORAGE_KEY);
      if(lastShown){
        var diff = Date.now() - Number(lastShown);
        if(diff < SHOWN_DURATION) return false;
      }
      var cart = JSON.parse(localStorage.getItem("vl_cart") || "[]");
      if(Array.isArray(cart) && cart.length > 0) return false;
      var user = JSON.parse(localStorage.getItem("vl_user") || "{}");
      if(user.orders && Number(user.orders) > 0) return false;
      return true;
    } catch(e){
      return true;
    }
  }

  function markShown(){
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch(e){}
  }

  /* ─── 4) عرض النافذة ─── */
  function showPopup(){
    var overlay = document.getElementById("vlExitOverlay");
    if(!overlay) return;

    /* حدّث النص بالكوبون الحقيقي */
    var codeEl = document.getElementById("vlExitCode");
    if(codeEl) codeEl.textContent = COUPON_CODE;

    /* حدّث وصف الخصم */
    var descB = overlay.querySelector(".vl-exit-desc b");
    if(descB) descB.textContent = COUPON_LABEL;

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    markShown();

    if(typeof window.gtag === "function"){
      try {
        window.gtag("event", "exit_intent_shown", {
          event_category: "engagement",
          coupon_code: COUPON_CODE
        });
      } catch(e){}
    }
  }

  function hidePopup(){
    var overlay = document.getElementById("vlExitOverlay");
    if(!overlay) return;
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if(typeof window.gtag === "function"){
      try {
        window.gtag("event", "exit_intent_dismissed", {
          event_category: "engagement"
        });
      } catch(e){}
    }
  }

  /* ─── 5) تجهيز الأزرار والتفاعلات ─── */
  function initEvents(){
    var overlay = document.getElementById("vlExitOverlay");
    if(!overlay) return;

    var closeBtn = document.getElementById("vlExitClose");
    if(closeBtn) closeBtn.addEventListener("click", hidePopup);

    var noBtn = document.getElementById("vlExitNo");
    if(noBtn) noBtn.addEventListener("click", hidePopup);

    overlay.addEventListener("click", function(e){
      if(e.target === overlay) hidePopup();
    });

    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && overlay.classList.contains("show")){
        hidePopup();
      }
    });

    /* زر النسخ */
    var copyBtn = document.getElementById("vlExitCopy");
    var codeEl = document.getElementById("vlExitCode");
    if(copyBtn && codeEl){
      copyBtn.addEventListener("click", function(){
        var code = codeEl.textContent.trim();
        var done = function(){
          copyBtn.textContent = "✅ تم النسخ!";
          setTimeout(function(){
            copyBtn.textContent = "📋 انسخ الكود";
          }, 2000);
          if(typeof window.gtag === "function"){
            try {
              window.gtag("event", "exit_intent_copied", {
                event_category: "engagement",
                coupon_code: code
              });
            } catch(e){}
          }
        };
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(code).then(done).catch(function(){
            var tmp = document.createElement("textarea");
            tmp.value = code;
            document.body.appendChild(tmp);
            tmp.select();
            try { document.execCommand("copy"); done(); } catch(e){}
            document.body.removeChild(tmp);
          });
        } else {
          var tmp = document.createElement("textarea");
          tmp.value = code;
          document.body.appendChild(tmp);
          tmp.select();
          try { document.execCommand("copy"); done(); } catch(e){}
          document.body.removeChild(tmp);
        }
      });
    }

    /* زر التسوق */
    var ctaBtn = overlay.querySelector(".vl-exit-cta");
    if(ctaBtn){
      ctaBtn.addEventListener("click", function(){
        if(typeof window.gtag === "function"){
          try {
            window.gtag("event", "exit_intent_clicked", {
              event_category: "engagement",
              coupon_code: COUPON_CODE
            });
          } catch(e){}
        }
      });
    }
  }

  /* ─── 6) تشغيل triggers ─── */
  function initTriggers(){
    var overlay = document.getElementById("vlExitOverlay");
    if(!overlay) return;

    /* 1) Exit intent للكمبيوتر */
    var mouseShown = false;
    document.addEventListener("mouseout", function(e){
      if(mouseShown) return;
      if(e.clientY > 10) return;
      if(!e.relatedTarget && !e.toElement){
        mouseShown = true;
        showPopup();
      }
    });

    /* 2) Exit intent للموبايل */
    var startY = 0;
    var touchShown = false;
    window.addEventListener("scroll", function(){
      var currentY = window.scrollY || window.pageYOffset;
      if(startY === 0) startY = currentY;
      if(currentY < startY - 400 && startY > 600 && !touchShown){
        touchShown = true;
        showPopup();
      }
    }, { passive: true });

    /* 3) عرض تلقائي بعد 60 ثانية */
    var autoShown = false;
    setTimeout(function(){
      if(autoShown || mouseShown || touchShown) return;
      if(document.visibilityState !== "visible") return;
      autoShown = true;
      showPopup();
    }, 60000);
  }

  /* ─── 7) نقطة البداية ─── */
  function init(){
    if(!shouldShow()) return;

    fetchCoupons(function(coupons){
      var best = pickBestCoupon(coupons);

      if(!best){
        console.log("ℹ️ Exit Intent: مفيش كوبون فعّال متاح — مش هيتعرض");
        return;
      }

      COUPON_CODE = String(best.code || "").trim();
      var type = String(best.type || "").toLowerCase();
      var value = Number(best.value || 0);

      if(type === "percent" || type === "percentage"){
        COUPON_LABEL = "خصم " + value + "%";
      } else {
        COUPON_LABEL = "خصم " + value + " جنيه";
      }

      console.log("✅ Exit Intent: الكوبون المختار =", COUPON_CODE, "(" + COUPON_LABEL + ")");

      initEvents();
      initTriggers();
    });
  }

  /* ─── تشغيل بعد التحميل ─── */
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 800);
  }
})();
