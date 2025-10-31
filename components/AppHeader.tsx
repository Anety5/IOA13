
import React, { useState } from 'react';
import { Logo } from './icons/Logo';
import { SparkleIcon } from './icons/SparkleIcon';
import { ImageIcon } from './icons/ImageIcon';
import { TranslatorIcon } from './icons/TranslatorIcon';
import { LiveIcon } from './icons/LiveIcon';
import { VideoIcon } from './icons/VideoIcon';
import { FolderIcon } from './icons/FolderIcon';
import { HamburgerIcon } from './icons/HamburgerIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ChatIcon } from './icons/ChatIcon';
import { ProjectStudioIcon } from './icons/ProjectStudioIcon';

type ViewType = 'optimizer' | 'image' | 'translator' | 'live' | 'video' | 'projects' | 'project_studio';

interface AppHeaderProps {
    activeView: ViewType;
    setActiveView: (view: ViewType) => void;
    onChatToggle: () => void;
}

const NavItem: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; isNew?: boolean }> = ({ label, icon, isActive, onClick, isNew }) => (
    <button 
      onClick={onClick} 
      className={`w-full md:w-auto px-3 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
    >
        {icon}
        <span>{label}</span>
        {isNew && <span className="ml-auto md:ml-1 px-1.5 py-0.5 text-xs font-semibold bg-cyan-400 text-cyan-900 rounded-full">Soon</span>}
    </button>
);

const AppHeader: React.FC<AppHeaderProps> = ({ activeView, setActiveView, onChatToggle }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        // FIX: Added Project Studio nav item to make it accessible
        { view: 'project_studio' as ViewType, label: 'Project Studio', icon: <ProjectStudioIcon /> },
        { view: 'optimizer' as ViewType, label: 'Optimizer', icon: <SparkleIcon /> },
        { view: 'translator' as ViewType, label: 'Translator', icon: <TranslatorIcon /> },
        { view: 'image' as ViewType, label: 'Image', icon: <ImageIcon /> },
        { view: 'video' as ViewType, label: 'Video', icon: <VideoIcon />, isNew: true },
        { view: 'live' as ViewType, label: 'Live', icon: <LiveIcon />, isNew: true },
        { view: 'projects' as ViewType, label: 'My Projects', icon: <FolderIcon /> },
    ];
    
    return (
        <header className="flex-shrink-0 h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 sm:px-6 relative">
            <div className="flex items-center gap-4">
                 <div className="md:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300">
                        {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
                    </button>
                </div>
                <Logo />
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                {navItems.map(item => (
                     <NavItem 
                        key={item.view}
                        {...item}
                        isActive={activeView === item.view} 
                        onClick={() => setActiveView(item.view)} 
                    />
                ))}
            </nav>

             <div className="flex items-center">
                <button 
                    onClick={onChatToggle} 
                    className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                    aria-label="Toggle chat"
                >
                    <ChatIcon />
                </button>
            </div>
            
            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                 <div className="absolute top-full left-0 w-full bg-slate-800 border-b border-slate-700 md:hidden z-20">
                    <nav className="flex flex-col p-2">
                         {navItems.map(item => (
                            <NavItem 
                                key={item.view}
                                {...item}
                                isActive={activeView === item.view} 
                                onClick={() => {
                                    setActiveView(item.view);
                                    setIsMobileMenuOpen(false);
                                }} 
                            />
                        ))}
                    </nav>
                 </div>
            )}
        </header>
    );
};

export default AppHeader;
