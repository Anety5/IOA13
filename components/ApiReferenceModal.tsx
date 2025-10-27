import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { CopyIcon } from './icons/CopyIcon';

interface ApiReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code: string;
}

const ApiReferenceModal: React.FC<ApiReferenceModalProps> = ({
  isOpen,
  onClose,
  title,
  code,
}) => {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };
  
  // Basic syntax highlighting
  const highlightedCode = code
    .replace(/(\b(import|from|const|let|async|function|await|new|return|if)\b)/g, '<span class="text-pink-400">$1</span>')
    .replace(/(\b(true|false|null)\b)/g, '<span class="text-purple-400">$1</span>')
    .replace(/((?<!\w)'.*?'|`.*?`)/gs, '<span class="text-green-400">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>')
    .replace(/([A-Z][a-zA-Z]*)/g, '<span class="text-sky-300">$1</span>')
    .replace(/(\d+)/g, '<span class="text-orange-400">$1</span>')
    .replace(/(\b(console|JSON)\b)/g, '<span class="text-yellow-300">$1</span>');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 sm:p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700"><CloseIcon /></button>
        </div>
        <div className="bg-slate-900 rounded-lg relative overflow-auto flex-grow">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2"
          >
            <CopyIcon />
            {hasCopied ? 'Copied!' : 'Copy'}
          </button>
          <pre className="p-4 text-sm whitespace-pre-wrap">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ApiReferenceModal;