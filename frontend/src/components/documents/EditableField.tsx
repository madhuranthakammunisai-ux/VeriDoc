import React from 'react';

interface EditableFieldProps {
  label: string;
  value: any;
  onChange: (val: any) => void;
  type?: 'text' | 'number' | 'date';
  disabled?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
}) => {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => {
          const val = type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value;
          onChange(val);
        }}
        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition-colors"
      />
    </div>
  );
};

