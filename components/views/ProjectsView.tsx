import React, { useState } from 'react';
import { 
    getProjects, 
    deleteProject, 
    updateProjectName, 
    deleteAsset, 
    Project, 
    Asset,
    OptimizerAssetContent,
    ChatAssetContent,
    ImageAssetContent,
    TranslatorAssetContent,
    AnalysisAssetContent,
    LiveConversationAssetContent
} from '../../utils/projects';
import { renderMarkdown } from '../../utils/rendering';
import { FolderIcon } from '../icons/FolderIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PenIcon } from '../icons/PenIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { ChatIcon } from '../icons/ChatIcon';
import { ImageIcon } from '../icons/ImageIcon';
import { TranslatorIcon } from '../icons/TranslatorIcon';
import { ViewIcon } from '../icons/ViewIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { LiveIcon } from '../icons/LiveIcon';
import { LoadIcon } from '../icons/LoadIcon';

const AssetViewerModal = ({ asset, onClose, onAnalyze }: { asset: Asset | null, onClose: () => void, onAnalyze: (b64: string, mimeType: string) => void }) => {
    if (!asset) return null;

    const renderAssetContent = () => {
        switch (asset.type) {
            case 'optimizer': {
                const content = asset.content as OptimizerAssetContent;
                return (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-1">Settings</h4>
                            <div className="text-xs space-y-1 bg-slate-800 p-2 rounded-md">
                                <p><strong>Task:</strong> {content.settings.task}</p>
                                <p><strong>Creativity:</strong> {content.settings.creativity}%</p>
                                <p><strong>Language Level:</strong> {content.settings.complexity}%</p>
                                <p><strong>Originality Check:</strong> {content.settings.plagiarismGuard ? 'On' : 'Off'}</p>
                                <p><strong>Education Level:</strong> {content.settings.educationLevel}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-1">Input Text</h4>
                            <p className="whitespace-pre-wrap p-2 rounded-md bg-slate-800">{content.inputText}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-1">Output Text</h4>
                            <p className="whitespace-pre-wrap p-2 rounded-md bg-slate-800">{content.outputText}</p>
                        </div>
                    </div>
                );
            }
            case 'chat': {
                const content = asset.content as ChatAssetContent;
                return (
                     <div className="space-y-4">
                        {content.messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">AI</div>}
                                <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                    <div className="text-white prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.parts[0].text as string) }}/>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            case 'image': {
                const content = asset.content as ImageAssetContent;
                return (
                    <div className="space-y-3 text-center">
                        <img src={`data:${content.mimeType};base64,${content.b64}`} alt={content.prompt} className="max-w-full max-h-96 object-contain rounded-lg mx-auto" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                           <div>
                                <h4 className="font-semibold text-gray-400 text-sm mb-1">Prompt</h4>
                                <p className="p-2 rounded-md bg-slate-800 text-sm break-words">{content.prompt}</p>
                           </div>
                           <div>
                                <h4 className="font-semibold text-gray-400 text-sm mb-1">Style</h4>
                                <p className="p-2 rounded-md bg-slate-800 text-sm capitalize">{content.imageStyle?.replace('-', ' ')}</p>
                           </div>
                        </div>
                        <button 
                            onClick={() => onAnalyze(content.b64, content.mimeType)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            Analyze this Image
                        </button>
                    </div>
                );
            }
             case 'translator': {
                const content = asset.content as TranslatorAssetContent;
                return (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-1">Source Text ({content.sourceLang})</h4>
                            <p className="whitespace-pre-wrap p-2 rounded-md bg-slate-800">{content.sourceText}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-1">Translated Text ({content.targetLang})</h4>
                            <p className="whitespace-pre-wrap p-2 rounded-md bg-slate-800">{content.translatedText}</p>
                        </div>
                    </div>
                );
            }
            case 'analysis': {
                const content = asset.content as AnalysisAssetContent;
                return (
                    <div className="space-y-4">
                        <img src={`data:image/jpeg;base64,${content.sourceImageB64}`} alt="Analyzed image" className="max-w-xs max-h-64 object-contain rounded-lg mx-auto" />
                         <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-1">Analysis Prompt</h4>
                            <p className="whitespace-pre-wrap p-2 rounded-md bg-slate-800">{content.prompt}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-1">Analysis Result</h4>
                            <p className="whitespace-pre-wrap p-2 rounded-md bg-slate-800">{content.resultText}</p>
                        </div>
                    </div>
                );
            }
            case 'liveConversation': {
                const content = asset.content as LiveConversationAssetContent;
                return (
                    <div className="space-y-4">
                        {content.transcripts.map((t, index) => (
                             <div key={index} className={`flex items-start gap-2.5 ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {t.speaker === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">AI</div>}
                                <div className={`max-w-xl p-3 rounded-lg ${t.speaker === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                     <p><strong>{t.speaker === 'user' ? 'You' : 'AI'}:</strong> {t.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            default:
                return <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(asset.content, null, 2)}</pre>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 sm:p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold truncate" title={asset.name}>{asset.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700"><CloseIcon /></button>
                </div>
                <div className="bg-slate-900 rounded-lg overflow-auto flex-grow p-4 text-sm">
                    {renderAssetContent()}
                </div>
            </div>
        </div>
    );
};

interface ProjectsViewProps {
    onAnalyzeSavedImage: (b64: string, mimeType: string) => void;
    onLoadOptimizer: (content: OptimizerAssetContent) => void;
    onLoadImage: (content: ImageAssetContent) => void;
    onLoadTranslator: (content: TranslatorAssetContent) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ 
    onAnalyzeSavedImage, 
    onLoadOptimizer, 
    onLoadImage, 
    onLoadTranslator 
}) => {
    const [projects, setProjects] = useState<Project[]>(getProjects());
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingProjectName, setEditingProjectName] = useState('');
    const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);

    const refreshProjects = () => setProjects(getProjects());

    const handleDeleteProject = (projectId: string) => {
        if (window.confirm("Are you sure you want to delete this project and all its assets? This cannot be undone.")) {
            deleteProject(projectId);
            refreshProjects();
        }
    };

    const handleDeleteAsset = (projectId: string, assetId: string) => {
        if (window.confirm("Are you sure you want to delete this asset?")) {
            deleteAsset(projectId, assetId);
            refreshProjects();
        }
    };
    
    const handleStartEdit = (project: Project) => {
        setEditingProjectId(project.id);
        setEditingProjectName(project.name);
    };

    const handleCancelEdit = () => {
        setEditingProjectId(null);
        setEditingProjectName('');
    };

    const handleSaveEdit = (projectId: string) => {
        updateProjectName(projectId, editingProjectName);
        refreshProjects();
        handleCancelEdit();
    };
    
    const handleAnalyzeFromProject = (b64: string, mimeType: string) => {
        setViewingAsset(null); // Close the modal
        onAnalyzeSavedImage(b64, mimeType);
    };

    const handleLoadAsset = (asset: Asset) => {
        switch (asset.type) {
            case 'optimizer':
                onLoadOptimizer(asset.content as OptimizerAssetContent);
                break;
            case 'image':
                onLoadImage(asset.content as ImageAssetContent);
                break;
            case 'translator':
                onLoadTranslator(asset.content as TranslatorAssetContent);
                break;
            default:
                // For other types, just view them for now
                setViewingAsset(asset);
        }
    };

    const getAssetIcon = (type: Asset['type']) => {
        switch(type) {
            case 'optimizer': return <BrainCircuitIcon />;
            case 'chat': return <ChatIcon />;
            case 'image': return <ImageIcon />;
            case 'translator': return <TranslatorIcon />;
            case 'analysis': return <ViewIcon />;
            case 'liveConversation': return <LiveIcon />;
            default: return null;
        }
    };
    
    return (
        <div className="h-full bg-slate-800 rounded-lg border border-slate-700 p-4 sm:p-6 overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2"><FolderIcon /> My Projects</h2>
            
            {projects.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                    <p>You have no saved projects.</p>
                    <p>Assets you save from other views will appear here.</p>
                    <p className="text-sm mt-2">(Note: Projects are saved in your browser's local storage.)</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {projects.map(project => (
                        <div key={project.id} className="bg-slate-900/50 border border-slate-700 rounded-lg">
                            <div className="p-3 sm:p-4 border-b border-slate-700 flex justify-between items-center">
                                {editingProjectId === project.id ? (
                                    <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(project.id); }} className="flex items-center gap-2 flex-grow">
                                        <input 
                                            value={editingProjectName}
                                            onChange={(e) => setEditingProjectName(e.target.value)}
                                            className="bg-slate-700 text-white text-lg font-semibold p-1 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            autoFocus
                                            onBlur={() => handleSaveEdit(project.id)}
                                        />
                                    </form>
                                ) : (
                                    <h3 onDoubleClick={() => handleStartEdit(project)} className="text-lg font-semibold flex-grow">{project.name}</h3>
                                )}
                                <div className="flex items-center gap-3">
                                    <button onClick={() => handleStartEdit(project)} className="text-gray-400 hover:text-white" title="Rename Project"><PenIcon /></button>
                                    <button onClick={() => handleDeleteProject(project.id)} className="text-gray-400 hover:text-red-400" title="Delete Project"><TrashIcon /></button>
                                </div>
                            </div>
                            {project.assets.length === 0 ? (
                                <p className="text-sm text-gray-500 p-4">This project is empty.</p>
                            ) : (
                                <ul className="divide-y divide-slate-800">
                                    {project.assets.map(asset => (
                                        <li key={asset.id} className="p-3 sm:p-4 flex justify-between items-center hover:bg-slate-800/50">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-indigo-400 flex-shrink-0">{getAssetIcon(asset.type)}</span>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate" title={asset.name}>{asset.name}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} - Saved on {new Date(asset.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {(asset.type === 'optimizer' || asset.type === 'image' || asset.type === 'translator') && (
                                                    <button onClick={() => handleLoadAsset(asset)} className="text-gray-400 hover:text-white" title="Load Asset">
                                                        <LoadIcon />
                                                    </button>
                                                )}
                                                <button onClick={() => setViewingAsset(asset)} className="text-gray-400 hover:text-white" title="View Asset Content"><ViewIcon /></button>
                                                <button onClick={() => handleDeleteAsset(project.id, asset.id)} className="text-gray-400 hover:text-red-400" title="Delete Asset"><TrashIcon /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <AssetViewerModal asset={viewingAsset} onClose={() => setViewingAsset(null)} onAnalyze={handleAnalyzeFromProject} />
        </div>
    );
};

export default ProjectsView;