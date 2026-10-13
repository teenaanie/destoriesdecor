/* Demo data generator (PRD §9). Seeded RNG, so the same story appears on
   every load; dates are relative to today so the dashboard always looks current. */
window.DEFAULT_ADMINS = ['teena.anie9@gmail.com', 'tins08@gmail.com', 'owner@destories.in'];
(function () {
  const DAY = 86400000;

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const FIRST = ['Anu', 'Aswathy', 'Meera', 'Nimmy', 'Reshma', 'Divya', 'Sneha', 'Ann Mary', 'Riya', 'Lakshmi', 'Parvathy', 'Neethu', 'Shilpa', 'Jisha', 'Fathima', 'Ayesha', 'Sana', 'Teresa', 'Elizabeth', 'Gayathri', 'Arya', 'Keerthi', 'Haritha', 'Sruthi', 'Liya',
    'Arjun', 'Rahul', 'Vishnu', 'Akhil', 'Jithin', 'Nikhil', 'Sreejith', 'Anand', 'Joseph', 'Thomas', 'Abin', 'Rohan', 'Midhun', 'Faisal', 'Shameer', 'Kiran', 'George', 'Sajan', 'Varun', 'Ajay'];
  const LAST = ['Nair', 'Menon', 'Pillai', 'Varghese', 'Mathew', 'Jacob', 'Thomas', 'Kurian', 'Joseph', 'Krishnan', 'Raj', 'Das', 'Panicker', 'Kuruvilla', 'Rahman', 'Abraham', 'Philip', 'Chacko', 'Warrier', 'Iyer', 'Antony', 'Paul', 'Sebastian', 'Unnikrishnan', 'Haneef'];
  const CITIES = [['Kochi', 30], ['Kakkanad', 9], ['Edappally', 8], ['Vyttila', 6], ['Aluva', 6], ['Kalamassery', 5], ['Thrissur', 8], ['Kottayam', 6], ['Thiruvananthapuram', 6], ['Kozhikode', 5], ['Alappuzha', 4], ['Bengaluru', 4], ['Chennai', 2], ['Dubai (gift)', 1]];

  const DETAILS = {
    p001: { desc: 'A pair of stags in a soft brushed-gold finish. Display them together on a console or split them across a shelf; they hold their own in a Christmas setting too.', material: 'Polyresin, metallic gold finish', weight: '1.1 kg (pair)', care: 'Dust with a dry microfibre cloth. Keep away from direct sunlight.' },
    p013: { desc: 'The Sermon on the Mount, hand-finished in white and gold. A statement piece for a prayer corner or entryway.', material: 'Polyresin with hand-painted detailing', weight: '1.6 kg', care: 'Dust gently with a soft brush.' },
    p026: { desc: 'A sculpted elephant in burnished gold, its trunk lowered in calm. Sits well on a coffee table or study desk.', material: 'Polyresin, antique gold finish' },
    p043: { desc: 'A tall, slim vase with a soft satin glaze. Use it on its own or with a single stem of dried pampas.', material: 'Ceramic, satin glaze', care: 'Wipe clean. Not for fresh-water arrangements.' },
    p059: { desc: 'A tall fluted planter on a slim stand that lifts greenery to eye level. Comfortable indoors or on a covered balcony.', material: 'Fibre-reinforced cement', weight: '6.5 kg' },
    p084: { desc: 'A five-arm candelabra in matte black. Works for dinner tables and festive mantels.', material: 'Metal, powder-coated', care: 'Use dripless candles. Wipe with a dry cloth.' },
    p097: { desc: 'A hand-shaped vase with a bark texture, sold in two heights. Pair the 14 in and 12 in for a layered look.', material: 'Ceramic, matte glaze' },
    p106: { desc: 'A ribbed glass carafe with four wine glasses. Ready to gift in its box.', material: 'Lead-free glass', care: 'Hand wash recommended.' }
  };

  function weighted(r, arr) {
    const total = arr.reduce((s, a) => s + a[1], 0); let x = r() * total;
    for (const a of arr) { x -= a[1]; if (x <= 0) return a[0]; }
    return arr[arr.length - 1][0];
  }

  function build() {
    const r = rng(360);
    const C = window.CATALOG;
    const categories = C.categories.map((c, i) => ({ id: c.id, name: c.name, slug: c.id, sort: i, visible: true, cover: c.cover }));

    const products = C.products.map((p, i) => ({
      id: p.id, slug: p.slug, name: p.name, cat: p.cat, tags: p.tags.slice(), images: [p.img],
      desc: '', material: '', weight: '', care: '', ...(DETAILS[p.id] || {}),
      featured: p.featured, visible: true, flag: p.flag || '', created: Date.now() - (200 - i) * DAY,
      variants: p.variants.map((v, j) => ({
        id: p.id + '-v' + j, label: v.label, size: v.size, price: v.price,
        stock: 3 + Math.floor(r() * 12), sale: null, lowAt: null, sku: 'DS-' + p.id.slice(1) + (p.variants.length > 1 ? '-' + v.label.replace(/\D/g, '') : ''), image: ''
      }))
    }));
    // A handful of stock alerts so the restock list has something to say.
    [['p001-v0', 2], ['p084-v0', 0], ['p036-v1', 1], ['p061-v0', 1], ['p090-v0', 0], ['p106-v0', 2], ['p022-v0', 3], ['p051-v0', 1]]
      .forEach(([vid, s]) => products.forEach(p => p.variants.forEach(v => { if (v.id === vid) v.stock = s; })));

    // Christmas offer: a few festive pieces carry a sale price (original shown struck through).
    [['p001-v0', 1799], ['p001-v1', 1349], ['p013-v0', 5199], ['p106-v0', 1499], ['p051-v0', 499], ['p079-v0', 1749], ['p096-v0', 1549], ['p009-v0', 169]]
      .forEach(([vid, sp]) => products.forEach(p => p.variants.forEach(v => { if (v.id === vid) v.sale = sp; })));

    // Product popularity: a long tail. Cheaper pieces and featured ones sell more often.
    const pop = new Map();
    products.forEach(p => {
      const price = p.variants[0].price;
      let w = Math.pow(r(), 2.2) * 10 + 0.3;
      w *= price < 800 ? 1.6 : price < 2000 ? 1.0 : price < 3500 ? 0.55 : 0.3;
      if (p.featured) w *= 2.2;
      pop.set(p.id, w);
    });

    const now = Date.now();
    const start = now - 182 * DAY;
    const customers = [];
    function newCustomer(at) {
      const f = FIRST[Math.floor(r() * FIRST.length)], l = LAST[Math.floor(r() * LAST.length)];
      const c = {
        id: 'c' + (customers.length + 1), name: f + ' ' + l,
        phone: String(9 + Math.floor(r() * 1)) + String(Math.floor(r() * 1e9)).padStart(9, '0'),
        email: r() < 0.7 ? (f.split(' ')[0] + '.' + l).toLowerCase() + (r() < 0.5 ? Math.floor(r() * 90 + 10) : '') + '@gmail.com' : '',
        city: weighted(r, CITIES), created: at, loyalty: Math.pow(r(), 3) * 10 + 0.2
      };
      c.phone = ['9', '8', '7', '6'][Math.floor(r() * 4)] + c.phone.slice(1);
      customers.push(c); return c;
    }

    const orders = [];
    let num = 1001;
    const ONAM = new Date(new Date(now).getFullYear(), 7, 26).getTime();
    for (let d = start; d < now; d += DAY) {
      const day = new Date(d), dow = day.getDay(), month = day.getMonth();
      const progress = (d - start) / (now - start);
      let rate = 0.6 + progress * 1.3;          // the shop is growing
      if (dow === 0 || dow === 6) rate *= 1.55;   // weekends
      if (Math.abs(d - ONAM) < 9 * DAY) rate *= 1.45; // Onam gifting
      if (month >= 9) rate *= 1.8;               // festive season starts
      let n = 0, L = Math.exp(-rate), pr = 1;
      do { n++; pr *= r(); } while (pr > L); n--;
      for (let k = 0; k < n; k++) {
        const at = d + (9 + r() * 12) * 3600000;
        if (at > now) continue;
        // ~50% of orders come from people who have bought before
        let c;
        if (customers.length > 8 && r() < 0.5) {
          c = weighted(r, customers.map(x => [x, x.loyalty]));
        } else c = newCustomer(at);
        const nItems = weighted(r, [[1, 62], [2, 28], [3, 10]]);
        const items = [];
        for (let j = 0; j < nItems; j++) {
          const p = weighted(r, products.map(p => {
            let w = pop.get(p.id);
            if (month >= 9 && p.tags.includes('christmas')) w *= 4.5;
            if (Math.abs(d - ONAM) < 9 * DAY && (p.cat === 'spiritual' || p.cat === 'planters' || p.tags.includes('gift'))) w *= 1.8;
            return [p, w];
          }));
          if (items.some(i => i.pid === p.id)) continue;
          const v = p.variants[Math.floor(r() * p.variants.length)];
          items.push({ pid: p.id, vid: v.id, name: p.name, label: v.label, size: v.size, price: v.price, mrp: v.price, qty: r() < 0.14 ? 2 : 1 });
        }
        const age = (now - at) / DAY;
        let status = age < 2.5 ? (r() < 0.75 ? 'pending' : 'confirmed') : age < 6 ? weighted(r, [['confirmed', 4], ['shipped', 5], ['pending', 1]]) : age < 12 ? weighted(r, [['shipped', 4], ['delivered', 6]]) : 'delivered';
        if (r() < 0.05 && age > 2) status = 'cancelled';
        else if (r() < 0.06 && age > 4) status = 'abandoned';
        const fulfil = r() < 0.22 ? 'pickup' : 'delivery';
        const by = 'teena.anie9@gmail.com';
        const courier = ['DTDC', 'Professional Couriers', 'India Post', 'Shiprocket'][Math.floor(r() * 4)];
        const tracking = fulfil === 'pickup' ? '' : courier.slice(0, 2).toUpperCase() + String(Math.floor(r() * 1e9)).padStart(9, '0');
        const hist = [{ s: 'pending', at, note: '', by: '' }];
        if (status !== 'pending' && status !== 'cancelled' && status !== 'abandoned') hist.push({ s: 'confirmed', at: at + 3 * 3600000, note: 'Paid by UPI', by });
        if (status === 'shipped' || status === 'delivered') hist.push({ s: 'shipped', at: at + 1.2 * DAY, note: fulfil === 'pickup' ? 'Ready for pickup at the store' : `${courier} · ${tracking}`, by });
        if (status === 'delivered') hist.push({ s: 'delivered', at: at + 3.5 * DAY, note: fulfil === 'pickup' ? 'Collected from the store' : '', by });
        if (status === 'cancelled') hist.push({ s: 'cancelled', at: at + 5 * 3600000, note: ['Customer changed their mind', 'Item needed sooner than we could deliver', 'Duplicate order'][Math.floor(r() * 3)], by });
        if (status === 'abandoned') hist.push({ s: 'abandoned', at: at + 3.5 * DAY, note: 'No reply on WhatsApp after 3 days', by });
        orders.push({
          number: 'DS-' + (num++), cid: c.id, status, channel: r() < 0.7 ? 'website' : 'whatsapp', fulfil,
          address: fulfil === 'pickup' ? '' : (Math.floor(r() * 90) + 1) + ', ' + ['Green Meadows', 'Palm Grove Apts', 'Skyline Ivy League', 'DLF Riverside', 'Prestige Lakeside', 'Rose Villa', 'Chakkaraparambu Rd', 'Marine Drive'][Math.floor(r() * 8)],
          city: c.city, pincode: '68' + String(Math.floor(r() * 9000) + 1000), notes: r() < 0.12 ? ['Gift wrap please', 'Call before delivery', 'Need before Sunday', 'Birthday gift — no price tag'][Math.floor(r() * 4)] : '',
          items, subtotal: items.reduce((s, i) => s + i.price * i.qty, 0), created: at, history: hist,
          dispatch: (status === 'shipped' || status === 'delivered') && fulfil === 'delivery' ? { courier, tracking } : null
        });
      }
    }
    orders.reverse();
    customers.forEach(c => delete c.loyalty);

    // Stock history: order movements plus a few restocks (levels above are "current").
    const moves = [];
    orders.slice(0, 60).forEach(o => { if (o.history.some(h => h.s === 'confirmed')) o.items.forEach(i => moves.push({ id: 'm' + moves.length, vid: i.vid, delta: -i.qty, reason: 'order', ref: o.number, at: o.history[1].at, by: 'owner@destories.in' })); });
    ['p043-v0', 'p059-v0', 'p012-v0', 'p026-v0', 'p097-v1'].forEach((vid, i) => moves.push({ id: 'mr' + i, vid, delta: 6 + i, reason: 'restock', ref: 'Supplier delivery', at: now - (4 + i * 6) * DAY, by: 'owner@destories.in' }));
    moves.push({ id: 'ms1', vid: 'p020-v0', delta: -1, reason: 'store_sale', ref: 'Walk-in, Experience Store', at: now - 2 * DAY, by: 'owner@destories.in' });
    moves.sort((a, b) => b.at - a.at);

    const ENQ = [
      ['Deepa Raghavan', 'Apartment', 'Full interiors', '₹8–15 lakh', 'New 3BHK at Kakkanad, handover in December.'],
      ['Sanjay Mathew', 'Villa', 'Styling', '₹2–5 lakh', 'Living and dining styling before a family wedding.'],
      ['Hiba Nazar', 'Apartment', 'Decor only', 'Under ₹1 lakh', 'Shelf and wall decor for the living room.'],
      ['Café Lumen', 'Retail', 'Full interiors', '₹15 lakh+', 'Small café fit-out in Panampilly Nagar.'],
      ['Arun Prakash', 'Office', 'Styling', '₹2–5 lakh', 'Reception and meeting room refresh.'],
      ['Mariya Joseph', 'Villa', 'Full interiors', '₹15 lakh+', 'Renovation of a 20-year-old house in Thrissur.'],
      ['Neha Menon', 'Apartment', 'Styling', '₹1–2 lakh', 'Christmas styling and a balcony makeover.'],
      ['Joby Varghese', 'Apartment', 'Decor only', 'Under ₹1 lakh', 'Gifting hampers for 25 clients.'],
      ['Rekha Iyer', 'Villa', 'Styling', '₹2–5 lakh', 'Pooja room and entrance styling.'],
      ['Studio Nine Salon', 'Retail', 'Styling', '₹2–5 lakh', 'Mirror wall and plant styling.'],
      ['Ameen Rasheed', 'Apartment', 'Full interiors', '₹8–15 lakh', '2BHK in Edappally, modern minimal.'],
      ['Liji Thomas', 'Apartment', 'Decor only', '₹1–2 lakh', 'Planters for a large balcony.'],
      ['Vivek Nair', 'Villa', 'Full interiors', '₹15 lakh+', 'New build in Aluva, open to ideas.'],
      ['Tessa Kurian', 'Apartment', 'Styling', '₹1–2 lakh', 'Bedroom refresh and art wall.'],
      ['Gokul Das', 'Office', 'Full interiors', '₹8–15 lakh', 'Start-up office for 18 people.']
    ];
    const enqStatus = ['new', 'new', 'new', 'contacted', 'contacted', 'site_visit', 'quoted', 'won', 'contacted', 'quoted', 'new', 'lost', 'won', 'site_visit', 'quoted'];
    const enquiries = ENQ.map((e, i) => ({
      id: 'e' + (i + 1), name: e[0], phone: '9' + String(Math.floor(r() * 1e9)).padStart(9, '0'), email: e[0].split(' ')[0].toLowerCase() + '@gmail.com',
      property: e[1], scope: e[2], budget: e[3], date: '', message: e[4], status: enqStatus[i], note: '', at: now - (i * 9 + 1) * DAY - Math.floor(r() * DAY)
    }));

    return {
      v: 2, builtAt: now, categories, products, customers, orders, moves, enquiries, cart: [], session: null,
      settings: {
        whatsapp: '918330093360', phoneDisplay: '+91 83300 93360',
        address: 'Dè Stories, Alfa Horizon, Vallarpadam, Kochi',
        hours: 'Mon–Sat 10:30 am – 8:00 pm · Sun 12 – 7 pm (to be confirmed)',
        delivery: 'Delivery across Kerala in 3–5 days; charges confirmed on WhatsApp before dispatch. Free pickup from our Experience Store at Alfa Horizon. Pieces can be exchanged within 7 days if they arrive damaged; please share an unboxing photo on WhatsApp.',
        lowStockDefault: 3,
        admins: window.DEFAULT_ADMINS.slice()
      }
    };
  }

  window.Seed = { build };
})();
