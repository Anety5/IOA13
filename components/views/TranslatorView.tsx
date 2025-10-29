import React, { useState, useEffect, useRef } from 'react';
import { TranslatorViewState } from '../../utils/projects';
import { translateText, textToSpeech } from '../../services/geminiService';
import { playAudio } from '../../utils/audio';
import Loader from '../Loader';
import { SaveIcon } from '../icons/SaveIcon';
import SaveToProjectModal from '../SaveToProjectModal';
import { CopyIcon } from '../icons/CopyIcon';
import { SpeakerIcon } from '../icons/SpeakerIcon';

interface TranslatorViewProps {
  state: TranslatorViewState;
  setState: React.Dispatch<React.SetStateAction<TranslatorViewState>>;
}

const languages = {
    'auto': 'Auto-detect', 'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'hy': 'Armenian',
    'az': 'Azerbaijani', 'eu': 'Basque', 'be': 'Belarusian', 'bn': 'Bengali', 'bs': 'Bosnian',
    'bg': 'Bulgarian', 'ca': 'Catalan', 'ceb': 'Cebuano', 'ny': 'Chichewa', 'zh': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)', 'co': 'Corsican', 'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish',
    'nl': 'Dutch', 'en': 'English', 'eo': 'Esperanto', 'et': 'Estonian', 'tl': 'Filipino', 'fi': 'Finnish',
    'fr': 'French', 'fy': 'Frisian', 'gl': 'Galician', 'ka': 'Georgian', 'de': 'German', 'el': 'Greek',
    'gu': 'Gujarati', 'ht': 'Haitian Creole', 'ha': 'Hausa', 'haw': 'Hawaiian', 'iw': 'Hebrew',
    'hi': 'Hindi', 'hmn': 'Hmong', 'hu': 'Hungarian', 'is': 'Icelandic', 'ig': 'Igbo', 'id': 'Indonesian',
    'ga': 'Irish', 'it': 'Italian', 'ja': 'Japanese', 'jw': 'Javanese', 'kn': 'Kannada', 'kk': 'Kazakh',
    'km': 'Khmer', 'ko': 'Korean', 'ku': 'Kurdish (Kurmanji)', 'ky': 'Kyrgyz', 'lo': 'Lao', 'la': 'Latin',
    'lv': 'Latvian', 'lt': 'Lithuanian', 'lb': 'Luxembourgish', 'mk': 'Macedonian', 'mg': 'Malagasy',
    'ms': 'Malay', 'ml': 'Malayalam', 'mt': 'Maltese', 'mi': 'Maori', 'mr': 'Marathi', 'mn': 'Mongolian',
    'my': 'Myanmar (Burmese)', 'ne': 'Nepali', 'no': 'Norwegian', 'ps': 'Pashto', 'fa': 'Persian',
    'pl': 'Polish', 'pt': 'Portuguese', 'pa': 'Punjabi', 'ro': 'Romanian', 'ru': 'Russian', 'sm': 'Samoan',
    'gd': 'Scots Gaelic', 'sr': 'Serbian', 'st': 'Sesotho', 'sn': 'Shona', 'sd': 'Sindhi', 'si': 'Sinhala',
    'sk': 'Slovak', 'sl': 'Slovenian', 'so': 'Somali', 'es': 'Spanish', 'su': 'Sundanese', 'sw': 'Swahili',
    'sv': 'Swedish', 'tg': 'Tajik', 'ta': 'Tamil', 'te': 'Telugu', 'th': 'Thai', 'tr': 'Turkish',
    'uk': 'Ukrainian', 'ur': 'Urdu', 'uz': 'Uzbek', 'vi': 'Vietnamese', 'cy': 'Welsh', 'xh': 'Xhosa',
    'yi': 'Yiddish', 'yo': 'Yoruba', 'zu': 'Zulu'
};

const TranslatorView: React.FC<TranslatorViewProps> = ({ state, setState }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleTranslate = async () => {
    if (!state.sourceText.trim()) return;
    setIsLoading(true);
    try {
      const result = await translateText(state.sourceText, state.sourceLang, state.targetLang);
      setState(prevState => ({ ...prevState, translatedText: result }));
    } catch (error) {
      console.error(error);
      setState(prevState => ({ ...prevState, translatedText: 'An error occurred during translation.' }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Debounce translation
  useEffect(() => {
    const handler = setTimeout(() => {
        if (state.sourceText.trim()) {
            handleTranslate();
        } else {
             setState(s => ({...s, translatedText: ''}));
        }
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sourceText, state.sourceLang, state.targetLang]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(state.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = async () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }

    if (isSpeaking) {
        setIsSpeaking(false);
        return;
    }
    
    if (!state.translatedText) return;
    
    setIsSpeaking(true);
    
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContent = await textToSpeech(state.translatedText);
        audioSourceRef.current = await playAudio(audioContent, audioContextRef.current, () => {
            setIsSpeaking(false);
            audioSourceRef.current = null;
        });
    } catch (err) {
        console.error("Speech generation failed", err);
        setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 text-white">
      <header className="flex-shrink-0 p-4 border-b border-slate-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Translator</h1>
         <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            disabled={!state.translatedText}
        >
            <SaveIcon />
            Save
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Source Text */}
        <div className="flex flex-col">
            <div className="p-3 border-b border-slate-700 flex-shrink-0">
                <select 
                    value={state.sourceLang}
                    onChange={e => setState(s => ({...s, sourceLang: e.target.value}))}
                    className="bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {Object.entries(languages).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                    ))}
                </select>
            </div>
            <textarea
                value={state.sourceText}
                onChange={(e) => setState(s => ({ ...s, sourceText: e.target.value }))}
                placeholder="Enter text to translate..."
                className="w-full h-full p-4 bg-slate-900 resize-none focus:outline-none placeholder-slate-500 text-slate-300"
            />
        </div>
        
        {/* Translated Text */}
        <div className="flex flex-col border-l border-slate-700">
            <div className="p-3 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
                <select 
                    value={state.targetLang}
                    onChange={e => setState(s => ({...s, targetLang: e.target.value}))}
                    className="bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                     {Object.entries(languages).filter(([code]) => code !== 'auto').map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReadAloud}
                        disabled={!state.translatedText || isLoading}
                        className="p-1.5 rounded-full hover:bg-slate-700 disabled:opacity-50"
                        title="Read Aloud"
                    >
                       <SpeakerIcon isSpeaking={isSpeaking}/>
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={!state.translatedText}
                        className="p-1.5 rounded-full hover:bg-slate-700 disabled:opacity-50"
                        title="Copy"
                    >
                       <CopyIcon className={copied ? 'text-green-400' : 'text-slate-400'} />
                    </button>
                </div>
            </div>
            <div className="w-full h-full p-4 bg-slate-900 overflow-y-auto text-slate-300 relative">
                 {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                        <Loader />
                    </div>
                 )}
                 {state.translatedText ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm">{state.translatedText}</pre>
                 ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        Translation will appear here.
                    </div>
                 )}
            </div>
        </div>
      </div>
      <SaveToProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assetType="translator"
        assetContent={state}
        assetNameSuggestion={`Translation - ${state.sourceText.substring(0, 30)}...`}
      />
    </div>
  );
};

export default TranslatorView;