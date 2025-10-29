
import React, { useState, useEffect } from 'react';
import { getProjects, Project, Asset } from '../utils/projects';
import { CloseIcon } from './icons/CloseIcon';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadAsset: (asset: Asset, project: Project) => void;
}

const FAVORITES_KEY = 'ioai_studio_favorites';

const getFavorites = (): { projectId: string; assetId: string }[] => {
    try {
        const favs = localStorage.getItem(FAVORITES_KEY);
        return favs ? JSON.parse(favs) : [];
    } catch (e) {
        return [];
    }
};

const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose, onLoadAsset }) => {
    const [projects] = useState(getProjects());
    const [favorites, setFavorites] = useState<{ project: Project; asset: Asset }[]>([]);

    useEffect(() => {
        if (isOpen) {
            const favoriteIds = getFavorites();
            const favoriteAssets: { project: Project; asset: Asset }[] = [];
            for (const { projectId, assetId } of favoriteIds) {
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    const asset = project.assets.find(a => a.id === assetId);
                    if (asset) {
                        favoriteAssets.push({ project, asset });
                    }
                }
            }
            setFavorites(favoriteAssets);
        }
    }, [isOpen, projects]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 sm:p-6 w-full max-w-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Favorites</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    {favorites.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">You haven't favorited any assets yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {favorites.map(({ project, asset }) => (
                                <li key={asset.id} 
                                    className="p-3 bg-slate-900/50 rounded-md hover:bg-slate-700/50 cursor-pointer"
                                    onClick={() => {
                                        onLoadAsset(asset, project);
                                        onClose();
                                    }}
                                >
                                    <p className="font-medium">{asset.name}</p>
                                    <p className="text-sm text-slate-400">In project: {project.name}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoritesModal;
