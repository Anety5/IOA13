
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { renderMarkdown } from '../../utils/rendering';
import Loader from '../Loader';

const ChatView: React.FC = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const newChat = ai.chats.create({ model: 'gemini-2.5-flash' });
        setChat(newChat);
        setMessages([{ role: 'model', text: "Hello! How can I help you today?" }]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage = { role: 'user' as const, text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // FIX: The `sendMessage` method expects an object with a `message` property.
            const result = await chat.sendMessage({ message: currentInput });
            const modelMessage = { role: 'model' as const, text: result.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = { role: 'model' as const, text: 'Sorry, an error occurred.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Chat</h1>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-800 rounded-lg mb-4">
                <div className="flex flex-col gap-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}></div>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="p-3 bg-slate-700 rounded-lg"><Loader /></div></div>}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <form onSubmit={handleSendMessage} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full bg-slate-700 p-3 pr-24 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="absolute top-1/2 right-2 -translate-y-1/2 px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatView;
