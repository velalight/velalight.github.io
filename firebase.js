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
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


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

try {

  app = initializeApp(firebaseConfig);

  db = getFirestore(app);

  auth = getAuth(app);


  /* =======================================================
     Firebase Interface
     ======================================================= */

  window.FB = {

    db,

    auth,


    /* =========================
       FIRESTORE - LIST
       ========================= */

    list: async (collectionName) => {

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

    },


    /* =========================
       FIRESTORE - SINGLE DOCUMENT
       ========================= */

    get: async (collectionName, id) => {

      const snapshot = await getDoc(
        doc(db, collectionName, String(id))
      );

      if(!snapshot.exists()) return null;

      return {
        id: snapshot.id,
        ...snapshot.data()
      };

    },


    /* =========================
       FIRESTORE - REALTIME
       ========================= */

    watch: (collectionName, callback, onError) => {

      return onSnapshot(

        collection(db, collectionName),

        (snapshot) => {

          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }));

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
