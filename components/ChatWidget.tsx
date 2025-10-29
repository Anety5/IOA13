import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { renderMarkdown } from '../utils/rendering';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import Loader from './Loader';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chat) {
        if (!process.env.API_KEY) {
            console.error("API_KEY is not set for ChatWidget.");
            return;
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'You are a helpful assistant in a web development productivity app called IOAI Studio.',
            }
        });
        setChat(newChat);
        setMessages([{ role: 'model', text: 'Hello! How can I help you today?' }]);
    }
  }, [isOpen, chat]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const userMessage = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const result = await chat.sendMessage({ message: input });
        const modelMessage = { role: 'model' as const, text: result.text };
        setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage = { role: 'model' as const, text: 'Sorry, I encountered an error. Please try again.' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50"
        aria-label="Open chat"
      >
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[calc(100%-3rem)] sm:w-96 h-[60vh] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50">
      <header className="p-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold">IOAI Assistant</h3>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-700">
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-2 rounded-lg ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'
                }`}
              >
                 <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}></div>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="p-2 bg-slate-700 rounded-lg"><Loader /></div></div>}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="w-full bg-slate-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoading}
        />
      </form>
    </div>
  );
};

export default ChatWidget;
