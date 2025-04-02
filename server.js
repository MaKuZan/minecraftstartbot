const express = require('express');
const mineflayer = require('mineflayer');
const cors = require('cors');
const app = express();

// Массив для хранения активных ботов
const activeBots = [];
// Множество для хранения уникальных сообщений
const seenMessages = new Set();

app.use(express.json());
app.use(cors({
    origin: 'https://makuzan.github.io' // Разрешаем запросы с твоего фронтенда
}));

app.post('/start-bots', (req, res) => {
    const { ip, port, version, botCount } = req.body;

    if (!ip || !port || !version || !botCount) {
        return res.status(400).json({ message: 'Все поля обязательны!' });
    }

    if (botCount > 100) {
        return res.status(400).json({ message: 'Максимум 100 ботов!' });
    }

    console.log(`Запускаю ${botCount} ботов на ${ip}:${port} (версия ${version})...`);

    let botIndex = 1;
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
        port: parseInt(port, 10),
        version: version,
        username: `WBosdOsdT_${index}`
    });

    bot.on('login', () => {
        console.log(`${bot.username} подключился`);
        activeBots.push(bot);
        keepBotActive(bot); // Запускаем функцию активности
    });

    bot.on('error', (err) => {
        console.error(`${bot.username || `WBosdOsdT_${index}`}: Ошибка - ${err.message}`);
    });

    bot.on('end', () => {
        console.log(`${bot.username || `WBosdOsdT_${index}`} отключился`);
        const botIndex = activeBots.indexOf(bot);
        if (botIndex !== -1) {
            activeBots.splice(botIndex, 1);
        }
    });

    bot.on('spawn', () => {
        console.log(`${bot.username} появился на сервере`);
    });

    bot.on('message', (message) => {
        const messageText = message.toString();
        if (!seenMessages.has(messageText)) {
            console.log(`${messageText}`);
            seenMessages.add(messageText);
        }
    });

    bot.on('kicked', (reason) => {
        console.log(`${bot.username} был кикнут: ${reason}`);
    });
}

// Функция для поддержания активности бота
function keepBotActive(bot) {
    setInterval(() => {
        if (bot && bot.entity) { // Проверяем, что бот активен
            // Случайный поворот камеры
            const yaw = Math.random() * Math.PI * 2; // Случайный угол (0-360 градусов)
            bot.look(yaw, 0, false); // Поворачиваем только по горизонтали
            console.log(`${bot.username} повернулся для активности`);
        }
    }, 10000); // Каждые 10 секунд
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});