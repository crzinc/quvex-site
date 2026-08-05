import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-sm text-zinc-400 block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500",
            "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25",
            "transition-all duration-200",
            error && "border-accent/50 focus:border-accent focus:ring-accent/25",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-accent">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
