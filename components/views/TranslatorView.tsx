
import React, { useState, useEffect } from 'react';
import { translateText } from '../../services/geminiService';
import { TranslatorState } from '../../utils/projects';
import Loader from '../Loader';
import { SaveIcon } from '../icons/SaveIcon';
import { CopyIcon } from '../icons/CopyIcon';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { ChatIcon } from '../icons/ChatIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import SaveToProjectModal from '../SaveToProjectModal';

interface TranslatorViewProps {
  state: TranslatorState;
  setState: React.Dispatch<React.SetStateAction<TranslatorState>>;
  setViewContext: (context: string) => void;
  onSidebarToggle: () => void;
  onChatToggle: () => void;
}

// A simple list of common languages.
const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

const TranslatorView: React.FC<TranslatorViewProps> = ({ state, setState, setViewContext, onSidebarToggle, onChatToggle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setViewContext(`User is in the Translator, translating from ${state.fromLang} to ${state.toLang}.`);
  }, [state.fromLang, state.toLang, setViewContext]);

  const handleTranslate = async () => {
    if (!state.fromText.trim()) return;

    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const translated = await translateText(state.fromText, state.fromLang, state.toLang);
      setState(s => ({ ...s, toText: translated }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message || 'An error occurred during translation.' }));
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  };
  
  const handleSwapLanguages = () => {
      setState(s => ({
          ...s,
          fromLang: s.toLang,
          toLang: s.fromLang,
          fromText: s.toText,
          toText: s.fromText
      }));
  };

  const copyToClipboard = () => {
    if(!state.toText) return;
    navigator.clipboard.writeText(state.toText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 text-white">
        {/* Mobile Header */}
        <header className="md:hidden p-2 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
            <button onClick={onSidebarToggle} className="p-2"><HamburgerIcon /></button>
            <h1 className="font-semibold">Translator</h1>
            <button onClick={onChatToggle} className="p-2"><ChatIcon /></button>
        </header>

        <header className="hidden md:flex flex-shrink-0 p-4 border-b border-slate-700 justify-between items-center">
            <h1 className="text-xl font-semibold">Translator</h1>
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={!state.fromText && !state.toText}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
                <SaveIcon />
                Save Translation
            </button>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
            {/* From Language */}
            <div className="flex-1 flex flex-col bg-slate-900 rounded-lg p-4">
                 <select
                    value={state.fromLang}
                    onChange={(e) => setState(s => ({...s, fromLang: e.target.value}))}
                    className="mb-2 bg-slate-800 p-2 rounded-md self-start"
                >
                    {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
                <textarea
                    value={state.fromText}
                    onChange={(e) => setState(s => ({...s, fromText: e.target.value}))}
                    placeholder="Enter text..."
                    className="w-full flex-1 p-3 bg-slate-700/50 rounded-md resize-none focus:outline-none placeholder-slate-500 text-slate-300"
                />
            </div>
            
            {/* Swap and Translate Button */}
            <div className="flex items-center justify-center">
                <button onClick={handleSwapLanguages} className="p-2 rounded-full hover:bg-slate-700 rotate-90 md:rotate-0" title="Swap languages">
                    <RefreshIcon />
                </button>
            </div>

            {/* To Language */}
             <div className="flex-1 flex flex-col bg-slate-900 rounded-lg p-4 relative">
                <div className="flex justify-between items-center mb-2">
                    <select
                        value={state.toLang}
                        onChange={(e) => setState(s => ({...s, toLang: e.target.value}))}
                        className="bg-slate-800 p-2 rounded-md"
                    >
                        {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
                     <button onClick={copyToClipboard} className="p-2 rounded-full hover:bg-slate-800" title="Copy">
                        <CopyIcon className={copied ? 'text-green-400' : 'text-slate-400'}/>
                    </button>
                </div>
                 <div className="w-full flex-1 p-3 bg-slate-700/50 rounded-md resize-none focus:outline-none text-slate-300 overflow-y-auto">
                    {state.isLoading ? <div className="flex justify-center items-center h-full"><Loader/></div> : <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{state.toText}</div>}
                </div>
                {state.error && <p className="text-red-400 text-xs mt-2">{state.error}</p>}
             </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex-shrink-0">
            <button
                onClick={handleTranslate}
                disabled={state.isLoading || !state.fromText.trim()}
                className="w-full max-w-xs mx-auto py-2.5 text-base font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {state.isLoading ? <Loader /> : 'Translate'}
            </button>
        </div>

        <SaveToProjectModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            assetType="translator"
            assetContent={state}
            assetNameSuggestion={`Translation ${state.fromLang} to ${state.toLang} - ${new Date().toLocaleDateString()}`}
        />
    </div>
  );
};

export default TranslatorView;
