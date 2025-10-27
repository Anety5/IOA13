import React, { useState, useRef, useEffect } from 'react';
import { getAiClientForLive } from '../../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { encode, decode, decodeAudioData } from '../../utils/audio';
import { fileToBase64 } from '../../utils/image';
import { LiveIcon } from '../icons/LiveIcon';
import { MicrophoneIcon } from '../icons/MicrophoneIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { SaveIcon } from '../icons/SaveIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { LiveConversationAssetContent } from '../../utils/projects';

interface Transcript {
  speaker: 'user' | 'model';
  text: string;
}

interface LiveSession {
    sendRealtimeInput: (params: any) => void;
    close: () => void;
}

interface LiveConversationViewProps {
}

const LIVE_HISTORY_KEY = 'live_conversation_history';

const LiveConversationView: React.FC<LiveConversationViewProps> = () => {
    const [isLive, setIsLive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<Transcript[]>(() => {
        try { const saved = localStorage.getItem(LIVE_HISTORY_KEY); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });
    const [imageToSend, setImageToSend] = useState<{ b64: string; mime: string; url: string } | null>(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const outputSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTime = useRef(0);
    const currentInputTranscript = useRef('');
    const currentOutputTranscript = useRef('');
    
    useEffect(() => {
        localStorage.setItem(LIVE_HISTORY_KEY, JSON.stringify(transcripts));
    }, [transcripts]);

    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, []);
    
    const startConversation = async () => {
        if (isConnecting || isLive) return;
        setIsConnecting(true);
        setError(null);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const systemInstruction = `You are a friendly and helpful AI assistant.`;

            const ai = getAiClientForLive();
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log("Gemini session opened.");
                        setIsConnecting(false);
                        setIsLive(true);
                        
                        if (!inputAudioContext.current || !streamRef.current) return;

                        sourceNodeRef.current = inputAudioContext.current.createMediaStreamSource(streamRef.current);
                        processorRef.current = inputAudioContext.current.createScriptProcessor(4096, 1, 1);
                        
                        processorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        sourceNodeRef.current.connect(processorRef.current);
                        processorRef.current.connect(inputAudioContext.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const audioB64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioB64 && outputAudioContext.current) {
                            nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioB64), outputAudioContext.current, 24000, 1);
                            const source = outputAudioContext.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.current.destination);
                            
                            const currentSources = outputSources.current;
                            source.addEventListener('ended', () => currentSources.delete(source));
                            source.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            currentSources.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of outputSources.current.values()) {
                                source.stop();
                                outputSources.current.delete(source);
                            }
                            nextStartTime.current = 0;
                        }

                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscript.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscript.current += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const userText = currentInputTranscript.current.trim();
                            const modelText = currentOutputTranscript.current.trim();
                            
                            setTranscripts(prev => {
                                const newTranscripts = [...prev];
                                if (userText) {
                                    newTranscripts.push({ speaker: 'user', text: userText });
                                }
                                if (modelText) {
                                    newTranscripts.push({ speaker: 'model', text: modelText });
                                }
                                return newTranscripts;
                            });
                            
                            currentInputTranscript.current = '';
                            currentOutputTranscript.current = '';
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                         console.error('Gemini Live Error:', e);
                         setError(`An error occurred: ${e.message}`);
                         stopConversation();
                    },
                     onclose: () => {
                        stopConversation();
                     }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction,
                },
            });

        } catch (err) {
            console.error("Failed to start conversation:", err);
            setError(`Could not start session. ${err instanceof Error ? err.message : ''}`);
            setIsConnecting(false);
        }
    };
    
    const stopConversation = () => {
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (processorRef.current) processorRef.current.disconnect();
        if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
        
        inputAudioContext.current?.close().catch(console.error);
        outputAudioContext.current?.close().catch(console.error);
        
        outputSources.current.forEach(source => { try { source.stop(); } catch(e) {} });
        outputSources.current.clear();
        nextStartTime.current = 0;

        setIsLive(false);
        setIsConnecting(false);
        setImageToSend(null);
    };

    const handleToggleConversation = () => {
        if (isLive || isConnecting) {
            stopConversation();
        } else {
            startConversation();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const b64 = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                setImageToSend({ b64, mime: file.type, url });
            } catch (err) {
                setError('Failed to read the image file.');
            }
        }
    };

    const handleSendImage = async () => {
        if (!imageToSend || !sessionPromiseRef.current) return;
        try {
            const session = await sessionPromiseRef.current;
            session.sendRealtimeInput({
                media: { data: imageToSend.b64, mimeType: imageToSend.mime }
            });
            setTranscripts(prev => [...prev, { speaker: 'user', text: '(Image sent to AI. You can now ask questions about it.)' }]);
            setImageToSend(null);
        } catch (err) {
            setError("Failed to send the image.");
            console.error(err);
        }
    };

    const handleDownload = () => {
        const content = transcripts.map(t => `${t.speaker === 'user' ? 'You' : 'AI'}: ${t.text}`).join('\n\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'live-conversation-transcript.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear this transcript?")) {
            setTranscripts([]);
        }
    };

    return (
        <>
        <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700">
            <div className="p-3 sm:p-4 border-b border-slate-700 flex flex-col gap-2 items-start sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2"><LiveIcon /> Live Conversation</h2>
                 <div className="flex items-center gap-3">
                     <button onClick={() => setIsSaveModalOpen(true)} disabled={transcripts.length === 0} className="text-gray-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed" title="Save Transcript">
                        <SaveIcon />
                    </button>
                    <button onClick={handleDownload} disabled={transcripts.length === 0} className="text-gray-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed" title="Download Transcript">
                        <DownloadIcon />
                    </button>
                    <button onClick={handleClear} disabled={transcripts.length === 0} className="text-gray-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed" title="Clear Transcript">
                        <TrashIcon />
                    </button>
                </div>
            </div>
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
                <div className="space-y-4">
                    {transcripts.map((t, i) => (
                        <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-lg ${t.speaker === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'}`}>
                                <p className="text-sm"><strong>{t.speaker === 'user' ? 'You' : 'AI'}:</strong> {t.text}</p>
                            </div>
                        </div>
                    ))}
                    {transcripts.length === 0 && !isLive && !isConnecting && (
                        <div className="text-center text-gray-400 pt-10">
                            Click the microphone button to start a live conversation.
                        </div>
                    )}
                </div>
            </div>
            <div className="p-3 sm:p-4 border-t border-slate-700 flex flex-col items-center gap-4">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                
                {isLive && imageToSend && (
                    <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg">
                        <div className="relative w-16 h-16">
                           <img src={imageToSend.url} className="w-full h-full object-cover rounded" alt="Preview" />
                           <button onClick={() => setImageToSend(null)} className="absolute -top-1 -right-1 bg-black/50 p-0.5 rounded-full text-white hover:bg-black/80">
                                <CloseIcon />
                           </button>
                        </div>
                        <button onClick={handleSendImage} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                           Send Image to AI
                        </button>
                    </div>
                )}
                
                <div className="flex items-center gap-4">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!isLive || !!imageToSend}
                        className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors duration-300 text-white disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500"
                        title="Attach Image"
                    >
                        <PaperclipIcon />
                    </button>
                    <button
                        onClick={handleToggleConversation}
                        disabled={isConnecting}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-colors duration-300 text-white
                            ${isLive ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'}
                            ${isConnecting ? 'bg-yellow-500 cursor-not-allowed' : ''}
                        `}
                    >
                        <MicrophoneIcon />
                    </button>
                    <div className="w-14 h-14"></div>
                </div>
                
                <p className="text-sm text-gray-400">
                    {isConnecting ? 'Connecting...' : isLive ? 'Conversation is live. Click to end.' : 'Click to start conversation.'}
                </p>
            </div>
        </div>
        {isSaveModalOpen && (
            <SaveToProjectModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                assetType="liveConversation"
                assetContent={{ transcripts } as LiveConversationAssetContent}
                assetNameSuggestion={`Live Transcript - ${new Date().toLocaleString()}`}
            />
        )}
        </>
    );
};

export default LiveConversationView;