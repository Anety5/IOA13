import React, { useState, useEffect } from 'react';
import { getProjects, addProject, addAssetToProject, AssetContent, Asset } from '../utils/projects';
import Loader from './Loader';

interface SaveToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: Asset['type'];
  assetContent: AssetContent;
  assetNameSuggestion: string;
}

const LAST_PROJECT_KEY = 'ai_optimizer_last_project_id';

const SaveToProjectModal: React.FC<SaveToProjectModalProps> = ({
  isOpen,
  onClose,
  assetType,
  assetContent,
  assetNameSuggestion,
}) => {
  const [projects, setProjects] = useState(getProjects());
  const [selectedProject, setSelectedProject] = useState<string>('new');
  const [newProjectName, setNewProjectName] = useState('');
  const [assetName, setAssetName] = useState(assetNameSuggestion);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const allProjects = getProjects();
      const lastUsedId = localStorage.getItem(LAST_PROJECT_KEY);
      
      setProjects(allProjects);
      setAssetName(assetNameSuggestion);
      setError('');
      
      if (lastUsedId && allProjects.some(p => p.id === lastUsedId)) {
        setSelectedProject(lastUsedId);
      } else if (allProjects.length > 0) {
        setSelectedProject(allProjects[0].id);
      } else {
        setSelectedProject('new');
      }
    }
  }, [isOpen, assetNameSuggestion]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!assetName.trim()) {
        setError("Asset name cannot be empty.");
        return;
    }

    setIsSaving(true);
    setError('');

    let targetProjectId = selectedProject;

    // Create a new project if needed
    if (selectedProject === 'new') {
        if (!newProjectName.trim()) {
            setError("New project name cannot be empty.");
            setIsSaving(false);
            return;
        }
        const newProject = addProject(newProjectName);
        if (newProject) {
            targetProjectId = newProject.id;
        } else {
            setError("Failed to create new project.");
            setIsSaving(false);
            return;
        }
    }
    
    // Add asset to the target project
    const updatedProject = addAssetToProject(targetProjectId, assetName, assetType, assetContent);

    if (updatedProject) {
        // Success
        localStorage.setItem(LAST_PROJECT_KEY, targetProjectId);
        onClose();
    } else {
        setError("Failed to save asset. Your browser storage might be full.");
    }

    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 sm:p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Save to Project</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Asset Name</label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full bg-slate-900 text-gray-200 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-slate-900 text-gray-200 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="new">-- Create New Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedProject === 'new' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Marketing Campaign"
                className="w-full bg-slate-900 text-gray-200 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:bg-indigo-900"
          >
            {isSaving ? <Loader /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveToProjectModal;