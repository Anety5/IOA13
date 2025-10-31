import React, { useState, useRef, useEffect, useCallback } from 'react';

import OptimizerView from './components/views/OptimizerView';
import ImageView from './components/views/ImageView';
import TranslatorView from './components/views/TranslatorView';
import VideoView from './components/views/VideoView';
import ProjectsView from './components/views/ProjectsView';
import ProjectStudioView from './components/views/ProjectStudioView';

import Sidebar, { ViewType } from './components/Sidebar';
import ChatWidget from './components/ChatWidget';

import { OptimizerState, ImageViewState, TranslatorState, Project, Asset, ProjectStudioViewState } from './utils/projects';
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

  const [projectStudioState, setProjectStudioState] = useState<ProjectStudioViewState>({
    mainText: '',
    attachments: [],
    results: [],
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
        case 'project_studio':
            setProjectStudioState(asset.content as ProjectStudioViewState);
            setActiveView('project_studio');
            break;
    }
  };
  
  const handleSidebarToggle = () => setIsSidebarOpen(prev => !prev);
  const handleChatToggle = () => setIsChatOpen(prev => !prev);

  // Draggable FAB logic
  const fabRef = useRef<HTMLButtonElement>(null);
  const dragInfo = useRef({ isDragging: false, wasDragged: false, startX: 0, startY: 0, initialRight: 0, initialBottom: 0 });
  const [fabPosition, setFabPosition] = useState({ bottom: 24, right: 24 });

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragInfo.current.isDragging) return;

    const dx = clientX - dragInfo.current.startX;
    const dy = clientY - dragInfo.current.startY;

    // Check if it's a drag or a click
    if (!dragInfo.current.wasDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragInfo.current.wasDragged = true;
        if(fabRef.current) fabRef.current.style.cursor = 'grabbing';
    }

    const fabWidth = fabRef.current?.offsetWidth || 64;
    const fabHeight = fabRef.current?.offsetHeight || 64;
    const margin = 16;

    let newRight = dragInfo.current.initialRight - dx;
    if (newRight < margin) newRight = margin;
    if (newRight > window.innerWidth - fabWidth - margin) newRight = window.innerWidth - fabWidth - margin;
    
    let newBottom = dragInfo.current.initialBottom - dy;
    if (newBottom < margin) newBottom = margin;
    if (newBottom > window.innerHeight - fabHeight - margin) newBottom = window.innerHeight - fabHeight - margin;

    setFabPosition({ right: newRight, bottom: newBottom });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragInfo.current.isDragging) return;
    dragInfo.current.isDragging = false;
    if(fabRef.current) fabRef.current.style.cursor = 'grab';

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => handleDragMove(e.clientX, e.clientY), [handleDragMove]);
  const handleTouchMove = useCallback((e: TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY), [handleDragMove]);
  const handleMouseUp = useCallback(() => handleDragEnd(), [handleDragEnd]);
  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  const handleDragStart = (clientX: number, clientY: number) => {
    dragInfo.current = {
        isDragging: true,
        wasDragged: false,
        startX: clientX,
        startY: clientY,
        initialRight: fabPosition.right,
        initialBottom: fabPosition.bottom,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };
    
  // Keep FAB in view on resize
  useEffect(() => {
    const handleResize = () => {
        const fabWidth = fabRef.current?.offsetWidth || 64;
        const fabHeight = fabRef.current?.offsetHeight || 64;
        const margin = 16;

        setFabPosition(pos => {
            let newRight = pos.right;
            if (newRight > window.innerWidth - fabWidth - margin) {
                newRight = window.innerWidth - fabWidth - margin;
            }
            let newBottom = pos.bottom;
            if (newBottom > window.innerHeight - fabHeight - margin) {
                newBottom = window.innerHeight - fabHeight - margin;
            }
            return { right: newRight, bottom: newBottom };
        });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      case 'project_studio':
        return <ProjectStudioView state={projectStudioState} setState={setProjectStudioState} {...commonProps} {...viewToggleProps} />;
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
                ref={fabRef}
                onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
                onClick={() => {
                    if (dragInfo.current.wasDragged) {
                        dragInfo.current.wasDragged = false;
                        return;
                    }
                    handleChatToggle();
                }}
                style={{ right: `${fabPosition.right}px`, bottom: `${fabPosition.bottom}px` }}
                className="fixed bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-transform hover:scale-105 z-40 cursor-grab"
                aria-label="Open AI Assistant"
            >
                <ChatIcon />
            </button>
        )}
    </div>
  );
};

export default App;