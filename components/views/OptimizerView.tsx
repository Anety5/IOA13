import React, { useState, useRef } from 'react';
import { generateText, refineText, RefinementType, translateText, generateSpeech } from '../../services/geminiService';
import { playAudio, decode, decodeAudioData } from '../../utils/audio';
import Loader from '../Loader';
import Slider from '../Slider';
import Toggle from '../Toggle';
import { SparkleIcon } from '../icons/SparkleIcon';
import { ComplexityIcon } from '../icons/ComplexityIcon';
import { ShieldIcon } from '../icons/ShieldIcon';
import { EducationIcon } from '../icons/EducationIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { SummarizeIcon } from '../icons/SummarizeIcon';
import { ProofreadIcon } from '../icons/ProofreadIcon';
import { CopyIcon } from '../icons/CopyIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { ShareIcon } from '../icons/ShareIcon';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';
import { StopIcon } from '../icons/StopIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { OptimizerAssetContent } from '../../utils/projects';

const languages = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French',
  'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian',
  'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese (Simplified)'
};

export interface OptimizerViewState {
  inputText: string;
  outputText: string;
  creativity: number;
  complexity: number;
  plagiarismGuard: boolean;
  educationLevel: 'general' | 'k12' | 'university';
  activeTask: 'optimize' | 'summarize' | 'proofread';
}

interface OptimizerViewProps {
  state: OptimizerViewState;
  setState: React.Dispatch<React.SetStateAction<OptimizerViewState>>;
}

