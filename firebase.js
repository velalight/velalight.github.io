import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getFirestore,collection,getDocs,addDoc,updateDoc,deleteDoc,doc}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import{getAuth,signInAnonymously,signInWithEmailAndPassword}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const C=(window.CFG||{}).FIREBASE||{};
if(C.apiKey&&C.apiKey.indexOf("YOUR_")!==0){
 try{
  const app=initializeApp(C),db=getFirestore(app),auth=getAuth(app);
  try{await signInAnonymously(auth)}catch(e){console.warn("Anon auth:",e.message)}
  window.FB={
   list:async c=>{const s=await getDocs(collection(db,c));return s.docs.map(d=>({id:d.id,...d.data()}))},
   add:(c,d)=>addDoc(collection(db,c),d),
   update:(c,id,d)=>updateDoc(doc(db,c,id),d),
   remove:(c,id)=>deleteDoc(doc(db,c,id)),
   admin:(e,p)=>signInWithEmailAndPassword(auth,e,p)
  };
  window.dispatchEvent(new Event("fb-ready"));
 }catch(e){console.error("Firebase init failed:",e)}
}