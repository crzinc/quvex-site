import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variant === "default" && "bg-zinc-800 text-zinc-300 border-zinc-700",
        variant === "success" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        variant === "warning" && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        variant === "danger" && "bg-red-500/10 text-red-400 border-red-500/20",
        variant === "info" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
