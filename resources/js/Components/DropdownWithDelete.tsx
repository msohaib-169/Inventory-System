import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Trash2, Plus, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownWithDeleteProps {
  options: (string | DropdownOption)[];
  value: string;
  onChange: (value: string) => void;
  onDeleteOption?: (value: string) => void;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  allowAddNew?: boolean;
  addNewLabel?: string;
  onAddNew?: () => void;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export const DropdownWithDelete: React.FC<DropdownWithDeleteProps> = ({
  options,
  value,
  onChange,
  onDeleteOption,
  placeholder = 'Select option...',
  allowNone = false,
  noneLabel = 'None / Standard',
  allowAddNew = false,
  addNewLabel = '+ Add New Option',
  onAddNew,
  className = '',
  buttonClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(
    (opt) => opt.value.toLowerCase() === (value || '').toLowerCase()
  );

  const displayLabel = value
    ? selectedOption?.label || value
    : allowNone
    ? noneLabel
    : placeholder;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs border rounded-lg bg-white transition cursor-pointer ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : 'border-slate-300 text-slate-900 font-semibold hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'
        } ${buttonClassName}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100 min-w-[180px]">
          {/* Search Box if list is long */}
          {normalizedOptions.length > 6 && (
            <div className="px-2 py-1.5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <input
                type="text"
                autoFocus
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* None / Standard Option */}
          {allowNone && (
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition ${
                !value
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{noneLabel}</span>
              {!value && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
            </div>
          )}

          {/* Options List with Delete Icon in front */}
          {filteredOptions.length === 0 && !allowNone ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">
              No options found
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = (value || '').toLowerCase() === opt.value.toLowerCase();

              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`group flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {/* Delete icon in front of text */}
                    {onDeleteOption && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOption(opt.value);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer shrink-0"
                        title={`Delete "${opt.label}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />
                  )}
                </div>
              );
            })
          )}

          {/* Add New Option button */}
          {allowAddNew && (
            <div
              onClick={() => {
                onAddNew?.();
                setIsOpen(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 font-bold cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addNewLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
