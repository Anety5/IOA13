import React, { useState, useMemo } from 'react';
import { getProjects, deleteProject, deleteAssetFromProject, Project, Asset } from '../../utils/projects';
import { TrashIcon } from '../icons/TrashIcon';
import { ViewIcon } from '../icons/ViewIcon';
import { HeartIcon } from '../icons/HeartIcon';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { ChatIcon } from '../icons/ChatIcon';

const FAVORITES_KEY = 'ioai_studio_favorites';

const getFavorites = (): { projectId: string; assetId: string }[] => {
    try {
        const favs = localStorage.getItem(FAVORITES_KEY);
        return favs ? JSON.parse(favs) : [];
    } catch { return []; }
};

const toggleFavorite = (projectId: string, assetId: string) => {
    const favorites = getFavorites();
    const index = favorites.findIndex(f => f.projectId === projectId && f.assetId === assetId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push({ projectId, assetId });
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};


interface ProjectsViewProps {
    onLoadAsset: (asset: Asset, project: Project) => void;
    onSidebarToggle: () => void;
    onChatToggle: () => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ onLoadAsset, onSidebarToggle, onChatToggle }) => {
    const [projects, setProjects] = useState(getProjects());
    const [favorites, setFavorites] = useState(getFavorites());
    const [searchTerm, setSearchTerm] = useState('');

    const handleToggleFavorite = (projectId: string, assetId: string) => {
        toggleFavorite(projectId, assetId);
        setFavorites(getFavorites());
    };

    const handleDeleteProject = (projectId: string) => {
        if (window.confirm('Are you sure you want to delete this entire project?')) {
            deleteProject(projectId);
            setProjects(getProjects());
        }
    };

    const handleDeleteAsset = (projectId: string, assetId: string) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            deleteAssetFromProject(projectId, assetId);
            setProjects(getProjects());
        }
    };

    const filteredProjects = useMemo(() => {
        if (!searchTerm.trim()) return projects;
        const lowercasedFilter = searchTerm.toLowerCase();
        return projects.map(project => {
            const filteredAssets = project.assets.filter(asset =>
                asset.name.toLowerCase().includes(lowercasedFilter)
            );
            return { ...project, assets: filteredAssets };
        }).filter(project =>
            project.name.toLowerCase().includes(lowercasedFilter) || project.assets.length > 0
        );
    }, [projects, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-slate-800 text-white">
            {/* Mobile Header */}
            <header className="md:hidden p-2 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
                <button onClick={onSidebarToggle} className="p-2"><HamburgerIcon /></button>
                <h1 className="font-semibold">My Projects</h1>
                <button onClick={onChatToggle} className="p-2"><ChatIcon /></button>
            </header>

            <div className="p-4 md:p-8 flex-1 flex flex-col overflow-hidden">
                <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                    <h1 className="text-2xl font-bold hidden md:block">Projects</h1>
                    <input 
                        type="text"
                        placeholder="Search projects or assets..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 bg-slate-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </header>
                
                <div className="space-y-6 overflow-y-auto flex-1">
                    {filteredProjects.length > 0 ? filteredProjects.map(project => (
                        <div key={project.id} className="bg-slate-900/70 border border-slate-700 rounded-lg">
                            <header className="p-4 flex justify-between items-center border-b border-slate-700">
                                <h2 className="text-xl font-semibold">{project.name}</h2>
                                <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-800"><TrashIcon /></button>
                            </header>
                            <ul className="divide-y divide-slate-800">
                                {project.assets.map(asset => (
                                    <li key={asset.id} className="p-4 flex justify-between items-center group">
                                        <div>
                                            <p className="font-medium">{asset.name}</p>
                                            <p className="text-sm text-slate-400">Type: {asset.type} | Last updated: {new Date(asset.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleToggleFavorite(project.id, asset.id)} className={`p-2 rounded-full hover:bg-slate-800 ${favorites.some(f => f.assetId === asset.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`} title="Favorite">
                                                <HeartIcon isFavorite={favorites.some(f => f.assetId === asset.id)} />
                                            </button>
                                            <button onClick={() => onLoadAsset(asset, project)} className="p-2 text-slate-400 hover:text-indigo-400 rounded-full hover:bg-slate-800" title="Load Asset"><ViewIcon /></button>
                                            <button onClick={() => handleDeleteAsset(project.id, asset.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-800" title="Delete Asset"><TrashIcon /></button>
                                        </div>
                                    </li>
                                ))}
                                {project.assets.length === 0 && <p className="p-4 text-slate-500">No assets found in this project.</p>}
                            </ul>
                        </div>
                    )) : <p className="text-center text-slate-400 py-10">No projects found. Create some assets and save them!</p>}
                </div>
            </div>
        </div>
    );
};

export default ProjectsView;