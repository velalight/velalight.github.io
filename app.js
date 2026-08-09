(function(){
"use strict";

/* ═══════ تهيئة الصفحة ═══════ */
document.addEventListener("DOMContentLoaded",()=>{
initLang();
initMarquee();
initEmbers();
initReveal();
loadAll().then(()=>{
renderChips();
renderProducts();
renderScents();
renderFAQ();
});
initCart();
initAccount();
initSearch();
initChat();
initNav();
});

window.addEventListener("data-refresh",()=>{
renderProducts();
});

/* ═══════ اللغة ═══════ */
function initLang(){
const btn=$("#langBtn");
if(!btn)return;
updateLangBtn();
btn.addEventListener("click",()=>{
LANG=LANG==="ar"?"en":"ar";
localStorage.setItem("vl_lang",LANG);
document.documentElement.dir=LANG==="ar"?"rtl":"ltr";
document.documentElement.lang=LANG;
applyI18n();
updateLangBtn();
renderChips();
renderProducts();
renderScents();
renderFAQ();
initChatWelcome();
toast(t(LANG==="ar"?"t_lang_ar":"t_lang_en"));
});
applyI18n();
}
function updateLangBtn(){
const btn=$("#langBtn");
if(btn)btn.textContent=LANG==="ar"?"EN":"ع";
}
function applyI18n(){
document.title=t("docTitle");
$$("[data-i18n]").forEach(el=>{el.textContent=t(el.dataset.i18n)});
$$("[data-i18n-ph]").forEach(el=>{el.placeholder=t(el.dataset.i18nPh)});
const mq=$("#mqTrack");
if(mq){const txt=t("mq");mq.innerHTML=`<span>${txt}</span><span>${txt}</span>`}
}

/* ═══════ الشريط المتحرك ═══════ */
function initMarquee(){}

/* ═══════ شرارات الهيرو ═══════ */
function initEmbers(){
const w=$("#embers");
if(!w)return;
for(let i=0;i<12;i++){
const s=document.createElement("span");
s.style.left=Math.random()*100+"%";
s.style.animationDelay=Math.random()*7+"s";
s.style.animationDuration=(5+Math.random()*5)+"s";
w.appendChild(s);
}
}

/* ═══════ ظهور العناصر ═══════ */
function initReveal(){
const io=new IntersectionObserver(es=>es.forEach(e=>{
if(e.isIntersecting){e.target.classList.add("on");io.unobserve(e.target)}
}),{threshold:.12});
$$(".rv").forEach(el=>io.observe(el));
}

/* ═══════ التصنيفات ═══════ */
function renderChips(){
const w=$("#chips");
if(!w)return;
const keys=["all","wood","glass","crystal","metal","massage","gift","bride"];
w.innerHTML=keys.map(k=>`<button class="chip${k==="all"?" on":""}" data-cat="${k}">${cat(k)}</button>`).join("");
w.querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{
w.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));
b.classList.add("on");
renderProducts();
}));
}
function activeCat(){
const c=$("#chips .chip.on");
return c?c.dataset.cat:"all";
}

