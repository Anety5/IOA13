import React from 'react';
import { VideoIcon } from '../icons/VideoIcon';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { ChatIcon } from '../icons/ChatIcon';

interface VideoViewProps {
    onSidebarToggle: () => void;
    onChatToggle: () => void;
}

const VideoView: React.FC<VideoViewProps> = ({ onSidebarToggle, onChatToggle }) => {
  return (
        <div className="flex flex-col h-full bg-slate-800 text-white text-center">
             {/* Mobile Header */}
            <header className="md:hidden p-2 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
                <button onClick={onSidebarToggle} className="p-2"><HamburgerIcon /></button>
                <h1 className="font-semibold">Video Generator</h1>
                <button onClick={onChatToggle} className="p-2"><ChatIcon /></button>
            </header>
            <div className="p-4 md:p-8 flex flex-col items-center justify-center flex-1">
                <div className="p-4 bg-slate-700 rounded-full mb-6">
                    <VideoIcon />
                </div>
                <h1 className="text-3xl font-bold mb-2">Video Generation is Coming Soon!</h1>
                <p className="text-slate-400 max-w-md">
                    Get ready to bring your ideas to life with AI-powered video generation. This feature is currently under development and will be available in a future update.
                </p>
            </div>
        </div>
    );
};

export default VideoView;