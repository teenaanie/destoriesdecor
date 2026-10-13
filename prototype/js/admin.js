/* Owner admin (PRD §6). Hash routes: admin, admin-orders, admin-order-DS-1234,
   admin-products, admin-product-p001, admin-new, admin-categories, admin-inventory,
   admin-customers, admin-customer-c12, admin-enquiries, admin-settings */
(function () {
  const S = Store, e = S.esc, I = n => Shop.icon(n);
  const ui = { range: 30, topBy: 'units', orderStatus: 'all', orderQ: '', prodQ: '', prodCat: '', prodStock: '', invQ: '', invOnly: false, custQ: '', custSort: 'spend', enqStatus: 'all' };
  let charts = [];
  const admins = () => (S.db.settings.admins || (S.db.settings.admins = window.DEFAULT_ADMINS.slice())).map(x => x.toLowerCase());
  const STATUS = { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
  const ENQ = { new: 'New', contacted: 'Contacted', site_visit: 'Site visit', quoted: 'Quoted', won: 'Won', lost: 'Lost' };
  const REASON = { order: 'Order confirmed', cancel: 'Order cancelled', restock: 'Restock', store_sale: 'Store sale', damage: 'Damaged', adjust: 'Count adjusted' };
  const pill = s => `<span class="pill s-${s}">${STATUS[s] || ENQ[s] || s}</span>`;
  const stockPill = s => s === 'out' ? '<span class="pill s-out">Out of stock</span>' : s === 'low' ? '<span class="pill s-low">Low stock</span>' : '<span class="pill s-ok">In stock</span>';
  const delta = (cur, prev, money) => {
    if (!prev) return '<span class="delta flat">No earlier data</span>';
    const d = (cur - prev) / prev;
    const cls = Math.abs(d) < 0.005 ? 'flat' : d > 0 ? 'up' : 'down';
    return `<span class="delta ${cls}">${d > 0 ? '▲' : d < 0 ? '▼' : ''} ${Math.abs(d * 100).toFixed(0)}%</span><span class="vs">vs ${money ? S.inrShort(prev) : prev} prior</span>`;
  };

  /* ---------- login ---------- */
  function login(step) {
    return `<main class="admin-login"><div class="login-card">
      <a href="#home" class="brand">${Shop.logo}<span class="brand-text"><span class="brand-name">Dè Stories</span><span class="brand-sub">Owner admin</span></span></a>
      ${step === 'sent' ? `<h1>Check your inbox</h1><p>We sent a sign-in link to <b>${e(ui.loginEmail)}</b>. It works once and expires in 15 minutes.</p>
        <button class="btn primary block-btn" id="open-link">Open the sign-in link (demo)</button><button class="link-btn" id="back-login">Use a different email</button>`
      : `<h1>Sign in to manage your store</h1><p>Enter the email address the owner invited. We'll send you a one-time sign-in link, so there's no password to remember.</p>
        <form id="login-form" class="form" novalidate><div class="field"><label for="lg-email">Email</label><input id="lg-email" type="email" autocomplete="email" placeholder="you@example.com"></div>
        <p class="form-err" id="lg-err" role="alert" hidden></p><button class="btn primary block-btn" type="submit">Send sign-in link</button></form>`}
      <p class="proto-note"><b>Prototype:</b> only admin emails can sign in, and no real email is sent. Tap the demo link button on the next screen.</p>
    </div></main>`;
  }
  function bindLogin(go) {
    const f = document.getElementById('login-form');
    if (f) f.onsubmit = ev => { ev.preventDefault(); const v = document.getElementById('lg-email').value.trim(); const er = document.getElementById('lg-err'); if (!/^\S+@\S+\.\S+$/.test(v)) { er.textContent = 'Enter a valid email address.'; er.hidden = false; return; } if (!admins().includes(v.toLowerCase())) { er.textContent = "This email doesn't have admin access. Ask the store owner to add it under Settings → Admin users."; er.hidden = false; return; } ui.loginEmail = v.toLowerCase(); go('sent'); };
    const o = document.getElementById('open-link'); if (o) o.onclick = () => { S.db.session = { email: ui.loginEmail, at: Date.now() }; S.save(); location.hash = 'admin'; UI.route(); };
    const b = document.getElementById('back-login'); if (b) b.onclick = () => go('');
  }

  /* ---------- shell ---------- */
  function shell(active, title, body, actions) {
    const pend = S.db.orders.filter(o => o.status === 'pending').length;
    const newEnq = S.db.enquiries.filter(x => x.status === 'new').length;
    const low = S.restockList().length;
    const nav = [['admin', 'Dashboard', 'dash'], ['admin-orders', 'Orders', 'orders', pend], ['admin-products', 'Products', 'products'], ['admin-categories', 'Categories', 'categories'], ['admin-inventory', 'Inventory', 'inventory', low], ['admin-customers', 'Customers', 'customers'], ['admin-enquiries', 'Studio enquiries', 'enquiries', newEnq], ['admin-settings', 'Settings', 'settings']];
    return `<div class="admin">
      <aside class="side"><a href="#admin" class="brand">${Shop.logo}<span class="brand-text"><span class="brand-name">Dè Stories</span><span class="brand-sub">Owner admin</span></span></a>
        <nav aria-label="Admin">${nav.map(n => `<a href="#${n[0]}" class="${active === n[2] ? 'on' : ''}">${n[1]}${n[3] ? `<span class="nb">${n[3]}</span>` : ''}</a>`).join('')}</nav>
        <div class="side-foot"><a href="#home" class="link-btn">View store ↗</a><span class="who">${e(S.db.session.email)}</span><button class="link-btn" id="sign-out">Sign out</button></div>
      </aside>
      <main class="admin-main" id="main"><div class="a-head"><h1>${title}</h1><div class="a-actions">${actions || ''}</div></div>${body}</main>
    </div>`;
  }

  /* ---------- dashboard ---------- */
  function dashboard() {
    const d = ui.range;
    const k = S.kpis(d);
    const cats = S.categoryRevenue(d);
    const maxCat = Math.max(1, ...cats.map(c => c.rev));
    const top = S.topProducts(d, ui.topBy).slice(0, 10);
    const maxTop = Math.max(1, ...top.map(t => t[ui.topBy]));
    const tc = S.topCustomers(d, 5);
    const restock = S.restockList().slice(0, 8);
    const pending = S.db.orders.filter(o => o.status === 'pending').slice(0, 4);
    const enq = S.db.enquiries.filter(x => x.status === 'new').slice(0, 4);
    const label = { 7: 'last 7 days', 30: 'last 30 days', 90: 'last 90 days', 180: 'last 6 months' }[d];
    const allCust = S.customerStats();
    const repeaters = [...allCust.values()].filter(s => s.orders > 1).length;
    const body = `
      <p class="a-sub">Sales from confirmed, shipped and delivered orders, ${label}. Pending and cancelled orders are not counted.</p>
      <div class="kpis">
        <div class="kpi"><span class="k-l">Revenue</span><span class="k-v">${S.inrShort(k.cur.rev)}</span>${delta(k.cur.rev, k.prev.rev, true)}</div>
        <div class="kpi"><span class="k-l">Orders</span><span class="k-v">${k.cur.orders}</span>${delta(k.cur.orders, k.prev.orders)}</div>
        <div class="kpi"><span class="k-l">Average order</span><span class="k-v">${S.inr(k.cur.aov)}</span>${delta(k.cur.aov, k.prev.aov, true)}</div>
        <div class="kpi"><span class="k-l">Repeat-customer rate</span><span class="k-v">${(k.cur.repeatRate * 100).toFixed(0)}%</span>${(() => { const dp = Math.round((k.cur.repeatRate - k.prev.repeatRate) * 100); return k.prev.buyers ? `<span class="delta ${dp > 0 ? 'up' : dp < 0 ? 'down' : 'flat'}">${dp > 0 ? '▲ ' : dp < 0 ? '▼ ' : 'No change'}${dp ? Math.abs(dp) + ' pts' : ''}</span>` : ''; })()}<span class="vs">of ${k.cur.buyers} buyers</span></div>
        <div class="kpi"><span class="k-l">New customers</span><span class="k-v">${k.cur.fresh}</span>${delta(k.cur.fresh, k.prev.fresh)}</div>
      </div>

      <div class="dash-grid">
        <section class="panel span2"><div class="p-head"><h2>Revenue and orders</h2><span class="legend"><i class="lg-bar"></i>Revenue <i class="lg-line"></i>Orders</span></div><div class="chart-box"><canvas id="ch-rev" aria-label="Revenue and orders over time" role="img"></canvas></div></section>

        <section class="panel"><div class="p-head"><h2>Needs attention</h2></div>
          <div class="attn">
            <a href="#admin-orders" class="attn-row" data-status="pending"><span class="attn-n">${S.db.orders.filter(o => o.status === 'pending').length}</span><span>orders waiting for you to confirm on WhatsApp</span></a>
            <a href="#admin-inventory" class="attn-row warn"><span class="attn-n">${S.restockList().length}</span><span>sizes are low or out of stock</span></a>
            <a href="#admin-enquiries" class="attn-row"><span class="attn-n">${S.db.enquiries.filter(x => x.status === 'new').length}</span><span>new studio enquiries</span></a>
          </div>
          <h3 class="p-sub">Awaiting confirmation</h3>
          <ul class="mini-list">${pending.map(o => `<li><a href="#admin-order-${o.number}"><span><b>${o.number}</b> ${e(S.customer(o.cid).name)}</span><span class="mono">${S.inr(o.subtotal)}</span></a></li>`).join('') || '<li class="muted">Nothing pending.</li>'}</ul>
        </section>

        <section class="panel"><div class="p-head"><h2>Best sellers</h2><div class="seg-sm" role="group" aria-label="Rank by"><button data-top="units" class="${ui.topBy === 'units' ? 'on' : ''}">Units</button><button data-top="rev" class="${ui.topBy === 'rev' ? 'on' : ''}">Revenue</button></div></div>
          <ol class="rank">${top.map((t, i) => { const p = S.product(t.pid); return p ? `<li><span class="rk">${i + 1}</span><img src="${e(p.images[0])}" alt=""><span class="rk-n"><a href="#admin-product-${p.id}">${e(p.name)}</a><span class="bar"><i style="width:${(t[ui.topBy] / maxTop * 100).toFixed(1)}%"></i></span></span><span class="mono rk-v">${ui.topBy === 'units' ? t.units + ' sold' : S.inrShort(t.rev)}</span></li>` : ''; }).join('') || '<li class="muted">No sales in this period.</li>'}</ol>
        </section>

        <section class="panel"><div class="p-head"><h2>Revenue by category</h2></div>
          <ul class="hbars">${cats.map(c => `<li><span class="hb-l">${e(c.name)}</span><span class="bar"><i style="width:${(c.rev / maxCat * 100).toFixed(1)}%"></i></span><span class="mono">${S.inrShort(c.rev)}</span></li>`).join('')}</ul>
        </section>

        <section class="panel"><div class="p-head"><h2>New vs returning buyers</h2><span class="legend"><i class="lg-new"></i>New <i class="lg-ret"></i>Returning</span></div><div class="chart-box sm"><canvas id="ch-cust" aria-label="New versus returning buyers" role="img"></canvas></div>
          <p class="a-note">${repeaters} of ${allCust.size} customers have ordered more than once.</p></section>

        <section class="panel"><div class="p-head"><h2>Top customers</h2><a href="#admin-customers" class="more">All customers</a></div>
          <ul class="mini-list cust">${tc.map(t => `<li><a href="#admin-customer-${t.c.id}"><span><b>${e(t.c.name)}</b><small>${e(t.c.city)} · ${t.life.orders} orders all time</small></span><span class="mono">${S.inr(t.spend)}</span></a></li>`).join('')}</ul>
        </section>

        <section class="panel"><div class="p-head"><h2>Needs restocking</h2><a href="#admin-inventory" class="more">Inventory</a></div>
          <ul class="mini-list">${restock.map(r => `<li><a href="#admin-product-${r.p.id}"><span><b>${e(r.p.name)}</b><small>${e(r.v.label === 'One size' ? r.v.size : r.v.label)}</small></span>${r.s === 'out' ? '<span class="pill s-out">Out</span>' : `<span class="pill s-low">${r.v.stock} left</span>`}</a></li>`).join('') || '<li class="muted">Everything is well stocked.</li>'}</ul>
        </section>

        <section class="panel"><div class="p-head"><h2>New studio enquiries</h2><a href="#admin-enquiries" class="more">All enquiries</a></div>
          <ul class="mini-list">${enq.map(x => `<li><a href="#admin-enquiries"><span><b>${e(x.name)}</b><small>${e(x.property)} · ${e(x.scope)} · ${e(x.budget)}</small></span><span class="muted small">${S.fmtDate(x.at, { day: 'numeric', month: 'short' })}</span></a></li>`).join('') || '<li class="muted">No new enquiries.</li>'}</ul>
        </section>
      </div>`;
    const actions = `<label class="sr" for="range">Period</label><select id="range" class="sel">${[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [180, 'Last 6 months']].map(r => `<option value="${r[0]}" ${d === r[0] ? 'selected' : ''}>${r[1]}</option>`).join('')}</select>`;
    return shell('dash', 'Dashboard', body, actions);
  }
  function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function bindDashboard(rerender) {
    document.getElementById('range').onchange = ev => { ui.range = +ev.target.value; rerender(); };
    document.querySelectorAll('[data-top]').forEach(b => b.onclick = () => { ui.topBy = b.dataset.top; rerender(); });
    document.querySelectorAll('.attn-row[data-status]').forEach(a => a.addEventListener('click', () => { ui.orderStatus = 'pending'; }));
    if (!window.Chart) return;
    const ser = S.series(ui.range);
    const ink = tok('--ink-2'), grid = tok('--line'), acc = tok('--wood'), acc2 = tok('--sage-deep'), soft = tok('--sage');
    Chart.defaults.font.family = tok('--f-body') || 'sans-serif';
    Chart.defaults.color = ink;
    charts.push(new Chart(document.getElementById('ch-rev'), {
      data: {
        labels: ser.map(s => s.label),
        datasets: [
          { type: 'bar', label: 'Revenue', data: ser.map(s => s.rev), backgroundColor: acc, borderRadius: 3, yAxisID: 'y', maxBarThickness: 28 },
          { type: 'line', label: 'Orders', data: ser.map(s => s.orders), borderColor: acc2, backgroundColor: acc2, pointRadius: 0, pointHoverRadius: 4, tension: .35, borderWidth: 2, yAxisID: 'y1' }
        ]
      },
      options: {
        maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.dataset.label === 'Revenue' ? ' Revenue ' + S.inr(c.raw) : ' Orders ' + c.raw } } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
          y: { grid: { color: grid }, border: { display: false }, ticks: { callback: v => S.inrShort(v), maxTicksLimit: 5 } },
          y1: { position: 'right', grid: { display: false }, border: { display: false }, ticks: { precision: 0, maxTicksLimit: 5 } }
        }
      }
    }));
    charts.push(new Chart(document.getElementById('ch-cust'), {
      type: 'bar',
      data: { labels: ser.map(s => s.label), datasets: [{ label: 'New', data: ser.map(s => s.newC), backgroundColor: soft, borderRadius: 2, maxBarThickness: 22 }, { label: 'Returning', data: ser.map(s => s.retC), backgroundColor: acc2, borderRadius: 2, maxBarThickness: 22 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } }, y: { stacked: true, grid: { color: grid }, border: { display: false }, ticks: { precision: 0, maxTicksLimit: 4 } } } }
    }));
  }
  function destroyCharts() { charts.forEach(c => c.destroy()); charts = []; }

  /* ---------- orders ---------- */
  function orders() {
    let list = S.db.orders;
    if (ui.orderStatus !== 'all') list = list.filter(o => o.status === ui.orderStatus);
    if (ui.orderQ) { const q = ui.orderQ.toLowerCase(); list = list.filter(o => (o.number + ' ' + S.customer(o.cid).name + ' ' + S.customer(o.cid).phone).toLowerCase().includes(q)); }
    const counts = Object.keys(STATUS).reduce((m, s) => (m[s] = S.db.orders.filter(o => o.status === s).length, m), {});
    const shown = list.slice(0, 80);
    const body = `<div class="toolbar"><div class="tabs" role="group" aria-label="Status">${[['all', 'All', S.db.orders.length]].concat(Object.entries(STATUS).map(([k, v]) => [k, v, counts[k]])).map(t => `<button data-os="${t[0]}" class="${ui.orderStatus === t[0] ? 'on' : ''}">${t[1]} <span>${t[2]}</span></button>`).join('')}</div>
      <input id="o-q" type="search" class="search" placeholder="Order no., name or phone" value="${e(ui.orderQ)}" aria-label="Search orders"></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th class="r">Total</th><th>Status</th><th>Channel</th></tr></thead><tbody>
      ${shown.map(o => { const c = S.customer(o.cid); return `<tr data-href="#admin-order-${o.number}"><td><a href="#admin-order-${o.number}"><b>${o.number}</b></a></td><td>${S.fmtDate(o.created, { day: 'numeric', month: 'short' })}</td><td>${e(c.name)}<small>${e(c.city)}</small></td><td>${o.items.reduce((s, i) => s + i.qty, 0)}</td><td class="r mono">${S.inr(o.subtotal)}</td><td>${pill(o.status)}</td><td class="muted">${o.channel === 'website' ? 'Website' : 'WhatsApp DM'}</td></tr>`; }).join('') || '<tr><td colspan="7" class="muted">No orders match.</td></tr>'}
      </tbody></table></div>${list.length > 80 ? `<p class="muted small">Showing the latest 80 of ${list.length} orders.</p>` : ''}`;
    return shell('orders', 'Orders', body);
  }
  function bindOrders(rerender) {
    document.querySelectorAll('[data-os]').forEach(b => b.onclick = () => { ui.orderStatus = b.dataset.os; rerender(); });
    const q = document.getElementById('o-q'); let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { ui.orderQ = q.value.trim(); rerender(true); }, 250); };
    document.querySelectorAll('tr[data-href]').forEach(r => r.onclick = ev => { if (ev.target.closest('a')) return; location.hash = r.dataset.href.slice(1); });
  }
  function orderDetail(num) {
    const o = S.order(num);
    if (!o) return shell('orders', 'Order not found', '<p><a href="#admin-orders">Back to orders</a></p>');
    const c = S.customer(o.cid);
    const next = { pending: [['confirmed', 'Confirm order', 'primary'], ['cancelled', 'Cancel order', 'danger']], confirmed: [['shipped', 'Mark shipped', 'primary'], ['cancelled', 'Cancel order', 'danger']], shipped: [['delivered', 'Mark delivered', 'primary'], ['cancelled', 'Cancel order', 'danger']], delivered: [], cancelled: [] }[o.status];
    const short = o.status === 'pending' ? S.shortfall(o) : [];
    const wa = `https://wa.me/91${c.phone}?text=${encodeURIComponent(`Hi ${c.name.split(' ')[0]}, this is Dè Stories about your order ${o.number}.`)}`;
    const body = `<p class="crumb"><a href="#admin-orders">Orders</a> / ${o.number}</p>
      <div class="od-grid">
        <section class="panel"><div class="p-head"><h2>Items</h2>${pill(o.status)}</div>
          <table class="tbl plain"><tbody>${o.items.map(i => { const h = S.variant(i.vid); return `<tr><td class="od-img">${h ? `<img src="${e(h.p.images[0])}" alt="">` : ''}</td><td><b>${e(i.name)}</b><small>${e(i.label === 'One size' ? i.size : i.label)} · ${S.inr(i.price)} each${h ? ` · ${h.v.stock} in stock` : ''}</small></td><td class="r">× ${i.qty}</td><td class="r mono">${S.inr(i.price * i.qty)}</td></tr>`; }).join('')}
          <tr class="tot"><td></td><td>Subtotal</td><td></td><td class="r mono">${S.inr(o.subtotal)}</td></tr></tbody></table>
          ${short.length ? `<p class="warn-box">Confirming will take ${short.map(i => `<b>${e(i.name)}</b>`).join(', ')} below zero stock. Confirm only if you have unlisted pieces, then fix the count in Inventory.</p>` : ''}
          <div class="btn-row">${next.map(n => `<button class="btn ${n[2]}" data-st="${n[0]}">${n[1]}</button>`).join('')}<a class="btn wa" href="${wa}" target="_blank" rel="noopener">${I('wa')} Message on WhatsApp</a></div>
          <div id="confirm-cancel" hidden class="inline-confirm"><p>Cancel ${o.number}? ${S.COUNTED.includes(o.status) ? 'Stock for these items will be added back.' : ''}</p><button class="btn danger" id="yes-cancel">Yes, cancel order</button><button class="btn ghost" id="no-cancel">Keep order</button></div>
          ${o.status === 'pending' ? '<p class="a-note">Confirm once the customer has agreed on WhatsApp and paid. Stock for each item goes down when you confirm.</p>' : ''}
        </section>
        <section class="panel"><div class="p-head"><h2>Customer</h2></div>
          <p><a href="#admin-customer-${c.id}"><b>${e(c.name)}</b></a></p><p class="mono">+91 ${e(c.phone)}</p>${c.email ? `<p>${e(c.email)}</p>` : ''}
          <h3 class="p-sub">${o.fulfil === 'pickup' ? 'Store pickup' : 'Deliver to'}</h3>${o.fulfil === 'pickup' ? '<p>Experience Store, Alfa Horizon</p>' : `<p>${e(o.address)}<br>${e(o.city)} ${e(o.pincode)}</p>`}
          ${o.notes ? `<h3 class="p-sub">Notes</h3><p>${e(o.notes)}</p>` : ''}
          <h3 class="p-sub">Timeline</h3><ol class="timeline">${o.history.map(h => `<li>${pill(h.s)}<span class="muted small">${S.fmtDateTime(h.at)}</span></li>`).join('')}</ol>
        </section>
      </div>`;
    return shell('orders', 'Order ' + o.number, body);
  }
  function bindOrderDetail(rerender, num) {
    const o = S.order(num); if (!o) return;
    document.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
      if (b.dataset.st === 'cancelled') { document.getElementById('confirm-cancel').hidden = false; return; }
      S.setStatus(o, b.dataset.st);
      UI.toast(b.dataset.st === 'confirmed' ? `${o.number} confirmed. Stock updated for ${o.items.length} item${o.items.length > 1 ? 's' : ''}.` : `${o.number} marked ${STATUS[b.dataset.st].toLowerCase()}.`);
      rerender();
    });
    const y = document.getElementById('yes-cancel'); if (y) y.onclick = () => { const was = S.COUNTED.includes(o.status); S.setStatus(o, 'cancelled'); UI.toast(`${o.number} cancelled.${was ? ' Stock added back.' : ''}`); rerender(); };
    const n = document.getElementById('no-cancel'); if (n) n.onclick = () => { document.getElementById('confirm-cancel').hidden = true; };
  }

  /* ---------- products ---------- */
  function products() {
    let list = S.db.products.slice();
    if (ui.prodCat) list = list.filter(p => p.cat === ui.prodCat);
    if (ui.prodStock) list = list.filter(p => ui.prodStock === 'hidden' ? !p.visible : S.productStockState(p) === ui.prodStock);
    if (ui.prodQ) { const q = ui.prodQ.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || p.variants.some(v => v.sku.toLowerCase().includes(q))); }
    const body = `<div class="toolbar"><input id="p-q" type="search" class="search" placeholder="Search name or SKU" value="${e(ui.prodQ)}" aria-label="Search products">
      <select id="p-cat" class="sel" aria-label="Category"><option value="">All categories</option>${S.db.categories.map(c => `<option value="${c.id}" ${ui.prodCat === c.id ? 'selected' : ''}>${e(c.name)}</option>`).join('')}</select>
      <select id="p-stock" class="sel" aria-label="Stock"><option value="">Any status</option><option value="low" ${ui.prodStock === 'low' ? 'selected' : ''}>Low stock</option><option value="out" ${ui.prodStock === 'out' ? 'selected' : ''}>Out of stock</option><option value="hidden" ${ui.prodStock === 'hidden' ? 'selected' : ''}>Hidden</option></select>
      <span class="muted small">${list.length} products</span></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>Product</th><th>Category</th><th class="r">Price</th><th class="r">Stock</th><th>Status</th><th class="c">Featured</th></tr></thead><tbody>
      ${list.map(p => { const [a, b] = S.priceRange(p); return `<tr data-href="#admin-product-${p.id}"><td class="od-img"><img src="${e(p.images[0])}" alt="" loading="lazy"></td><td><a href="#admin-product-${p.id}"><b>${e(p.name)}</b></a><small>${p.variants.length > 1 ? p.variants.length + ' sizes' : e(p.variants[0].size)} · ${e(p.variants[0].sku)}</small></td><td>${e((S.cat(p.cat) || { name: '—' }).name)}</td><td class="r mono">${a === b ? S.inr(a) : S.inr(a) + '–' + S.inr(b).slice(1)}</td><td class="r mono">${S.totalStock(p)}</td><td>${p.visible ? stockPill(S.productStockState(p)) : '<span class="pill s-hidden">Hidden</span>'}</td><td class="c">${p.featured ? '★' : ''}</td></tr>`; }).join('') || '<tr><td colspan="7" class="muted">No products match.</td></tr>'}
      </tbody></table></div>`;
    return shell('products', 'Products', body, `<a class="btn primary" href="#admin-new">${I('plus')} Add product</a>`);
  }
  function bindProducts(rerender) {
    const q = document.getElementById('p-q'); let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { ui.prodQ = q.value.trim(); rerender(true); }, 250); };
    document.getElementById('p-cat').onchange = ev => { ui.prodCat = ev.target.value; rerender(); };
    document.getElementById('p-stock').onchange = ev => { ui.prodStock = ev.target.value; rerender(); };
    document.querySelectorAll('tr[data-href]').forEach(r => r.onclick = ev => { if (ev.target.closest('a')) return; location.hash = r.dataset.href.slice(1); });
  }

  let draft = null;
  const NOPHOTO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#e2dcc6"/><path d="M150 230h100v80H150z" fill="none" stroke="#9a8a72" stroke-width="6"/><circle cx="200" cy="270" r="18" fill="none" stroke="#9a8a72" stroke-width="6"/><text x="200" y="360" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#7a6a55">Photo coming soon</text></svg>');
  function productForm(id) {
    const existing = id ? S.product(id) : null;
    if (id && !existing) return shell('products', 'Product not found', '<p><a href="#admin-products">Back to products</a></p>');
    if (!draft || draft._for !== (id || 'new')) {
      draft = existing ? JSON.parse(JSON.stringify(existing)) : { id: '', slug: '', name: '', cat: S.db.categories[0].id, tags: [], images: [], desc: '', material: '', weight: '', care: '', featured: false, visible: true, flag: '', variants: [{ id: S.uid('v'), label: 'One size', size: '', price: 0, stock: 0, lowAt: null, sku: '', image: '' }] };
      draft._for = id || 'new';
    }
    const d = draft;
    const TAGS = [['living', 'Living room'], ['bedroom', 'Bedroom'], ['dining', 'Dining'], ['study', 'Study'], ['balcony', 'Balcony & garden'], ['pooja', 'Pooja room'], ['gift', 'Gift ideas'], ['christmas', 'Christmas edit']];
    const sold = existing ? S.db.orders.filter(o => S.counted(o)).reduce((s, o) => s + o.items.filter(i => i.pid === existing.id).reduce((a, i) => a + i.qty, 0), 0) : 0;
    const body = `<p class="crumb"><a href="#admin-products">Products</a> / ${existing ? e(existing.name) : 'New product'}</p>
      <form id="pf" class="pf-grid" novalidate>
        <div class="pf-main">
          <section class="panel"><h2>Basics</h2>
            <div class="field"><label for="pf-name">Product name</label><input id="pf-name" value="${e(d.name)}" required placeholder="e.g. Golden Vein Deer Pair"></div>
            <div class="two"><div class="field"><label for="pf-cat">Category</label><select id="pf-cat">${S.db.categories.map(c => `<option value="${c.id}" ${d.cat === c.id ? 'selected' : ''}>${e(c.name)}</option>`).join('')}<option value="__new">+ New category…</option></select></div>
            <div class="field" id="newcat-field" hidden><label for="pf-newcat">New category name</label><input id="pf-newcat" placeholder="e.g. Candles & Fragrance"></div></div>
            <fieldset class="field"><legend>Rooms and collections</legend><div class="chips">${TAGS.map(t => `<label class="chip check ${d.tags.includes(t[0]) ? 'on' : ''}"><input type="checkbox" value="${t[0]}" ${d.tags.includes(t[0]) ? 'checked' : ''}> ${t[1]}</label>`).join('')}</div></fieldset>
          </section>
          <section class="panel"><div class="p-head"><h2>Sizes, prices and stock</h2><button type="button" class="btn ghost sm" id="add-var">${I('plus')} Add a size</button></div>
            <p class="a-note">Add one row per size. Shoppers see a size picker when there is more than one, and the price changes with the size.</p>
            <div class="var-table" id="var-rows">${d.variants.map((v, i) => `<div class="var-row" data-i="${i}">
              <div class="field"><label for="v-label-${i}">Size label</label><input id="v-label-${i}" data-k="label" value="${e(v.label)}" placeholder="13 in"></div>
              <div class="field"><label for="v-size-${i}">Dimensions</label><input id="v-size-${i}" data-k="size" value="${e(v.size)}" placeholder="13 in height"></div>
              <div class="field"><label for="v-price-${i}">Price (₹)</label><input id="v-price-${i}" data-k="price" inputmode="numeric" value="${v.price || ''}"></div>
              <div class="field"><label for="v-stock-${i}">Stock</label><input id="v-stock-${i}" data-k="stock" inputmode="numeric" value="${v.stock}"></div>
              <div class="field"><label for="v-sku-${i}">SKU</label><input id="v-sku-${i}" data-k="sku" value="${e(v.sku)}"></div>
              <button type="button" class="icon-btn rm-var" data-rm="${i}" aria-label="Remove this size" ${d.variants.length < 2 ? 'disabled' : ''}>${I('x')}</button>
            </div>`).join('')}</div>
          </section>
          <section class="panel"><h2>More details</h2><p class="a-note">Shown in the "More details" panel on the product page. Leave a field empty to hide it.</p>
            <div class="field"><label for="pf-desc">Description</label><textarea id="pf-desc" rows="3">${e(d.desc)}</textarea></div>
            <div class="two"><div class="field"><label for="pf-mat">Material</label><input id="pf-mat" value="${e(d.material)}" placeholder="Ceramic, matte glaze"></div><div class="field"><label for="pf-wt">Weight</label><input id="pf-wt" value="${e(d.weight)}" placeholder="1.2 kg"></div></div>
            <div class="field"><label for="pf-care">Care</label><input id="pf-care" value="${e(d.care)}" placeholder="Wipe with a dry cloth"></div>
          </section>
        </div>
        <div class="pf-side">
          <section class="panel"><h2>Photos</h2>
            <div class="photo-grid">${d.images.map((s, i) => `<div class="ph"><img src="${e(s)}" alt="">${i === 0 ? '<span class="ph-main">Main</span>' : ''}<button type="button" class="icon-btn" data-rmimg="${i}" aria-label="Remove photo">${I('x')}</button></div>`).join('')}
              <label class="ph add"><input type="file" accept="image/*" id="pf-img" multiple><span>${I('plus')} Upload photo</span></label></div>
          </section>
          <section class="panel"><h2>Visibility</h2>
            <label class="switch"><input type="checkbox" id="pf-vis" ${d.visible ? 'checked' : ''}><span></span> Show in the shop</label>
            <label class="switch"><input type="checkbox" id="pf-feat" ${d.featured ? 'checked' : ''}><span></span> Featured (shown first)</label>
            ${existing ? `<p class="a-note">${sold} sold so far · <a href="#p-${existing.slug}">View in shop ↗</a></p>` : ''}
          </section>
          <p class="form-err" id="pf-err" role="alert" hidden></p>
          <div class="btn-col"><button class="btn primary block-btn" type="submit">${existing ? 'Save changes' : 'Add product'}</button>
          ${existing ? `<button type="button" class="btn ghost block-btn" id="dup">Duplicate</button><button type="button" class="btn danger-ghost block-btn" id="del">Delete product</button>
          <div id="del-confirm" class="inline-confirm" hidden><p>Delete ${e(existing.name)}? Past orders keep their details.</p><button type="button" class="btn danger" id="del-yes">Yes, delete</button><button type="button" class="btn ghost" id="del-no">Keep it</button></div>` : ''}</div>
        </div>
      </form>`;
    return shell('products', existing ? 'Edit product' : 'Add product', body);
  }
  function readDraft() {
    const d = draft, g = id => document.getElementById(id);
    d.name = g('pf-name').value.trim(); d.cat = g('pf-cat').value;
    d.tags = [...document.querySelectorAll('#pf .chip.check input:checked')].map(x => x.value);
    d.desc = g('pf-desc').value.trim(); d.material = g('pf-mat').value.trim(); d.weight = g('pf-wt').value.trim(); d.care = g('pf-care').value.trim();
    d.visible = g('pf-vis').checked; d.featured = g('pf-feat').checked;
    document.querySelectorAll('.var-row').forEach(r => { const v = d.variants[+r.dataset.i]; r.querySelectorAll('input').forEach(inp => { const k = inp.dataset.k; v[k] = (k === 'price' || k === 'stock') ? (parseInt(inp.value.replace(/\D/g, ''), 10) || 0) : inp.value.trim(); }); });
  }
  function shrink(file) {
    return new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, 720 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .72)); }; img.onerror = () => res(null); img.src = fr.result; };
      fr.readAsDataURL(file);
    });
  }
  function bindProductForm(rerender, id) {
    const g = x => document.getElementById(x);
    g('pf-cat').onchange = () => { g('newcat-field').hidden = g('pf-cat').value !== '__new'; if (!g('newcat-field').hidden) g('pf-newcat').focus(); };
    document.querySelectorAll('#pf .chip.check input').forEach(c => c.onchange = () => c.parentElement.classList.toggle('on', c.checked));
    g('add-var').onclick = () => { readDraft(); const base = draft.variants[0]; draft.variants.push({ id: S.uid('v'), label: '', size: '', price: base.price, stock: 0, lowAt: null, sku: '', image: '' }); if (draft.variants[0].label === 'One size') draft.variants[0].label = ''; rerender(true); setTimeout(() => { const n = draft.variants.length - 1; const el = g('v-label-' + n); el && el.focus(); }); };
    document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { readDraft(); draft.variants.splice(+b.dataset.rm, 1); rerender(true); });
    document.querySelectorAll('[data-rmimg]').forEach(b => b.onclick = () => { readDraft(); draft.images.splice(+b.dataset.rmimg, 1); rerender(true); });
    g('pf-img').onchange = async ev => { readDraft(); for (const f of ev.target.files) { const u = await shrink(f); if (u) draft.images.push(u); } rerender(true); };
    g('pf').onsubmit = ev => {
      ev.preventDefault(); readDraft();
      const d = draft, err = g('pf-err'), errs = [];
      if (!d.name) errs.push('a product name');
      if (d.cat === '__new' && !g('pf-newcat').value.trim()) errs.push('a name for the new category');
      if (d.variants.some(v => !v.price)) errs.push('a price for every size');
      if (d.variants.length > 1 && d.variants.some(v => !v.label)) errs.push('a label for every size (e.g. 13 in)');
      if (errs.length) { err.textContent = 'Please add ' + errs.join(', ') + '.'; err.hidden = false; return; }
      if (d.cat === '__new') { const name = g('pf-newcat').value.trim(); const cid = S.slugify(name); if (!S.cat(cid)) S.db.categories.push({ id: cid, name, slug: cid, sort: S.db.categories.length, visible: true, cover: '' }); d.cat = cid; }
      if (d.variants.length === 1 && !d.variants[0].label) d.variants[0].label = 'One size';
      if (!d.images.length) d.images = [NOPHOTO];
      d.variants.forEach((v, i) => { if (!v.sku) v.sku = 'DS-' + S.slugify(d.name).slice(0, 8).toUpperCase() + (d.variants.length > 1 ? '-' + (i + 1) : ''); if (!v.size) v.size = v.label; });
      const clean = { ...d }; delete clean._for;
      if (id) {
        const p = S.product(id);
        p.variants.forEach(v => { const nv = clean.variants.find(x => x.id === v.id); if (nv && nv.stock !== v.stock) S.db.moves.unshift({ id: S.uid('m'), vid: v.id, delta: nv.stock - v.stock, reason: 'adjust', ref: 'Edited on product page', at: Date.now(), by: S.db.session.email }); });
        Object.assign(p, clean);
        UI.toast('Saved. Changes are live in the shop.');
      } else {
        clean.id = S.uid('p'); clean.created = Date.now();
        let slug = S.slugify(clean.name); while (S.productBySlug(slug)) slug += '-2'; clean.slug = slug;
        clean.variants.forEach(v => { v.id = clean.id + '-' + v.id; if (v.stock) S.db.moves.unshift({ id: S.uid('m'), vid: v.id, delta: v.stock, reason: 'restock', ref: 'Opening stock', at: Date.now(), by: S.db.session.email }); });
        S.db.products.unshift(clean);
        UI.toast(`${clean.name} added. It's now live in the shop.`);
      }
      S.save(); draft = null;
      location.hash = 'admin-products';
    };
    const dup = g('dup'); if (dup) dup.onclick = () => { readDraft(); const c = JSON.parse(JSON.stringify(draft)); c.name += ' (copy)'; c.variants.forEach(v => { v.id = S.uid('v'); v.sku = ''; v.stock = 0; }); c._for = 'new'; draft = c; location.hash = 'admin-new'; };
    const del = g('del'); if (del) { del.onclick = () => { g('del-confirm').hidden = false; }; g('del-no').onclick = () => { g('del-confirm').hidden = true; }; g('del-yes').onclick = () => { S.db.products = S.db.products.filter(p => p.id !== id); S.db.cart = S.db.cart.filter(l => S.variant(l.vid)); S.save(); draft = null; UI.toast('Product deleted.'); location.hash = 'admin-products'; }; }
  }

  /* ---------- categories ---------- */
  function categories() {
    const cs = S.db.categories.slice().sort((a, b) => a.sort - b.sort);
    const body = `<p class="a-sub">Categories appear in the shop menu, home page tiles and filters in this order.</p>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Order</th><th></th><th>Name</th><th class="r">Products</th><th>Shown in shop</th><th></th></tr></thead><tbody>
      ${cs.map((c, i) => { const n = S.db.products.filter(p => p.cat === c.id).length; const cover = (S.product(c.cover) || S.db.products.find(p => p.cat === c.id) || { images: [''] }).images[0]; return `<tr>
        <td class="nowrap"><button class="icon-btn" data-up="${c.id}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button><button class="icon-btn" data-down="${c.id}" ${i === cs.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button></td>
        <td class="od-img">${cover ? `<img src="${e(cover)}" alt="">` : ''}</td>
        <td><label class="sr" for="cn-${c.id}">Name</label><input class="inline-in" id="cn-${c.id}" data-rename="${c.id}" value="${e(c.name)}"></td>
        <td class="r mono">${n}</td>
        <td><label class="switch"><input type="checkbox" data-vis="${c.id}" ${c.visible ? 'checked' : ''}><span></span><span class="sr">Show ${e(c.name)}</span></label></td>
        <td>${n ? `<span class="muted small" title="Move its products first">Holds ${n} products</span>` : `<button class="link-btn danger-t" data-delc="${c.id}">Delete</button>`}</td></tr>`; }).join('')}
      </tbody></table></div>
      <form id="cat-form" class="panel add-cat"><h2>Add a category</h2><div class="row-in"><div class="field grow"><label for="nc-name">Category name</label><input id="nc-name" placeholder="e.g. Candles & Fragrance"></div><button class="btn primary" type="submit">${I('plus')} Add category</button></div><p class="form-err" id="nc-err" role="alert" hidden></p></form>`;
    return shell('categories', 'Categories', body);
  }
  function bindCategories(rerender) {
    const cs = () => S.db.categories.slice().sort((a, b) => a.sort - b.sort);
    const swap = (id, dir) => { const l = cs(); const i = l.findIndex(c => c.id === id); const j = i + dir; if (j < 0 || j >= l.length) return; [l[i].sort, l[j].sort] = [l[j].sort, l[i].sort]; l.forEach((c, k) => { if (k !== i && k !== j) c.sort = c.sort; }); S.save(); rerender(); };
    S.db.categories.slice().sort((a, b) => a.sort - b.sort).forEach((c, i) => c.sort = i);
    document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => swap(b.dataset.up, -1));
    document.querySelectorAll('[data-down]').forEach(b => b.onclick = () => swap(b.dataset.down, 1));
    document.querySelectorAll('[data-rename]').forEach(inp => inp.onchange = () => { const c = S.cat(inp.dataset.rename); if (inp.value.trim()) { c.name = inp.value.trim(); S.save(); UI.toast('Category renamed.'); } });
    document.querySelectorAll('[data-vis]').forEach(inp => inp.onchange = () => { S.cat(inp.dataset.vis).visible = inp.checked; S.save(); UI.toast(inp.checked ? 'Category shown in the shop.' : 'Category hidden from the shop.'); });
    document.querySelectorAll('[data-delc]').forEach(b => b.onclick = () => { S.db.categories = S.db.categories.filter(c => c.id !== b.dataset.delc); S.save(); rerender(); UI.toast('Category deleted.'); });
    document.getElementById('cat-form').onsubmit = ev => {
      ev.preventDefault(); const name = document.getElementById('nc-name').value.trim(); const er = document.getElementById('nc-err');
      if (!name) { er.textContent = 'Type a name for the category.'; er.hidden = false; return; }
      const id = S.slugify(name); if (S.cat(id)) { er.textContent = 'A category with that name already exists.'; er.hidden = false; return; }
      S.db.categories.push({ id, name, slug: id, sort: S.db.categories.length, visible: true, cover: '' }); S.save(); rerender(); UI.toast(`${name} added. Assign products to it from the product page.`);
    };
  }

  /* ---------- inventory ---------- */
  function inventory() {
    let rows = [];
    S.db.products.forEach(p => p.variants.forEach(v => rows.push({ p, v, s: S.stockState(v) })));
    if (ui.invOnly) rows = rows.filter(r => r.s !== 'ok');
    if (ui.invQ) { const q = ui.invQ.toLowerCase(); rows = rows.filter(r => (r.p.name + ' ' + r.v.sku).toLowerCase().includes(q)); }
    rows.sort((a, b) => ({ out: 0, low: 1, ok: 2 }[a.s] - { out: 0, low: 1, ok: 2 }[b.s]) || a.p.name.localeCompare(b.p.name));
    const units = S.db.products.reduce((s, p) => s + S.totalStock(p), 0);
    const value = S.db.products.reduce((s, p) => s + p.variants.reduce((a, v) => a + Math.max(0, v.stock) * v.price, 0), 0);
    const moves = S.db.moves.slice(0, 14);
    const body = `<div class="kpis three"><div class="kpi"><span class="k-l">Pieces in stock</span><span class="k-v">${units}</span></div><div class="kpi"><span class="k-l">Stock value at retail</span><span class="k-v">${S.inrShort(value)}</span></div><div class="kpi"><span class="k-l">Low or out</span><span class="k-v">${S.restockList().length}</span><span class="vs">sizes need restocking</span></div></div>
      <div class="toolbar"><input id="i-q" type="search" class="search" placeholder="Search product or SKU" value="${e(ui.invQ)}" aria-label="Search inventory"><label class="switch"><input type="checkbox" id="i-only" ${ui.invOnly ? 'checked' : ''}><span></span> Only low and out of stock</label></div>
      <div class="inv-grid"><div class="table-wrap"><table class="tbl"><thead><tr><th>Product</th><th>SKU</th><th class="r">On hand</th><th class="r">Alert at</th><th>Status</th><th>Adjust</th></tr></thead><tbody>
      ${rows.slice(0, 120).map(r => `<tr><td><a href="#admin-product-${r.p.id}"><b>${e(r.p.name)}</b></a><small>${e(r.v.label === 'One size' ? r.v.size : r.v.label)}</small></td><td class="mono small">${e(r.v.sku)}</td><td class="r mono"><b>${r.v.stock}</b></td>
        <td class="r"><label class="sr" for="la-${r.v.id}">Low-stock alert</label><input class="inline-in num" id="la-${r.v.id}" data-low="${r.v.id}" inputmode="numeric" value="${S.lowAt(r.v)}"></td><td>${stockPill(r.s)}</td>
        <td class="adj"><label class="sr" for="aq-${r.v.id}">Quantity</label><input class="inline-in num" id="aq-${r.v.id}" inputmode="numeric" value="1"><label class="sr" for="ar-${r.v.id}">Reason</label><select class="inline-in" id="ar-${r.v.id}"><option value="restock">+ Restock</option><option value="store_sale">− Store sale</option><option value="damage">− Damaged</option><option value="adjust">= Set count</option></select><button class="btn ghost sm" data-adj="${r.v.id}">Apply</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Nothing matches.</td></tr>'}
      </tbody></table></div>
      <section class="panel"><div class="p-head"><h2>Stock history</h2></div><ul class="moves">${moves.map(m => { const h = S.variant(m.vid); return `<li><span class="mv ${m.delta > 0 ? 'up' : 'down'}">${m.delta > 0 ? '+' : ''}${m.delta}</span><span><b>${h ? e(h.p.name) : 'Deleted product'}</b><small>${REASON[m.reason] || m.reason}${m.ref ? ' · ' + e(m.ref) : ''}</small></span><span class="muted small">${S.fmtDate(m.at, { day: 'numeric', month: 'short' })}</span></li>`; }).join('')}</ul></section></div>`;
    return shell('inventory', 'Inventory', body);
  }
  function bindInventory(rerender) {
    const q = document.getElementById('i-q'); let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { ui.invQ = q.value.trim(); rerender(true); }, 250); };
    document.getElementById('i-only').onchange = ev => { ui.invOnly = ev.target.checked; rerender(); };
    document.querySelectorAll('[data-low]').forEach(inp => inp.onchange = () => { const h = S.variant(inp.dataset.low); h.v.lowAt = parseInt(inp.value, 10) || 0; S.save(); rerender(); });
    document.querySelectorAll('[data-adj]').forEach(b => b.onclick = () => {
      const vid = b.dataset.adj, h = S.variant(vid);
      const n = parseInt(document.getElementById('aq-' + vid).value, 10); const reason = document.getElementById('ar-' + vid).value;
      if (isNaN(n) || n < 0) { UI.toast('Enter a quantity of 0 or more.'); return; }
      const d = reason === 'restock' ? n : reason === 'adjust' ? n - h.v.stock : -n;
      if (!d) { UI.toast('No change to apply.'); return; }
      S.move(vid, d, reason, reason === 'store_sale' ? 'Experience Store' : ''); S.save();
      UI.toast(`${h.p.name}: stock now ${h.v.stock}.`); rerender(true);
    });
  }

  /* ---------- customers ---------- */
  function customers() {
    const st = S.customerStats();
    let list = S.db.customers.map(c => ({ c, s: st.get(c.id) || { orders: 0, spend: 0, last: c.created, first: c.created, cats: {} } }));
    if (ui.custQ) { const q = ui.custQ.toLowerCase(); list = list.filter(x => (x.c.name + ' ' + x.c.phone + ' ' + x.c.city + ' ' + x.c.email).toLowerCase().includes(q)); }
    const sorters = { spend: (a, b) => b.s.spend - a.s.spend, orders: (a, b) => b.s.orders - a.s.orders, recent: (a, b) => b.s.last - a.s.last, name: (a, b) => a.c.name.localeCompare(b.c.name) };
    list.sort(sorters[ui.custSort]);
    const rep = list.filter(x => x.s.orders > 1).length;
    const body = `<div class="kpis three"><div class="kpi"><span class="k-l">Customers</span><span class="k-v">${S.db.customers.length}</span></div><div class="kpi"><span class="k-l">Repeat customers</span><span class="k-v">${[...st.values()].filter(s => s.orders > 1).length}</span><span class="vs">2 or more completed orders</span></div><div class="kpi"><span class="k-l">Average lifetime spend</span><span class="k-v">${S.inr([...st.values()].reduce((s, x) => s + x.spend, 0) / Math.max(1, st.size))}</span></div></div>
      <div class="toolbar"><input id="c-q" type="search" class="search" placeholder="Name, phone, city or email" value="${e(ui.custQ)}" aria-label="Search customers">
      <select id="c-sort" class="sel" aria-label="Sort">${[['spend', 'Top spenders'], ['orders', 'Most orders'], ['recent', 'Most recent'], ['name', 'Name A–Z']].map(o => `<option value="${o[0]}" ${ui.custSort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
      <span class="muted small">${list.length} shown · ${rep} repeat</span></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Customer</th><th>Phone</th><th>City</th><th class="r">Orders</th><th class="r">Total spend</th><th>Last order</th></tr></thead><tbody>
      ${list.slice(0, 100).map(x => `<tr data-href="#admin-customer-${x.c.id}"><td><a href="#admin-customer-${x.c.id}"><b>${e(x.c.name)}</b></a> ${x.s.orders > 1 ? '<span class="pill s-repeat">Repeat</span>' : ''}<small>${e(x.c.email)}</small></td><td class="mono">${e(x.c.phone)}</td><td>${e(x.c.city)}</td><td class="r mono">${x.s.orders}</td><td class="r mono">${S.inr(x.s.spend)}</td><td>${S.fmtDate(x.s.last, { day: 'numeric', month: 'short' })}</td></tr>`).join('')}
      </tbody></table></div>
      <details class="panel csv"><summary>Export customers as CSV</summary><p class="a-note">Copy this text and paste it into Excel or Google Sheets. Downloads are switched off in the shared prototype.</p><button class="btn ghost sm" id="copy-csv">${I('copy')} Copy CSV</button><textarea id="csv" rows="6" readonly>${e(['Name,Phone,Email,City,Orders,Total spend,Last order'].concat(list.map(x => [x.c.name, x.c.phone, x.c.email, x.c.city, x.s.orders, x.s.spend, new Date(x.s.last).toISOString().slice(0, 10)].map(v => /[,"]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(','))).join('\n'))}</textarea></details>`;
    return shell('customers', 'Customers', body);
  }
  function bindCustomers(rerender) {
    const q = document.getElementById('c-q'); let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { ui.custQ = q.value.trim(); rerender(true); }, 250); };
    document.getElementById('c-sort').onchange = ev => { ui.custSort = ev.target.value; rerender(); };
    document.querySelectorAll('tr[data-href]').forEach(r => r.onclick = ev => { if (ev.target.closest('a')) return; location.hash = r.dataset.href.slice(1); });
    document.getElementById('copy-csv').onclick = () => UI.copy(document.getElementById('csv').value, document.getElementById('csv'));
  }
  function customerDetail(id) {
    const c = S.customer(id);
    if (!c) return shell('customers', 'Customer not found', '<p><a href="#admin-customers">Back to customers</a></p>');
    const os = S.db.orders.filter(o => o.cid === c.id);
    const s = S.customerStats().get(c.id) || { orders: 0, spend: 0, cats: {}, first: c.created, last: c.created };
    const fav = Object.entries(s.cats).sort((a, b) => b[1] - a[1])[0];
    const body = `<p class="crumb"><a href="#admin-customers">Customers</a> / ${e(c.name)}</p>
      <div class="kpis"><div class="kpi"><span class="k-l">Lifetime spend</span><span class="k-v">${S.inr(s.spend)}</span></div><div class="kpi"><span class="k-l">Completed orders</span><span class="k-v">${s.orders}</span>${s.orders > 1 ? '<span class="pill s-repeat">Repeat customer</span>' : ''}</div><div class="kpi"><span class="k-l">Average order</span><span class="k-v">${S.inr(s.orders ? s.spend / s.orders : 0)}</span></div><div class="kpi"><span class="k-l">Favourite category</span><span class="k-v sm">${fav ? e((S.cat(fav[0]) || { name: fav[0] }).name) : '—'}</span></div></div>
      <div class="od-grid"><section class="panel"><div class="p-head"><h2>Orders</h2></div><div class="table-wrap"><table class="tbl plain"><tbody>${os.map(o => `<tr data-href="#admin-order-${o.number}"><td><a href="#admin-order-${o.number}"><b>${o.number}</b></a><small>${S.fmtDate(o.created)}</small></td><td>${e(o.items.map(i => i.name).join(', '))}</td><td class="r mono">${S.inr(o.subtotal)}</td><td>${pill(o.status)}</td></tr>`).join('')}</tbody></table></div></section>
      <section class="panel"><div class="p-head"><h2>Contact</h2></div><p class="mono">+91 ${e(c.phone)}</p>${c.email ? `<p>${e(c.email)}</p>` : ''}<p>${e(c.city)}</p><p class="muted small">Customer since ${S.fmtDate(s.first)}</p><a class="btn wa" href="https://wa.me/91${c.phone}" target="_blank" rel="noopener">${I('wa')} Message on WhatsApp</a></section></div>`;
    return shell('customers', e(c.name), body);
  }

  /* ---------- enquiries ---------- */
  function enquiries() {
    let list = S.db.enquiries;
    if (ui.enqStatus !== 'all') list = list.filter(x => x.status === ui.enqStatus);
    const body = `<div class="toolbar"><div class="tabs" role="group" aria-label="Status">${[['all', 'All', S.db.enquiries.length]].concat(Object.entries(ENQ).map(([k, v]) => [k, v, S.db.enquiries.filter(x => x.status === k).length])).map(t => `<button data-es="${t[0]}" class="${ui.enqStatus === t[0] ? 'on' : ''}">${t[1]} <span>${t[2]}</span></button>`).join('')}</div></div>
      <div class="enq-list">${list.map(x => `<article class="panel enq"><div class="enq-head"><div><h2>${e(x.name)}</h2><p class="muted small">${S.fmtDate(x.at)} · <span class="mono">${e(x.phone)}</span>${x.email ? ' · ' + e(x.email) : ''}</p></div>
        <label class="sr" for="es-${x.id}">Status</label><select class="sel" id="es-${x.id}" data-enq="${x.id}">${Object.entries(ENQ).map(([k, v]) => `<option value="${k}" ${x.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="enq-tags"><span>${e(x.property)}</span><span>${e(x.scope)}</span><span>${e(x.budget)}</span>${x.date ? `<span>Prefers ${e(x.date)}</span>` : ''}</div>
        <p>${e(x.message)}</p>
        <div class="field"><label for="en-note-${x.id}">Internal note</label><input id="en-note-${x.id}" data-note="${x.id}" value="${e(x.note)}" placeholder="e.g. Site visit Sat 11 am"></div>
        <a class="btn wa sm" href="https://wa.me/91${x.phone}?text=${encodeURIComponent(`Hi ${x.name.split(' ')[0]}, this is the Dè Stories design studio about your enquiry.`)}" target="_blank" rel="noopener">${I('wa')} Reply on WhatsApp</a></article>`).join('') || '<p class="muted">No enquiries with this status.</p>'}</div>`;
    return shell('enquiries', 'Studio enquiries', body);
  }
  function bindEnquiries(rerender) {
    document.querySelectorAll('[data-es]').forEach(b => b.onclick = () => { ui.enqStatus = b.dataset.es; rerender(); });
    document.querySelectorAll('[data-enq]').forEach(s => s.onchange = () => { S.db.enquiries.find(x => x.id === s.dataset.enq).status = s.value; S.save(); UI.toast('Status updated.'); rerender(true); });
    document.querySelectorAll('[data-note]').forEach(i => i.onchange = () => { S.db.enquiries.find(x => x.id === i.dataset.note).note = i.value.trim(); S.save(); UI.toast('Note saved.'); });
  }

  /* ---------- settings ---------- */
  function settings() {
    const st = S.db.settings;
    const body = `<form id="set-form" class="panel form narrow"><h2>Store details</h2>
      <div class="field"><label for="st-wa">WhatsApp number for orders</label><input id="st-wa" value="${e(st.phoneDisplay)}"></div>
      <div class="field"><label for="st-addr">Address</label><input id="st-addr" value="${e(st.address)}"></div>
      <div class="field"><label for="st-hours">Opening hours</label><input id="st-hours" value="${e(st.hours)}"></div>
      <div class="field"><label for="st-del">Delivery &amp; returns text</label><textarea id="st-del" rows="4">${e(st.delivery)}</textarea></div>
      <div class="field"><label for="st-low">Default low-stock alert</label><input id="st-low" inputmode="numeric" value="${st.lowStockDefault}"></div>
      <button class="btn primary" type="submit">Save settings</button></form>
      <section class="panel narrow"><h2>Admin users</h2><p>These emails can sign in to the admin with a one-time link.</p>
        <ul class="mini-list admins">${admins().map(a => `<li><span class="adm"><span>${e(a)}</span>${a === S.db.session.email ? '<small>You</small>' : `<button class="link-btn danger-t" data-rmadm="${e(a)}">Remove</button>`}</span></li>`).join('')}</ul>
        <form id="adm-form" class="row-in"><div class="field grow"><label for="adm-email">Add an admin email</label><input id="adm-email" type="email" placeholder="staff@example.com"></div><button class="btn ghost" type="submit">${I('plus')} Add</button></form>
        <p class="form-err" id="adm-err" role="alert" hidden></p></section>
      <section class="panel narrow"><h2>Demo data</h2><p>Restore the original catalog stock, sample orders, customers and enquiries. Anything you added while testing will be removed.</p>
      <button class="btn danger-ghost" id="reset">Reset demo data</button><div id="reset-confirm" class="inline-confirm" hidden><p>Reset everything to the starting demo?</p><button class="btn danger" id="reset-yes">Yes, reset</button><button class="btn ghost" id="reset-no">Cancel</button></div>
      ${S.memoryOnly ? '<p class="warn-box">This browser is blocking storage, so changes last only until the tab is closed.</p>' : ''}</section>`;
    return shell('settings', 'Settings', body);
  }
  function bindSettings(rerender) {
    document.getElementById('set-form').onsubmit = ev => {
      ev.preventDefault(); const st = S.db.settings, g = id => document.getElementById(id).value.trim();
      st.phoneDisplay = g('st-wa'); const digits = st.phoneDisplay.replace(/\D/g, ''); st.whatsapp = digits.length === 10 ? '91' + digits : digits;
      st.address = g('st-addr'); st.hours = g('st-hours'); st.delivery = g('st-del'); st.lowStockDefault = parseInt(g('st-low'), 10) || 0;
      S.save(); UI.toast('Settings saved.');
    };
    document.querySelectorAll('[data-rmadm]').forEach(b => b.onclick = () => { S.db.settings.admins = admins().filter(a => a !== b.dataset.rmadm); S.save(); UI.toast('Admin removed.'); rerender(true); });
    document.getElementById('adm-form').onsubmit = ev => { ev.preventDefault(); const v = document.getElementById('adm-email').value.trim().toLowerCase(); const er = document.getElementById('adm-err'); if (!/^\S+@\S+\.\S+$/.test(v)) { er.textContent = 'Enter a valid email address.'; er.hidden = false; return; } if (admins().includes(v)) { er.textContent = 'That email is already an admin.'; er.hidden = false; return; } S.db.settings.admins = admins().concat(v); S.save(); UI.toast(v + ' can now sign in.'); rerender(true); };
    document.getElementById('reset').onclick = () => { document.getElementById('reset-confirm').hidden = false; };
    document.getElementById('reset-no').onclick = () => { document.getElementById('reset-confirm').hidden = true; };
    document.getElementById('reset-yes').onclick = () => { const sess = S.db.session; S.reset(); S.db.session = sess; S.save(); UI.toast('Demo data restored.'); location.hash = 'admin'; UI.route(); };
  }

  function bindShell() {
    const so = document.getElementById('sign-out');
    if (so) so.onclick = () => { S.db.session = null; S.save(); location.hash = 'admin'; UI.route(); };
  }

  /* router entry */
  function render(route, arg, rerender, quiet) {
    destroyCharts();
    if (!S.db.session) { const step = ui.loginStep || ''; return { html: login(step), bind: () => bindLogin(s => { ui.loginStep = s; rerender(); }) }; }
    ui.loginStep = '';
    const map = {
      '': [dashboard, bindDashboard], orders: [orders, bindOrders], order: [() => orderDetail(arg), r => bindOrderDetail(r, arg)],
      products: [products, bindProducts], product: [() => productForm(arg), r => bindProductForm(r, arg)], new: [() => productForm(null), r => bindProductForm(r, null)],
      categories: [categories, bindCategories], inventory: [inventory, bindInventory], customers: [customers, bindCustomers], customer: [() => customerDetail(arg), () => { document.querySelectorAll('tr[data-href]').forEach(r => r.onclick = ev => { if (!ev.target.closest('a')) location.hash = r.dataset.href.slice(1); }); }],
      enquiries: [enquiries, bindEnquiries], settings: [settings, bindSettings]
    };
    const [v, b] = map[route] || map[''];
    if (route !== 'product' && route !== 'new') draft = null;
    return { html: v(), bind: () => { bindShell(); b(rerender); } };
  }

  window.Admin = { render };
})();
