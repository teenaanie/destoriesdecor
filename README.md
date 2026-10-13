# Dè Stories — clickable prototype

A clickable prototype of the online store and owner admin for **Dè Stories · 360° Design Studio** (Kochi).
The requirements are in [PRD.md](PRD.md).

- **Customer site:** browse 106 catalog products with filters, pick a size (the price updates), add to cart, and check out on WhatsApp.
- **Owner admin** (`#admin`): sign in by email (mock), then use the dashboard, orders, products, categories, inventory, customers, studio enquiries and settings.
- Data lives in the visitor's browser (localStorage) and is seeded with about 6 months of sample sales. Settings → *Reset demo data* restores it.

## Run locally
```bash
python3 -m http.server 5178 --directory prototype
```

## Structure
```
prototype/
  index.html, app.css
  data/catalog.js   products extracted from the catalog PDF
  js/store.js       data store, stock and analytics
  js/seed.js        sample orders, customers and enquiries
  js/shop.js        storefront views
  js/admin.js       admin views
  js/main.js        router
  assets/p/         product photos
```
Phase 2 moves this onto Next.js + Supabase (see PRD §7).
