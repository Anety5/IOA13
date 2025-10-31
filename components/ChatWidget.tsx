
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { generateChatSuggestions } from '../services/geminiService';
import { renderMarkdown } from '../utils/rendering';
import { CloseIcon } from './icons/CloseIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import Loader from './Loader';

interface ChatWidgetProps {
  context: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ context, isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    if (!process.env.API_KEY) {
        console.error("API_KEY not set for ChatWidget");
        return;
    }
    // FIX: This file was placeholder content. Implemented a full chat widget.
    // Initialize the Gemini AI client and create a new chat session.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // FIX: Moved `systemInstruction` into a `config` object.
    const newChat = ai.chats.create({ 
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a helpful assistant for the IOAI Studio application. Be concise and helpful. The user's current context is provided with their first message."
        }
    });
    setChat(newChat);
    setMessages([{ role: 'model', text: "Hello! How can I help you with the IOAI Studio?" }]);
  }, []);

  // Fetch suggestions when context changes and widget is opened
  useEffect(() => {
    if (isOpen && context) {
      generateChatSuggestions(context).then(setSuggestions);
    }
  }, [isOpen, context]);
  
  // Scroll to bottom of messages on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || !chat) return;

    const userMessage = { role: 'user' as const, text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]); // Clear suggestions after sending a message

    try {
      let modelResponseText = '';

      // Check if this is the first user message to include context
      const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;
      const messageToSend = isFirstUserMessage 
        ? `Context: "${context}"\n\nQuestion: "${messageText}"`
        : messageText;

      // Use sendMessageStream for a better user experience with streaming responses.
      const response = await chat.sendMessageStream({ message: messageToSend });

      let modelMessage = { role: 'model' as const, text: '' };
      setMessages(prev => [...prev, modelMessage]);

      for await (const chunk of response) {
        modelResponseText += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...modelMessage, text: modelResponseText };
          return newMessages;
        });
      }
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
    sendMessage(input);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
      sendMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm h-[70vh] bg-slate-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700 flex flex-col z-50 animate-slide-in-bottom">
        <header className="flex-shrink-0 flex justify-between items-center p-3 border-b border-slate-700">
            <h3 className="font-semibold text-white">Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
                <CloseIcon className="w-5 h-5" />
            </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                            <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}></div>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="p-3 bg-slate-700 rounded-lg"><Loader /></div></div>}
                <div ref={messagesEndRef} />
            </div>
        </div>

        {suggestions.length > 0 && (
          <div className="p-3 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><LightbulbIcon className="w-4 h-4 text-yellow-400" /> Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSuggestionClick(s)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-slate-700 flex-shrink-0">
            <form onSubmit={handleFormSubmit} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-slate-700 p-2 pr-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="absolute top-1/2 right-1.5 -translate-y-1/2 px-3 py-1 text-xs rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-semibold">
                    Send
                </button>
            </form>
        </div>
    </div>
  );
};

export default ChatWidget;
