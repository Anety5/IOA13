import React, { useState } from 'react';
import OptimizerView, { OptimizerViewState } from './components/views/OptimizerView';
import ImageView, { ImageViewState } from './components/views/ImageView';
import LiveConversationView from './components/views/LiveConversationView';
import ProjectsView from './components/views/ProjectsView';
import TranslatorView, { TranslatorViewState } from './components/views/TranslatorView';
import { Logo } from './components/icons/Logo';
import { BrainCircuitIcon } from './components/icons/BrainCircuitIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { LiveIcon } from './components/icons/LiveIcon';
import { FolderIcon } from './components/icons/FolderIcon';
import { TranslatorIcon } from './components/icons/TranslatorIcon';
import { HamburgerIcon } from './components/icons/HamburgerIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { OptimizerAssetContent, ImageAssetContent, TranslatorAssetContent } from './utils/projects';

type View = 'optimizer' | 'image' | 'live' | 'projects' | 'translator';

interface NavItemProps {
  view: View;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  activeView: View;
  onClick: (view: View) => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, label, subtitle, icon, activeView, onClick }) => (
  <button
    onClick={() => onClick(view)}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 w-full text-left ${
      activeView === view
        ? 'bg-indigo-600/30 text-white font-semibold'
        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
    }`}
  >
    {icon}
    <div className="flex flex-col">
      <span>{label}</span>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  </button>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('optimizer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for each view is lifted here for session persistence
  const [optimizerState, setOptimizerState] = useState<OptimizerViewState>({
    inputText: '',
    outputText: '',
    creativity: 70,
    complexity: 50,
    plagiarismGuard: false,
    educationLevel: 'general',
    activeTask: 'optimize',
  });
  
  const [translatorState, setTranslatorState] = useState<TranslatorViewState>({
      sourceText: '',
      translatedText: '',
      sourceLang: 'auto',
      targetLang: 'es',
  });

  const [imageState, setImageState] = useState<ImageViewState>({
      prompt: '',
      editPrompt: '',
      analysisPrompt: 'Describe this image in detail.',
      generatedImage: null,
      sourceImage: null,
      analysisResult: null,
      imageMode: 'generate',
      imageStyle: 'photorealistic',
  });
  
  const handleAnalyzeSavedImage = (b64: string, mimeType: string) => {
    setImageState(s => ({
      ...s,
      imageMode: 'analyze',
      sourceImage: {
        b64,
        mime: mimeType,
        url: `data:${mimeType};base64,${b64}`
      },
      generatedImage: null,
      analysisResult: null
    }));
    setActiveView('image');
  };
  
  const handleLoadOptimizer = (content: OptimizerAssetContent) => {
    setOptimizerState({
        inputText: content.inputText,
        outputText: content.outputText,
        ...content.settings
    });
    setActiveView('optimizer');
  };

  const handleLoadImage = (content: ImageAssetContent) => {
    setImageState({
        prompt: content.prompt,
        editPrompt: '',
        analysisPrompt: 'Describe this image in detail.',
        imageMode: 'generate',
        sourceImage: null,
        generatedImage: content.b64,
        analysisResult: null,
        imageStyle: content.imageStyle || 'photorealistic',
    });
    setActiveView('image');
  };

  const handleLoadTranslator = (content: TranslatorAssetContent) => {
    setTranslatorState({
        sourceText: content.sourceText,
        translatedText: content.translatedText,
        sourceLang: content.sourceLang,
        targetLang: content.targetLang,
    });
    setActiveView('translator');
  };

  const views: Record<View, React.ReactNode> = {
    optimizer: <OptimizerView state={optimizerState} setState={setOptimizerState} />,
    translator: <TranslatorView state={translatorState} setState={setTranslatorState} />,
    image: <ImageView state={imageState} setState={setImageState} />,
    live: <LiveConversationView />,
    projects: <ProjectsView 
        onAnalyzeSavedImage={handleAnalyzeSavedImage} 
        onLoadOptimizer={handleLoadOptimizer}
        onLoadImage={handleLoadImage}
        onLoadTranslator={handleLoadTranslator}
    />,
  };
  
  const handleNavClick = (view: View) => {
    setActiveView(view);
    if (window.innerWidth < 1024) { // Use lg breakpoint
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-gray-100 font-sans">
       {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 lg:hidden" />}
      <nav className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700/50 p-4 flex flex-col gap-4 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <Logo />
           <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-gray-300 hover:text-white">
            <CloseIcon />
          </button>
        </div>
        <NavItem view="optimizer" label="Optimizer" icon={<BrainCircuitIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="translator" label="AI Translator" icon={<TranslatorIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="image" label="Image Studio" icon={<ImageIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="live" label="Live Conversation" subtitle="Real-time voice chat" icon={<LiveIcon />} activeView={activeView} onClick={handleNavClick} />
        <div className="my-2 border-t border-slate-700/50"></div>
        <NavItem view="projects" label="My Projects" icon={<FolderIcon />} activeView={activeView} onClick={handleNavClick} />
      </nav>
      <div className="flex-1 flex flex-col min-h-0">
        <header className="lg:hidden flex items-center justify-between p-3 bg-slate-900 border-b border-slate-700/50 sticky top-0 z-10">
          <Logo />
          <button onClick={() => setIsSidebarOpen(true)} className="p-2">
            <HamburgerIcon />
          </button>
        </header>
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {views[activeView]}
        </main>
      </div>
    </div>
  );
};

export default App;