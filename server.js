const express = require('express');
const mineflayer = require('mineflayer');
const cors = require('cors');
const app = express();

// Массив для хранения активных ботов
const activeBots = [];
// Массив для хранения сообщений чата с ID
const chatMessages = [];
let messageId = 0;

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
        chatMessages.push({ id: messageId++, text: `${bot.username}: ${message}` });
    });

    res.json({ message: `Сообщение "${message}" отправлено от ${activeBots.length} ботов` });
});

app.post('/stop-bots', (req, res) => {
    if (activeBots.length === 0) {
        return res.status(400).json({ message: 'Нет активных ботов для остановки!' });
    }

    activeBots.forEach(bot => {
        bot.quit(); // Отключаем каждого бота
    });
    activeBots.length = 0; // Очищаем массив

    console.log('Все боты остановлены');
    res.json({ message: 'Все боты остановлены' });
});

app.get('/get-chat', (req, res) => {
    const lastId = parseInt(req.query.lastId) || 0;
    const newMessages = chatMessages.filter(msg => msg.id > lastId);
    res.json({ messages: newMessages });
});

function createBot(ip, port, version, index) {
    const bot = mineflayer.createBot({
        host: ip,
        port: parseInt(port, 10),
        version: version,
        username: `Bot_${index}`
    });

    bot.on('login', () => {
        console.log(`${bot.username} подключился`);
        activeBots.push(bot);
        chatMessages.push({ id: messageId++, text: `${bot.username} подключился` });
        keepBotActive(bot); // Запускаем функцию активности
    });

    bot.on('error', (err) => {
        console.error(`${bot.username || `Bot_${index}`}: Ошибка - ${err.message}`);
        chatMessages.push({ id: messageId++, text: `${bot.username || `Bot_${index}`}: Ошибка - ${err.message}` });
    });

    bot.on('end', () => {
        console.log(`${bot.username || `Bot_${index}`} отключился`);
        chatMessages.push({ id: messageId++, text: `${bot.username || `Bot_${index}`} отключился` });
        const botIndex = activeBots.indexOf(bot);
        if (botIndex !== -1) {
            activeBots.splice(botIndex, 1);
        }
    });

    bot.on('spawn', () => {
        console.log(`${bot.username} появился на сервере`);
        chatMessages.push({ id: messageId++, text: `${bot.username} появился на сервере` });
    });

    bot.on('message', (message) => {
        const messageText = message.toString();
        console.log(`${messageText}`);
        chatMessages.push({ id: messageId++, text: messageText });
    });

    bot.on('kicked', (reason) => {
        console.log(`${bot.username} был кикнут: ${reason}`);
        chatMessages.push({ id: messageId++, text: `${bot.username} был кикнут: ${reason}` });
    });
}

// Функция для поддержания активности бота
function keepBotActive(bot) {
    setInterval(() => {
        if (bot && bot.entity) { // Проверяем, что бот активен
            const yaw = Math.random() * Math.PI * 2; // Случайный угол (0-360 градусов)
            bot.look(yaw, 0, false); // Поворачиваем только по горизонтали
            bot.setControlState('jump', true); // Прыжок
            setTimeout(() => bot.setControlState('jump', false), 500);
            console.log(`${bot.username} повернулся и прыгнул для активности`);
        }
    }, 60000); // Каждые 60 секунд (1 минута)
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});