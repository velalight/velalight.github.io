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
  apiKey: "AIzaSyDTX0J7Fvccv2oLvpGYYZXIh3teGuiE8y8o",
  authDomain: "velalight.firebaseapp.com",
  projectId: "velalight",
  storageBucket: "velalight.firebasestorage.app",
  messagingSenderId: "1095485535268",
  appId: "1:1095485535268:web:4d17ee9de6f5acdacbd4b1",
  measurementId: "G-BWBD8ZZD23"
};


/* =========================================================
   Firebase Initialization
   ========================================================= */

let app = null;
let db = null;
let auth = null;

try {

  app = initializeApp(firebaseConfig);

  db = getFirestore(app);

  auth = getAuth(app);


  /* =======================================================
     Firebase Database Interface
     ======================================================= */

  const FirebaseDB = {

    /* -------------------------------------------------------
       Direct Firebase instances
       ------------------------------------------------------- */

    db,
    auth,


    /* =====================================================
       FIRESTORE - LIST COLLECTION
       ===================================================== */

    list: async (collectionName) => {

      if (!collectionName) {
        throw new Error("Collection name is required.");
      }

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
    },


    /* =====================================================
       FIRESTORE - GET DOCUMENT
       ===================================================== */

    get: async (collectionName, id) => {

      if (!collectionName || id === undefined || id === null) {
        throw new Error("Collection name and document ID are required.");
      }

      const snapshot = await getDoc(
        doc(db, collectionName, String(id))
      );

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    },


    /* =====================================================
       FIRESTORE - REALTIME WATCH
       ===================================================== */

    watch: (collectionName, callback, onError) => {

      if (!collectionName) {
        throw new Error("Collection name is required.");
      }

      if (typeof callback !== "function") {
        throw new Error("Watch callback must be a function.");
      }

      return onSnapshot(

        collection(db, collectionName),

        (snapshot) => {

          const data = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }));

          callback(data);
        },

        (error) => {

          console.error(
            `Firebase realtime error [${collectionName}]:`,
            error
          );

          if (typeof onError === "function") {
            onError(error);
          }
        }

      );
    },


    /* =====================================================
       FIRESTORE - ADD DOCUMENT
       ===================================================== */

    add: async (collectionName, data) => {

      if (!collectionName) {
        throw new Error("Collection name is required.");
      }

      if (!data || typeof data !== "object") {
        throw new Error("Document data must be an object.");
      }

      return await addDoc(
        collection(db, collectionName),
        data
      );
    },


    /* =====================================================
       FIRESTORE - SET DOCUMENT
       ===================================================== */

    set: async (collectionName, id, data) => {

      if (!collectionName || id === undefined || id === null) {
        throw new Error("Collection name and document ID are required.");
      }

      if (!data || typeof data !== "object") {
        throw new Error("Document data must be an object.");
      }

      return await setDoc(
        doc(db, collectionName, String(id)),
        data,
        {
          merge: true
        }
      );
    },


    /* =====================================================
       FIRESTORE - UPDATE DOCUMENT
       ===================================================== */

    update: async (collectionName, id, data) => {

      if (!collectionName || id === undefined || id === null) {
        throw new Error("Collection name and document ID are required.");
      }

      if (!data || typeof data !== "object") {
        throw new Error("Document data must be an object.");
      }

      return await updateDoc(
        doc(db, collectionName, String(id)),
        data
      );
    },


    /* =====================================================
       FIRESTORE - DELETE DOCUMENT
       ===================================================== */

    remove: async (collectionName, id) => {

      if (!collectionName || id === undefined || id === null) {
        throw new Error("Collection name and document ID are required.");
      }

      return await deleteDoc(
        doc(db, collectionName, String(id))
      );
    },


    /* =====================================================
       AUTH - LOGIN
       ===================================================== */

    admin: async (email, password) => {

      if (!email || !password) {
        throw new Error("Email and password are required.");
      }

      return await signInWithEmailAndPassword(
        auth,
        String(email).trim(),
        password
      );
    },


    /* =====================================================
       AUTH - CURRENT USER
       ===================================================== */

    authUser: () => {

      return auth.currentUser || null;
    },


    /* =====================================================
       AUTH - STATE LISTENER
       ===================================================== */

    onAuthStateChanged: (callback) => {

      if (typeof callback !== "function") {
        throw new Error("Auth callback must be a function.");
      }

      return onAuthStateChanged(
        auth,
        callback
      );
    },


    /* =====================================================
       AUTH - LOGOUT
       ===================================================== */

    logout: async () => {

      return await signOut(auth);
    }

  };


  /* =========================================================
     IMPORTANT COMPATIBILITY LAYER
     
     Your other VelaLight files use BOTH:
     
       window.FB
       DB
     
     So we expose the same Firebase interface under both.
     ========================================================= */

  window.FB = FirebaseDB;

  window.DB = FirebaseDB;


  /* =========================================================
     AUTH STATE MONITOR
     ========================================================= */

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


  /* =========================================================
     FIREBASE READY
     ========================================================= */

  console.log("✅ Firebase connected successfully");

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
