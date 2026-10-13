# PRD — Dè Stories Online Store & Owner Admin

| | |
|---|---|
| **Client** | Dè Stories · 360° Design Studio — Alfa Horizon, Vallarpadam, Kochi · WhatsApp 8330093360 · Instagram @de.stories.360 |
| **Document owner** | Teena (build partner) |
| **Status** | v1.0 — approved for clickable prototype (Phase 1) |
| **Date** | 13 Oct 2026 |
| **Sources** | `Documents/DE STORIES DECOR.pdf` (107-page product catalog), Instagram profile |

---

## 1. Background

Dè Stories sells curated home decor (figurines, planters, vases, spiritual pieces, wall decor and table accents) and offers interior styling through its 360° Design Studio. Today every sale happens over Instagram DM, WhatsApp or in their Experience Store in Kochi. Their Instagram bio says "Visit us/DM to Order". Their product list is a 107-page PDF.

This works at a small scale but has limits:
- Customers can't browse the whole range or see prices without messaging.
- The owner has no record of what sells, who buys or what's left in stock.
- The interior design service has nowhere to show its work or take enquiries.

## 2. Goals

| # | Goal | How we'll know (once live) |
|---|---|---|
| G1 | Customers can browse and order any product without needing a DM first | % of orders arriving via the site's cart vs plain DMs |
| G2 | Ordering stays as personal as today (WhatsApp), with no payment gateway needed at launch | Orders placed through the WhatsApp checkout |
| G3 | The owner runs the catalog themselves (products, sizes, prices, photos, categories) with no developer | New products added without help |
| G4 | The owner sees sales, best sellers, repeat customers and stock at a glance | Dashboard opened weekly |
| G5 | The interior design studio gets a proper showcase and a lead form | Consultation enquiries per month |

**Non-goals for Phase 1:** online payment (Razorpay), shipping-rate calculation, GST invoices, discount codes, customer accounts and logins, multi-language support.

## 3. Users

1. **Shopper:** usually on a phone, often coming from Instagram, based in Kerala or elsewhere in India. Wants to see the piece, its size and its price, and to order quickly.
2. **Owner / staff (admin):** manages products and stock, confirms orders on WhatsApp, and wants to know what's working.
3. **Interiors client:** a homeowner looking for styling or a full interiors job. Wants to see past work and book a consultation.

## 4. Scope by phase

| Phase | What | Tech |
|---|---|---|
| **1 · Clickable prototype (this build)** | The full shop and admin experience in the browser. Real catalog data, sample sales data, WhatsApp checkout. | Static HTML/CSS/JS. Data in the browser (localStorage). Shared as a private link. |
| 2 · Production | The same experience on a real database with email login, photo uploads and a custom domain | Next.js + Supabase (Postgres, Auth, Storage) on Vercel |
| 3 · Payments (optional) | Online UPI/card payment beside WhatsApp ordering | Razorpay |

---

## 5. Storefront requirements

### 5.1 Navigation & pages
- **Header:** logo, Shop (category menu), Design Studio, Visit Us, search, and a cart icon with an item count.
- **Home:**
  - hero with the brand line "Every Space Has a Story… Let's Design Yours"
  - shop-by-category tiles
  - "Loved right now" (best sellers)
  - a Christmas collection strip (seasonal)
  - a Design Studio teaser
  - an Experience Store block
  - an Instagram link
- **Shop:** product grid with:
  - filters for category, room, price band and collection (Gift ideas, Christmas)
  - sorting by Featured, Price low→high, Price high→low, and Newest
  - search by name
  - a result count, and a clear empty state when nothing matches
- **Category view:** the shop page with one category pre-selected.
- **Product page** (see 5.2).
- **Cart drawer and checkout** (see 5.3).
- **Design Studio** (see 5.4).
- **Visit Us:** address, hours (TBC), WhatsApp number shown as copyable text, and a directions link.

