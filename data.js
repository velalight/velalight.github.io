const CFG = {
  WHATSAPP: "201223526105",
  INSTAPAY: "",
  REPO: "velalight/velalight.github.io@main",
  FIREBASE: {
    apiKey: "AIzaSyDTX0J7Fvccv2oLvpGYYZXiHteGuiE8y8o",
    authDomain: "velalight.firebaseapp.com",
    projectId: "velalight",
    storageBucket: "velalight.firebasestorage.app",
    messagingSenderId: "1095485535268",
    appId: "1:1095485535268:web:4d17ee9de6f5acdacbd4b1"
  },
  GA4_ID: "G-XXXXXXXXXX",
  META_PIXEL_ID: "YOUR_META_PIXEL_ID",
  TIKTOK_PIXEL_ID: "YOUR_TIKTOK_PIXEL_ID"
};

/* ═══ Analytics (unchanged) ═══ */
(function(){
  if(CFG.GA4_ID.indexOf("G-")===0 && CFG.GA4_ID!=="G-XXXXXXXXXX"){
    var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id="+CFG.GA4_ID;document.head.appendChild(s);
    window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};
    gtag("js",new Date());gtag("config",CFG.GA4_ID);
  }
  if(CFG.META_PIXEL_ID.indexOf("YOUR_")!==0){
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    fbq("init",CFG.META_PIXEL_ID);fbq("track","PageView");
  }
  if(CFG.TIKTOK_PIXEL_ID.indexOf("YOUR_")!==0){
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(CFG.TIKTOK_PIXEL_ID);ttq.page();}(window,document,"ttq");
  }
})();

function track(ev,d={}){
  try{window.gtag&&gtag("event",ev,{...d,currency:"EGP"})}catch(e){}
  try{window.fbq&&fbq("track",{view_item:"ViewContent",add_to_cart:"AddToCart",begin_checkout:"InitiateCheckout",purchase:"Purchase",search:"Search"}[ev]||ev,d)}catch(e){}
  try{window.ttq&&ttq.track({purchase:"CompletePayment"}[ev]||ev,d)}catch(e){}
}

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let LANG=localStorage.getItem("vl_lang")||"ar";
const money=n=>Number(n||0).toLocaleString("en-US")+" "+(LANG==="en"?"EGP":"ج.م");

/* ═══════════════════════════════════════════════════════════
   ✨ CDN — مع آلية كسر الكاش (Cache Busting)
   ملاحظة للأدمن: تم رفع الإصدار إلى v5 لدعم الفيديو والتثبيت
   ═══════════════════════════════════════════════════════════ */
const IMG_CACHE_VERSION = "v5"; 

const CDN=u=>{
  if(!u) return "";
  if(u.startsWith("data:")||u.startsWith("http")) return u;
  return `https://velalight.github.io/${u}?v=${IMG_CACHE_VERSION}`;
};

function toast(m){
  if(!$("#toasts")) return;
  const d=document.createElement("div");
  d.className="toast";
  d.textContent=m;
  $("#toasts").appendChild(d);
  setTimeout(()=>d.remove(),3200);
}

const CATS={
  ar:{all:"كل الشموع",wood:"شموع خشبية",glass:"شموع زجاجية",crystal:"شموع كريستالية",metal:"شموع معدنية",massage:"شموع المساج",gift:"الهدايا",bride:"بوكس العروسة"},
  en:{all:"All Candles",wood:"Wooden Candles",glass:"Glass Candles",crystal:"Crystal Candles",metal:"Metal Candles",massage:"Massage Candles",gift:"Gifts",bride:"Bride Box"}
};
const cat=k=>CATS[LANG][k]||k;

const SCENTS=[["فانيليا","Vanilla"],["موكا","Mocha"],["كراميل","Caramel"],["قرفة","Cinnamon"],["عنبر","Amber"],["عود","Oud"],["قهوة","Coffee"],["أناناس","Pineapple"],["كوكونات","Coconut"],["كاريبيان فروت","Caribbean Fruit"],["مانجو","Mango"],["توت","Berry"],["ورد","Rose"],["ياسمين","Jasmine"],["فل","Arabian Jasmine"],["لافندر","Lavender"],["مسك أبيض","White Musk"],["ساندال وود","Sandalwood"],["باتشولي","Patchouli"]];
const scentTr=n=>{const f=SCENTS.find(s=>s[0]===n||s[1]===n);return f?(LANG==="en"?f[1]:f[0]):n};

const GOVS=["القاهرة","الجيزة","الإسكندرية","القليوبية","الدقهلية","الشرقية","الغربية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","شمال سيناء","جنوب سيناء","البحر الأحمر","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","الوادي الجديد","مطروح"];
const GOVS_EN=["Cairo","Giza","Alexandria","Qalyubia","Dakahlia","Sharqia","Gharbia","Menoufia","Beheira","Kafr El Sheikh","Damietta","Port Said","Ismailia","Suez","North Sinai","South Sinai","Red Sea","Fayoum","Beni Suef","Minya","Assiut","Sohag","Qena","Luxor","Aswan","New Valley","Matrouh"];

const STATUS=["قيد المراجعة","جاري التجهيز","تم الشحن","تم التسليم","ملغي"];

