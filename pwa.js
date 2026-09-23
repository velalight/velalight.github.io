/* ═══════════════════════════════════════════════════════════
   PWA INSTALL — زر "أضف للشاشة الرئيسية"
   + إشعار التحديثات
   
   - آمن 100% على الموبايل
   - مش بيظهر لمستخدم عنده التطبيق مثبت
   - بيظهر بعد زيارتين على الأقل
   ═══════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var STORAGE_KEY = "vl_pwa_dismissed";
  var VISITS_KEY = "vl_pwa_visits";
  var DISMISS_DURATION = 14 * 24 * 60 * 60 * 1000; /* أسبوعين */
  var MIN_VISITS = 2;

  /* ─── تتبع عدد الزيارات ─── */
  function trackVisit(){
    try {
      var visits = Number(localStorage.getItem(VISITS_KEY) || "0");
      /* نزود الزيارة مرة واحدة كل جلسة */
      if(!sessionStorage.getItem("vl_visit_counted")){
        visits++;
        localStorage.setItem(VISITS_KEY, String(visits));
        sessionStorage.setItem("vl_visit_counted", "1");
      }
      return visits;
    } catch(e){
      return 0;
    }
  }

  function shouldShowBanner(){
    try {
      var dismissed = localStorage.getItem(STORAGE_KEY);
      if(dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION) return false;
      if(window.matchMedia("(display-mode: standalone)").matches) return false;
      if(window.navigator.standalone === true) return false;
      var visits = Number(localStorage.getItem(VISITS_KEY) || "0");
      return visits >= MIN_VISITS;
    } catch(e){
      return false;
    }
  }

  function markDismissed(){
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch(e){}
  }

  /* ─── بانر "أضف للشاشة الرئيسية" ─── */
  var deferredPrompt = null;

  function showBanner(mode){
    /* mode: "android" | "ios" */
    if(document.getElementById("vlPwaBanner")) return;

    var banner = document.createElement("div");
    banner.className = "vl-pwa-banner";
    banner.id = "vlPwaBanner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "أضف VelaLight لشاشتك الرئيسية");

    var isIOS = mode === "ios";
    var message = isIOS
      ? "📱 لإضافة VelaLight لشاشتك: اضغط على <b>زر المشاركة</b> تحت، ثم <b>أضف للشاشة الرئيسية</b>"
      : "📱 ثبّت VelaLight على شاشتك للوصول السريع + شحن أسرع";

    banner.innerHTML = [
      '<div class="vl-pwa-content">',
      '  <div class="vl-pwa-icon">🕯️</div>',
      '  <div class="vl-pwa-text">',
      '    <strong>ثبّت التطبيق</strong>',
      '    <span>' + message + '</span>',
      '  </div>',
      '</div>',
      '<div class="vl-pwa-actions">',
      '  <button class="vl-pwa-install" type="button">' + (isIOS ? 'فهمت، اعرض الخطوات' : 'تثبيت') + '</button>',
      '  <button class="vl-pwa-later" type="button">لاحقًا</button>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);

    requestAnimationFrame(function(){
      banner.classList.add("show");
    });

    var installBtn = banner.querySelector(".vl-pwa-install");
    var laterBtn = banner.querySelector(".vl-pwa-later");

    if(installBtn){
      installBtn.addEventListener("click", function(){
        if(typeof window.gtag === "function"){
          try { window.gtag("event", "pwa_install_clicked", { mode: mode }); } catch(e){}
        }
        if(isIOS){
          showIOSInstructions();
        } else if(deferredPrompt){
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function(choice){
            if(choice.outcome === "accepted"){
              hideBanner();
              if(typeof window.gtag === "function"){
                try { window.gtag("event", "pwa_installed"); } catch(e){}
              }
            }
            deferredPrompt = null;
          });
        }
      });
    }

    if(laterBtn){
      laterBtn.addEventListener("click", function(){
        markDismissed();
        hideBanner();
      });
    }
  }

  function hideBanner(){
    var banner = document.getElementById("vlPwaBanner");
    if(!banner) return;
    banner.classList.remove("show");
    setTimeout(function(){
      if(banner.parentNode) banner.parentNode.removeChild(banner);
    }, 400);
  }

  function showIOSInstructions(){
    var overlay = document.createElement("div");
    overlay.className = "vl-pwa-ios-overlay";
    overlay.innerHTML = [
      '<div class="vl-pwa-ios-box">',
      '  <button class="vl-pwa-ios-close" type="button" aria-label="إغلاق">✕</button>',
      '  <div style="font-size:2.5rem;text-align:center;margin-bottom:.6rem">📲</div>',
      '  <h3 style="text-align:center;margin:0 0 1rem;font-family:El Messiri,serif">أضف VelaLight لشاشتك</h3>',
      '  <ol style="line-height:2;padding-inline-start:1.4rem;color:#5a4a3a">',
      '    <li>اضغط على أيقونة <b>المشاركة</b> (<span style="color:#007aff">□↑</span>) في متصفح Safari</li>',
      '    <li>اختر <b>أضف للشاشة الرئيسية</b> من القائمة</li>',
      '    <li>اضغط <b>إضافة</b> في الأعلى</li>',
      '  </ol>',
      '  <p style="text-align:center;font-size:.82rem;color:#8a7a64;margin-top:1rem">هتلاقي VelaLight على شاشتك الرئيسية زي أي تطبيق ✨</p>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);
    requestAnimationFrame(function(){ overlay.classList.add("show"); });

    var close = function(){
      overlay.classList.remove("show");
      setTimeout(function(){
        if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
      markDismissed();
      hideBanner();
    };
    overlay.querySelector(".vl-pwa-ios-close").addEventListener("click", close);
    overlay.addEventListener("click", function(e){
      if(e.target === overlay) close();
    });
  }

  /* ─── إشعار التحديث ─── */
  function showUpdateNotification(){
    if(document.getElementById("vlPwaUpdate")) return;

    var el = document.createElement("div");
    el.className = "vl-pwa-update";
    el.id = "vlPwaUpdate";
    el.innerHTML = [
      '<span>✨ نسخة جديدة من VelaLight متاحة</span>',
      '<button type="button">تحديث</button>'
    ].join('');

    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add("show"); });

    el.querySelector("button").addEventListener("click", function(){
      if(window.__vlNewWorker){
        window.__vlNewWorker.postMessage({ type: "SKIP_WAITING" });
      }
      setTimeout(function(){ window.location.reload(); }, 200);
    });
  }

  /* ─── Service Worker ─── */
  function initSW(){
    if(!("serviceWorker" in navigator)) return;

    window.addEventListener("load", function(){
      navigator.serviceWorker.register("/sw.js").then(function(reg){
        /* فحص التحديثات كل ساعة */
        setInterval(function(){ reg.update().catch(function(){}); }, 60 * 60 * 1000);

        reg.addEventListener("updatefound", function(){
          var newWorker = reg.installing;
          if(!newWorker) return;
          window.__vlNewWorker = newWorker;

          newWorker.addEventListener("statechange", function(){
            if(newWorker.state === "installed" && navigator.serviceWorker.controller){
              showUpdateNotification();
            }
          });
        });
      }).catch(function(e){
        console.log("SW registration skipped:", e && e.message);
      });

      /* إعادة تحميل بعد التحديث */
      var refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", function(){
        if(refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }

  /* ─── إعداد البانر ─── */
  function initBanner(){
    /* Android / Chrome */
    window.addEventListener("beforeinstallprompt", function(e){
      e.preventDefault();
      deferredPrompt = e;
      trackVisit();
      setTimeout(function(){
        if(shouldShowBanner()) showBanner("android");
      }, 3000);
    });

    /* iOS Safari (مفيش beforeinstallprompt) */
    var ua = navigator.userAgent || "";
    var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    var isStandalone = window.matchMedia("(display-mode: standalone)").matches
                    || window.navigator.standalone === true;

    if(isIOS && !isStandalone){
      trackVisit();
      setTimeout(function(){
        if(shouldShowBanner()) showBanner("ios");
      }, 3000);
    }
  }

  /* ─── Start ─── */
  function init(){
    initSW();
    initBanner();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 500);
  }
})();