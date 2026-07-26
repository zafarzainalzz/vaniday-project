# Run the Vaniday project

1. Open the project folder in VS Code.
2. Open a terminal in the `backend` folder.
3. Copy `.env.example` to a new file named `.env`.
4. Put your private `MONGO_URI` and `JWT_SECRET` into `backend/.env`.
5. Run `npm install` once after extracting this final ZIP.
6. Run `npm start`.
7. Keep the terminal open and visit `http://localhost:5000`.

For the Tele Assistant workflow, also place the production n8n webhook URL in `N8N_CHAT_WEBHOOK_URL`.
