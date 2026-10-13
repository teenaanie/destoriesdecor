/* Dè Stories prototype — data store, persistence and analytics.
   Everything lives in one object (DB) saved to localStorage, mirroring the
   Phase 2 Supabase tables described in PRD §7. */
(function () {
  const KEY = 'ds_proto_v1';
  const DAY = 86400000;
  const COUNTED = ['confirmed', 'shipped', 'delivered'];

  let DB = null;
  let memoryOnly = false;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { DB = JSON.parse(raw); return true; }
    } catch (e) { memoryOnly = true; }
    return false;
  }
  function save() {
    if (memoryOnly) return;
    try { localStorage.setItem(KEY, JSON.stringify(DB)); }
    catch (e) { memoryOnly = true; window.UI && UI.toast('Browser storage is full or blocked; changes will last until you close this tab.'); }
  }
  function reset() { DB = window.Seed.build(); save(); }
  function init() { if (!load() || !DB || DB.v !== 2) reset(); }

  /* ---------- formatting ---------- */
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const inrShort = n => n >= 100000 ? '₹' + (n / 100000).toFixed(n >= 1000000 ? 1 : 2).replace(/\.?0+$/, '') + 'L'
    : n >= 1000 ? '₹' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : inr(n);
  const fmtDate = (t, opt) => new Date(t).toLocaleDateString('en-IN', opt || { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDateTime = t => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = p => p + Math.random().toString(36).slice(2, 9);
  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';

  /* ---------- lookups ---------- */
  const cat = id => DB.categories.find(c => c.id === id);
  const product = id => DB.products.find(p => p.id === id);
  const productBySlug = s => DB.products.find(p => p.slug === s);
  const customer = id => DB.customers.find(c => c.id === id);
  const order = num => DB.orders.find(o => o.number === num);
  function variant(vid) {
    for (const p of DB.products) { const v = p.variants.find(x => x.id === vid); if (v) return { p, v }; }
    return null;
  }
  const visibleCats = () => DB.categories.filter(c => c.visible).sort((a, b) => a.sort - b.sort);
  const visibleProducts = () => DB.products.filter(p => p.visible && (cat(p.cat) || {}).visible !== false);
  /* A size is on sale when it has a sale price below its regular price. */
  const onSale = v => !!(v.sale && v.sale > 0 && v.sale < v.price);
  const price = v => onSale(v) ? v.sale : v.price;
  const productOnSale = p => p.variants.some(onSale);
  const priceRange = p => { const ps = p.variants.map(price); return [Math.min(...ps), Math.max(...ps)]; };
  const totalStock = p => p.variants.reduce((s, v) => s + Math.max(0, v.stock), 0);
  const lowAt = v => v.lowAt != null ? v.lowAt : DB.settings.lowStockDefault;
  function stockState(v) { return v.stock <= 0 ? 'out' : v.stock <= lowAt(v) ? 'low' : 'ok'; }
  function productStockState(p) {
    const st = p.variants.map(stockState);
    if (st.every(s => s === 'out')) return 'out';
    if (st.some(s => s !== 'ok')) return 'low';
    return 'ok';
  }

  /* ---------- inventory ---------- */
  function move(vid, delta, reason, ref) {
    const hit = variant(vid); if (!hit) return;
    hit.v.stock += delta;
    DB.moves.unshift({ id: uid('m'), vid, delta, reason, ref: ref || '', at: Date.now(), by: DB.session ? DB.session.email : 'system' });
  }

  /* ---------- customers & orders ---------- */
  function upsertCustomer({ name, phone, email, city }) {
    const ph = String(phone).replace(/\D/g, '').slice(-10);
    let c = DB.customers.find(x => x.phone === ph);
    if (!c) { c = { id: uid('c'), name, phone: ph, email: email || '', city: city || '', created: Date.now() }; DB.customers.push(c); }
    else { c.name = name || c.name; if (email) c.email = email; if (city) c.city = city; }
    return c;
  }
  function nextOrderNumber() {
    const max = DB.orders.reduce((m, o) => Math.max(m, +o.number.split('-')[1]), 1000);
    return 'DS-' + (max + 1);
  }
  function placeOrder(form, cartLines) {
    const c = upsertCustomer(form);
    const items = cartLines.map(l => {
      const { p, v } = variant(l.vid);
      return { pid: p.id, vid: v.id, name: p.name, label: v.label, size: v.size, price: price(v), mrp: v.price, qty: l.qty };
    });
    const o = {
      number: nextOrderNumber(), cid: c.id, status: 'pending', channel: 'website',
      fulfil: form.fulfil, address: form.address, city: form.city, pincode: form.pincode, notes: form.notes,
      items, subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
      created: Date.now(), history: [{ s: 'pending', at: Date.now() }]
    };
    DB.orders.unshift(o);
    DB.cart = [];
    save();
    return o;
  }
  /* Status changes drive stock: moving into Confirmed/Dispatched/Delivered reduces it once;
     moving back out (Cancelled, Abandoned, Pending) puts it back. */
  const NEXT = {
    pending: ['confirmed', 'cancelled', 'abandoned'],
    confirmed: ['shipped', 'delivered', 'cancelled', 'pending'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: ['pending'],
    abandoned: ['pending', 'confirmed']
  };
  function setStatus(o, status, note, dispatch) {
    const was = COUNTED.includes(o.status), now = COUNTED.includes(status);
    if (now && !was) o.items.forEach(i => move(i.vid, -i.qty, 'order', o.number));
    if (!now && was) o.items.forEach(i => move(i.vid, +i.qty, 'cancel', o.number));
    if (dispatch && (dispatch.courier || dispatch.tracking)) o.dispatch = { courier: dispatch.courier || '', tracking: dispatch.tracking || '' };
    o.status = status;
    o.history.push({ s: status, at: Date.now(), note: note || '', by: DB.session ? DB.session.email : '' });
    save();
  }
  function addNote(o, note) { o.history.push({ s: 'note', at: Date.now(), note, by: DB.session ? DB.session.email : '' }); save(); }
  const STALE_DAYS = 3;
  const isStale = o => o.status === 'pending' && Date.now() - o.created > STALE_DAYS * DAY;
  function shortfall(o) {
    return o.items.filter(i => { const h = variant(i.vid); return h && h.v.stock - i.qty < 0; });
  }

  /* ---------- analytics ---------- */
  const counted = o => COUNTED.includes(o.status);
  function inRange(from, to) { return DB.orders.filter(o => o.created >= from && o.created < to); }
  function customerStats() {
    const m = new Map();
    for (const o of DB.orders) {
      if (!counted(o)) continue;
      const s = m.get(o.cid) || { orders: 0, spend: 0, first: o.created, last: o.created, cats: {} };
      s.orders++; s.spend += o.subtotal; s.first = Math.min(s.first, o.created); s.last = Math.max(s.last, o.created);
      o.items.forEach(i => { const p = product(i.pid); if (p) s.cats[p.cat] = (s.cats[p.cat] || 0) + i.qty; });
      m.set(o.cid, s);
    }
    return m;
  }
  function firstOrderAt() {
    const m = new Map();
    DB.orders.filter(counted).forEach(o => { if (!m.has(o.cid) || m.get(o.cid) > o.created) m.set(o.cid, o.created); });
    return m;
  }
  function kpis(days) {
    const now = Date.now(), from = now - days * DAY, prevFrom = from - days * DAY;
    const firsts = firstOrderAt();
    const calc = (a, b) => {
      const os = inRange(a, b).filter(counted);
      const rev = os.reduce((s, o) => s + o.subtotal, 0);
      const buyers = new Set(os.map(o => o.cid));
      let returning = 0, fresh = 0;
      buyers.forEach(cid => (firsts.get(cid) < a ? returning++ : fresh++));
      // a buyer is "repeat" in-period if they had an earlier order or 2+ in period
      let repeat = 0;
      buyers.forEach(cid => { const n = os.filter(o => o.cid === cid).length; if (firsts.get(cid) < a || n > 1) repeat++; });
      return { rev, orders: os.length, aov: os.length ? rev / os.length : 0, buyers: buyers.size, fresh, returning, repeatRate: buyers.size ? repeat / buyers.size : 0 };
    };
    return { cur: calc(from, now), prev: calc(prevFrom, from) };
  }
  function series(days) {
    const bucket = days <= 30 ? 1 : 7;
    const n = Math.ceil(days / bucket);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const firsts = firstOrderAt();
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const b = end.getTime() - i * bucket * DAY, a = b - bucket * DAY;
      const os = inRange(a, b).filter(counted);
      const newC = new Set(), retC = new Set();
      os.forEach(o => (firsts.get(o.cid) >= a ? newC : retC).add(o.cid));
      out.push({ at: a + 1, label: bucket === 1 ? fmtDate(a + 1, { day: 'numeric', month: 'short' }) : 'w/c ' + fmtDate(a + 1, { day: 'numeric', month: 'short' }), rev: os.reduce((s, o) => s + o.subtotal, 0), orders: os.length, newC: newC.size, retC: retC.size });
    }
    return out;
  }
  function topProducts(days, by) {
    const from = Date.now() - days * DAY, m = new Map();
    inRange(from, Date.now()).filter(counted).forEach(o => o.items.forEach(i => {
      const s = m.get(i.pid) || { pid: i.pid, units: 0, rev: 0 }; s.units += i.qty; s.rev += i.qty * i.price; m.set(i.pid, s);
    }));
    return [...m.values()].sort((a, b) => b[by] - a[by]);
  }
  function categoryRevenue(days) {
    const m = new Map();
    topProducts(days, 'rev').forEach(t => { const p = product(t.pid); if (!p) return; m.set(p.cat, (m.get(p.cat) || 0) + t.rev); });
    return [...m.entries()].map(([id, rev]) => ({ id, name: (cat(id) || { name: id }).name, rev })).sort((a, b) => b.rev - a.rev);
  }
  function topCustomers(days, n) {
    const from = Date.now() - days * DAY, m = new Map();
    inRange(from, Date.now()).filter(counted).forEach(o => m.set(o.cid, (m.get(o.cid) || 0) + o.subtotal));
    const all = customerStats();
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([cid, spend]) => ({ c: customer(cid), spend, life: all.get(cid) }));
  }
  function restockList() {
    const out = [];
    DB.products.forEach(p => p.variants.forEach(v => { const s = stockState(v); if (s !== 'ok') out.push({ p, v, s }); }));
    return out.sort((a, b) => a.v.stock - b.v.stock);
  }

  window.Store = {
    get db() { return DB; }, init, save, reset, DAY, COUNTED,
    inr, inrShort, fmtDate, fmtDateTime, esc, uid, slugify,
    cat, product, productBySlug, customer, order, variant, visibleCats, visibleProducts,
    price, onSale, productOnSale, priceRange, totalStock, stockState, productStockState, lowAt, move,
    upsertCustomer, placeOrder, setStatus, addNote, NEXT, isStale, STALE_DAYS, shortfall,
    counted, kpis, series, topProducts, categoryRevenue, topCustomers, customerStats, restockList,
    get memoryOnly() { return memoryOnly; }
  };
})();
