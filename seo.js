/* VelaLight — SEO Pack
   Safe, additive SEO layer.
   Does not change products, cart, Firebase, prices, or checkout.
*/
(function () {
  "use strict";

  const SITE = "https://velalight.github.io/";
  const BRAND = "VelaLight";

  function ensureMeta(attr, key, content) {
    if (!content) return;
    let el = document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function ensureLink(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
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

  function productFromSources() {
    const pid = new URLSearchParams(location.search).get("p");
    if (!pid) return null;

    const sources = [];

    try {
      if (Array.isArray(window.ALL_PRODUCTS)) sources.push(...window.ALL_PRODUCTS);
      if (Array.isArray(window.PRODUCTS)) sources.push(...window.PRODUCTS);
    } catch (_) {}

    try {
      const cached = JSON.parse(localStorage.getItem("vl_products_cache_v1") || "[]");
      if (Array.isArray(cached)) sources.push(...cached);
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

  function applySiteSEO() {
    const isProduct = location.pathname.toLowerCase().includes("product.html");
    const p = isProduct ? productFromSources() : null;

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
    }
  }

  function boot() {
    applySiteSEO();
    let tries = 0;
    const timer = setInterval(() => {
      applySiteSEO();
      tries++;
      if (tries >= 12) clearInterval(timer);
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
