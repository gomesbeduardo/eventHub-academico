import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Select({ options, value, onChange, placeholder, className = "" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass flex items-center justify-between gap-3 w-full rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-slate-300/50 dark:focus:ring-slate-500/30 transition-all cursor-pointer"
      >
        <span className={selected && selected.value !== "" ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}>
          {selected ? selected.label : (placeholder ?? "Selecionar")}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 glass-strong rounded-2xl overflow-hidden z-50 py-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2
                ${option.value === value
                  ? "text-slate-800 dark:text-slate-100 font-medium bg-slate-100/60 dark:bg-white/5"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/4"
                }`}
            >
              {option.value === value && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              <span className={option.value === value ? "" : "ml-[21px]"}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
