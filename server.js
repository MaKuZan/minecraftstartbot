const express = require('express');
const mineflayer = require('mineflayer');
const cors = require('cors');
const app = express();

// Массив для хранения активных ботов
const activeBots = [];
// Множество для хранения уникальных сообщений
const seenMessages = new Set();

app.use(express.json());
app.use(cors());

app.post('/start-bots', (req, res) => {
    const { ip, port, version, botCount } = req.body;

    if (!ip || !port || !version || !botCount) {
        return res.status(400).json({ message: 'Все поля обязательны!' });
    }

    if (botCount > 100) {
        return res.status(400).json({ message: 'Максимум 100 ботов!' });
    }

    console.log(`Запускаю ${botCount} ботов на ${ip}:${port} (версия ${version})...`);

    let botIndex = 1; // Начинаем с 1
    const interval = setInterval(() => {
        if (botIndex <= botCount) {
            createBot(ip, port, version, botIndex);
            botIndex++;
        } else {
            clearInterval(interval);
        }
    }, 5000); // Задержка 5 секунд между ботами

    res.json({ message: `Запущено ${botCount} ботов` });
});

app.post('/send-chat', (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Сообщение не указано!' });
    }

    if (activeBots.length === 0) {
        return res.status(400).json({ message: 'Нет активных ботов!' });
    }

    activeBots.forEach(bot => {
        bot.chat(message);
        console.log(`${bot.username}: ${message}`);
    });

    res.json({ message: `Сообщение "${message}" отправлено от ${activeBots.length} ботов` });
});

function createBot(ip, port, version, index) {
    const bot = mineflayer.createBot({
        host: ip,
        port: port,
        version: version,
        username: `Bot_${index}` // Имя начинается с Bot_1
        // Если нужно использовать прокси, раскомментируй:
        // proxy: 'socks://username:password@proxy.example.com:1080'
    });

    bot.on('login', () => {
        console.log(`${bot.username} подключился`);
        activeBots.push(bot); // Добавляем бота в массив активных
    });

    bot.on('error', (err) => {
        console.log(`${bot.username || `Bot_${index}`}: Ошибка - ${err.message}`);
    });

    bot.on('end', () => {
        console.log(`${bot.username || `Bot_${index}`} отключился`);
        const botIndex = activeBots.indexOf(bot);
        if (botIndex !== -1) {
            activeBots.splice(botIndex, 1); // Удаляем бота из активных при отключении
        }
    });

    bot.on('spawn', () => {
        console.log(`${bot.username} появился на сервере`);
    });

    bot.on('message', (message) => {
        const messageText = message.toString();
        // Выводим сообщение только если оно еще не встречалось
        if (!seenMessages.has(messageText)) {
            console.log(`${messageText}`);
            seenMessages.add(messageText);
        }
    });
}

app.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});