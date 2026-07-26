var appointmentChatSessionId = localStorage.getItem('vanidayChatSessionId');

if (appointmentChatSessionId == null || appointmentChatSessionId == '') {
    appointmentChatSessionId = 'chat-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    localStorage.setItem('vanidayChatSessionId', appointmentChatSessionId);
}

function addAppointmentChatBubble(text, sender, className) {
    var messages = document.getElementById('appointmentChatMessages');
    var bubble = document.createElement('div');

    bubble.className = 'chat-bubble ' + sender;

    if (className) {
        bubble.className = bubble.className + ' ' + className;
    }

    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
}

function saveGuestTokenFromChat(result) {
    if (result.guestToken) {
        localStorage.setItem('vanidayGuestToken', result.guestToken);
    }
}

function sendAppointmentChat(event) {
    event.preventDefault();

    var input = document.getElementById('appointmentChatInput');
    var sendButton = document.getElementById('appointmentChatSend');
    var message = input.value.trim();

    if (message == '') {
        return;
    }

    addAppointmentChatBubble(message, 'user', '');
    input.value = '';
    sendButton.disabled = true;

    fetch('/api/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            message: message,
            sessionId: appointmentChatSessionId,
            userName: localStorage.getItem('vanidayName') || '',
            userEmail: localStorage.getItem('vanidayEmail') || '',
            guestToken: localStorage.getItem('vanidayGuestToken') || ''
        })
    })
    .then(function (response) {
        return response.json().then(function (data) {
            return { ok: response.ok, data: data };
        });
    })
    .then(function (result) {
        if (!result.ok) {
            throw new Error(result.data.message || 'Chat request failed.');
        }

        saveGuestTokenFromChat(result.data);

        var assistantReply = result.data.reply || result.data.message || '';

        if (assistantReply == '') {
            throw new Error('The assistant returned an empty reply. Check the latest n8n execution and the Respond to Webhook node.');
        }

        addAppointmentChatBubble(assistantReply, 'assistant', '');

        if (result.data.actionComplete) {
            var quickActions = document.getElementById('chatQuickActions');
            quickActions.style.display = 'flex';
        }
    })
    .catch(function (error) {
        addAppointmentChatBubble(error.message, 'assistant', 'error');
    })
    .finally(function () {
        sendButton.disabled = false;
        input.focus();
    });
}

function sendQuickChatMessage(message) {
    var input = document.getElementById('appointmentChatInput');
    input.value = message;
    document.querySelector('.chat-input-row').requestSubmit();
}

function resetAppointmentChat() {
    localStorage.removeItem('vanidayChatSessionId');
    appointmentChatSessionId = 'chat-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    localStorage.setItem('vanidayChatSessionId', appointmentChatSessionId);

    var messages = document.getElementById('appointmentChatMessages');
    messages.innerHTML = '';
    addAppointmentChatBubble('Hey! I can help you book, cancel, or reschedule an appointment. What would you like to do?', 'assistant', '');
}

var teleAssistantAllowed = protectPublicBookingPage();

if (teleAssistantAllowed) {
    resetAppointmentChat();
}
