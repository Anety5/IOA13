
import React, { useState, useRef, useEffect } from 'react';
import { ImageViewState, addOrphanAsset } from '../../utils/projects';
import { generateImage, editImage, analyzeImage } from '../../services/geminiService';
import { fileToBase64, base64ToBlob } from '../../utils/image';
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
import { ShareIcon } from '../icons/ShareIcon';
import { PaperclipIcon } from '../icons/PaperclipIcon';


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
      setState(s => ({ 
          ...s, 
          sourceImage: { data: base64Data, mimeType: file.type },
          // Switch to edit mode if user was in generate mode
          mode: s.mode === 'generate' ? 'edit' : s.mode 
      }));
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

  const saveImageAsAsset = (image: { src: string; prompt: string }) => {
      const newAssetState: ImageViewState = {
          ...state,
          prompt: image.prompt,
          images: [image], // Save only this specific image
          sourceImage: null,
          analysisResult: null,
          mode: 'generate',
      };
      addOrphanAsset(`Image - ${image.prompt.substring(0, 20)}...`, 'image', newAssetState);
      // You could add a toast notification here for user feedback
  };

  const shareImage = async (image: { src: string; prompt: string }) => {
    try {
        const blob = base64ToBlob(image.src);
        const file = new File([blob], `generated-image.png`, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'AI Generated Image',
                text: image.prompt,
            });
        } else {
            alert('Your browser does not support sharing files.');
        }
    } catch (err) {
        console.error('Error sharing image:', err);
        alert('Could not share the image.');
    }
  };

  const aspectRatios: ImageViewState['aspectRatio'][] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const styles = ['Photorealistic', 'Anime', '3D', 'Monochrome', 'Abstract'];

  const handleStyleClick = (style: string) => {
    const styleValue = style.toLowerCase();
    setState(s => ({...s, style: s.style === styleValue ? 'none' : styleValue as ImageViewState['style'] }));
  };


  return (
    <div className="flex flex-col h-full bg-slate-800 text-white">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
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
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Source Image</label>
                        {state.sourceImage ? (
                            <div className="relative">
                                <img src={`data:${state.sourceImage.mimeType};base64,${state.sourceImage.data}`} alt="Source" className="rounded-lg w-full" />
                                <button onClick={removeSourceImage} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/80">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-600 rounded-lg p-8 text-center text-slate-400 hover:bg-slate-800 hover:border-slate-500">
                                <UploadIcon />
                                <span>Click to upload</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Prompt */}
                <div className="space-y-2">
                    <label htmlFor="prompt" className="text-sm font-medium text-gray-300">Prompt</label>
                    <div className="relative">
                        <textarea
                            id="prompt"
                            value={state.prompt}
                            onChange={(e) => setState(s => ({ ...s, prompt: e.target.value }))}
                            placeholder={
                                state.mode === 'generate' ? "A futuristic cityscape at sunset..." :
                                state.mode === 'edit' ? "Make the sky purple..." :
                                "Describe this image..."
                            }
                            className="w-full p-2 pr-12 bg-slate-700 rounded-md border border-slate-600 h-24 resize-none"
                        />
                         <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="absolute bottom-2 right-2 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-600"
                            title="Attach image to edit"
                        >
                            <PaperclipIcon />
                        </button>
                    </div>
                </div>
                
                {/* Options for Generate */}
                {state.mode === 'generate' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Number of Images</label>
                            <input type="number" min="1" max="4" value={state.numberOfImages} onChange={e => setState(s => ({...s, numberOfImages: parseInt(e.target.value)}))} className="w-full p-2 bg-slate-700 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Aspect Ratio</label>
                            <select value={state.aspectRatio} onChange={e => setState(s => ({...s, aspectRatio: e.target.value as any}))} className="w-full p-2 bg-slate-700 rounded-md">
                                {aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Style</label>
                            <div className="flex flex-wrap gap-2">
                                {styles.map(s => (
                                    <button key={s} onClick={() => handleStyleClick(s)} className={`px-2 py-1 text-xs rounded-full ${state.style === s.toLowerCase() ? 'bg-indigo-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Action Button */}
                <div className="mt-auto pt-4">
                    <button onClick={handleAction} disabled={state.isGenerating} className="w-full py-2.5 text-base font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {state.isGenerating ? <Loader /> : (state.mode === 'analyze' ? 'Analyze' : 'Generate')}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden">
                {state.error && <div className="p-3 bg-red-900/50 text-red-300 rounded-md mb-4">{state.error}</div>}
                
                {state.mode === 'analyze' && state.analysisResult && (
                    <div className="bg-slate-900 rounded-lg p-4 overflow-y-auto">
                         <h3 className="font-semibold mb-2 text-lg">Analysis Result</h3>
                         <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: state.analysisResult }} />
                    </div>
                )}
                
                {(state.mode === 'generate' || state.mode === 'edit') && (
                     <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto p-1">
                        {state.images.map((image, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={image.src} alt={image.prompt} className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                                    <p className="text-xs line-clamp-2">{image.prompt}</p>
                                    <div className="flex justify-end gap-1 mt-1 self-end">
                                         <button onClick={() => shareImage(image)} className="p-1.5 bg-slate-700/80 rounded-full hover:bg-slate-600" title="Share"><ShareIcon /></button>
                                         <button onClick={() => saveImageAsAsset(image)} className="p-1.5 bg-slate-700/80 rounded-full hover:bg-slate-600" title="Save as New Asset"><SaveIcon /></button>
                                         <button onClick={() => downloadImage(image.src, `generated-image-${index}.png`)} className="p-1.5 bg-slate-700/80 rounded-full hover:bg-slate-600" title="Download"><DownloadIcon /></button>
                                         <button onClick={() => removeImage(index)} className="p-1.5 bg-slate-700/80 rounded-full hover:bg-slate-600" title="Delete"><TrashIcon /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!state.analysisResult && state.images.length === 0 && (
                    <div className="m-auto text-center text-slate-500 flex flex-col items-center">
                        <ImageIcon />
                        <p className="mt-2">Your images will appear here</p>
                    </div>
                )}
            </main>
        </div>
        
        <SaveToProjectModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            assetType="image"
            assetContent={state}
            assetNameSuggestion={`Image Set - ${new Date().toLocaleDateString()}`}
        />
    </div>
  );
};

export default ImageView;
