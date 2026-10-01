/* ═══════════════════════════════════════════════════════════
   VelaLight — نظام تسجيل دخول العملاء (v2 — محسّن)
   ✨ لا يطلب عنواناً عند التسجيل | ✨ يحفظ الإيميل لتسهيل الدخول القادم
   ✅ يدعم الموبايل (redirect) والكمبيوتر (popup) في Google Login
   ✅ حماية XSS في savedEmail
   ✅ تصدير closeAuthModal على window
   ═══════════════════════════════════════════════════════════ */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ═══ Google Provider ═══ */
const googleProvider = new GoogleAuthProvider();

/* ═══════ helper: تنظيف HTML لمنع XSS ═══════ */
function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, function(c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
  });
}

/* ═══════ إنشاء نافذة تسجيل الدخول تلقائياً ═══════ */
function createAuthModal() {
  if (document.getElementById("authOv")) return;

  // ✨ جلب الإيميل المحفوظ مسبقاً (مع تنظيف XSS)
  const savedEmail = escapeHtml(localStorage.getItem("vl_saved_email") || "");

  const modal = document.createElement("div");
  modal.id = "authOv";
  modal.className = "ovl";
  modal.innerHTML = `
    <div class="mpanel" style="width:min(420px,96vw);padding:2rem;position:relative">
      <button onclick="document.getElementById('authOv').classList.remove('open')" 
              style="position:absolute;top:1rem;inset-inline-end:1rem;font-size:1.5rem;color:var(--dim);background:none;border:none;cursor:pointer">✕</button>
      
      <h2 id="authTitle" style="color:var(--gold2);font-family:var(--fd);margin-bottom:1.5rem;text-align:center">تسجيل الدخول</h2>

      <!-- ═══ نموذج تسجيل الدخول (سريع ومباشر) ═══ -->
      <div id="vlLoginForm">
        <input type="email" id="vlLoginEmail" placeholder="الإيميل" value="${savedEmail}" style="margin-bottom:.8rem">
        <input type="password" id="vlLoginPass" placeholder="كلمة المرور" style="margin-bottom:.8rem">
        
        <button class="btn" style="width:100%;margin-bottom:.8rem" id="vlLoginBtn">
          🔐 تسجيل الدخول
        </button>

        <div style="text-align:center;margin:.8rem 0;color:var(--dim);font-size:.85rem">── أو ──</div>

        <button class="btn ghost" style="width:100%;margin-bottom:.8rem" id="vlGoogleBtn">
          🌐 الدخول بحساب Google
        </button>

        <p id="vlLoginError" style="color:var(--bad);font-size:.85rem;text-align:center;margin-top:.8rem;min-height:1.2em"></p>

        <div style="text-align:center;margin-top:1rem;font-size:.88rem">
          عميل جديد؟ 
          <a href="#" id="vlShowReg" style="color:var(--gold2);font-weight:700">أنشئ حسابك في ثوانٍ</a>
        </div>
        <div style="text-align:center;margin-top:.5rem;font-size:.82rem">
          <a href="#" id="vlForgotPass" style="color:var(--dim)">نسيت كلمة المرور؟</a>
        </div>
      </div>

      <!-- ═══ نموذج إنشاء حساب جديد (مبسّط جداً: لا نطلب عنواناً هنا) ═══ -->
      <div id="vlRegForm" style="display:none">
        <input type="text" id="vlRegName" placeholder="الاسم (اختياري)" style="margin-bottom:.8rem">
        <input type="email" id="vlRegEmail" placeholder="الإيميل *" style="margin-bottom:.8rem">
        <input type="password" id="vlRegPass" placeholder="كلمة المرور (6 أحرف على الأقل) *" style="margin-bottom:.8rem">
        
        <p style="font-size:.75rem;color:var(--dim);margin-bottom:.8rem;text-align:center">
          💡 لا تقلق، يمكننا إضافة عنوان الشحن ورقم الموبايل لاحقاً عند إتمام أول طلب بكل راحة.
        </p>

        <button class="btn" style="width:100%;margin-bottom:.8rem" id="vlRegBtn">
          ✨ إنشاء حساب جديد
        </button>

        <p id="vlRegError" style="color:var(--bad);font-size:.85rem;text-align:center;margin-top:.8rem;min-height:1.2em"></p>

        <div style="text-align:center;margin-top:1rem;font-size:.88rem">
          عندك حساب بالفعل؟ 
          <a href="#" id="vlShowLogin" style="color:var(--gold2);font-weight:700">تسجيل الدخول</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  /* ═══ ربط الأحداث ═══ */
  document.getElementById("vlShowReg").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("vlLoginForm").style.display = "none";
    document.getElementById("vlRegForm").style.display = "block";
    document.getElementById("authTitle").textContent = "حساب جديد";
    clearErrors();
  });

  document.getElementById("vlShowLogin").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("vlLoginForm").style.display = "block";
    document.getElementById("vlRegForm").style.display = "none";
    document.getElementById("authTitle").textContent = "تسجيل الدخول";
    clearErrors();
  });

  document.getElementById("vlLoginBtn").addEventListener("click", handleLogin);
  document.getElementById("vlRegBtn").addEventListener("click", handleRegister);
  document.getElementById("vlGoogleBtn").addEventListener("click", handleGoogleLogin);
  document.getElementById("vlForgotPass").addEventListener("click", handleResetPassword);

  /* Enter key support */
  document.getElementById("vlLoginPass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  document.getElementById("vlRegPass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleRegister();
  });
}

function clearErrors() {
  const loginErr = document.getElementById("vlLoginError");
  const regErr = document.getElementById("vlRegError");
  if (loginErr) loginErr.textContent = "";
  if (regErr) regErr.textContent = "";
}

/* ═══════ فتح / إغلاق النافذة ═══════ */
window.openAuthModal = function() {
  const loginForm = document.getElementById("vlLoginForm");
  const regForm = document.getElementById("vlRegForm");
  const title = document.getElementById("authTitle");
  const overlay = document.getElementById("authOv");
  if (!loginForm || !regForm || !title || !overlay) return;
  
  loginForm.style.display = "block";
  regForm.style.display = "none";
  title.textContent = "تسجيل الدخول";
  clearErrors();
  overlay.classList.add("open");
};

function closeAuthModal() {
  const overlay = document.getElementById("authOv");
  if (overlay) overlay.classList.remove("open");
}

/* ✅ تصدير الدالة على window */
window.closeAuthModal = closeAuthModal;

/* ═══════ تسجيل الدخول ═══════ */
async function handleLogin() {
  const email = document.getElementById("vlLoginEmail").value.trim();
  const pass = document.getElementById("vlLoginPass").value;
  const errBox = document.getElementById("vlLoginError");
  const btn = document.getElementById("vlLoginBtn");

  if (!email || !pass) {
    errBox.textContent = "⚠️ اكتب الإيميل وكلمة المرور";
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ جاري الدخول...";
  errBox.textContent = "";

  const result = await VL_Login(email, pass);

  btn.disabled = false;
  btn.textContent = "🔐 تسجيل الدخول";

  if (result.success) {
    closeAuthModal();
    if (typeof toast === "function") toast("✅ أهلاً بعودتك!");
    await syncUserData();
    updateAccountUI();
  } else {
    errBox.textContent = "❌ " + result.error;
  }
}

/* ═══════ إنشاء حساب جديد ═══════ */
async function handleRegister() {
  const name = document.getElementById("vlRegName").value.trim();
  const email = document.getElementById("vlRegEmail").value.trim();
  const pass = document.getElementById("vlRegPass").value;
  const errBox = document.getElementById("vlRegError");
  const btn = document.getElementById("vlRegBtn");

  if (!email || !pass) {
    errBox.textContent = "⚠️ الإيميل وكلمة المرور حقول مطلوبة (*)";
    return;
  }

  if (pass.length < 6) {
    errBox.textContent = "⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ جاري إنشاء الحساب...";
  errBox.textContent = "";

  const result = await VL_Register(email, pass, name);

  btn.disabled = false;
  btn.textContent = "✨ إنشاء حساب جديد";

  if (result.success) {
    closeAuthModal();
    if (typeof toast === "function") toast("✅ تم إنشاء الحساب بنجاح! يمكنك إكمال بياناتك عند الطلب.");
    await syncUserData();
    updateAccountUI();
  } else {
    errBox.textContent = "❌ " + result.error;
  }
}

/* ═══════ الدخول بحساب Google (يدعم الموبايل + الكمبيوتر) ═══════ */
async function handleGoogleLogin() {
  const btn = document.getElementById("vlGoogleBtn");
  btn.disabled = true;
  btn.textContent = "⏳ جاري الدخول...";

  const result = await VL_LoginGoogle();

  btn.disabled = false;
  btn.textContent = "🌐 الدخول بحساب Google";

  // ✅ على الموبايل: redirect بيحصل، فمفيش success فوري
  if (result.pending) {
    return;
  }

  if (result.success) {
    closeAuthModal();
    if (typeof toast === "function") toast("✅ تم الدخول بنجاح");
    await syncUserData();
    updateAccountUI();
  } else {
    document.getElementById("vlLoginError").textContent = "❌ " + result.error;
  }
}

/* ═══════ إعادة تعيين كلمة المرور ═══════ */
async function handleResetPassword() {
  const email = document.getElementById("vlLoginEmail").value.trim() || prompt("اكتب إيميلك لإرسال رابط إعادة التعيين:");
  if (!email) return;

  const result = await VL_ResetPassword(email);
  if (result.success) {
    if (typeof toast === "function") toast("✅ تم إرسال رابط التعيين لإيميلك");
  } else {
    if (typeof toast === "function") toast("❌ " + result.error);
  }
}

/* ═══════ تحديث واجهة الحساب ═══════ */
function updateAccountUI() {
  const accBtn = document.getElementById("accBtn");
  if (!accBtn) return;

  if (window.FB && window.FB.auth && window.FB.auth.currentUser) {
    const user = window.FB.auth.currentUser;
    const userData = JSON.parse(localStorage.getItem("vl_user") || "{}");
    const displayName = userData.name || user.displayName || user.email.split("@")[0];
    accBtn.textContent = "👤";
    accBtn.title = `مرحباً، ${displayName}`;
  } else {
    accBtn.textContent = "👤";
    accBtn.title = "حسابي";
  }
}

/* ═══════════════════════════════════════════════════════════
   ✨ مزامنة بيانات المستخدم من Firestore إلى المتصفح
   ═══════════════════════════════════════════════════════════ */
async function syncUserData() {
  if (!window.FB || !window.FB.auth || !window.FB.auth.currentUser) return;
  
  try {
    const user = window.FB.auth.currentUser;
    const userRef = doc(window.FB.db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      
      // ✨ نحفظ البيانات الأساسية فقط في localStorage
      localStorage.setItem("vl_user", JSON.stringify({
        uid: data.uid || user.uid,
        email: data.email || user.email || "",
        name: data.name || user.displayName || "",
        phone: data.phone || "",
        city: data.city || "",
        addr: data.address || "",
        orders: data.ordersCount || 0
      }));
      
      // تحديث الحقول في نافذة "حسابي" إذا كانت مفتوحة
      const accName = document.getElementById("accName");
      const accPhone = document.getElementById("accPhone");
      const accCity = document.getElementById("accCity");
      const accAddr = document.getElementById("accAddr");
      const ordCount = document.getElementById("ordCount");
      
      if (accName) accName.value = data.name || "";
      if (accPhone) accPhone.value = data.phone || "";
      if (accCity) accCity.value = data.city || "";
      if (accAddr) accAddr.value = data.address || "";
      if (ordCount) ordCount.textContent = data.ordersCount || 0;
    }
  } catch (err) {
    console.warn("Failed to sync user data:", err);
  }
}

/* ═══════════════════════════════════════════════════════════
   دوال Firebase Authentication (مصدّرة للنافذة العامة)
   ═══════════════════════════════════════════════════════════ */

/* ═══ إنشاء حساب جديد ═══ */
window.VL_Register = async function(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      window.FB.auth, email, password
    );

    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
    }

    const userRef = doc(window.FB.db, "users", userCredential.user.uid);
    await setDoc(userRef, {
      uid: userCredential.user.uid,
      email: email,
      name: name || "",
      phone: "",
      city: "",
      address: "",
      provider: "password",
      photoURL: "",
      ordersCount: 0,
      totalSpent: 0,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    localStorage.setItem("vl_saved_email", email);

    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("VL_Register error:", error);
    return { success: false, error: translateError(error.code) };
  }
};

/* ═══ تسجيل الدخول ═══ */
window.VL_Login = async function(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      window.FB.auth, email, password
    );

    localStorage.setItem("vl_saved_email", email);

    const userRef = doc(window.FB.db, "users", userCredential.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
    } else {
      await setDoc(userRef, {
        uid: userCredential.user.uid,
        email: email,
        name: userCredential.user.displayName || "",
        phone: "",
        city: "",
        address: "",
        provider: "password",
        photoURL: "",
        ordersCount: 0,
        totalSpent: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("VL_Login error:", error);
    return { success: false, error: translateError(error.code) };
  }
};

/* ═══ الدخول بحساب Google (Popup للكمبيوتر + Redirect للموبايل) ═══ */
window.VL_LoginGoogle = async function() {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // ✅ على الموبايل: redirect (لأن popups محظورة)
    if (isMobile) {
      try {
        sessionStorage.setItem("vl_auth_return", window.location.pathname + window.location.search);
      } catch (e) {}
      
      await signInWithRedirect(window.FB.auth, googleProvider);
      return { success: true, pending: true };
    }
    
    // ✅ على الكمبيوتر: popup
    const result = await signInWithPopup(window.FB.auth, googleProvider);
    
    const userRef = doc(window.FB.db, "users", result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: result.user.uid,
        email: result.user.email || "",
        name: result.user.displayName || "",
        phone: "",
        city: "",
        address: "",
        provider: "google.com",
        photoURL: result.user.photoURL || "",
        ordersCount: 0,
        totalSpent: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    } else {
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
    }

    localStorage.setItem("vl_saved_email", result.user.email || "");

    return { success: true, user: result.user };
  } catch (error) {
    console.error("VL_LoginGoogle error:", error);
    return { success: false, error: translateError(error.code) };
  }
};

/* ═══ تسجيل الخروج ═══ */
window.VL_Logout = async function() {
  try {
    await signOut(window.FB.auth);
    
    localStorage.removeItem("vl_user");
    
    const accName = document.getElementById("accName");
    const accPhone = document.getElementById("accPhone");
    const accCity = document.getElementById("accCity");
    const accAddr = document.getElementById("accAddr");
    const ordCount = document.getElementById("ordCount");
    
    if (accName) accName.value = "";
    if (accPhone) accPhone.value = "";
    if (accCity) accCity.value = "";
    if (accAddr) accAddr.value = "";
    if (ordCount) ordCount.textContent = "0";
    
    updateAccountUI();
    if (typeof toast === "function") toast("✅ تم تسجيل الخروج");
    
    setTimeout(() => window.location.reload(), 500);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/* ═══ إعادة تعيين كلمة المرور ═══ */
window.VL_ResetPassword = async function(email) {
  try {
    await sendPasswordResetEmail(window.FB.auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: translateError(error.code) };
  }
};

/* ═══ جلب بيانات المستخدم الحالي ═══ */
window.VL_GetCurrentUser = async function() {
  if (!window.FB || !window.FB.auth || !window.FB.auth.currentUser) return null;

  const user = window.FB.auth.currentUser;
  const userRef = doc(window.FB.db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
};

/* ═══ تحديث بيانات المستخدم ═══ */
window.VL_UpdateProfile = async function(data) {
  if (!window.FB || !window.FB.auth || !window.FB.auth.currentUser) {
    return { success: false, error: "غير مسجل" };
  }

  try {
    const user = window.FB.auth.currentUser;
    const userRef = doc(window.FB.db, "users", user.uid);
    
    await setDoc(userRef, data, { merge: true });

    const old = JSON.parse(localStorage.getItem("vl_user") || "{}");
    const updated = { ...old, ...data };
    if (data.address) updated.addr = data.address;
    localStorage.setItem("vl_user", JSON.stringify(updated));

    return { success: true };
  } catch (error) {
    console.error("VL_UpdateProfile error:", error);
    return { success: false, error: error.message };
  }
};

/* ═══════ ترجمة أخطاء Firebase للعربي ═══════ */
function translateError(code) {
  const errors = {
    "auth/email-already-in-use": "الإيميل ده مسجل قبل كده، جرب تسجيل الدخول",
    "auth/invalid-email": "الإيميل غير صحيح",
    "auth/weak-password": "كلمة المرور ضعيفة (6 أحرف على الأقل)",
    "auth/user-not-found": "الإيميل مش مسجل",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/invalid-credential": "الإيميل أو كلمة المرور غير صحيحة",
    "auth/too-many-requests": "محاولات كتير، استنى شوية وحاول تاني",
    "auth/network-request-failed": "مشكلة في الاتصال بالإنترنت",
    "auth/popup-closed-by-user": "تم إغلاق نافذة تسجيل الدخول",
    "auth/popup-blocked": "المتصفح منع النافذة المنبثقة، يرجى السماح بها",
    "auth/cancelled-popup-request": "تم إلغاء العملية، حاول تاني",
    "auth/user-disabled": "الحساب ده متوقف، تواصل مع الدعم",
    "auth/requires-recent-login": "لأمان حسابك، سجّل دخول تاني",
    "auth/operation-not-allowed": "طريقة التسجيل دي مش مفعّلة، تواصل مع الدعم"
  };
  return errors[code] || "حدث خطأ غير متوقع، حاول تاني";
}

/* ═══════════════════════════════════════════════════════════
   التهيئة عند تحميل الصفحة
   ═══════════════════════════════════════════════════════════ */
function initAuthSystem() {
  createAuthModal();

  if (window.FB && window.FB.auth) {
    setupAuthListener();
  } else {
    window.addEventListener("fb-ready", () => {
      setupAuthListener();
    }, { once: true });
  }
}

function setupAuthListener() {
  // ✅ معالجة نتيجة الـ redirect (للموبايل)
  getRedirectResult(window.FB.auth).then(async (result) => {
    if (result && result.user) {
      const userRef = doc(window.FB.db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email || "",
          name: result.user.displayName || "",
          phone: "",
          city: "",
          address: "",
          provider: "google.com",
          photoURL: result.user.photoURL || "",
          ordersCount: 0,
          totalSpent: 0,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, { lastLogin: serverTimestamp() });
      }
      
      localStorage.setItem("vl_saved_email", result.user.email || "");
      if (typeof toast === "function") toast("✅ تم الدخول بنجاح");
      
      // رجّع المستخدم للصفحة اللي كان فيها
      try {
        const returnPath = sessionStorage.getItem("vl_auth_return");
        if (returnPath) {
          sessionStorage.removeItem("vl_auth_return");
        }
      } catch (e) {}
    }
  }).catch((error) => {
    console.warn("Redirect result error:", error);
  });

  onAuthStateChanged(window.FB.auth, async (user) => {
    window.dispatchEvent(new CustomEvent("vl-auth-change", {
      detail: { user }
    }));

    if (user) {
      await syncUserData();
    } else {
      localStorage.removeItem("vl_user");
    }
    updateAccountUI();
  });
}

/* ═══ بدء التشغيل ═══ */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthSystem);
} else {
  initAuthSystem();
}
