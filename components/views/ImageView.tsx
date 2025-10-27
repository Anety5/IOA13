import React, { useState, useRef } from 'react';
import { generateImage, editImage, analyzeImage, translateText, generateSpeech } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/image';
import { decode, decodeAudioData } from '../../utils/audio';
import Loader from '../Loader';
import { ImageIcon } from '../icons/ImageIcon';
import { PenIcon } from '../icons/PenIcon';
import { ViewIcon } from '../icons/ViewIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';
import { StopIcon } from '../icons/StopIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { ImageAssetContent, AnalysisAssetContent } from '../../utils/projects';
import { TranslatorIcon } from '../icons/TranslatorIcon';

type ImageMode = 'generate' | 'edit' | 'analyze';

export interface ImageViewState {
  prompt: string;
  editPrompt: string;
  analysisPrompt: string;
  generatedImage: string | null;
  sourceImage: { b64: string; mime: string; url: string } | null;
  analysisResult: string | null;
  imageMode: ImageMode;
  imageStyle: string;
}

const languages = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French',
  'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian',
  'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese (Simplified)'
};

const imageStyles: { [key: string]: string } = {
  'photorealistic': 'Photorealistic',
  'anime': 'Anime',
  'cartoon': 'Cartoon',
  'watercolor': 'Watercolor',
  '3d-render': '3D Render',
  'abstract': 'Abstract',
  'line-art': 'Line Art',
};

interface ImageViewProps {
  state: ImageViewState;
  setState: React.Dispatch<React.SetStateAction<ImageViewState>>;
}

