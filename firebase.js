import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const C = (window.CFG || {}).FIREBASE || {};

if (C.apiKey && !C.apiKey.startsWith("YOUR_")) {

  try {

    const app = initializeApp(C);
    const db = getFirestore(app);
    const auth = getAuth(app);

    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn("Anonymous auth:", e.message);
    }


    window.FB = {

      // قراءة مرة واحدة عند الحاجة
      list: async (collectionName) => {
        const snapshot = await import(
          "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
        ).then(({ getDocs }) =>
          getDocs(collection(db, collectionName))
        );

        return snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
      },


      // مراقبة مباشرة للتغييرات
      watch: (collectionName, callback) => {

        return onSnapshot(
          collection(db, collectionName),

          snapshot => {

            const products = snapshot.docs.map(d => ({
              id: d.id,
              ...d.data()
            }));

            callback(products);

          },

          error => {
            console.error(
              `Firebase realtime error [${collectionName}]:`,
              error
            );
          }
        );

      },


      add: (collectionName, data) =>
        addDoc(
          collection(db, collectionName),
          data
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


      admin: (email, password) =>
        signInWithEmailAndPassword(
          auth,
          email,
          password
        )

    };


    window.dispatchEvent(
      new Event("fb-ready")
    );


    console.log("🔥 Firebase connected successfully");

  } catch (e) {

    console.error(
      "Firebase initialization failed:",
      e
    );

  }

}
