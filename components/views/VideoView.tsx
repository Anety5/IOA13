
import React from 'react';
import { VideoIcon } from '../icons/VideoIcon';

const VideoView: React.FC = () => {
  return (
        <div className="p-4 md:p-8 flex flex-col items-center justify-center h-full bg-slate-800 text-white text-center">
            <div className="p-4 bg-slate-700 rounded-full mb-6">
                <VideoIcon />
            </div>
            <h1 className="text-3xl font-bold mb-2">Video Generation is Coming Soon!</h1>
            <p className="text-slate-400 max-w-md">
                Get ready to bring your ideas to life with AI-powered video generation. This feature is currently under development and will be available in a future update.
            </p>
        </div>
    );
};

export default VideoView;