import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string) {
  switch (status) {
    case "lead": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "negotiation": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "development": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "support": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "lead": return "Лид";
    case "negotiation": return "Переговоры";
    case "development": return "В разработке";
    case "completed": return "Завершён";
    case "support": return "Поддержка";
    default: return status;
  }
}
