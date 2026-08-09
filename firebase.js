import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
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
  browserLocalPersistence,
  setPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const clean = (value) => String(value || "").trim();


const firebaseConfig = {
  apiKey: "AIzaSyDTX0J7Fvccv2oLvpGYYZXHiteGuiE8y8o",
  authDomain: "velalight.firebaseapp.com",
  projectId: "velalight",
  storageBucket: "velalight.firebasestorage.app",
  messagingSenderId: "1095485535268",
  appId: "1:1095485535268:web:4d17ee9de6f5acdacbd4b1"
};


try {

  const app = initializeApp({
    apiKey: clean(firebaseConfig.apiKey),
    authDomain: clean(firebaseConfig.authDomain),
    projectId: clean(firebaseConfig.projectId),
    storageBucket: clean(firebaseConfig.storageBucket),
    messagingSenderId: clean(firebaseConfig.messagingSenderId),
    appId: clean(firebaseConfig.appId)
  });

  const db = getFirestore(app);
  const auth = getAuth(app);


  /*
   * نخلي Firebase يحتفظ بتسجيل الدخول
   * حتى بعد إغلاق الصفحة.
   */
  const authReady = setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Firebase Auth persistence enabled");
    })
    .catch((error) => {
      console.error("Firebase persistence error:", error);
    });


  window.FB = {

    db,

    auth,


    list: async (collectionName) => {

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
    },


    watch: (collectionName, callback, onError) => {

      return onSnapshot(
        collection(db, collectionName),

        (snapshot) => {

          callback(
            snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data()
            }))
          );

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


    add: (collectionName, data) =>
      addDoc(
        collection(db, collectionName),
        data
      ),


    set: (collectionName, id, data) =>
      setDoc(
        doc(db, collectionName, id),
        data,
        { merge: true }
      ),


    update: (collectionName, id, data) =>
      updateDoc(
        doc(db, collectionName, id),
        data
      ),


    remove: (collectionName, id) =>
      deleteDoc(
        doc(db, collectionName, id)
      ),


    /*
     * تسجيل الدخول
     */
    admin: async (email, password) => {

      await authReady;

      return signInWithEmailAndPassword(
        auth,
        clean(email),
        password
      );
    },


    authUser: () => auth.currentUser,


    signOut: () => signOut(auth),


    onAuthStateChanged: (callback) =>
      onAuthStateChanged(auth, callback)
  };


  /*
   * نراقب حالة تسجيل الدخول بشكل دائم.
   */
  onAuthStateChanged(auth, (user) => {

    console.log(
      "Firebase auth state:",
      user ? user.email : "NOT LOGGED IN"
    );

    window.dispatchEvent(
      new CustomEvent("fb-auth-state", {
        detail: user
      })
    );

  });


  /*
   * Firebase أصبح جاهزًا.
   */
  window.dispatchEvent(
    new Event("fb-ready")
  );


  console.log(
    "Firebase connected successfully — VelaLight"
  );

}
catch (error) {

  console.error(
    "Firebase initialization failed:",
    error
  );

  window.dispatchEvent(
    new CustomEvent("fb-error", {
      detail: error
    })
  );

}
