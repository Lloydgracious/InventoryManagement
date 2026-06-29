# Inventory Management App Testing Manual

## Local Setup

Prerequisites:
- Node.js and npm installed.
- Project dependencies installed. This repo already has `node_modules`; if needed, run `npm install`.

Run the app:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

Production build check:

```powershell
npm run build
```

Important test note: this is a client-side demo app. Data is stored in React state only and resets after browser refresh. The in-app transaction date is fixed at `2026-06-08`.

## Initial Test Data

Initial products:
- Wireless Mouse: total 120, sold 34, remaining 86, sell 18, cost 11.
- USB-C Cable: total 260, sold 81, remaining 179, sell 7, cost 4.
- Laptop Stand: total 75, sold 19, remaining 56, sell 32, cost 21.
- Desk Organizer: total 90, sold 22, remaining 68, sell 14, cost 8.

Initial sold transactions:
- Wireless Mouse: 12 sold on `2026-06-03`, profit 84.
- USB-C Cable: 25 sold on `2026-06-05`, profit 75.
- Desk Organizer: 8 sold on `2026-06-07`, profit 48.

Expected initial dashboard:
- Total Products: 4.
- Stock On Hand: 389.
- Items Sold: 45.
- Gross Profit: 207.
- Net Profit: 207.
- Monthly Revenue: 503.
- Monthly Units Sold: 45.
- Monthly Transactions: 3.
- Monthly Profit: 207.

## Smoke Test

1. Open `http://127.0.0.1:5173/`.
2. Confirm the sidebar shows Dashboard, Inventory, Sold Items, Cancelled Items, and Monthly Report.
3. Confirm the default page is Dashboard.
4. Click each sidebar item.
5. Expected: each page loads with a short loading overlay, no blank screen, no console-blocking error, and the page heading changes.
6. Refresh the browser.
7. Expected: app returns to the initial Dashboard state.

## Dashboard Tests

1. Check the metric cards.
2. Expected initial values match the "Initial Test Data" section.
3. Check Monthly Revenue.
4. Expected: revenue is 503, units sold is 45, transactions is 3, average sale is 168, profit is 207.
5. Check the monthly revenue rows.
6. Expected: Wireless Mouse, USB-C Cable, and Desk Organizer appear with their June 2026 sale dates.

After recording a sale:
1. Go to Inventory.
2. Record a sale for Laptop Stand with quantity 2.
3. Return to Dashboard.
4. Expected: Items Sold increases by 2, Gross Profit increases by 22, Net Profit increases by 22, Monthly Revenue increases by 64, and Monthly Transactions increases by 1.

After cancelling a sale:
1. Go to Sold Items.
2. Cancel 1 unit from a sold transaction.
3. Return to Dashboard.
4. Expected: Items Sold decreases by 1, cancelled stock increases by 1, Gross Profit decreases based on the remaining sold quantity, Cancelled Impact increases, and Net Profit reflects active profit minus cancelled impact.

## Inventory Tests

### View Inventory

1. Open Inventory.
2. Expected: four product cards are visible.
3. Check each card has product image/fallback, name, selling price, cost, profit, total quantity, sold quantity, remaining quantity, and action buttons.
4. Expected: Sell Item is enabled while remaining quantity is greater than 0.

### Edit Product

1. Click a product card or the edit icon.
2. Expected: Edit Product modal opens.
3. Change Product Name, Total Quantity, Sold Quantity, Selling Price, Cost Price, and optional Unit.
4. Click Save.
5. Expected: modal closes and the product card reflects the new values.
6. Reopen the product.
7. Clear Product Name.
8. Expected: Save is disabled.
9. Set Sold Quantity higher than Total Quantity and save.
10. Expected: saved sold quantity is capped at total quantity.
11. Enter negative values for quantities or prices and save.
12. Expected: saved numeric values are clamped to 0.

### Product Image Upload

1. Open Edit Product.
2. Click Upload Product Image.
3. Select a local image file.
4. Expected: preview updates.
5. Click Save.
6. Expected: product card uses the uploaded image.
7. Reopen Edit Product and click Remove Image.
8. Expected: fallback image icon is shown.

### Record Sale

1. Open Inventory.
2. Click Sell Item on Wireless Mouse.
3. Expected: Sell Item modal opens with product name, remaining quantity, selling price, cost price, estimated profit, and notes.
4. Enter quantity 1 and notes.
5. Click Record Sale.
6. Expected: modal closes, remaining quantity decreases by 1, sold quantity increases by 1, and a new sold row appears on Sold Items with date `2026-06-08`.
7. Try entering 0.
8. Expected: Record Sale is disabled.
9. Try entering more than the remaining quantity.
10. Expected: Record Sale is disabled.

## Sold Items Tests

### View Sold Items

1. Open Sold Items.
2. Expected: table shows Product, Quantity, Sale Price, Cost Price, Profit, Date, Notes, and Actions.
3. Confirm initial rows for Wireless Mouse, USB-C Cable, and Desk Organizer.

### Cancel Sold Quantity

