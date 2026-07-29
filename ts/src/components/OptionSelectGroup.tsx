import type { ReactNode } from 'react';

export interface OptionSelectGroupClassNames {
  group?: string;
  label?: string;
  row?: string;
  btn?: string;
  btnActive?: string;
  title?: string;
  sub?: string;
}

export interface OptionSelectGroupProps<T> {
  label: ReactNode;
  options: { value: T; title: string; subtitle?: string }[];
  selected: T;
  onSelect: (value: T) => void;
  renderOption?: (option: { value: T; title: string; subtitle?: string }, isActive: boolean) => ReactNode;
  classNames?: Partial<OptionSelectGroupClassNames>;
}

export function OptionSelectGroup<T>({
  label,
  options,
  selected,
  onSelect,
  renderOption,
  classNames,
}: OptionSelectGroupProps<T>) {
  const cn = classNames ?? {};
  return (
    <div className={cn.group ?? 'option-select-group'}>
      <span className={cn.label ?? 'option-select-label'}>{label}</span>
      <div className={cn.row ?? 'option-select-row'}>
        {options.map((opt) => {
          const isActive = opt.value === selected;
          const activeCls = isActive ? (cn.btnActive ?? ' option-select-btn--active') : '';
          return (
            <button
              key={String(opt.value)}
              onClick={() => onSelect(opt.value)}
              className={`${cn.btn ?? 'option-select-btn'}${activeCls}`}
              title={opt.title}
            >
              {renderOption
                ? renderOption(opt, isActive)
                : (
                    <>
                      <span className={cn.title ?? 'option-select-title'}>{opt.title}</span>
                      {opt.subtitle && <span className={cn.sub ?? 'option-select-sub'}>{opt.subtitle}</span>}
                    </>
                  )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
