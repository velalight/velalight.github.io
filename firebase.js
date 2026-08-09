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
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const clean = (value) => String(value || "").trim();

const rawConfig = (window.CFG && window.CFG.FIREBASE) || {
  apiKey: "AIzaSyDTX0J7Fvccv2oLvpGYYZXHiteGuiE8y8o",
  authDomain: "velalight.firebaseapp.com",
  projectId: "velalight",
  storageBucket: "velalight.firebasestorage.app",
  messagingSenderId: "1095485535268",
  appId: "1:1095485535268:web:4d17ee9de6f5acdacbd4b1"
};

const firebaseConfig = {
  apiKey: clean(rawConfig.apiKey),
  authDomain: clean(rawConfig.authDomain),
  projectId: clean(rawConfig.projectId),
  storageBucket: clean(rawConfig.storageBucket),
  messagingSenderId: clean(rawConfig.messagingSenderId),
  appId: clean(rawConfig.appId)
};

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  window.FB = {
    db,
    auth,
    storage,

    list: async (collectionName) => {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    watch: (collectionName, callback, onError) => {
      return onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error(`Firebase realtime error [${collectionName}]:`, error);
          if (typeof onError === "function") onError(error);
        }
      );
    },

    add: (collectionName, data) => addDoc(collection(db, collectionName), data),

    set: (collectionName, id, data) =>
      setDoc(doc(db, collectionName, id), data, { merge: true }),

    update: (collectionName, id, data) =>
      updateDoc(doc(db, collectionName, id), data),

    remove: (collectionName, id) => deleteDoc(doc(db, collectionName, id)),

    admin: (email, password) =>
      signInWithEmailAndPassword(auth, email, password),

    authUser: () => auth.currentUser,

    onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),

    uploadImage: async (file, path) => {
      if (!file) throw new Error("No file selected");

      const safeName = `${Date.now()}_${String(file.name).replace(
        /[^a-zA-Z0-9._-]+/g,
        "_"
      )}`;

      const storagePath = path || `products/${safeName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    }
  };

  window.dispatchEvent(new Event("fb-ready"));
  console.log("Firebase connected — realtime enabled");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  window.dispatchEvent(new CustomEvent("fb-error", { detail: error }));
}