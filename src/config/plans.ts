/**
 * Subscription plans. Plans differ only by the number of users (logins);
 * every feature is available on every plan. Change prices and limits here.
 *
 * user_limit is copied to tenants.user_limit when the platform admin sets a plan,
 * and the database enforces it on every new membership.
 */
export type PaidPlanId = "solo" | "start" | "pro" | "business";
export type PlanId = "trial" | PaidPlanId;

export interface Plan {
  id: PaidPlanId;
  price: number; // AZN per month
  userLimit: number | null; // null = unlimited
  popular?: boolean;
  features: { az: string[]; ru: string[] };
}

export const TRIAL_DAYS = 14;
/** The trial behaves like Pro so the business can try a full team. Must match the DB default of tenants.user_limit. */
export const TRIAL_USER_LIMIT = 10;

export const PLANS: Plan[] = [
  {
    id: "solo",
    price: 15,
    userLimit: 1,
    features: {
      az: ["1 istifadəçi — yalnız sahib", "Bütün funksiyalar", "Limitsiz müştəri və sifariş", "Məlumatların pulsuz köçürülməsi"],
      ru: ["1 пользователь — только владелец", "Все функции", "Безлимит клиентов и заказов", "Бесплатный перенос данных"],
    },
  },
  {
    id: "start",
    price: 29,
    userLimit: 3,
    features: {
      az: ["3 istifadəçi — sahib + 2 əməkdaş", "Bütün funksiyalar", "Rollar: menecer, usta", "Məlumatların pulsuz köçürülməsi"],
      ru: ["3 пользователя — владелец + 2 сотрудника", "Все функции", "Роли: менеджер, мастер", "Бесплатный перенос данных"],
    },
  },
  {
    id: "pro",
    price: 59,
    userLimit: 10,
    popular: true,
    features: {
      az: ["10 istifadəçiyə qədər", "Bütün funksiyalar", "Rollar: menecer, usta", "Prioritet dəstək"],
      ru: ["До 10 пользователей", "Все функции", "Роли: менеджер, мастер", "Приоритетная поддержка"],
    },
  },
  {
    id: "business",
    price: 99,
    userLimit: null,
    features: {
      az: ["Limitsiz istifadəçi", "Bütün funksiyalar", "Şəxsi menecer", "Komandanın təlimi"],
      ru: ["Безлимит пользователей", "Все функции", "Персональный менеджер", "Обучение команды"],
    },
  },
];

/** Prepay discounts. */
export const PERIODS = [
  { months: 1, discount: 0 },
  { months: 6, discount: 10 },
  { months: 12, discount: 20 },
] as const;

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function planPrice(id: string): number {
  return getPlan(id)?.price ?? 0;
}

export function planUserLimit(id: string): number | null {
  return id === "trial" ? TRIAL_USER_LIMIT : (getPlan(id)?.userLimit ?? TRIAL_USER_LIMIT);
}

/** Total for a prepaid period, rounded to whole manats. */
export function periodTotal(planId: string, months: number): number {
  const discount = PERIODS.find((p) => p.months === months)?.discount ?? 0;
  return Math.round(planPrice(planId) * months * (1 - discount / 100));
}
