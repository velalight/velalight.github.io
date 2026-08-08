/* ════════════════════════════════════════════════════════════
   VelaLight — data.js (الملف المشترك لكل الصفحات)
   ▸ عدّلي هنا بس: CFG + PRODUCTS
   ▸ المنتجات اللي ضيفاها من لوحة التحكم بتتحفظ في Firestore
     وبتظهر تلقائيًا فوق دول
════════════════════════════════════════════════════════════ */

const CFG={
 WHATSAPP:"201000000000",        // ← رقم واتساب الاستقبال
 INSTAPAY:"velalight@instapay",  // ← عنوان InstaPay
 SHIPPING:60,                    // ← الشحن
 ADMIN_PIN:"2846",               // ← PIN مؤقت قبل Firebase Auth
 REPO:"velalight/velalight.github.io@main",
FIREBASE:{
apiKey: "AIzaSyDTX0J7Fvccv2oLvpGYYZXiHteGuiE8y8o",
authDomain: "velalight.firebaseapp.com",
projectId: "velalight",
storageBucket: "velalight.firebasestorage.app",
messagingSenderId: "1095485535268",
appId: "1:1095485535268:web:4d17ee9de6f5acdacbd4b1"
},
GA4_ID:"G-XXXXXXXXXX",
 META_PIXEL_ID:"YOUR_META_PIXEL_ID",
 TIKTOK_PIXEL_ID:"YOUR_TIKTOK_PIXEL_ID"
};

