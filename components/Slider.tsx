import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  valueLabel: string;
  description?: string;
  startLabel?: string;
  endLabel?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, onChange, icon, valueLabel, description, startLabel, endLabel }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="flex items-center text-sm font-medium text-gray-300">
          {icon}
          <span className="ml-2">{label}</span>
        </label>
        <span className="text-sm font-mono px-2 py-1 bg-slate-700 rounded-md">{valueLabel}</span>
      </div>
       {description && <p className="text-xs text-gray-400 mb-2 ml-1">{description}</p>}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={onChange}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        {(startLabel || endLabel) && (
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>{startLabel}</span>
            <span>{endLabel}</span>
          </div>
        )}
        <style>{`
          .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #4f46e5;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
            transition: background .2s;
          }
          .slider-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #4f46e5;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
            transition: background .2s;
          }
          .slider-thumb:hover::-webkit-slider-thumb {
            background: #6366f1;
          }
          .slider-thumb:hover::-moz-range-thumb {
            background: #6366f1;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Slider;