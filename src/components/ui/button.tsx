import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          variant === "primary" && "bg-primary hover:bg-primary-dark text-white shadow-lg hover:shadow-primary/25",
          variant === "secondary" && "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
          variant === "ghost" && "text-zinc-300 hover:text-white hover:bg-zinc-800",
          variant === "outline" && "border border-zinc-700 text-zinc-300 hover:text-white hover:border-primary hover:bg-primary/5",
          variant === "danger" && "bg-accent hover:bg-red-600 text-white",
          size === "sm" && "text-xs px-3 py-1.5 rounded-lg gap-1.5",
          size === "md" && "text-sm px-5 py-2.5 rounded-xl gap-2",
          size === "lg" && "text-base px-8 py-3.5 rounded-xl gap-2.5",
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export { Button };