/* ═══════ عرض المنتجات ═══════ */
function renderProducts(){
const grid=$("#pgrid");
if(!grid)return;
const catF=activeCat();
const min=+($("#priceMin")?.value||0);
const max=+($("#priceMax")?.value||0);
const sort=$("#sortSel")?.value||"new";

let list=ALL_PRODUCTS.filter(p=>{
if(catF!=="all"&&p.cat!==catF)return false;
if(min&&p.price<min)return false;
if(max&&p.price>max)return false;
return true;
});

switch(sort){
case"asc":list.sort((a,b)=>a.price-b.price);break;
case"desc":list.sort((a,b)=>b.price-a.price);break;
case"rating":list.sort((a,b)=>(ratingOf(b.id)?.avg||0)-(ratingOf(a.id)?.avg||0));break;
case"best":list.sort((a,b)=>(b.sold||0)-(a.sold||0));break;
case"disc":list.sort((a,b)=>((b.old-b.price)/Math.max(b.old,1))-((a.old-a.price)/Math.max(a.old,1)));break;
default:list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
}

const cnt=$("#prodCount");
if(cnt)cnt.textContent=list.length+" "+t("prod_word");

if(!list.length){
grid.innerHTML=`<div class="empty">${t("no_products")}</div>`;
return;
}

grid.innerHTML=list.map(p=>{
const r=ratingOf(p.id);
const badge=pbadge(p);
const sc=(p.scents||[]).map(s=>scentTr(s)).join(" · ");
return `<article class="p-card">
<a class="p-media" href="product.html?p=${p.id}">
<img src="${imgOf(p)}" alt="${pname(p)}" loading="lazy">
${badge?`<span class="p-badge">${badge}</span>`:""}
<span class="p-quick">${t("view_details")}</span>
</a>
<div class="p-body">
<span class="p-cat">${cat(p.cat)}</span>
<h3><a href="product.html?p=${p.id}">${pname(p)}</a></h3>
${r?`<span class="stars">${"★".repeat(Math.round(r.avg))}</span>`:""}
<div class="p-scents">🌸 ${sc}</div>
<div class="p-foot">
<div class="p-price">${money(p.price)}${p.old>p.price?`<del>${money(p.old)}</del>`:""}</div>
<button class="p-add" data-id="${p.id}">${t("add_cart")}</button>
</div>
</div>
</article>`;
}).join("");

grid.querySelectorAll(".p-add").forEach(b=>b.addEventListener("click",()=>{
const p=ALL_PRODUCTS.find(x=>x.id===b.dataset.id);
if(p)addToCart(p);
}));
}

/* ═══════ فلاتر السعر والترتيب ═══════ */
document.addEventListener("change",e=>{
if(e.target.id==="priceMin"||e.target.id==="priceMax"||e.target.id==="sortSel")renderProducts();
});
document.addEventListener("input",e=>{
if(e.target.id==="priceMin"||e.target.id==="priceMax")renderProducts();
});

/* ═══════ العطور ═══════ */
function renderScents(){
const w=$("#scentGrid");
if(!w)return;
w.innerHTML=SCENTS.map((s,i)=>`<div class="scent"><i>${i+1}</i><div><b>${LANG==="en"?s[1]:s[0]}</b><small>${LANG==="en"?s[0]:s[1]}</small></div></div>`).join("");
}

/* ═══════ الأسئلة الشائعة ═══════ */
function renderFAQ(){
const w=$("#faqWrap");
if(!w)return;
const items=[[t("faq1q"),t("faq1a")],[t("faq2q"),t("faq2a")],[t("faq3q"),t("faq3a")],[t("faq4q"),t("faq4a")],[t("faq5q"),t("faq5a")],[t("faq6q"),t("faq6a")]];
w.innerHTML=items.map(q=>`<div class="faq-item"><button class="faq-q"><span>${q[0]}</span><span>+</span></button><div class="faq-a"><div>${q[1]}</div></div></div>`).join("");
w.querySelectorAll(".faq-item").forEach(item=>{
item.querySelector(".faq-q").addEventListener("click",()=>{
const was=item.classList.contains("open");
w.querySelectorAll(".faq-item").forEach(x=>{x.classList.remove("open");x.querySelector(".faq-a").style.maxHeight=null});
if(!was){item.classList.add("open");const a=item.querySelector(".faq-a");a.style.maxHeight=a.scrollHeight+"px"}
});
});
}

/* ═══════ السلة ═══════ */
function initCart(){
cartBadge();
$("#cartBtn")?.addEventListener("click",()=>openDrawer("cartDrawer","cartOv"));
$("#closeCart")?.addEventListener("click",closeDrawers);
$("#cartOv")?.addEventListener("click",closeDrawers);
renderCart();

$("#emptyCartBtn")?.addEventListener("click",()=>{
if(!confirm(t("t_confirm_empty")))return;
saveCart([]);renderCart();
});

$("#checkoutBtn")?.addEventListener("click",checkout);
}

