import React from 'react';
import { LiveIcon } from '../icons/LiveIcon';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { ChatIcon } from '../icons/ChatIcon';

interface LiveConversationViewProps {
    onSidebarToggle: () => void;
    onChatToggle: () => void;
}

const LiveConversationView: React.FC<LiveConversationViewProps> = ({ onSidebarToggle, onChatToggle }) => {
    return (
        <div className="flex flex-col h-full bg-slate-800 text-white">
            {/* Mobile Header */}
            <header className="md:hidden p-2 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
                <button onClick={onSidebarToggle} className="p-2"><HamburgerIcon /></button>
                <h1 className="font-semibold">Live Conversation</h1>
                <button onClick={onChatToggle} className="p-2"><ChatIcon /></button>
            </header>
            <div className="p-4 md:p-8 flex flex-col items-center justify-center flex-1 text-center">
                <div className="p-4 bg-slate-700 rounded-full mb-6">
                    <LiveIcon />
                </div>
                <h1 className="text-3xl font-bold mb-2">Live Conversation is Coming Soon!</h1>
                <p className="text-slate-400 max-w-md">
                    We're working on an exciting new feature that will allow you to have real-time voice conversations with Gemini. Stay tuned for updates!
                </p>
            </div>
        </div>
    );
};
export default LiveConversationView;