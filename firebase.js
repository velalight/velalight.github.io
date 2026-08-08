import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = (window.CFG && window.CFG.FIREBASE) || {
  apiKey:"AIzaSyDTX0J7Fvccv2oLvpGYYZXHiteGuiE8y8o",
  authDomain:"velalight.firebaseapp.com",
  projectId:"velalight",
  storageBucket:"velalight.firebasestorage.app",
  messagingSenderId:"1095485535268",
  appId:"1:1095485535268:web:4d17ee9de6f5acdacbd4b1"
};

try {
  const app=initializeApp(firebaseConfig);
  const db=getFirestore(app);
  const auth=getAuth(app);

  try { await signInAnonymously(auth); }
  catch(e) { console.warn("Firebase anonymous auth:",e.message); }

  window.FB={
    list:async c=>(await getDocs(collection(db,c))).docs.map(d=>({id:d.id,...d.data()})),
    watch:(c,cb,onError)=>onSnapshot(collection(db,c),
      s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))),
      e=>{console.error("Firebase realtime error ["+c+"]:",e);if(typeof onError==="function")onError(e)}
    ),
    add:(c,d)=>addDoc(collection(db,c),d),
    update:(c,id,d)=>updateDoc(doc(db,c,id),d),
    remove:(c,id)=>deleteDoc(doc(db,c,id)),
    admin:(e,p)=>signInWithEmailAndPassword(auth,e,p),
    authUser:()=>auth.currentUser,
    onAuthStateChanged:(cb)=>onAuthStateChanged(auth,cb)
  };

  window.dispatchEvent(new Event("fb-ready"));
  console.log("Firebase connected — realtime enabled");
} catch(e) {
  console.error("Firebase initialization failed:",e);
  window.dispatchEvent(new CustomEvent("fb-error",{detail:e}));
}