1. Click Cancel Quantity on a sold row.
2. Expected: Cancel Sold Transaction modal opens.
3. Enter quantity 1 and a cancellation reason.
4. Click Cancel Quantity.
5. Expected: modal closes, sold row quantity decreases by 1, and a cancelled item appears in Cancelled Items.
6. If cancelling the full sold quantity, expected: the sold row is removed.
7. Try quantity 0.
8. Expected: Cancel Quantity is disabled.
9. Try quantity greater than the sold row quantity.
10. Expected: Cancel Quantity is disabled.

## Cancelled Items Tests

### Empty State

1. Refresh the app.
2. Open Cancelled Items.
3. Expected: empty state message says no cancelled items have been recorded yet.

### View Cancelled Items

1. Cancel any sold quantity from Sold Items.
2. Open Cancelled Items.
3. Expected: a cancelled item card appears with product name, cancelled quantity, cancellation date `2026-06-08`, reversed profit, notes, edit action, and Add to Inventory action.

### Edit Cancelled Item

1. Click a cancelled item card or its edit icon.
2. Expected: Edit Cancelled Item modal opens.
3. Change product name, quantity, selling price, cost price, unit, cancellation date, and notes.
4. Click Save.
5. Expected: card updates.
6. Clear Product Name.
7. Expected: Save is disabled.
8. Enter negative quantity or prices and save.
9. Expected: saved numeric values are clamped to 0.

### Add Cancelled Item Back To Inventory

1. Open Cancelled Items.
2. Click Add to Inventory.
3. Expected: modal opens with available cancelled units and cost.
4. Enter quantity 1 and a selling price.
5. Click Add to Inventory.
6. Expected for an existing product: cancelled quantity decreases by 1, product sold quantity decreases by 1, and product price/cost/unit/image update from the cancelled item.
7. Expected when all cancelled quantity is added back: cancelled item disappears.
8. Try quantity 0.
9. Expected: Add to Inventory is disabled.
10. Try quantity greater than available cancelled quantity.
11. Expected: Add to Inventory is disabled.

## Monthly Report Tests

### June 2026 Initial Report

1. Open Monthly Report.
2. Confirm Selected month is `2026-06`.
3. Expected metrics:
   - Products Added: 3.
   - Products Sold: 45.
   - Remaining Stock: 389.
   - Cancelled Quantity: 0.
   - Revenue: 503.
   - Cost: 296.
   - Gross Profit: 207.
   - Cancelled Impact: 0.
   - Net Profit: 207.
4. Products Added should include Wireless Mouse, USB-C Cable, and Desk Organizer.
5. Products Sold should include the three initial sold rows.
6. Cancelled Profit Impact should show the empty state.

### May 2026 Report

1. Change Selected month to `2026-05`.
2. Expected: Products Added is 1 because Laptop Stand was added on `2026-05-18`.
3. Expected: Products Sold, Revenue, Cost, Gross Profit, Cancelled Impact, and Net Profit are 0.

### Report After New Sale

1. Record a new sale from Inventory.
2. Open Monthly Report and select `2026-06`.
3. Expected: Products Sold, Revenue, Cost, Gross Profit, and Net Profit include the new sale dated `2026-06-08`.

### Report After Cancellation

1. Cancel a sold quantity.
2. Open Monthly Report and select `2026-06`.
3. Expected: Cancelled Quantity and Cancelled Impact increase, and Net Profit decreases by the reversed profit.

## Navigation And Loading Tests

1. Click quickly between pages.
2. Expected: the loading spinner appears briefly and disappears.
3. Expected: active sidebar state follows the current page.
4. Expected: no modal remains open after normal save/cancel actions.

## Search And Notification Controls

1. Type in the top search input.
2. Expected: input accepts text.
3. Note: search currently has no filtering behavior.
4. Click the notification icon.
5. Note: notification icon currently has no action.

## Responsive Layout Tests

Test at these viewport widths:
- Desktop: 1440 x 900.
- Tablet: 768 x 1024.
- Mobile: 390 x 844.

Expected:
- Desktop uses fixed left sidebar and multi-column metrics.
- Tablet reduces metric grids to two columns.
- Mobile stacks sidebar, topbar, metrics, forms, and report rows into single-column layouts.
- Tables remain horizontally scrollable where needed.
- Modal content remains scrollable and usable.

## Refresh And State Reset

1. Make several changes: edit a product, record a sale, cancel a sale.
2. Refresh the browser.
3. Expected: all data resets to the initial demo data.

## Build Verification

1. Run `npm run build`.
2. Expected: TypeScript compiles and Vite creates `dist`.
3. Optional preview:

```powershell
npm run preview -- --host 127.0.0.1 --port 4173
```

4. Open `http://127.0.0.1:4173/`.
5. Repeat the smoke test.

## Known Limitations To Include In Test Results

- No backend persistence.
- No authentication or user roles.
- No create-new-product flow, only edit existing products and restore cancelled items.
- Search input is visual only.
- Notification button is visual only.
- Dates for new sales and cancellations are hardcoded to `2026-06-08`.
