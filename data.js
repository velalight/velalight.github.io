const CFG={
WHATSAPP:"201000000000",
INSTAPAY:"velalight@instapay",
SHIPPING:60,
ADMIN_PIN:"2846",
REPO:"velalight/velalight.github.io@main",
FIREBASE:{
apiKey:"AIzaSyDTX0J7Fvccv2oLvpGYYZXHiteGuiE8y8o",
authDomain:"velalight.firebaseapp.com",
projectId:"velalight",
storageBucket:"velalight.firebasestorage.app",
messagingSenderId:"1095485535268",
appId:"1:1095485535268:web:4d17ee9de6f5acdacbd4b1"
},
GA4_ID:"G-XXXXXXXXXX",
META_PIXEL_ID:"YOUR_META_PIXEL_ID",
TIKTOK_PIXEL_ID:"YOUR_TIKTOK_PIXEL_ID"
};

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

function track(ev,d={}){
try{window.gtag&&gtag("event",ev,{...d,currency:"EGP"})}catch(e){}
try{window.fbq&&fbq("track",{view_item:"ViewContent",add_to_cart:"AddToCart",begin_checkout:"InitiateCheckout",purchase:"Purchase",search:"Search"}[ev]||ev,d)}catch(e){}
try{window.ttq&&ttq.track({purchase:"CompletePayment"}[ev]||ev,d)}catch(e){}
}

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let LANG=localStorage.getItem("vl_lang")||"ar";
const money=n=>Number(n||0).toLocaleString("en-US")+" "+(LANG==="en"?"EGP":"ج.م");
const CDN=u=>{if(!u)return"";if(u.startsWith("data:")||u.includes("cdn.jsdelivr.net")||u.startsWith("http"))return u.startsWith("http")?u.replace("https://velalight.github.io/",`https://cdn.jsdelivr.net/gh/${CFG.REPO}/`):u;
return `https://cdn.jsdelivr.net/gh/${CFG.REPO}/${u}`};
function toast(m){if(!$("#toasts"))return;const d=document.createElement("div");d.className="toast";d.textContent=m;$("#toasts").appendChild(d);setTimeout(()=>d.remove(),3200)}

const CATS={ar:{all:"كل الشموع",wood:"شموع خشبية",glass:"شموع زجاجية",crystal:"شموع كريستالية",metal:"شموع معدنية",massage:"شموع المساج",gift:"الهدايا",bride:"بوكس العروسة"},
en:{all:"All Candles",wood:"Wooden Candles",glass:"Glass Candles",crystal:"Crystal Candles",metal:"Metal Candles",massage:"Massage Candles",gift:"Gifts",bride:"Bride Box"}};
const cat=k=>CATS[LANG][k]||k;

const SCENTS=[["فانيليا","Vanilla"],["موكا","Mocha"],["كراميل","Caramel"],["قرفة","Cinnamon"],["عنبر","Amber"],["عود","Oud"],["قهوة","Coffee"],["أناناس","Pineapple"],["كوكونات","Coconut"],["كاريبيان فروت","Caribbean Fruit"],["مانجو","Mango"],["توت","Berry"],["ورد","Rose"],["ياسمين","Jasmine"],["فل","Arabian Jasmine"],["لافندر","Lavender"],["مسك أبيض","White Musk"],["ساندال وود","Sandalwood"],["باتشولي","Patchouli"]];
const scentTr=n=>{const f=SCENTS.find(s=>s[0]===n||s[1]===n);return f?(LANG==="en"?f[1]:f[0]):n};

const GOVS=["القاهرة","الجيزة","الإسكندرية","القليوبية","الدقهلية","الشرقية","الغربية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","شمال سيناء","جنوب سيناء","البحر الأحمر","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","الوادي الجديد","مطروح"];
const GOVS_EN=["Cairo","Giza","Alexandria","Qalyubia","Dakahlia","Sharqia","Gharbia","Menoufia","Beheira","Kafr El Sheikh","Damietta","Port Said","Ismailia","Suez","North Sinai","South Sinai","Red Sea","Fayoum","Beni Suef","Minya","Assiut","Sohag","Qena","Luxor","Aswan","New Valley","Matrouh"];

