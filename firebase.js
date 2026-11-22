import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ═══════════════════════════════════════════════════════════
   ✨ App Check — حماية قاعدة البيانات من الطلبات الوهمية
   ═══════════════════════════════════════════════════════════ */
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

/* ─── Production: silence console.log (keep warn/error) ─── */
if(typeof location!=="undefined"&&/velalight\.github\.io/i.test(location.hostname)){console.log=function(){};console.info=function(){}}

/* =========================================================
   VelaLight Firebase Configuration
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDTX0J7Fvccv2oLvpGYYZXiHteGuiE8y8o",
  authDomain: "velalight.firebaseapp.com",
  projectId: "velalight",
  storageBucket: "velalight.firebasestorage.app",
  messagingSenderId: "1095485535268",
  appId: "1:1095485535268:web:4d17ee9de6f5acdacbd4b1",
  measurementId: "G-BWBD8ZZD23"
};


/* =========================================================
   Initialize Firebase
   ========================================================= */

let app;
let db;
let auth;
let appCheck;


try {

  app = initializeApp(firebaseConfig);

  /* ═══════════════════════════════════════════════════════════
     ✨ تهيئة App Check مع reCAPTCHA Enterprise
     ✅ في try/catch منفصل: لو فشلت، الموقع يشتغل عادي
     ═══════════════════════════════════════════════════════════ */
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider("6LdQet4tAAAAAGfQyNJBhI3v4BTmDG4lAyyj4QnN"),
      isTokenAutoRefreshEnabled: true
    });
    console.log("🛡️ App Check initialized with reCAPTCHA Enterprise");
  } catch (appCheckError) {
    console.warn("⚠️ App Check failed (continuing without it):", appCheckError);
    appCheck = null;
  }

  /* ═══════════════════════════════════════════════════════════
     ✅ Firestore مع offline persistence
     الميزة: الموقع يشتغل حتى لو النت قطع مؤقتاً
     + إصلاح وميض الصور عبر تفعيل Persistent Cache
     ═══════════════════════════════════════════════════════════ */
  // ✅ تفعيل الكاش الدائم عشان البيانات والصور تظهر فورًا من الزيارة التانية
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    console.log("Firestore initialized with persistent cache");
  } catch (cacheError) {
    console.warn("⚠️ Persistent cache failed, falling back to default:", cacheError);
    // Fallback: لو الـ persistent cache فشلت لأي سبب، نرجع للطريقة القديمة
    db = getFirestore(app);
    console.log("Firestore initialized with default settings (cache disabled)");
  }

  /* ═══════════════════════════════════════════════════════════
     ✅ Auth مع persistent login
     الميزة: المستخدم يفضل مسجل دخول حتى بعد إغلاق المتصفح
     ═══════════════════════════════════════════════════════════ */
  auth = getAuth(app);

  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("🔐 Auth persistence enabled");
    })
    .catch((persistError) => {
      console.warn("⚠️ Auth persistence failed:", persistError);
    });


  /* =======================================================
     Firebase Interface
     ======================================================= */

  window.FB = {

    db,

    auth,

    appCheck,


    /* =========================
       FIRESTORE - LIST
       ========================= */

    list: async (collectionName) => {

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          _storedId: data.id ?? null,
          id: d.id,
          _fid: d.id
        };
      });
    },


    /* =========================
       FIRESTORE - SINGLE DOCUMENT
       ========================= */

    get: async (collectionName, id) => {

      const snapshot = await getDoc(
        doc(db, collectionName, String(id))
      );

      if (!snapshot.exists()) return null;

           const data = snapshot.data();
      return {
        ...data,
        _storedId: data.id ?? null,
        id: snapshot.id,
        _fid: snapshot.id
      };
    },


    /* =========================
       FIRESTORE - REALTIME
       ========================= */

    watch: (collectionName, callback, onError) => {

      return onSnapshot(

        collection(db, collectionName),

        (snapshot) => {

          const data = snapshot.docs.map((d) => {
            const item = d.data();
            return {
              ...item,
              _storedId: item.id ?? null,
              id: d.id,
              _fid: d.id
            };
          });
          
          callback(data);

        },

        (error) => {

          console.error(
            "Firebase realtime error [" +
            collectionName +
            "]:",
            error
          );

          if (typeof onError === "function") {
            onError(error);
          }

        }

      );

    },


    /* =========================
       FIRESTORE - ADD
       ========================= */

    add: (collectionName, data) => {

      return addDoc(
        collection(db, collectionName),
        data
      );

    },


    /* =========================
       FIRESTORE - SET
       ========================= */

    set: (collectionName, id, data) => {

      return setDoc(
        doc(db, collectionName, id),
        data,
        { merge: true }
      );

    },


    /* =========================
       FIRESTORE - UPDATE
       ========================= */

    update: (collectionName, id, data) => {

      return updateDoc(
        doc(db, collectionName, id),
        data
      );

    },


    /* =========================
       FIRESTORE - DELETE
       ========================= */

    remove: (collectionName, id) => {

      return deleteDoc(
        doc(db, collectionName, id)
      );

    },


    /* =========================
       AUTH - LOGIN
       ========================= */

    admin: (email, password) => {

      return signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    },


    /* =========================
       AUTH - CURRENT USER
       ========================= */

    authUser: () => {

      return auth.currentUser;

    },


    /* =========================
       AUTH - STATE
       ========================= */

    onAuthStateChanged: (callback) => {

      return onAuthStateChanged(
        auth,
        callback
      );

    },


    /* =========================
       AUTH - LOGOUT
       ========================= */

    logout: () => {

      return signOut(auth);

    }

  };


  /* =======================================================
     AUTH STATE MONITOR
     ======================================================= */

  onAuthStateChanged(auth, (user) => {

    console.log(
      "Firebase Auth State:",
      user ? user.email : "No user"
    );

    window.dispatchEvent(
      new CustomEvent("fb-auth-state", {
        detail: {
          user: user || null
        }
      })
    );

  });


  /* =======================================================
     FIREBASE READY
     ======================================================= */

  console.log(
    "✅ Firebase connected successfully"
  );

  window.dispatchEvent(
    new Event("fb-ready")
  );


} catch (error) {

  console.error(
    "❌ Firebase initialization failed:",
    error
  );

  window.dispatchEvent(
    new CustomEvent("fb-error", {
      detail: error
    })
  );

}
