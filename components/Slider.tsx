import React from 'react';

interface SliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  valueLabel: string;
  startLabel: string;
  endLabel: string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  description,
  value,
  onChange,
  icon,
  valueLabel,
  startLabel,
  endLabel,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm font-medium text-gray-300">
          {icon}
          <span className="ml-2">{label}</span>
        </label>
        <span className="text-sm font-semibold text-indigo-400">{valueLabel}</span>
      </div>
       <p className="text-xs text-slate-400">{description}</p>
      <div className="relative pt-1">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={onChange}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-thumb:appearance-none range-thumb:w-5 range-thumb:h-5 range-thumb:bg-white range-thumb:rounded-full range-thumb:shadow-md"
          style={{
            background: `linear-gradient(to right, #6366f1 ${value}%, #475569 ${value}%)`
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
};

export default Slider;