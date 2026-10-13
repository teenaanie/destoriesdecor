/* Storefront views (PRD §5). Each view returns HTML; main.js mounts it and calls bind(). */
(function () {
  const S = Store, e = S.esc;
  const ROOMS = [['living', 'Living room'], ['bedroom', 'Bedroom'], ['dining', 'Dining'], ['study', 'Study'], ['balcony', 'Balcony & garden'], ['pooja', 'Pooja room']];
  const PRICES = [['u500', 'Under ₹500', 0, 499], ['500-1500', '₹500 – ₹1,500', 500, 1500], ['1500-3000', '₹1,500 – ₹3,000', 1501, 3000], ['3000+', '₹3,000 and above', 3001, 1e9]];
  const COLLS = [['gift', 'Gift ideas'], ['christmas', 'Christmas edit']];
  const filters = { cat: '', room: '', price: '', coll: '', q: '', sort: 'featured' };

  const waLink = text => 'https://wa.me/' + S.db.settings.whatsapp + '?text=' + encodeURIComponent(text);

  const logo = `<svg class="logo-mark" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="wood" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#8a5a3b"/><stop offset=".5" stop-color="#6b4129"/><stop offset="1" stop-color="#9a6a47"/></linearGradient></defs><path d="M24 3a21 21 0 1 0 13.6 37l6.4 5-1.6-8A21 21 0 0 0 24 3z" fill="url(#wood)"/><path d="M8 18c8-3 22-3 32 1M7 27c10-2 22-2 34 1" stroke="#5a3520" stroke-width=".8" fill="none" opacity=".5"/><text x="24" y="27" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-weight="700" font-size="15" fill="#f6efe2">dè</text><text x="24" y="35" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-weight="700" font-size="5.2" letter-spacing=".4" fill="#f6efe2">STORIES</text></svg>`;

  function cartCount() { return S.db.cart.reduce((s, l) => s + l.qty, 0); }

  function header(active) {
    const cats = S.visibleCats();
    return `<header class="site-head">
      <div class="wrap head-row">
        <a class="brand" href="#home" aria-label="Dè Stories home">${logo}<span class="brand-text"><span class="brand-name">Dè Stories</span><span class="brand-sub">360° Design Studio</span></span></a>
        <nav class="main-nav" aria-label="Main">
          <a href="#shop" class="${active === 'shop' ? 'on' : ''}">Shop</a>
          <a href="#studio" class="${active === 'studio' ? 'on' : ''}">Design Studio</a>
          <a href="#visit" class="${active === 'visit' ? 'on' : ''}">Visit us</a>
        </nav>
        <div class="head-actions">
          <form class="head-search" id="head-search" role="search"><label class="sr" for="hq">Search products</label><input id="hq" type="search" placeholder="Search vases, Buddha, clocks…" value="${e(filters.q)}"></form>
          <button class="cart-btn" id="open-cart" aria-label="Open cart, ${cartCount()} items">${icon('bag')}<span class="cart-n" ${cartCount() ? '' : 'hidden'}>${cartCount()}</span></button>
        </div>
      </div>
      <nav class="cat-strip" aria-label="Categories"><div class="wrap cat-strip-row">
        ${cats.map(c => `<a href="#shop-${c.id}" class="${filters.cat === c.id && active === 'shop' ? 'on' : ''}">${e(c.name)}</a>`).join('')}
      </div></nav>
    </header>`;
  }

  function footer() {
    const st = S.db.settings;
    return `<footer class="site-foot"><div class="wrap foot-grid">
      <div><div class="foot-brand">Dè Stories</div><p class="script">Curated pieces for a more beautiful you.</p></div>
      <div><h4>Shop</h4>${S.visibleCats().map(c => `<a href="#shop-${c.id}">${e(c.name)}</a>`).join('')}</div>
      <div><h4>Studio</h4><a href="#studio">Interior design</a><a href="#studio-book">Book a consultation</a><a href="#visit">Experience Store</a></div>
      <div><h4>Talk to us</h4><p>${e(st.address)}</p><p class="mono">WhatsApp ${e(st.phoneDisplay)}</p><a href="https://www.instagram.com/de.stories.360/" target="_blank" rel="noopener">Instagram @de.stories.360</a><a href="#admin" class="owner-link">Owner login</a></div>
    </div><div class="wrap foot-base">© 2026 Dè Stories · Kochi · Prototype for review</div></footer>`;
  }

  function icon(n) {
    const P = {
      bag: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
      wa: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.8-1.3-2.3-2.3l1-1-1-2L9 9.5z"/>',
      x: '<path d="M6 6l12 12M18 6L6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
      clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', check: '<path d="M5 12l4 4 10-10"/>', copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>'
    };
    return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
  }

  function priceLabel(p) {
    const [a, b] = S.priceRange(p);
    return a === b ? S.inr(a) : 'From ' + S.inr(a);
  }
  function card(p) {
    const st = S.productStockState(p);
    const badge = st === 'out' ? '<span class="badge out">Sold out</span>' : st === 'low' ? '<span class="badge low">Few left</span>' : p.tags.includes('christmas') ? '<span class="badge xmas">Christmas</span>' : '';
    return `<a class="card" href="#p-${p.slug}">
      <div class="card-img">${badge}<img src="${e(p.images[0])}" alt="${e(p.name)}" loading="lazy"></div>
      <div class="card-body"><span class="card-name">${e(p.name)}</span><span class="card-meta"><span class="card-price">${priceLabel(p)}</span>${p.variants.length > 1 ? `<span class="card-sizes">${p.variants.length} sizes</span>` : ''}</span></div>
    </a>`;
  }

  /* ---------------- Home ---------------- */
  function home() {
    const db = S.db;
    const cats = S.visibleCats();
    const loved = S.topProducts(45, 'units').map(t => S.product(t.pid)).filter(p => p && p.visible).slice(0, 8);
    const xmas = S.visibleProducts().filter(p => p.tags.includes('christmas'));
    const pic = id => (S.product(id) || {}).images?.[0] || '';
    return header('home') + `<main id="main">
      <section class="hero wrap">
        <div class="hero-copy">
          <p class="script hero-script">Curated pieces for a more beautiful you.</p>
          <h1>Every space has a story.<br><em>Let's design yours.</em></h1>
          <p class="lede">Figurines, planters, vases and keepsakes chosen piece by piece at our Kochi studio. Order on WhatsApp, or let our 360° design team style the whole room.</p>
          <div class="btn-row"><a class="btn primary" href="#shop">Shop the collection ${icon('arrow')}</a><a class="btn ghost" href="#studio">Interior design services</a></div>
          <dl class="hero-facts"><div><dt>${db.products.length}</dt><dd>pieces in the catalog</dd></div><div><dt>${cats.length}</dt><dd>collections</dd></div><div><dt>Kochi</dt><dd>Experience Store</dd></div></dl>
        </div>
        <div class="hero-art" aria-hidden="true">
          <figure class="arch a1"><img src="${pic('p001')}" alt=""></figure>
          <figure class="arch a2"><img src="${pic('p043')}" alt=""></figure>
          <figure class="arch a3"><img src="${pic('p059')}" alt=""></figure>
        </div>
      </section>

      <section class="wrap block">
        <div class="block-head"><h2>Shop by collection</h2><a href="#shop" class="more">View all ${icon('arrow')}</a></div>
        <div class="cat-grid">${cats.map(c => {
          const n = S.visibleProducts().filter(p => p.cat === c.id).length;
          return `<a class="cat-tile" href="#shop-${c.id}"><img src="${pic(c.cover) || (S.visibleProducts().find(p => p.cat === c.id) || { images: [''] }).images[0]}" alt="" loading="lazy"><span class="cat-name">${e(c.name)}</span><span class="cat-n">${n} pieces</span></a>`;
        }).join('')}</div>
      </section>

      <section class="wrap block">
        <div class="block-head"><div><h2>Loved right now</h2><p class="sub">Our most-ordered pieces from the last six weeks.</p></div><a href="#shop" class="more">Shop all ${icon('arrow')}</a></div>
        <div class="grid">${loved.map(card).join('')}</div>
      </section>

      <section class="xmas-band"><div class="wrap">
        <div class="block-head"><div><p class="eyebrow">Festive edit · 2026</p><h2>Christmas at Dè Stories</h2><p class="sub">Candelabras, crosses, little lit houses and golden stags for the season.</p></div><a href="#shop-christmas" class="more">See the edit ${icon('arrow')}</a></div>
        <div class="rail">${xmas.map(card).join('')}</div>
      </div></section>

      <section class="wrap block studio-teaser">
        <div class="st-copy"><p class="eyebrow">360° Design Studio</p><h2>Not sure what goes where? We'll style it for you.</h2><p>From a single shelf to a full home, our designers plan, source and style spaces across Kochi. Start with a free 20-minute consultation.</p><a class="btn primary" href="#studio">Explore interior design ${icon('arrow')}</a></div>
        <ol class="st-steps"><li><b>Consult</b><span>We visit or video-call to see your space.</span></li><li><b>Concept</b><span>A moodboard, layout and a budget.</span></li><li><b>Source &amp; build</b><span>Furniture, decor and execution.</span></li><li><b>Style</b><span>Final styling and handover.</span></li></ol>
      </section>

      <section class="wrap block visit-card">
        <div>${icon('pin')}<h3>Visit the Experience Store</h3><p>${e(db.settings.address)}</p><p class="muted">${e(db.settings.hours)}</p></div>
        <a class="btn ghost" href="#visit">Directions &amp; hours</a>
      </section>
    </main>` + footer();
  }

  /* ---------------- Shop ---------------- */
  function applyFilters() {
    let ps = S.visibleProducts();
    if (filters.cat) ps = ps.filter(p => p.cat === filters.cat);
    if (filters.room) ps = ps.filter(p => p.tags.includes(filters.room));
    if (filters.coll) ps = ps.filter(p => p.tags.includes(filters.coll));
    if (filters.price) { const b = PRICES.find(x => x[0] === filters.price); ps = ps.filter(p => { const [a] = S.priceRange(p); return a >= b[2] && a <= b[3]; }); }
    if (filters.q) { const q = filters.q.toLowerCase(); ps = ps.filter(p => (p.name + ' ' + (S.cat(p.cat) || {}).name + ' ' + p.tags.join(' ') + ' ' + p.material).toLowerCase().includes(q)); }
    const by = {
      featured: (a, b) => (b.featured - a.featured) || a.name.localeCompare(b.name),
      low: (a, b) => S.priceRange(a)[0] - S.priceRange(b)[0], high: (a, b) => S.priceRange(b)[0] - S.priceRange(a)[0],
      new: (a, b) => b.created - a.created
    };
    return ps.sort(by[filters.sort] || by.featured);
  }
  function chipGroup(name, opts, val) {
    return `<div class="fgroup" role="group" aria-label="${name}"><span class="flabel">${name}</span><div class="chips">${opts.map(o => `<button type="button" class="chip ${val === o[0] ? 'on' : ''}" data-f="${name.toLowerCase()}" data-v="${o[0]}" aria-pressed="${val === o[0]}">${e(o[1])}</button>`).join('')}</div></div>`;
  }
  function shop(param) {
    if (param === 'christmas' || param === 'gift') { filters.coll = param; filters.cat = ''; }
    else if (param !== undefined) { filters.cat = param; filters.coll = ''; }
    const c = S.cat(filters.cat);
    const list = applyFilters();
    const active = [filters.cat, filters.room, filters.price, filters.coll, filters.q].filter(Boolean).length;
    return header('shop') + `<main id="main" class="wrap shop">
      <div class="shop-head"><div><p class="crumb"><a href="#home">Home</a> / ${c ? e(c.name) : filters.coll === 'christmas' ? 'Christmas edit' : 'All pieces'}</p><h1>${c ? e(c.name) : filters.coll === 'christmas' ? 'Christmas edit' : filters.coll === 'gift' ? 'Gift ideas' : 'Shop all pieces'}</h1></div>
        <div class="sort"><label for="sort">Sort</label><select id="sort">${[['featured', 'Featured'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['new', 'Newest']].map(o => `<option value="${o[0]}" ${filters.sort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
      </div>
      <div class="shop-body">
        <aside class="filters" aria-label="Filters">
          <details class="filters-box" ${innerWidth > 900 || active ? 'open' : ''}><summary>Filters ${active ? `<span class="fcount">${active}</span>` : ''}</summary>
          <div class="fgroup"><label class="flabel" for="fq">Search</label><input id="fq" type="search" value="${e(filters.q)}" placeholder="Name or material"></div>
          ${chipGroup('Category', [['', 'All']].concat(S.visibleCats().map(c => [c.id, c.name])), filters.cat)}
          ${chipGroup('Room', [['', 'Any room']].concat(ROOMS), filters.room)}
          ${chipGroup('Price', [['', 'Any price']].concat(PRICES.map(p => [p[0], p[1]])), filters.price)}
          ${chipGroup('Collection', [['', 'All']].concat(COLLS), filters.coll)}
          ${active ? '<button class="link-btn" id="clear-f">Clear all filters</button>' : ''}
          </details>
        </aside>
        <section aria-live="polite">
          <p class="count">${list.length} ${list.length === 1 ? 'piece' : 'pieces'}</p>
          ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty"><h3>Nothing matches those filters</h3><p>Try a different price band or room, or clear the filters to see all ${S.visibleProducts().length} pieces.</p><button class="btn ghost" id="clear-f2">Clear filters</button></div>`}
        </section>
      </div>
    </main>` + footer();
  }
  function bindShop(rerender) {
    document.querySelectorAll('.chip[data-f]').forEach(b => b.onclick = () => {
      const f = { category: 'cat', room: 'room', price: 'price', collection: 'coll' }[b.dataset.f];
      filters[f] = b.dataset.v;
      if (f === 'cat') { location.hash = b.dataset.v ? 'shop-' + b.dataset.v : 'shop'; return; }
      rerender();
    });
    const sort = document.getElementById('sort'); if (sort) sort.onchange = () => { filters.sort = sort.value; rerender(); };
    const fq = document.getElementById('fq');
    if (fq) { let t; fq.oninput = () => { clearTimeout(t); t = setTimeout(() => { filters.q = fq.value.trim(); rerender(true); }, 250); }; }
    ['clear-f', 'clear-f2'].forEach(id => { const b = document.getElementById(id); if (b) b.onclick = () => { Object.assign(filters, { cat: '', room: '', price: '', coll: '', q: '' }); location.hash = 'shop'; rerender(); }; });
  }

  /* ---------------- Product ---------------- */
  let pick = { pid: '', vid: '', qty: 1 };
  function productView(slug) {
    const p = S.productBySlug(slug);
    if (!p || !p.visible) return header('shop') + `<main class="wrap empty-page"><h1>We couldn't find that piece</h1><p>It may have sold out or been renamed.</p><a class="btn primary" href="#shop">Back to the shop</a></main>` + footer();
    if (pick.pid !== p.id) pick = { pid: p.id, vid: (p.variants.find(v => v.stock > 0) || p.variants[0]).id, qty: 1 };
    const v = p.variants.find(x => x.id === pick.vid) || p.variants[0];
    const c = S.cat(p.cat);
    const st = S.stockState(v);
    const img = v.image || p.images[0];
    const st_ = S.db.settings;
    const det = [['Description', p.desc], ['Material', p.material], ['Dimensions', v.size], ['Weight', p.weight], ['Care', p.care]].filter(d => d[1]);
    const related = S.visibleProducts().filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
    const stockMsg = st === 'out' ? '<span class="stock out">Out of stock in this size</span>' : st === 'low' ? `<span class="stock low">Only ${v.stock} left</span>` : '<span class="stock ok">In stock · ready to ship</span>';
    return header('shop') + `<main id="main" class="wrap pdp">
      <p class="crumb"><a href="#home">Home</a> / <a href="#shop-${c.id}">${e(c.name)}</a> / ${e(p.name)}</p>
      <div class="pdp-grid">
        <div class="pdp-media">
          <img id="pdp-img" src="${e(img)}" alt="${e(p.name)}">
          ${p.images.length > 1 ? `<div class="thumbs">${p.images.map((s, i) => `<button class="thumb" data-src="${e(s)}" aria-label="Photo ${i + 1}"><img src="${e(s)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="pdp-info">
          <p class="eyebrow">${e(c.name)}</p>
          <h1>${e(p.name)}</h1>
          <div class="tag-row">
            <div class="hang-tag" aria-label="Price"><span class="hole" aria-hidden="true"></span><span class="tag-price" id="pdp-price">${S.inr(v.price)}</span><span class="tag-size">${e(v.size)}</span></div>
            <p class="tag-note">Delivery charges are confirmed on WhatsApp before dispatch.</p>
          </div>
          ${p.variants.length > 1 ? `<fieldset class="sizes"><legend>Choose a size</legend><div class="size-chips">${p.variants.map(x => {
            const o = S.stockState(x) === 'out';
            return `<label class="size-chip ${x.id === v.id ? 'on' : ''} ${o ? 'dis' : ''}"><input type="radio" name="size" value="${x.id}" ${x.id === v.id ? 'checked' : ''} ${o ? 'disabled' : ''}><span class="sc-l">${e(x.label)}</span><span class="sc-p">${S.inr(x.price)}</span>${o ? '<span class="sc-o">Sold out</span>' : ''}</label>`;
          }).join('')}</div></fieldset>` : `<p class="one-size"><span>Size</span> ${e(v.size)}</p>`}
          <p>${stockMsg}</p>
          <div class="buy-row">
            <div class="stepper" aria-label="Quantity"><button type="button" id="q-dec" aria-label="Decrease">${icon('minus')}</button><output id="q-val">${pick.qty}</output><button type="button" id="q-inc" aria-label="Increase">${icon('plus')}</button></div>
            <button class="btn primary grow" id="add" ${st === 'out' ? 'disabled' : ''}>${st === 'out' ? 'Sold out' : 'Add to cart'}</button>
          </div>
          <a class="btn wa" href="${waLink(`Hi Dè Stories! I'd like to know more about "${p.name}" (${v.label === 'One size' ? v.size : v.label}, ${S.inr(v.price)}).`)}" target="_blank" rel="noopener">${icon('wa')} Ask about this piece on WhatsApp</a>
          <details class="more" open>
            <summary>More details</summary>
            <dl class="spec">${det.map(d => `<div><dt>${d[0]}</dt><dd>${e(d[1])}</dd></div>`).join('')}</dl>
            ${det.length <= 1 ? '<p class="muted small">More details are coming soon: description, material, weight and care.</p>' : ''}
            <div class="spec-ship"><dt>Delivery &amp; returns</dt><dd>${e(st_.delivery)}</dd></div>
          </details>
          ${p.flag ? `<p class="proto-note"><b>Note for review:</b> ${e(p.flag)}. Catalog page ${(window.CATALOG.products.find(x => x.id === p.id) || {}).page || ''}.</p>` : ''}
        </div>
      </div>
      ${related.length ? `<section class="block"><div class="block-head"><h2>You may also like</h2><a class="more" href="#shop-${c.id}">More ${e(c.name.toLowerCase())} ${icon('arrow')}</a></div><div class="grid">${related.map(card).join('')}</div></section>` : ''}
    </main>` + footer();
  }
  function bindProduct(rerender) {
    const p = S.product(pick.pid); if (!p) return;
    document.querySelectorAll('input[name=size]').forEach(r => r.onchange = () => { pick.vid = r.value; pick.qty = 1; rerender(true); });
    const v = () => p.variants.find(x => x.id === pick.vid);
    const qv = document.getElementById('q-val');
    const inCart = () => (S.db.cart.find(l => l.vid === pick.vid) || { qty: 0 }).qty;
    document.getElementById('q-dec').onclick = () => { pick.qty = Math.max(1, pick.qty - 1); qv.textContent = pick.qty; };
    document.getElementById('q-inc').onclick = () => {
      const max = v().stock - inCart();
      if (pick.qty >= max) { UI.toast(max > 0 ? `Only ${v().stock} in stock` : 'All available pieces are already in your cart'); return; }
      pick.qty++; qv.textContent = pick.qty;
    };
    document.querySelectorAll('.thumb').forEach(t => t.onclick = () => { document.getElementById('pdp-img').src = t.dataset.src; });
    document.getElementById('add').onclick = () => {
      const max = v().stock - inCart();
      if (max <= 0) { UI.toast('All available pieces are already in your cart'); return; }
      const qty = Math.min(pick.qty, max);
      const line = S.db.cart.find(l => l.vid === pick.vid);
      if (line) line.qty += qty; else S.db.cart.push({ vid: pick.vid, qty });
      S.save(); pick.qty = 1; qv.textContent = 1;
      UI.refreshCartCount(); openCart();
    };
  }

  /* ---------------- Cart drawer ---------------- */
  function cartLines() { return S.db.cart.map(l => ({ ...l, hit: S.variant(l.vid) })).filter(l => l.hit); }
  function cartTotal() { return cartLines().reduce((s, l) => s + l.hit.v.price * l.qty, 0); }
  function renderCart() {
    const d = document.getElementById('cart-drawer');
    const lines = cartLines();
    d.innerHTML = `<div class="drawer-head"><h2>Your cart</h2><button class="icon-btn" id="close-cart" aria-label="Close cart">${icon('x')}</button></div>
      ${lines.length ? `<ul class="cart-list">${lines.map(l => `<li>
        <img src="${e(l.hit.v.image || l.hit.p.images[0])}" alt="">
        <div class="cl-info"><a href="#p-${l.hit.p.slug}" class="cl-name">${e(l.hit.p.name)}</a><span class="cl-size">${e(l.hit.v.label === 'One size' ? l.hit.v.size : l.hit.v.label)}</span>
          <div class="cl-row"><div class="stepper sm"><button data-dec="${l.vid}" aria-label="Decrease">${icon('minus')}</button><output>${l.qty}</output><button data-inc="${l.vid}" aria-label="Increase">${icon('plus')}</button></div><span class="cl-price">${S.inr(l.hit.v.price * l.qty)}</span></div>
          <button class="link-btn" data-rm="${l.vid}">Remove</button></div>
      </li>`).join('')}</ul>
      <div class="drawer-foot"><div class="sum-row"><span>Subtotal</span><b>${S.inr(cartTotal())}</b></div><p class="muted small">Delivery charges are confirmed on WhatsApp before dispatch.</p><a class="btn primary block-btn" href="#checkout" id="go-checkout">Checkout</a></div>`
      : `<div class="cart-empty"><p>Your cart is empty.</p><a class="btn ghost" href="#shop" id="cart-shop">Browse the shop</a></div>`}`;
    d.querySelector('#close-cart').onclick = closeCart;
    d.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => { const l = S.db.cart.find(x => x.vid === b.dataset.inc); const h = S.variant(l.vid); if (l.qty >= h.v.stock) { UI.toast(`Only ${h.v.stock} in stock`); return; } l.qty++; S.save(); renderCart(); UI.refreshCartCount(); });
    d.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => { const l = S.db.cart.find(x => x.vid === b.dataset.dec); l.qty--; if (l.qty <= 0) S.db.cart = S.db.cart.filter(x => x !== l); S.save(); renderCart(); UI.refreshCartCount(); });
    d.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { S.db.cart = S.db.cart.filter(x => x.vid !== b.dataset.rm); S.save(); renderCart(); UI.refreshCartCount(); });
    d.querySelectorAll('#go-checkout, #cart-shop, .cl-name').forEach(a => a.addEventListener('click', closeCart));
  }
  function openCart() { renderCart(); document.getElementById('cart-drawer').hidden = false; document.getElementById('scrim').hidden = false; requestAnimationFrame(() => document.getElementById('cart-drawer').classList.add('open')); }
  function closeCart() { const d = document.getElementById('cart-drawer'); d.classList.remove('open'); document.getElementById('scrim').hidden = true; setTimeout(() => { d.hidden = true; }, 220); }

  /* ---------------- Checkout ---------------- */
  function checkout() {
    const lines = cartLines();
    if (!lines.length) return header('') + `<main class="wrap empty-page"><h1>Your cart is empty</h1><p>Add a few pieces first, then come back here to place the order.</p><a class="btn primary" href="#shop">Go to the shop</a></main>` + footer();
    return header('') + `<main id="main" class="wrap checkout">
      <p class="crumb"><a href="#home">Home</a> / Checkout</p>
      <h1>Place your order</h1>
      <p class="lede">We'll send the order to our team on WhatsApp. They'll confirm availability and delivery charges and share a UPI payment link.</p>
      <div class="co-grid">
        <form id="co-form" class="form" novalidate>
          <fieldset><legend>Your details</legend>
            <div class="field"><label for="co-name">Full name</label><input id="co-name" required autocomplete="name"></div>
            <div class="two"><div class="field"><label for="co-phone">WhatsApp number</label><div class="prefix"><span>+91</span><input id="co-phone" inputmode="numeric" maxlength="10" required autocomplete="tel-national" placeholder="10-digit mobile"></div></div>
            <div class="field"><label for="co-email">Email <span class="opt">optional</span></label><input id="co-email" type="email" autocomplete="email"></div></div>
          </fieldset>
          <fieldset><legend>Delivery or pickup</legend>
            <div class="seg"><label><input type="radio" name="fulfil" value="delivery" checked> Deliver to me</label><label><input type="radio" name="fulfil" value="pickup"> Pick up at the Experience Store</label></div>
            <div id="addr-fields">
              <div class="field"><label for="co-addr">Address</label><textarea id="co-addr" rows="2" autocomplete="street-address"></textarea></div>
              <div class="two"><div class="field"><label for="co-city">City</label><input id="co-city" autocomplete="address-level2" value=""></div><div class="field"><label for="co-pin">Pincode</label><input id="co-pin" inputmode="numeric" maxlength="6" autocomplete="postal-code"></div></div>
            </div>
          </fieldset>
          <div class="field"><label for="co-notes">Notes <span class="opt">optional</span></label><input id="co-notes" placeholder="Gift wrap, delivery timing…"></div>
          <p class="form-err" id="co-err" role="alert" hidden></p>
          <button class="btn wa block-btn" type="submit">${icon('wa')} Place order on WhatsApp</button>
          <p class="soon">Online payment by UPI and card is coming soon.</p>
        </form>
        <aside class="summary"><h2>Order summary</h2><ul>${lines.map(l => `<li><img src="${e(l.hit.v.image || l.hit.p.images[0])}" alt=""><span><b>${e(l.hit.p.name)}</b><small>${e(l.hit.v.label === 'One size' ? l.hit.v.size : l.hit.v.label)} · Qty ${l.qty}</small></span><span class="mono">${S.inr(l.hit.v.price * l.qty)}</span></li>`).join('')}</ul>
          <div class="sum-row"><span>Subtotal</span><b>${S.inr(cartTotal())}</b></div><div class="sum-row muted"><span>Delivery</span><span>Confirmed on WhatsApp</span></div></aside>
      </div>
    </main>` + footer();
  }
  function bindCheckout() {
    const f = document.getElementById('co-form'); if (!f) return;
    const addr = document.getElementById('addr-fields');
    f.querySelectorAll('input[name=fulfil]').forEach(r => r.onchange = () => { addr.hidden = f.fulfil.value === 'pickup'; });
    f.onsubmit = ev => {
      ev.preventDefault();
      const v = id => document.getElementById(id).value.trim();
      const fulfil = f.querySelector('input[name=fulfil]:checked').value;
      const errs = [];
      if (!v('co-name')) errs.push('your name');
      if (!/^[6-9]\d{9}$/.test(v('co-phone'))) errs.push('a 10-digit mobile number');
      if (fulfil === 'delivery' && (!v('co-addr') || !v('co-city'))) errs.push('the delivery address and city');
      if (fulfil === 'delivery' && v('co-pin') && !/^\d{6}$/.test(v('co-pin'))) errs.push('a 6-digit pincode');
      const err = document.getElementById('co-err');
      if (errs.length) { err.textContent = 'Please add ' + errs.join(', ') + '.'; err.hidden = false; return; }
      const o = S.placeOrder({ name: v('co-name'), phone: v('co-phone'), email: v('co-email'), fulfil, address: v('co-addr'), city: fulfil === 'pickup' ? 'Store pickup' : v('co-city'), pincode: v('co-pin'), notes: v('co-notes') }, S.db.cart);
      UI.refreshCartCount();
      location.hash = 'done-' + o.number;
    };
  }
  function orderMessage(o) {
    const c = S.customer(o.cid);
    return [`Hi Dè Stories! I'd like to place an order.`, ``, `Order ${o.number}`,
      ...o.items.map((i, n) => `${n + 1}. ${i.name}${i.label !== 'One size' ? ' (' + i.label + ')' : ''} × ${i.qty} = ${S.inr(i.price * i.qty)}`),
      `Subtotal: ${S.inr(o.subtotal)}`, ``, `Name: ${c.name}`, `Phone: +91 ${c.phone}`,
      o.fulfil === 'pickup' ? `Pickup at the Experience Store` : `Deliver to: ${o.address}, ${o.city}${o.pincode ? ' ' + o.pincode : ''}`,
      o.notes ? `Notes: ${o.notes}` : ''].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n').trim();
  }
  function done(num) {
    const o = S.order(num);
    if (!o) return header('') + `<main class="wrap empty-page"><h1>Order not found</h1><a class="btn primary" href="#shop">Back to the shop</a></main>` + footer();
    const msg = orderMessage(o);
    return header('') + `<main id="main" class="wrap done">
      <div class="done-badge">${icon('check')}</div>
      <p class="eyebrow">Order ${e(o.number)} saved</p>
      <h1>One last step: send it on WhatsApp</h1>
      <p class="lede">Tap the button to open WhatsApp with your order filled in, then press send. We'll reply with availability, delivery charges and a UPI link.</p>
      <a class="btn wa big" href="${waLink(msg)}" target="_blank" rel="noopener">${icon('wa')} Send order to ${e(S.db.settings.phoneDisplay)}</a>
      <div class="msg-box"><div class="msg-head"><span>Message preview</span><button class="link-btn" id="copy-msg">${icon('copy')} Copy text</button></div><pre id="msg-text">${e(msg)}</pre></div>
      <p class="muted small">WhatsApp didn't open? Copy the text and send it to ${e(S.db.settings.phoneDisplay)}.</p>
      <div class="proto-note"><b>Prototype:</b> this order is now <b>Pending</b> in the <a href="#admin-order-${e(o.number)}">owner admin</a>. Stock goes down when the owner confirms it.</div>
    </main>` + footer();
  }
  function bindDone() {
    const b = document.getElementById('copy-msg'); if (!b) return;
    b.onclick = () => UI.copy(document.getElementById('msg-text').textContent, document.getElementById('msg-text'));
  }

  /* ---------------- Studio ---------------- */
  function studio() {
    const work = [['Riverside 3BHK, Kakkanad', 'Full interiors · 2025'], ['Courtyard villa, Thrissur', 'Styling · 2026'], ['Café Lumen, Panampilly Nagar', 'Retail fit-out'], ['Festive living room, Vyttila', 'Christmas styling']];
    return header('studio') + `<main id="main">
      <section class="studio-hero"><div class="wrap">
        <p class="eyebrow">360° Design Studio</p>
        <h1>Interiors that tell your story</h1>
        <p class="lede">We design and style homes, offices and shops across Kochi: from choosing the right planter for a balcony to taking a new apartment from bare walls to move-in ready.</p>
        <div class="btn-row"><a class="btn primary" href="#studio-book">Book a consultation</a><a class="btn ghost light" href="https://www.instagram.com/de.stories.360/" target="_blank" rel="noopener">See our work on Instagram</a></div>
      </div></section>
      <section class="wrap block">
        <h2>What we do</h2>
        <div class="svc-grid">
          ${[['Interior styling', 'Refresh a room with decor, art, plants and soft furnishings. No renovation needed.', 'From ₹25,000'], ['Full home interiors', 'Layouts, modular furniture, lighting and execution for new or renovated homes.', 'Custom quote'], ['Decor curation & gifting', 'Hand-picked pieces and hampers for homes, corporate gifting and housewarmings.', 'From ₹5,000'], ['Festive styling', 'Christmas, Onam and Diwali styling for homes, lobbies and storefronts.', 'From ₹15,000']]
            .map(s => `<article class="svc"><h3>${s[0]}</h3><p>${s[1]}</p><span class="svc-price">${s[2]}</span></article>`).join('')}
        </div>
        <p class="muted small">Services and starting prices are placeholders for Dè Stories to confirm.</p>
      </section>
      <section class="wrap block">
        <h2>How a project runs</h2>
        <ol class="process">${[['Consult', 'A free 20-minute call or a site visit. We listen, measure and photograph the space.'], ['Concept & moodboard', 'A layout, a moodboard and an itemised budget for your approval.'], ['Source & build', 'We source furniture and decor and manage carpentry, lighting and painting.'], ['Style & handover', 'Final styling, down to the last vase, then a walkthrough.']].map(s => `<li><h3>${s[0]}</h3><p>${s[1]}</p></li>`).join('')}</ol>
      </section>
      <section class="wrap block">
        <div class="block-head"><h2>Recent projects</h2></div>
        <div class="work-grid">${work.map((w, i) => `<figure class="work w${i}"><div class="work-ph"><span>Project photos to come</span></div><figcaption><b>${w[0]}</b><span>${w[1]}</span></figcaption></figure>`).join('')}</div>
      </section>
      <section class="wrap block book" id="studio-book">
        <div class="book-copy"><h2>Book a consultation</h2><p>Tell us a little about your space. We'll reply on WhatsApp within a working day to set up a call or a visit.</p></div>
        <form id="enq-form" class="form" novalidate>
          <div class="two"><div class="field"><label for="en-name">Name</label><input id="en-name" required autocomplete="name"></div><div class="field"><label for="en-phone">Phone</label><input id="en-phone" inputmode="numeric" maxlength="10" required></div></div>
          <div class="field"><label for="en-email">Email <span class="opt">optional</span></label><input id="en-email" type="email"></div>
          <div class="two"><div class="field"><label for="en-prop">Property</label><select id="en-prop"><option>Apartment</option><option>Villa</option><option>Office</option><option>Retail</option></select></div>
          <div class="field"><label for="en-scope">What do you need?</label><select id="en-scope"><option>Styling</option><option>Full interiors</option><option>Decor only</option></select></div></div>
          <div class="two"><div class="field"><label for="en-budget">Budget</label><select id="en-budget"><option>Under ₹1 lakh</option><option>₹1–2 lakh</option><option>₹2–5 lakh</option><option>₹8–15 lakh</option><option>₹15 lakh+</option></select></div>
          <div class="field"><label for="en-date">Preferred date</label><input id="en-date" type="date"></div></div>
          <div class="field"><label for="en-msg">About the space</label><textarea id="en-msg" rows="3" placeholder="e.g. New 3BHK in Kakkanad, handover in December"></textarea></div>
          <p class="form-err" id="en-err" role="alert" hidden></p>
          <button class="btn primary" type="submit">Request a consultation</button>
        </form>
      </section>
    </main>` + footer();
  }
  function bindStudio() {
    const f = document.getElementById('enq-form'); if (!f) return;
    f.onsubmit = ev => {
      ev.preventDefault();
      const v = id => document.getElementById(id).value.trim();
      const err = document.getElementById('en-err');
      if (!v('en-name') || !/^[6-9]\d{9}$/.test(v('en-phone'))) { err.textContent = 'Please add your name and a 10-digit mobile number.'; err.hidden = false; return; }
      S.db.enquiries.unshift({ id: S.uid('e'), name: v('en-name'), phone: v('en-phone'), email: v('en-email'), property: v('en-prop'), scope: v('en-scope'), budget: v('en-budget'), date: v('en-date'), message: v('en-msg'), status: 'new', note: '', at: Date.now() });
      S.save();
      f.outerHTML = `<div class="form success"><div class="done-badge">${icon('check')}</div><h3>Thanks, ${e(v('en-name').split(' ')[0])}. We've got your request.</h3><p>Our design team will message you on WhatsApp within a working day.</p><p class="proto-note"><b>Prototype:</b> this request now appears under <a href="#admin-enquiries">Studio enquiries</a> in the admin.</p></div>`;
    };
  }

  /* ---------------- Visit ---------------- */
  function visit() {
    const st = S.db.settings;
    return header('visit') + `<main id="main" class="wrap visit">
      <p class="eyebrow">Experience Store</p><h1>Come see the pieces in person</h1>
      <div class="visit-grid">
        <div class="visit-info">
          <div class="vi">${icon('pin')}<div><h3>Address</h3><p>${e(st.address)}</p><a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Alfa Horizon Vallarpadam Kochi')}" target="_blank" rel="noopener">Open in Google Maps</a></div></div>
          <div class="vi">${icon('clock')}<div><h3>Hours</h3><p>${e(st.hours)}</p></div></div>
          <div class="vi">${icon('wa')}<div><h3>WhatsApp</h3><p class="mono sel" id="wa-num">${e(st.phoneDisplay)}</p><div class="btn-row"><a class="btn wa" href="https://wa.me/${st.whatsapp}" target="_blank" rel="noopener">Chat with us</a><button class="btn ghost" id="copy-wa">${icon('copy')} Copy number</button></div></div></div>
        </div>
        <figure class="visit-img"><img src="assets/p/000.jpg" alt="Dè Stories Decor Collections catalog cover"></figure>
      </div>
    </main>` + footer();
  }
  function bindVisit() { const b = document.getElementById('copy-wa'); if (b) b.onclick = () => UI.copy(S.db.settings.phoneDisplay, document.getElementById('wa-num')); }

  window.Shop = { header, footer, icon, home, shop, bindShop, productView, bindProduct, checkout, bindCheckout, done, bindDone, studio, bindStudio, visit, bindVisit, openCart, closeCart, renderCart, filters, cartCount, logo };
})();