const OptimizerView: React.FC<OptimizerViewProps> = ({ state, setState }) => {
  const { inputText, outputText, creativity, complexity, plagiarismGuard, educationLevel, activeTask } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [translatedOutput, setTranslatedOutput] = useState<{ lang: string; text: string } | null>(null);
  const [targetLang, setTargetLang] = useState('es');
  const [isSpeaking, setIsSpeaking] = useState<'original' | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const getAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // State and refs for advanced translated audio playback
  const [translatedAudioState, setTranslatedAudioState] = useState<{ status: 'idle' | 'loading' | 'playing' | 'paused' }>({ status: 'idle' });
  const translatedAudioContextRef = useRef<AudioContext | null>(null);
  const translatedAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const cleanupTranslatedAudio = () => {
    if (translatedAudioSourceRef.current) {
      translatedAudioSourceRef.current.onended = null;
      translatedAudioSourceRef.current.disconnect();
      translatedAudioSourceRef.current = null;
    }
    if (translatedAudioContextRef.current) {
      translatedAudioContextRef.current.close().catch(console.error);
      translatedAudioContextRef.current = null;
    }
    setTranslatedAudioState({ status: 'idle' });
  };

  const handleStopTranslatedAudio = () => {
    if (translatedAudioSourceRef.current) {
      try {
        translatedAudioSourceRef.current.stop(); // This triggers 'onended' which calls cleanupAudio
      } catch (e) {
        console.warn("Error stopping audio, may have already stopped.", e);
        cleanupTranslatedAudio();
      }
    } else {
      cleanupTranslatedAudio();
    }
  };

  const handlePlaybackControl = async (text: string) => {
    // Pause
    if (translatedAudioState.status === 'playing' && translatedAudioContextRef.current) {
      await translatedAudioContextRef.current.suspend();
      setTranslatedAudioState({ status: 'paused' });
      return;
    }

    // Resume
    if (translatedAudioState.status === 'paused' && translatedAudioContextRef.current) {
      await translatedAudioContextRef.current.resume();
      setTranslatedAudioState({ status: 'playing' });
      return;
    }

    // Play
    if (translatedAudioState.status === 'idle') {
      handleStopTranslatedAudio();
      setTranslatedAudioState({ status: 'loading' });
      setError(null);
      try {
        const audioB64 = await generateSpeech(text);
        translatedAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioData = decode(audioB64);
        const audioBuffer = await decodeAudioData(audioData, translatedAudioContextRef.current, 24000, 1);
        translatedAudioSourceRef.current = translatedAudioContextRef.current.createBufferSource();
        translatedAudioSourceRef.current.buffer = audioBuffer;
        translatedAudioSourceRef.current.connect(translatedAudioContextRef.current.destination);
        translatedAudioSourceRef.current.onended = cleanupTranslatedAudio;
        translatedAudioSourceRef.current.start();
        setTranslatedAudioState({ status: 'playing' });
      } catch (e) {
        setError("Speech generation failed.");
        console.error(e);
        cleanupTranslatedAudio();
      }
    }
  };
  
  const runGeneration = async (isRegeneration = false, taskOverride?: OptimizerViewState['activeTask']) => {
    if (!inputText.trim()) {
      setError('Input text cannot be empty.');
      return;
    }

    const taskToRun = isRegeneration ? activeTask : taskOverride;
    if (!taskToRun) {
      setError("An action must be selected.");
      return;
    }
    
    if (isRegeneration && !outputText) {
      setError("Nothing to regenerate. Please generate some text first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    handleStopTranslatedAudio();
    
    if (!isRegeneration) {
      setState(s => ({ ...s, outputText: '', activeTask: taskToRun }));
    } else {
      setState(s => ({ ...s, outputText: '' }));
    }
    setTranslatedOutput(null);

    try {
      const result = await generateText(inputText, {
        task: taskToRun,
        creativity,
        complexity,
        plagiarism_guard: plagiarismGuard,
        education_level: educationLevel
      });
      setState(s => ({ ...s, outputText: result }));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskExecution = (task: OptimizerViewState['activeTask']) => {
    runGeneration(false, task);
  };

  const handleRefine = async (refinementType: RefinementType) => {
    if (!outputText.trim()) return;

    setIsLoading(true);
    setError(null);
    const textToRefine = outputText;
    handleStopTranslatedAudio();
    setTranslatedOutput(null);

    try {
      const result = await refineText(textToRefine, refinementType);
      setState(s => ({ ...s, inputText: textToRefine, outputText: result }));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!outputText.trim()) return;
    setIsLoading(true);
    handleStopTranslatedAudio();
    try {
      const result = await translateText(outputText, 'auto', languages[targetLang as keyof typeof languages]);
      setTranslatedOutput({ lang: languages[targetLang as keyof typeof languages], text: result });
    } catch (e) {
      setError("Translation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (!text || isSpeaking) return;
    setIsSpeaking('original');
    try {
      const audioB64 = await generateSpeech(text);
      await playAudio(audioB64, getAudioContext(), () => setIsSpeaking(null));
    } catch (e) {
      setError("Speech generation failed.");
      setIsSpeaking(null);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share && outputText) {
      try {
        await navigator.share({
          title: 'AI Optimized Text',
          text: outputText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyToClipboard(outputText);
      alert('Sharing not supported on this browser. Text copied to clipboard instead.');
    }
  };

  const getComplexityLabel = (value: number) => {
    if (value < 34) return 'Simple';
    if (value < 67) return 'Standard';
    return 'Advanced';
  };

  const tasks = [
    { id: 'optimize', label: 'Optimize', icon: <BrainCircuitIcon /> },
    { id: 'summarize', label: 'Summarize', icon: <SummarizeIcon /> },
    { id: 'proofread', label: 'Proofread', icon: <ProofreadIcon /> },
  ] as const;
  
  const refinementTasks: { id: RefinementType; label: string }[] = [
    { id: 'shorter', label: 'Make Shorter' },
    { id: 'humor', label: 'Add Humor' },
    { id: 'professional', label: 'More Professional' },
    { id: 'simple', label: 'Simplify' },
  ];

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-full">
      {/* Left Panel: Input & Controls */}
      <div className="flex flex-col bg-slate-800 p-3 sm:p-4 rounded-lg border border-slate-700 h-full">
        <div className="flex-1 flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-3">Input</h2>
            <textarea
            placeholder="Enter your text here..."
            value={inputText}
            onChange={(e) => setState(s => ({ ...s, inputText: e.target.value }))}
            className="w-full flex-1 bg-slate-900 text-gray-200 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
        </div>
      </div>

      {/* Right Panel: Output & Settings */}
      <div className="flex flex-col gap-4 bg-slate-800 p-3 sm:p-4 rounded-lg border border-slate-700">
        <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Output</h2>
                    <button onClick={() => handleSpeak(outputText)} disabled={!outputText || !!isSpeaking} className="text-gray-300 hover:text-white disabled:text-gray-600" title="Read Aloud"><SpeakerIcon isSpeaking={isSpeaking === 'original'} /></button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleCopyToClipboard(outputText)} disabled={!outputText} className="text-gray-300 hover:text-white disabled:text-gray-600" title="Copy to Clipboard"><CopyIcon /></button>
                    <button onClick={handleShare} disabled={!outputText} className="text-gray-300 hover:text-white disabled:text-gray-600" title="Share"><ShareIcon /></button>
                    <button onClick={() => setIsSaveModalOpen(true)} disabled={!outputText} className="text-gray-300 hover:text-white disabled:text-gray-600" title="Save to Project"><SaveIcon /></button>
                </div>
            </div>
            <div className="w-full flex-1 bg-slate-900 text-gray-200 p-3 rounded-md border border-slate-600 overflow-y-auto">
                {isLoading && !outputText ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-2">
                            <Loader />
                            <p className="text-sm text-gray-400">Generating...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-red-400">{error}</div>
                ) : (
                    <>
                        <p className="whitespace-pre-wrap">{outputText}</p>
                        {translatedOutput && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-semibold text-gray-400">Translation ({translatedOutput.lang})</h4>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handlePlaybackControl(translatedOutput.text)} disabled={translatedAudioState.status === 'loading'} className="p-1 text-gray-300 hover:text-white disabled:text-gray-600" title={translatedAudioState.status === 'playing' ? 'Pause' : 'Play'}>
                                            {translatedAudioState.status === 'loading' && <Loader />}
                                            {translatedAudioState.status === 'playing' && <PauseIcon />}
                                            {(translatedAudioState.status === 'idle' || translatedAudioState.status === 'paused') && <PlayIcon />}
                                        </button>
                                         <button onClick={handleStopTranslatedAudio} disabled={translatedAudioState.status === 'idle' || translatedAudioState.status === 'loading'} className="p-1 text-gray-300 hover:text-white disabled:text-gray-600" title="Stop">
                                            <StopIcon />
                                        </button>
                                    </div>
                                </div>
                                <p className="whitespace-pre-wrap text-gray-300">{translatedOutput.text}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-3">Controls</h3>
            <div className="space-y-4">
                <Slider 
                    label="Creativity" 
                    value={creativity} 
                    onChange={e => setState(s => ({ ...s, creativity: parseInt(e.target.value, 10) }))} 
                    icon={<SparkleIcon />} 
                    valueLabel={`${creativity}%`}
                    description="Adjusts how imaginative and stylistic the response is."
                />
                <Slider 
                    label="Language Level" 
                    value={complexity} 
                    onChange={e => setState(s => ({ ...s, complexity: parseInt(e.target.value, 10) }))} 
                    icon={<ComplexityIcon />} 
                    valueLabel={getComplexityLabel(complexity)}
                    description="Controls the sophistication of vocabulary and sentences."
                />
                <Toggle 
                    label="Originality Check" 
                    enabled={plagiarismGuard} 
                    onChange={val => setState(s => ({ ...s, plagiarismGuard: val }))} 
                    icon={<ShieldIcon />} 
                />
                
                <div className="flex items-center justify-between bg-slate-900/70 p-2 sm:p-3 rounded-lg border border-slate-700">
                    <label className="flex items-center text-sm font-medium text-gray-300">
                        <EducationIcon />
                        <span className="ml-2">Education Level</span>
                    </label>
                    <select value={educationLevel} onChange={e => setState(s => ({...s, educationLevel: e.target.value as OptimizerViewState['educationLevel']}))} className="bg-slate-700 text-white text-sm rounded-md p-1 border-0 focus:ring-2 focus:ring-indigo-500">
                        <option value="general">General</option>
                        <option value="k12">K-12</option>
                        <option value="university">University</option>
                    </select>
                </div>
                
                 {outputText && !isLoading && (
                    <div className="pt-2 border-t border-slate-700/50 mt-4">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2 mt-2">Actions on Output</h4>
                         <div className="flex items-center gap-2 mb-4 p-2 bg-slate-900/50 rounded-md">
                            <span className="text-sm font-medium">Translate to:</span>
                            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="bg-slate-700 text-white text-sm rounded-md p-1 border-0 focus:ring-2 focus:ring-indigo-500 flex-grow">
                                {Object.entries(languages).filter(([k]) => k !== 'auto').map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                            </select>
                            <button onClick={handleTranslate} className="bg-indigo-600 text-white px-3 py-1 text-sm rounded-md hover:bg-indigo-700">Go</button>
                        </div>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {refinementTasks.map(task => (
                                <button key={task.id} onClick={() => handleRefine(task.id)} className="bg-slate-700/50 hover:bg-slate-700 text-sm py-2 px-2 rounded-lg transition-colors">
                                    {task.label}
                                </button>
                            ))}
                         </div>
                    </div>
                 )}
                
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2">
                        {tasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => handleTaskExecution(task.id)}
                                disabled={isLoading || !inputText.trim()}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-900/50 disabled:cursor-not-allowed`}
                            >
                                {isLoading && activeTask === task.id ? <Loader /> : task.icon}
                                <span>{isLoading && activeTask === task.id ? 'Processing...' : task.label}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => runGeneration(true)}
                            disabled={isLoading || !outputText}
                            className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg disabled:bg-slate-700/50 disabled:text-slate-500 flex items-center justify-center h-full"
                            title="Regenerate"
                        >
                            <RefreshIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    {isSaveModalOpen && (
        <SaveToProjectModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            assetType="optimizer"
            assetContent={{
                inputText,
                outputText,
                settings: {
                    task: activeTask,
                    creativity,
                    complexity,
                    plagiarismGuard,
                    educationLevel
                }
            } as OptimizerAssetContent}
            assetNameSuggestion={`${activeTask.charAt(0).toUpperCase() + activeTask.slice(1)} - ${inputText.substring(0, 30)}...`}
        />
    )}
    </>
  );
};

export default OptimizerView;