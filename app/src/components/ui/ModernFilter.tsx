import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, FunnelIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface ModernFilterProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  multiSelect?: boolean;
}

export const ModernFilter: React.FC<ModernFilterProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  icon,
  loading = false,
  disabled = false,
  searchable = false,
  multiSelect = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiSelect ? (value ? value.split(',') : []) : []
  );

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find(opt => opt.value === value);
  const selectedCount = multiSelect ? selectedValues.length : 0;

  const handleSelect = (optionValue: string) => {
    if (multiSelect) {
      const newSelected = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      
      setSelectedValues(newSelected);
      onChange(newSelected.join(','));
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const clearSelection = () => {
    if (multiSelect) {
      setSelectedValues([]);
      onChange('');
    } else {
      onChange('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.modern-filter-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="modern-filter-container relative w-full">
      {/* Label */}
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
        {icon}
        {label}
        {selectedCount > 0 && multiSelect && (
          <span className="status-success text-xs px-2 py-1">
            {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
          </span>
        )}
      </label>

      {/* Filter Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          glass-card w-full px-4 py-3 text-left flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 cursor-pointer'}
          ${isOpen ? 'border-blue-500 shadow-glow' : ''}
          transition-all duration-200
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {loading ? (
            <div className="loading-spinner" />
          ) : (
            icon && <span className="text-slate-400 flex-shrink-0">{icon}</span>
          )}
          
          <span className={`
            truncate ${
              (multiSelect && selectedCount > 0) || (!multiSelect && value) 
                ? 'text-white' 
                : 'text-slate-400'
            }
          `}>
            {multiSelect && selectedCount > 0
              ? `${selectedCount} item${selectedCount > 1 ? 's' : ''} selecionado${selectedCount > 1 ? 's' : ''}`
              : selectedOption?.label || placeholder
            }
          </span>
        </div>

        <div className="flex items-center gap-2">
          {((multiSelect && selectedCount > 0) || (!multiSelect && value)) && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          
          <ChevronDownIcon 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 glass-card border border-slate-600 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* Search */}
          {searchable && (
            <div className="p-3 border-b border-slate-600">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="input-field text-sm"
                autoFocus
              />
            </div>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                Nenhuma opção encontrada
              </div>
            ) : (
              <div className="py-2">
                {filteredOptions.map((option) => {
                  const isSelected = multiSelect 
                    ? selectedValues.includes(option.value)
                    : value === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors
                        flex items-center justify-between group
                        ${isSelected ? 'bg-blue-500/20 text-blue-300' : 'text-slate-300'}
                      `}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {multiSelect && (
                          <div className={`
                            w-4 h-4 rounded border flex items-center justify-center transition-colors
                            ${isSelected 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-slate-500 group-hover:border-slate-400'
                            }
                          `}>
                            {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                          </div>
                        )}
                        
                        <span className="truncate">{option.label}</span>
                      </div>

                      {option.count !== undefined && (
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                          {option.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions for multiselect */}
          {multiSelect && selectedCount > 0 && (
            <div className="border-t border-slate-600 p-3 flex justify-between items-center">
              <span className="text-sm text-slate-400">
                {selectedCount} item{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Limpar tudo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface FilterGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({
  children,
  title,
  description,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-blue-400" />
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-slate-400">{description}</p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
};

export default ModernFilter;