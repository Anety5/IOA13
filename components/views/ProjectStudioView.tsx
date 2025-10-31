import React, { useState, useRef, useEffect } from 'react';
import { ProjectStudioViewState, ProjectStudioResult } from '../../utils/projects';
import { generateFromProjectStudio } from '../../services/geminiService';
import Loader from '../Loader';
import { SaveIcon } from '../icons/SaveIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { renderMarkdown } from '../../utils/rendering';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { fileToBase64 } from '../../utils/image';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { ChatIcon } from '../icons/ChatIcon';

interface ProjectStudioViewProps {
  state: ProjectStudioViewState;
  setState: React.Dispatch<React.SetStateAction<ProjectStudioViewState>>;
  setViewContext: (context: string) => void;
  onSidebarToggle: () => void;
  onChatToggle: () => void;
}

const ProjectStudioView: React.FC<ProjectStudioViewProps> = ({ state, setState, setViewContext, onSidebarToggle, onChatToggle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setViewContext(`User is in the Project Studio. Current instructions: "${state.mainText.substring(0, 100)}..."`);
  }, [state.mainText, setViewContext]);
  
  const handleGenerate = async () => {
    if (!state.mainText.trim()) return;

    setIsLoading(true);
    setError('');
    try {
        const response = await generateFromProjectStudio(state.mainText, state.attachments);

      const newResult: ProjectStudioResult = {
        type: 'generation',
        content: response.text,
      };
      setState(s => ({ ...s, results: [newResult, ...s.results] }));
    } catch (err: any) {
      setError(err.message || `An error occurred during generation.`);
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
        const contextualizedText = `--- START OF DOCUMENT ---\n${textContent}\n--- END OF DOCUMENT ---`;
        setState(s => ({
            ...s,
            mainText: s.mainText ? `${s.mainText}\n\n${contextualizedText}` : contextualizedText,
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
      {/* Mobile Header */}
      <header className="md:hidden p-2 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
          <button onClick={onSidebarToggle} className="p-2"><HamburgerIcon /></button>
          <h1 className="font-semibold">Project Studio</h1>
          <button onClick={onChatToggle} className="p-2"><ChatIcon /></button>
      </header>
      <header className="hidden md:flex flex-shrink-0 p-4 border-b border-slate-700 justify-between items-center">
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
        {/* Input Panel */}
        <div className="flex-1 flex flex-col p-4 border-b lg:border-b-0 lg:border-r border-slate-700 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Context &amp; Instructions</h2>
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700"
                  title="Upload .txt or image file as context"
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
           {state.attachments.length > 0 && (
              <div className="mb-3 flex-shrink-0">
                  <p className="text-sm text-slate-400 mb-2">Contextual Attachments:</p>
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
          <textarea
            value={state.mainText}
            onChange={(e) => setState(s => ({ ...s, mainText: e.target.value }))}
            placeholder="List your rules, instructions, and prompt here. You can upload text files or images to provide context for the generation."
            className="w-full flex-1 p-3 bg-slate-900 rounded-md resize-none focus:outline-none placeholder-slate-500 text-slate-300"
          />
         <button
            onClick={handleGenerate}
            disabled={isLoading || !state.mainText.trim()}
            className="w-full mt-4 py-2.5 text-base font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
            {isLoading ? <Loader /> : 'Generate'}
        </button>
        </div>
        
        {/* Output Panel */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
            <h2 className="text-lg font-medium mb-4">Generated Output</h2>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
                {isLoading && state.results.length === 0 && <div className="flex justify-center pt-8"><Loader /></div>}
                {error && <p className="text-red-400 p-3 bg-red-900/50 rounded-md">{error}</p>}
                
                {state.results.map((result, index) => (
                    <div key={index} className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                        <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.content) }}></div>
                    </div>
                ))}

                {!isLoading && state.results.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center text-slate-500">
                        <p>Your generated content will appear here.</p>
                    </div>
                )}
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