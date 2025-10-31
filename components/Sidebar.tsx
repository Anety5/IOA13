import React from 'react';
import { Logo } from './icons/Logo';
import { SparkleIcon } from './icons/SparkleIcon';
import { ImageIcon } from './icons/ImageIcon';
import { TranslatorIcon } from './icons/TranslatorIcon';
import { VideoIcon } from './icons/VideoIcon';
import { FolderIcon } from './icons/FolderIcon';
import { CloseIcon } from './icons/CloseIcon';

export type ViewType = 'optimizer' | 'image' | 'translator' | 'video' | 'projects';


interface SidebarProps {
    activeView: ViewType;
    setActiveView: (view: ViewType) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; isNew?: boolean }> = ({ label, icon, isActive, onClick, isNew }) => (
    <li>
        <button 
          onClick={onClick} 
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
        >
            {icon}
            <span>{label}</span>
            {isNew && <span className="ml-auto px-1.5 py-0.5 text-xs font-semibold bg-cyan-400 text-cyan-900 rounded-full">Soon</span>}
        </button>
    </li>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
    const navItems = [
        { view: 'optimizer' as ViewType, label: 'Content Optimizer', icon: <SparkleIcon /> },
        { view: 'translator' as ViewType, label: 'Translator', icon: <TranslatorIcon /> },
        { view: 'image' as ViewType, label: 'Image Studio', icon: <ImageIcon /> },
        { view: 'video' as ViewType, label: 'Video Generator', icon: <VideoIcon />, isNew: true },
        { view: 'projects' as ViewType, label: 'My Projects', icon: <FolderIcon /> },
    ];
    
    const handleNavClick = (view: ViewType) => {
        setActiveView(view);
        if (window.innerWidth < 768) { // md breakpoint
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden"></div>}

            <aside className={`fixed md:relative top-0 left-0 h-full bg-slate-900 border-r border-slate-700 flex flex-col p-4 z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64`}>
                <div className="flex justify-between items-center mb-6">
                    <Logo />
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-white">
                        <CloseIcon />
                    </button>
                </div>
                
                <nav>
                    <ul className="space-y-2">
                        {navItems.map(item => (
                            <NavItem 
                                key={item.view}
                                {...item}
                                isActive={activeView === item.view} 
                                onClick={() => handleNavClick(item.view)} 
                            />
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;