# Vaniday n8n Appointment Chat Setup

## What this starter adds

- `frontend/chat.html`: a full-page appointment chat.
- `frontend/chat.js`: sends messages and user session details to the backend.
- `frontend/chat.css`: full-page responsive chat design.
- `backend/routes/chatRoutes.js`: safely forwards browser messages to n8n.
- Two new environment variables in `backend/.env.example`.

## Required response format from n8n

Every path in the n8n workflow should return JSON like this:

```json
{
  "reply": "Your appointment is confirmed for 2026-08-03 at 14:00.",
  "actionComplete": true,
  "guestToken": "only-return-this-for-a-guest-booking"
}
```

## Recommended n8n workflow design

Use a normal **Webhook** trigger rather than Telegram Trigger because the chat must appear inside the Vaniday website.

### Node 1 — Webhook

- Method: `POST`
- Path: `vaniday-appointment-chat`
- Response: `Using Respond to Webhook node`

Incoming data:

- `message`
- `sessionId`
- `userName`
- `userEmail`
- `guestToken`
- `authorization`
- `backendBaseUrl`

### Node 2 — Data Store: Get conversation state

Create an n8n Data Table named `vaniday_chat_sessions` with these columns:

- `sessionId`
- `step`
- `intent`
- `merchantId`
- `merchantName`
- `serviceId`
- `serviceName`
- `bookingId`
- `bookingDate`
- `bookingTime`
- `customerName`
- `customerEmail`

Get the row whose `sessionId` equals the incoming `sessionId`.

### Node 3 — Switch by current step

Suggested steps:

- `START`
- `CHOOSE_INTENT`
- `CHOOSE_MERCHANT`
- `CHOOSE_SERVICE`
- `ASK_NAME`
- `ASK_EMAIL`
- `ASK_DATE`
- `ASK_TIME`
- `CONFIRM_BOOKING`
- `CHOOSE_EXISTING_BOOKING`
- `ASK_NEW_DATE`
- `ASK_NEW_TIME`
- `CONFIRM_CANCEL`
- `CONFIRM_RESCHEDULE`

For the first message, accept `hey`, `hi`, or `hello`, save step `CHOOSE_INTENT`, and reply:

`Hey! What would you like to do: book an appointment, cancel, or reschedule?`

### Booking branch

1. Use HTTP Request: `GET {{$json.backendBaseUrl}}/api/merchants`
2. Show active merchant names with numbers.
3. Save the selected merchant ID.
4. Use HTTP Request: `GET {{$json.backendBaseUrl}}/api/services?merchant={{merchantId}}`
5. Show service names, duration, and price.
6. Ask guest users for name and email. For logged-in customers, use the supplied user details.
7. Ask date in `YYYY-MM-DD` format.
8. Ask time in `HH:MM` 24-hour format.
9. Show a final summary and ask for `confirm`.
10. HTTP Request: `POST {{$json.backendBaseUrl}}/api/bookings`

Headers:

- `Content-Type`: `application/json`
- `Authorization`: use the incoming `authorization` only when it is not empty.

JSON body:

```json
{
  "merchant": "{{$json.merchantId}}",
  "service": "{{$json.serviceId}}",
  "bookingDate": "{{$json.bookingDate}}",
  "bookingTime": "{{$json.bookingTime}}",
  "customerName": "{{$json.customerName}}",
  "customerEmail": "{{$json.customerEmail}}"
}
```

After success, return the API's `guestToken` when present. This lets `my-booking.html` show a guest's appointment.

### Cancel or reschedule branch

For a logged-in customer:

- HTTP Request: `GET {{$json.backendBaseUrl}}/api/bookings/mine`
- Header `Authorization`: incoming `authorization`

For a guest:

- HTTP Request: `GET {{$json.backendBaseUrl}}/api/bookings/guest`
- Header `X-Guest-Token`: incoming `guestToken`

Show each booking with a number and save the selected booking `_id`.

Cancel request:

- Method: `PUT`
- URL: `{{$json.backendBaseUrl}}/api/bookings/{{$json.bookingId}}/cancel`
- Use `Authorization` for customers or `X-Guest-Token` for guests.

Reschedule request:

- Method: `PUT`
- URL: `{{$json.backendBaseUrl}}/api/bookings/{{$json.bookingId}}/reschedule`
- Headers as above.
- JSON body must contain the original or selected merchant and service plus the new date and time.

### Last node — Respond to Webhook

Return:

```json
{
  "reply": "Ahh, your appointment is done! You can open My Bookings to view it.",
  "actionComplete": true,
  "guestToken": "{{$json.guestToken}}"
}
```

## Environment variables

In Render or your hosting service, add:

- `N8N_CHAT_WEBHOOK_URL`: the n8n production webhook URL.
- `PUBLIC_BACKEND_URL`: your deployed Vaniday URL.

Then redeploy the backend and activate the n8n workflow.

## Important test order

1. Open `/api/health` and confirm MongoDB says `connected`.
2. Test the n8n Webhook using its test URL.
3. Activate the workflow and copy its production URL into `N8N_CHAT_WEBHOOK_URL`.
4. Open `chat.html` and type `hey`.
5. Complete one logged-in customer booking.
6. Open `my-booking.html` and check that it appears.
7. Log in as the relevant shop owner and check the shop dashboard.
8. Repeat as a guest and confirm the guest token is saved.
9. Test cancel and reschedule.
