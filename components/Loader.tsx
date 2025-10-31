
import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md';
}

const Loader: React.FC<LoaderProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2', // For icon buttons
    md: 'w-6 h-6 border-4', // Original size for main buttons
  };

  return (
    <div className={`${sizeClasses[size]} border-gray-400 border-t-indigo-500 border-solid rounded-full animate-spin`}></div>
  );
};

export default Loader;