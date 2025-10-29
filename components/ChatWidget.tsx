import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { renderMarkdown } from '../utils/rendering';
import { fileToBase64 } from '../utils/image';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { CopyIcon } from './icons/CopyIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import Loader from './Loader';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; attachment?: { data: string; mimeType: string; isImage: boolean; name: string } }[]>([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<{ data: string; mimeType: string; isImage: boolean; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setMessages([{ role: 'model', text: "Hi! I'm here to help you create something amazing. What are you working on today?" }]);
    }
  }, [isOpen, chat]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading || !chat) return;

    const userMessage = { role: 'user' as const, text: input, attachment: attachment || undefined };
    setMessages(prev => [...prev, userMessage]);
    
    const parts: Part[] = [];
    if (input.trim()) {
        parts.push({ text: input });
    }
    if (attachment) {
        parts.push({ inlineData: { data: attachment.data, mimeType: attachment.mimeType } });
    }

    setInput('');
    setAttachment(null);
    setIsLoading(true);

    try {
        // FIX: The `sendMessage` method expects a `message` property, not `parts`.
        const result = await chat.sendMessage({ message: parts });
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

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const base64Data = await fileToBase64(file);
        setAttachment({ data: base64Data, mimeType: file.type, isImage: true, name: file.name });
    } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        // For text, we'll just use the text content as a base64 string (not ideal, but works for API)
        // A better approach might be to just send text directly, but this keeps attachment handling uniform
        setAttachment({ data: btoa(textContent), mimeType: file.type, isImage: false, name: file.name });
    }
    
    if (event.target) {
        event.target.value = ''; // Reset file input
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-5 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50"
        aria-label="Open chat"
      >
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed top-20 right-6 w-[calc(100%-3rem)] sm:w-96 h-[70vh] max-h-[600px] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50">
      <header className="p-3 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
        <h3 className="font-semibold">AI Assistant</h3>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-700">
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'
                }`}
              >
                {msg.attachment?.isImage && (
                    <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} alt="user attachment" className="max-w-full h-auto rounded-t-lg" />
                )}
                 <div className="prose prose-invert prose-sm max-w-none p-2" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}></div>
              </div>
               {msg.role === 'model' && (
                  <button 
                    onClick={() => handleCopy(msg.text, index)}
                    className="mt-1.5 p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"
                    title="Copy text"
                  >
                      <CopyIcon className={`w-4 h-4 transition-colors ${copiedIndex === index ? 'text-green-400' : ''}`} />
                  </button>
                )}
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="p-2 bg-slate-700 rounded-lg"><Loader /></div></div>}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-3 border-t border-slate-700 flex-shrink-0">
        {attachment && (
            <div className="mb-2 p-2 bg-slate-700 rounded-md flex items-center justify-between text-sm">
                <span className="truncate">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="p-1 rounded-full hover:bg-slate-600">
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="relative">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="w-full bg-slate-700 p-2 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, text/plain" />
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Attach file"
            >
                <PaperclipIcon />
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget;