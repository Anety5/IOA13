import React, { useState, useEffect, useRef } from 'react';
import { processText, TextAction } from '../../services/geminiService';
import { OptimizerState, OptimizerResult, addOrphanAsset, OptimizerAction } from '../../utils/projects';
import Slider from '../Slider';
import Toggle from '../Toggle';
import Loader from '../Loader';
import SaveToProjectModal from '../SaveToProjectModal';
import { SparkleIcon } from '../icons/SparkleIcon';
import { ComplexityIcon } from '../icons/ComplexityIcon';
import { ProofreadIcon } from '../icons/ProofreadIcon';
import { PlagiarismCheckIcon } from '../icons/PlagiarismCheckIcon';
import { renderMarkdown } from '../../utils/rendering';
import { SaveIcon } from '../icons/SaveIcon';
import { CopyIcon } from '../icons/CopyIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { fileToBase64 } from '../../utils/image';
import { CloseIcon } from '../icons/CloseIcon';
import { SummarizeIcon } from '../icons/SummarizeIcon';
import { PenIcon } from '../icons/PenIcon';
import { PanelLeftCloseIcon } from '../icons/PanelLeftCloseIcon';
import { PanelLeftOpenIcon } from '../icons/PanelLeftOpenIcon';

interface OptimizerViewProps {
  state: OptimizerState;
  setState: React.Dispatch<React.SetStateAction<OptimizerState>>;
  setViewContext: (context: string) => void;
}

