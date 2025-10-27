import React, { useState, useRef } from 'react';
import { translateText, generateSpeech } from '../../services/geminiService';
import { decode, decodeAudioData } from '../../utils/audio';
import Loader from '../Loader';
import { TranslatorIcon } from '../icons/TranslatorIcon';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';
import { StopIcon } from '../icons/StopIcon';
import { CopyIcon } from '../icons/CopyIcon';
import { SaveIcon } from '../icons/SaveIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { TranslatorAssetContent } from '../../utils/projects';
import { TrashIcon } from '../icons/TrashIcon';

export interface TranslatorViewState {
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
}

interface TranslatorViewProps {
    state: TranslatorViewState;
    setState: React.Dispatch<React.SetStateAction<TranslatorViewState>>;
}

const languages = {
  'auto': 'Auto-detect', 'en': 'English', 'es': 'Spanish', 'fr': 'French',
  'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian',
  'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese (Simplified)'
};

type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused';

const TranslatorView: React.FC<TranslatorViewProps> = ({ state, setState }) => {
    const { sourceText, translatedText, sourceLang, targetLang } = state;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    // --- Advanced Audio State ---
    const [sourceAudio, setSourceAudio] = useState<{ status: AudioStatus }>({ status: 'idle' });
    const [targetAudio, setTargetAudio] = useState<{ status: AudioStatus }>({ status: 'idle' });
    
    const sourceAudioContextRef = useRef<AudioContext | null>(null);
    const sourceAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const targetAudioContextRef = useRef<AudioContext | null>(null);
    const targetAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const createAudioHandler = (
      type: 'source' | 'target',
      stateSetter: React.Dispatch<React.SetStateAction<{ status: AudioStatus }>>,
      contextRef: React.MutableRefObject<AudioContext | null>,
      sourceRef: React.MutableRefObject<AudioBufferSourceNode | null>
    ) => {
      const cleanup = () => {
        if (sourceRef.current) {
          sourceRef.current.onended = null;
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (contextRef.current) {
          contextRef.current.close().catch(console.error);
          contextRef.current = null;
        }
        stateSetter({ status: 'idle' });
      };

      const stop = () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) {}
        }
        cleanup();
      };
      
      const play = async (text: string) => {
        const otherType = type === 'source' ? 'target' : 'source';
        // Stop the other audio player if it's running
        if (otherType === 'source') handleSourceStop(); else handleTargetStop();

        if (sourceAudio.status === 'playing' && contextRef.current) {
            await contextRef.current.suspend();
            stateSetter({ status: 'paused' });
            return;
        }
        if (sourceAudio.status === 'paused' && contextRef.current) {
            await contextRef.current.resume();
            stateSetter({ status: 'playing' });
            return;
        }

        stop();
        stateSetter({ status: 'loading' });
        try {
            const audioB64 = await generateSpeech(text);
            contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await decodeAudioData(decode(audioB64), contextRef.current, 24000, 1);
            sourceRef.current = contextRef.current.createBufferSource();
            sourceRef.current.buffer = audioBuffer;
            sourceRef.current.connect(contextRef.current.destination);
            sourceRef.current.onended = cleanup;
            sourceRef.current.start();
            stateSetter({ status: 'playing' });
        } catch (e) {
            setError("Speech generation failed.");
            cleanup();
        }
      };
      return { play, stop };
    };
    
    const { play: handleSourcePlay, stop: handleSourceStop } = createAudioHandler('source', setSourceAudio, sourceAudioContextRef, sourceAudioSourceRef);
    const { play: handleTargetPlay, stop: handleTargetStop } = createAudioHandler('target', setTargetAudio, targetAudioContextRef, targetAudioSourceRef);

    const stopAllAudio = () => {
      handleSourceStop();
      handleTargetStop();
    };

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;
        setIsLoading(true);
        setError(null);
        stopAllAudio();
        setState(s => ({ ...s, translatedText: '' }));

        try {
            const result = await translateText(sourceText, languages[sourceLang as keyof typeof languages], languages[targetLang as keyof typeof languages]);
            setState(s => ({ ...s, translatedText: result }));
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopyToClipboard = (text: string) => {
        if (text) navigator.clipboard.writeText(text);
    };

    const renderAudioControls = (
        type: 'source' | 'target',
        text: string,
        state: { status: AudioStatus },
        playHandler: (text: string) => void,
        stopHandler: () => void
    ) => (
        <div className="flex items-center gap-1">
            <button onClick={() => playHandler(text)} disabled={!text || state.status === 'loading'} className="p-1 text-gray-300 hover:text-white disabled:text-gray-600" title={state.status === 'playing' ? 'Pause' : 'Play'}>
                {state.status === 'loading' && <Loader />}
                {state.status === 'playing' && <PauseIcon />}
                {(state.status === 'idle' || state.status === 'paused') && <PlayIcon />}
            </button>
            <button onClick={stopHandler} disabled={state.status === 'idle' || state.status === 'loading'} className="p-1 text-gray-300 hover:text-white disabled:text-gray-600" title="Stop">
                <StopIcon />
            </button>
        </div>
    );

    return (
        <>
        <div className="flex flex-col h-full">
            <div className="p-3 sm:p-4 border-b border-slate-700 bg-slate-800 rounded-t-lg flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2"><TranslatorIcon /> AI Translator</h2>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-700">
                {/* Source */}
                <div className="bg-slate-800 p-3 sm:p-4 flex flex-col">
                    <select value={sourceLang} onChange={e => setState(s => ({...s, sourceLang: e.target.value}))} className="bg-slate-700 text-white text-sm rounded-md p-2 mb-2 self-start border-0 focus:ring-2 focus:ring-indigo-500">
                        {Object.entries(languages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </select>
                    <textarea 
                        value={sourceText} 
                        onChange={e => setState(s => ({...s, sourceText: e.target.value}))}
                        placeholder="Enter text..."
                        className="w-full flex-1 bg-slate-900 text-gray-200 p-3 rounded-md border border-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="pt-2 flex items-center justify-end gap-3">
                         <button onClick={() => setState(s => ({...s, sourceText: ''}))} disabled={!sourceText} className="text-gray-300 hover:text-white disabled:text-gray-600"><TrashIcon /></button>
                         <button onClick={() => handleCopyToClipboard(sourceText)} disabled={!sourceText} className="text-gray-300 hover:text-white disabled:text-gray-600"><CopyIcon /></button>
                         {renderAudioControls('source', sourceText, sourceAudio, handleSourcePlay, handleSourceStop)}
                    </div>
                </div>

                {/* Target */}
                <div className="bg-slate-800 p-3 sm:p-4 flex flex-col">
                    <select value={targetLang} onChange={e => setState(s => ({...s, targetLang: e.target.value}))} className="bg-slate-700 text-white text-sm rounded-md p-2 mb-2 self-start border-0 focus:ring-2 focus:ring-indigo-500">
                        {Object.entries(languages).filter(([k]) => k !== 'auto').map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </select>
                     <div className="w-full flex-1 bg-slate-900 text-gray-200 p-3 rounded-md border border-slate-600 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader />
                            </div>
                        ) : error ? (
                            <div className="text-red-400">{error}</div>
                        ) : (
                            <p className="whitespace-pre-wrap">{translatedText}</p>
                        )}
                    </div>
                     <div className="pt-2 flex items-center justify-end gap-3">
                         <button onClick={() => setIsSaveModalOpen(true)} disabled={!translatedText} className="text-gray-300 hover:text-white disabled:text-gray-600"><SaveIcon /></button>
                         <button onClick={() => handleCopyToClipboard(translatedText)} disabled={!translatedText} className="text-gray-300 hover:text-white disabled:text-gray-600"><CopyIcon /></button>
                         {renderAudioControls('target', translatedText, targetAudio, handleTargetPlay, handleTargetStop)}
                    </div>
                </div>
            </div>
             <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800 rounded-b-lg">
                <button onClick={handleTranslate} disabled={isLoading || !sourceText.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-indigo-900/50 flex items-center justify-center gap-2">
                    {isLoading ? <><Loader /> Translating...</> : 'Translate'}
                </button>
            </div>
        </div>
        {isSaveModalOpen && (
            <SaveToProjectModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                assetType="translator"
                assetContent={{
                    sourceText,
                    translatedText,
                    sourceLang,
                    targetLang
                } as TranslatorAssetContent}
                assetNameSuggestion={`Translation - ${sourceText.substring(0, 30)}...`}
            />
        )}
        </>
    );
};

export default TranslatorView;