### 5.2 Product page
- Large photo. A gallery is supported, though the catalog has one photo per product today.
- Name, category, and a price that matches the selected size.
- **Size picker:** shown when a product has more than one size. Each size is a chip showing size and price (e.g. `13 in · ₹2,000`). Choosing one updates the price, the stock message and the photo if that size has its own. Sizes that are out of stock are greyed out and can't be selected. Single-size products show the size as plain text.
- **Stock message:** "In stock", "Only 2 left" (at or below the low-stock threshold) or "Out of stock". Add to cart is disabled when the product is out of stock.
- **Quantity stepper:** capped at the available stock.
- **Add to cart:** opens the cart drawer.
- **Ask about this piece:** opens WhatsApp with the product name prefilled.
- **"More details" expandable panel** with fixed fields:
  - Description
  - Material
  - Dimensions (defaults to the catalog size)
  - Weight
  - Care instructions
  - Delivery & returns (one shared text for the whole shop, set by the owner)

  Only fields with content are shown. If only the size is known, the panel still opens and shows Dimensions plus the note "More details coming soon". This leaves room for details to be added later without a redesign.
- **You may also like:** 4 products from the same category.

### 5.3 Cart & WhatsApp checkout (Option A)
- **Cart drawer:**
  - line items showing photo, name, size, unit price, quantity stepper and remove
  - subtotal
  - the note "Delivery charges confirmed on WhatsApp"
- The cart is saved in the browser across visits.
- **Checkout form:**
  - name (required)
  - WhatsApp phone (required, 10-digit Indian number)
  - email (optional)
  - delivery address, city and pincode
  - delivery or store pickup
  - notes
- **Place order on WhatsApp:**
  1. Creates an order with status **Pending** and an order number (`DS-1042`).
  2. Creates or updates the **customer record**, matched by phone.
  3. Opens WhatsApp to 918330093360 with an itemised message (order number, items, sizes, quantities, subtotal, name, address).
  4. Shows a confirmation page with the order number and the message text, plus a copy button in case WhatsApp doesn't open.
- **Stock is not reduced at this point.** It goes down when the owner confirms the order (see 6.5).
- A short note says online payment is coming soon.

### 5.4 Design Studio (360° interiors)
- An intro and the services offered (TBC with client):
  - Interior Styling
  - Full Home Interiors
  - Decor Curation & Gifting
  - Festive Styling
- **Process in 4 steps:** Consult → Concept & moodboard → Source & build → Style & handover.
- **Portfolio gallery:** placeholder cards until the client sends project photos.
- **"Book a consultation" form:**
  - name, phone and email
  - property type (Apartment / Villa / Office / Retail)
  - scope (Styling / Full interiors / Decor only)
  - budget range
  - preferred date
  - message

  Submitting creates an **Enquiry** in the admin and shows a success state.

### 5.5 Non-functional
- Mobile-first, working from 360px wide upward. Product photos load lazily.
- Look and feel follow the brand: sage/khaki, deep wood brown, serif wordmark, script accent.
- Accessible: text contrast at WCAG AA or better, visible keyboard focus, labelled form fields, alt text on photos.
- Prices are shown in ₹ with Indian number grouping (₹1,500 · ₹4,50,000).

---

## 6. Admin requirements (`Admin` area)

### 6.1 Login
- Email sign-in (magic link in production). Only emails the owner has invited get in.
- **Prototype:** only emails on the admin list can sign in. Testing admins: teena.anie9@gmail.com, tins08@gmail.com, plus owner@destories.in for the demo. "Send sign-in link" leads to a simulated "link opened" step, since no real email is sent. A session flag keeps the user signed in, and there's a sign-out button.

### 6.2 Dashboard (the landing view)
- **Range switch:** Last 7 days / 30 days / 90 days / 6 months.
- **KPI cards**, each compared with the previous period of the same length:
  - Revenue
  - Orders
  - Average order value
  - Repeat-customer rate
  - New customers
- **Charts and lists:**
  - Revenue over time (a bar per day or week, with an order-count line)
  - Revenue by category
  - Top 10 products, switchable between units and revenue
  - New vs returning customers
  - Top 5 customers by spend
