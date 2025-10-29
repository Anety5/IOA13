import React, { useState } from 'react';
import Slider from '../Slider';
import Toggle from '../Toggle';
import { SparkleIcon } from '../icons/SparkleIcon';
import { BookIcon } from '../icons/BookIcon';
import { ComplexityIcon } from '../icons/ComplexityIcon';
import { ProofreadIcon } from '../icons/ProofreadIcon';
import { PlagiarismCheckIcon } from '../icons/PlagiarismCheckIcon';
import { optimizeText } from '../../services/geminiService';
import Loader from '../Loader';
import { renderMarkdown } from '../../utils/rendering';

const OptimizerView: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [optimizedText, setOptimizedText] = useState('');
    const [audience, setAudience] = useState('General Audience');
    const [goal, setGoal] = useState('Improve Clarity');
    const [formality, setFormality] = useState(50);
    const [complexity, setComplexity] = useState(50);
    const [tone, setTone] = useState('Neutral');
    const [isProofread, setIsProofread] = useState(true);
    const [isPlagiarismCheck, setIsPlagiarismCheck] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOptimize = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setError('');
        setOptimizedText('');
        try {
            const response = await optimizeText(
                inputText,
                audience,
                goal,
                formality,
                complexity,
                tone,
                isPlagiarismCheck,
                isProofread
            );
            setOptimizedText(response.text);
        } catch (err: any) {
            setError(err.message || 'An error occurred while optimizing the text.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-800 text-white">
            <header className="flex-shrink-0 p-4 border-b border-slate-700">
                <h1 className="text-xl font-semibold">Content Optimizer</h1>
            </header>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Control Panel */}
                <div className="w-full md:w-80 lg:w-96 p-4 space-y-6 border-b md:border-b-0 md:border-r border-slate-700 overflow-y-auto">
                    <h2 className="text-lg font-medium">Optimization Settings</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
                        <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Primary Goal</label>
                        <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tone</label>
                        <input type="text" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <Slider label="Formality" value={formality} onChange={e => setFormality(parseInt(e.target.value))} icon={<BookIcon />} valueLabel={`${formality}%`} startLabel="Informal" endLabel="Formal" />
                    <Slider label="Complexity" value={complexity} onChange={e => setComplexity(parseInt(e.target.value))} icon={<ComplexityIcon />} valueLabel={`${complexity}%`} startLabel="Simple" endLabel="Complex" />
                    <div className="space-y-3">
                        <Toggle label="Proofread" enabled={isProofread} onChange={setIsProofread} icon={<ProofreadIcon />} />
                        <Toggle label="Plagiarism Check" enabled={isPlagiarismCheck} onChange={setIsPlagiarismCheck} icon={<PlagiarismCheckIcon />} />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 grid grid-rows-2 grid-cols-1 overflow-hidden">
                    <div className="flex flex-col p-4 border-b border-slate-700">
                        <h2 className="text-lg font-medium mb-2">Original Text</h2>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter your text here..."
                            className="w-full flex-1 p-3 bg-slate-900 rounded-md resize-none focus:outline-none placeholder-slate-500 text-slate-300"
                        />
                    </div>
                    <div className="flex flex-col p-4 overflow-y-auto">
                        <h2 className="text-lg font-medium mb-2">Optimized Text</h2>
                         {isLoading && (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <Loader />
                                <p className="ml-4">Optimizing...</p>
                            </div>
                        )}
                        {error && <p className="text-red-400 text-center">{error}</p>}
                        {!isLoading && !error && !optimizedText && <p className="text-slate-500 text-center mt-8">The optimized version will appear here.</p>}
                        <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(optimizedText) }} />
                    </div>
                </div>
            </div>
             <div className="p-4 border-t border-slate-700 flex-shrink-0 flex justify-center">
                <button
                  onClick={handleOptimize}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full md:w-auto md:px-12 py-2.5 text-base font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-indigo-800 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader /> : <><SparkleIcon /> Optimize</>}
                </button>
            </div>
        </div>
    );
};

export default OptimizerView;
