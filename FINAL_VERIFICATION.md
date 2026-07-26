# Vaniday Final Verification

This package was checked against the requested fixes on 26 July 2026.

- QR opens `booking.html?source=qr`.
- Booking frontend sends `bookingSource` to `POST /api/bookings`.
- MongoDB Booking schema stores `Website` or `QR Code`.
- Shop Owner calendar loads `/api/bookings/owner`, which includes guest and registered-customer bookings for the owned shop.
- Merchant Admin calendar appears above management panels.
- Platform Statistics section and its unused frontend loader were removed.
- All Shops links open the chosen shop detail page.
- The final 51 requested services and prices are seeded in MongoDB; non-approved older services are deactivated.
- Booking services are loaded from `/api/services?merchant=...`.
- Merchant-name normalization safely converts objects and strings before lowercase comparison.
- Confirm Booking has a dedicated click listener and backend error handling.
- Date/time inputs include native date/time controls and compatibility event handling for current Safari, Chrome, and Edge.
- JavaScript syntax and inline HTML scripts were checked with Node.js.
- No Git conflict markers, `.git` directory, `.env`, or `node_modules` are included.

Runtime note: MongoDB/Render integration still requires the deployment environment variables `MONGO_URI`, `JWT_SECRET`, and the appropriate `CLIENT_ORIGIN`.
