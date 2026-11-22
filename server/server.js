const path = require("path");

// ENV DOSYASI
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");

const { sendTelegramMessage } = require("./telegram");

const app = express();
const PORT = process.env.PORT || 3000;

// TELEGRAM AYAR KONTROLÜ
console.log("BOT TOKEN:", !!process.env.TELEGRAM_BOT_TOKEN);
console.log("CHAT ID:", !!process.env.TELEGRAM_CHAT_ID);

// DATA KLASÖRÜ
const dataDirectory = path.join(__dirname, "../data");
const messagesFile = path.join(dataDirectory, "messages.json");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

if (!fs.existsSync(messagesFile)) {
    fs.writeFileSync(messagesFile, "[]", "utf8");
}

// GÜVENLİK
app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({
    extended: false,
    limit: "10kb"
}));

// WEB SİTESİ
app.use(express.static(path.join(__dirname, "../"), {
    dotfiles: "deny",
    index: "index.html"
}));


// ÖZEL KLASÖRLERİ DIŞARIYA KAPAT
app.use((req, res, next) => {
    const blocked = ["/server", "/data", "/node_modules"];

    if (blocked.some(folder =>
        req.path === folder || req.path.startsWith(folder + "/")
    )) {
        return res.sendStatus(404);
    }

    next();
});


// İLETİŞİM SINIRLANDIRMASI
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false
});

// İLETİŞİM FORMU
app.post("/api/contact", contactLimiter, async (req, res) => {
    try {
        const { name, email, phone, message, website } = req.body;

        if (website) {
            return res.json({
                success: true,
                message: "Mesajınız alındı."
            });
        }

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phone !== "string" ||
            typeof message !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Geçersiz form bilgileri."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim();
        const cleanPhone = phone.trim();
        const cleanMessage = message.trim();

        if (
            cleanName.length < 2 ||
            cleanName.length > 80 ||
            cleanEmail.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
            cleanPhone.length > 30 ||
            cleanMessage.length < 5 ||
            cleanMessage.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Lütfen bilgileri kontrol edin."
            });
        }

        // MESAJI KAYDET
        const messages = JSON.parse(
            fs.readFileSync(messagesFile, "utf8")
        );

        const newMessage = {
            id: Date.now(),
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            message: cleanMessage,
            date: new Date().toISOString()
        };

        messages.push(newMessage);

        fs.writeFileSync(
            messagesFile,
            JSON.stringify(messages, null, 2),
            "utf8"
        );

        // TELEGRAM
        const telegramText = [
            "📩 YENİ İLETİŞİM MESAJI",
            "",
            `👤 Ad: ${cleanName}`,
            `📧 E-posta: ${cleanEmail}`,
            `📱 Telefon: ${cleanPhone || "Belirtilmedi"}`,
            "",
            "💬 Mesaj:",
            cleanMessage
        ].join("\n");

        await sendTelegramMessage(telegramText);

        return res.json({
            success: true,
            message: "Mesajınız başarıyla gönderildi."
        });

    } catch (error) {
        console.error("HATA DETAYI:", error);

        return res.status(500).json({
            success: false,
            message: "Telegram hatası: " + error.message
        });
    }
});

// SUNUCU KONTROLÜ
app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        website: "Mehmet Emin Polat"
    });
});

// SUNUCUYU BAŞLAT
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Web sitesi aktif: ${PORT}`);
});