function renderCart(){
const c=getCart();
const w=$("#cartItems");
if(!w)return;

if(!c.length){
w.innerHTML=`<div class="empty" style="padding:2rem 0">${t("cart_empty")}<br><small>${t("cart_empty_sub")}</small></div>`;
updateTotals(c);
return;
}

w.innerHTML=c.map((it,i)=>`<div class="citem">
<img src="${it.img||""}" alt="">
<div style="flex:1">
<h5>${pname({name:it.name,nameEn:it.nameEn})}</h5>
<div class="cs">${t("scent_lbl")} ${scentTr(it.scent)}</div>
<div class="cs">${money(it.price)} × ${it.qty}</div>
</div>
<button class="rm" data-i="${i}">✕</button>
</div>`).join("");

w.querySelectorAll(".rm").forEach(b=>b.addEventListener("click",()=>{
c.splice(+b.dataset.i,1);saveCart(c);renderCart();
}));

updateTotals(c);
}

function updateTotals(c){
const sub=c.reduce((a,i)=>a+i.price*i.qty,0);
const ship=c.length?CFG.SHIPPING:0;
if($("#cartSub"))$("#cartSub").textContent=money(sub);
if($("#cartShip"))$("#cartShip").textContent=money(ship);
if($("#cartTotal"))$("#cartTotal").textContent=money(sub+ship);
}

function checkout(){
const c=getCart();
if(!c.length){toast(t("t_empty"));return}

const name=prompt(t("ph_name"));
if(!name){toast(t("t_fill"));return}
const phone=prompt(t("ph_phone"));
if(!phone){toast(t("t_fill"));return}
const addr=prompt(t("ph_addr"));
if(!addr){toast(t("t_fill"));return}

const orderId="VL-"+Date.now().toString(36).toUpperCase();
const sub=c.reduce((a,i)=>a+i.price*i.qty,0);
const total=sub+CFG.SHIPPING;

let msg=`${t("wa_head")}\n${t("wa_order")} ${orderId}\n\n`;
c.forEach(it=>{
msg+=`${t("wa_item")} ${pname({name:it.name,nameEn:it.nameEn})}\n`;
msg+=`${t("wa_scent")}: ${scentTr(it.scent)} | ×${it.qty} = ${money(it.price*it.qty)}\n\n`;
});
msg+=`${t("wa_total")} ${money(total)}\n`;
msg+=`${t("wa_ship")} ${money(CFG.SHIPPING)} ${t("wa_cod")}\n\n`;
msg+=`${t("wa_name")} ${name}\n${t("wa_phone")} ${phone}\n${t("wa_addr")} ${addr}\n`;

DB.add("orders",{
id:orderId,items:c,name,phone,address:addr,
total,shipping:CFG.SHIPPING,status:0,
createdAt:Date.now(),
phone2:"",city:"",notes:""
}).catch(e=>console.warn(e));

saveCart([]);renderCart();cartBadge();
toast(t("t_order"));

const u=JSON.parse(localStorage.getItem("vl_user")||"{}");
u.orders=(u.orders||0)+1;
localStorage.setItem("vl_user",JSON.stringify(u));
const oc=$("#ordCount");if(oc)oc.textContent=u.orders;

window.open("https://wa.me/"+CFG.WHATSAPP+"?text="+encodeURIComponent(msg),"_blank");
}

/* ═══════ حساب المستخدم ═══════ */
function initAccount(){
fillCitySelect($("#accCity"));
const u=JSON.parse(localStorage.getItem("vl_user")||"{}");
if(u.name)$("#accName").value=u.name;
if(u.phone)$("#accPhone").value=u.phone;
if(u.city)$("#accCity").value=u.city;
if(u.addr)$("#accAddr").value=u.addr;
if(u.orders)$("#ordCount").textContent=u.orders;

$("#accBtn")?.addEventListener("click",()=>{
openDrawer("accOv");
});
$("#closeAcc")?.addEventListener("click",()=>closeModal("accOv"));
$("#accOv")?.addEventListener("click",e=>{if(e.target.id==="accOv")closeModal("accOv")});

$("#saveAccBtn")?.addEventListener("click",()=>{
const name=$("#accName").value.trim();
const phone=$("#accPhone").value.trim();
const city=$("#accCity").value;
const addr=$("#accAddr").value.trim();
if(!name||!phone){toast(t("t_fill"));return}
const old=JSON.parse(localStorage.getItem("vl_user")||"{}");
localStorage.setItem("vl_user",JSON.stringify({name,phone,city,addr,orders:old.orders||0}));
toast(t("t_saved"));
closeModal("accOv");
});

$("#logoutBtn")?.addEventListener("click",()=>{
localStorage.removeItem("vl_user");
$("#accName").value="";$("#accPhone").value="";$("#accAddr").value="";
$("#ordCount").textContent="0";
toast(t("t_saved"));
});
}

