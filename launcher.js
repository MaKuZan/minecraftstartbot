const mineflayer = require('mineflayer');

function log(message) {
    const logDiv = document.getElementById('log');
    logDiv.innerHTML += `${new Date().toLocaleTimeString()} - ${message}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

function startBots() {
    const ip = document.getElementById('ip').value;
    const port = parseInt(document.getElementById('port').value);
    const version = document.getElementById('version').value;
    const botCount = parseInt(document.getElementById('botCount').value);

    if (!ip || !port || !version || !botCount) {
        log('Ошибка: Заполните все поля!');
        return;
    }

    if (botCount > 100) {
        log('Ошибка: Максимум 100 ботов!');
        return;
    }

    log(`Запускаю ${botCount} ботов на ${ip}:${port} (версия ${version})...`);

    for (let i = 0; i < botCount; i++) {
        createBot(ip, port, version, i);
    }
}

function createBot(ip, port, version, index) {
    const bot = mineflayer.createBot({
        host: ip,
        port: port,
        version: version,
        username: `WBosdOsdT_${index}` // Уникальное имя для каждого бота
    });

    bot.on('login', () => {
        log(`Бот ${bot.username} подключился к серверу`);
    });

    bot.on('error', (err) => {
        log(`Ошибка у ${bot.username}: ${err.message}`);
    });

    bot.on('end', () => {
        log(`Бот ${bot.username} отключился`);
    });

    // Опционально: можно добавить простую логику для ботов
    bot.on('spawn', () => {
        bot.chat('Я бот, привет!');
    });
}