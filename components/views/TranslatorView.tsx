import React, { useState, useEffect, useRef } from 'react';
import { TranslatorViewState } from '../../utils/projects';
import { translateText, textToSpeech } from '../../services/geminiService';
import { playAudio } from '../../utils/audio';
import Loader from '../Loader';
import { SaveIcon } from '../icons/SaveIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { CopyIcon } from '../icons/CopyIcon';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { ChatIcon } from '../icons/ChatIcon';

interface TranslatorViewProps {
  state: TranslatorViewState;
  setState: React.Dispatch<React.SetStateAction<TranslatorViewState>>;
  setViewContext: (context: string) => void;
  onSidebarToggle: () => void;
  onChatToggle: () => void;
}

const languages = {
    "af": "Afrikaans", "ar": "Arabic", "bn": "Bengali", "bg": "Bulgarian", "ca": "Catalan",
    "zh": "Chinese", "hr": "Croatian", "cs": "Czech", "da": "Danish", "nl": "Dutch",
    "en": "English", "et": "Estonian", "fil": "Filipino", "fi": "Finnish", "fr": "French",
    "de": "German", "el": "Greek", "gu": "Gujarati", "he": "Hebrew", "hi": "Hindi",
    "hu": "Hungarian", "is": "Icelandic", "id": "Indonesian", "it": "Italian", "ja": "Japanese",
    "kn": "Kannada", "ko": "Korean", "lv": "Latvian", "lt": "Lithuanian", "ms": "Malay",
    "ml": "Malayalam", "mr": "Marathi", "no": "Norwegian", "pl": "Polish", "pt": "Portuguese",
    "ro": "Romanian", "ru": "Russian", "sr": "Serbian", "sk": "Slovak", "sl": "Slovenian",
    "es": "Spanish", "sw": "Swahili", "sv": "Swedish", "ta": "Tamil", "te": "Telugu",
    "th": "Thai", "tr": "Turkish", "uk": "Ukrainian", "ur": "Urdu", "vi": "Vietnamese"
};


const TranslatorView: React.FC<TranslatorViewProps> = ({ state, setState, setViewContext, onSidebarToggle, onChatToggle }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioSourceRef.current?.stop();
            audioContextRef.current?.close();
        }
    }, []);

    useEffect(() => {
        setViewContext(`Translating from ${state.sourceLang} to ${state.targetLang}.`);
    }, [state.sourceLang, state.targetLang, setViewContext]);


    const handleTranslate = async () => {
        if (!state.sourceText.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const result = await translateText(state.sourceText, state.sourceLang, state.targetLang);
            setState(s => ({ ...s, translatedText: result }));
        } catch (err: any) {
            setError(err.message || 'An error occurred during translation.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTextToSpeech = async () => {
        if (!state.translatedText.trim() || !audioContextRef.current) return;
        if (isSpeaking && audioSourceRef.current) {
            audioSourceRef.current.stop();
            setIsSpeaking(false);
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            // Fix: Resume AudioContext on user gesture, as required by modern browsers.
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            const base64Audio = await textToSpeech(state.translatedText);
            const source = await playAudio(base64Audio, audioContextRef.current, () => setIsSpeaking(false));
            audioSourceRef.current = source;
            setIsSpeaking(true);
        } catch (err: any) {
            setError(err.message || 'Failed to generate speech.');
            setIsSpeaking(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!state.translatedText) return;
        navigator.clipboard.writeText(state.translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 md:p-8 flex flex-col h-full bg-slate-800 text-white">
             {/* Mobile Header */}
            <header className="md:hidden p-2 flex justify-between items-center mb-4 flex-shrink-0">
                <button onClick={onSidebarToggle} className="p-2"><HamburgerIcon /></button>
                <h1 className="font-semibold">Translator</h1>
                <button onClick={onChatToggle} className="p-2"><ChatIcon /></button>
            </header>
            
            <header className="flex-shrink-0 mb-6 justify-between items-center hidden md:flex">
                <h1 className="text-2xl font-bold">Translator</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={!state.sourceText && !state.translatedText}
                    className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <SaveIcon /> Save
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                {/* Source */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="source-lang" className="text-slate-400">From:</label>
                        <select
                            id="source-lang"
                            value={state.sourceLang}
                            onChange={(e) => setState(s => ({ ...s, sourceLang: e.target.value }))}
                            className="bg-slate-700 p-1 rounded-md border border-slate-600 focus:outline-none"
                        >
                            <option value="auto">Auto-detect</option>
                            {Object.entries(languages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                        </select>
                    </div>
                    <textarea
                        value={state.sourceText}
                        onChange={(e) => setState(s => ({ ...s, sourceText: e.target.value }))}
                        placeholder="Enter text to translate..."
                        className="w-full flex-1 p-3 bg-slate-900 border border-slate-700 rounded-md resize-none focus:outline-none placeholder-slate-500 text-slate-300"
                    />
                </div>
                {/* Target */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                         <label htmlFor="target-lang" className="text-slate-400">To:</label>
                        <select
                            id="target-lang"
                            value={state.targetLang}
                            onChange={(e) => setState(s => ({ ...s, targetLang: e.target.value }))}
                             className="bg-slate-700 p-1 rounded-md border border-slate-600 focus:outline-none"
                        >
                             {Object.entries(languages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                        </select>
                    </div>
                     <div className="w-full flex-1 p-3 bg-slate-900 border border-slate-700 rounded-md relative text-slate-300">
                         {state.translatedText}
                         <div className="absolute bottom-2 right-2 flex gap-2">
                             <button onClick={handleTextToSpeech} disabled={!state.translatedText.trim()} className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-50">
                                 <SpeakerIcon isSpeaking={isSpeaking} />
                             </button>
                             <button onClick={handleCopy} disabled={!state.translatedText.trim()} className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-50">
                                 <CopyIcon className={copied ? 'text-green-400' : ''} />
                             </button>
                         </div>
                     </div>
                </div>
            </div>

            <footer className="mt-6 flex-shrink-0 text-center">
                 {error && <p className="text-red-400 mb-4">{error}</p>}
                <button
                    onClick={handleTranslate}
                    disabled={isLoading || !state.sourceText.trim()}
                    className="px-8 py-3 w-full sm:w-auto rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center disabled:bg-indigo-900"
                >
                    {isLoading ? <Loader /> : 'Translate'}
                </button>
            </footer>
             <SaveToProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assetType="translator"
                assetContent={state}
                assetNameSuggestion={`Translation - ${new Date().toLocaleDateString()}`}
            />
        </div>
    );
};

export default TranslatorView;