- **Action lists:**
  - **Needs restocking** (low-stock and out-of-stock variants)
  - **Orders awaiting confirmation** (Pending)
  - **New studio enquiries**
- Revenue counts only orders that are Confirmed, Shipped or Delivered. Pending and Cancelled orders are left out.

### 6.3 Products
- **List:** thumbnail, name, category, price or price range, total stock, a status badge (Visible / Hidden / Low stock / Out of stock) and a Featured star. Search, filter by category and stock status, and sort.
- **Add / edit form:**
  - name, category (dropdown, including the categories the owner adds), and tags (room, collections)
  - photo: upload, held as a data URL in the prototype; main image plus extras
  - **sizes / variants:** one or more rows of size label, price, stock, SKU and an optional photo. Rows can be added and removed.
  - "More details" fields: description, material, weight, care
  - Visible and Featured switches
- Duplicate a product. Delete it after an inline confirmation.
- Changes show up in the storefront straight away.

### 6.4 Categories
- List with product counts. Add, rename, hide/show and reorder categories, and give each a cover image chosen from its products' photos.
- A category can't be deleted while it holds products; the owner moves the products to another category first.
- New categories appear in the shop menu and filters automatically.

### 6.5 Inventory
- A table of every variant: product, size, SKU, stock on hand, a low-stock threshold (default 3), and status.
- Adjust stock with **+ Restock**, **– Store sale / damage** or **Set count**, each with a reason. Every change is written to a **stock history** log (date, variant, change, reason, by).
- **Automatic changes:**
  - Confirming an order lowers stock for each line item.
  - Cancelling a confirmed or shipped order puts the stock back.
  - Both are written to the history.
- If confirming an order would take stock below zero, the admin shows a warning and lets the owner confirm anyway (the shop may have unlisted stock) or cancel.

### 6.6 Orders
- List: order number, date, customer, number of items, total, status pill, and channel (Website/WhatsApp).
- Filter by status and search.
- **Order detail:** line items, customer and address, notes, and a status timeline.
- **Actions:**
  - **Confirm** (reduces stock)
  - **Mark shipped**
  - **Mark delivered**
  - **Cancel** (restores stock if it was already reduced)
  - **Message on WhatsApp** (opens a chat with the customer)
- Status flow: Pending → Confirmed → Shipped → Delivered. Cancelled can be reached from any status before Delivered.

### 6.7 Customers
- Customers are created from checkout, matched by phone number.
- List: name, phone, city, order count, total spend, last order date, and a **Repeat** badge for 2 or more completed orders. Search and sort.
- **Detail:** contact info, every order, favourite category, and spend over time.
- Export the list as CSV. The prototype shows the CSV text with a copy button, because downloads are blocked inside the shared link.

### 6.8 Studio enquiries
- List and detail with statuses: New → Contacted → Site visit → Quoted → Won / Lost.
- Change the status and add an internal note.

### 6.9 Settings
- Store details (WhatsApp number, address, hours) and the shared Delivery & returns text.
- **Admin users:** add or remove the emails that can sign in.
- **Reset demo data** button (prototype only).

---

## 7. Data model

The prototype stores these same records in the browser; the production database uses the same structure.

```
categories       id, name, slug, sort, visible, cover_image
products         id, slug, name, category_id, tags[], images[], description, material,
                 weight, care, featured, visible, created_at
variants         id, product_id, label, size_text, price, stock, low_stock_at, sku, image
customers        id, name, phone (unique), email, city, created_at
orders           id, number, customer_id, status, channel, fulfilment (delivery|pickup),
                 address, city, pincode, notes, subtotal, created_at, confirmed_at,
                 shipped_at, delivered_at, cancelled_at
order_items      order_id, product_id, variant_id, name, label, unit_price, qty
inventory_moves  id, variant_id, delta, reason (order|cancel|restock|store_sale|adjust), ref, at
enquiries        id, name, phone, email, property, scope, budget, date, message, status, note, at
settings         whatsapp, address, hours, delivery_text, low_stock_default
```

Every product has at least one variant. Products with a single size have exactly one.

