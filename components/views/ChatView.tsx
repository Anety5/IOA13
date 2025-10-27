import React, { useState, useEffect, useRef } from 'react';
import { generateChatResponse, translateText } from '../../services/geminiService';
import { Part } from '@google/genai';
import { renderMarkdown } from '../../utils/rendering';
import Loader from '../Loader';
import Toggle from '../Toggle';
import { ChatIcon } from '../icons/ChatIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { TranslatorIcon } from '../icons/TranslatorIcon';
import { CloseIcon } from '../icons/CloseIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { ChatAssetContent } from '../../utils/projects';

interface Message {
  role: 'user' | 'model';
  parts: Part[];
  groundingChunks?: any[];
  originalText?: string;
}

export interface ChatViewState {
  currentMessage: string;
  useThinkingMode: boolean;
  useSearchGrounding: boolean;
}

interface ChatViewProps {
  state: ChatViewState;
  setState: React.Dispatch<React.SetStateAction<ChatViewState>>;
}

const CHAT_HISTORY_KEY = 'chat_history';

const ChatView: React.FC<ChatViewProps> = ({ state, setState }) => {
  const { currentMessage, useThinkingMode, useSearchGrounding } = state;
  
  const setCurrentMessage = (text: string) => setState(s => ({ ...s, currentMessage: text }));
  const setUseThinkingMode = (enabled: boolean) => setState(s => ({ ...s, useThinkingMode: enabled }));
  const setUseSearchGrounding = (enabled: boolean) => setState(s => ({ ...s, useSearchGrounding: enabled }));

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to load chat history:", error);
      return [];
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [translatingMessageIndex, setTranslatingMessageIndex] = useState<number | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save chat history:", error);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: currentMessage }] };
    const historyForAPI = messages.map(({groundingChunks, originalText, ...rest}) => rest);
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsLoading(true);

    try {
        const response = await generateChatResponse({
            prompt: messageToSend,
            history: historyForAPI,
            useThinkingMode,
            useSearchGrounding
        });
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const modelMessage: Message = { 
            role: 'model', 
            parts: [{ text: response.text }],
            groundingChunks: groundingMetadata?.groundingChunks || []
        };
        setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: Message = { role: 'model', parts: [{ text: "Sorry, I ran into an error. Please try again." }] };
        setMessages((prev) => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleTranslate = async (msgIndex: number) => {
    const messageToTranslate = messages[msgIndex];
    if (!messageToTranslate || translatingMessageIndex !== null) return;
    
    const targetLang = prompt("Enter the language to translate to (e.g., Spanish, French, Japanese):");
    if (!targetLang) return;

    setTranslatingMessageIndex(msgIndex);
    
    try {
        const text = messageToTranslate.parts[0].text as string;
        const translated = await translateText(text, 'auto', targetLang);
        const newMessages = [...messages];
        newMessages[msgIndex] = {
            ...newMessages[msgIndex],
            originalText: text,
            parts: [{ text: translated }]
        };
        setMessages(newMessages);
    } catch (e) { 
        console.error('Translation failed', e); 
        alert('Translation failed.');
    } finally { 
        setTranslatingMessageIndex(null); 
    }
  };

  const handleRevertTranslation = (msgIndex: number) => {
    const messageToRevert = messages[msgIndex];
    if (!messageToRevert || !messageToRevert.originalText) return;

    const newMessages = [...messages];
    newMessages[msgIndex] = {
        ...newMessages[msgIndex],
        parts: [{ text: messageToRevert.originalText }],
        originalText: undefined
    };
    setMessages(newMessages);
  };

  const handleDownloadChat = () => {
    const chatContent = messages.map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.parts[0].text}`).join('\n\n');
    const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-history.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
      if (window.confirm("Are you sure you want to clear the entire chat history?")) {
          setMessages([]);
          localStorage.removeItem(CHAT_HISTORY_KEY);
      }
  };

  return (
    <>
    <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700">
      <div className="p-3 sm:p-4 border-b border-slate-700 flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><ChatIcon /> AI Chat</h2>
        <div className="flex items-center flex-wrap justify-start gap-3">
            <Toggle label="Deeper Thinking" enabled={useThinkingMode} onChange={setUseThinkingMode} icon={<BrainCircuitIcon />} />
            <Toggle label="Search" enabled={useSearchGrounding} onChange={setUseSearchGrounding} icon={<SearchIcon />} />
            <button onClick={() => setIsSaveModalOpen(true)} disabled={messages.length === 0} className="text-gray-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed" title="Save Chat">
                <SaveIcon />
            </button>
            <button onClick={handleDownloadChat} disabled={messages.length === 0} className="text-gray-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed" title="Download Chat">
                <DownloadIcon />
            </button>
            <button onClick={handleClearChat} disabled={messages.length === 0} className="text-gray-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed" title="Clear Chat">
                <TrashIcon />
            </button>
        </div>
      </div>
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 pt-10">Your conversation will appear here.</div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">AI</div>
                )}
                <div className="group flex flex-col gap-1">
                    <div
                        className={`max-w-xl p-3 rounded-lg ${
                        msg.role === 'user' ? 'bg-indigo-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'
                        }`}
                    >
                        <div 
                            className="text-white prose prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.parts[0].text as string)}}
                        />
                         {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                            <div className="mt-2 text-xs border-t border-slate-600 pt-2">
                                <h4 className="font-semibold text-gray-400">Sources:</h4>
                                <ol className="list-decimal list-inside text-sky-400 space-y-1">
                                    {msg.groundingChunks.map((chunk: any, i: number) => (
                                        chunk.web && (
                                            <li key={i}>
                                                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    {chunk.web.title}
                                                </a>
                                            </li>
                                        )
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                    {msg.role === 'model' && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             {translatingMessageIndex === index ? <Loader /> : (
                                msg.originalText ? (
                                    <button onClick={() => handleRevertTranslation(index)} className="text-slate-400 hover:text-white text-xs flex items-center gap-1" title="Revert to Original">
                                        <CloseIcon /> Revert
                                    </button>
                                ) : (
                                    <button onClick={() => handleTranslate(index)} className="text-slate-400 hover:text-white" title="Translate Message">
                                        <TranslatorIcon />
                                    </button>
                                )
                             )}
                        </div>
                    )}
                </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">AI</div>
              <div className="max-w-xl p-3 rounded-lg bg-slate-700 flex items-center gap-2">
                <Loader />
                <span className="text-sm text-gray-400">AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800">
        <div className="relative">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="w-full bg-slate-900 text-gray-200 p-3 pr-24 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-indigo-900/50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
    {isSaveModalOpen && (
      <SaveToProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        assetType="chat"
        assetContent={{ messages } as ChatAssetContent}
        assetNameSuggestion={`Chat - ${messages[0]?.parts[0]?.text?.substring(0, 30) || 'New Chat'}...`}
      />
    )}
    </>
  );
};

export default ChatView;