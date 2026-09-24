/* ═══════════════════════════════════════════════════════════
   VelaLight — Auto Product Pages Generator
   
   بيقرأ المنتجات من Firebase + data.js
   ويولّد صفحة HTML لكل منتج في مجلد shop/
   ═══════════════════════════════════════════════════════════ */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ─── 1) Firebase Init ───
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ─── 2) تحميل PRODUCTS من data.js ───
function loadStaticProducts() {
  try {
    const dataCode = fs.readFileSync('data.js', 'utf8');
    
    const sandbox = {
      window: { addEventListener: () => {}, dispatchEvent: () => {} },
      document: { 
        createElement: () => ({ style: {}, setAttribute: () => {} }), 
        head: { appendChild: () => {} },
        querySelector: () => null,
        querySelectorAll: () => []
      },
      localStorage: { 
        getItem: () => null, 
        setItem: () => {},
        removeItem: () => {}
      },
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout: () => {},
      clearTimeout: () => {},
      setInterval: () => {},
      clearInterval: () => {},
      URL: URL,
      URLSearchParams: URLSearchParams,
      Date: Date,
      Math: Math,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Promise: Promise,
      Map: Map,
      Set: Set,
      parseFloat: parseFloat,
      parseInt: parseInt,
      isNaN: isNaN,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent
    };
    sandbox.globalThis = sandbox;
    
    vm.createContext(sandbox);
    vm.runInContext(dataCode, sandbox, { timeout: 5000 });
    
    return sandbox.PRODUCTS || [];
  } catch (err) {
    console.warn('⚠️ Could not load static products from data.js:', err.message);
    return [];
  }
}

// ─── 3) جلب منتجات Firebase ───
async function getFirebaseProducts() {
  try {
    const snapshot = await db.collection('products').get();
    return snapshot.docs.map(doc => ({ id: doc.id, _fid: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('⚠️ Firebase read failed:', err.message);
    return [];
  }
}

// ─── 4) دمج المنتجات ───
function mergeProducts(staticList, fbList) {
  const map = new Map();
  
  staticList.forEach(p => {
    if (p && p.id) map.set(String(p.id), { ...p });
  });
  
  fbList.forEach(p => {
    if (!p) return;
    const slug = String(p.id_ || p.slug || p.pid || p.id || p._fid || '');
    if (!slug) return;
    if (p.active === false) {
      map.delete(slug);
      return;
    }
    map.set(slug, { ...(map.get(slug) || {}), ...p, id: slug });
  });
  
  return [...map.values()];
}

// ─── 5) أدوات مساعدة ───
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/\n/g, ' ');
}

function formatPrice(num) {
  return Number(num || 0).toLocaleString('en-US');
}

// ─── 6) CDN للصور ───
function cdnUrl(imgPath) {
  if (!imgPath) return 'https://velalight.github.io/velalight-wooden-luxury-set-3candles-detail.webp';
  if (imgPath.startsWith('http')) return imgPath;
  return `https://cdn.jsdelivr.net/gh/velalight/velalight.github.io@main/${imgPath}`;
}

// ─── 7) توليد HTML لكل منتج ───
function generateProductHtml(product) {
  const id = String(product.id);
  const name = product.name || product.nameEn || 'منتج';
  const desc = product.desc || product.descEn || '';
  const price = Number(product.price || 0);
  const oldPrice = Number(product.old || 0);
  const category = product.cat || '';
  
  const images = [];
  if (Array.isArray(product.imgs) && product.imgs.length) {
    images.push(...product.imgs.filter(Boolean));
  } else if (product.img) {
    images.push(product.img);
  }
  if (!images.length) images.push('velalight-wooden-luxury-set-3candles-detail.webp');
  
  const mainImage = cdnUrl(images[0]);
  const allImages = images.slice(0, 5).map(cdnUrl);
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "image": allImages,
    "description": (desc || name).slice(0, 500),
    "sku": id,
    "brand": { "@type": "Brand", "name": "VelaLight" },
    "offers": {
      "@type": "Offer",
      "url": `https://velalight.github.io/shop/${id}.html`,
      "priceCurrency": "EGP",
      "price": String(price),
      "availability": product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": { "@type": "Organization", "name": "VelaLight" }
    }
  };
  
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://velalight.github.io/" },
      { "@type": "ListItem", "position": 2, "name": "تسوق", "item": "https://velalight.github.io/products.html" },
      { "@type": "ListItem", "position": 3, "name": name, "item": `https://velalight.github.io/shop/${id}.html` }
    ]
  };
  
  const oldPriceHtml = oldPrice > price ? `<del>${formatPrice(oldPrice)} ج.م</del>` : '';
  
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(name)} | VelaLight</title>
<meta name="description" content="${escapeAttr(desc || name)}">
<meta name="theme-color" content="#faf6f0">
<link rel="canonical" href="https://velalight.github.io/shop/${id}.html">

