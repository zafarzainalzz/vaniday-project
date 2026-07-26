# Vaniday Final Reviewed Build

This folder is ready to copy into the existing GitHub repository after the local `swathi` branch has been reset to `origin/swathi`.

Included fixes:
- QR opens the cloud booking page with `?source=qr` and bookings are stored as `QR Code`.
- Guest and registered-customer bookings use the backend API.
- Shop-owner calendar reads backend bookings for the owner's shop.
- Merchant-admin calendar is placed at the top; Platform Statistics is removed.
- Admin shop buttons open shop details.
- Final merchant service names/prices are seeded in the backend and old services are deactivated.
- Merchant-card Delete button no longer overlaps the service text.
- Desktop date/time controls and Confirm Booking handling are improved for Chrome, Edge, and Safari.
- The Confirm Booking button re-enables after a failed request so the user can retry.

Important:
- Do not upload a real `.env` file to GitHub.
- Render must have `MONGO_URI`, `JWT_SECRET`, and other required environment variables configured.
