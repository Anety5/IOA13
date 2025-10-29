
import React from 'react';
import { LiveIcon } from '../icons/LiveIcon';

const LiveConversationView: React.FC = () => {
    return (
        <div className="p-4 md:p-8 flex flex-col items-center justify-center h-full bg-slate-800 text-white text-center">
            <div className="p-4 bg-slate-700 rounded-full mb-6">
                <LiveIcon />
            </div>
            <h1 className="text-3xl font-bold mb-2">Live Conversation is Coming Soon!</h1>
            <p className="text-slate-400 max-w-md">
                We're working on an exciting new feature that will allow you to have real-time voice conversations with Gemini. Stay tuned for updates!
            </p>
        </div>
    );
};
export default LiveConversationView;