const STATUS=["قيد المراجعة","جاري التجهيز","تم الشحن","تم التسليم","ملغي"];

const D=864e5,NOW=Date.now();
const PRODUCTS=[
{id:"1",name:"الشمعة الفاخرة (مجموعة 3 شموع)",nameEn:"Luxury Candle Set (3 Candles)",cat:"wood",price:650,old:750,badge:"خصم",badgeEn:"Sale",hours:"3 شموع × 72 ساعة",hoursEn:"3 candles × 72h",scents:["عود","فانيليا","مسك أبيض"],img:"RRRR.jpg",imgs:["RRRR.jpg","RRRRR.jpg","RRRRRR.jpg","RR.jpg","RRR.jpg"],sold:0,createdAt:NOW-1*D,
desc:"ثلاث شموع فاخرة في مجموعة واحدة، صُممت لتتناغم معًا كسيمفونية من الضوء والعطر.",
descEn:"Three luxury candles in one curated set."},
{id:"2",name:"شمعة نبضين",nameEn:"Two Heartbeats Candle",cat:"wood",price:650,old:750,badge:"خصم",badgeEn:"Sale",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["ورد","فانيليا","مسك أبيض"],img:"heart2.jpg",imgs:["heart2.jpg","heart3.jpg","heart1.jpg"],sold:0,createdAt:NOW-2*D,
desc:"ليست مجرد شمعة... بل قطعة تُحاكي المشاعر.",
descEn:"More than a candle — a piece that echoes emotions."},
{id:"3",name:"جولدن كاندل",nameEn:"Golden Candle Set",cat:"glass",price:2850,old:3600,badge:"خصم",badgeEn:"Sale",hours:"3 شموع × 96 ساعة",hoursEn:"3 candles × 96h",scents:["عنبر","عود","كراميل"],img:"candle1.jpg",imgs:["candle1.jpg","candle2.jpg","candle3.jpg","candle4.jpg","candle5.jpg"],sold:0,createdAt:NOW-3*D,
desc:"مجموعة من ثلاث شموع في أوانٍ زجاجية فاخرة.",
descEn:"A set of three candles in luxurious glass vessels."},
{id:"4",name:"شمعة الأيس كوفي",nameEn:"Iced Coffee Candle",cat:"glass",price:425,old:550,badge:"خصم",badgeEn:"Sale",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["قهوة","موكا","فانيليا"],img:"iccoffe1.jpg",imgs:["iccoffe1.jpg","iccoffe2.jpg","iccoffe3.jpg","iccoffe4.jpg"],sold:0,createdAt:NOW-4*D,
desc:"شمعة آيس كوفي صُنعت لتأخذك إلى هدوء المقاهي الراقية.",
descEn:"Iced coffee candle for calm moments."},
{id:"5",name:"شمعة المانديلا",nameEn:"Mandala Candle",cat:"metal",price:325,old:0,badge:"الأكثر مبيعًا",badgeEn:"Best Seller",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["عود","عنبر","قرفة"],img:"mandle.jpg",imgs:["mandle.jpg"],sold:0,createdAt:NOW-5*D,
desc:"الأكثر مبيعًا... والأقرب إلى كل بيت يعشق التفاصيل الراقية.",
descEn:"The best-seller."},
{id:"6",name:"شمعة المساج",nameEn:"Massage Candle",cat:"metal",price:325,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","ياسمين","كوكونات"],img:"gift1.jpg",imgs:["gift1.jpg","gift2.jpg","gift3.jpg","gift4.jpg","gift5.jpg","gift6.jpg","gift7.jpg"],sold:0,createdAt:NOW-6*D,
desc:"تجربة عناية فاخرة تبدأ بوهجٍ هادئ وتنتهي ببشرة أكثر نعومة.",
descEn:"A luxury care experience."},
{id:"7",name:"شمعة كريستال ذهبية",nameEn:"Crystal Gold Candle",cat:"crystal",price:750,old:900,badge:"خصم",badgeEn:"Sale",hours:"96 ساعة اشتعال",hoursEn:"96h burn time",scents:["عنبر","ورد","مسك أبيض"],img:"candle13.jpg",imgs:["candle13.jpg"],sold:0,createdAt:NOW-7*D,
desc:"قطعة استثنائية في إناء كريستال فاخر.",
descEn:"An exceptional piece in a luxury crystal vessel."},
{id:"8",name:"بلو كريستال",nameEn:"Blue Crystal",cat:"crystal",price:720,old:0,badge:"",badgeEn:"",hours:"96 ساعة اشتعال",hoursEn:"96h burn time",scents:["توت","أناناس","لافندر"],img:"candle14.jpg",imgs:["candle14.jpg"],sold:0,createdAt:NOW-8*D,
desc:"شمعة كريستالية بلون أزرق أنيق.",
descEn:"A crystal candle with elegant blue color."},
{id:"9",name:"لافندر (جلاس)",nameEn:"Lavender (Glass)",cat:"glass",price:430,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","باتشولي","مسك أبيض"],img:"candle9.jpg",imgs:["candle9.jpg"],sold:0,createdAt:NOW-9*D,
desc:"شمعة زجاجية بعطر اللافندر الفرنسي المهدئ.",
descEn:"A glass candle with calming French lavender scent."},
{id:"10",name:"ياسمين (جلاس)",nameEn:"Jasmine (Glass)",cat:"glass",price:440,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["ياسمين","فل","ورد"],img:"candle10.jpg",imgs:["candle10.jpg"],sold:0,createdAt:NOW-10*D,
desc:"شمعة زجاجية بعطر الياسمين النقي.",
descEn:"A glass candle with pure jasmine scent."},
{id:"11",name:"فانيليا (جلاس)",nameEn:"Vanilla (Glass)",cat:"glass",price:400,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["فانيليا","كراميل","موكا"],img:"candle11.jpg",imgs:["candle11.jpg"],sold:0,createdAt:NOW-11*D,
desc:"شمعة زجاجية بعطر الفانيلا الكلاسيكي.",
descEn:"A glass candle with classic vanilla scent."},
{id:"12",name:"شمعة مساج ريلاكس",nameEn:"Relax Massage Candle",cat:"massage",price:380,old:0,badge:"",badgeEn:"",hours:"72 ساعة اشتعال",hoursEn:"72h burn time",scents:["لافندر","فل","مسك أبيض"],img:"candle19.jpg",imgs:["candle19.jpg"],sold:0,createdAt:NOW-12*D,
desc:"شمعة مساج بعطر اللافندر المهدئ.",
descEn:"A massage candle with calming lavender scent."},
{id:"13",name:"بوكس هدية فاخر",nameEn:"Luxury Gift Box",cat:"gift",price:850,old:0,badge:"",badgeEn:"",hours:"شمعة + إكسسوارات",hoursEn:"Candle + accessories",scents:["عود","عنبر","ورد"],img:"gifta.jpg",imgs:["gifta.jpg"],sold:0,createdAt:NOW-13*D,
desc:"بوكس هدايا فاخر بتغليف ملكي.",
descEn:"A luxury gift box with royal wrapping."},
{id:"14",name:"بوكس العروسة",nameEn:"Bride Box",cat:"bride",price:1500,old:0,badge:"الأكثر طلبًا",badgeEn:"Most Requested",hours:"بوكس متكامل",hoursEn:"Complete box",scents:["ورد","ياسمين","مسك أبيض","فانيليا"],img:"box1.jpg",imgs:["box1.jpg"],sold:0,createdAt:NOW-14*D,
desc:"أفخم بوكس عروسة.",
descEn:"The most luxurious bride box."}
];

