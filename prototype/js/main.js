/* Router and shared UI helpers. Routes are plain hash tokens (#shop, #p-golden-vein-leaf, #admin-orders). */
(function () {
  const app = document.getElementById('app');
  let toastT;

  const UI = {
    toast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg; t.hidden = false; t.classList.add('show');
      clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('show'); setTimeout(() => { t.hidden = true; }, 250); }, 2800);
    },
    copy(text, el) {
      const fallback = () => { if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); if (el.select) el.select(); UI.toast('Text selected. Press Ctrl/Cmd + C to copy.'); };
      try { navigator.clipboard.writeText(text).then(() => UI.toast('Copied.'), fallback); } catch (e) { fallback(); }
    },
    refreshCartCount() {
      const n = Shop.cartCount();
      document.querySelectorAll('.cart-n').forEach(x => { x.textContent = n; x.hidden = !n; });
      const b = document.getElementById('open-cart'); if (b) b.setAttribute('aria-label', `Open cart, ${n} items`);
    },
    route
  };
  window.UI = UI;

  function parse() {
    const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'home';
    if (h === 'admin') return ['admin', ''];
    if (h.startsWith('admin-')) {
      const rest = h.slice(6);
      for (const k of ['order-', 'product-', 'customer-']) if (rest.startsWith(k)) return ['admin', k.slice(0, -1), rest.slice(k.length)];
      return ['admin', rest];
    }
    if (h.startsWith('p-')) return ['product', h.slice(2)];
    if (h.startsWith('done-')) return ['done', h.slice(5)];
    if (h === 'shop') return ['shop', ''];
    if (h.startsWith('shop-')) return ['shop', h.slice(5)];
    if (h.startsWith('studio')) return ['studio', h];
    return [h];
  }

  let last = '';
  function route(quiet) {
    const [view, a, b] = parse();
    const key = location.hash;
    const rerender = q => route(q === true);
    const isAdmin = view === 'admin';
    document.body.classList.toggle('is-admin', isAdmin);
    document.querySelectorAll('.demo-switch a').forEach(x => x.classList.toggle('on', (x.dataset.view === 'admin') === isAdmin));
    const sameView = key === last;
    let html, bind;
    if (isAdmin) { const r = Admin.render(a, b, rerender, quiet); html = r.html; bind = r.bind; }
    else {
      const V = {
        home: [Shop.home, null], shop: [() => Shop.shop(sameView ? undefined : a), () => Shop.bindShop(rerender)],
        product: [() => Shop.productView(a), () => Shop.bindProduct(rerender)], checkout: [Shop.checkout, Shop.bindCheckout], done: [() => Shop.done(a), Shop.bindDone],
        studio: [Shop.studio, Shop.bindStudio], visit: [Shop.visit, Shop.bindVisit]
      };
      const [v, bnd] = V[view] || V.home;
      html = v(); bind = () => { bindHeader(rerender); bnd && bnd(); };
    }
    // keep focus/scroll on in-place re-renders (filters, search, size change)
    const focusId = document.activeElement && document.activeElement.id;
    const caret = document.activeElement && document.activeElement.selectionStart;
    const y = scrollY;
    app.innerHTML = html;
    bind();
    if (sameView || quiet) {
      scrollTo(0, y);
      if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus({ preventScroll: true }); try { if (caret != null) el.setSelectionRange(caret, caret); } catch (e) { } } }
    } else if (a && a.startsWith && a === 'studio-book') {
      const t = document.getElementById('studio-book'); if (t) t.scrollIntoView();
    } else scrollTo(0, 0);
    last = key;
  }

  function bindHeader(rerender) {
    const oc = document.getElementById('open-cart'); if (oc) oc.onclick = Shop.openCart;
    const hs = document.getElementById('head-search');
    if (hs) hs.onsubmit = ev => { ev.preventDefault(); Shop.filters.q = document.getElementById('hq').value.trim(); Shop.filters.cat = ''; if (location.hash === '#shop') rerender(); else location.hash = 'shop'; };
  }

  document.getElementById('scrim').onclick = Shop.closeCart;
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !document.getElementById('cart-drawer').hidden) Shop.closeCart(); });
  window.addEventListener('hashchange', () => route());
  Store.init();
  route();
})();