const OptimizerView: React.FC<OptimizerViewProps> = ({ state, setState, setViewContext }) => {
  const [isLoading, setIsLoading] = useState<TextAction | false>(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setViewContext(`User is in the Content Optimizer. Current text: "${state.originalText.substring(0, 100)}..."`);
  }, [state.originalText, setViewContext]);

  const handleAction = async (action: TextAction) => {
    if (!state.originalText.trim()) return;
    if (action === 'modify' && !modifyPrompt.trim()) return;
    
    setIsLoading(action);
    setError('');

    try {
        const response = await processText({
            text: state.originalText,
            action: action,
            instruction: modifyPrompt,
            creativity: state.creativity,
            complexity: state.complexity,
            formality: state.formality,
            tone: state.tone,
            guardrails: state.guardrails,
        });

      const newResult: OptimizerResult = {
        type: action as OptimizerAction,
        content: response.text,
        prompt: action === 'modify' ? modifyPrompt : undefined,
      };
      setState(s => ({ ...s, results: [newResult, ...s.results] }));
      if(action === 'modify') setModifyPrompt('');

    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain') {
        const textContent = await file.text();
        setState(s => ({...s, originalText: s.originalText ? `${s.originalText}\n\n${textContent}` : textContent}));
    } else if (file.type.startsWith('image/')) {
        const base64Data = await fileToBase64(file);
        setState(s => ({...s, attachments: [...s.attachments, {data: base64Data, mimeType: file.type}]}));
    }
    if (event.target) event.target.value = '';
  };

  const removeAttachment = (index: number) => {
      setState(s => ({...s, attachments: s.attachments.filter((_, i) => i !== index)}));
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  const downloadResult = (result: OptimizerResult) => {
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.type}_result.txt`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const saveResultAsAsset = (result: OptimizerResult) => {
      const newAssetState: OptimizerState = {
          ...state,
          originalText: result.content,
          results: [],
      };
      addOrphanAsset(`New Asset from Result`, 'optimizer', newAssetState);
      // Optional: Add user feedback, e.g., a toast notification
  };

  const ControlsPanel = () => (
     <aside className={`bg-slate-900 border-r border-slate-700 flex flex-col transition-all duration-300 ease-in-out ${isControlsOpen ? 'w-full md:w-80 p-4' : 'w-0 p-0 overflow-hidden'}`}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-lg font-bold">Optimizer Controls</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsControlsOpen(false)} className="p-2 text-slate-400 hover:text-white" title="Collapse Panel"><PanelLeftCloseIcon /></button>
            </div>
        </div>
        
        <div className="space-y-6 overflow-y-auto pr-2 -mr-4 flex-grow">
          <Slider
            label="Creativity"
            description="Controls the uniqueness and imagination."
            value={state.creativity}
            onChange={(e) => setState(s => ({ ...s, creativity: parseInt(e.target.value, 10) }))}
            icon={<SparkleIcon />}
            valueLabel={`${state.creativity}%`}
            startLabel="Strict"
            endLabel="Imaginative"
          />
          <Slider
            label="Readability"
            description="Adjusts the complexity of the language used."
            value={state.complexity}
            onChange={(e) => setState(s => ({ ...s, complexity: parseInt(e.target.value, 10) }))}
            icon={<ComplexityIcon />}
            valueLabel={`${state.complexity}%`}
            startLabel="Simple"
            endLabel="Complex"
          />
          <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Formality</label>
              <select value={state.formality} onChange={e => setState(s => ({...s, formality: e.target.value as any}))} className="w-full p-2 bg-slate-700 rounded-md">
                  <option>Formal</option>
                  <option>Neutral</option>
                  <option>Casual</option>
              </select>
          </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Tone</label>
              <select value={state.tone} onChange={e => setState(s => ({...s, tone: e.target.value as any}))} className="w-full p-2 bg-slate-700 rounded-md">
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Direct</option>
                  <option>Narrative</option>
              </select>
          </div>
          <div className="space-y-3 pt-2">
            <Toggle
              label="Proofread"
              enabled={state.guardrails.proofread}
              onChange={(enabled) => setState(s => ({ ...s, guardrails: { ...s.guardrails, proofread: enabled } }))}
              icon={<ProofreadIcon />}
            />
            <Toggle
              label="Originality Check"
              enabled={state.guardrails.plagiarismCheck}
              onChange={(enabled) => setState(s => ({ ...s, guardrails: { ...s.guardrails, plagiarismCheck: enabled } }))}
              icon={<PlagiarismCheckIcon />}
            />
          </div>
        </div>
        
        <div className="mt-auto pt-4 space-y-2 flex-shrink-0">
            <button onClick={() => handleAction('summarize')} disabled={!!isLoading || !state.originalText} className="w-full py-2 text-sm font-semibold rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading === 'summarize' ? <Loader /> : <><SummarizeIcon /> Summarize</>}
          </button>
          <div className="flex gap-2">
              <input type="text" value={modifyPrompt} onChange={e => setModifyPrompt(e.target.value)} placeholder="e.g., turn this into a poem" className="w-full bg-slate-700 p-2 rounded-md text-sm" />
              <button onClick={() => handleAction('modify')} disabled={!!isLoading || !state.originalText || !modifyPrompt} className="px-3 py-2 text-sm font-semibold rounded-md bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
                {isLoading === 'modify' ? <Loader /> : <PenIcon />}
              </button>
          </div>
          <button onClick={() => handleAction('optimize')} disabled={!!isLoading || !state.originalText} className="w-full py-2.5 text-base font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading === 'optimize' ? <Loader /> : 'Optimize'}
          </button>
        </div>
    </aside>
  );

  return (
    <div className="flex h-full bg-slate-800 text-white">
      {/* Controls Panel - Desktop */}
      <div className="hidden md:flex">
        <ControlsPanel />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile: Single column scrollable layout */}
          <div className="md:hidden flex flex-col h-full overflow-y-auto">
              <div className="p-4 border-b border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Original Text</h3>
                    {!isControlsOpen && (
                        <button onClick={() => setIsControlsOpen(true)} className="p-2 text-slate-400 hover:text-white" title="Open Controls"><PanelLeftOpenIcon /></button>
                    )}
                  </div>
                  <textarea value={state.originalText} onChange={(e) => setState(s => ({ ...s, originalText: e.target.value }))} placeholder="Paste your text here..." className="w-full h-48 p-3 bg-slate-900/50 rounded-md resize-none focus:outline-none placeholder-slate-500" />
              </div>
              
              <div className="md:hidden">
                <ControlsPanel />
              </div>

              <div className="p-4 border-t border-slate-700">
                  <h3 className="text-lg font-medium mb-2">Results</h3>
                   {error && <div className="p-3 bg-red-900/50 text-red-300 rounded-md mb-2">{error}</div>}
                  <div className="space-y-4">
                      {state.results.map((result, index) => (
                           <div key={index} className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 relative group">
                               <h4 className="font-semibold capitalize text-indigo-400 mb-2">{result.type} Result</h4>
                               <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.content) }} />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity">
                                  <button onClick={() => copyToClipboard(result.content, index)} className="p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700" title="Copy"><CopyIcon className={copiedIndex === index ? 'text-green-400' : 'text-slate-400'} /></button>
                                  <button onClick={() => downloadResult(result)} className="p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700" title="Download"><DownloadIcon /></button>
                                  <button onClick={() => saveResultAsAsset(result)} className="p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700" title="Save as New Asset"><SaveIcon /></button>
                              </div>
                           </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Desktop: Side-by-side layout */}
          <div className="hidden md:flex flex-1 flex-row overflow-hidden">
              <div className="flex-1 p-4 flex flex-col">
                  <h3 className="text-lg font-medium mb-2 flex justify-between items-center">
                      Original Text
                      {!isControlsOpen && (
                          <button onClick={() => setIsControlsOpen(true)} className="p-2 text-slate-400 hover:text-white" title="Open Controls"><PanelLeftOpenIcon /></button>
                      )}
                  </h3>
                  <textarea value={state.originalText} onChange={(e) => setState(s => ({ ...s, originalText: e.target.value }))} placeholder="Paste your text here..." className="w-full flex-1 p-3 bg-slate-900/50 rounded-md resize-none focus:outline-none placeholder-slate-500" />
                  <div className="flex items-center justify-between pt-2">
                       <div className="flex flex-wrap gap-2">
                          {state.attachments.map((att, index) => (
                              <div key={index} className="relative">
                                  <img src={`data:${att.mimeType};base64,${att.data}`} alt={`att ${index}`} className="h-12 w-12 rounded" />
                                  <button onClick={() => removeAttachment(index)} className="absolute -top-1 -right-1 p-0.5 bg-slate-600 rounded-full"><CloseIcon className="w-3 h-3" /></button>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white"><PaperclipIcon /></button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,text/plain"/>
                  </div>
              </div>
              <div className="flex-1 p-4 flex flex-col bg-slate-800 border-l border-slate-700 overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Results</h3>
                    <button 
                        onClick={() => setIsModalOpen(true)} 
                        disabled={!state.originalText && state.results.length === 0} 
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                        title="Save entire session to a project"
                    >
                        <SaveIcon />
                        Save Project
                    </button>
                  </div>
                  {error && <div className="p-3 bg-red-900/50 text-red-300 rounded-md mb-2">{error}</div>}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
                      {state.results.map((result, index) => (
                           <div key={index} className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 group relative">
                               <h4 className="font-semibold capitalize text-indigo-400 mb-2">{result.type} Result</h4>
                               <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.content) }} />
                               <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity">
                                  <button onClick={() => copyToClipboard(result.content, index)} className="p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700" title="Copy"><CopyIcon className={copiedIndex === index ? 'text-green-400' : 'text-slate-400'} /></button>
                                  <button onClick={() => downloadResult(result)} className="p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700" title="Download"><DownloadIcon /></button>
                                  <button onClick={() => saveResultAsAsset(result)} className="p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700" title="Save as New Asset"><SaveIcon /></button>
                              </div>
                           </div>
                      ))}
                      {state.results.length === 0 && <div className="h-full flex items-center justify-center text-slate-500">Your results will appear here.</div>}
                  </div>
              </div>
          </div>
      </main>

      <SaveToProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assetType="optimizer"
        assetContent={state}
        assetNameSuggestion={`Optimizer Session - ${new Date().toLocaleDateString()}`}
      />
    </div>
  );
};

export default OptimizerView;