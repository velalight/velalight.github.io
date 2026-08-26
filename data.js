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

/* ═══ Analytics ═══ */
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
})();

function track(ev,d={}){
  try{window.gtag && gtag("event",ev,{...d,currency:"EGP"})}catch(e){}
  try{window.fbq && fbq("track",{view_item:"ViewContent",add_to_cart:"AddToCart",begin_checkout:"InitiateCheckout",purchase:"Purchase",search:"Search"}[ev]||ev,d)}catch(e){}
  try{window.ttq && ttq.track({purchase:"CompletePayment"}[ev]||ev,d)}catch(e){}
}

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let LANG=localStorage.getItem("vl_lang")||"ar";
const money=n=>Number(n||0).toLocaleString("en-US")+" "+(LANG==="en"?"EGP":"ج.م");

/* ═══ CDN Image Optimization ═══ */
const IMG_CACHE_VERSION = "v6";
const CDN = u => {
  if (!u) return "";
  if (u.startsWith("data:") || u.startsWith("http")) return u;
  const rawUrl = `https://velalight.github.io/${u}`;
  const encodedUrl = encodeURIComponent(rawUrl);
  return `https://images.weserv.nl/?url=${encodedUrl}&w=800&q=80&output=webp&v=${IMG_CACHE_VERSION}`;
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

const D=864e5, NOW=Date.now();

/* ═══ PRODUCTS DATA (لم يتم التعديل على أي منتج أو سعر) ═══ */
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
  {id:"14",name:"بوكس العروسة",nameEn:"Bride Box",cat:"bride",price:1500,old:0,badge:"الأكثر طلبًا",badgeEn:"Most Requested",hours:"بوكس متكامل",hoursEn:"Complete box",scents:["ورد","ياسمين","مسك أبيض","فانيليا"],img:"box1.jpg",imgs:["box1.jpg"],video:"box.mp4", pinned:true, pinnedAt:Date.now(), sold:0,createdAt:NOW-14*D,desc:"أفخم بوكس عروسة.",descEn:"The most luxurious bride box."}
];

function ph(p){
  const T={wood:["#3a2417","#8a5a33"],glass:["#1c2a36","#7fa6c4"],crystal:["#33290f","#e2c078"],metal:["#2b2118","#c09a5e"],massage:["#2a2233","#a98cc9"],gift:["#331d1d","#d98a7e"],bride:["#33242e","#e3b7c8"]}[p.cat]||["#2b2118","#c09a5e"];
  const s=`<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><defs><radialGradient id='g' cx='50%' cy='36%' r='78%'><stop offset='0%' stop-color='${T[1]}' stop-opacity='.5'/><stop offset='58%' stop-color='${T[0]}'/><stop offset='100%' stop-color='#120d0a'/></radialGradient><linearGradient id='j' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${T[1]}' stop-opacity='.92'/><stop offset='1' stop-color='${T[0]}'/></linearGradient></defs><rect width='900' height='900' fill='url(#g)'/><ellipse cx='450' cy='320' rx='150' ry='170' fill='#ffb757' opacity='.10'/><ellipse cx='450' cy='340' rx='75' ry='95' fill='#ffcf7d' opacity='.13'/><path d='M450 296 q28 36 0 66 q-28 -30 0 -66' fill='#ffcf7d'/><rect x='445' y='360' width='10' height='32' rx='4' fill='#241610'/><rect x='328' y='392' width='244' height='292' rx='28' fill='url(#j)'/><rect x='328' y='392' width='244' height='292' rx='28' fill='#fff' opacity='.05'/><rect x='352' y='474' width='196' height='122' rx='12' fill='#0f0a08' opacity='.58'/><text x='450' y='528' font-family='Georgia' font-size='34' fill='#e9c87a' text-anchor='middle'>VelaLight</text><text x='450' y='566' font-family='Georgia' font-size='16' fill='#cbb287' text-anchor='middle'>Luxury Candle</text></svg>`;
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s);
}

