import React, { useState } from 'react';
import { ImageViewState, GeneratedImage } from '../../utils/projects';
import { generateImages } from '../../services/geminiService';
import Loader from '../Loader';
import { SaveIcon } from '../icons/SaveIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { DownloadIcon } from '../icons/DownloadIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { UploadIcon } from '../icons/UploadIcon';

interface ImageViewProps {
  state: ImageViewState;
  setState: React.Dispatch<React.SetStateAction<ImageViewState>>;
}

const stylePresets = ["Photorealistic", "Anime", "3D", "Monochrome", "Abstract", "Watercolor", "Cyberpunk"];

const ImageView: React.FC<ImageViewProps> = ({ state, setState }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerate = async () => {
    if (!state.prompt.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await generateImages(state.prompt, state.numberOfImages, state.aspectRatio);
      
      const newImages: GeneratedImage[] = response.generatedImages.map((img, index) => ({
        id: `img_${Date.now()}_${index}`,
        base64: img.image.imageBytes,
        prompt: state.prompt,
      }));

      setState(s => ({ ...s, images: [...newImages, ...s.images] }));
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating images.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (base64: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `${prompt.slice(0, 20).replace(/\s/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const applyStyle = (style: string) => {
    const newPrompt = state.prompt.trim().length > 0
      ? `${state.prompt.trim()}, ${style.toLowerCase()}`
      : `${style}`;
    setState(s => ({...s, prompt: newPrompt}));
  }

  return (
    <div className="flex flex-col h-full bg-slate-800 text-white">
      <header className="flex-shrink-0 p-4 border-b border-slate-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Image Studio</h1>
        <button
            onClick={() => setIsModalOpen(true)}
            disabled={state.images.length === 0}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
            <SaveIcon />
            Save Session
        </button>
      </header>
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Control Panel */}
        <div className="w-full md:w-80 lg:w-96 p-4 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col gap-6">
            <h2 className="text-lg font-medium">Image Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
              <select 
                value={state.aspectRatio}
                onChange={(e) => setState(s => ({...s, aspectRatio: e.target.value as ImageViewState['aspectRatio']}))}
                className="w-full bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Number of Images</label>
               <input
                 type="number"
                 min="1"
                 max="4"
                 value={state.numberOfImages}
                 onChange={(e) => setState(s => ({...s, numberOfImages: parseInt(e.target.value)}))}
                 className="w-full bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
               />
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700">
             <div className="flex flex-wrap gap-2 mb-3">
                {stylePresets.map(style => (
                    <button
                        key={style}
                        onClick={() => applyStyle(style)}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 hover:text-white transition-colors"
                    >
                        {style}
                    </button>
                ))}
             </div>
            <textarea
              value={state.prompt}
              onChange={(e) => setState(s => ({ ...s, prompt: e.target.value }))}
              placeholder="Describe the image you want to create... e.g., 'A futuristic cityscape at sunset, neon lights reflecting on wet streets.'"
              className="w-full h-24 p-3 bg-slate-900 rounded-md resize-none focus:outline-none placeholder-slate-500 text-slate-300"
            />
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {isLoading && state.images.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Loader />
                    <p className="mt-4">Generating your masterpiece...</p>
                </div>
            )}
            {error && <p className="text-red-400 text-center">{error}</p>}
            
            {state.images.length === 0 && !isLoading && !error && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                    <UploadIcon />
                    <h3 className="text-lg font-semibold mt-2">Let's create something amazing!</h3>
                    <p className="max-w-xs">Enter a description above and click "Generate" to bring your ideas to life.</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {state.images.map((image) => (
                <div key={image.id} className="group relative rounded-lg overflow-hidden border-2 border-slate-700">
                  <img src={`data:image/png;base64,${image.base64}`} alt={image.prompt} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <p className="text-xs text-slate-200">{image.prompt}</p>
                    <button 
                        onClick={() => handleDownload(image.base64, image.prompt)}
                        className="self-end p-2 rounded-full bg-slate-600/50 hover:bg-indigo-600"
                    >
                        <DownloadIcon/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
       <div className="p-4 border-t border-slate-700 flex-shrink-0 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !state.prompt.trim()}
              className="w-full md:w-auto md:px-12 py-2.5 text-base font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-indigo-800 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader /> : <><RefreshIcon /> Generate</>}
            </button>
        </div>
      <SaveToProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assetType="image"
        assetContent={state}
        assetNameSuggestion={`Image Session - ${state.prompt.substring(0, 30)}...`}
      />
    </div>
  );
};

export default ImageView;