
import React, { useState, useRef, useEffect } from 'react';
import { ImageViewState } from '../../utils/projects';
import { generateImage, editImage, analyzeImage } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/image';
import Loader from '../Loader';
import SaveToProjectModal from '../SaveToProjectModal';
import { ImageIcon } from '../icons/ImageIcon';
import { PenIcon } from '../icons/PenIcon';
import { BookIcon } from '../icons/BookIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { ChatIcon } from '../icons/ChatIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { SaveIcon } from '../icons/SaveIcon';


interface ImageViewProps {
  state: ImageViewState;
  setState: React.Dispatch<React.SetStateAction<ImageViewState>>;
  setViewContext: (context: string) => void;
  onSidebarToggle: () => void;
  onChatToggle: () => void;
}

const ImageView: React.FC<ImageViewProps> = ({ state, setState, setViewContext, onSidebarToggle, onChatToggle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setViewContext(`User is in the Image Studio, in ${state.mode} mode. Current prompt: ${state.prompt.substring(0, 100)}`);
  }, [state.mode, state.prompt, setViewContext]);


  const setMode = (mode: ImageViewState['mode']) => {
    setState(s => ({ ...s, mode, error: null, analysisResult: null }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const base64Data = await fileToBase64(file);
      setState(s => ({ ...s, sourceImage: { data: base64Data, mimeType: file.type } }));
    } catch (err) {
      console.error("Error converting file to base64", err);
      setState(s => ({ ...s, error: 'Failed to load image.' }));
    }
    if (event.target) {
        event.target.value = '';
    }
  };
  
  const handleAction = async () => {
    if (!state.prompt.trim() && state.mode !== 'analyze') return;

    setState(s => ({ ...s, isGenerating: true, error: null, analysisResult: null }));
    try {
      if (state.mode === 'generate') {
        let finalPrompt = state.prompt;
        if (state.style && state.style !== 'none') {
            finalPrompt = `${state.prompt}, ${state.style} style`;
        }
        const result = await generateImage(finalPrompt, state.numberOfImages, state.aspectRatio);
        const newImages = result.map(imgData => ({ src: `data:image/png;base64,${imgData}`, prompt: state.prompt }));
        setState(s => ({ ...s, images: [...s.images, ...newImages] }));
      } else if (state.mode === 'edit' && state.sourceImage) {
        const result = await editImage(state.prompt, state.sourceImage);
        const newImage = { src: `data:image/png;base64,${result}`, prompt: state.prompt };
        setState(s => ({ ...s, images: [...s.images, newImage] }));
      } else if (state.mode === 'analyze' && state.sourceImage) {
        const result = await analyzeImage(state.prompt || "Describe this image in detail.", state.sourceImage);
        setState(s => ({ ...s, analysisResult: result }));
      }
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message || 'An error occurred.' }));
    } finally {
      setState(s => ({ ...s, isGenerating: false }));
    }
  };
  
  const downloadImage = (src: string, name: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeImage = (index: number) => {
      setState(s => ({ ...s, images: s.images.filter((_, i) => i !== index) }));
  };
  
  const removeSourceImage = () => {
      setState(s => ({ ...s, sourceImage: null }));
  };

  const aspectRatios: ImageViewState['aspectRatio'][] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const styles = ['Photorealistic', 'Anime', '3D', 'Monochrome', 'Abstract'];

  const handleStyleClick = (style: string) => {
    const styleValue = style.toLowerCase();
    setState(s => ({...s, style: s.style === styleValue ? 'none' : styleValue }));
  };


  return (
    <div className="flex flex-col h-full bg-slate-800 text-white">
        {/* Mobile Header */}
        <header className="md:hidden p-2 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
            <button onClick={onSidebarToggle} className="p-2"><HamburgerIcon /></button>
            <h1 className="font-semibold">Image Studio</h1>
            <button onClick={onChatToggle} className="p-2"><ChatIcon /></button>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Controls Panel */}
            <aside className="w-full md:w-80 flex-shrink-0 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-700 p-4 space-y-4 overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">Image Studio</h2>
                    <button onClick={() => setIsModalOpen(true)} disabled={state.images.length === 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-50"><SaveIcon /></button>
                </div>
                
                {/* Mode Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-md">
                    <button onClick={() => setMode('generate')} className={`px-2 py-1 text-sm rounded flex items-center justify-center gap-1 ${state.mode === 'generate' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}><ImageIcon /> Gen</button>
                    <button onClick={() => setMode('edit')} className={`px-2 py-1 text-sm rounded flex items-center justify-center gap-1 ${state.mode === 'edit' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}><PenIcon /> Edit</button>
                    <button onClick={() => setMode('analyze')} className={`px-2 py-1 text-sm rounded flex items-center justify-center gap-1 ${state.mode === 'analyze' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}><BookIcon /> Analyze</button>
                </div>

                {/* Source Image for Edit/Analyze */}
                {(state.mode === 'edit' || state.mode === 'analyze') && (
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Source Image</label>
                        {state.sourceImage ? (
                            <div className="relative">
                                <img src={`data:${state.sourceImage.mimeType};base64,${state.sourceImage.data}`} alt="source" className="w-full rounded-md" />
                                <button onClick={removeSourceImage} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/80"><CloseIcon className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-600 rounded-md p-6 text-center cursor-pointer hover:border-indigo-500"
                            >
                                <UploadIcon />
                                <p className="text-sm text-slate-400">Click to upload</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                    </div>
                )}

                {state.mode === 'generate' && (
                    <>
                        <div>
                            <label htmlFor="num-images" className="text-sm font-medium text-gray-300 mb-1 block">Number of Images</label>
                            <input
                                id="num-images"
                                type="number"
                                min="1"
                                max="4"
                                value={state.numberOfImages}
                                onChange={e => setState(s => ({...s, numberOfImages: parseInt(e.target.value, 10)}))}
                                className="w-full p-2 bg-slate-700 rounded-md border border-slate-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="aspect-ratio" className="text-sm font-medium text-gray-300 mb-1 block">Aspect Ratio</label>
                            <select
                                id="aspect-ratio"
                                value={state.aspectRatio}
                                onChange={e => setState(s => ({...s, aspectRatio: e.target.value as ImageViewState['aspectRatio']}))}
                                className="w-full p-2 bg-slate-700 rounded-md border border-slate-600"
                            >
                                {aspectRatios.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Style</label>
                            <div className="flex flex-wrap gap-2">
                                {styles.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => handleStyleClick(style)}
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${state.style === style.toLowerCase() ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                
                {/* Prompt */}
                <div>
                    <label htmlFor="image-prompt" className="text-sm font-medium text-gray-300 mb-1 block">Prompt</label>
                    <textarea
                        id="image-prompt"
                        rows={4}
                        value={state.prompt}
                        onChange={e => setState(s => ({ ...s, prompt: e.target.value }))}
                        placeholder={
                            state.mode === 'generate' ? 'e.g., A photo of a cat wearing a tiny hat' :
                            state.mode === 'edit' ? 'e.g., Add a monocle to the cat' :
                            'e.g., What breed is this cat? (optional)'
                        }
                        className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 resize-none"
                    />
                </div>
                
                {/* Action Button */}
                <button
                    onClick={handleAction}
                    disabled={state.isGenerating || (state.mode === 'generate' && !state.prompt.trim()) || ((state.mode === 'edit' || state.mode === 'analyze') && !state.sourceImage)}
                    className="w-full py-2.5 text-base font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {state.isGenerating ? <Loader /> : (state.mode === 'generate' ? 'Generate' : state.mode === 'edit' ? 'Edit' : 'Analyze')}
                </button>
            </aside>
            
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col p-4 overflow-hidden">
                <h2 className="text-lg font-bold mb-4">Results</h2>
                {state.error && <p className="text-red-400 p-2 bg-red-900/50 rounded-md mb-2">{state.error}</p>}
                
                {/* Analysis Result */}
                {state.mode === 'analyze' && state.analysisResult && (
                    <div className="bg-slate-900 p-4 rounded-md mb-4 overflow-y-auto">
                        <h3 className="font-semibold text-indigo-400 mb-2">Analysis</h3>
                        <p className="text-slate-300 whitespace-pre-wrap">{state.analysisResult}</p>
                    </div>
                )}
                
                {/* Image Grid */}
                <div className="flex-1 overflow-y-auto">
                    {(state.images.length === 0 && (!state.analysisResult || state.mode !== 'analyze')) && (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <p>Your results will appear here.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {state.images.map((image, index) => (
                            <div key={index} className="group relative">
                                <img src={image.src} alt={image.prompt} className="w-full h-auto rounded-lg shadow-lg" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                    <p className="text-xs text-white line-clamp-3">{image.prompt}</p>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => downloadImage(image.src, `generated_image_${index}.png`)} className="p-2 bg-slate-700/80 rounded-full hover:bg-slate-600"><DownloadIcon /></button>
                                        <button onClick={() => removeImage(index)} className="p-2 bg-slate-700/80 rounded-full hover:bg-slate-600"><TrashIcon /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
        <SaveToProjectModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            assetType="image"
            assetContent={state}
            assetNameSuggestion={`Image Project - ${new Date().toLocaleDateString()}`}
        />
    </div>
  );
};

export default ImageView;