function fillCitySelect(sel){
if(!sel)return;
const arr=LANG==="en"?GOVS_EN:GOVS;
sel.innerHTML=`<option value="">${t("ph_city")}</option>`+arr.map(g=>`<option>${g}</option>`).join("");
}

/* ═══════ البحث ═══════ */
function initSearch(){
$("#searchBtn")?.addEventListener("click",()=>{
openDrawer("searchOv");
setTimeout(()=>$("#searchInput")?.focus(),200);
});
$("#closeSearch")?.addEventListener("click",()=>closeModal("searchOv"));
$("#searchOv")?.addEventListener("click",e=>{if(e.target.id==="searchOv")closeModal("searchOv")});

$("#searchInput")?.addEventListener("input",e=>{
const q=e.target.value.trim().toLowerCase();
const w=$("#searchResults");
if(!w)return;
if(!q){w.innerHTML="";return}
const res=ALL_PRODUCTS.filter(p=>{
const hay=(p.name+" "+(p.nameEn||"")+" "+(p.desc||"")+" "+(p.descEn||"")+" "+cat(p.cat)).toLowerCase();
return hay.includes(q);
}).slice(0,8);
w.innerHTML=res.map(p=>`<div class="sr-item" data-id="${p.id}">
<img src="${imgOf(p)}" alt="">
<div><b>${pname(p)}</b><br><small>${money(p.price)}</small></div>
</div>`).join("");
w.querySelectorAll(".sr-item").forEach(it=>it.addEventListener("click",()=>{
location.href="product.html?p="+it.dataset.id;
}));
});
}

/* ═══════ الشات المساعد ═══════ */
function initChat(){
$("#chatFab")?.addEventListener("click",()=>{
$("#chatOv")?.classList.toggle("open");
});
$("#closeChat")?.addEventListener("click",()=>{
$("#chatOv")?.classList.remove("open");
});
initChatWelcome();
const quick=[[t("q_gift"),"a_gift"],[t("q_relax"),"a_relax"],[t("q_scents"),"a_scents"],[t("q_ship"),"a_ship"],[t("q_bride"),"a_bride"]];
const qw=$("#chatQuick");
if(qw){
qw.innerHTML=quick.map(q=>`<button data-a="${q[1]}">${q[0]}</button>`).join("");
qw.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
addMsg(b.textContent,"user");
setTimeout(()=>addMsg(t(b.dataset.a),"bot"),400);
}));
}
}
function initChatWelcome(){
const w=$("#chatMsgs");
if(w&&!w.children.length)addMsg(t("chat_welcome"),"bot");
}
function addMsg(txt,who){
const w=$("#chatMsgs");
if(!w)return;
const d=document.createElement("div");
d.className="msg "+who;
d.textContent=txt;
w.appendChild(d);
w.scrollTop=w.scrollHeight;
}

/* ═══════ القائمة والمودالات ═══════ */
function initNav(){
$("#navToggle")?.addEventListener("click",()=>{
$("#mnav")?.classList.toggle("open");
$("#ovl")?.classList.toggle("open");
});
$("#ovl")?.addEventListener("click",closeDrawers);
$$(".mnav a").forEach(a=>a.addEventListener("click",()=>{
$("#mnav")?.classList.remove("open");
$("#ovl")?.classList.remove("open");
}));
$$("[data-cat]").forEach(a=>{
if(a.closest(".mnav")||a.closest(".mainnav")||a.closest("footer")){
a.addEventListener("click",()=>{
setTimeout(()=>{
const chip=$(`#chips .chip[data-cat="${a.dataset.cat}"]`);
if(chip)chip.click();
},100);
});
}
});
}

function openDrawer(id,ovlId){
$("#"+id)?.classList.add("open");
if(ovlId)$("#"+ovlId)?.classList.add("open");
}
function closeDrawers(){
$$(".drawer,.ovl").forEach(el=>el.classList.remove("open"));
}
function closeModal(id){
$("#"+id)?.classList.remove("open");
}

})();