function ph(p){const T={wood:["#3a2417","#8a5a33"],glass:["#1c2a36","#7fa6c4"],crystal:["#33290f","#e2c078"],metal:["#2b2118","#c09a5e"],massage:["#2a2233","#a98cc9"],gift:["#331d1d","#d98a7e"],bride:["#33242e","#e3b7c8"]}[p.cat]||["#2b2118","#c09a5e"];
const s=`<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><defs><radialGradient id='g' cx='50%' cy='36%' r='78%'><stop offset='0%' stop-color='${T[1]}' stop-opacity='.5'/><stop offset='58%' stop-color='${T[0]}'/><stop offset='100%' stop-color='#120d0a'/></radialGradient><linearGradient id='j' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${T[1]}' stop-opacity='.92'/><stop offset='1' stop-color='${T[0]}'/></linearGradient></defs><rect width='900' height='900' fill='url(#g)'/><ellipse cx='450' cy='320' rx='150' ry='170' fill='#ffb757' opacity='.10'/><ellipse cx='450' cy='340' rx='75' ry='95' fill='#ffcf7d' opacity='.13'/><path d='M450 296 q28 36 0 66 q-28 -30 0 -66' fill='#ffcf7d'/><rect x='445' y='360' width='10' height='32' rx='4' fill='#241610'/><rect x='328' y='392' width='244' height='292' rx='28' fill='url(#j)'/><rect x='328' y='392' width='244' height='292' rx='28' fill='#fff' opacity='.05'/><rect x='352' y='474' width='196' height='122' rx='12' fill='#0f0a08' opacity='.58'/><text x='450' y='528' font-family='Georgia' font-size='34' fill='#e9c87a' text-anchor='middle'>VelaLight</text><text x='450' y='566' font-family='Georgia' font-size='16' fill='#cbb287' text-anchor='middle'>Luxury Candle</text></svg>`;
return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s)}

