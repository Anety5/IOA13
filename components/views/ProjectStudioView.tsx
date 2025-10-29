import React, { useState, useRef } from 'react';
import { ProjectStudioViewState, ProjectStudioResult } from '../../utils/projects';
import { summarizeText, modifyText } from '../../services/geminiService';
import Loader from '../Loader';
import { SaveIcon } from '../icons/SaveIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { renderMarkdown } from '../../utils/rendering';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { fileToBase64 } from '../../utils/image';
import { SummarizeIcon } from '../icons/SummarizeIcon';
import { PenIcon } from '../icons/PenIcon';
import { RefreshIcon } from '../icons/RefreshIcon';

interface ProjectStudioViewProps {
  state: ProjectStudioViewState;
  setState: React.Dispatch<React.SetStateAction<ProjectStudioViewState>>;
}

const ProjectStudioView: React.FC<ProjectStudioViewProps> = ({ state, setState }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleAction = async (action: 'summary' | 'modification', instructionOverride?: string) => {
    if (!state.mainText.trim()) return;
    
    const instruction = instructionOverride ?? modifyPrompt;
    if (action === 'modification' && !instruction.trim()) return;

    setIsLoading(true);
    setError('');
    try {
        let response;
        if (action === 'summary') {
            response = await summarizeText(state.mainText);
        } else {
            response = await modifyText(state.mainText, instruction);
        }

      const newResult: ProjectStudioResult = {
        type: action,
        content: response.text,
        prompt: action === 'modification' ? instruction : undefined,
      };
      setState(s => ({ ...s, results: [newResult, ...s.results] }));
      
      if (action === 'modification' && !instructionOverride) {
          setModifyPrompt('');
      }
    } catch (err: any) {
      setError(err.message || `An error occurred during the ${action} action.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const base64Data = await fileToBase64(file);
        setState(s => ({
            ...s,
            attachments: [...s.attachments, { data: base64Data, mimeType: file.type }],
        }));
    } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        setState(s => ({
            ...s,
            mainText: s.mainText ? `${s.mainText}\n\n${textContent}` : textContent,
        }));
    }
    
    if(event.target) {
        event.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
      setState(s => ({
          ...s,
          attachments: s.attachments.filter((_, i) => i !== index),
      }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 text-white">
      <header className="flex-shrink-0 p-4 border-b border-slate-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Project Studio</h1>
        <button
            onClick={() => setIsModalOpen(true)}
            disabled={!state.mainText && state.results.length === 0}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
            <SaveIcon />
            Save Project
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 border-r border-slate-700">
          <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Content</h2>
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700"
                  title="Upload .txt or image file"
              >
                  <PaperclipIcon />
              </button>
              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg, text/plain"
              />
          </div>
          <textarea
            value={state.mainText}
            onChange={(e) => setState(s => ({ ...s, mainText: e.target.value }))}
            placeholder="Type, paste, or upload your content here..."
            className="w-full flex-1 p-3 bg-slate-900 rounded-md resize-none focus:outline-none placeholder-slate-500 text-slate-300"
          />
          {state.attachments.length > 0 && (
              <div className="mt-3 flex-shrink-0">
                  <p className="text-sm text-slate-400 mb-2">Attachments:</p>
                  <div className="flex flex-wrap gap-2">
                      {state.attachments.map((att, index) => (
                          <div key={index} className="relative">
                              <img 
                                  src={`data:${att.mimeType};base64,${att.data}`} 
                                  alt={`attachment ${index + 1}`} 
                                  className="h-16 w-16 object-cover rounded-md"
                              />
                              <button 
                                  onClick={() => removeAttachment(index)}
                                  className="absolute -top-1 -right-1 p-0.5 bg-slate-600 text-white rounded-full hover:bg-red-500"
                              >
                                  <CloseIcon className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
        
        {/* Results Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 overflow-y-auto flex-1">
              <h2 className="text-lg font-medium mb-4">Results</h2>
              {isLoading && state.results.length === 0 && <div className="flex justify-center pt-8"><Loader /></div>}
              {error && <p className="text-red-400">{error}</p>}
              <div className="space-y-4">
                {state.results.map((result, index) => (
                  <div key={index} className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 group relative">
                    <h3 className="font-semibold text-indigo-400 capitalize mb-2">{result.type}</h3>
                    {result.prompt && <p className="text-sm text-slate-400 italic mb-2">Instruction: "{result.prompt}"</p>}
                    <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.content) }}></div>
                     <button 
                        onClick={() => handleAction(result.type, result.prompt)}
                        className="absolute top-2 right-2 p-1.5 rounded-full text-slate-400 bg-slate-800/50 opacity-0 group-hover:opacity-100 hover:bg-slate-700 hover:text-white transition-opacity"
                        title="Regenerate"
                      >
                          <RefreshIcon />
                      </button>
                  </div>
                ))}
              </div>
          </div>
           <div className="p-4 border-t border-slate-700 flex-shrink-0 flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => handleAction('summary')}
                    disabled={isLoading || !state.mainText.trim()}
                    className="flex-1 py-2.5 text-base font-semibold rounded-md bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2 disabled:bg-cyan-800 disabled:cursor-not-allowed"
                >
                    <SummarizeIcon /> Summarize
                </button>
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text"
                        value={modifyPrompt}
                        onChange={e => setModifyPrompt(e.target.value)}
                        placeholder="Instruction to modify..."
                        className="flex-grow bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={() => handleAction('modification')}
                        disabled={isLoading || !state.mainText.trim() || !modifyPrompt.trim()}
                        className="py-2.5 px-4 text-base font-semibold rounded-md bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:bg-purple-800 disabled:cursor-not-allowed"
                    >
                       <PenIcon /> Modify
                    </button>
                </div>
            </div>
        </div>
      </div>
      <SaveToProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assetType="project_studio"
        assetContent={state}
        assetNameSuggestion={`Project - ${new Date().toLocaleString()}`}
      />
    </div>
  );
};

export default ProjectStudioView;