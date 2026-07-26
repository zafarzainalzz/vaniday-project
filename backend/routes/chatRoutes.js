const express = require("express");

const router = express.Router();

// POST /api/chat
// The browser calls this route. The backend forwards the message to n8n,
// keeping the n8n webhook URL out of the frontend source code.
router.post("/", async function (req, res) {
    try {
        var webhookUrl = String(process.env.N8N_CHAT_WEBHOOK_URL || "").trim();

        if (!webhookUrl) {
            return res.status(503).json({
                message: "Chat is not configured. Add N8N_CHAT_WEBHOOK_URL to the backend environment."
            });
        }

        var payload = {
            message: String(req.body.message || "").trim(),
            sessionId: String(req.body.sessionId || "").trim(),
            userName: String(req.body.userName || "").trim(),
            userEmail: String(req.body.userEmail || "").trim(),
            guestToken: String(req.body.guestToken || "").trim(),
            authorization: String(req.headers.authorization || "").trim(),
            backendBaseUrl: String(process.env.PUBLIC_BACKEND_URL || (req.protocol + "://" + req.get("host"))).replace(/\/$/, "")
        };

        if (!payload.message) {
            return res.status(400).json({ message: "Message is required." });
        }

        var response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        var text = await response.text();
        var result;

        try {
            result = JSON.parse(text);
        } catch (parseError) {
            result = { reply: text };
        }

        // Some workflow responses can arrive wrapped in an array or a body property.
        if (Array.isArray(result)) {
            result = result.length > 0 ? result[0] : {};
        }

        if (result && result.body && typeof result.body === "object") {
            result = result.body;
        }

        if (!response.ok) {
            return res.status(response.status).json({
                message: result.message || result.reply || text || "The chat workflow returned an error."
            });
        }

        if (!result || (!result.reply && !result.message)) {
            console.error("n8n returned an empty chat response:", text);
            return res.status(502).json({
                message: "The assistant workflow returned no reply. Open the latest n8n execution and check its Respond to Webhook node."
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to contact the appointment assistant." });
    }
});

module.exports = router;
