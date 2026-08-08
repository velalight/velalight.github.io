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
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* =========================================================
   VelaLight Firebase
   ========================================================= */

const firebaseConfig =
  (window.CFG && window.CFG.FIREBASE) || {

    apiKey:
      "AIzaSyDTX0J7Fvccv2oLvpGYYZXHiteGuiE8y8o",

    authDomain:
      "velalight.firebaseapp.com",

    projectId:
      "velalight",

    storageBucket:
      "velalight.firebasestorage.app",

    messagingSenderId:
      "1095485535268",

    appId:
      "1:1095485535268:web:4d17ee9de6f5acdacbd4b1"

  };


try {

  const app =
    initializeApp(firebaseConfig);

  const db =
    getFirestore(app);

  const auth =
    getAuth(app);


  /* =====================================================
     Firebase API
     ===================================================== */

  window.FB = {


    /* قراءة مرة واحدة */

    list: async function(collectionName) {

      const snapshot =
        await getDocs(
          collection(db, collectionName)
        );

      return snapshot.docs.map(function(d) {

        return {
          id: d.id,
          ...d.data()
        };

      });

    },


    /* ===================================================
       Realtime
       =================================================== */

    watch: function(
      collectionName,
      callback,
      onError
    ) {

      return onSnapshot(

        collection(
          db,
          collectionName
        ),

        function(snapshot) {

          const data =
            snapshot.docs.map(function(d) {

              return {
                id: d.id,
                ...d.data()
              };

            });

          callback(data);

        },

        function(error) {

          console.error(
            "Firebase realtime error [" +
            collectionName +
            "]:",
            error
          );

          if (
            typeof onError === "function"
          ) {
            onError(error);
          }

        }

      );

    },


    /* ===================================================
       إضافة
       =================================================== */

    add: function(
      collectionName,
      data
    ) {

      return addDoc(
        collection(
          db,
          collectionName
        ),
        data
      );

    },


    /* ===================================================
       تعديل
       =================================================== */

    update: function(
      collectionName,
      id,
      data
    ) {

      return updateDoc(
        doc(
          db,
          collectionName,
          id
        ),
        data
      );

    },


    /* ===================================================
       حذف
       =================================================== */

    remove: function(
      collectionName,
      id
    ) {

      return deleteDoc(
        doc(
          db,
          collectionName,
          id
        )
      );

    },


    /* ===================================================
       Admin Login
       =================================================== */

    admin: async function(
      email,
      password
    ) {

      const result =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      console.log(
        "✅ Admin authenticated:",
        result.user.email
      );

      return result;

    },


    /* ===================================================
       Forgot Password
       =================================================== */

    resetPassword: async function(
      email
    ) {

      return sendPasswordResetEmail(
        auth,
        email
      );

    },


    /* ===================================================
       Logout
       =================================================== */

    logout: function() {

      return signOut(auth);

    },


    /* ===================================================
       Current User
       =================================================== */

    authUser: function() {

      return auth.currentUser;

    },


    /* ===================================================
       Auth Listener
       =================================================== */

    onAuthStateChanged: function(
      callback
    ) {

      return onAuthStateChanged(
        auth,
        callback
      );

    }

  };


  /* =====================================================
     Anonymous authentication
     
     فقط لو مفيش مستخدم حالي.
     ===================================================== */

  if (!auth.currentUser) {

    try {

      await signInAnonymously(auth);

      console.log(
        "👤 Anonymous Firebase session started"
      );

    } catch (error) {

      console.warn(
        "Anonymous authentication:",
        error.message
      );

    }

  }


  /* =====================================================
     Firebase Ready
     ===================================================== */

  window.dispatchEvent(
    new Event("fb-ready")
  );


  console.log(
    "🔥 VelaLight Firebase connected successfully"
  );


} catch (error) {

  console.error(
    "❌ Firebase initialization failed:",
    error
  );


  window.dispatchEvent(

    new CustomEvent(
      "fb-error",
      {
        detail: error
      }
    )

  );

}
