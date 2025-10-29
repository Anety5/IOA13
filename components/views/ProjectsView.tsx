import React, { useState, useEffect } from 'react';
import { getProjects, deleteProject, deleteAsset, Project, Asset } from '../../utils/projects';
import { FolderIcon } from '../icons/FolderIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { TranslatorIcon } from '../icons/TranslatorIcon';
import { ImageIcon } from '../icons/ImageIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { ViewIcon } from '../icons/ViewIcon';

interface ProjectsViewProps {
    onViewAsset: (asset: Asset, project: Project) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ onViewAsset }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    useEffect(() => {
        setProjects(getProjects());
    }, []);

    const refreshProjects = () => {
        setProjects(getProjects());
    };

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };

    const handleDeleteProject = (projectId: string) => {
        if (window.confirm('Are you sure you want to delete this entire project and all its assets?')) {
            deleteProject(projectId);
            refreshProjects();
        }
    };

    const handleDeleteAsset = (projectId: string, assetId: string) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            deleteAsset(projectId, assetId);
            refreshProjects();
        }
    };

    const getAssetIcon = (type: Asset['type']) => {
        switch (type) {
            case 'optimizer': return <BrainCircuitIcon />;
            case 'translator': return <TranslatorIcon />;
            case 'image': return <ImageIcon />;
            // Add other asset types here
            default: return <div className="w-5 h-5 bg-slate-500 rounded-sm" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-800 text-white">
            <header className="flex-shrink-0 p-4 border-b border-slate-700 flex justify-between items-center">
                <h1 className="text-xl font-semibold">Projects</h1>
            </header>
            <div className="flex-1 p-4 overflow-y-auto">
                {projects.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <p>No projects found. Create assets in other views and save them to a project.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map(project => (
                            <div key={project.id} className="bg-slate-900/50 rounded-lg border border-slate-700">
                                <div 
                                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-700/50"
                                    onClick={() => toggleProject(project.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <FolderIcon />
                                        <span className="font-medium">{project.name}</span>
                                        <span className="text-xs text-slate-400">({project.assets.length} assets)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProject(project.id);
                                            }}
                                            className="p-1.5 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                                            title="Delete Project"
                                        >
                                            <TrashIcon />
                                        </button>
                                        <span className={`transform transition-transform ${expandedProjects.has(project.id) ? 'rotate-90' : 'rotate-0'}`}>
                                            ▶
                                        </span>
                                    </div>
                                </div>
                                {expandedProjects.has(project.id) && (
                                    <div className="border-t border-slate-700 p-2 sm:p-3">
                                        {project.assets.length > 0 ? (
                                            <ul className="space-y-2">
                                                {project.assets.slice().reverse().map(asset => (
                                                    <li key={asset.id} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-800">
                                                        <div className="flex items-center gap-3">
                                                            {getAssetIcon(asset.type)}
                                                            <div>
                                                                <p className="text-sm font-medium">{asset.name}</p>
                                                                <p className="text-xs text-slate-400">
                                                                    {new Date(asset.createdAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <button 
                                                                onClick={() => onViewAsset(asset, project)}
                                                                className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-indigo-400"
                                                                title="View Asset"
                                                            >
                                                                <ViewIcon />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteAsset(project.id, asset.id)}
                                                                className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-red-400"
                                                                title="Delete Asset"
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-center text-sm text-slate-500 py-4">This project is empty.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsView;