/* ═══════ 2) ANALYTICS — بيتحمّلوا تلقائيًا لما تحطي الـ IDs ═══════ */
(function(){
 if(CFG.GA4_ID.indexOf("G-")===0&&CFG.GA4_ID!=="G-XXXXXXXXXX"){
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
/* أحداث موحّدة: PageView بيجي تلقائيًا فوق */
function track(ev,d={}){
 try{window.gtag&&gtag("event",ev,{...d,currency:"EGP"})}catch(e){}
 try{window.fbq&&fbq("track",{view_item:"ViewContent",add_to_cart:"AddToCart",begin_checkout:"InitiateCheckout",purchase:"Purchase",search:"Search"}[ev]||ev,d)}catch(e){}
 try{window.ttq&&ttq.track({purchase:"CompletePayment"}[ev]||ev,d)}catch(e){}
}

/* ═══════ أدوات عامة ═══════ */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let LANG=localStorage.getItem("vl_lang")||"ar";
const money=n=>Number(n||0).toLocaleString("en-US")+" "+(LANG==="en"?"EGP":"ج.م");
const CDN=u=>{if(!u)return"";if(u.startsWith("data:")||u.includes("cdn.jsdelivr.net")||u.startsWith("http"))return u.startsWith("http")?u.replace("https://velalight.github.io/",`https://cdn.jsdelivr.net/gh/${CFG.REPO}/`):u;
 return `https://cdn.jsdelivr.net/gh/${CFG.REPO}/${u}`};
function toast(m){if(!$("#toasts"))return;const d=document.createElement("div");d.className="toast";d.textContent=m;$("#toasts").appendChild(d);setTimeout(()=>d.remove(),3200)}

/* التصنيفات */
const CATS={ar:{all:"كل الشموع",wood:"شموع خشبية",glass:"شموع زجاجية",crystal:"شموع كريستالية",metal:"شموع معدنية",massage:"شموع المساج",gift:"الهدايا",bride:"بوكس العروسة"},
 en:{all:"All Candles",wood:"Wooden Candles",glass:"Glass Candles",crystal:"Crystal Candles",metal:"Metal Candles",massage:"Massage Candles",gift:"Gifts",bride:"Bride Box"}};
const cat=k=>CATS[LANG][k]||k;

/* العطور الـ19 (عربي/إنجليزي) */
const SCENTS=[["فانيليا","Vanilla"],["موكا","Mocha"],["كراميل","Caramel"],["قرفة","Cinnamon"],["عنبر","Amber"],["عود","Oud"],["قهوة","Coffee"],["أناناس","Pineapple"],["كوكونات","Coconut"],["كاريبيان فروت","Caribbean Fruit"],["مانجو","Mango"],["توت","Berry"],["ورد","Rose"],["ياسمين","Jasmine"],["فل","Arabian Jasmine"],["لافندر","Lavender"],["مسك أبيض","White Musk"],["ساندال وود","Sandalwood"],["باتشولي","Patchouli"]];
const scentTr=n=>{const f=SCENTS.find(s=>s[0]===n||s[1]===n);return f?(LANG==="en"?f[1]:f[0]):n};

const GOVS=["القاهرة","الجيزة","الإسكندرية","القليوبية","الدقهلية","الشرقية","الغربية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","شمال سيناء","جنوب سيناء","البحر الأحمر","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","الوادي الجديد","مطروح"];
const GOVS_EN=["Cairo","Giza","Alexandria","Qalyubia","Dakahlia","Sharqia","Gharbia","Menoufia","Beheira","Kafr El Sheikh","Damietta","Port Said","Ismailia","Suez","North Sinai","South Sinai","Red Sea","Fayoum","Beni Suef","Minya","Assiut","Sohag","Qena","Luxor","Aswan","New Valley","Matrouh"];

/* حالات الطلب */
const STATUS=["قيد المراجعة","جاري التجهيز","تم الشحن","تم التسليم","ملغي"];

const D=864e5,NOW=Date.now();
/* ════════════════════════════════════════════════════════════
   ★★★ PRODUCTS — حطّي منتجاتك الحقيقية هنا ★★★
   img: حطي اسم الصورة الموجودة في الريبو (زي "p1.jpg")
   أو رابط كامل. لو سيبتيها فاضية هتتولد صورة أنيقة تلقائيًا.
   ▸ لصور WebP الأسرع: حوّلي صورك لـ .webp وارفعيها واستخدمي الاسم هنا
════════════════════════════════════════════════════════════ */
const PRODUCTS=[
{id:"1",name:"الشمعة الفاخرة (مجموعة 3 شموع)",nameEn:"Luxury Candle Set (3 Candles)",cat:"wood",price:650,old:750,badge:"خصم",badgeEn:"Sale",hours:"3 شموع × 72 ساعة",hoursEn:"3 candles × 72h",scents:["عود","فانيليا","مسك أبيض"],img:"RRRR.jpg",imgs:["RRRR.jpg","RRRRR.jpg","RRRRRR.jpg","RR.jpg","RRR.jpg"],sold:0,createdAt:NOW-1*D,
desc:"ثلاث شموع فاخرة في مجموعة واحدة، صُممت لتتناغم معًا كسيمفونية من الضوء والعطر. كل شمعة تحمل طابعًا خاصًا، ومعًا يملأن المكان بدفءٍ لا يُقاوم وأناقةٍ تليق بأجمل اللحظات.",
descEn:"Three luxury candles in one curated set, designed to harmonize as a symphony of light and scent."},
{id:"2",name:"شمعة نبضين",nameEn:"Two Heartbeats Candle",cat:"wood",price:650,old:750,badge:"خصم",badgeEn:"Sale",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["ورد","فانيليا","مسك أبيض"],img:"heart2.jpg",imgs:["heart2.jpg","heart3.jpg","heart1.jpg"],sold:0,createdAt:NOW-2*D,
desc:"ليست مجرد شمعة... بل قطعة تُحاكي المشاعر. شمعة نبضين من الخشب الطبيعي الفاخر بتصميم قلب أنيق، مع إمكانية نقش اسمك أو اسم من تحب لتصبح ذكرى تدوم وهدية تحمل معنى.",
descEn:"More than a candle — a piece that echoes emotions. A premium natural wood candle with an elegant heart design."},
{id:"3",name:"جولدن كاندل",nameEn:"Golden Candle Set",cat:"glass",price:2850,old:3600,badge:"خصم",badgeEn:"Sale",hours:"3 شموع × 96 ساعة",hoursEn:"3 candles × 96h",scents:["عنبر","عود","كراميل"],img:"candle1.jpg",imgs:["candle1.jpg","candle2.jpg","candle3.jpg","candle4.jpg","candle5.jpg"],sold:0,createdAt:NOW-3*D,
desc:"هناك تفاصيل لا تكتفي بتزيين المكان... بل تمنحه روحًا. مجموعة من ثلاث شموع في أوانٍ زجاجية فاخرة، صُممت لتنسج مشهدًا من الدفء والأناقة في كل زاوية من منزلك.",
descEn:"Some details do not just decorate a place — they give it a soul. A set of three candles in luxurious glass vessels."},
{id:"4",name:"شمعة الأيس كوفي",nameEn:"Iced Coffee Candle",cat:"glass",price:425,old:550,badge:"خصم",badgeEn:"Sale",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["قهوة","موكا","فانيليا"],img:"iccoffe1.jpg",imgs:["iccoffe1.jpg","iccoffe2.jpg","iccoffe3.jpg","iccoffe4.jpg"],sold:0,createdAt:NOW-4*D,
desc:"ليست رائحة قهوة... بل مزاجٌ كامل يُضاء. شمعة آيس كوفي صُنعت لتأخذك إلى هدوء المقاهي الراقية.",
descEn:"Not just the scent of coffee — a whole mood, illuminated."},
{id:"5",name:"شمعة المانديلا",nameEn:"Mandala Candle",cat:"metal",price:325,old:0,badge:"الأكثر مبيعًا",badgeEn:"Best Seller",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["عود","عنبر","قرفة"],img:"mandle.jpg",imgs:["mandle.jpg"],sold:0,createdAt:NOW-5*D,
desc:"الأكثر مبيعًا... والأقرب إلى كل بيت يعشق التفاصيل الراقية. شمعة المانديلا ليست مجرد قطعة ديكور، بل حضور يملأ المكان دفئًا وأناقة.",
descEn:"The best-seller — the Mandala candle is a presence that fills the space with warmth and elegance."},
{id:"6",name:"شمعة المساج",nameEn:"Massage Candle",cat:"metal",price:325,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","ياسمين","كوكونات"],img:"gift1.jpg",imgs:["gift1.jpg","gift2.jpg","gift3.jpg","gift4.jpg","gift5.jpg","gift6.jpg","gift7.jpg"],sold:0,createdAt:NOW-6*D,
desc:"كل امرأة تستحق لحظة تُدلل فيها نفسها. شمعة المساج ليست مجرد شمعة، بل تجربة عناية فاخرة تبدأ بوهجٍ هادئ وتنتهي ببشرة أكثر نعومة.",
descEn:"Every woman deserves a moment to pamper herself."},
{id:"7",name:"شمعة كريستال ذهبية",nameEn:"Crystal Gold Candle",cat:"crystal",price:750,old:900,badge:"خصم",badgeEn:"Sale",hours:"96 ساعة اشتعال",hoursEn:"96h burn time",scents:["عنبر","ورد","مسك أبيض"],img:"candle13.jpg",imgs:["candle13.jpg"],sold:0,createdAt:NOW-7*D,
desc:"قطعة استثنائية في إناء كريستال فاخر يعكس ضوء الشمعة بشكل ساحر.",
descEn:"An exceptional piece in a luxury crystal vessel."},
{id:"8",name:"بلو كريستال",nameEn:"Blue Crystal",cat:"crystal",price:720,old:0,badge:"",badgeEn:"",hours:"96 ساعة اشتعال",hoursEn:"96h burn time",scents:["توت","أناناس","لافندر"],img:"candle14.jpg",imgs:["candle14.jpg"],sold:0,createdAt:NOW-8*D,
desc:"شمعة كريستالية بلون أزرق أنيق، تصميم عصري يضيف لمسة من الرقي.",
descEn:"A crystal candle with elegant blue color."},
{id:"9",name:"لافندر (جلاس)",nameEn:"Lavender (Glass)",cat:"glass",price:430,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","باتشولي","مسك أبيض"],img:"candle9.jpg",imgs:["candle9.jpg"],sold:0,createdAt:NOW-9*D,
desc:"شمعة زجاجية بعطر اللافندر الفرنسي المهدئ، مثالية للاسترخاء.",
descEn:"A glass candle with calming French lavender scent."},
{id:"10",name:"ياسمين (جلاس)",nameEn:"Jasmine (Glass)",cat:"glass",price:440,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["ياسمين","فل","ورد"],img:"candle10.jpg",imgs:["candle10.jpg"],sold:0,createdAt:NOW-10*D,
desc:"شمعة زجاجية بعطر الياسمين النقي، رائحة زهرية منعشة.",
descEn:"A glass candle with pure jasmine scent."},
{id:"11",name:"فانيليا (جلاس)",nameEn:"Vanilla (Glass)",cat:"glass",price:400,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["فانيليا","كراميل","موكا"],img:"candle11.jpg",imgs:["candle11.jpg"],sold:0,createdAt:NOW-11*D,
desc:"شمعة زجاجية بعطر الفانيلا الكلاسيكي، رائحة دافئة محببة للجميع.",
descEn:"A glass candle with classic vanilla scent."},
{id:"12",name:"شمعة مساج ريلاكس",nameEn:"Relax Massage Candle",cat:"massage",price:380,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","فل","مسك أبيض"],img:"candle19.jpg",imgs:["candle19.jpg"],sold:0,createdAt:NOW-12*D,
desc:"شمعة مساج بعطر اللافندر والخزامى المهدئ، يمنحك استرخاءً عميقًا.",
descEn:"A massage candle with calming lavender scent."},
{id:"13",name:"بوكس هدية فاخر",nameEn:"Luxury Gift Box",cat:"gift",price:850,old:0,badge:"",badgeEn:"",hours:"شمعة + إكسسوارات",hoursEn:"Candle + accessories",scents:["عود","عنبر","ورد"],img:"gifta.jpg",imgs:["gifta.jpg"],sold:0,createdAt:NOW-13*D,
desc:"بوكس هدايا فاخر بتغليف ملكي، يحتوي على شمعة مختارة وإكسسوارات.",
descEn:"A luxury gift box with royal wrapping."},
{id:"14",name:"بوكس العروسة",nameEn:"Bride Box",cat:"bride",price:1500,old:0,badge:"الأكثر طلبًا",badgeEn:"Most Requested",hours:"بوكس متكامل",hoursEn:"Complete box",scents:["ورد","ياسمين","مسك أبيض","فانيليا"],img:"box1.jpg",imgs:["box1.jpg"],sold:0,createdAt:NOW-14*D,
desc:"أفخم بوكس عروسة: شموع مساج + شموع ديكور + معطرات وتغليف وردي ملكي.",
descEn:"The most luxurious bride box with royal pink wrapping."}
];
/* صورة بديلة أنيقة للمنتج اللي ملوش صورة */
function ph(p){const T={wood:["#3a2417","#8a5a33"],glass:["#1c2a36","#7fa6c4"],crystal:["#33290f","#e2c078"],metal:["#2b2118","#c09a5e"],massage:["#2a2233","#a98cc9"],gift:["#331d1d","#d98a7e"],bride:["#33242e","#e3b7c8"]}[p.cat]||["#2b2118","#c09a5e"];
 const s=`<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><defs><radialGradient id='g' cx='50%' cy='36%' r='78%'><stop offset='0%' stop-color='${T[1]}' stop-opacity='.5'/><stop offset='58%' stop-color='${T[0]}'/><stop offset='100%' stop-color='#120d0a'/></radialGradient><linearGradient id='j' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${T[1]}' stop-opacity='.92'/><stop offset='1' stop-color='${T[0]}'/></linearGradient></defs><rect width='900' height='900' fill='url(#g)'/><ellipse cx='450' cy='320' rx='150' ry='170' fill='#ffb757' opacity='.10'/><ellipse cx='450' cy='340' rx='75' ry='95' fill='#ffcf7d' opacity='.13'/><path d='M450 296 q28 36 0 66 q-28 -30 0 -66' fill='#ffcf7d'/><rect x='445' y='360' width='10' height='32' rx='4' fill='#241610'/><rect x='328' y='392' width='244' height='292' rx='28' fill='url(#j)'/><rect x='328' y='392' width='244' height='292' rx='28' fill='#fff' opacity='.05'/><rect x='352' y='474' width='196' height='122' rx='12' fill='#0f0a08' opacity='.58'/><text x='450' y='528' font-family='Georgia' font-size='34' fill='#e9c87a' text-anchor='middle'>VelaLight</text><text x='450' y='566' font-family='Georgia' font-size='16' fill='#cbb287' text-anchor='middle'>Luxury Candle</text></svg>`;
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s)}
const imgsOf=p=>{if(p.imgs&&p.imgs.length)return p.imgs;const raw=p.img||"";return String(raw).split(",").map(s=>s.trim()).filter(Boolean)};
const imgOf=p=>{const a=imgsOf(p);return a.length?CDN(a[0]):ph(p)};
const pname=p=>LANG==="en"?(p.nameEn||p.en||p.name):p.name;
const pdesc=p=>LANG==="en"?(p.descEn||p.desc||""):(p.desc||"");
const phours=p=>LANG==="en"?(p.hoursEn||p.hours||"40–60 hours"):(p.hours||"40–60 ساعة");
const pbadge=p=>LANG==="en"?(p.badgeEn||p.badge||""):(p.badge||"");

/* ═══════ قاعدة البيانات (Firestore أو محلي مؤقتًا) ═══════ */
const LocalDB={
 k:c=>"vl_"+c,
 g(c){try{return JSON.parse(localStorage.getItem(this.k(c)))||[]}catch(e){return[]}},
 s(c,v){localStorage.setItem(this.k(c),JSON.stringify(v))},
 async list(c){return this.g(c)},
 async add(c,d){const a=this.g(c);d.id="l"+Date.now()+Math.random().toString(16).slice(2,7);a.push(d);this.s(c,a);return d.id},
 async update(c,id,d){this.s(c,this.g(c).map(x=>x.id===id?{...x,...d}:x))},
 async remove(c,id){this.s(c,this.g(c).filter(x=>x.id!==id))}
};
let DB=LocalDB,CLOUD=false;
window.addEventListener("fb-ready",()=>{DB=window.FB;CLOUD=true;
 const tg=$("#dbModeTag");tg&&(tg.textContent="☁️ Firestore متصل");
 window.dispatchEvent(new Event("data-refresh"))});

/* دمج منتجات Firestore مع منتجات data.js */
let ALL_PRODUCTS=[],ALL_REVIEWS=[],dbProductsCache=[];
async function loadAll(){
 try{dbProductsCache=await DB.list("products")}catch(e){dbProductsCache=[]}
 const map=new Map(PRODUCTS.map(p=>[p.id,{...p}]));
 (dbProductsCache||[]).forEach(d=>{
  const slug=d.id_||d.slug||d.pid;
  if(!slug)return;
  if(d.active===false){map.delete(slug);return}
  map.set(slug,{...(map.get(slug)||{}),...d,id:slug,_fid:d.id});
 });
 ALL_PRODUCTS=[...map.values()];
 let dr=[];try{dr=await DB.list("reviews")}catch(e){}
 ALL_REVIEWS=[...SEED_REVIEWS,...dr];
}
const prodReviews=s=>ALL_REVIEWS.filter(r=>(r.productSlug||r.pid)===s&&r.approved!==false);
const ratingOf=s=>{const r=prodReviews(s);if(!r.length)return null;return{avg:+(r.reduce((a,b)=>a+(+b.rating||5),0)/r.length).toFixed(1),count:r.length}};

/* مراجعات تجريبية — هتتحذف تلقائيًا لما الريفيوهات الحقيقية تيجي */
const SEED_REVIEWS=[];

/* ═══════ السلة (مشتركة بين كل الصفحات) ═══════ */
const getCart=()=>JSON.parse(localStorage.getItem("vl_cart")||"[]");
const saveCart=c=>{localStorage.setItem("vl_cart",JSON.stringify(c));cartBadge()};
function cartBadge(){const b=$("#cartCount");if(!b)return;const n=getCart().reduce((a,i)=>a+i.qty,0);b.textContent=n}
function addToCart(p,opt={}){
 const c=getCart(),scent=opt.scent||((p.scents||[])[0]||"—");
 const ex=c.find(i=>i.id===p.id&&i.scent===scent);
 if(ex)ex.qty+=opt.qty||1;else c.push({id:p.id,name:p.name,nameEn:p.nameEn,price:p.price,qty:opt.qty||1,scent,img:imgOf(p)});
 saveCart(c);toast(t("t_added"));
 track("add_to_cart",{items:[{item_id:p.id,item_name:p.name,price:p.price}]});
}

/* ═══════ الترجمات AR/EN ═══════ */
const I18N={
ar:{
 docTitle:"VelaLight | شموع يدوية فاخرة بعطور مميزة وهدايا فخمة | توصيل لكل مصر",
 docDesc:"VelaLight — شموع يدوية فاخرة بعطور مميزة، خامات طبيعية 100%، تغليف هدايا فاخر مجاني، وتوصيل لكل محافظات مصر خلال 3-7 أيام.",
 mq:"🚚 توصيل سريع لكل محافظات مصر خلال 3-7 أيام عمل &nbsp;•&nbsp; 🏷️ خصومات تصل إلى 25% على تشكيلة مختارة &nbsp;•&nbsp; 🎁 تغليف هدايا فاخر مجانًا مع كل طلب &nbsp;•&nbsp; ✨ ضمان استبدال خلال 3 أيام من الاستلام &nbsp;•&nbsp;",
 nav_home:"الرئيسية",nav_shop:"تسوق",nav_about:"من نحن",nav_faq:"الأسئلة الشائعة",nav_contact:"تواصل معنا",
 cat_all:"كل الشموع",cat_wood:"شموع خشبية",cat_glass:"شموع زجاجية",cat_crystal:"شموع كريستالية",cat_metal:"شموع معدنية",cat_massage:"شموع المساج",cat_gift:"الهدايا",cat_bride:"بوكس العروسة",
 mn_cats:"تصنيفات الشموع",mn_explore:"اكتشف",mn_scents:"العطور الفاخرة",mn_occ:"المناسبات والهدايا",mn_why:"لماذا VelaLight؟",mn_rev:"آراء عملائنا",mn_track:"📦 تتبع الطلب",mn_contact:"تواصل",
 hero_kick:"✦ شموع يدوية فاخرة · صناعة مصرية",hero_a:"ضوء يُحكى…",hero_b:"وبريق يليق بكِ",
 hero_lead:"في VelaLight كل شمعة اتصنعت يدويًا بعناية، بخامات طبيعية وعطور فاخرة — عشان تحوّلي أي لحظة عادية لذكري دافئة.",
 cta_shop:"اكتشفي The Collection ✨",cta_story:"Our Story",
 trust1:"🚚 توصيل لكل مصر",trust2:"🤲 100% صناعة يدوية",trust3:"🎁 تغليف هدايا مجاني",trust4:"🔁 استبدال خلال 3 أيام",
 fc1:"على تشكيلة مختارة",fc2b:"تغليف فاخر 🎁",fc2:"مجانًا مع كل طلب",
 prod_h2:"اختار قطعتك المفضلة",price_lbl:"💰 السعر:",from_ph:"من",to_ph:"إلى",sort_lbl:"ترتيب:",
 sort_new:"الأحدث",sort_asc:"الأرخص أولًا",sort_desc:"الأغلى أولًا",sort_rating:"الأعلى تقييمًا",sort_best:"الأكثر مبيعًا",sort_disc:"أكبر خصم",
 prod_word:"منتج",add_cart:"+ أضيفي للسلة",view_details:"👁️ عرض التفاصيل",no_products:"🕯️ مفيش منتجات مطابقة للفلترة دي",
 about_h2:"من نحن",
 about_p1:"في VelaLight لا نصنع الشموع فقط، بل نصنع لحظات تستحق أن تُعاش. بدأت رحلتنا بشغف تجاه التفاصيل الصغيرة التي تجعل المكان أكثر دفئًا، والبيت أكثر راحة، واللحظات العادية أكثر جمالًا.",
 about_p2:"نصنع كل شمعة يدويًا بعناية، مستخدمين خامات مختارة وعطورًا فاخرة، لنقدم منتجًا يجمع بين الأناقة والجودة والإحساس الحقيقي. نؤمن أن الضوء الخافت قادر على تهدئة الروح، وأن العطر الجميل يستطيع أن يعيد أجمل الذكريات.",
 stat_clients:"عميلة سعيدة",stat_scents:"عطر مميز",stat_hand:"صناعة يدوية",
 scents_h2:"العطور الفاخرة",scents_sub:"كل العطور متاحة تختار منهم في أي منتج من منتجاتنا",
 occ_h2:"هدية لكل مناسبة",
 occ1t:"أعياد الميلاد",occ1d:"صُممت لتكون هدية استثنائية تحمل أعمق المشاعر، وتمنح كل لحظة دفئًا يلامس القلب.",
 occ2t:"الزفاف والخطوبة والولادة",occ2d:"لأن التفاصيل هي سرّ الجمال، ابتكرنا توزيعات رومانسية ولمسات راقية تُضفي على يومك سحرًا استثنائيًا.",
 occ3t:"ركن المنزل",occ3d:"ركنٌ صغير... لكنه كفيل بأن يغيّر شعور المكان بأكمله؛ دفءٌ يحتضن التفاصيل، وعطرٌ ينعش الروح.",
 occ4t:"بوكسات الهدايا",occ4d:"لأن الهدية الراقية تبدأ من التفاصيل، نُنسّق بوكساتنا بعناية لتجسّد ذوقك.",
 feat_h2:"لماذا VelaLight؟",
 feat1t:"توصيل لكل المحافظات",feat1d:"بنوصل طلبك أينما كنتِ في مصر، بتغليف آمن يحافظ على شمعتك من الورشة لحد باب بيتك.",
 feat2t:"خامات طبيعية 100%",feat2d:"شمع طبيعي نقي وفتائل خشب طبيعي وقطنية آمنة على صحتك وبيتك.",
 feat3t:"صناعة يدوية بعناية",feat3d:"خلف كل قطعة ساعاتٌ من العناية والحرفية، حيث تُصنع وتُغلّف يدويًا بكل دقة.",
 feat4t:"تغليف فاخر",feat4d:"كل شمعة تُغلّف بعناية في تنسيقٍ راقٍ يعكس جمالها، لتصلك جاهزة للإهداء.",
 feat5t:"ضمان استبدال",feat5d:"واثقين انك هتقع فى حب المنتج من اول لحظه وإن لم تكن راضيًا تمامًا، فسنحرص على استبداله.",
 feat6t:"دعم دائم لعملائنا",feat6d:"محتار تختار إيه؟ سيبها علينا. هنسمع فكرتك ونرشح لك الهدية والعطر الأنسب.",
 faq_h2:"الأسئلة الشائعة",

faq1q:"كام مدة توصيل الأوردر؟",faq1a:"التوصيل داخل القاهرة والجيزة بياخد من 3 إلى 5 أيام عمل، وباقي المحافظات من 5 إلى 7 أيام عمل.",
faq2q:"طرق الدفع المتاحة إيه؟",faq2a:"قيمة المنتجات تُدفع InstaPay مقدمًا، وتكلفة الشحن فقط تُدفع كاش لمندوب الشحن عند الاستلام.",
faq3q:"هل ينفع استبدال المنتج لو مش عاجبني؟",faq3a:"أيوه، عندنا سياسة استبدال خلال 3 أيام من الاستلام بشرط أن المنتج لم يُستخدم.",
faq4q:"مدة اشتعال الشمعة قد إيه؟",faq4a:"حسب حجم الشمعة، بتتراوح بين 72 إلى 96 ساعة اشتعال متواصل.",
faq5q:"الشموع آمنة على الأطفال والحيوانات الأليفة؟",faq5a:"الشموع مصنوعة من شمع طبيعي وفتيلة خشب طبيعي وفتيلة قطنية، وننصح دائمًا بعدم تركها مشتعلة بدون إشراف.",
faq6q:"بتوصلوا لكل المحافظات؟",faq6a:"أيوه، بنوصل لكل محافظات مصر عن طريق شركات شحن موثوقة.",

rev_h2:"آراء عملائنا",rev_sub:"ثقتكم أجمل هدية لنا",rev_verified:"عميلة موثّقة",
 foot_tag1:"شموع يدوية فاخرة - عطور مميزة - هدايا حسب الطلب",foot_tag2:"Luxury handmade candles - Signature scents - Custom gifts",
 foot_quick:"روابط سريعة",foot_shop:"تسوق",foot_admin:"لوحة التحكم",foot_pay_h:"الدفع والشحن",
 pay_title:"InstaPay — تحويل مقدم",
 foot_pay_note:"ملحوظة هامة: قيمة المنتجات بتتحول مقدمًا عبر InstaPay، أما تكلفة الشحن فتُدفع كاش لمندوب شركة الشحن وقت استلام الأوردر مباشرة.",
 foot_rights:"© 2026 - 2030 VelaLight — جميع الحقوق محفوظة",
 foot_exchange:"سياسة الاستبدال",foot_privacy:"سياسة الخصوصية",foot_terms:"شروط الاستخدام",
 shipping:"الشحن",ship_all:"— لكل المحافظات",egp:"ج.م",subtotal:"المجموع",total:"الإجمالي",
 cart_title:"🛍️ سلة الشراء",delivery_h:"بيانات التوصيل",
 ph_name:"الاسم بالكامل *",ph_phone:"رقم الموبايل * (واتساب)",ph_phone2:"رقم الموبايل (واتساب)",ph_city:"اختاري المحافظة",ph_addr:"العنوان بالتفصيل *",ph_addr2:"العنوان بالتفصيل",ph_notes:"ملاحظات (عبارات إهداء، توقيت التوصيل...)",
 paymethod_h:"طريقة الدفع: InstaPay — تحويل مقدم",
 paymethod_d:"قيمة المنتجات بتتحول مقدمًا عبر InstaPay، وتكلفة الشحن بتتدفع كاش للمندوب عند الاستلام. 🎁 تغليف الهدايا الفاخر مجاني.",
 checkout_wa:"✅ إتمام الطلب عبر واتساب",empty_cart:"🗑️ إفراغ السلة",
 cart_empty:"سلتك لسه فاضية 🕯️",cart_empty_sub:"اكتشفي The Collection واختاري قطعتك",scent_lbl:"العطر:",
 acc_title:"حسابي 👤",acc_sub:"سجّل بياناتك مرة واحدة وهنفضل نفتكرها ليكي في كل زيارة.",save_acc:"حفظ بياناتي وتسجيل الدخول",orders_count:"عدد طلباتك:",logout:"تسجيل خروج",
 search_title:"البحث 🔍",search_ph:"ابحثي عن شمعة، عطر، تصنيف...",search_help:"البحث يشمل: اسم المنتج، الوصف، الكاتيجوري — بالعربي والإنجليزي.",
 trk_h2:"📦 تتبع طلبك",trk_id_ph:"رقم الطلب — مثال: VL-123456",trk_phone_ph:"رقم الموبايل المستخدم في الطلب",trk_btn:"تتبع الطلب",
 trk_order:"طلب",trk_cancelled:"❌ الطلب ملغي — تواصلي معنا واتساب لو في استفسار",trk_total:"الإجمالي (شامل الشحن)",trk_searching:"⏳ لحظة، بنبحث عن طلبك...",trk_notfound:"😕 مش لاقيين طلب بالبيانات دي — اتأكدي من رقم الطلب أو كلمينا واتساب",
 st1:"قيد المراجعة",st2:"جاري التجهيز",st3:"تم الشحن",st4:"تم التسليم",st5:"ملغي",
 pd_scent_t:"🌸 اختاري العطر:",pd_qty_t:"الكمية:",pd_add:"🛍️ أضيفي للسلة",pd_buy:"اطلبي دلوقتي عبر واتساب",
 pd_hours:"مدة الاشتعال:",pd_materials:"الخامات:",pd_ship:"التوصيل:",pd_ship_v:"3–7 أيام عمل لكل المحافظات",
 pd_materials_v:"شمع طبيعي 100% + فتيلة خشب/قطن آمنة",pd_gift:"تغليف هدايا فاخر مجانًا",pd_gift_v:"مع كل طلب",
 pd_exchange:"ضمان استبدال",pd_exchange_v:"خلال 3 أيام من الاستلام",crumb_home:"الرئيسية",
 pd_rev_h2:"مراجعات المنتج",pd_first:"كوني أول من يراجع هذا المنتج ✨",
 pd_form_t:"ضيفي مراجعتك ⭐",pd_name_ph:"اسمك",pd_text_ph:"اكتبي رأيك في المنتج...",pd_photo_ph:"رابط صورة المراجعة (اختياري)",pd_submit:"إرسال المراجعة",pd_note:"المراجعة بتظهر بعد الموافقة عليها 🙏",
 pd_rel_h2:"منتجات هتعجبك برضه",pd_share:"مشاركة:",pd_notfound:"😕 المنتج ده مش موجود",pd_sold:"تم بيعه",pd_times:"مرة",
 chat_name:"مساعد VelaLight",chat_sub:"دليلك الشخصي لاختيار الشمعة المثالية",
 chat_welcome:"أهلًا بيكِ في VelaLight ✨ أنا مساعدك الشخصي — اختاري سؤال من تحت أو اكتبي استفسارك 🕯️",
 q_gift:"اقترح لي هدية",q_relax:"عايزة حاجة للاسترخاء",q_scents:"إيه العطور المتاحة؟",q_ship:"سؤال عن التوصيل",q_bride:"بوكس عروسة",
 a_gift:"أكيد أساعدك! 🎁 قولي المناسبة والميزانية وهنرشح لك أنسب هدية — ابصري قسم «هدية لكل مناسبة» 👇",
 a_relax:"للاسترخاء بنرشح لك شموع المساج 🧖‍♀️ بعطر اللافندر — هعرض لك القسم دلوقتي 🕯️",
 a_scents:"عندنا 19 عطر مميز 🌸 ابصري قسم العطور الفاخرة 👇",
 a_ship:"🚚 بنوصل لكل مصر خلال 3–7 أيام.\n💳 InstaPay مقدمًا + الشحن كاش عند الاستلام.\n🔁 استبدال خلال 3 أيام ✨",
 a_bride:"عقبال فرحك! 👰 بوكس العروسة الملكي هو الأكثر طلبًا — هعرض لك البوكسات دلوقتي 💍",
 t_added:"🕯️ تم الإضافة للسلة",t_fill:"⚠️ كمّلي بيانات التوصيل (الاسم والموبايل والعنوان)",t_empty:"السلة فاضية 🕯️",
 t_order:"✅ تم تسجيل طلبك",t_revok:"💛 شكرًا! مراجعتك هتظهر بعد الموافقة",t_revwarn:"⚠️ اكتبي اسمك ومراجعتك",
 t_trkwarn:"⚠️ دخّلي رقم الطلب والموبايل",t_saved:"💾 تم حفظ بياناتك",t_lang_ar:"تم التحويل للعربية 🕯️",t_lang_en:"Switched to English ✨",
 t_confirm_empty:"هتفضّي السلة خالص؟",t_confirm_del:"متأكدة من الحذف؟",t_go_cart:"🛍️ اذهبي للسلة لإتمام الطلب",
 wa_head:"🕯️ طلب جديد من VelaLight",wa_order:"🧾 رقم الطلب:",wa_scent:"العطر",wa_total:"💰 الإجمالي:",wa_ship:"🚚 الشحن:",wa_cod:"(كاش عند الاستلام)",wa_insta:"💳 تحويل قيمة المنتجات عبر InstaPay على:",wa_name:"👤 الاسم:",wa_phone:"📱 الموبايل:",wa_city:"🏙️ المحافظة:",wa_addr:"📍 العنوان:",wa_notes:"📝 ملاحظات:",wa_item:"🕯️ المنتج:"
},
en:{
 docTitle:"VelaLight | Luxury Handmade Candles with Signature Scents | Delivery All Over Egypt",
 docDesc:"VelaLight — luxury handmade candles with signature scents, 100% natural ingredients, free luxury gift wrapping, delivery all over Egypt within 3-7 days.",
 mq:"🚚 Fast delivery to all Egyptian governorates within 3-7 business days &nbsp;•&nbsp; 🏷️ Discounts up to 25% on selected items &nbsp;•&nbsp; 🎁 Free luxury gift wrapping with every order &nbsp;•&nbsp; ✨ 3-day replacement guarantee &nbsp;•&nbsp;",
 nav_home:"Home",nav_shop:"Shop",nav_about:"Our Story",nav_faq:"FAQ",nav_contact:"Contact Us",
 cat_all:"All Candles",cat_wood:"Wooden Candles",cat_glass:"Glass Candles",cat_crystal:"Crystal Candles",cat_metal:"Metal Candles",cat_massage:"Massage Candles",cat_gift:"Gifts",cat_bride:"Bride Box",
 mn_cats:"Candle Categories",mn_explore:"Explore",mn_scents:"Luxury Scents",mn_occ:"Occasions & Gifts",mn_why:"Why VelaLight?",mn_rev:"Client Reviews",mn_track:"📦 Track Order",mn_contact:"Contact",
 hero_kick:"✦ Luxury Handmade Candles · Made in Egypt",hero_a:"A Light That Tells a Story…",hero_b:"& a Sparkle That Suits You",
 hero_lead:"At VelaLight, every candle is handcrafted with care using natural ingredients and luxurious scents — turning any ordinary moment into a warm memory.",
 cta_shop:"Discover The Collection ✨",cta_story:"Our Story",
 trust1:"🚚 Delivery all over Egypt",trust2:"🤲 100% Handmade",trust3:"🎁 Free gift wrapping",trust4:"🔁 3-day replacement",
 fc1:"on selected items",fc2b:"Luxury wrapping 🎁",fc2:"free with every order",
 prod_h2:"Choose Your Favorite Piece",price_lbl:"💰 Price:",from_ph:"From",to_ph:"To",sort_lbl:"Sort:",
 sort_new:"Newest",sort_asc:"Price: Low to High",sort_desc:"Price: High to Low",sort_rating:"Top Rated",sort_best:"Best Selling",sort_disc:"Biggest Discount",
 prod_word:"products",add_cart:"+ Add to Cart",view_details:"👁️ View Details",no_products:"🕯️ No products match this filter",
 about_h2:"About Us",
 about_p1:"At VelaLight, we don't just make candles — we craft moments worth living. Our journey began with a passion for the little details that make a place warmer, a home cozier, and ordinary moments more beautiful.",
 about_p2:"Every candle is handcrafted with care, using selected materials and luxurious scents, to deliver a product that combines elegance, quality, and true feeling. We believe soft light can calm the soul, and a beautiful scent can bring back the finest memories.",
 stat_clients:"Happy Clients",stat_scents:"Signature Scents",stat_hand:"Handmade",
 scents_h2:"Luxury Scents",scents_sub:"All scents are available to choose from for any of our products",
 occ_h2:"A Gift for Every Occasion",
 occ1t:"Birthdays",occ1d:"Designed to be an exceptional gift carrying the deepest emotions, giving every moment warmth that touches the heart.",
 occ2t:"Weddings, Engagements & Births",occ2d:"Because details are the secret of beauty, we create romantic arrangements and elegant touches that add exceptional magic to your day.",
 occ3t:"Home Corner",occ3d:"A small corner… yet enough to change the feel of the entire place; warmth that embraces details and a scent that refreshes the soul.",
 occ4t:"Gift Boxes",occ4d:"Because an elegant gift starts with details, we curate our boxes carefully to reflect your taste.",
 feat_h2:"Why VelaLight?",
 feat1t:"Delivery to All Governorates",feat1d:"We deliver your order wherever you are in Egypt, with safe packaging that protects your candle from workshop to doorstep.",
 feat2t:"100% Natural Ingredients",feat2d:"Pure natural wax with natural wooden and cotton wicks, safe for your health and home.",
 feat3t:"Carefully Handmade",feat3d:"Behind every piece are hours of care and craftsmanship, made and wrapped by hand with precision.",
 feat4t:"Luxury Wrapping",feat4d:"Every candle is carefully wrapped in an elegant arrangement reflecting its beauty, arriving gift-ready.",
 feat5t:"Replacement Guarantee",feat5d:"We're confident you'll fall in love with the product from the first moment; if not fully satisfied, we'll replace it.",
 feat6t:"Always Here for You",feat6d:"Can't decide? Leave it to us. We'll listen to your idea and recommend the perfect gift and scent.",
 faq_h2:"Frequently Asked Questions",
faq1q:"How long does delivery take?",faq1a:"Delivery within Cairo and Giza takes 3-5 business days, and 5-7 for other governorates.",
faq2q:"What payment methods are available?",faq2a:"Product value via InstaPay; shipping cash on delivery.",
faq3q:"Can I exchange the product?",faq3a:"Yes, 3-day exchange policy if unused.",
faq4q:"How long does a candle burn?",faq4a:"72-96 continuous hours.",
faq5q:"Are candles safe around children and pets?",faq5a:"Natural wax; never leave unattended.",
faq6q:"Do you deliver to all governorates?",faq6a:"Yes, all over Egypt.",
rev_h2:"Our Clients' Reviews",rev_sub:"Your trust is our most beautiful gift",rev_verified:"Verified Customer",
 foot_tag1:"Luxury handmade candles - Signature scents - Custom gifts",foot_tag2:"شموع يدوية فاخرة - عطور مميزة - هدايا حسب الطلب",
 foot_quick:"Quick Links",foot_shop:"Shop",foot_admin:"Admin Panel",foot_pay_h:"Payment & Shipping",
 pay_title:"InstaPay — Upfront Transfer",
 foot_pay_note:"Important note: Product value is paid upfront via InstaPay, while the shipping fee is paid in cash to the shipping courier upon receiving the order.",
 foot_rights:"© 2026 - 2030 VelaLight — All Rights Reserved",
 foot_exchange:"Exchange Policy",foot_privacy:"Privacy Policy",foot_terms:"Terms of Use",
 shipping:"Shipping",ship_all:"— all governorates",egp:"EGP",subtotal:"Subtotal",total:"Total",
 cart_title:"🛍️ Shopping Cart",delivery_h:"Delivery Details",
 ph_name:"Full name *",ph_phone:"Mobile number * (WhatsApp)",ph_phone2:"Mobile number (WhatsApp)",ph_city:"Choose governorate",ph_addr:"Full address *",ph_addr2:"Full address",ph_notes:"Notes (gift message, delivery time...)",
 paymethod_h:"Payment: InstaPay — upfront transfer",
 paymethod_d:"Product value is transferred upfront via InstaPay; shipping is paid cash to the courier on delivery. 🎁 Free luxury gift wrapping.",
 checkout_wa:"✅ Complete Order via WhatsApp",empty_cart:"🗑️ Empty Cart",
 cart_empty:"Your cart is still empty 🕯️",cart_empty_sub:"Discover The Collection and choose your piece",scent_lbl:"Scent:",
 acc_title:"My Account 👤",acc_sub:"Register your info once and we'll remember it every visit.",save_acc:"Save & Sign In",orders_count:"Your orders:",logout:"Sign Out",
 search_title:"Search 🔍",search_ph:"Search for a candle, scent, category...",search_help:"Search includes: product name, description, category — in Arabic and English.",
 trk_h2:"📦 Track Your Order",trk_id_ph:"Order ID — e.g. VL-123456",trk_phone_ph:"Mobile number used in the order",trk_btn:"Track Order",
 trk_order:"Order",trk_cancelled:"❌ Order cancelled — contact us on WhatsApp for any questions",trk_total:"Total (incl. shipping)",trk_searching:"⏳ Searching for your order...",trk_notfound:"😕 No order found — double-check the ID or contact us on WhatsApp",
 st1:"Under Review",st2:"Preparing",st3:"Shipped",st4:"Delivered",st5:"Cancelled",
 pd_scent_t:"🌸 Choose scent:",pd_qty_t:"Quantity:",pd_add:"🛍️ Add to Cart",pd_buy:"Order Now via WhatsApp",
 pd_hours:"Burn time:",pd_materials:"Ingredients:",pd_ship:"Delivery:",pd_ship_v:"3–7 business days, all governorates",
 pd_materials_v:"100% natural wax + safe wooden/cotton wick",pd_gift:"Free luxury gift wrapping",pd_gift_v:"with every order",
 pd_exchange:"Replacement guarantee",pd_exchange_v:"within 3 days of delivery",crumb_home:"Home",
 pd_rev_h2:"Product Reviews",pd_first:"Be the first to review this product ✨",
 pd_form_t:"Add your review ⭐",pd_name_ph:"Your name",pd_text_ph:"Write your opinion...",pd_photo_ph:"Review photo URL (optional)",pd_submit:"Submit Review",pd_note:"Reviews appear after approval 🙏",
 pd_rel_h2:"You may also like",pd_share:"Share:",pd_notfound:"😕 Product not found",pd_sold:"Sold",pd_times:"times",
 chat_name:"VelaLight Assistant",chat_sub:"Your personal guide to the perfect candle",
 chat_welcome:"Welcome to VelaLight ✨ I'm your personal guide — pick a question below or type yours 🕯️",
 q_gift:"Suggest a gift",q_relax:"Something to relax",q_scents:"What scents are available?",q_ship:"Delivery question",q_bride:"Bride box",
 a_gift:"I'd love to help! 🎁 Tell me the occasion and budget — check the 'A Gift for Every Occasion' section 👇",
 a_relax:"For relaxation we recommend massage candles 🧖‍♀️ with French Lavender — showing the section now 🕯️",
 a_scents:"We have 19 signature scents 🌸 Check the Luxury Scents section 👇",
 a_ship:"🚚 Delivery all over Egypt within 3–7 days.\n💳 InstaPay upfront + shipping cash on delivery.\n🔁 3-day replacement ✨",
 a_bride:"Congratulations in advance! 👰 The Royal Bride Box is our bestseller — showing the boxes now 💍",
 t_added:"🕯️ Added to cart",t_fill:"⚠️ Please complete delivery details (name, phone, address)",t_empty:"Cart is empty 🕯️",
 t_order:"✅ Order registered",t_revok:"💛 Thank you! Your review will appear after approval",t_revwarn:"⚠️ Please write your name and review",
 t_trkwarn:"⚠️ Enter order ID and phone",t_saved:"💾 Saved",t_lang_ar:"تم التحويل للعربية 🕯️",t_lang_en:"Switched to English ✨",
 t_confirm_empty:"Empty the whole cart?",t_confirm_del:"Are you sure?",t_go_cart:"🛍️ Go to cart to checkout",
 wa_head:"🕯️ New order from VelaLight",wa_order:"🧾 Order ID:",wa_scent:"Scent",wa_total:"💰 Total:",wa_ship:"🚚 Shipping:",wa_cod:"(cash on delivery)",wa_insta:"💳 Transfer product value via InstaPay to:",wa_name:"👤 Name:",wa_phone:"📱 Phone:",wa_city:"🏙️ Governorate:",wa_addr:"📍 Address:",wa_notes:"📝 Notes:",wa_item:"🕯️ Product:"
}};
const t=k=>(I18N[LANG]&&I18N[LANG][k])||I18N.ar[k]||k;
