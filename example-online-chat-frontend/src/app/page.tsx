'use client';

import {useState, useEffect, useRef} from "react";
import {io, Socket} from "socket.io-client";
import {useNotices} from "@/components/ui/Notice";
import Image from 'next/image'

interface User
{
    username: string,
    message: string,
    timestamp: Date,
    isOnline: boolean
}

interface UserMessage
{
    username: string,
    message: string,
    timestamp: string,
    isOnline: boolean
}

export default function Index()
{
    const {addNotice} = useNotices();

    const [messages, setMessages] = useState<Array<User>>([]);
    const [newMessage, setNewMessage] = useState('');

    const socketRef = useRef<Socket | null>(null);
    const [serverIsConnected, setServerIsConnected] = useState(false);
    const [onlineCount, setUsersCount] = useState(0);

    useEffect(() =>
    {
        socketRef.current = io('http://localhost:3001');

        // Устанавливаем статус подключения
        socketRef.current.on('connect', () =>
        {
            setServerIsConnected(true);
        });

        socketRef.current.on('disconnect', () =>
        {
            setServerIsConnected(false);
        });

        // GET SERVER DATA
        socketRef.current.on('server_data', (data) =>
        {
            setUsersCount(data.online_count);
        });

        // SET MESSAGES HISTORY
        socketRef.current.on('messages_history', (history: Array<UserMessage>) =>
        {
            setMessages(history.map(msg => ({
                username: msg.username,
                message: msg.message,
                timestamp: new Date(msg.timestamp),
                isOnline: msg.isOnline
            })));
        })

        // HANDLE NEW MESSAGE
        socketRef.current.on('newChatMessage', (msg: UserMessage) =>
        {
            setMessages(prev => [...prev, {
                username: msg.username,
                message: msg.message,
                timestamp: new Date(msg.timestamp),
                isOnline: msg.isOnline
            }]);
        });

    }, []);

    const handleSend = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        if (!socketRef.current)
        {
            addNotice('Ошибка подключения к push-серверу', 'error');
            return;
        }

        if (!newMessage.trim()) return;

        socketRef.current.emit('newMessage', newMessage);
        setNewMessage('');
    }

    return (
        <form className="onlineChat-container" onSubmit={handleSend}>
            <div className="onlineChat-window">
                <div className="onlineChat-header">
                    <span className={`onlineChat-connectStatus ${serverIsConnected ? 'onlineChat-connectStatus--connected' : 'onlineChat-connectStatus--disconnected'}`}
                        title={serverIsConnected ? 'Подключен' : 'Отключен'}
                    ></span>
                    <span>Чат</span>
                    <span className="ul-dot"></span>
                    <span>Онлайн ({onlineCount})</span>
                </div>

                <div className="onlineChat-body">
                    <div className="onlineChat-messageContainer">
                        {messages.map((message, index) => (
                            <div key={index} className="message">
                                <span className="message-user">
                                    <span className={`ul-dotOnline ul-dotOnline--${message.isOnline ? 'online' : 'offline'}`}></span>
                                    <span className="message-username">{message.username}</span>
                                    <span className="ul-dot"></span>
                                    <span className="message-time">
                                        {message.timestamp.toLocaleTimeString()}
                                    </span>
                                </span>
                                <span className="message-content">{message.message}</span>
                            </div>
                        ))}
                    </div>

                    <div className="onlineChat-inputContainer">
                        <input
                            className="message-input"
                            name="content"
                            placeholder="Введите текст"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />

                        <button
                            type="submit"
                            className="onlineChat-sendButton"
                            disabled={!serverIsConnected}>
                            <Image
                                src="/send.svg"
                                width={24}
                                height={500}
                                alt=""
                            />
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}