<meta property="og:type" content="product">
<meta property="og:title" content="${escapeAttr(name)} | VelaLight">
<meta property="og:description" content="${escapeAttr(desc || name)}">
<meta property="og:image" content="${mainImage}">
<meta property="og:url" content="https://velalight.github.io/shop/${id}.html">
<meta property="og:site_name" content="VelaLight">
<meta property="og:locale" content="ar_EG">
<meta property="product:price:amount" content="${price}">
<meta property="product:price:currency" content="EGP">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(name)}">
<meta name="twitter:description" content="${escapeAttr(desc || name)}">
<meta name="twitter:image" content="${mainImage}">

<script type="application/ld+json">${JSON.stringify(schema)}<\/script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}<\/script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=El+Messiri:wght@400;500;600;700&display=swap">

<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--gold:#d4af37;--gold2:#b8863f;--dark:#1a1512;--cream:#faf6f0;--mut:#5a4a3a;--dim:#8a7a64;--line:rgba(26,21,18,.1)}
body{font-family:'Tajawal',sans-serif;background:var(--cream);color:var(--dark);line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:1100px;margin:0 auto;padding:0 20px}
.header{padding:20px 0;text-align:center;border-bottom:1px solid var(--line);background:#fff}
.header a{color:var(--dark);text-decoration:none;font-family:'El Messiri',serif;font-size:1.4rem;font-weight:700}
.crumb{font-size:.85rem;color:var(--dim);padding:20px 0;text-align:center}
.crumb a{color:var(--mut);text-decoration:none}
.main{padding:20px 0 60px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start}
@media(max-width:768px){.main{grid-template-columns:1fr;gap:20px}}
.gallery{border-radius:20px;overflow:hidden;background:#fff;border:1px solid var(--line);box-shadow:0 10px 30px rgba(100,70,30,.1)}
.gallery img{width:100%;height:auto;display:block;aspect-ratio:1;object-fit:cover}
.info h1{font-family:'El Messiri',serif;font-size:clamp(1.6rem,3.5vw,2.4rem);margin-bottom:12px;line-height:1.2}
.cat{color:var(--gold2);font-size:.85rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.price{display:flex;align-items:baseline;gap:12px;margin:20px 0}
.price .now{font-family:'El Messiri',serif;font-size:2rem;font-weight:800;color:var(--gold2)}
.price del{color:var(--dim);font-size:1rem}
.desc{color:var(--mut);font-size:1rem;line-height:1.9;padding:20px;background:#fdf5ed;border-radius:14px;border-inline-start:3px solid var(--gold);margin:20px 0}
.cta{display:inline-block;background:linear-gradient(135deg,var(--gold),#b8863f);color:#fff;padding:16px 40px;border-radius:14px;text-decoration:none;font-weight:800;font-size:1.05rem;box-shadow:0 10px 25px rgba(212,175,55,.4);transition:.3s}
.cta:hover{transform:translateY(-3px);box-shadow:0 15px 35px rgba(212,175,55,.5)}
.info-list{display:grid;gap:10px;margin:20px 0}
.info-list li{list-style:none;color:var(--mut);font-size:.9rem;display:flex;align-items:center;gap:8px}
.footer{text-align:center;padding:40px 20px;border-top:1px solid var(--line);color:var(--dim);font-size:.85rem;margin-top:60px}
.footer a{color:var(--gold2);text-decoration:none}
</style>
</head>
<body>

<header class="header">
  <a href="https://velalight.github.io/">🕯️ VelaLight</a>
</header>

<div class="wrap">
  <nav class="crumb">
    <a href="https://velalight.github.io/">الرئيسية</a> ›
    <a href="https://velalight.github.io/products.html">تسوق</a> ›
    <span>${escapeHtml(name)}</span>
  </nav>

  <main class="main">
    <div class="gallery">
      <img src="${mainImage}" alt="${escapeAttr(name)}" width="800" height="800" loading="eager" fetchpriority="high">
    </div>

    <div class="info">
      <div class="cat">${escapeHtml(category)}</div>
      <h1>${escapeHtml(name)}</h1>
      
      <div class="price">
        <span class="now">${formatPrice(price)} ج.م</span>
        ${oldPriceHtml}
      </div>

      <p class="desc">${escapeHtml(desc)}</p>

      <ul class="info-list">
        <li>🕯️ صناعة يدوية 100%</li>
        <li>🚚 توصيل لكل محافظات مصر</li>
        <li>🎁 تغليف هدايا مجاني</li>
        <li>💳 دفع آمن عبر InstaPay / فودافون كاش</li>
      </ul>

      <a class="cta" href="https://velalight.github.io/product.html?p=${id}">
        🛍️ اطلب الآن
      </a>
    </div>
  </main>
</div>

<footer class="footer">
  © 2026 <a href="https://velalight.github.io/">VelaLight</a> — جميع الحقوق محفوظة
</footer>

</body>
</html>`;
}

// ─── 8) توليد sitemap.xml ───
function generateSitemap(products) {
  const now = new Date().toISOString().split('T')[0];
  
  const staticPages = [
    { loc: 'https://velalight.github.io/', priority: '1.0' },
    { loc: 'https://velalight.github.io/products.html', priority: '0.9' },
    { loc: 'https://velalight.github.io/reviews.html', priority: '0.7' },
    { loc: 'https://velalight.github.io/contact.html', priority: '0.6' },
    { loc: 'https://velalight.github.io/privacy.html', priority: '0.3' },
    { loc: 'https://velalight.github.io/terms.html', priority: '0.3' }
  ];
  
  const productPages = products.map(p => ({
    loc: `https://velalight.github.io/shop/${p.id}.html`,
    priority: '0.8'
  }));
  
  const allUrls = [...staticPages, ...productPages];
  
  const urls = allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// ─── 9) الدالة الرئيسية ───
async function main() {
  console.log('🚀 Starting page generation...');
  
  const staticProducts = loadStaticProducts();
  console.log(`📦 Loaded ${staticProducts.length} static products from data.js`);
  
  const fbProducts = await getFirebaseProducts();
  console.log(`☁️ Loaded ${fbProducts.length} products from Firebase`);
  
  const allProducts = mergeProducts(staticProducts, fbProducts);
  console.log(`✅ Total ${allProducts.length} unique products after merge`);
  
  const shopDir = path.join(process.cwd(), 'shop');
  if (!fs.existsSync(shopDir)) {
    fs.mkdirSync(shopDir, { recursive: true });
    console.log('📁 Created shop/ folder');
  }
  
  const existingFiles = fs.readdirSync(shopDir).filter(f => f.endsWith('.html'));
  const newFileNames = new Set(allProducts.map(p => `${p.id}.html`));
  
  let deleted = 0;
  existingFiles.forEach(file => {
    if (!newFileNames.has(file)) {
      fs.unlinkSync(path.join(shopDir, file));
      deleted++;
    }
  });
  if (deleted > 0) console.log(`🗑️ Deleted ${deleted} obsolete pages`);
  
  let generated = 0;
  for (const product of allProducts) {
    try {
      const html = generateProductHtml(product);
      const filePath = path.join(shopDir, `${product.id}.html`);
      fs.writeFileSync(filePath, html, 'utf8');
      generated++;
    } catch (err) {
      console.warn(`⚠️ Failed to generate page for ${product.id}:`, err.message);
    }
  }
  console.log(`✅ Generated ${generated} product pages`);
  
  const sitemap = generateSitemap(allProducts);
  fs.writeFileSync('sitemap.xml', sitemap, 'utf8');
  console.log('✅ Updated sitemap.xml');
  
  console.log('🎉 Done!');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
