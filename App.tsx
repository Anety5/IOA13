import React, { useState, useCallback } from 'react';
import { Logo } from './components/icons/Logo';
import { HamburgerIcon } from './components/icons/HamburgerIcon';
import { CloseIcon } from './components/icons/CloseIcon';

import OptimizerView from './components/views/OptimizerView';
import TranslatorView from './components/views/TranslatorView';
import ImageView from './components/views/ImageView';
import ProjectsView from './components/views/ProjectsView';
import ProjectStudioView from './components/views/ProjectStudioView';
import ChatWidget from './components/ChatWidget';

import { BrainCircuitIcon } from './components/icons/BrainCircuitIcon';
import { TranslatorIcon } from './components/icons/TranslatorIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { FolderIcon } from './components/icons/FolderIcon';
import { ProjectStudioIcon } from './components/icons/ProjectStudioIcon';

import { Asset, Project, ImageViewState, TranslatorViewState, ProjectStudioViewState } from './utils/projects';

type View = 'optimizer' | 'translator' | 'image' | 'projects' | 'project_studio';

const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'optimizer', label: 'Content Optimizer', icon: <BrainCircuitIcon /> },
    { id: 'project_studio', label: 'Project Studio', icon: <ProjectStudioIcon /> },
    { id: 'translator', label: 'Translator', icon: <TranslatorIcon /> },
    { id: 'image', label: 'Image Studio', icon: <ImageIcon /> },
    { id: 'projects', label: 'Projects', icon: <FolderIcon /> },
];

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('optimizer');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // States for each view to persist during session
    const [imageViewState, setImageViewState] = useState<ImageViewState>({
        prompt: '',
        numberOfImages: 1,
        aspectRatio: '1:1',
        images: [],
    });
    const [translatorViewState, setTranslatorViewState] = useState<TranslatorViewState>({
        sourceText: '',
        translatedText: '',
        sourceLang: 'auto',
        targetLang: 'en',
    });
    const [projectStudioViewState, setProjectStudioViewState] = useState<ProjectStudioViewState>({
        mainText: '',
        attachments: [],
        results: [],
    });


    const handleViewAsset = useCallback((asset: Asset, project: Project) => {
        switch (asset.type) {
            case 'image':
                setImageViewState(asset.content as ImageViewState);
                setCurrentView('image');
                break;
            case 'translator':
                setTranslatorViewState(asset.content as TranslatorViewState);
                setCurrentView('translator');
                break;
            case 'project_studio':
                setProjectStudioViewState(asset.content as ProjectStudioViewState);
                setCurrentView('project_studio');
                break;
            // Handle other asset types
            default:
                console.warn(`Cannot view asset of type: ${asset.type}`);
        }
        setIsSidebarOpen(false);
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'optimizer': return <OptimizerView />;
            case 'translator': return <TranslatorView state={translatorViewState} setState={setTranslatorViewState} />;
            case 'image': return <ImageView state={imageViewState} setState={setImageViewState} />;
            case 'projects': return <ProjectsView onViewAsset={handleViewAsset} />;
            case 'project_studio': return <ProjectStudioView state={projectStudioViewState} setState={setProjectStudioViewState} />;
            default: return <div>Select a view</div>;
        }
    };

    const sidebarContent = (
         <nav className="flex flex-col p-4 gap-2">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => {
                        setCurrentView(item.id);
                        setIsSidebarOpen(false); // Close sidebar on selection (mobile)
                    }}
                    className={`flex items-center gap-3 p-3 rounded-md text-sm font-medium transition-colors ${
                        currentView === item.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-gray-300 hover:bg-slate-700'
                    }`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );

    return (
        <div className="flex h-screen bg-slate-900 text-white font-sans">
            {/* Mobile Sidebar */}
             <div className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-40 transform transition-transform lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <Logo />
                    <button onClick={() => setIsSidebarOpen(false)} className="p-1">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                {sidebarContent}
            </aside>
            
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-slate-800 border-r border-slate-700">
                <div className="p-4 border-b border-slate-700">
                    <Logo />
                </div>
                {sidebarContent}
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
                <header className="flex lg:hidden items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <button onClick={() => setIsSidebarOpen(true)} className="mr-4">
                        <HamburgerIcon />
                    </button>
                    <h1 className="text-lg font-semibold">{navItems.find(i => i.id === currentView)?.label}</h1>
                </header>
                <div className="flex-1 overflow-hidden">
                    {renderView()}
                </div>
            </main>
            <ChatWidget />
        </div>
    );
};

export default App;
