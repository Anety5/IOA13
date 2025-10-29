
import React, { useState, useRef, useEffect } from 'react';
import { ImageViewState } from '../../utils/projects';
import { generateImage, editImage, analyzeImage } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/image';
import Loader from '../Loader';
import { SaveIcon } from '../icons/SaveIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { UploadIcon } from '../icons/UploadIcon';
import { PenIcon } from '../icons/PenIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

interface ImageViewProps {
  state: ImageViewState;
  setState: React.Dispatch<React.SetStateAction<ImageViewState>>;
  setViewContext: (context: string) => void;
}

const ImageView: React.FC<ImageViewProps> = ({ state, setState, setViewContext }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setViewContext(`Image view in ${state.mode} mode. Prompt: ${state.prompt}`);
  }, [state.mode, state.prompt, setViewContext]);

  const handleGenerate = async () => {
    if (!state.prompt.trim()) return;
    setState(s => ({...s, isGenerating: true, error: null}));
    try {
      const base64Images = await generateImage(state.prompt, state.numberOfImages, state.aspectRatio);
      const newImages = base64Images.map(b64 => ({ src: `data:image/png;base64,${b64}`, prompt: state.prompt }));
      setState(s => ({...s, images: [...newImages, ...s.images]}));
    } catch (err: any) {
      setState(s => ({...s, error: err.message || 'Failed to generate image.'}));
    } finally {
      setState(s => ({...s, isGenerating: false}));
    }
  };

  const handleEdit = async () => {
    if (!state.prompt.trim() || !state.sourceImage) return;
    setState(s => ({...s, isGenerating: true, error: null}));
    try {
        const base64Image = await editImage(state.prompt, state.sourceImage);
        const newImage = { src: `data:image/png;base64,${base64Image}`, prompt: state.prompt };
        setState(s => ({...s, images: [newImage, ...s.images], sourceImage: null}));
    } catch (err: any) {
        setState(s => ({...s, error: err.message || 'Failed to edit image.'}));
    } finally {
        setState(s => ({...s, isGenerating: false}));
    }
  };

  const handleAnalyze = async () => {
      if (!state.prompt.trim() || !state.sourceImage) return;
      setState(s => ({...s, isGenerating: true, error: null, analysisResult: null }));
      try {
          const result = await analyzeImage(state.prompt, state.sourceImage);
          setState(s => ({...s, analysisResult: result}));
      } catch (err: any) {
          setState(s => ({...s, error: err.message || 'Failed to analyze image.'}));
      } finally {
          setState(s => ({...s, isGenerating: false}));
      }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const base64Data = await fileToBase64(file);
    setState(s => ({...s, sourceImage: { data: base64Data, mimeType: file.type }, error: null, analysisResult: null }));
  };
  
  const handleAction = () => {
      switch (state.mode) {
          case 'generate': handleGenerate(); break;
          case 'edit': handleEdit(); break;
          case 'analyze': handleAnalyze(); break;
      }
  };

  const downloadImage = (src: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const setMode = (mode: ImageViewState['mode']) => {
      setState(s => ({...s, mode, error: null, analysisResult: null, sourceImage: mode === 'generate' ? null : s.sourceImage}));
  };

  return (
    <div className="flex h-full bg-slate-800 text-white">
      <div className="w-full md:w-1/3 lg:w-1/4 p-4 border-r border-slate-700 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Image Studio</h2>
        <div className="flex bg-slate-900 p-1 rounded-lg mb-4">
            <button onClick={() => setMode('generate')} className={`flex-1 p-2 text-sm rounded-md flex items-center justify-center gap-2 ${state.mode === 'generate' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}><SparkleIcon /> Generate</button>
            <button onClick={() => setMode('edit')} className={`flex-1 p-2 text-sm rounded-md flex items-center justify-center gap-2 ${state.mode === 'edit' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}><PenIcon /> Edit</button>
            <button onClick={() => setMode('analyze')} className={`flex-1 p-2 text-sm rounded-md flex items-center justify-center gap-2 ${state.mode === 'analyze' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}><BrainCircuitIcon /> Analyze</button>
        </div>
        
        { (state.mode === 'edit' || state.mode === 'analyze') && (
            <div className="mb-4">
                { !state.sourceImage ? (
                    <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:bg-slate-900 transition-colors">
                        <UploadIcon />
                        <p className="text-sm">Click to upload image</p>
                    </div>
                ) : (
                    <div className="relative">
                        <img src={`data:${state.sourceImage.mimeType};base64,${state.sourceImage.data}`} alt="Source for edit" className="rounded-lg w-full" />
                        <button onClick={() => setState(s => ({...s, sourceImage: null}))} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500"><TrashIcon /></button>
                    </div>
                )}
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
        )}

        <label className="text-sm mb-1">Prompt</label>
        <textarea
            value={state.prompt}
            onChange={e => setState(s => ({...s, prompt: e.target.value}))}
            rows={5}
            placeholder={
                state.mode === 'generate' ? 'A futuristic cityscape at sunset...' :
                state.mode === 'edit' ? 'Add a flying car in the sky...' :
                'What is in this image?'
            }
            className="w-full p-2 bg-slate-900 rounded-md resize-none border border-slate-700"
        />
        
        {state.mode === 'generate' && (
            <div className="mt-4">
                <label className="text-sm mb-1">Number of Images</label>
                <input type="number" min="1" max="4" value={state.numberOfImages} onChange={e => setState(s => ({...s, numberOfImages: parseInt(e.target.value)}))} className="w-full p-2 bg-slate-900 rounded-md border border-slate-700" />
                <label className="text-sm mt-2 mb-1">Aspect Ratio</label>
                <select value={state.aspectRatio} onChange={e => setState(s => ({...s, aspectRatio: e.target.value as any}))} className="w-full p-2 bg-slate-900 rounded-md border border-slate-700">
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                    <option value="4:3">Standard (4:3)</option>
                    <option value="3:4">Tall (3:4)</option>
                </select>
            </div>
        )}
        
        <div className="mt-auto pt-4">
             <button
                onClick={handleAction}
                disabled={state.isGenerating || !state.prompt.trim() || ((state.mode === 'edit' || state.mode === 'analyze') && !state.sourceImage)}
                className="w-full px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 font-semibold flex items-center justify-center disabled:bg-indigo-900 disabled:cursor-not-allowed"
            >
                {state.isGenerating ? <Loader /> : 'Run'}
            </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Results</h2>
             <button onClick={() => setIsModalOpen(true)} disabled={state.images.length === 0 && !state.analysisResult} className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 flex items-center gap-2 disabled:opacity-50">
                <SaveIcon /> Save
            </button>
        </div>
        {state.error && <p className="text-red-400 p-4 bg-red-900/50 rounded-md">{state.error}</p>}
        {state.analysisResult && (
            <div className="bg-slate-900 p-4 rounded-lg mb-4 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: state.analysisResult }}></div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.images.map((img, index) => (
                <div key={index} className="relative group aspect-square">
                    <img src={img.src} alt={img.prompt} className="rounded-lg w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button onClick={() => downloadImage(img.src)} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"><DownloadIcon /></button>
                        <button onClick={() => setState(s => ({...s, images: s.images.filter((_, i) => i !== index)}))} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"><TrashIcon /></button>
                    </div>
                </div>
            ))}
        </div>
      </div>
       <SaveToProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          assetType="image"
          assetContent={state}
          assetNameSuggestion={`Image Session - ${new Date().toLocaleDateString()}`}
        />
    </div>
  );
};

export default ImageView;
