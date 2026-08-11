"use client";

import { useRef, useState, useEffect, useId, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  label?: string;
  error?: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function Combobox({
  label,
  error,
  options,
  value,
  onChange,
  id,
  className,
  disabled,
  placeholder,
  size = "md",
}: ComboboxProps) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value ?? "");
  }

  const q = normalize(query);
  const filtered = q
    ? options.filter((o) => normalize(o).includes(q))
    : options;

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
    setQuery(v);
    onChange?.(v);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlighted((h) => (h + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === "Enter") {
      if (open && highlighted >= 0 && filtered[highlighted]) {
        e.preventDefault();
        select(filtered[highlighted]);
      } else {
        close();
      }
    } else if (e.key === "Escape") {
      close();
    } else if (e.currentTarget.value !== undefined) {
      if (!open) setOpen(true);
      setQuery(e.currentTarget.value);
    }
  };

  const sizes: Record<NonNullable<ComboboxProps["size"]>, string> = {
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
        <input
          ref={inputRef}
          id={id ?? autoId}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            setHighlighted(-1);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => !disabled && setOpen(true)}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${autoId}-listbox`}
          aria-autocomplete="list"
          className={cn(
            "w-full bg-zinc-900/50 border rounded-xl text-white placeholder-zinc-500 pr-10",
            "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25",
            "transition-all duration-200",
            open ? "border-primary/50 ring-1 ring-primary/25" : "border-zinc-800 hover:border-zinc-700",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-accent/50",
            sizes[size],
          )}
        />
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
        />

        <AnimatePresence>
          {open && !disabled && (
            <>
              <div className="fixed inset-0 z-30" onClick={close} />
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                role="listbox"
                id={`${autoId}-listbox`}
                className="absolute z-40 mt-2 w-full min-w-[180px] max-h-72 overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 p-1"
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-2.5 text-sm text-zinc-500">—</li>
                ) : (
                  filtered.map((opt, i) => {
                    const isSelected = opt === query;
                    const isHighlighted = i === highlighted;
                    return (
                      <li
                        key={opt}
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setHighlighted(i)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          select(opt);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors",
                          isSelected ? "text-primary bg-primary/10" : "text-zinc-300",
                          isHighlighted && !isSelected && "bg-zinc-800/70 text-white",
                        )}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                      </li>
                    );
                  })
                )}
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}
