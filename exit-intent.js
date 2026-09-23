/* ═══════════════════════════════════════════════
   EXIT INTENT — عرض خاص لما المستخدم يهم يخرج
   - يظهر مرة واحدة فقط (localStorage)
   - مش بيظهر لو فيه منتج في السلة أو تم شراء سابقًا
   - لما المستخدم يضغط انسخ، الكود بيتنسخ
   ═══════════════════════════════════════════════ */
(function(){
  "use strict";

  var STORAGE_KEY = "vl_exit_shown";
  var SHOWN_DURATION = 7 * 24 * 60 * 60 * 1000; /* أسبوع */
  var SHOW_DELAY = 25000; /* 25 ثانية على الأقل في الصفحة */
  var COUPON_CODE = "WELCOME10";

  /* ─── نتأكد إنه مش اتفرج قبل كده ─── */
  function shouldShow(){
    try {
      var lastShown = localStorage.getItem(STORAGE_KEY);
      if(lastShown){
        var diff = Date.now() - Number(lastShown);
        if(diff < SHOWN_DURATION) return false;
      }
      /* مش بيظهر لو السلة فيها حاجة */
      var cart = JSON.parse(localStorage.getItem("vl_cart") || "[]");
      if(Array.isArray(cart) && cart.length > 0) return false;
      /* مش بيظهر لو العميل اشترى قبل كده */
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

  /* ─── عرض النافذة ─── */
  function showPopup(){
    var overlay = document.getElementById("vlExitOverlay");
    if(!overlay) return;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    markShown();

    /* Google Analytics Event */
    if(typeof window.gtag === "function"){
      try {
        window.gtag("event", "exit_intent_shown", {
          event_category: "engagement",
          event_label: "popup_displayed"
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

  /* ─── التحضير ─── */
  function init(){
    if(!shouldShow()) return;

    var overlay = document.getElementById("vlExitOverlay");
    if(!overlay) return;

    /* زر الإغلاق */
    var closeBtn = document.getElementById("vlExitClose");
    if(closeBtn) closeBtn.addEventListener("click", hidePopup);

    /* زر "لا شكرًا" */
    var noBtn = document.getElementById("vlExitNo");
    if(noBtn) noBtn.addEventListener("click", hidePopup);

    /* نقر على الخلفية */
    overlay.addEventListener("click", function(e){
      if(e.target === overlay) hidePopup();
    });

    /* ESC */
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && overlay.classList.contains("show")){
        hidePopup();
      }
    });

    /* زر نسخ الكود */
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
                coupon: code
              });
            } catch(e){}
          }
        };
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(code).then(done).catch(function(){
            /* fallback */
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
              coupon: COUPON_CODE
            });
          } catch(e){}
        }
      });
    }

    /* ─── 1) Exit intent للكمبيوتر (mouse leave from top) ─── */
    var mouseShown = false;
    document.addEventListener("mouseout", function(e){
      if(mouseShown) return;
      if(e.clientY > 10) return; /* بس لما يطلع من فوق */
      if(!e.relatedTarget && !e.toElement){
        mouseShown = true;
        showPopup();
      }
    });

    /* ─── 2) Exit intent للموبايل (back button + scroll up fast) ─── */
    var startY = 0;
    var touchShown = false;

    window.addEventListener("scroll", function(){
      var currentY = window.scrollY || window.pageYOffset;
      if(startY === 0) startY = currentY;
      /* لو نزل 600px وفجأة رجع فوق بسرعة */
      if(currentY < startY - 400 && startY > 600 && !touchShown){
        touchShown = true;
        showPopup();
      }
    }, { passive: true });

    /* ─── 3) عرض تلقائي بعد 60 ثانية لو المستخدم لسه موجود ─── */
    var autoShown = false;
    setTimeout(function(){
      if(autoShown || mouseShown || touchShown) return;
      if(document.visibilityState !== "visible") return;
      autoShown = true;
      showPopup();
    }, 60000);

    /* ─── 4) لما المستخدم يهم يقفل التاب ─── */
    /* (مش بيظهر النافذة لكن بيسجل الحدث في GA4) */
    document.addEventListener("visibilitychange", function(){
      if(document.visibilityState === "hidden" && !mouseShown && !touchShown && !autoShown){
        if(typeof window.gtag === "function"){
          try {
            window.gtag("event", "exit_intent_hidden_tab", {
              event_category: "engagement"
            });
          } catch(e){}
        }
      }
    });
  }

  /* ─── تشغيل بعد التحميل ─── */
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 500);
  }
})();