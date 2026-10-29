export type PlanId = "trial" | "start" | "pro";

export interface Plan {
  id: Exclude<PlanId, "trial">;
  price: number; // AZN per month
  popular?: boolean;
  features: { az: string[]; ru: string[] };
}

export const TRIAL_DAYS = 14;

export const PLANS: Plan[] = [
  {
    id: "start",
    price: 29,
    features: {
      az: ["1 filial, 3 istifadəçi", "Limitsiz müştəri və sifariş", "Anbar və kassa", "WhatsApp xatırlatmaları", "Məlumatların pulsuz köçürülməsi"],
      ru: ["1 филиал, 3 пользователя", "Безлимит клиентов и заказов", "Склад и касса", "Напоминания в WhatsApp", "Бесплатный перенос данных"],
    },
  },
  {
    id: "pro",
    price: 59,
    popular: true,
    features: {
      az: ["Start-dakı hər şey", "Limitsiz istifadəçi", "Ustaların maaşı", "Maliyyə hesabatları", "Prioritet dəstək"],
      ru: ["Всё из Start", "Безлимит пользователей", "Зарплата мастеров", "Финансовые отчёты", "Приоритетная поддержка"],
    },
  },
];

export function planPrice(plan: string): number {
  return PLANS.find((p) => p.id === plan)?.price ?? 0;
}
