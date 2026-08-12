VelaLight production replacement set

Upload/replace these files in the repository root:
1. index.html
2. style.css
3. mobile-luxury-fix.css
4. data.js
5. firebase.js
6. app.js

Main fixes in this set:
- Removed the broken/duplicated Hero translation hook that was causing hero_eyebrow / hero_t1 ... keys to appear in English.
- Moved Hero translations into the existing I18N system in data.js so Arabic/English switching uses one translation engine.
- Kept the Hero candle image and all Hero markup intact.
- Kept Firebase filename exactly firebase.js and aligned index.html with it.
- Added Hero image preload for faster first paint.
