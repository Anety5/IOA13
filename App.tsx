
import React, { useState, useCallback } from 'react';
import OptimizerView from './components/views/OptimizerView';
import ImageView from './components/views/ImageView';
import TranslatorView from './components/views/TranslatorView';
import LiveConversationView from './components/views/LiveConversationView';
import VideoView from './components/views/VideoView';
import ProjectsView from './components/views/ProjectsView';
import ChatWidget from './components/ChatWidget';
import Sidebar from './components/Sidebar';
import { 
    Project, 
    Asset,
    OptimizerViewState,
    ImageViewState,
    TranslatorViewState,
} from './utils/projects';

export type ViewType = 'optimizer' | 'image' | 'translator' | 'live' | 'video' | 'projects';

// Initial state for each view
const initialOptimizerState: OptimizerViewState = {
  originalText: '',
  results: [],
  attachments: [],
  options: {
    creativity: 50,
    readability: 50,
    formality: 'neutral',
    tone: 'professional',
  },
};

const initialImageViewState: ImageViewState = {
  mode: 'generate',
  prompt: '',
  images: [],
  sourceImage: null,
  analysisResult: null,
  isGenerating: false,
  error: null,
  numberOfImages: 1,
  aspectRatio: '1:1',
};

const initialTranslatorState: TranslatorViewState = {
  sourceText: '',
  translatedText: '',
  sourceLang: 'auto',
  targetLang: 'en',
};


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('optimizer');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default on mobile
  const [viewContext, setViewContext] = useState("Currently in the Optimizer view.");

  // State for each view
  const [optimizerState, setOptimizerState] = useState<OptimizerViewState>(initialOptimizerState);
  const [imageViewState, setImageViewState] = useState<ImageViewState>(initialImageViewState);
  const [translatorState, setTranslatorState] = useState<TranslatorViewState>(initialTranslatorState);

  const handleLoadAsset = useCallback((asset: Asset, project: Project) => {
    switch (asset.type) {
      case 'optimizer':
        setOptimizerState(asset.content as OptimizerViewState);
        setActiveView('optimizer');
        break;
      case 'image':
        setImageViewState(asset.content as ImageViewState);
        setActiveView('image');
        break;
      case 'translator':
        setTranslatorState(asset.content as TranslatorViewState);
        setActiveView('translator');
        break;
      default:
        console.warn(`Asset type "${asset.type}" cannot be loaded yet.`);
    }
  }, []);

  const renderActiveView = () => {
    const commonProps = {
        onSidebarToggle: () => setIsSidebarOpen(prev => !prev),
        onChatToggle: () => setIsChatOpen(prev => !prev),
    };

    switch (activeView) {
      case 'optimizer':
        return <OptimizerView state={optimizerState} setState={setOptimizerState} setViewContext={setViewContext} {...commonProps} />;
      case 'image':
        // Pass commonProps if ImageView gets its own header
        return <ImageView state={imageViewState} setState={setImageViewState} setViewContext={setViewContext} />;
      case 'translator':
        // Pass commonProps if TranslatorView gets its own header
        return <TranslatorView state={translatorState} setState={setTranslatorState} setViewContext={setViewContext} />;
      case 'live':
        return <LiveConversationView />;
      case 'video':
        return <VideoView />;
      case 'projects':
        return <ProjectsView onLoadAsset={handleLoadAsset} />;
      default:
        return <div className="p-8">Select a tool to get started.</div>;
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-800 text-white flex font-sans overflow-hidden">
        <Sidebar 
            activeView={activeView}
            setActiveView={setActiveView}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
        />
        <main className="flex-1 h-full overflow-y-auto">
          {renderActiveView()}
        </main>
      <ChatWidget 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        viewContext={viewContext}
      />
    </div>
  );
};

export default App;