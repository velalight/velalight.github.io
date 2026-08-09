(() => {
  if (typeof $ !== "function") return;

  const qsa =
    typeof $$ === "function"
      ? $$
      : (s) => Array.from(document.querySelectorAll(s));

  const state = {
    cat: "all",
    min: "",
    max: "",
    sort: "new"
  };

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const tt = (key, fallback) =>
    typeof t === "function" ? t(key) : fallback;

  const moneySafe = (n) =>
    typeof money === "function" ? money(n) : `${Number(n || 0)} ج.م`;

  const toastSafe = (msg) => {
    if (typeof toast === "function") toast(msg);
    else console.log(msg);
  };

  const productsSource = () => {
    if (
      typeof ALL_PRODUCTS !== "undefined" &&
      Array.isArray(ALL_PRODUCTS) &&
      ALL_PRODUCTS.length
    ) {
      return ALL_PRODUCTS;
    }

    if (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)) {
      return PRODUCTS;
    }

    return [];
  };

  const catSafe = (k) => (typeof cat === "function" ? cat(k) : k);

  const scentTrSafe = (n) =>
    typeof scentTr === "function" ? scentTr(n) : n;

  const pnameSafe = (p) =>
    typeof pname === "function" ? pname(p) : p.name || "";

  const pbadgeSafe = (p) =>
    typeof pbadge === "function" ? pbadge(p) : "";

  const imgOfSafe = (p) =>
    typeof imgOf === "function" ? imgOf(p) : "";

  const ratingOfSafe = (id) =>
    typeof ratingOf === "function" ? ratingOf(id) : null;

  const getCartSafe = () => {
    try {
      return JSON.parse(localStorage.getItem("vl_cart") || "[]");
    } catch (e) {
      return [];
    }
  };

  const cartBadgeSafe = () => {
    if (typeof cartBadge === "function") {
      cartBadge();
      return;
    }

    const b = $("#cartCount");
    if (!b) return;

    const n = getCartSafe().reduce((a, i) => a + (+i.qty || 0), 0);
    b.textContent = n;
  };

  const saveCartSafe = (cart) => {
    if (typeof saveCart === "function") {
      saveCart(cart);
    } else {
      localStorage.setItem("vl_cart", JSON.stringify(cart));
    }

    cartBadgeSafe();
  };

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("vl_user") || "{}");
    } catch (e) {
      return {};
    }
  };

  const setUser = (u) => {
    localStorage.setItem("vl_user", JSON.stringify(u));
  };

  const currentLang = () =>
    typeof LANG !== "undefined" ? LANG : "ar";

  function filteredProducts() {
    let list = [...productsSource()];

    if (state.cat !== "all") {
      list = list.filter((p) => p.cat === state.cat);
    }

    const min = Number(state.min || 0);
    const max = Number(state.max || 0);

    if (min > 0) {
      list = list.filter((p) => Number(p.price || 0) >= min);
    }

    if (max > 0) {
      list = list.filter((p) => Number(p.price || 0) <= max);
    }

    return sortProducts(list);
  }

  function sortProducts(list) {
    const sorted = [...list];

    switch (state.sort) {
      case "asc":
        sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;

      case "desc":
        sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;

      case "rating":
        sorted.sort((a, b) => {
          const ra = ratingOfSafe(a.id)?.avg || 0;
          const rb = ratingOfSafe(b.id)?.avg || 0;
          return rb - ra;
        });
        break;

      case "best":
        sorted.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
        break;

      case "disc":
        sorted.sort((a, b) => {
          const da = Number(a.old || 0) - Number(a.price || 0);
          const db = Number(b.old || 0) - Number(b.price || 0);
          return db - da;
        });
        break;

      default:
        sorted.sort(
          (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
        );
    }

    return sorted;
  }

  function updateChips() {
    qsa("#chips .chip").forEach((chip) => {
      chip.classList.toggle("on", chip.dataset.cat === state.cat);
    });
  }

  function renderProducts() {
    const pgrid = $("#pgrid");
    if (!pgrid) return;

    const list = filteredProducts();
    const pcount = $("#pcount");
    const noProducts = $("#noProducts");

    if (pcount) {
      pcount.textContent = `${list.length} ${tt("prod_word", "منتج")}`;
    }

    if (noProducts) {
      noProducts.classList.toggle("hidden", list.length > 0);
    }

    pgrid.innerHTML = list
      .map((p) => {
        const badge = pbadgeSafe(p);
        const rating = ratingOfSafe(p.id);
        const scents = (p.scents || [])
          .slice(0, 3)
          .map((s) => scentTrSafe(s))
          .join(" · ");

        const oldHtml =
          Number(p.old || 0) > Number(p.price || 0)
            ? `<del>${moneySafe(p.old)}</del>`
            : "";

        const ratingHtml = rating
          ? `<div class="stars">★★★★★ <small>(${rating.count})</small></div>`
          : "";

        return `
          <article class="p-card">
            <a class="p-media" href="product.html?p=${encodeURIComponent(p.id)}">
              <img src="${imgOfSafe(p)}" alt="${esc(pnameSafe(p))}" loading="lazy">
              ${badge ? `<span class="p-badge">${esc(badge)}</span>` : ""}
              <div class="p-quick">${tt("view_details", "👁️ عرض التفاصيل")}</div>
            </a>

            <div class="p-body">
              <div class="p-cat">${esc(catSafe(p.cat))}</div>

              <h3>
                <a href="product.html?p=${encodeURIComponent(p.id)}">
                  ${esc(pnameSafe(p))}
                </a>
              </h3>

              <div class="p-scents">🌸 ${esc(scents)}</div>

              ${ratingHtml}

              <div class="p-foot">
                <div class="p-price">
                  ${moneySafe(p.price)}
                  ${oldHtml}
                </div>

                <button class="p-add" type="button" data-add="${esc(p.id)}">
                  ${tt("add_cart", "+ أضيفي للسلة")}
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderScents() {
    const scentGrid = $("#scentGrid");
    if (!scentGrid) return;

    if (typeof SCENTS === "undefined" || !Array.isArray(SCENTS)) return;

    scentGrid.innerHTML = SCENTS.map((s, i) => {
      const ar = s[0];
      const en = s[1];

      return `
        <div class="scent">
          <i>${String(i + 1).padStart(2, "0")}</i>
          <div>
            <b>${esc(currentLang() === "en" ? en : ar)}</b>
            <small>${esc(currentLang() === "en" ? ar : en)}</small>
          </div>
        </div>
      `;
    }).join("");
  }

  function fillCities(select) {
    if (!select) return;
    if (typeof GOVS === "undefined" || !Array.isArray(GOVS)) return;

    const currentValue = select.value;

    select.innerHTML =
      `<option value="">${
        currentLang() === "en" ? "Governorate" : "اختاري المحافظة"
      }</option>` +
      GOVS.map((g, i) => {
        const enName =
          typeof GOVS_EN !== "undefined" && Array.isArray(GOVS_EN)
            ? GOVS_EN[i] || g
            : g;

        return `<option value="${esc(g)}">${esc(
          currentLang() === "en" ? enName : g
        )}</option>`;
      }).join("");

    if (currentValue) select.value = currentValue;
  }

  function renderCart() {
    const cart = getCartSafe();
    const cartItems = $("#cartItems");

    if (cartItems) {
      if (!cart.length) {
        cartItems.innerHTML = `
          <div class="empty">
            ${tt("cart_empty", "سلتك فاضية 🕯️")}
            <br><br>
            <small>${tt("cart_empty_sub", "اكتشفي The Collection")}</small>
          </div>
        `;
      } else {
        cartItems.innerHTML = cart
          .map((item, idx) => {
            const itemName =
              currentLang() === "en"
                ? item.nameEn || item.name
                : item.name;

            return `
              <div class="citem">
                <img src="${item.img || ""}" alt="${esc(itemName)}">

                <div style="flex:1;">
                  <h5>${esc(itemName)}</h5>
                  <div class="cs">${tt("scent_lbl", "العطر:")} ${esc(
                    scentTrSafe(item.scent)
                  )}</div>
                  <div class="cs">${moneySafe(item.price)}</div>
                </div>

                <div class="qty">
                  <button type="button" data-cart-minus="${idx}">−</button>
                  <b>${+item.qty || 1}</b>
                  <button type="button" data-cart-plus="${idx}">+</button>
                </div>

                <button class="rm" type="button" data-cart-remove="${idx}">
                  ✕
                </button>
              </div>
            `;
          })
          .join("");
      }
    }

    const subtotal = cart.reduce(
      (a, i) => a + Number(i.price || 0) * Number(i.qty || 0),
      0
    );

    const shipping = cart.length
      ? Number(typeof CFG !== "undefined" ? CFG.SHIPPING || 0 : 0)
      : 0;

    const total = subtotal + shipping;

    const subtotalEl = $("#subtotal");
    const shippingEl = $("#shipping");
    const totalEl = $("#total");

    if (subtotalEl) subtotalEl.textContent = moneySafe(subtotal);
    if (shippingEl) shippingEl.textContent = moneySafe(shipping);
    if (totalEl) totalEl.textContent = moneySafe(total);

    cartBadgeSafe();
  }

  function openCart() {
    prefillCheckout();
    renderCart();

    $("#cartDrawer")?.classList.add("open");
    $("#cartOv")?.classList.add("open");
  }

  function closeCart() {
    $("#cartDrawer")?.classList.remove("open");
    $("#cartOv")?.classList.remove("open");
  }

  function openNav() {
    $("#mnav")?.classList.add("open");
    $("#ovl")?.classList.add("open");
  }

  function closeNav() {
    $("#mnav")?.classList.remove("open");
    $("#ovl")?.classList.remove("open");
  }

  function openModal(selector) {
    const el = $(selector);
    if (el) el.classList.add("open");
  }

  function closeModalEl(el) {
    if (el) el.classList.remove("open");
  }

  function updateOrderCount() {
    const orderCount = $("#orderCount");
    if (!orderCount) return;

    const count = Number(localStorage.getItem("vl_orders") || 0);
    orderCount.textContent = `${tt("orders_count", "عدد طلباتك:")} ${count}`;
  }

  function loadAccount() {
    const u = getUser();

    const accName = $("#accName");
    const accPhone = $("#accPhone");
    const accCity = $("#accCity");
    const accAddr = $("#accAddr");

    if (accName) accName.value = u.name || "";
    if (accPhone) accPhone.value = u.phone || "";
    if (accCity) accCity.value = u.city || "";
    if (accAddr) accAddr.value = u.addr || "";

    updateOrderCount();
  }

  function prefillCheckout() {
    const u = getUser();

    const coName = $("#coName");
    const coPhone = $("#coPhone");
    const coCity = $("#coCity");
    const coAddr = $("#coAddr");

    if (coName && !coName.value && u.name) coName.value = u.name;
    if (coPhone && !coPhone.value && u.phone) coPhone.value = u.phone;
    if (coCity && !coCity.value && u.city) coCity.value = u.city;
    if (coAddr && !coAddr.value && u.addr) coAddr.value = u.addr;
  }

  function addChatMsg(text, who = "bot") {
    const chatMsgs = $("#chatMsgs");
    if (!chatMsgs) return;

    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  let chatOpened = false;

  function openChat() {
    $("#chatOv")?.classList.add("open");

    if (!chatOpened) {
      addChatMsg(tt("chat_welcome", "أهلًا بيكِ ✨"));
      chatOpened = true;
    }
  }

  function closeChat() {
    $("#chatOv")?.classList.remove("open");
  }

  function chatAnswer(key) {
    const answers = {
      gift: tt("a_gift", "أكيد أساعدك! 🎁"),
      relax: tt("a_relax", "للاسترخاء بنرشح شموع المساج 🧖‍♀️"),
      scents: tt("a_scents", "عندنا 19 عطر 🌸"),
      ship: tt("a_ship", "🚚 بنوصل لكل مصر خلال 3–7 أيام."),
      bride: tt("a_bride", "عقبال فرحك! 👰")
    };

    addChatMsg(answers[key] || tt("chat_welcome", "أهلًا بيكِ ✨"));
  }

  function doSearch(value) {
    const results = $("#searchResults");
    if (!results) return;

    const q = String(value || "").trim().toLowerCase();

    if (!q) {
      results.innerHTML = "";
      return;
    }

    const list = productsSource()
      .filter((p) => {
        const haystack = [
          p.name || "",
          p.nameEn || "",
          p.desc || "",
          p.descEn || "",
          catSafe(p.cat)
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
      .slice(0, 8);

    if (!list.length) {
      results.innerHTML = `
        <div class="empty">
          ${tt("no_products", "🕯️ مفيش منتجات")}
        </div>
      `;
      return;
    }

    results.innerHTML = list
      .map((p) => {
        return `
          <div class="sr-item" data-goto="${esc(p.id)}">
            <img src="${imgOfSafe(p)}" alt="${esc(pnameSafe(p))}">
            <div>
              <b>${esc(pnameSafe(p))}</b>
              <small style="display:block;color:var(--dim);">
                ${moneySafe(p.price)}
              </small>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function checkout() {
    const cart = getCartSafe();

    if (!cart.length) {
      toastSafe(tt("t_empty", "السلة فاضية 🕯️"));
      return;
    }

    const name = $("#coName")?.value.trim() || "";
    const phone = $("#coPhone")?.value.trim() || "";
    const city = $("#coCity")?.value || "";
    const address = $("#coAddr")?.value.trim() || "";
    const notes = $("#coNotes")?.value.trim() || "";

    if (!name || !phone || !city || !address) {
      toastSafe(tt("t_fill", "⚠️ كمّلي البيانات"));
      return;
    }

    const subtotal = cart.reduce(
      (a, i) => a + Number(i.price || 0) * Number(i.qty || 0),
      0
    );

    const shipping = Number(
      typeof CFG !== "undefined" ? CFG.SHIPPING || 0 : 0
    );

    const total = subtotal + shipping;

    const orderId =
      "VL-" + Date.now().toString(36).toUpperCase();

    let msg = `${tt("wa_head", "🕯️ طلب جديد")}\n`;
    msg += `${tt("wa_order", "🧾 رقم الطلب:")} ${orderId}\n\n`;

    cart.forEach((item, idx) => {
      const itemName =
        currentLang() === "en" ? item.nameEn || item.name : item.name;

      msg += `${idx + 1}. ${itemName}\n`;
      msg += `${tt("wa_scent", "العطر")}: ${scentTrSafe(item.scent)}\n`;
      msg += `${tt("pd_qty_t", "الكمية:")}: ${item.qty}\n`;
      msg += `${tt("wa_total", "💰 الإجمالي:")}: ${moneySafe(
        Number(item.price || 0) * Number(item.qty || 0)
      )}\n\n`;
    });

    msg += `${tt("subtotal", "المجموع")}: ${moneySafe(subtotal)}\n`;
    msg += `${tt("shipping", "الشحن")}: ${moneySafe(shipping)}\n`;
    msg += `${tt("total", "الإجمالي")}: ${moneySafe(total)}\n\n`;

    msg += `${tt("wa_name", "👤 الاسم:")} ${name}\n`;
    msg += `${tt("wa_phone", "📱 الموبايل:")} ${phone}\n`;
    msg += `${tt("wa_city", "🏙️ المحافظة:")} ${city}\n`;
    msg += `${tt("wa_addr", "📍 العنوان:")} ${address}\n`;

    if (notes) {
      msg += `${tt("wa_notes", "📝 ملاحظات:")} ${notes}\n`;
    }

    msg += `\n${tt(
      "paymethod_d",
      "InstaPay مقدمًا، والشحن كاش عند الاستلام."
    )}`;

    const waNumber = String(
      typeof CFG !== "undefined" ? CFG.WHATSAPP : "201223526105"
    ).trim();

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

    const order = {
      id: orderId,
      createdAt: Date.now(),
      name,
      phone,
      city,
      address,
      notes,
      items: cart,
      subtotal,
      shipping,
      total,
      status: 0,
      statusText: "قيد المراجعة",
      payment: "InstaPay",
      source: "site"
    };

    try {
      if (window.FB && typeof window.FB.add === "function") {
        window.FB.add("orders", order).catch((e) => {
          console.warn("Order save error:", e);
        });
      } else if (typeof DB !== "undefined" && typeof DB.add === "function") {
        DB.add("orders", order).catch?.((e) => {
          console.warn("Order save error:", e);
        });
      }
    } catch (e) {
      console.warn("Order save exception:", e);
    }

    localStorage.setItem(
      "vl_orders",
      String(Number(localStorage.getItem("vl_orders") || 0) + 1)
    );

    updateOrderCount();

    saveCartSafe([]);
    renderCart();
    closeCart();

    toastSafe(tt("t_order", "✅ تم تسجيل طلبك"));

    window.open(url, "_blank");
  }

  function bindEvents() {
    document.addEventListener("click", (e) => {
      const catEl = e.target.closest("[data-cat]");
      if (!catEl) return;

      e.preventDefault();

      state.cat = catEl.dataset.cat || "all";
      updateChips();
      renderProducts();
      closeNav();

      $("#products")?.scrollIntoView({ behavior: "smooth" });
    });

    const pgrid = $("#pgrid");
    if (pgrid) {
      pgrid.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-add]");
        if (!btn) return;

        e.preventDefault();

        const id = btn.dataset.add;
        const product = productsSource().find(
          (p) => String(p.id) === String(id)
        );

        if (!product) return;

        if (typeof addToCart === "function") {
          addToCart(product);
        }

        renderCart();
      });
    }

    const minPrice = $("#minPrice");
    if (minPrice) {
      minPrice.addEventListener("input", () => {
        state.min = minPrice.value;
        renderProducts();
      });
    }

    const maxPrice = $("#maxPrice");
    if (maxPrice) {
      maxPrice.addEventListener("input", () => {
        state.max = maxPrice.value;
        renderProducts();
      });
    }

    const sortSel = $("#sortSel");
    if (sortSel) {
      sortSel.addEventListener("change", () => {
        state.sort = sortSel.value;
        renderProducts();
      });
    }

    const navToggle = $("#navToggle");
    if (navToggle) navToggle.addEventListener("click", openNav);

    const ovl = $("#ovl");
    if (ovl) ovl.addEventListener("click", closeNav);

    const cartBtn = $("#cartBtn");
    if (cartBtn) cartBtn.addEventListener("click", openCart);

    const closeCartBtn = $("#closeCart");
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);

    const cartOv = $("#cartOv");
    if (cartOv) cartOv.addEventListener("click", closeCart);

    const cartItems = $("#cartItems");
    if (cartItems) {
      cartItems.addEventListener("click", (e) => {
        const cart = getCartSafe();

        const minusBtn = e.target.closest("[data-cart-minus]");
        const plusBtn = e.target.closest("[data-cart-plus]");
        const removeBtn = e.target.closest("[data-cart-remove]");

        if (minusBtn) {
          const idx = Number(minusBtn.dataset.cartMinus);
          if (!cart[idx]) return;

          cart[idx].qty = Math.max(1, Number(cart[idx].qty || 1) - 1);
          saveCartSafe(cart);
          renderCart();
        }

        if (plusBtn) {
          const idx = Number(plusBtn.dataset.cartPlus);
          if (!cart[idx]) return;

          cart[idx].qty = Number(cart[idx].qty || 1) + 1;
          saveCartSafe(cart);
          renderCart();
        }

        if (removeBtn) {
          const idx = Number(removeBtn.dataset.cartRemove);
          cart.splice(idx, 1);
          saveCartSafe(cart);
          renderCart();
        }
      });
    }

    const emptyCartBtn = $("#emptyCart");
    if (emptyCartBtn) {
      emptyCartBtn.addEventListener("click", () => {
        if (!confirm(tt("t_confirm_empty", "هتفضّي السلة؟"))) return;

        saveCartSafe([]);
        renderCart();
      });
    }

    const checkoutBtn = $("#checkoutBtn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

    const accBtn = $("#accBtn");
    if (accBtn) {
      accBtn.addEventListener("click", () => {
        loadAccount();
        openModal("#accOv");
      });
    }

    const closeAcc = $("#closeAcc");
    if (closeAcc) {
      closeAcc.addEventListener("click", () => {
        closeModalEl($("#accOv"));
      });
    }

    const saveAcc = $("#saveAcc");
    if (saveAcc) {
      saveAcc.addEventListener("click", () => {
        const u = {
          name: $("#accName")?.value.trim() || "",
          phone: $("#accPhone")?.value.trim() || "",
          city: $("#accCity")?.value || "",
          addr: $("#accAddr")?.value.trim() || ""
        };

        setUser(u);
        prefillCheckout();
        toastSafe(tt("t_saved", "💾 تم الحفظ"));
      });
    }

    const logoutBtn = $("#logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("vl_user");

        const accName = $("#accName");
        const accPhone = $("#accPhone");
        const accCity = $("#accCity");
        const accAddr = $("#accAddr");

        if (accName) accName.value = "";
        if (accPhone) accPhone.value = "";
        if (accCity) accCity.value = "";
        if (accAddr) accAddr.value = "";

        toastSafe(tt("t_saved", "💾 تم الحفظ"));
      });
    }

    const searchBtn = $("#searchBtn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        openModal("#searchOv");
        setTimeout(() => $("#searchInput")?.focus(), 120);
      });
    }

    const closeSearch = $("#closeSearch");
    if (closeSearch) {
      closeSearch.addEventListener("click", () => {
        closeModalEl($("#searchOv"));
      });
    }

    const searchInput = $("#searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        doSearch(searchInput.value);
      });
    }

    const searchResults = $("#searchResults");
    if (searchResults) {
      searchResults.addEventListener("click", (e) => {
        const item = e.target.closest("[data-goto]");
        if (!item) return;

        window.location.href = `product.html?p=${encodeURIComponent(
          item.dataset.goto
        )}`;
      });
    }

    const chatFab = $("#chatFab");
    if (chatFab) chatFab.addEventListener("click", openChat);

    const closeChat = $("#closeChat");
    if (closeChat) closeChat.addEventListener("click", closeChat);

    qsa(".chat-q button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const q = btn.dataset.q;
        if (!q) return;

        addChatMsg(btn.textContent.trim(), "user");
        setTimeout(() => chatAnswer(q), 250);
      });
    });

    qsa(".modal").forEach((m) => {
      m.addEventListener("click", (e) => {
        if (e.target === m) m.classList.remove("open");
      });
    });

    qsa(".faq-q").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".faq-item");
        if (!item) return;

        const answer = item.querySelector(".faq-a");
        const isOpen = item.classList.toggle("open");

        if (answer) {
          answer.style.maxHeight = isOpen
            ? `${answer.scrollHeight}px`
            : "0";
        }
      });
    });

    const langBtn = $("#langBtn");
    if (langBtn) {
      langBtn.textContent = currentLang() === "ar" ? "EN" : "AR";

      langBtn.addEventListener("click", () => {
        localStorage.setItem(
          "vl_lang",
          currentLang() === "ar" ? "en" : "ar"
        );
        location.reload();
      });
    }
  }

  function observeRv() {
    if (!("IntersectionObserver" in window)) {
      qsa(".rv").forEach((el) => el.classList.add("on"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("on");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    qsa(".rv").forEach((el) => io.observe(el));
  }

  function init() {
    fillCities($("#coCity"));
    fillCities($("#accCity"));

    renderScents();
    renderProducts();
    renderCart();
    loadAccount();
    bindEvents();
    observeRv();

    if (location.search.includes("cart=1")) {
      openCart();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();