const D=864e5,NOW=Date.now();
const PRODUCTS=[
  {id:"1",name:"الشمعة الفاخرة (مجموعة 3 شموع)",nameEn:"Luxury Candle Set (3 Candles)",cat:"wood",price:650,old:750,badge:"خصم",badgeEn:"Sale",hours:"3 شموع × 72 ساعة",hoursEn:"3 candles × 72h",scents:["عود","فانيليا","مسك أبيض"],img:"RRRR.jpg",imgs:["RRRR.jpg","RRRRR.jpg","RRRRRR.jpg","RR.jpg","RRR.jpg"],sold:0,createdAt:NOW-1*D,desc:"ثلاث شموع فاخرة في مجموعة واحدة، صُممت لتتناغم معًا كسيمفونية من الضوء والعطر.",descEn:"Three luxury candles in one curated set."},
  {id:"2",name:"شمعة نبضين",nameEn:"Two Heartbeats Candle",cat:"wood",price:650,old:750,badge:"خصم",badgeEn:"Sale",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["ورد","فانيليا","مسك أبيض"],img:"heart2.jpg",imgs:["heart2.jpg","heart3.jpg","heart1.jpg"],sold:0,createdAt:NOW-2*D,desc:"ليست مجرد شمعة... بل قطعة تُحاكي المشاعر.",descEn:"More than a candle — a piece that echoes emotions."},
  {id:"3",name:"جولدن كاندل",nameEn:"Golden Candle Set",cat:"glass",price:2850,old:3600,badge:"خصم",badgeEn:"Sale",hours:"3 شموع × 96 ساعة",hoursEn:"3 candles × 96h",scents:["عنبر","عود","كراميل"],img:"candle1.jpg",imgs:["candle1.jpg","candle2.jpg","candle3.jpg","candle4.jpg","candle5.jpg"],sold:0,createdAt:NOW-3*D,desc:"مجموعة من ثلاث شموع في أوانٍ زجاجية فاخرة.",descEn:"A set of three candles in luxurious glass vessels."},
  {id:"4",name:"شمعة الأيس كوفي",nameEn:"Iced Coffee Candle",cat:"glass",price:425,old:550,badge:"خصم",badgeEn:"Sale",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["قهوة","موكا","فانيليا"],img:"iccoffe1.jpg",imgs:["iccoffe1.jpg","iccoffe2.jpg","iccoffe3.jpg","iccoffe4.jpg"],sold:0,createdAt:NOW-4*D,desc:"شمعة آيس كوفي صُنعت لتأخذك إلى هدوء المقاهي الراقية.",descEn:"Iced coffee candle for calm moments."},
  {id:"5",name:"شمعة المانديلا",nameEn:"Mandala Candle",cat:"metal",price:325,old:0,badge:"الأكثر مبيعًا",badgeEn:"Best Seller",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["عود","عنبر","قرفة"],img:"mandle.jpg",imgs:["mandle.jpg"],sold:0,createdAt:NOW-5*D,desc:"الأكثر مبيعًا... والأقرب إلى كل بيت يعشق التفاصيل الراقية.",descEn:"The best-seller."},
  {id:"6",name:"شمعة المساج",nameEn:"Massage Candle",cat:"metal",price:325,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","ياسمين","كوكونات"],img:"gift1.jpg",imgs:["gift1.jpg","gift2.jpg","gift3.jpg","gift4.jpg","gift5.jpg","gift6.jpg","gift7.jpg"],sold:0,createdAt:NOW-6*D,desc:"تجربة عناية فاخرة تبدأ بوهجٍ هادئ وتنتهي ببشرة أكثر نعومة.",descEn:"A luxury care experience."},
  {id:"7",name:"شمعة كريستال ذهبية",nameEn:"Crystal Gold Candle",cat:"crystal",price:750,old:900,badge:"خصم",badgeEn:"Sale",hours:"96 ساعة اشتعال",hoursEn:"96h burn time",scents:["عنبر","ورد","مسك أبيض"],img:"candle13.jpg",imgs:["candle13.jpg"],sold:0,createdAt:NOW-7*D,desc:"قطعة استثنائية في إناء كريستال فاخر.",descEn:"An exceptional piece in a luxury crystal vessel."},
  {id:"8",name:"بلو كريستال",nameEn:"Blue Crystal",cat:"crystal",price:720,old:0,badge:"",badgeEn:"",hours:"96 ساعة اشتعال",hoursEn:"96h burn time",scents:["توت","أناناس","لافندر"],img:"candle14.jpg",imgs:["candle14.jpg"],sold:0,createdAt:NOW-8*D,desc:"شمعة كريستالية بلون أزرق أنيق.",descEn:"A crystal candle with elegant blue color."},
  {id:"9",name:"لافندر (جلاس)",nameEn:"Lavender (Glass)",cat:"glass",price:430,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","باتشولي","مسك أبيض"],img:"candle9.jpg",imgs:["candle9.jpg"],sold:0,createdAt:NOW-9*D,desc:"شمعة زجاجية بعطر اللافندر الفرنسي المهدئ.",descEn:"A glass candle with calming French lavender scent."},
  {id:"10",name:"ياسمين (جلاس)",nameEn:"Jasmine (Glass)",cat:"glass",price:440,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["ياسمين","فل","ورد"],img:"candle10.jpg",imgs:["candle10.jpg"],sold:0,createdAt:NOW-10*D,desc:"شمعة زجاجية بعطر الياسمين النقي.",descEn:"A glass candle with pure jasmine scent."},
  {id:"11",name:"فانيليا (جلاس)",nameEn:"Vanilla (Glass)",cat:"glass",price:400,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["فانيليا","كراميل","موكا"],img:"candle11.jpg",imgs:["candle11.jpg"],sold:0,createdAt:NOW-11*D,desc:"شمعة زجاجية بعطر الفانيلا الكلاسيكي.",descEn:"A glass candle with classic vanilla scent."},
  {id:"12",name:"شمعة مساج ريلاكس",nameEn:"Relax Massage Candle",cat:"massage",price:380,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","فل","مسك أبيض"],img:"candle19.jpg",imgs:["candle19.jpg"],sold:0,createdAt:NOW-12*D,desc:"شمعة مساج بعطر اللافندر المهدئ.",descEn:"A massage candle with calming lavender scent."},
  {id:"13",name:"بوكس هدية فاخر",nameEn:"Luxury Gift Box",cat:"gift",price:850,old:0,badge:"",badgeEn:"",hours:"شمعة + إكسسوارات",hoursEn:"Candle + accessories",scents:["عود","عنبر","ورد"],img:"gifta.jpg",imgs:["gifta.jpg"],sold:0,createdAt:NOW-13*D,desc:"بوكس هدايا فاخر بتغليف ملكي.",descEn:"A luxury gift box with royal wrapping."},
  // ✨ تم إضافة video, pinned, pinnedAt كنموذج محلي (Fallback) لبوكس العروسة
  {id:"14",name:"بوكس العروسة",nameEn:"Bride Box",cat:"bride",price:1500,old:0,badge:"الأكثر طلبًا",badgeEn:"Most Requested",hours:"بوكس متكامل",hoursEn:"Complete box",scents:["ورد","ياسمين","مسك أبيض","فانيليا"],img:"box1.jpg",imgs:["box1.jpg"],video:"box.mp4", pinned:true, pinnedAt:Date.now(), sold:0,createdAt:NOW-14*D,desc:"أفخم بوكس عروسة.",descEn:"The most luxurious bride box."}
];

/* ═══ Placeholder SVG (للصور المكسورة) ═══ */
function ph(p){
  const T={wood:["#3a2417","#8a5a33"],glass:["#1c2a36","#7fa6c4"],crystal:["#33290f","#e2c078"],metal:["#2b2118","#c09a5e"],massage:["#2a2233","#a98cc9"],gift:["#331d1d","#d98a7e"],bride:["#33242e","#e3b7c8"]}[p.cat]||["#2b2118","#c09a5e"];
  const s=`<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><defs><radialGradient id='g' cx='50%' cy='36%' r='78%'><stop offset='0%' stop-color='${T[1]}' stop-opacity='.5'/><stop offset='58%' stop-color='${T[0]}'/><stop offset='100%' stop-color='#120d0a'/></radialGradient><linearGradient id='j' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${T[1]}' stop-opacity='.92'/><stop offset='1' stop-color='${T[0]}'/></linearGradient></defs><rect width='900' height='900' fill='url(#g)'/><ellipse cx='450' cy='320' rx='150' ry='170' fill='#ffb757' opacity='.10'/><ellipse cx='450' cy='340' rx='75' ry='95' fill='#ffcf7d' opacity='.13'/><path d='M450 296 q28 36 0 66 q-28 -30 0 -66' fill='#ffcf7d'/><rect x='445' y='360' width='10' height='32' rx='4' fill='#241610'/><rect x='328' y='392' width='244' height='292' rx='28' fill='url(#j)'/><rect x='328' y='392' width='244' height='292' rx='28' fill='#fff' opacity='.05'/><rect x='352' y='474' width='196' height='122' rx='12' fill='#0f0a08' opacity='.58'/><text x='450' y='528' font-family='Georgia' font-size='34' fill='#e9c87a' text-anchor='middle'>VelaLight</text><text x='450' y='566' font-family='Georgia' font-size='16' fill='#cbb287' text-anchor='middle'>Luxury Candle</text></svg>`;
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s);
}

const imgsOf=p=>{
  if(!p) return [];
  if(Array.isArray(p.imgs) && p.imgs.length > 0){
    return p.imgs.filter(x=>x && String(x).trim());
  }
  if(Array.isArray(p.images) && p.images.length > 0){
    return p.images.filter(x=>x && String(x).trim());
  }
  if(p.img){
    const str=String(p.img).trim();
    if(str.includes(",")){
      return str.split(",").map(s=>s.trim()).filter(Boolean);
    }
    return [str];
  }
  return [];
};

const imgOf=p=>{
  const a=imgsOf(p);
  if(!a.length) return ph(p);
  return CDN(a[0]);
};

const pname=p=>LANG==="en"?(p.nameEn||p.en||p.name):p.name;
const pdesc=p=>LANG==="en"?(p.descEn||p.desc||""):(p.desc||"");
const phours=p=>LANG==="en"?(p.hoursEn||p.hours||"72h"):(p.hours||"72 ساعة");
const pbadge=p=>LANG==="en"?(p.badgeEn||p.badge||""):(p.badge||"");

const LocalDB={
  k:c=>"vl_"+c,
  g(c){try{return JSON.parse(localStorage.getItem(this.k(c)))||[]}catch(e){return[]}},
  s(c,v){try{localStorage.setItem(this.k(c),JSON.stringify(v))}catch(e){}},
  async list(c){return this.g(c)},
  async add(c,d){const a=this.g(c);d.id="l"+Date.now()+Math.random().toString(16).slice(2,7);a.push(d);this.s(c,a);return d.id},
  async update(c,id,d){this.s(c,this.g(c).map(x=>x.id===id?{...x,...d}:x))},
  async remove(c,id){this.s(c,this.g(c).filter(x=>x.id!==id))}
};

let DB=LocalDB,CLOUD=false;
window.addEventListener("fb-ready",()=>{
  DB=window.FB;
  CLOUD=true;
  const tg=$("#dbModeTag");
  if(tg) tg.textContent="☁️ Firestore متصل";
  window.dispatchEvent(new Event("data-refresh"));
});

let ALL_PRODUCTS=[],ALL_REVIEWS=[],dbProductsCache=[];

async function loadAll(){
  try{
    dbProductsCache=await DB.list("products");
    if(!Array.isArray(dbProductsCache)) dbProductsCache=[];
  }catch(e){
    console.warn("⚠️ Firebase failed, using local PRODUCTS",e);
    dbProductsCache=[];
  }
  
  const map=new Map();
  PRODUCTS.forEach(p=>{
    if(p&&p.id) map.set(p.id,{...p});
  });
  
  // ✨ الدمج الكامل يضمن مرور حقول video, pinned, pinnedAt من Firebase بسلاسة
  dbProductsCache.forEach(d=>{
    const slug=d.id_||d.slug||d.pid||d.id;
    if(!slug) return;
    if(d.active===false){map.delete(slug);return;}
    map.set(slug,{...(map.get(slug)||{}),...d,id:slug,_fid:d.id||null});
  });
  
  ALL_PRODUCTS=[...map.values()];
  
  try{
    localStorage.setItem("vl_products_v3",JSON.stringify(ALL_PRODUCTS.slice(0,200)));
    localStorage.setItem("vl_products_v3_time",String(Date.now()));
  }catch(e){}
  
  let dr=[];
  try{dr=await DB.list("reviews")}catch(e){}
  ALL_REVIEWS=[...(typeof SEED_REVIEWS!=="undefined"?SEED_REVIEWS:[]),...dr];
}

function loadFromCache(){
  ALL_PRODUCTS=[...PRODUCTS];
  try{
    const cached=JSON.parse(localStorage.getItem("vl_products_v3")||"[]");
    const cachedTime=Number(localStorage.getItem("vl_products_v3_time")||"0");
    if(Array.isArray(cached) && cached.length>0 && (Date.now()-cachedTime)<3600000){
      const map=new Map(ALL_PRODUCTS.map(p=>[p.id,p]));
      cached.forEach(c=>{
        if(!c||!c.id) return;
        const existing=map.get(c.id);
        if(!existing) return;
        // تحديث الحقول الديناميكية فقط للحفاظ على بيانات GitHub الطازجة
        if(c.sold!==undefined) existing.sold=c.sold;
        if(c.stock!==undefined) existing.stock=c.stock;
        if(c.active!==undefined) existing.active=c.active;
        
        // ✨ إضافة دعم حقول التثبيت والفيديو من الكاش المحلي
        if(c.pinned!==undefined) existing.pinned=c.pinned;
        if(c.pinnedAt!==undefined) existing.pinnedAt=c.pinnedAt;
        if(c.video!==undefined) existing.video=c.video;
      });
      return true;
    }
  }catch(e){}
  return false;
}

loadFromCache();

const prodReviews=s=>ALL_REVIEWS.filter(r=>(r.productSlug||r.pid)===String(s)&&r.approved!==false);
const ratingOf=s=>{const r=prodReviews(s);if(!r.length)return null;return{avg:+(r.reduce((a,b)=>a+(+b.rating||5),0)/r.length).toFixed(1),count:r.length}};

const SEED_REVIEWS=[];

const getCart=()=>{try{return JSON.parse(localStorage.getItem("vl_cart")||"[]")}catch(e){return[]}};
const saveCart=c=>{
  try{localStorage.setItem("vl_cart",JSON.stringify(c))}catch(e){}
  cartBadge();
};

function cartBadge(){
  const b=$("#cartCount");
  if(!b) return;
  const n=getCart().reduce((a,i)=>a+(i.qty||0),0);
  b.textContent=n;
}

function addToCart(p,opt={}){
  const c=getCart(),scent=opt.scent||((p.scents||[])[0]||"—");
  const ex=c.find(i=>i.id===p.id&&i.scent===scent);
  if(ex) ex.qty+=opt.qty||1;
  else c.push({id:p.id,name:p.name,nameEn:p.nameEn,price:p.price,qty:opt.qty||1,scent,img:imgOf(p)});
  saveCart(c);
  toast(t("t_added"));
  track("add_to_cart",{items:[{item_id:p.id,item_name:p.name,price:p.price}]});
}

const I18N={
  ar:{
    docTitle:"VelaLight | شموع يدوية فاخرة",
    docDesc:"VelaLight — شموع يدوية فاخرة",

    mq:"🚚 توصيل سريع &nbsp;•&nbsp; 🏷️ خصومات &nbsp;•&nbsp; 🎁 تغليف مجاني &nbsp;•&nbsp; 📦 شحن آمن &nbsp;•&nbsp;",

    nav_home:"الرئيسية",
    nav_shop:"تسوق",
    nav_about:"من نحن",
    nav_faq:"الأسئلة الشائعة",
    nav_contact:"تواصل معنا",

    cat_all:"كل الشموع",
    cat_wood:"شموع خشبية",
    cat_glass:"شموع زجاجية",
    cat_crystal:"شموع كريستالية",
    cat_metal:"شموع معدنية",
    cat_massage:"شموع المساج",
    cat_gift:"الهدايا",
    cat_bride:"بوكس العروسة",

    mn_cats:"تصنيفات الشموع",
    mn_explore:"اكتشف",
    mn_scents:"العطور الفاخرة",
    mn_occ:"المناسبات والهدايا",
    mn_why:"لماذا VelaLight؟",
    mn_rev:"آراء عملائنا",
    mn_track:"📦 تتبع الطلب",
    mn_contact:"تواصل",

    hero_kick:"✦ شموع يدوية فاخرة · صناعة مصرية",
    hero_a:"ضوء يُحكى…",
    hero_b:"وبريق يليق بكِ",
    hero_lead:"في VelaLight كل شمعة اتصنعت يدويًا بعناية.",
    cta_shop:"اكتشفي The Collection ✨",
    cta_story:"Our Story",

    hero_eyebrow:"✦ شموع يدوية فاخرة",
    hero_t1:"ضوءٌ",
    hero_t2:"يُشبهكِ.",
    hero_desc:"شموع تُضيء… لتنير يومكِ بلحظاتٍ تستحقينها.",
    hero_btn1:"اكتشفي السحر ✨",
    hero_btn2:"رحلة العطور",
    hero_s1_v:"23",
    hero_s1_t:"نوتة",
    hero_s2:"صناعة يدوية",
    hero_s3:"فنٌ يُقتنى",
    hero_card:"VelaLight",

    trust1:"🚚 توصيل لكل مصر",
    trust2:"🤲 100% صناعة يدوية",
    trust3:"🎁 تغليف هدايا مجاني",
    trust4:"📦 شحن آمن وموثوق",

    prod_h2:"اختار قطعتك المفضلة",
    price_lbl:"💰 السعر:",
    from_ph:"من",
    to_ph:"إلى",
    sort_lbl:"ترتيب:",
    sort_new:"الأحدث",
    sort_asc:"الأرخص أولًا",
    sort_desc:"الأغلى أولًا",
    sort_rating:"الأعلى تقييمًا",
    sort_best:"الأكثر مبيعًا",
    sort_disc:"أكبر خصم",

    prod_word:"منتج",
    add_cart:"+ أضيفي للسلة",
    view_details:"👁️ عرض التفاصيل",
    no_products:"🕯️ مفيش منتجات",

    badge_sale:"خصم",
    badge_best:"الأكثر مبيعًا",
    badge_featured:"مميز",
    badge_most:"الأكثر طلبًا",
    badge_new:"جديد",
    badge_out:"نفدت الكمية",

    stock_left:"⚡ باقي {n} فقط — اطلبي الآن!",
    stock_available:"متاح",
    stock_out:"نفدت الكمية",

    about_h2:"من نحن",
    about_p1:"حكايتنا بدأت من حبنا للتفاصيل الصغيرة… من إيماننا إن نور بسيط ممكن يهدّي الروح، وإن ريحة حلوة ممكن تاخدك في لحظة لذكرى بتحبيها.\n\nومع الوقت، الشغف ده كبر وبقى ورشة بنشتغل فيها على كل شمعة بهدوء وحب، وكل قطعة بتتعمل بإيدينا، واحدة واحدة… زي رسالة بنكتبها لحد غالي علينا.",

    about_p2:"بنختار لكِ شمع طبيعي ونقي، وفتايل خشب وقطن آمنة ومناسبة لبيتك، ونستخدم أرقى العطور بعناية، عشان كل شمعة يكون لها حضورها الخاص وإحساسها المختلف.\n\nوبنهتم بكل تفصيلة لحد آخر خطوة، من أول الشمعة لحد التغليف… لأننا مؤمنين إن الأناقة الحقيقية بتبدأ من التفاصيل.\n\nشموعنا مش معمولة عشان تتستخدم وخلاص… هي معمولة عشان تعيشي معاها لحظة.\n\nتنور ركن بتحبيه، تكمل فرحتك في يوم مميز، أو تضيف لمسة دافية ليوم عادي وتخليه أحلى.\n\nVelaLight… نور يشبهكِ، وعطر يفضل فاكرِك.",

    stat_clients:"عميلة سعيدة",
    stat_scents:"عطر مميز",
    stat_hand:"صناعة يدوية",

    scents_h2:"العطور الفاخرة",
    scents_sub:"كل العطور متاحة",

    occ_h2:"هدية لكل مناسبة",
    occ1t:"أعياد الميلاد",
    occ1d:"هدية استثنائية.",
    occ2t:"الزفاف والخطوبة",
    occ2d:"توزيعات رومانسية.",
    occ3t:"ركن المنزل",
    occ3d:"دفء يحتضن التفاصيل.",
    occ4t:"بوكسات الهدايا",
    occ4d:"تنسيق بعناية.",

    feat_h2:"لماذا VelaLight؟",
    feat1t:"توصيل لكل المحافظات",
    feat1d:"بنوصل طلبك.",
    feat2t:"خامات طبيعية 100%",
    feat2d:"شمع طبيعي.",
    feat3t:"صناعة يدوية",
    feat3d:"ساعات من العناية.",
    feat4t:"تغليف فاخر",
    feat4d:"تنسيق راقٍ.",
    feat5t:"جودة عالية",
    feat5d:"نهتم بأدق التفاصيل لتقديم أفضل تجربة.",
    feat6t:"دعم دائم",
    feat6d:"هنساعدك تختاري.",

    faq_h2:"الأسئلة الشائعة",

faq1q:"كيف يمكنني الطلب وما طرق الدفع المتاحة؟",
faq1a:"يمكنك إضافة المنتجات إلى سلة الشراء وإتمام طلبك بسهولة. يتم دفع قيمة المنتجات مقدمًا عبر InstaPay أو Vodafone Cash أو تحويل بنكي، بينما تُدفع تكلفة الشحن نقدًا لمندوب التوصيل عند الاستلام.",

faq2q:"هل تقومون بالشحن إلى جميع محافظات مصر؟",
faq2a:"نعم، نوفر خدمة التوصيل إلى جميع محافظات مصر، مع الحرص على وصول طلبك بأمان.",

faq3q:"كم تستغرق مدة تجهيز وشحن الطلب؟",
faq3a:"لأن منتجات VelaLight تُصنع يدويًا بعناية، تستغرق مدة التجهيز عادةً من 3 إلى 7 أيام عمل، بالإضافة إلى مدة الشحن حسب المحافظة.",

faq4q:"هل شموع VelaLight مصنوعة من شمع الصويا؟",
faq4a:"نعم، نستخدم شمع الصويا الطبيعي 100%، الذي يتميز باحتراق أبطأ وأنظف ويساعد على انتشار العطر بكفاءة.",

faq5q:"كم تبلغ مدة احتراق الشمعة وكيف أحافظ على أفضل أداء لها؟",
faq5a:"تختلف مدة الاحتراق حسب وزن وحجم كل شمعة، وستجدين التفاصيل في وصف المنتج. ولأفضل نتيجة، عند الاستخدام الأول اتركي الشمعة حتى يذوب سطح الشمع بالكامل ويصل إلى الحواف لتجنب تكون الأنفاق والحصول على احتراق متساوٍ.",

faq6q:"كيف أختار العطر المناسب؟",
faq6a:"لدينا تشكيلة متنوعة من العطور الفاخرة. وإذا كنتِ محتارة، تواصلي معنا عبر WhatsApp وسنساعدك في اختيار العطر المناسب حسب ذوقك والمناسبة والأجواء التي تفضلينها.",

faq7q:"هل تتوفر خدمة تغليف الهدايا؟",
faq7a:"نعم، جميع منتجات VelaLight تأتي بتغليف أنيق وفاخر وجاهز للإهداء.",

faq8q:"ما سياسة الاستبدال والاسترجاع؟",
faq8a:"نظرًا لطبيعة منتجاتنا المصنوعة يدويًا، لا يمكن الاستبدال أو الاسترجاع بعد فتح المنتج أو استخدامه، أو بسبب تغيير الرغبة بعد تأكيد الطلب. وفي حالة وصول المنتج بعيب مصنعي أو تلف بسبب الشحن، يرجى التواصل معنا خلال 24 ساعة من الاستلام وسنعمل على حل المشكلة.",
    
    rev_h2:"آراء عملائنا",
    rev_sub:"ثقتكم أجمل هدية",
    rev_verified:"عميلة موثّقة",
    rev_eyebrow:"💛 كلامكم أحلى هدية",
    rev_title:"آراء عملائنا",
    rev_body:"مش بنكتب كلام، بنعرض الحقيقة. دي لقطات حقيقية من محادثات عملائنا بعد ما استلموا طلباتهم.",
    rev_cta:"✨ جربتي سحرنا؟",
    rev_cta_link:"ابعتيلنا رأيك على الواتساب",

    foot_tag1:"شموع يدوية فاخرة",
    foot_tag2:"Luxury handmade candles",
    foot_quick:"روابط سريعة",
    foot_home:"الرئيسية",
    foot_shop:"تسوق",
    foot_wishlist:"❤️ المفضلة",
    foot_orders:"📦 طلباتي",
    foot_story:"من نحن",
    foot_faq:"الأسئلة الشائعة",
    foot_contact:"تواصل معنا",

    foot_admin:"لوحة التحكم",
    foot_pay_h:"الدفع والشحن",
    pay_title:"InstaPay — تحويل مقدم",
    foot_pay_note:"قيمة المنتجات تُدفع عبر InstaPay مقدمًا، والشحن كاش عند الاستلام.",

    foot_designed:"🛠️ صُمم وصُنع بواسطة",
    foot_designer_cta:"⚡ عايز موقع احترافي زي ده لمشروعك؟",
    foot_designer_link:"تواصل معانا النهاردة",
    foot_rights:"© 2026 - 2030 VelaLight — جميع الحقوق محفوظة",

    foot_exchange:"سياسة الشحن",
    foot_privacy:"سياسة الخصوصية",
    foot_terms:"شروط الاستخدام",

    shipping:"الشحن",
    ship_all:"— لكل المحافظات",
    egp:"ج.م",
    subtotal:"المجموع",
    total:"الإجمالي",

    cart_title:"🛍️ سلة الشراء",
    delivery_h:"بيانات التوصيل",
    ph_name:"الاسم بالكامل *",
    ph_phone:"رقم الموبايل *",
    ph_phone2:"رقم الموبايل",
    ph_city:"اختاري المحافظة",
    ph_addr:"العنوان بالتفصيل *",
    ph_addr2:"العنوان",
    ph_notes:"ملاحظات",

    paymethod_h:"طريقة الدفع: InstaPay",
    paymethod_d:"InstaPay مقدمًا، والشحن كاش عند الاستلام.",
    checkout_wa:"✅ إتمام الطلب عبر واتساب",
    empty_cart:"🗑️ إفراغ السلة",
    cart_empty:"سلتك فاضية 🕯️",
    cart_empty_sub:"اكتشفي The Collection",
    scent_lbl:"العطر:",

    acc_title:"حسابي 👤",
    acc_sub:"سجّل بياناتك.",
    save_acc:"حفظ",
    orders_count:"عدد طلباتك:",
    logout:"تسجيل خروج",

    search_title:"البحث 🔍",
    search_ph:"ابحثي عن شمعة...",
    search_help:"البحث يشمل الاسم والوصف والتصنيف.",

    trk_h2:"📦 تتبع طلبك",
    trk_id_ph:"رقم الطلب",
    trk_phone_ph:"رقم الموبايل",
    trk_btn:"تتبع الطلب",
    trk_order:"طلب",
    trk_cancelled:"❌ الطلب ملغي",
    trk_total:"الإجمالي",
    trk_searching:"⏳ بنبحث...",
    trk_notfound:"😕 مش لاقيين الطلب",

    st1:"قيد المراجعة",
    st2:"جاري التجهيز",
    st3:"تم الشحن",
    st4:"تم التسليم",
    st5:"ملغي",

    pd_scent_t:"🌸 اختاري العطر:",
    pd_required:"مطلوب",
    pd_qty_t:"الكمية:",
    pd_add:"🛍️ أضيفي للسلة",
    pd_buy:"اطلبي عبر واتساب",

    pd_hours:"مدة الاشتعال:",
    pd_materials:"الخامات:",
    pd_ship:"التوصيل:",
    pd_ship_v:"3–7 أيام",
    pd_materials_v:"شمع طبيعي 100%",
    pd_gift:"تغليف هدايا مجاني",
    pd_gift_v:"مع كل طلب",
    pd_exchange:"جودة عالية",
    pd_exchange_v:"خامات طبيعية وآمنة",

    pd_desc:"📝 الوصف",
    pd_specs:"📋 المواصفات",
    pd_reviews_tab:"⭐ المراجعات",
    pd_reviews_count:"المراجعات",

    spec_burn:"مدة الاحتراق",
    spec_scents:"العطور المتاحة",
    spec_category:"التصنيف",
    spec_made:"الصناعة",
    spec_wax:"نوع الشمع",
    spec_wick:"الفتيل",

    gallery_count:"من",
    gallery_zoom:"تكبير الصورة",
    gallery_next:"الصورة التالية",
    gallery_prev:"الصورة السابقة",
    gallery_close:"إغلاق",
    gallery_share:"مشاركة",
    copy_link:"📋 نسخ الرابط",
    copied:"✅ تم نسخ الرابط",

    share:"مشاركة:",
    share_whatsapp:"WhatsApp",
    share_facebook:"Facebook",
    share_twitter:"Twitter",

    crumb_home:"الرئيسية",

    pd_rev_h2:"مراجعات المنتج",
    pd_first:"كوني أول من يراجع",
    pd_form_t:"ضيفي مراجعتك ⭐",
    pd_name_ph:"اسمك",
    pd_text_ph:"اكتبي رأيك...",
    pd_photo_ph:"رابط صورة",
    pd_submit:"إرسال",
    pd_note:"المراجعة بتظهر بعد الموافقة",

    pd_rel_h2:"✨ منتجات هتعجبك",
    pd_notfound:"😕 المنتج مش موجود",
    pd_sold:"تم بيعه",
    pd_times:"مرة",

    pd_payment_title:"الدفع عبر InstaPay",
    pd_payment_desc:"قيمة المنتجات تُدفع مقدماً عند تأكيد الطلب",
    pd_shipping_title:"الشحن كاش عند الاستلام",
    pd_shipping_desc:"تكلفة التوصيل تُدفع لمندوب الشحن عند وصول الطلب",
    pd_handmade:"✦ قطعة يدوية تُجهّز بعناية عند الطلب — كل شمعة فريدة ومميزة",

    stock_remaining:"⚡ باقي {n} فقط — اطلبي الآن!",

    chat_name:"مساعد VelaLight",
    chat_sub:"دليلك الشخصي",
    chat_welcome:"أهلًا بيكِ ✨",
    q_gift:"اقترح لي هدية",
    q_relax:"عايزة حاجة للاسترخاء",
    q_scents:"إيه العطور المتاحة؟",
    q_ship:"سؤال عن التوصيل",
    q_bride:"بوكس عروسة",

    a_gift:"أكيد أساعدك! 🎁",
    a_relax:"للاسترخاء بنرشح شموع المساج 🧖‍♀️",
    a_scents:"عندنا 19 عطر 🌸",
    a_ship:"🚚 بنوصل لكل مصر خلال 3–7 أيام.",
    a_bride:"عقبال فرحك! 👰",

    t_added:"🕯️ تم الإضافة",
    t_fill:"⚠️ كمّلي البيانات",
    t_empty:"السلة فاضية 🕯️",
    t_order:"✅ تم تسجيل طلبك",
    t_revok:"💛 شكرًا!",
    t_revwarn:"⚠️ اكتبي اسمك ومراجعتك",
    t_trkwarn:"⚠️ دخّلي رقم الطلب",
    t_saved:"💾 تم الحفظ",
    t_lang_ar:"تم التحويل للعربية",
    t_lang_en:"English",
    t_confirm_empty:"هتفضّي السلة؟",
    t_confirm_del:"متأكدة؟",
    t_go_cart:"🛍️ اذهبي للسلة",

    wa_head:"🕯️ طلب جديد",
    wa_order:"🧾 رقم الطلب:",
    wa_scent:"العطر",
    wa_total:"💰 الإجمالي:",
    wa_ship:"🚚 الشحن:",
    wa_cod:"(كاش)",
    wa_insta:"💳 InstaPay:",
    wa_name:"👤 الاسم:",
    wa_phone:"📱 الموبايل:",
    wa_city:"🏙️ المحافظة:",
    wa_addr:"📍 العنوان:",
    wa_notes:"📝 ملاحظات:",
    wa_item:"🕯️ المنتج:",

    t_scentwarn:"⚠️ من فضلك اختاري العطر قبل الإضافة"
  },

  en:{
    docTitle:"VelaLight | Luxury Handmade Candles",
    docDesc:"VelaLight — Luxury handmade candles.",

    mq:"🚚 Fast delivery &nbsp;•&nbsp; 🏷️ Discounts &nbsp;•&nbsp; 🎁 Free wrapping &nbsp;•&nbsp; 📦 Safe shipping &nbsp;•&nbsp;",

    nav_home:"Home",
    nav_shop:"Shop",
    nav_about:"Our Story",
    nav_faq:"FAQ",
    nav_contact:"Contact",

    cat_all:"All Candles",
    cat_wood:"Wooden Candles",
    cat_glass:"Glass Candles",
    cat_crystal:"Crystal Candles",
    cat_metal:"Metal Candles",
    cat_massage:"Massage Candles",
    cat_gift:"Gifts",
    cat_bride:"Bride Box",

    mn_cats:"Candle Categories",
    mn_explore:"Explore",
    mn_scents:"Luxury Scents",
    mn_occ:"Occasions & Gifts",
    mn_why:"Why VelaLight?",
    mn_rev:"Customer Reviews",
    mn_track:"📦 Track Order",
    mn_contact:"Contact",

    hero_kick:"✦ Luxury Handmade Candles · Made in Egypt",
    hero_a:"A Light That Tells a Story…",
    hero_b:"& a Sparkle That Suits You",
    hero_lead:"Every candle is handcrafted with care.",
    cta_shop:"Discover The Collection ✨",
    cta_story:"Our Story",

    hero_eyebrow:"✦ Luxury Handmade Candles",
    hero_t1:"A Light",
    hero_t2:"That Resembles You.",
    hero_desc:"Candles that shine… to brighten your day with moments you deserve.",
    hero_btn1:"Discover the Magic ✨",
    hero_btn2:"Fragrance Journey",
    hero_s1_v:"23",
    hero_s1_t:"Notes",
    hero_s2:"Handmade",
    hero_s3:"Art to Own",
    hero_card:"VelaLight",

    trust1:"🚚 Delivery all over Egypt",
    trust2:"🤲 100% Handmade",
    trust3:"🎁 Free Gift Wrapping",
    trust4:"📦 Safe & Reliable Shipping",

    prod_h2:"Choose Your Favorite",
    price_lbl:"💰 Price:",
    from_ph:"From",
    to_ph:"To",
    sort_lbl:"Sort:",
    sort_new:"Newest",
    sort_asc:"Low to High",
    sort_desc:"High to Low",
    sort_rating:"Top Rated",
    sort_best:"Best Selling",
    sort_disc:"Biggest Discount",

    prod_word:"products",
    add_cart:"+ Add to Cart",
    view_details:"👁️ View Details",
    no_products:"🕯️ No products",

    badge_sale:"Sale",
    badge_best:"Best Seller",
    badge_featured:"Featured",
    badge_most:"Most Requested",
    badge_new:"New",
    badge_out:"Sold Out",

    stock_left:"⚡ Only {n} left — Order now!",
    stock_available:"Available",
    stock_out:"Sold Out",

    about_h2:"Our Story",
    about_p1:"Our story began with a love for the little details… with a belief that a simple light can calm the soul, and that a lovely scent can take you — in a moment — back to a memory you love.\n\nWith time, that passion grew into a workshop where we make every candle slowly and with love. Every piece is made by our hands, one by one… like a letter written to someone dear.",

    about_p2:"We choose for you pure natural wax, safe wood and cotton wicks that suit your home, and we blend the finest scents with care — so every candle has its own presence and its own feeling.\n\nAnd we care for every detail all the way to the last step, from the candle itself to the wrapping… because we believe true elegance starts from the details.\n\nOur candles aren't made just to be used… they're made for you to live a moment with them.\n\nTo light up a corner you love, to complete your joy on a special day, or to add a warm touch to an ordinary day and make it prettier.\n\nVelaLight… a light that feels like you, and a scent that keeps remembering you.",

    stat_clients:"Happy Clients",
    stat_scents:"Signature Scents",
    stat_hand:"Handmade",

    scents_h2:"Luxury Scents",
    scents_sub:"All scents available",

    occ_h2:"A Gift for Every Occasion",
    occ1t:"Birthdays",
    occ1d:"Exceptional gifts.",
    occ2t:"Weddings & Engagements",
    occ2d:"Romantic arrangements.",
    occ3t:"Home Corners",
    occ3d:"Warmth that embraces every detail.",
    occ4t:"Gift Boxes",
    occ4d:"Curated with care.",

    feat_h2:"Why VelaLight?",
    feat1t:"Delivery Everywhere",
    feat1d:"We deliver your order.",
    feat2t:"100% Natural Materials",
    feat2d:"Pure natural wax.",
    feat3t:"Handmade",
    feat3d:"Hours of care.",
    feat4t:"Luxury Wrapping",
    feat4d:"Elegant arrangement.",
    feat5t:"Premium Quality",
    feat5d:"We care about every detail for the best experience.",
    feat6t:"Dedicated Support",
    feat6d:"We'll help you choose.",

    faq_h2:"Frequently Asked Questions",
    faq1q:"How long does delivery take?",
    faq1a:"3–7 business days.",
    faq2q:"How do I pay?",
    faq2a:"InstaPay upfront, shipping cash on delivery.",
    faq3q:"Are the materials safe?",
    faq3a:"Yes, we use 100% natural wax and completely safe cotton and wooden wicks.",
    faq4q:"Are the materials natural?",
    faq4a:"100% natural wax.",
    faq5q:"How long does the candle burn?",
    faq5a:"72 to 96 hours.",
    faq6q:"Can I choose the scent?",
    faq6a:"Absolutely! All scents are available.",

    rev_h2:"Our Customers' Reviews",
    rev_sub:"Your Words Are the Best Gift",
    rev_verified:"Verified Customer",
    rev_eyebrow:"💛 Your Words Are the Best Gift",
    rev_title:"Our Customers' Reviews",
    rev_body:"We don't just write words — we show the truth. These are real screenshots from our customers' conversations after receiving their orders.",
    rev_cta:"✨ Tried our magic?",
    rev_cta_link:"Send us your review on WhatsApp",

    foot_tag1:"Luxury Handmade Candles",
    foot_tag2:"Luxury handmade candles",

    foot_quick:"Quick Links",
    foot_home:"Home",
    foot_shop:"Shop",
    foot_wishlist:"❤️ Wishlist",
    foot_orders:"📦 My Orders",
    foot_story:"Our Story",
    foot_faq:"FAQ",
    foot_contact:"Contact",

    foot_admin:"Admin Dashboard",
    foot_pay_h:"Payment & Shipping",
    pay_title:"InstaPay — Upfront Payment",
    foot_pay_note:"Products are paid for upfront via InstaPay, while shipping is paid in cash on delivery.",

    foot_designed:"🛠️ Designed & Built by",
    foot_designer_cta:"⚡ Want a professional website like this for your business?",
    foot_designer_link:"Contact us today",

    foot_rights:"© 2026 - 2030 VelaLight — All Rights Reserved",

    foot_exchange:"Shipping Policy",
    foot_privacy:"Privacy Policy",
    foot_terms:"Terms of Use",

    shipping:"Shipping",
    ship_all:"— All Governorates",
    egp:"EGP",
    subtotal:"Subtotal",
    total:"Total",

    cart_title:"🛍️ Shopping Cart",
    delivery_h:"Delivery Details",
    ph_name:"Full Name *",
    ph_phone:"Mobile Number *",
    ph_phone2:"Mobile Number",
    ph_city:"Select Governorate",
    ph_addr:"Full Address *",
    ph_addr2:"Address",
    ph_notes:"Notes",

    paymethod_h:"Payment Method: InstaPay",
    paymethod_d:"InstaPay upfront, shipping cash on delivery.",
    checkout_wa:"✅ Complete Order via WhatsApp",
    empty_cart:"🗑️ Empty Cart",
    cart_empty:"Your cart is empty 🕯️",
    cart_empty_sub:"Discover The Collection",
    scent_lbl:"Scent:",

    acc_title:"My Account 👤",
    acc_sub:"Save your information.",
    save_acc:"Save",
    orders_count:"Your orders:",
    logout:"Sign Out",

    search_title:"Search 🔍",
    search_ph:"Search for a candle...",
    search_help:"Search by name, description, or category.",

    trk_h2:"📦 Track Your Order",
    trk_id_ph:"Order ID",
    trk_phone_ph:"Mobile Number",
    trk_btn:"Track Order",
    trk_order:"Order",
    trk_cancelled:"❌ Order Cancelled",
    trk_total:"Total",
    trk_searching:"⏳ Searching...",
    trk_notfound:"😕 Order not found",

    st1:"Under Review",
    st2:"Preparing",
    st3:"Shipped",
    st4:"Delivered",
    st5:"Cancelled",

    pd_scent_t:"🌸 Choose Your Scent:",
    pd_required:"Required",
    pd_qty_t:"Quantity:",
    pd_add:"🛍️ Add to Cart",
    pd_buy:"Order via WhatsApp",

    pd_hours:"Burn Time:",
    pd_materials:"Materials:",
    pd_ship:"Delivery:",
    pd_ship_v:"3–7 days",
    pd_materials_v:"100% Natural Wax",
    pd_gift:"Free Gift Wrapping",
    pd_gift_v:"With every order",
    pd_exchange:"Premium Quality",
    pd_exchange_v:"Natural & Safe Materials",

    pd_desc:"📝 Description",
    pd_specs:"📋 Specifications",
    pd_reviews_tab:"⭐ Reviews",
    pd_reviews_count:"Reviews",

    spec_burn:"Burn Time",
    spec_scents:"Available Scents",
    spec_category:"Category",
    spec_made:"Made",
    spec_wax:"Wax Type",
    spec_wick:"Wick",

    gallery_count:"of",
    gallery_zoom:"Zoom Image",
    gallery_next:"Next Image",
    gallery_prev:"Previous Image",
    gallery_close:"Close",
    gallery_share:"Share",
    copy_link:"📋 Copy Link",
    copied:"✅ Link Copied",

    share:"Share:",
    share_whatsapp:"WhatsApp",
    share_facebook:"Facebook",
    share_twitter:"Twitter",

    crumb_home:"Home",

    pd_rev_h2:"Product Reviews",
    pd_first:"Be the first to review",
    pd_form_t:"Add Your Review ⭐",
    pd_name_ph:"Your Name",
    pd_text_ph:"Write your review...",
    pd_photo_ph:"Photo URL",
    pd_submit:"Submit",
    pd_note:"Your review will appear after approval",

    pd_rel_h2:"✨ You May Also Like",
    pd_notfound:"😕 Product not found",
    pd_sold:"Sold",
    pd_times:"times",

    pd_payment_title:"Payment via InstaPay",
    pd_payment_desc:"Products are paid for upfront when your order is confirmed.",
    pd_shipping_title:"Cash on Delivery",
    pd_shipping_desc:"Delivery fees are paid to the courier when your order arrives.",
    pd_handmade:"✦ A handmade piece carefully prepared to order — every candle is unique and special.",

    stock_remaining:"⚡ Only {n} left — Order now!",

    chat_name:"VelaLight Assistant",
    chat_sub:"Your Personal Guide",
    chat_welcome:"Welcome ✨",
    q_gift:"Suggest a gift",
    q_relax:"Something for relaxation",
    q_scents:"What scents are available?",
    q_ship:"Question about delivery",
    q_bride:"Bride Box",

    a_gift:"I'd love to help! 🎁",
    a_relax:"For relaxation, we recommend our massage candles 🧖‍♀️",
    a_scents:"We have 19 scents 🌸",
    a_ship:"🚚 We deliver across Egypt within 3–7 days.",
    a_bride:"Congratulations! 👰",

    t_added:"🕯️ Added",
    t_fill:"⚠️ Please complete the details",
    t_empty:"Cart is empty 🕯️",
    t_order:"✅ Your order has been registered",
    t_revok:"💛 Thank you!",
    t_revwarn:"⚠️ Please enter your name and review",
    t_trkwarn:"⚠️ Enter the order number",
    t_saved:"💾 Saved",
    t_lang_ar:"تم التحويل للعربية",
    t_lang_en:"English",
    t_confirm_empty:"Empty the cart?",
    t_confirm_del:"Are you sure?",
    t_go_cart:"🛍️ Go to Cart",

    wa_head:"🕯️ New Order",
    wa_order:"🧾 Order ID:",
    wa_scent:"Scent",
    wa_total:"💰 Total:",
    wa_ship:"🚚 Shipping:",
    wa_cod:"(Cash)",
    wa_insta:"💳 InstaPay:",
    wa_name:"👤 Name:",
    wa_phone:"📱 Phone:",
    wa_city:"🏙️ Governorate:",
    wa_addr:"📍 Address:",
    wa_notes:"📝 Notes:",
    wa_item:"🕯️ Product:",

    t_scentwarn:"⚠️ Please choose a scent before adding to cart"
  }
};

const t=k=>(I18N[LANG]&&I18N[LANG][k])||I18N.ar[k]||k;

(function(){
  var s=document.createElement("style");
  s.textContent=".about p{white-space:pre-line}";
  (document.head||document.documentElement).appendChild(s);
})();

(function cleanupOldCache(){
  try{
    localStorage.removeItem("vl_products_cache_v1");
    localStorage.removeItem("vl_products_cache_v2");
    console.log("🧹 Old cache cleaned");
  }catch(e){}
})();

const REVIEWS_IMAGES = [
  "rev1.jpg", "rev2.jpg", "rev3.jpg", "rev4.jpg", "rev5.jpg",
  "rev6.jpg", "rev7.jpg", "rev8.jpg", "rev9.jpg", "rev10.jpg",
  "rev11.jpg", "rev12.jpg", "rev13.jpg", "rev14.jpg", "rev15.jpg",
  "rev16.jpg", "rev17.jpg", "rev18.jpg", "rev19.jpg", "rev20.jpg"
];
