import React, { useState } from 'react';

import OptimizerView from './components/views/OptimizerView';
import ImageView from './components/views/ImageView';
import TranslatorView from './components/views/TranslatorView';
import VideoView from './components/views/VideoView';
import ProjectsView from './components/views/ProjectsView';

import Sidebar, { ViewType } from './components/Sidebar';
import ChatWidget from './components/ChatWidget';

import { OptimizerState, ImageViewState, TranslatorState, Project, Asset } from './utils/projects';
import { ChatIcon } from './components/icons/ChatIcon';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('optimizer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [viewContext, setViewContext] = useState('User is in the Content Optimizer.');

  // State for each view
  const [optimizerState, setOptimizerState] = useState<OptimizerState>({
    originalText: '',
    attachments: [],
    results: [],
    creativity: 50,
    complexity: 50,
    formality: 'Neutral',
    tone: 'Professional',
    guardrails: { proofread: true, plagiarismCheck: false },
  });

  const [imageViewState, setImageViewState] = useState<ImageViewState>({
    mode: 'generate',
    prompt: '',
    sourceImage: null,
    images: [],
    isGenerating: false,
    error: null,
    analysisResult: null,
    numberOfImages: 1,
    aspectRatio: '1:1',
    style: 'none',
  });
  
  const [translatorState, setTranslatorState] = useState<TranslatorState>({
    fromText: '',
    toText: '',
    fromLang: 'en',
    toLang: 'es',
    isLoading: false,
    error: null,
  });

  const handleLoadAsset = (asset: Asset, project: Project) => {
    switch (asset.type) {
        case 'optimizer':
            setOptimizerState(asset.content as OptimizerState);
            setActiveView('optimizer');
            break;
        case 'image':
            setImageViewState(asset.content as ImageViewState);
            setActiveView('image');
            break;
        case 'translator':
            setTranslatorState(asset.content as TranslatorState);
            setActiveView('translator');
            break;
    }
  };
  
  const handleSidebarToggle = () => setIsSidebarOpen(prev => !prev);
  const handleChatToggle = () => setIsChatOpen(prev => !prev);

  const renderActiveView = () => {
    const commonProps = {
        setViewContext,
    };
    const viewToggleProps = {
        onSidebarToggle: handleSidebarToggle,
        onChatToggle: handleChatToggle,
    };
    switch (activeView) {
      case 'optimizer':
        return <OptimizerView state={optimizerState} setState={setOptimizerState} {...commonProps} />;
      case 'image':
        return <ImageView state={imageViewState} setState={setImageViewState} {...commonProps} {...viewToggleProps} />;
      case 'translator':
        return <TranslatorView state={translatorState} setState={setTranslatorState} {...commonProps} {...viewToggleProps} />;
      case 'video':
        return <VideoView {...viewToggleProps} />;
      case 'projects':
        return <ProjectsView onLoadAsset={handleLoadAsset} {...viewToggleProps} />;
      default:
        return <OptimizerView state={optimizerState} setState={setOptimizerState} {...commonProps} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-800 font-sans text-white">
        <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 overflow-hidden">
                {renderActiveView()}
            </main>
        </div>
        <ChatWidget context={viewContext} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />

        {!isChatOpen && (
            <button
                onClick={handleChatToggle}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-transform hover:scale-105 z-40"
                aria-label="Open AI Assistant"
            >
                <ChatIcon />
            </button>
        )}
    </div>
  );
};

export default App;