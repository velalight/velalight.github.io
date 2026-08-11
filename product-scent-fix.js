/*
 VelaLight — Safe Product Scent Recovery
 ---------------------------------------
 This file ONLY protects the product-page scent selector.
 It does not touch the cart, prices, checkout, Firebase, or localStorage.

 If the live product record arrives without a usable scents field,
 the selector is restored from the official SCENTS catalog.
*/
(function () {
  "use strict";

  const selectId = "#pdScentSelect";

  function getOfficialScents() {
    if (typeof SCENTS === "undefined" || !Array.isArray(SCENTS)) return [];
    return SCENTS
      .map(s => {
        if (Array.isArray(s)) {
          return {
            value: String(s[0] || "").trim(),
            ar: String(s[0] || "").trim(),
            en: String(s[1] || s[0] || "").trim()
          };
        }
        const value = String(s || "").trim();
        return { value, ar: value, en: value };
      })
      .filter(s => s.value);
  }

  function hasRealOptions(select) {
    return [...select.options].some(o => String(o.value || "").trim());
  }

  function restoreIfEmpty() {
    const select = document.querySelector(selectId);
    if (!select) return;

    // Never overwrite a valid product-specific scent list.
    if (hasRealOptions(select)) return;

    const scents = getOfficialScents();
    if (!scents.length) return;

    const current = String(select.value || "").trim();

    select.innerHTML =
      `<option value="">${
        document.documentElement.lang === "en"
          ? "🌸 Choose a scent"
          : "🌸 اختاري العطر"
      }</option>` +
      scents.map(s =>
        `<option value="${escapeHtml(s.value)}">${
          escapeHtml(
            document.documentElement.lang === "en" ? s.en : s.ar
          )
        }</option>`
      ).join("");

    if (current && scents.some(s => s.value === current)) {
      select.value = current;
    }

    const head = select.closest(".pd-option-head");
    if (head) head.style.display = "flex";
    select.style.display = "";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function boot() {
    restoreIfEmpty();

    const select = document.querySelector(selectId);
    if (select) {
      const observer = new MutationObserver(() => restoreIfEmpty());
      observer.observe(select, {
        childList: true,
        subtree: true
      });

      window.setTimeout(restoreIfEmpty, 250);
      window.setTimeout(restoreIfEmpty, 1000);
      window.setTimeout(restoreIfEmpty, 2500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