## 8. Catalog import (from the PDF)

- 106 product pages, one photo each, pulled as JPEG and resized for the web.
- **Name / size / price** taken from the page text, then sorted into 7 categories:
  - Figurines & Sculptures
  - Planters & Stands
  - Vases & Jugs
  - Spiritual & Faith
  - Wall Decor & Shelves
  - Tabletop Accents & Clocks
  - Tableware & Glass
- **Multi-size products become variants:**
  - Golden Vein deer: 13 in ₹2,000 / 10 in ₹1,500
  - Blooming Souls: 10 in ₹2,000 / 8 in ₹1,500
  - Tree Trunk Vase: 14 in ₹1,200 / 12 in ₹800
- **Grey Tripod Planter** stays a single item described as a "set of 3 (20/16/13 in)". To be confirmed by the client.
- **Duplicate names given working titles** for the prototype and flagged for the client:
  - Golden Vein (Deer Pair / Leaf)
  - Blooming Beauty (Jar / Face Planter)
  - The Dreamer (Twin Faces / Thinker)
  - Zenny (Praying / Seated)
  - Yellow Vase (page 104) kept as is
  - Page 105 fish renamed "Ceramic Angelfish"
- "Budha" corrected to "Buddha".
- Stock is not in the catalog, so the prototype sets sample stock levels.

## 9. Sample data (prototype dashboard)

Generated by a script with a fixed random seed, so it's identical on every load. Dates are counted back from today, so the dashboard always looks current.
- About 6 months of orders: about 300 orders and ₹4–5 lakh total revenue.
- About 140 customers with Kerala names and cities (Kochi-heavy). Around 30–35% are repeat buyers, and a handful have spent over ₹15k.
- Patterns:
  - weekend peaks
  - an Onam bump in late August
  - Christmas items rising in October
  - a long tail, where a few products sell far more than the rest
- Status mix: the last few days mostly Pending, recent orders Confirmed/Shipped, older ones Delivered, plus about 5% Cancelled.
- 6–8 variants at low stock or out of stock. About 15 studio enquiries across all statuses.

## 10. Prototype acceptance criteria

1. Every catalog product appears with its correct photo, name, size and price. Spot-check 10 against the PDF.
2. Filters, sorting and search work together. The empty state shows when nothing matches.
3. On a multi-size product, changing the size updates the price. An out-of-stock size can't be selected.
4. "More details" opens on every product and shows only the fields that have content.
5. The cart is kept after a page reload. Quantity is capped at stock.
6. Placing an order:
   - writes a correct, readable WhatsApp message
   - creates a Pending order and a customer record
   - shows the confirmation page
7. **In the admin:**
   - confirming that order lowers stock and adds a stock-history entry
   - the dashboard and customer figures update
   - cancelling puts the stock back
8. A product added in the admin, with a new category and 2 sizes, appears in the shop with a working size picker.
9. A studio enquiry form submission appears in the admin.
10. Everything works at 375px and at desktop width, in both light and dark themes, with no horizontal scrolling.

## 11. Open questions for the client
1. Online payment from day one, or start with WhatsApp ordering?
2. Delivery area (Kochi / Kerala / all India) and delivery charges? Store pickup?
3. Is stock one-off pieces or repeatable? What are the current stock counts?
4. Correct names for the duplicate and mislabelled items. Materials, weight and a one-line description for each product.
5. Interior design: list of services, project photos, any testimonials.
6. Store hours, Google Maps link, domain name, and the email address(es) that need admin access.

## 12. Risks
- **Two systems:** WhatsApp orders mean the owner must tap Confirm in the admin, or stock and analytics drift out of date. *Mitigation:* a Pending list on the dashboard plus a reminder message in production.
- **Photo consistency:** catalog photos are lifestyle shots with varied crops. *Mitigation:* fixed-ratio cards with cover cropping. Later, a few clean cut-out shots.
- **The prototype stores data in each viewer's own browser.** Changes the client makes aren't shared with anyone else. *Mitigation:* say this clearly in the walkthrough. Phase 2 moves the data to the real database.
