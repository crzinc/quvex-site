"use client";

import { forwardRef, useRef, useState, useEffect, useId, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    { label, error, options, value, onChange, id, className, disabled, placeholder, size = "md" },
    ref,
  ) => {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoId = useId();

    const selected = options.find((o) => o.value === value);

    const close = useCallback(() => {
      setOpen(false);
      setHighlighted(-1);
    }, []);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
      };
      const esc = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("mousedown", handler);
      document.addEventListener("keydown", esc);
      return () => {
        document.removeEventListener("mousedown", handler);
        document.removeEventListener("keydown", esc);
      };
    }, [close]);

    const select = (v: string) => {
      onChange?.(v);
      close();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
        setOpen(true);
        e.preventDefault();
        return;
      }
      if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlighted((h) => (h + 1) % options.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlighted((h) => (h - 1 + options.length) % options.length);
        } else if (e.key === "Enter" && highlighted >= 0 && options[highlighted]) {
          select(options[highlighted].value);
        }
      }
    };

    const sizes: Record<NonNullable<SelectProps["size"]>, string> = {
      sm: "px-3 py-2 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-4 py-3 text-base",
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id ?? autoId} className="text-sm text-zinc-400 block">
            {label}
          </label>
        )}
        <div ref={containerRef} className={cn("relative", className)}>
          <button
            ref={ref}
            type="button"
            id={id ?? autoId}
            disabled={disabled}
            onClick={() => !disabled && setOpen((o) => !o)}
            onKeyDown={onKeyDown}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "w-full flex items-center justify-between gap-2 text-left bg-zinc-900/50 border rounded-xl",
              "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25",
              "transition-all duration-200",
              open ? "border-primary/50 ring-1 ring-primary/25" : "border-zinc-800 hover:border-zinc-700",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-accent/50",
              sizes[size],
            )}
          >
            <span className={cn("truncate", !selected && "text-zinc-500")}>
              {selected ? selected.label : placeholder ?? t("select.placeholder")}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200",
                open && "rotate-180 text-primary",
              )}
            />
          </button>

          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-30" onClick={close} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  role="listbox"
                  className="absolute z-40 mt-2 w-full min-w-[180px] max-h-72 overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 p-1"
                >
                  {options.length === 0 ? (
                    <p className="px-3 py-2.5 text-sm text-zinc-500">{t("select.no_options")}</p>
                  ) : (
                    options.map((opt, i) => {
                      const isSelected = opt.value === value;
                      const isHighlighted = i === highlighted;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setHighlighted(i)}
                          onClick={() => select(opt.value)}
                          className={cn(
                            "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
                            isSelected ? "text-primary bg-primary/10" : "text-zinc-300",
                            isHighlighted && !isSelected && "bg-zinc-800/70 text-white",
                          )}
                        >
                          <span className="truncate">{opt.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        {error && <p className="text-xs text-accent">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export { Select };
