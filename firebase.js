import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
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


/* ===== VelaLight Firebase Configuration ===== */

const firebaseConfig = {
  apiKey: "AIzaSyDTX0J7Fvccv2oLvpGYYZXHiteGuiE8y8o",
  authDomain: "velalight.firebaseapp.com",
  projectId: "velalight",
  storageBucket: "velalight.firebasestorage.app",
  messagingSenderId: "1095485535268",
  appId: "1:1095485535268:web:4d17ee9de6f5acdacbd4b1"
};


try {

  const app = initializeApp(firebaseConfig);

  const db = getFirestore(app);

  const auth = getAuth(app);


  /* تسجيل دخول مجهول */

  try {

    await signInAnonymously(auth);

  } catch (e) {

    console.warn(
      "Firebase anonymous auth:",
      e.message
    );

  }


  /* ===== Firebase API ===== */

  window.FB = {


    /* قراءة المنتجات مرة واحدة */

    list: async function(collectionName) {

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      return snapshot.docs.map(function(d) {

        return {
          id: d.id,
          ...d.data()
        };

      });

    },


    /* ===== REALTIME LISTENER ===== */

    watch: function(collectionName, callback) {

      return onSnapshot(

        collection(db, collectionName),

        function(snapshot) {

          const products =
            snapshot.docs.map(function(d) {

              return {
                id: d.id,
                ...d.data()
              };

            });


          callback(products);

        },

        function(error) {

          console.error(
            "Firebase realtime error [" +
            collectionName +
            "]:",
            error
          );

        }

      );

    },


    /* إضافة منتج */

    add: function(collectionName, data) {

      return addDoc(
        collection(db, collectionName),
        data
      );

    },


    /* تعديل منتج */

    update: function(collectionName, id, data) {

      return updateDoc(
        doc(db, collectionName, id),
        data
      );

    },


    /* حذف منتج */

    remove: function(collectionName, id) {

      return deleteDoc(
        doc(db, collectionName, id)
      );

    },


    /* دخول الأدمن */

    admin: function(email, password) {

      return signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    }

  };


  /* Firebase أصبح جاهزًا */

  window.dispatchEvent(
    new Event("fb-ready")
  );


  console.log(
    "🔥 Firebase connected — realtime products enabled"
  );


} catch (error) {


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