const ImageView: React.FC<ImageViewProps> = ({ state, setState }) => {
  const { prompt, editPrompt, analysisPrompt, generatedImage, sourceImage, analysisResult, imageMode, imageStyle } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalProps, setSaveModalProps] = useState<{assetType: 'image' | 'analysis', assetContent: any, assetNameSuggestion: string} | null>(null);
  
  const [translatedAnalysis, setTranslatedAnalysis] = useState<{ lang: string; text: string } | null>(null);
  const [targetLang, setTargetLang] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State and refs for advanced analysis audio playback
  const [analysisAudioState, setAnalysisAudioState] = useState<{ status: 'idle' | 'loading' | 'playing' | 'paused' }>({ status: 'idle' });
  const analysisAudioContextRef = useRef<AudioContext | null>(null);
  const analysisAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const cleanupAnalysisAudio = () => {
    if (analysisAudioSourceRef.current) {
      analysisAudioSourceRef.current.onended = null;
      analysisAudioSourceRef.current.disconnect();
      analysisAudioSourceRef.current = null;
    }
    if (analysisAudioContextRef.current) {
      analysisAudioContextRef.current.close().catch(console.error);
      analysisAudioContextRef.current = null;
    }
    setAnalysisAudioState({ status: 'idle' });
  };

  const handleStopAnalysisAudio = () => {
    if (analysisAudioSourceRef.current) {
      try {
        analysisAudioSourceRef.current.stop();
      } catch (e) {
        console.warn("Error stopping audio, may have already stopped.", e);
      }
    }
    cleanupAnalysisAudio();
  };

  const handleAnalysisPlaybackControl = async (text: string) => {
    if (analysisAudioState.status === 'playing' && analysisAudioContextRef.current) {
      await analysisAudioContextRef.current.suspend();
      setAnalysisAudioState({ status: 'paused' });
      return;
    }

    if (analysisAudioState.status === 'paused' && analysisAudioContextRef.current) {
      await analysisAudioContextRef.current.resume();
      setAnalysisAudioState({ status: 'playing' });
      return;
    }

    if (analysisAudioState.status === 'idle') {
      handleStopAnalysisAudio();
      setAnalysisAudioState({ status: 'loading' });
      setError(null);
      try {
        const audioB64 = await generateSpeech(text);
        analysisAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioData = decode(audioB64);
        const audioBuffer = await decodeAudioData(audioData, analysisAudioContextRef.current, 24000, 1);
        analysisAudioSourceRef.current = analysisAudioContextRef.current.createBufferSource();
        analysisAudioSourceRef.current.buffer = audioBuffer;
        analysisAudioSourceRef.current.connect(analysisAudioContextRef.current.destination);
        analysisAudioSourceRef.current.onended = cleanupAnalysisAudio;
        analysisAudioSourceRef.current.start();
        setAnalysisAudioState({ status: 'playing' });
      } catch (e) {
        setError("Speech generation failed.");
        console.error(e);
        cleanupAnalysisAudio();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const b64 = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        setState(s => ({ ...s, sourceImage: { b64, mime: file.type, url } }));
      } catch (err) {
        setError('Failed to read the image file.');
      }
    }
  };
  
  const handleModeChange = (mode: ImageMode) => {
    setState(s => ({
      ...s,
      imageMode: mode,
      analysisResult: null,
      generatedImage: mode === 'generate' ? s.generatedImage : null, // Keep generated image if switching back to generate
      translatedAnalysis: null
    }));
    handleStopAnalysisAudio();
  };

  const executeAction = async () => {
    setIsLoading(true);
    setError(null);
    setTranslatedAnalysis(null);
    handleStopAnalysisAudio();

    try {
      if (imageMode === 'generate') {
        const result = await generateImage(prompt, imageStyle);
        setState(s => ({ ...s, generatedImage: result, sourceImage: null, analysisResult: null }));
      } else if (imageMode === 'edit' && sourceImage) {
        const result = await editImage(editPrompt, sourceImage.b64, sourceImage.mime);
        setState(s => ({ ...s, generatedImage: result, analysisResult: null }));
      } else if (imageMode === 'analyze' && sourceImage) {
        const result = await analyzeImage(analysisPrompt, sourceImage.b64, sourceImage.mime);
        setState(s => ({ ...s, analysisResult: result, generatedImage: null }));
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateAnalysis = async () => {
    if (!analysisResult) return;
    setIsTranslating(true);
    handleStopAnalysisAudio();
    try {
      const result = await translateText(analysisResult, 'auto', languages[targetLang as keyof typeof languages]);
      setTranslatedAnalysis({ lang: languages[targetLang as keyof typeof languages], text: result });
    } catch (e) {
      setError("Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };
  
  const openSaveModal = (type: 'image' | 'analysis') => {
    if (type === 'image' && generatedImage) {
      const mimeType = imageMode === 'generate' ? 'image/jpeg' : (sourceImage?.mime || 'image/png');
      setSaveModalProps({
        assetType: 'image',
        assetContent: {
          prompt: imageMode === 'generate' ? prompt : editPrompt,
          b64: generatedImage,
          mimeType: mimeType,
          imageStyle: imageStyle,
        } as ImageAssetContent,
        assetNameSuggestion: `${prompt.substring(0, 30) || 'New Image'}...`
      });
    } else if (type === 'analysis' && analysisResult && sourceImage) {
      setSaveModalProps({
        assetType: 'analysis',
        assetContent: {
          prompt: analysisPrompt,
          sourceImageB64: sourceImage.b64,
          resultText: analysisResult
        } as AnalysisAssetContent,
        assetNameSuggestion: `Analysis of ${analysisPrompt.substring(0, 20)}...`
      });
    }
    setIsSaveModalOpen(true);
  };

  const renderControls = () => {
    switch(imageMode) {
      case 'generate':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Image Style</label>
              <select
                value={imageStyle}
                onChange={e => setState(s => ({ ...s, imageStyle: e.target.value }))}
                className="w-full bg-slate-900 text-white p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {Object.entries(imageStyles).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Prompt</label>
              <textarea value={prompt} onChange={e => setState(s => ({ ...s, prompt: e.target.value }))} placeholder="Enter a detailed prompt for your image..." rows={4} className="w-full bg-slate-900 p-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        );
      case 'edit':
      case 'analyze':
        return (
          <div className="space-y-4">
            {!sourceImage ? (
                <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-600 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <UploadIcon />
                    <p>Click to upload an image</p>
                    <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 4MB</p>
                </div>
            ) : (
                <div className="relative">
                    <img src={sourceImage.url} alt="Source" className="rounded-lg max-h-48 mx-auto" />
                    <button onClick={() => setState(s => ({ ...s, sourceImage: null }))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full px-2 py-0.5 text-xs">Change</button>
                </div>
            )}
            <textarea 
                value={imageMode === 'edit' ? editPrompt : analysisPrompt}
                onChange={e => imageMode === 'edit' ? setState(s => ({ ...s, editPrompt: e.target.value })) : setState(s => ({ ...s, analysisPrompt: e.target.value }))}
                placeholder={imageMode === 'edit' ? 'Describe the edits you want to make...' : 'What do you want to know about this image?'} 
                rows={3} className="w-full bg-slate-900 p-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                disabled={!sourceImage}
            />
          </div>
        );
    }
  };

  const modes = [
    { id: 'generate', label: 'Generate', icon: <ImageIcon /> },
    { id: 'edit', label: 'Edit', icon: <PenIcon /> },
    { id: 'analyze', label: 'Analyze', icon: <ViewIcon /> },
  ] as const;

  const canExecute = () => {
      if (isLoading) return false;
      if (imageMode === 'generate') return !!prompt.trim();
      if (imageMode === 'edit') return !!(sourceImage && editPrompt.trim());
      if (imageMode === 'analyze') return !!(sourceImage && analysisPrompt.trim());
      return false;
  }
  
  return (
    <>
    <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700">
      <div className="p-3 sm:p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><ImageIcon /> Image Studio</h2>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-700">
        <div className="bg-slate-800 p-3 sm:p-4 flex flex-col gap-4">
            <div className="flex items-center justify-center p-1 bg-slate-900 rounded-lg border border-slate-700">
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => handleModeChange(mode.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                            imageMode === mode.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                    >
                        {mode.icon}
                        {mode.label}
                    </button>
                ))}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div className="flex-1">
                {renderControls()}
            </div>
             <div className="flex items-center gap-4">
                <button onClick={executeAction} disabled={!canExecute()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-indigo-900/50 flex items-center justify-center gap-2">
                    {isLoading ? <Loader /> : 'Run'}
                </button>
            </div>
        </div>
        <div className="bg-slate-800 p-3 sm:p-4 flex flex-col items-center justify-center relative">
            {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                    <Loader />
                    <p className="text-sm text-gray-400">Processing...</p>
                </div>
            ) : error ? (
                <div className="text-red-400 text-center">{error}</div>
            ) : generatedImage && (imageMode === 'generate' || imageMode === 'edit') ? (
                <>
                    <img src={`data:image/jpeg;base64,${generatedImage}`} alt={prompt || editPrompt || 'AI generated image'} className="rounded-lg max-w-full max-h-full object-contain" />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/40 p-2 rounded-lg">
                        <a href={`data:image/jpeg;base64,${generatedImage}`} download="generated-image.jpg" className="text-white hover:text-sky-300" title="Download Image"><DownloadIcon /></a>
                        <button onClick={() => openSaveModal('image')} className="text-white hover:text-sky-300" title="Save to Project"><SaveIcon /></button>
                    </div>
                </>
            ) : analysisResult && imageMode === 'analyze' ? (
                 <div className="w-full h-full flex flex-col gap-2">
                    <div className="flex-1 bg-slate-900 p-3 rounded overflow-y-auto text-sm">
                        <div className="flex justify-between items-center mb-2">
                           <div className="flex items-center gap-2">
                             <h3 className="font-semibold text-gray-300">Analysis Result</h3>
                              <div className="flex items-center">
                                <button onClick={() => handleAnalysisPlaybackControl(analysisResult)} disabled={analysisAudioState.status === 'loading'} className="p-1 text-gray-300 hover:text-white disabled:text-gray-600" title={analysisAudioState.status === 'playing' ? 'Pause' : 'Play'}>
                                    {analysisAudioState.status === 'loading' && <Loader />}
                                    {analysisAudioState.status === 'playing' && <PauseIcon />}
                                    {(analysisAudioState.status === 'idle' || analysisAudioState.status === 'paused') && <PlayIcon />}
                                </button>
                                <button onClick={handleStopAnalysisAudio} disabled={analysisAudioState.status === 'idle' || analysisAudioState.status === 'loading'} className="p-1 text-gray-300 hover:text-white disabled:text-gray-600" title="Stop">
                                    <StopIcon />
                                </button>
                              </div>
                           </div>
                            <button onClick={() => openSaveModal('analysis')} className="text-gray-300 hover:text-white"><SaveIcon/></button>
                        </div>
                        <p className="whitespace-pre-wrap">{analysisResult}</p>
                        {translatedAnalysis && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Translation ({translatedAnalysis.lang})</h4>
                                <p className="whitespace-pre-wrap text-gray-300">{translatedAnalysis.text}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-md">
                        <TranslatorIcon />
                        <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="bg-slate-700 text-white text-sm rounded-md p-1 border-0 focus:ring-2 focus:ring-indigo-500 flex-grow">
                            {Object.entries(languages).filter(([k]) => k !== 'auto').map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                        </select>
                        <button onClick={handleTranslateAnalysis} disabled={isTranslating} className="bg-indigo-600 text-white px-3 py-1 text-sm rounded-md hover:bg-indigo-700 disabled:bg-indigo-900/50">
                            {isTranslating ? <Loader /> : 'Translate'}
                        </button>
                    </div>
                 </div>
            ) : (
                <div className="text-center text-gray-400">Your results will appear here.</div>
            )}
        </div>
      </div>
    </div>
    {isSaveModalOpen && saveModalProps && (
        <SaveToProjectModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            {...saveModalProps}
        />
    )}
    </>
  );
};

export default ImageView;