const imgsOf=p=>{
  if(!p) return [];
  if(Array.isArray(p.imgs) && p.imgs.length>0) return p.imgs.filter(x=>x && String(x).trim());
  if(Array.isArray(p.images) && p.images.length>0) return p.images.filter(x=>x && String(x).trim());
  if(p.img){
    const str=String(p.img).trim();
    if(str.includes(",")) return str.split(",").map(s=>s.trim()).filter(Boolean);
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

let DB=LocalDB, CLOUD=false;
window.addEventListener("fb-ready",()=>{
  DB=window.FB; CLOUD=true;
  const tg=$("#dbModeTag"); if(tg) tg.textContent="☁️ Firestore متصل";
  window.dispatchEvent(new Event("data-refresh"));
});

let ALL_PRODUCTS=[], ALL_REVIEWS=[], dbProductsCache=[];

async function loadAll(){
  try{
    dbProductsCache=await DB.list("products");
    if(!Array.isArray(dbProductsCache)) dbProductsCache=[];
  }catch(e){ dbProductsCache=[]; }
  
  const map=new Map();
  PRODUCTS.forEach(p=>{ if(p&&p.id) map.set(p.id,{...p}); });
  
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
        if(c.sold!==undefined) existing.sold=c.sold;
        if(c.stock!==undefined) existing.stock=c.stock;
        if(c.active!==undefined) existing.active=c.active;
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
const saveCart=c=>{ try{localStorage.setItem("vl_cart",JSON.stringify(c))}catch(e){} cartBadge(); };

function cartBadge(){
  const b=$("#cartCount");
  if(!b) return;
  const n=getCart().reduce((a,i)=>a+(i.qty||0),0);
  b.textContent=n;
}

function addToCart(p,opt={}){
  const c=getCart(), scent=opt.scent||((p.scents||[])[0]||"—");
  const ex=c.find(i=>i.id===p.id&&i.scent===scent);
  if(ex) ex.qty+=opt.qty||1;
  else c.push({id:p.id,name:p.name,nameEn:p.nameEn,price:p.price,qty:opt.qty||1,scent,img:imgOf(p)});
  saveCart(c);
  toast(t("t_added"));
  track("add_to_cart",{items:[{item_id:p.id,item_name:p.name,price:p.price}]});
}

/* ═══ Translations (مكتملة ومحسنة) ═══ */
const I18N={
  ar:{
    docTitle:"VelaLight | شموع يدوية فاخرة",
    nav_home:"الرئيسية", nav_shop:"تسوق", nav_about:"من نحن", nav_faq:"الأسئلة الشائعة", nav_contact:"تواصل معنا",
    cat_all:"كل الشموع", cat_wood:"شموع خشبية", cat_glass:"شموع زجاجية", cat_crystal:"شموع كريستالية", cat_metal:"شموع معدنية", cat_massage:"شموع المساج", cat_gift:"الهدايا", cat_bride:"بوكس العروسة",
    hero_eyebrow:"✦ شموع يدوية فاخرة", hero_t1:"ضوءٌ", hero_t2:"يُشبهكِ.", hero_desc:"شموع تُضيء… لتنير يومكِ بلحظاتٍ تستحقينها.", hero_btn1:"اكتشفي السحر ✨", hero_btn2:"رحلة العطور",
    prod_h2:"اختار قطعتك المفضلة", add_cart:"+ أضيفي للسلة", view_details:"👁️ عرض التفاصيل",
    brand_promise_title:"تفاصيل تصنع الفرق", brand_promise_desc:"شموع يدوية فاخرة، عطور مختارة، وهدايا مصممة لتضيف لمسة خاصة لكل لحظة.",
    brand_point1_title:"صناعة يدوية", brand_point1_desc:"كل قطعة تُصنع وتُجهّز بعناية.",
    brand_point2_title:"هدية لكل مناسبة", brand_point2_desc:"اختيارات تليق بكل لحظة واحتفال.",
    brand_point3_title:"اختيار يناسبك", brand_point3_desc:"نساعدك تختاري الرائحة والتفاصيل المناسبة.",
    faq_h2:"الأسئلة الشائعة", faq_sub:"كل ما تحتاجين معرفته عن الطلب، الشحن، الشموع والعطور.",
    rev_eyebrow:"💛 كلامكم أحلى هدية", rev_title:"آراء عملائنا", rev_body:"مش بنكتب كلام، بنعرض الحقيقة. دي لقطات حقيقية من محادثات عملائنا بعد ما استلموا طلباتهم.",
    rev_cta:"✨ جربتي سحرنا؟", rev_cta_link:"📸 شوفي كل آراء عملاء VelaLight", rev_cta_sub:"ابعتيلنا رأيك على الواتساب",
    cart_title:"🛍️ سلة الشراء", subtotal:"المجموع", total:"الإجمالي", checkout_wa:"✅ إتمام الطلب عبر واتساب", empty_cart:"🗑️ إفراغ السلة",
    quick_add_add:"🛍️ أضيفي للسلة", quick_add_added:"✓ تمت الإضافة للسلة", t_scentwarn:"⚠️ من فضلك اختاري العطر أولاً.",
    mq_delivery:"🚚 توصيل سريع لكل محافظات مصر", mq_discounts:"🏷️ خصومات حصرية على مجموعات مختارة", mq_gift:"🎁 تغليف هدايا مجاني مع كل طلب",
    mq_handmade:"🤲 صناعة يدوية 100% بخامات طبيعية", mq_scents:"🕯️ أكثر من 23 عطر فاخر متاح", mq_shipping:"📦 شحن آمن من الورشة لحد باب بيتك", mq_support:"💬 دعم فني يومي لخدمتك"
  },
  en:{
    docTitle:"VelaLight | Luxury Handmade Candles",
    nav_home:"Home", nav_shop:"Shop", nav_about:"Our Story", nav_faq:"FAQ", nav_contact:"Contact",
    cat_all:"All Candles", cat_wood:"Wooden Candles", cat_glass:"Glass Candles", cat_crystal:"Crystal Candles", cat_metal:"Metal Candles", cat_massage:"Massage Candles", cat_gift:"Gifts", cat_bride:"Bride Box",
    hero_eyebrow:"✦ Luxury Handmade Candles", hero_t1:"A Light", hero_t2:"That Resembles You.", hero_desc:"Candles that shine… to brighten your day with moments you deserve.", hero_btn1:"Discover the Magic ✨", hero_btn2:"Fragrance Journey",
    prod_h2:"Choose Your Favorite", add_cart:"+ Add to Cart", view_details:"👁️ View Details",
    brand_promise_title:"Details That Make the Difference", brand_promise_desc:"Handcrafted candles, carefully selected scents, and thoughtful gifts made for every special moment.",
    brand_point1_title:"Handcrafted", brand_point1_desc:"Every piece is made and prepared with care.",
    brand_point2_title:"A Gift for Every Occasion", brand_point2_desc:"Thoughtful choices for every moment and celebration.",
    brand_point3_title:"Made for You", brand_point3_desc:"We help you choose the right scent and details for your taste.",
    faq_h2:"Frequently Asked Questions", faq_sub:"Everything you need to know about ordering, shipping, candles and scents.",
    rev_eyebrow:"💛 Your Words Mean the Most", rev_title:"Our Customers' Reviews", rev_body:"We don't just write claims — we show the real experience. These are genuine screenshots from our customers.",
    rev_cta:"✨ Tried our candles?", rev_cta_link:"📸 See All VelaLight Customer Reviews", rev_cta_sub:"Send us your review on WhatsApp",
    cart_title:"🛍️ Shopping Cart", subtotal:"Subtotal", total:"Total", checkout_wa:"✅ Complete Order via WhatsApp", empty_cart:"🗑️ Empty Cart",
    quick_add_add:"🛍️ Add to Cart", quick_add_added:"✓ Added to Cart", t_scentwarn:"⚠️ Please choose a scent first.",
    mq_delivery:"🚚 Fast delivery across Egypt", mq_discounts:"🏷️ Exclusive discounts on selected collections", mq_gift:"🎁 Free gift wrapping with every order",
    mq_handmade:"🤲 100% handmade with natural materials", mq_scents:"🕯️ More than 23 luxury scents available", mq_shipping:"📦 Safe shipping from our workshop to your door", mq_support:"💬 Daily customer support"
  }
};

const t = k => {
  const lang = LANG === "en" ? "en" : "ar";
  return (I18N[lang] && I18N[lang][k] !== undefined) ? I18N[lang][k] : (I18N.ar && I18N.ar[k] !== undefined ? I18N.ar[k] : k);
};
