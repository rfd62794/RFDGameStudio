import type { ReactNode } from 'react';

export interface OptionSelectGroupProps<T> {
  label: string;
  options: { value: T; title: string; subtitle?: string }[];
  selected: T;
  onSelect: (value: T) => void;
  renderOption?: (option: { value: T; title: string; subtitle?: string }, isActive: boolean) => ReactNode;
  className?: string;
}

export function OptionSelectGroup<T>({
  label,
  options,
  selected,
  onSelect,
  renderOption,
  className = '',
}: OptionSelectGroupProps<T>) {
  return (
    <div className={`option-select-group ${className}`}>
      <span className="option-select-label">{label}</span>
      <div className="option-select-row">
        {options.map((opt) => {
          const isActive = opt.value === selected;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onSelect(opt.value)}
              className={`option-select-btn${isActive ? ' option-select-btn--active' : ''}`}
              title={opt.title}
            >
              {renderOption
                ? renderOption(opt, isActive)
                : (
                    <>
                      <span className="option-select-title">{opt.title}</span>
                      {opt.subtitle && <span className="option-select-sub">{opt.subtitle}</span>}
                    </>
                  )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
