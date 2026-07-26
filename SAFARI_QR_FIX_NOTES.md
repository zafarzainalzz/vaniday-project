# Safari and QR Update

Changes made without changing the booking, login, dashboard, marketplace, loyalty, or role flows:

- Added the working QR image as `frontend/assets/images/booking-qr.png`.
- Replaced the home-page QR placeholder with the real QR image.
- Added iPhone Safari-safe stacking for the booking background and overlay.
- Added mobile Safari layout fallbacks for the login and booking forms.
- Disabled heavy blur composition only on iOS Safari for the affected cards.
- Prevented stale HTML caching after a Render redeploy.

After pushing to GitHub, allow Render to redeploy and then fully close/reopen Safari before testing.

## QR Backend Integration

- QR now opens `booking.html?source=qr` directly instead of the home page.
- Frontend sends `bookingSource: "QR Code"` when the booking page was opened from the QR.
- Backend stores the source in MongoDB while preserving guest and logged-in customer booking flows.
- Clicking the QR image on the homepage also opens the same QR booking route.