const imgsOf=p=>{if(p.imgs&&p.imgs.length)return p.imgs;const raw=p.img||"";return String(raw).split(",").map(s=>s.trim()).filter(Boolean)};
const imgOf=p=>{const a=imgsOf(p);return a.length?CDN(a[0]):ph(p)};
const pname=p=>LANG==="en"?(p.nameEn||p.en||p.name):p.name;
const pdesc=p=>LANG==="en"?(p.descEn||p.desc||""):(p.desc||"");
const phours=p=>LANG==="en"?(p.hoursEn||p.hours||"72h"):(p.hours||"72 ساعة");
const pbadge=p=>LANG==="en"?(p.badgeEn||p.badge||""):(p.badge||"");

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

const SEED_REVIEWS=[];

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

const I18N={
ar:{
docTitle:"VelaLight | شموع يدوية فاخرة",docDesc:"VelaLight — شموع يدوية فاخرة",
mq:"🚚 توصيل سريع &nbsp;•&nbsp; 🏷️ خصومات &nbsp;•&nbsp; 🎁 تغليف مجاني &nbsp;•&nbsp; ✨ ضمان استبدال &nbsp;•&nbsp;",
nav_home:"الرئيسية",nav_shop:"تسوق",nav_about:"من نحن",nav_faq:"الأسئلة الشائعة",nav_contact:"تواصل معنا",
cat_all:"كل الشموع",cat_wood:"شموع خشبية",cat_glass:"شموع زجاجية",cat_crystal:"شموع كريستالية",cat_metal:"شموع معدنية",cat_massage:"شموع المساج",cat_gift:"الهدايا",cat_bride:"بوكس العروسة",
mn_cats:"تصنيفات الشموع",mn_explore:"اكتشف",mn_scents:"العطور الفاخرة",mn_occ:"المناسبات والهدايا",mn_why:"لماذا VelaLight؟",mn_rev:"آراء عملائنا",mn_track:"📦 تتبع الطلب",mn_contact:"تواصل",
hero_kick:"✦ شموع يدوية فاخرة · صناعة مصرية",hero_a:"ضوء يُحكى…",hero_b:"وبريق يليق بكِ",
hero_lead:"في VelaLight كل شمعة اتصنعت يدويًا بعناية.",
cta_shop:"اكتشفي The Collection ✨",cta_story:"Our Story",
trust1:"🚚 توصيل لكل مصر",trust2:"🤲 100% صناعة يدوية",trust3:"🎁 تغليف هدايا مجاني",trust4:"🔁 استبدال خلال 3 أيام",
prod_h2:"اختار قطعتك المفضلة",price_lbl:"💰 السعر:",from_ph:"من",to_ph:"إلى",sort_lbl:"ترتيب:",
sort_new:"الأحدث",sort_asc:"الأرخص أولًا",sort_desc:"الأغلى أولًا",sort_rating:"الأعلى تقييمًا",sort_best:"الأكثر مبيعًا",sort_disc:"أكبر خصم",
prod_word:"منتج",add_cart:"+ أضيفي للسلة",view_details:"👁️ عرض التفاصيل",no_products:"🕯️ مفيش منتجات",
about_h2:"من نحن",
about_p1:"في VelaLight لا نصنع الشموع فقط، بل نصنع لحظات تستحق أن تُعاش.",
about_p2:"نصنع كل شمعة يدويًا بعناية.",
stat_clients:"عميلة سعيدة",stat_scents:"عطر مميز",stat_hand:"صناعة يدوية",
scents_h2:"العطور الفاخرة",scents_sub:"كل العطور متاحة",
occ_h2:"هدية لكل مناسبة",
occ1t:"أعياد الميلاد",occ1d:"هدية استثنائية.",
occ2t:"الزفاف والخطوبة",occ2d:"توزيعات رومانسية.",
occ3t:"ركن المنزل",occ3d:"دفء يحتضن التفاصيل.",
occ4t:"بوكسات الهدايا",occ4d:"تنسيق بعناية.",
feat_h2:"لماذا VelaLight؟",
feat1t:"توصيل لكل المحافظات",feat1d:"بنوصل طلبك.",
feat2t:"خامات طبيعية 100%",feat2d:"شمع طبيعي.",
feat3t:"صناعة يدوية",feat3d:"ساعات من العناية.",
feat4t:"تغليف فاخر",feat4d:"تنسيق راقٍ.",
feat5t:"ضمان استبدال",feat5d:"خلال 3 أيام.",
feat6t:"دعم دائم",feat6d:"هنساعدك تختاري.",
faq_h2:"الأسئلة الشائعة",
faq1q:"كام مدة التوصيل؟",faq1a:"3–7 أيام عمل.",
faq2q:"إزاي بيتم الدفع؟",faq2a:"InstaPay مقدمًا، والشحن كاش.",
faq3q:"أقدر أستبدل المنتج؟",faq3a:"نعم، خلال 3 أيام.",
faq4q:"الخامات طبيعية؟",faq4a:"100% شمع طبيعي.",
faq5q:"الشمعة تعيش قد إيه؟",faq5a:"من 72 إلى 96 ساعة.",
faq6q:"أقدر أختار العطر؟",faq6a:"طبعًا! كل العطور متاحة.",
rev_h2:"آراء عملائنا",rev_sub:"ثقتكم أجمل هدية",rev_verified:"عميلة موثّقة",
foot_tag1:"شموع يدوية فاخرة",foot_tag2:"Luxury handmade candles",
foot_quick:"روابط سريعة",foot_shop:"تسوق",foot_admin:"لوحة التحكم",foot_pay_h:"الدفع والشحن",
pay_title:"InstaPay — تحويل مقدم",
foot_pay_note:"قيمة المنتجات InstaPay، والشحن كاش عند الاستلام.",
foot_rights:"© 2026 - 2030 VelaLight — جميع الحقوق محفوظة",
foot_exchange:"سياسة الاستبدال",foot_privacy:"سياسة الخصوصية",foot_terms:"شروط الاستخدام",
shipping:"الشحن",ship_all:"— لكل المحافظات",egp:"ج.م",subtotal:"المجموع",total:"الإجمالي",
cart_title:"🛍️ سلة الشراء",delivery_h:"بيانات التوصيل",
ph_name:"الاسم بالكامل *",ph_phone:"رقم الموبايل *",ph_phone2:"رقم الموبايل",ph_city:"اختاري المحافظة",ph_addr:"العنوان بالتفصيل *",ph_addr2:"العنوان",ph_notes:"ملاحظات",
paymethod_h:"طريقة الدفع: InstaPay",
paymethod_d:"InstaPay مقدمًا، والشحن كاش عند الاستلام.",
checkout_wa:"✅ إتمام الطلب عبر واتساب",empty_cart:"🗑️ إفراغ السلة",
cart_empty:"سلتك فاضية 🕯️",cart_empty_sub:"اكتشفي The Collection",scent_lbl:"العطر:",
acc_title:"حسابي 👤",acc_sub:"سجّل بياناتك.",save_acc:"حفظ",orders_count:"عدد طلباتك:",logout:"تسجيل خروج",
search_title:"البحث 🔍",search_ph:"ابحثي عن شمعة...",search_help:"البحث يشمل الاسم والوصف والتصنيف.",
trk_h2:"📦 تتبع طلبك",trk_id_ph:"رقم الطلب",trk_phone_ph:"رقم الموبايل",trk_btn:"تتبع الطلب",
trk_order:"طلب",trk_cancelled:"❌ الطلب ملغي",trk_total:"الإجمالي",trk_searching:"⏳ بنبحث...",trk_notfound:"😕 مش لاقيين الطلب",
st1:"قيد المراجعة",st2:"جاري التجهيز",st3:"تم الشحن",st4:"تم التسليم",st5:"ملغي",
pd_scent_t:"🌸 اختاري العطر:",pd_qty_t:"الكمية:",pd_add:"🛍️ أضيفي للسلة",pd_buy:"اطلبي عبر واتساب",
pd_hours:"مدة الاشتعال:",pd_materials:"الخامات:",pd_ship:"التوصيل:",pd_ship_v:"3–7 أيام",
pd_materials_v:"شمع طبيعي 100%",pd_gift:"تغليف هدايا مجاني",pd_gift_v:"مع كل طلب",
pd_exchange:"ضمان استبدال",pd_exchange_v:"خلال 3 أيام",crumb_home:"الرئيسية",
pd_rev_h2:"مراجعات المنتج",pd_first:"كوني أول من يراجع",
pd_form_t:"ضيفي مراجعتك ⭐",pd_name_ph:"اسمك",pd_text_ph:"اكتبي رأيك...",pd_photo_ph:"رابط صورة",pd_submit:"إرسال",pd_note:"المراجعة بتظهر بعد الموافقة",
pd_rel_h2:"منتجات هتعجبك",pd_share:"مشاركة:",pd_notfound:"😕 المنتج مش موجود",pd_sold:"تم بيعه",pd_times:"مرة",
chat_name:"مساعد VelaLight",chat_sub:"دليلك الشخصي",
chat_welcome:"أهلًا بيكِ ✨",
q_gift:"اقترح لي هدية",q_relax:"عايزة حاجة للاسترخاء",q_scents:"إيه العطور المتاحة؟",q_ship:"سؤال عن التوصيل",q_bride:"بوكس عروسة",
a_gift:"أكيد أساعدك! 🎁",
a_relax:"للاسترخاء بنرشح شموع المساج 🧖‍♀️",
a_scents:"عندنا 19 عطر 🌸",
a_ship:"🚚 بنوصل لكل مصر خلال 3–7 أيام.",
a_bride:"عقبال فرحك! 👰",
t_added:"🕯️ تم الإضافة",t_fill:"⚠️ كمّلي البيانات",t_empty:"السلة فاضية 🕯️",
t_order:"✅ تم تسجيل طلبك",t_revok:"💛 شكرًا!",t_revwarn:"⚠️ اكتبي اسمك ومراجعتك",
t_trkwarn:"⚠️ دخّلي رقم الطلب",t_saved:"💾 تم الحفظ",t_lang_ar:"تم التحويل للعربية",t_lang_en:"English",
t_confirm_empty:"هتفضّي السلة؟",t_confirm_del:"متأكدة؟",t_go_cart:"🛍️ اذهبي للسلة",
wa_head:"🕯️ طلب جديد",wa_order:"🧾 رقم الطلب:",wa_scent:"العطر",wa_total:"💰 الإجمالي:",wa_ship:"🚚 الشحن:",wa_cod:"(كاش)",wa_insta:"💳 InstaPay:",wa_name:"👤 الاسم:",wa_phone:"📱 الموبايل:",wa_city:"🏙️ المحافظة:",wa_addr:"📍 العنوان:",wa_notes:"📝 ملاحظات:",wa_item:"🕯️ المنتج:"
},
en:{
docTitle:"VelaLight | Luxury Candles",docDesc:"Luxury handmade candles.",
mq:"🚚 Fast delivery &nbsp;•&nbsp; 🏷️ Discounts &nbsp;•&nbsp; 🎁 Free wrapping &nbsp;•&nbsp; ✨ Guarantee &nbsp;•&nbsp;",
nav_home:"Home",nav_shop:"Shop",nav_about:"Our Story",nav_faq:"FAQ",nav_contact:"Contact",
cat_all:"All Candles",cat_wood:"Wooden",cat_glass:"Glass",cat_crystal:"Crystal",cat_metal:"Metal",cat_massage:"Massage",cat_gift:"Gifts",cat_bride:"Bride Box",
mn_cats:"Categories",mn_explore:"Explore",mn_scents:"Scents",mn_occ:"Occasions",mn_why:"Why VelaLight?",mn_rev:"Reviews",mn_track:"📦 Track",mn_contact:"Contact",
hero_kick:"✦ Luxury Handmade Candles",hero_a:"A Light That Tells a Story…",hero_b:"& a Sparkle That Suits You",
hero_lead:"Every candle is handcrafted with care.",
cta_shop:"Discover The Collection ✨",cta_story:"Our Story",
trust1:"🚚 Delivery all over Egypt",trust2:"🤲 100% Handmade",trust3:"🎁 Free wrapping",trust4:"🔁 3-day replacement",
prod_h2:"Choose Your Favorite",price_lbl:"💰 Price:",from_ph:"From",to_ph:"To",sort_lbl:"Sort:",
sort_new:"Newest",sort_asc:"Low to High",sort_desc:"High to Low",sort_rating:"Top Rated",sort_best:"Best Selling",sort_disc:"Biggest Discount",
prod_word:"products",add_cart:"+ Add to Cart",view_details:"👁️ View",no_products:"🕯️ No products",
about_h2:"About Us",about_p1:"We craft moments worth living.",about_p2:"Every candle is handcrafted.",
stat_clients:"Happy Clients",stat_scents:"Scents",stat_hand:"Handmade",
scents_h2:"Luxury Scents",scents_sub:"All scents available",
occ_h2:"A Gift for Every Occasion",
occ1t:"Birthdays",occ1d:"Exceptional gifts.",
occ2t:"Weddings",occ2d:"Romantic arrangements.",
occ3t:"Home Corner",occ3d:"Warmth.",
occ4t:"Gift Boxes",occ4d:"Curated with care.",
feat_h2:"Why VelaLight?",
feat1t:"Delivery to All",feat1d:"We deliver your order.",
feat2t:"100% Natural",feat2d:"Pure natural wax.",
feat3t:"Handmade",feat3d:"Hours of care.",
feat4t:"Luxury Wrapping",feat4d:"Elegant arrangement.",
feat5t:"Replacement",feat5d:"Within 3 days.",
feat6t:"Support",feat6d:"We'll help you choose.",
faq_h2:"FAQs",
faq1q:"How long delivery?",faq1a:"3-7 business days.",
faq2q:"Payment?",faq2a:"InstaPay upfront, shipping cash.",
faq3q:"Exchange?",faq3a:"Yes, 3 days.",
faq4q:"Natural?",faq4a:"100% natural wax.",
faq5q:"Burn time?",faq5a:"72-96 hours.",
faq6q:"Choose scent?",faq6a:"Yes, all 19 available.",
rev_h2:"Reviews",rev_sub:"Your trust is our gift",rev_verified:"Verified",
foot_tag1:"Luxury handmade candles",foot_tag2:"شموع يدوية فاخرة",
foot_quick:"Quick Links",foot_shop:"Shop",foot_admin:"Admin",foot_pay_h:"Payment & Shipping",
pay_title:"InstaPay",foot_pay_note:"InstaPay upfront, shipping cash.",
foot_rights:"© 2026 - 2030 VelaLight",
foot_exchange:"Exchange",foot_privacy:"Privacy",foot_terms:"Terms",
shipping:"Shipping",ship_all:"all governorates",egp:"EGP",subtotal:"Subtotal",total:"Total",
cart_title:"🛍️ Cart",delivery_h:"Delivery Details",
ph_name:"Full name *",ph_phone:"Mobile *",ph_phone2:"Mobile",ph_city:"Governorate",ph_addr:"Address *",ph_addr2:"Address",ph_notes:"Notes",
paymethod_h:"Payment: InstaPay",paymethod_d:"InstaPay upfront, shipping cash.",
checkout_wa:"✅ Order via WhatsApp",empty_cart:"🗑️ Empty",
cart_empty:"Cart empty 🕯️",cart_empty_sub:"Discover the collection",scent_lbl:"Scent:",
acc_title:"My Account 👤",acc_sub:"Save your info.",save_acc:"Save",orders_count:"Your orders:",logout:"Sign Out",
search_title:"Search 🔍",search_ph:"Search...",search_help:"Search name, description, category.",
trk_h2:"📦 Track Order",trk_id_ph:"Order ID",trk_phone_ph:"Phone",trk_btn:"Track",
trk_order:"Order",trk_cancelled:"❌ Cancelled",trk_total:"Total",trk_searching:"⏳ Searching...",trk_notfound:"😕 Not found",
st1:"Review",st2:"Preparing",st3:"Shipped",st4:"Delivered",st5:"Cancelled",
pd_scent_t:"🌸 Scent:",pd_qty_t:"Quantity:",pd_add:"🛍️ Add to Cart",pd_buy:"Order via WhatsApp",
pd_hours:"Burn time:",pd_materials:"Materials:",pd_ship:"Delivery:",pd_ship_v:"3-7 days",
pd_materials_v:"100% natural wax",pd_gift:"Free wrapping",pd_gift_v:"with every order",
pd_exchange:"Replacement",pd_exchange_v:"within 3 days",crumb_home:"Home",
pd_rev_h2:"Reviews",pd_first:"Be the first",
pd_form_t:"Add review ⭐",pd_name_ph:"Your name",pd_text_ph:"Your opinion...",pd_photo_ph:"Photo URL",pd_submit:"Submit",pd_note:"Reviews appear after approval",
pd_rel_h2:"You may also like",pd_share:"Share:",pd_notfound:"😕 Not found",pd_sold:"Sold",pd_times:"times",
chat_name:"VelaLight Assistant",chat_sub:"Your guide",
chat_welcome:"Welcome ✨",
q_gift:"Suggest gift",q_relax:"Relax",q_scents:"Scents?",q_ship:"Delivery?",q_bride:"Bride box",
a_gift:"I'd love to help! 🎁",
a_relax:"Massage candles 🧖‍♀️",
a_scents:"19 scents 🌸",
a_ship:"🚚 3-7 days.",
a_bride:"Congratulations! 👰",
t_added:"🕯️ Added",t_fill:"⚠️ Complete details",t_empty:"Cart empty 🕯️",
t_order:"✅ Order registered",t_revok:"💛 Thank you!",t_revwarn:"⚠️ Write review",
t_trkwarn:"⚠️ Enter ID",t_saved:"💾 Saved",t_lang_ar:"العربية",t_lang_en:"English",
t_confirm_empty:"Empty cart?",t_confirm_del:"Are you sure?",t_go_cart:"🛍️ Go to cart",
wa_head:"🕯️ New order",wa_order:"🧾 Order ID:",wa_scent:"Scent",wa_total:"💰 Total:",wa_ship:"🚚 Shipping:",wa_cod:"(cash)",wa_insta:"💳 InstaPay:",wa_name:"👤 Name:",wa_phone:"📱 Phone:",wa_city:"🏙️ Governorate:",wa_addr:"📍 Address:",wa_notes:"📝 Notes:",wa_item:"🕯️ Product:"
}};
const t=k=>(I18N[LANG]&&I18N[LANG][k])||I18N.ar[k]||k;
