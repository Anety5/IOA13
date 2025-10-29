
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { renderMarkdown } from '../utils/rendering';
import { fileToBase64 } from '../utils/image';
import { generateChatSuggestions } from '../services/geminiService';
import { CloseIcon } from './icons/CloseIcon';
import { CopyIcon } from './icons/CopyIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import Loader from './Loader';

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    viewContext: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose, viewContext }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; attachment?: { data: string; mimeType: string; isImage: boolean; name: string } }[]>([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<{ data: string; mimeType: string; isImage: boolean; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);


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
                systemInstruction: 'You are a helpful assistant in a creative productivity app called IOAI Studio.',
            }
        });
        setChat(newChat);
        setMessages([{ role: 'model', text: "Hi! Let's create something amazing today..." }]);
    }
  }, [isOpen, chat]);
  
  const getSuggestions = useCallback(async (context: string) => {
    if (!context.trim() || !isOpen) {
        setSuggestions([]);
        return;
    }
    try {
        const response = await generateChatSuggestions(context);
        const parsedSuggestions = JSON.parse(response.text);
        if (Array.isArray(parsedSuggestions)) {
            setSuggestions(parsedSuggestions.slice(0, 3));
        }
    } catch (error) {
        console.error("Failed to get chat suggestions:", error);
        setSuggestions([]);
    }
  }, [isOpen]);

  useEffect(() => {
      if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
          getSuggestions(viewContext);
      }, 1000); // 1-second debounce

      return () => {
          if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
          }
      };
  }, [viewContext, getSuggestions]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string, messageAttachment?: typeof attachment) => {
    if ((!messageText.trim() && !messageAttachment) || isLoading || !chat) return;

    const userMessage = { role: 'user' as const, text: messageText, attachment: messageAttachment || undefined };
    setMessages(prev => [...prev, userMessage]);
    
    const parts: Part[] = [];
    if (messageText.trim()) {
        parts.push({ text: messageText });
    }
    if (messageAttachment) {
        parts.push({ inlineData: { data: messageAttachment.data, mimeType: messageAttachment.mimeType } });
    }

    setInput('');
    setAttachment(null);
    setIsLoading(true);
    setSuggestions([]);

    try {
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
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input, attachment);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
      setInput(suggestion);
      // We could also send immediately: sendMessage(suggestion);
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
        setInput(prev => prev ? `${prev}\n\n--- ${file.name} ---\n${textContent}` : textContent);
    }
    
    if (event.target) {
        event.target.value = ''; // Reset file input
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose}></div>
    <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-800 border-l border-slate-700 shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-in-out" style={{transform: isOpen ? 'translateX(0)' : 'translateX(100%)'}}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
            <h3 className="font-semibold text-lg">AI Assistant</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
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
                {msg.role === 'model' && msg.text && (
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
        {suggestions.length > 0 && !isLoading && (
            <div className="p-3 border-t border-slate-700 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSuggestionClick(s)}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 hover:text-white transition-colors"
                    >{s}</button>
                ))}
            </div>
        )}
        <div className="p-3 border-t border-slate-700 flex-shrink-0">
            {attachment && (
                <div className="mb-2 p-2 bg-slate-700 rounded-md flex items-center justify-between text-sm">
                    <span className="truncate">{attachment.name}</span>
                    <button onClick={() => setAttachment(null)} className="p-1 rounded-full hover:bg-slate-600">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <form onSubmit={handleFormSubmit} className="relative">
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
    </>
  );
};

export default ChatWidget;
