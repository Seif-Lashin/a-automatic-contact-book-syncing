# Plan: QR-Ordering & Smart Bill-Splitting App

## Goal
Build a mobile-first, responsive web app for dine-in restaurants and multi-vendor food courts that lets customers scan a table QR, verify their location, browse a smart menu, order to the kitchen, split the bill, and leave verified reviews. Restaurant owners get a KDS + analytics dashboard.

## Technical Foundation
- **Frontend**: TanStack Start (web, mobile-first responsive), Tailwind CSS v4, shadcn/ui components.
- **Backend**: Lovable Cloud (Supabase) — PostgreSQL database, auth, real-time subscriptions, server functions.
- **Real-time**: Supabase Realtime for table cart/order sync and KDS status updates.
- **Location**: Browser Geolocation API + server-side proximity check (≤50 m).
- **Payments**: Start with Lovable built-in payments (Stripe/Paddle) for checkout; add Paymob/InstaPay/Vodafone Cash/Apple Pay integration via secure secrets once the core split flow is solid.
- **QR Scanning**: Web-based QR scanner via `html5-qrcode` or similar (camera access in PWA-capable browser).

## Phase 0 — Foundation
1. Enable Lovable Cloud on the project.
2. Create the Supabase database schema (migrations):
   - `profiles` (user_id, display_name, phone, dietary_preferences, allergies, role, avatar)
   - `user_roles` (customer, waiter, kds, owner, vendor) with `has_role` security definer
   - `restaurants` (name, coordinates, tax_rate, service_charge, settings)
   - `vendors` (restaurant_id, name, payout_settings)
   - `tables` (restaurant_id, vendor_id optional, qr_code, capacity)
   - `menu_categories`, `menu_items` (vendor_id, price, allergens, dietary_tags, popularity_score)
   - `table_sessions` (table_id, status, active_users, total_due, split_mode)
   - `orders` (session_id, user_id, vendor_id, status, created_at, confirmed_at)
   - `order_items` (order_id, menu_item_id, quantity, price_snapshot, claimed_by, status)
   - `payments` (session_id, user_id, amount, tip, charity_roundup, method, status)
   - `reviews` (user_id, menu_item_id, order_id, rating, text/video_url, points_awarded)
   - `friendships` (requester_id, addressee_id, status)
   - `loyalty_points` (user_id, restaurant_id, points, redeemed)
   - `saved_groups` (user_id, name, members, default_split_mode)
3. Set up RLS policies, GRANT statements, and a `profiles` auto-create trigger on signup.
4. Configure auth with email/password + Google; seed demo restaurant, vendor, menu, and table data.
5. Establish base routes and navigation:
   - `/` public landing
   - `/auth` sign-in/sign-up
   - `/_authenticated/*` protected customer area
   - `/_authenticated/scan` QR scanner
   - `/_authenticated/session/$sessionId` table session
   - `/_authenticated/menu/$vendorId` menu
   - `/_authenticated/checkout` split + payment
   - `/_authenticated/review` verified reviews
   - `/owner/*` owner dashboard (role-gated)
   - `/kds/*` kitchen display screen
   - `/waiter/*` waiter call + table management

## Phase 1 — Table Session & Ordering
1. Implement QR scanner route that extracts table/session identifier from the QR payload.
2. Validate device GPS against restaurant coordinates server-side (50 m proximity lock; spoof/disabled/failure fallback to manual waiter check-in).
3. Create/join a `table_sessions` row; show active session members and session status.
4. Menu browsing: vendor-aware menu with categories, item details, dietary/allergy warnings, "Best Seller" / "Hot" badges.
5. Cart: add/remove items, quantity, special instructions; sync cart state across devices at the same table via Realtime.
6. Order submission: create `orders` and `order_items`; broadcast to KDS.
7. Edit/cancel rules enforced server-side: allowed only while `status` is not `confirmed`.
8. "Call Waiter" button sends a Realtime notification to `/waiter` views.

## Phase 2 — KDS & Order Lifecycle
1. Build `/kds` screen: incoming orders grouped by vendor, status color coding (Pending = yellow, Confirmed = green, Cancelled = red).
2. Kitchen actions: Confirm, Reject, Ready; update order status and broadcast to customers.
3. Waiter view: table map, session list, call-waiter notifications, manual check-in override.
4. Order status history for customers (pending → confirmed → ready → served).

## Phase 3 — Smart Bill Split & Payment
1. On session close, compute total bill + tax + service charge, split proportionally by default.
2. Checkout screen: toggle between itemized and equal split; highlight unclaimed items; show per-person subtotal, tax, tip, charity round-up.
3. Concurrency: optimistic claim/pay flow; first payer wins, second sees "Dish already claimed" or "share already paid".
4. Payment integration: collect payment method, process via chosen gateway; handle partial payment fall-off (session stays open until balance is zero).
5. Round-up charity option stored on `payments`.
6. Fractional currency handling: store amounts as integer minor units (e.g. piasters) and resolve rounding remainder to the last payer or payer of largest share.

## Phase 4 — Verified Reviews & Loyalty
1. Review eligibility: only items linked to completed, paid orders (`review_lock` enforced server-side).
2. Review form: text + optional video URL; attach to specific menu item and order.
3. Points accrual on approved review; points are restaurant-specific and redeemable only at that restaurant.
4. Loyalty dashboard: visit streaks, milestones, badges, referral bonuses.
5. Referral flow: invite link during session; when new user joins and completes first order, both get bonus points.

## Phase 5 — Group & Social Utilities
1. Friend management: send/accept requests, view friend list.
2. "Popular With Your Friends" menu section using friends' verified ratings.
3. Saved groups: name, member list, default split mode; preload at session start.
4. Gift a Meal: send a prepaid amount/full bill to a friend via credit applied to their session share.

## Phase 6 — Multi-Vendor, Owner Dashboard & Analytics
1. Multi-vendor table: scan QR, aggregate menus from all vendors in the food court, route orders to the right vendor, split payments per vendor.
2. Owner dashboard: peak-time heatmap, top-reviewed dishes, conversion from verified reviews, revenue per vendor, tax/service summary.
3. Vendor-specific sub-dashboards for vendor managers.
4. RBAC: use `user_roles` table and `has_role` for owner, vendor, waiter, kds, customer access.

## Phase 7 — Polish, Reliability & Accessibility
1. PWA basics: manifest, install prompt, camera permission UX.
2. Offline resilience: queue critical actions, retry on reconnect, idempotency keys to prevent duplicate orders/payments.
3. Accessibility: high-contrast allergy badges, dynamic text sizing support, focus management, ARIA labels.
4. Error handling: location failure fallback, split payment fall-off UI, payment retry flow, graceful session recovery when a phone dies (others can cover the split).
5. Testing: Postman/curl collection for payment flows, location edge cases, and order edit locks.

## Deliverables
- Responsive web app (customer + KDS + waiter + owner views)
- Supabase schema migrations and seed data
- Server functions for business logic and validation
- Real-time sync layer for cart, orders, and KDS
- Payment checkout with split logic and partial-payment fall-off
- Verified review and loyalty system
- Owner analytics dashboard
- Postman/curl collection for key flows

## Next Step
Approve this plan to start Phase 0 (enable Lovable Cloud and build the database schema).