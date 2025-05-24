const express = require('express');
const http = require('http');
const {Server} = require('socket.io');

const app = express();
const server = http.createServer(app);

// SOCKET
let messages = [];
let onlineUsers = new Map();

const io = new Server(server, {
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST']
	}
});

io.on('connection', (socket) =>
{
	let connectedUsername = `User-${socket.id.slice(0, 6)}`;

	// Set user in local db
	onlineUsers.set(
		socket.id,
		{
			username: connectedUsername,
			isOnline: true
		}
	);

	// При подключении, от сервера к клиенту отправляем историю сообщений
	socket.emit('messages_history', messages.map(message => ({
		...message,
		isOnline: Array.from(onlineUsers.values()).some(user => user.username === message.username)
	})));

	updateUsersOnline();

	// Получаем сообщение и возвращаем массив
	socket.on('newMessage', (content) =>
	{
		const message = {
			username: connectedUsername,
			message: content,
			timestamp: new Date().toISOString(),
			isOnline: true
		};

		messages.push(message);
		if (messages.length > 100)
		{
			messages = messages.slice(-100);
		}

		io.emit('newChatMessage', message);
	});

	socket.on('disconnect', () =>
	{
		// Получаем имя пользователя перед удалением
		const disconnectedUser = onlineUsers.get(socket.id);
		onlineUsers.delete(socket.id);

		// Обновляем статус только для сообщений этого пользователя
		if (disconnectedUser)
		{
			messages.forEach(msg =>
			{
				if (msg.username === disconnectedUser.username)
				{
					msg.isOnline = false;
				}
			});
		}

		updateUsersOnline();
	});

	function updateUsersOnline()
	{
		// Создаем список имен онлайн пользователей для более эффективной проверки
		const onlineUsernames = new Set(
			Array.from(onlineUsers.values()).map(user => user.username)
		);

		// Обновляем историю сообщений с правильными статусами
		io.emit('messages_history', messages.map(message => ({
			...message,
			isOnline: onlineUsernames.has(message.username)
		})));

		io.emit('server_data', {
			online_count: onlineUsers.size
		});
	}
});

// START SERVER
const PORT = 3001;
server.listen(PORT, () =>
{
	console.log(`Server running on port ${PORT}`);
});