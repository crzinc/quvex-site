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
    // Studio client statuses
    case "new": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "regular": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "vip": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "inactive": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    // Appointment statuses
    case "scheduled": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "in_progress": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "cancelled": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "no_show": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    // Payment statuses
    case "pending": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "paid": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "overdue": return "bg-red-500/10 text-red-400 border-red-500/20";
    // Message statuses
    case "resolved": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "closed": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    // Plan statuses
    case "basic": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    case "pro": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "enterprise": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    // Priority
    case "low": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    case "normal": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "high": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "urgent": return "bg-red-500/10 text-red-400 border-red-500/20";
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
    case "new": return "Новый";
    case "regular": return "Постоянный";
    case "vip": return "VIP";
    case "inactive": return "Неактивный";
    case "scheduled": return "Запланировано";
    case "in_progress": return "В работе";
    case "cancelled": return "Отменено";
    case "no_show": return "Неявка";
    case "pending": return "Ожидает";
    case "paid": return "Оплачено";
    case "overdue": return "Просрочено";
    case "resolved": return "Решено";
    case "closed": return "Закрыто";
    case "basic": return "Базовый";
    case "pro": return "Профессиональный";
    case "enterprise": return "Корпоративный";
    case "low": return "Низкий";
    case "normal": return "Обычный";
    case "high": return "Высокий";
    case "urgent": return "Срочный";
    default: return status;
  }
}

export function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash": return "Наличные";
    case "card": return "Карта";
    case "transfer": return "Перевод";
    case "other": return "Другое";
    default: return method;
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "low": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    case "normal": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "high": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "urgent": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

export function getCategoryLabel(category: string) {
  switch (category) {
    case "detailing": return "Детейлинг";
    case "wash": return "Мойка";
    case "protection": return "Защита";
    case "interior": return "Интерьер";
    case "exterior": return "Экстерьер";
    case "service": return "Услуга";
    case "product": return "Товар";
    case "subscription": return "Подписка";
    case "other": return "Другое";
    default: return category;
  }
}

export interface StudioTheme {
  primary: string;
  primary_dark: string;
  primary_light: string;
}

export function getStudioTheme(settings?: Record<string, unknown> | null): StudioTheme {
  return {
    primary: (settings?.primary_color as string) || "#a855f7",
    primary_dark: (settings?.primary_dark as string) || "#7c3aed",
    primary_light: (settings?.primary_light as string) || "#c084fc",
  };
}

export function themeVariables(theme: StudioTheme): Record<string, string> {
  return {
    "--color-primary": theme.primary,
    "--color-primary-dark": theme.primary_dark,
    "--color-primary-light": theme.primary_light,
  };
}
