
import React, { useState, useEffect, useRef } from 'react';
import { OptimizerViewState, OptimizerResult } from '../../utils/projects';
import { optimizeText, summarizeText, modifyText } from '../../services/geminiService';
import { renderMarkdown } from '../../utils/rendering';
import Slider from '../Slider';
import Loader from '../Loader';
import SaveToProjectModal from '../SaveToProjectModal';
import { SaveIcon } from '../icons/SaveIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { ComplexityIcon } from '../icons/ComplexityIcon';
import { BookIcon } from '../icons/BookIcon';
import { PanelLeftCloseIcon } from '../icons/PanelLeftCloseIcon';
import { PanelLeftOpenIcon } from '../icons/PanelLeftOpenIcon';
import { SummarizeIcon } from '../icons/SummarizeIcon';
import { PenIcon } from '../icons/PenIcon';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { fileToBase64 } from '../../utils/image';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { ChatIcon } from '../icons/ChatIcon';

interface OptimizerViewProps {
  state: OptimizerViewState;
  setState: React.Dispatch<React.SetStateAction<OptimizerViewState>>;
  setViewContext: (context: string) => void;
  onSidebarToggle: () => void;
  onChatToggle: () => void;
}

const OptimizerView: React.FC<OptimizerViewProps> = ({ state, setState, setViewContext, onSidebarToggle, onChatToggle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setViewContext(`User is in the Content Optimizer. Current text: ${state.originalText.substring(0, 100)}`);
  }, [state.originalText, setViewContext]);

  const handleAction = async (actionType: OptimizerResult['type']) => {
    if (!state.originalText.trim()) return;
    if (actionType === 'modification' && !modifyPrompt.trim()) return;

    setIsLoading(true);
    setError('');

    try {
        let response;
        if (actionType === 'optimization') {
            response = await optimizeText(state.originalText, state.options);
        } else if (actionType === 'summary') {
            response = await summarizeText(state.originalText);
        } else { // modification
            response = await modifyText(state.originalText, modifyPrompt);
        }

        const newResult: OptimizerResult = {
            type: actionType,
            content: response.text,
            prompt: actionType === 'modification' ? modifyPrompt : undefined,
        };

        setState(s => ({ ...s, results: [newResult, ...s.results] }));
        if (actionType === 'modification') setModifyPrompt('');

    } catch (err: any) {
        setError(err.message || `An error occurred during the ${actionType} action.`);
    } finally {
        setIsLoading(false);
    }
  };

  const setOption = <K extends keyof OptimizerViewState['options']>(key: K, value: OptimizerViewState['options'][K]) => {
    setState(s => ({ ...s, options: { ...s.options, [key]: value } }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const base64Data = await fileToBase64(file);
        setState(s => ({ ...s, attachments: [...s.attachments, { data: base64Data, mimeType: file.type }] }));
    } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        setState(s => ({ ...s, originalText: s.originalText ? `${s.originalText}\n\n${textContent}` : textContent }));
    }
  };

  const removeAttachment = (index: number) => {
    setState(s => ({ ...s, attachments: s.attachments.filter((_, i) => i !== index) }));
  };
  
  const ControlsPanel = () => (
    <div className="p-4 space-y-6 flex flex-col h-full">
        <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold">Optimizer Controls</h2>
             <button onClick={() => setIsControlsOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">
                 <PanelLeftCloseIcon />
             </button>
        </div>
      
        <Slider
            label="Creativity"
            description="Controls how much the AI can deviate from the source text."
            value={state.options.creativity}
            onChange={(e) => setOption('creativity', parseInt(e.target.value))}
            icon={<SparkleIcon />}
            valueLabel={`${state.options.creativity}%`}
            startLabel="Strict"
            endLabel="Imaginative"
        />
        <Slider
            label="Readability"
            description="Adjusts the complexity of the language used."
            value={state.options.readability}
            onChange={(e) => setOption('readability', parseInt(e.target.value))}
            icon={<BookIcon />}
            valueLabel={`${state.options.readability}%`}
            startLabel="Simple"
            endLabel="Complex"
        />
        <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Formality</label>
            <input type="text" value={state.options.formality} onChange={e => setOption('formality', e.target.value as any)} placeholder="e.g., neutral" className="w-full p-2 bg-slate-700 rounded-md border border-slate-600" />
        </div>
        <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Tone</label>
            <input type="text" value={state.options.tone} onChange={e => setOption('tone', e.target.value as any)} placeholder="e.g., professional" className="w-full p-2 bg-slate-700 rounded-md border border-slate-600" />
        </div>
        
        <div className="mt-auto pt-4 space-y-3">
             <button onClick={() => handleAction('summary')} disabled={isLoading} className="w-full py-2.5 text-base font-semibold rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <SummarizeIcon /> Summarize
            </button>
             <div className="flex gap-2">
                <input type="text" value={modifyPrompt} onChange={e => setModifyPrompt(e.target.value)} placeholder="e.g., turn this into a poem" className="flex-grow bg-slate-700 rounded-md px-3 py-1.5 text-sm" />
                <button onClick={() => handleAction('modification')} disabled={isLoading || !modifyPrompt} className="p-2.5 rounded-md bg-purple-600 hover:bg-purple-700 disabled:opacity-50"><PenIcon /></button>
            </div>
            <button onClick={() => handleAction('optimization')} disabled={isLoading} className="w-full py-2.5 text-base font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <Loader/> : 'Optimize'}
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex h-full bg-slate-800 text-white">
      {/* Controls Panel (Desktop) */}
      <aside className={`flex-shrink-0 bg-slate-900 border-r border-slate-700 transition-all duration-300 overflow-hidden ${isControlsOpen ? 'w-80' : 'w-0'} hidden md:block`}>
          <ControlsPanel />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden p-2 flex justify-between items-center border-b border-slate-700">
             <button onClick={onSidebarToggle} className="p-2"><HamburgerIcon /></button>
             <h1 className="font-semibold">Content Optimizer</h1>
             <button onClick={onChatToggle} className="p-2"><ChatIcon /></button>
        </header>

        {/* Content Layout: Mobile (Column) vs Desktop (Row) */}
        <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-px bg-slate-700 overflow-y-auto">
            {/* Original Text */}
            <div className="flex flex-col bg-slate-800 p-4">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-semibold flex items-center gap-2">
                        {!isControlsOpen && (
                             <button onClick={() => setIsControlsOpen(true)} className="hidden md:inline-block p-1 text-slate-400 hover:text-white"><PanelLeftOpenIcon /></button>
                        )}
                        Original Text
                     </h3>
                     <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white"><PaperclipIcon/></button>
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*, .txt"/>
                 </div>
                 <textarea
                    value={state.originalText}
                    onChange={(e) => setState(s => ({ ...s, originalText: e.target.value }))}
                    placeholder="Enter your text here..."
                    className="w-full flex-1 p-3 bg-slate-900 rounded-md resize-none border border-transparent focus:border-indigo-500 focus:outline-none placeholder-slate-500"
                 />
                 {state.attachments.length > 0 && (
                     <div className="mt-2 flex flex-wrap gap-2">
                         {state.attachments.map((att, i) => (
                             <div key={i} className="relative">
                                <img src={`data:${att.mimeType};base64,${att.data}`} className="h-12 w-12 rounded object-cover"/>
                                <button onClick={() => removeAttachment(i)} className="absolute -top-1 -right-1 bg-slate-600 rounded-full p-0.5"><CloseIcon className="w-3 h-3"/></button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>

            {/* Controls Panel (Mobile) */}
            <div className="md:hidden bg-slate-900 border-t border-b border-slate-700">
                {isControlsOpen ? <ControlsPanel/> : (
                    <button onClick={() => setIsControlsOpen(true)} className="w-full p-3 text-center font-semibold">Show Optimizer Controls</button>
                )}
            </div>
            
            {/* Results */}
            <div className="flex flex-col bg-slate-800 p-4">
                 <h3 className="text-lg font-semibold mb-2">Optimized Results</h3>
                 {error && <p className="text-red-400 p-2 bg-red-900/50 rounded-md mb-2">{error}</p>}
                 <div className="w-full flex-1 bg-slate-900 rounded-md overflow-y-auto space-y-4 p-3">
                     {state.results.length === 0 && <p className="text-slate-500 text-center pt-8">Your results will appear here.</p>}
                     {state.results.map((result, i) => (
                         <div key={i} className="border border-slate-700 rounded-md p-3">
                             <h4 className="font-semibold capitalize text-indigo-400 mb-1">{result.type}</h4>
                             {result.prompt && <p className="text-xs italic text-slate-400 mb-2">Instruction: "{result.prompt}"</p>}
                             <div
                                className="prose prose-invert prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(result.content) }}
                             />
                         </div>
                     ))}
                 </div>
            </div>
        </div>
      </div>
      <SaveToProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          assetType="optimizer"
          assetContent={state}
          assetNameSuggestion={`Optimized Content - ${new Date().toLocaleDateString()}`}
        />
    </div>
  );
};

export default OptimizerView;