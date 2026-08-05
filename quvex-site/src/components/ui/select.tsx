import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-sm text-zinc-400 block">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white",
            "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25",
            "transition-all duration-200",
            error && "border-accent/50",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-accent">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export { Select };
