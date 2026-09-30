/* VelaLight — SEO Pack (v2 - محسّن)
   Safe, additive SEO layer.
   Does not change products, cart, Firebase, prices, or checkout.

   التعديلات:
   - إصلاح CSS.escape لمشكلة التوافق
   - إصلاح مفتاح الكاش (vl_products_v3 بدل vl_products_cache_v1)
   - الاستماع لحدث data-refresh عشان SEO يتحدث أوتوماتيك
   - إيقاف الـ interval بمجرد ما المنتج يتحمّل (توفير موارد)
   - قراءة مباشرة من window.ALL_PRODUCTS دايمًا
*/
(function () {
  "use strict";

  const SITE = "https://velalight.github.io/";
  const BRAND = "VelaLight";

  /* ✅ [تعديل 1] — بديل آمن لـ CSS.escape */
  function escapeAttr(s) {
    return String(s || "").replace(/(["\\])/g, "\\$1");
  }

  function ensureMeta(attr, key, content) {
    if (!content) return;
    const selector = `meta[${attr}="${escapeAttr(key)}"]`;
    let el = null;
    try { el = document.head.querySelector(selector); } catch (_) {}
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function ensureLink(rel, href) {
    let el = document.head.querySelector(`link[rel="${escapeAttr(rel)}"]`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function ensureJsonLd(id, data) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function absolute(url) {
    if (!url) return SITE;
    try { return new URL(url, location.href).href; }
    catch (_) { return SITE; }
  }

  /* ✅ [تعديل 2] — قراءة المنتجات من كل المصادر المتاحة (بما فيها v3) */
  function productFromSources() {
    const pid = new URLSearchParams(location.search).get("p");
    if (!pid) return null;

    const sources = [];

    try {
      if (Array.isArray(window.ALL_PRODUCTS)) sources.push(...window.ALL_PRODUCTS);
    } catch (_) {}
    try {
      if (Array.isArray(window.PRODUCTS)) sources.push(...window.PRODUCTS);
    } catch (_) {}
    try {
      // ✅ المفتاح الصح دلوقتي
      const cached = JSON.parse(localStorage.getItem("vl_products_v3") || "[]");
      if (Array.isArray(cached)) sources.push(...cached);
    } catch (_) {}
    try {
      // للتوافق مع الإصدارات القديمة لو موجود
      const oldCached = JSON.parse(localStorage.getItem("vl_products_cache_v1") || "[]");
      if (Array.isArray(oldCached)) sources.push(...oldCached);
    } catch (_) {}

    return sources.find(p =>
      p &&
      (
        String(p.id) === String(pid) ||
        String(p.id_) === String(pid) ||
        String(p.slug) === String(pid) ||
        String(p.pid) === String(pid)
      )
    ) || null;
  }

  function getName(p) {
    return String(
      p?.name ||
      p?.title ||
      document.querySelector("#pdName")?.textContent ||
      "شمعة فاخرة VelaLight"
    ).trim();
  }

  function getDescription(p) {
    return String(
      p?.desc ||
      p?.description ||
      p?.descEn ||
      document.querySelector("#pdDesc")?.textContent ||
      "شمعة يدوية فاخرة من VelaLight بعطور مميزة."
    ).trim().replace(/\s+/g, " ");
  }

  function getImage(p) {
    const src =
      p?.img ||
      p?.image ||
      p?.imageUrl ||
      document.querySelector("#pdImg")?.getAttribute("src") ||
      "heart2.jpg";
    return absolute(src);
  }

  let lastAppliedSignature = "";

  function applySiteSEO() {
    const isProduct = location.pathname.toLowerCase().includes("product.html");
    const p = isProduct ? productFromSources() : null;

    /* ✅ [تعديل 3] — تخطي التطبيق لو نفس المنتج اتطبق قبله (توفير موارد) */
    const sig = isProduct
      ? (p ? `p:${p.id}:${p.price}` : "p:loading")
      : "site";

    if (sig === lastAppliedSignature) return isProduct ? !!p : true;
    lastAppliedSignature = sig;

    if (p) {
      const name = getName(p);
      const desc = getDescription(p).slice(0, 160);
      const image = getImage(p);
      const url = absolute(location.pathname + location.search);

      document.title = `${name} | ${BRAND}`;

      ensureMeta("name", "description", desc);
      ensureMeta("property", "og:type", "product");
      ensureMeta("property", "og:title", `${name} | ${BRAND}`);
      ensureMeta("property", "og:description", desc);
      ensureMeta("property", "og:url", url);
      ensureMeta("property", "og:image", image);
      ensureMeta("name", "twitter:card", "summary_large_image");
      ensureMeta("name", "twitter:title", `${name} | ${BRAND}`);
      ensureMeta("name", "twitter:description", desc);
      ensureMeta("name", "twitter:image", image);
      ensureLink("canonical", url);

      const price = Number(p?.price);
      const availability = p?.active === false
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock";

      ensureJsonLd("vl-product-jsonld", {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": name,
        "description": desc,
        "image": [image],
        "brand": {
          "@type": "Brand",
          "name": BRAND
        },
        ...(Number.isFinite(price) && price > 0 ? {
          "offers": {
            "@type": "Offer",
            "url": url,
            "priceCurrency": "EGP",
            "price": price.toFixed(2),
            "availability": availability
          }
        } : {})
      });

      return true;
    } else {
      const url = SITE;
      ensureMeta(
        "name",
        "description",
        "VelaLight — شموع يدوية فاخرة بعطور مميزة وهدايا حسب الطلب مع توصيل في مصر."
      );
      ensureMeta("property", "og:type", "website");
      ensureMeta("property", "og:title", "VelaLight | شموع يدوية فاخرة");
      ensureMeta(
        "property",
        "og:description",
        "شموع يدوية فاخرة بعطور مميزة وهدايا حسب الطلب."
      );
      ensureMeta("property", "og:url", url);
      ensureMeta("property", "og:image", absolute("iccoffe2.jpg"));
      ensureMeta("name", "twitter:card", "summary_large_image");
      ensureLink("canonical", url);

      ensureJsonLd("vl-website-jsonld", {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": BRAND,
        "url": SITE,
        "description": "شموع يدوية فاخرة بعطور مميزة وهدايا حسب الطلب."
      });

      ensureJsonLd("vl-business-jsonld", {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": BRAND,
        "url": SITE,
        "logo": absolute("heart2.jpg")
      });

      return true;
    }
  }

  function boot() {
    const isProduct = location.pathname.toLowerCase().includes("product.html");

    /* تطبيق أولي فوري */
    const done = applySiteSEO();

    /* ✅ [تعديل 4] — لو إحنا في صفحة منتج والمنتج اتحمّل، خلاص مش محتاجين polling */
    if (isProduct && done) return;

    /* polling مؤقت — بيتوقف بمجرد ما المنتج يتحمّل */
    let tries = 0;
    const MAX_TRIES = 40; // 20 ثانية كحد أقصى
    const timer = setInterval(() => {
      const applied = applySiteSEO();
      tries++;

      // وقف الـ polling لو المنتج اتحمّل (في حالة product.html)
      if (isProduct && applied) {
        clearInterval(timer);
        return;
      }

      if (tries >= MAX_TRIES) clearInterval(timer);
    }, 500);

    /* ✅ [تعديل 5] — الاستماع لحدث data-refresh */
    window.addEventListener("data-refresh", function () {
      // إعادة تعيين الـ signature عشان نسمح بإعادة التطبيق
      lastAppliedSignature = "";
      const applied = applySiteSEO();
      if (isProduct && applied) clearInterval(timer);
    });

    /* ✅ [تعديل 6] — الاستماع لتحديثات التبويبات التانية */
    window.addEventListener("storage", function (e) {
      if (e.key === "vl_products_v3") {
        lastAppliedSignature = "";
        const applied = applySiteSEO();
        if (isProduct && applied) clearInterval(timer);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
