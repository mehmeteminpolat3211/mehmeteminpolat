async function sendTelegramMessage(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        throw new Error("BOT_TOKEN veya CHAT_ID eksik.");
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message
        })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
        console.error("Telegram API hatası:", result);
        throw new Error(result.description || "Telegram API hatası");
    }

    return true;
}

module.exports = { sendTelegramMessage };