"use server";

import { createServiceClient } from "@/lib/supabase/service";

export interface StudioAccountInput {
  name: string;
  owner_email: string;
  owner_phone?: string;
  address?: string;
  description?: string;
  plan: "basic" | "pro" | "enterprise";
  password?: string;
  payment_amount?: number;
  payment_method?: "cash" | "card" | "transfer" | "other";
}

export interface StudioAccountResult {
  studio_id: string;
  slug: string;
  name: string;
  owner_email: string;
  password: string;
  error?: string;
}

const DEFAULT_SERVICES: {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: "detailing" | "wash" | "protection" | "interior" | "exterior" | "other";
}[] = [
  { name: "Мойка", description: "Комплексная мойка кузова и салона", price: 800, duration_minutes: 30, category: "wash" },
  { name: "Пылесос салона", description: "Чистка салона пылесосом", price: 500, duration_minutes: 30, category: "interior" },
  { name: "Химчистка салона", description: "Полная химчистка салона автомобиля", price: 5000, duration_minutes: 120, category: "interior" },
  { name: "Полировка кузова", description: "Полировка кузова автомобиля с защитным покрытием", price: 8000, duration_minutes: 180, category: "detailing" },
  { name: "Керамическое покрытие", description: "Нанесение керамического покрытия на кузов", price: 15000, duration_minutes: 240, category: "protection" },
  { name: "Защитная плёнка (PPF)", description: "Установка защитной плёнки на кузов", price: 30000, duration_minutes: 480, category: "protection" },
  { name: "Тонировка стёкол", description: "Тонировка задних и боковых стёкол", price: 4000, duration_minutes: 120, category: "exterior" },
  { name: "Полировка фар", description: "Восстановление и полировка фар", price: 1500, duration_minutes: 60, category: "detailing" },
  { name: "Детейлинг двигателя", description: "Чистка и защита моторного отсека", price: 3000, duration_minutes: 90, category: "detailing" },
  { name: "Коррекция ЛКП", description: "Удаление царапин и коррекция лакового покрытия", price: 12000, duration_minutes: 240, category: "detailing" },
];

const PLAN_PRICES: Record<string, number> = {
  basic: 1990,
  pro: 4990,
  enterprise: 14900,
};

function transliterate(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

export async function createStudioAccount(input: StudioAccountInput): Promise<StudioAccountResult> {
  const supabase = createServiceClient();

  const name = input.name.trim();
  const email = input.owner_email.trim().toLowerCase();

  if (!name || !email) {
    return { error: "Укажите название студии и email владельца", studio_id: "", slug: "", name: "", owner_email: "", password: "" };
  }

  let slug = transliterate(name) || "studio";
  const { data: existingBySlug } = await supabase
    .from("studios")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (existingBySlug) {
    let i = 2;
    while (true) {
      const candidate = `${slug}-${i}`;
      const { data: clash } = await supabase.from("studios").select("id").eq("slug", candidate).maybeSingle();
      if (!clash) {
        slug = candidate;
        break;
      }
      i++;
    }
  }

  const password = input.password?.trim() || generatePassword();

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "studio" },
  });

  if (userError) {
    return { error: `Не удалось создать пользователя: ${userError.message}`, studio_id: "", slug, name, owner_email: email, password };
  }

  const userId = userData.user.id;

  const { data: studio, error: studioError } = await supabase
    .from("studios")
    .insert({
      name,
      slug,
      owner_email: email,
      owner_phone: input.owner_phone || "",
      address: input.address || "",
      description: input.description || "",
      plan: input.plan,
      settings: {
        primary_color: "#a855f7",
        primary_dark: "#7c3aed",
        primary_light: "#c084fc",
        logo_url: "",
      },
    })
    .select()
    .single();

  if (studioError || !studio) {
    await supabase.auth.admin.deleteUser(userId);
    return { error: `Не удалось создать студию: ${studioError?.message}`, studio_id: "", slug, name, owner_email: email, password };
  }

  const { error: linkError } = await supabase.from("user_studios").insert({
    user_id: userId,
    studio_id: studio.id,
    role: "owner",
  });

  if (linkError) {
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from("studios").delete().eq("id", studio.id);
    return { error: `Не удалось привязать владельца: ${linkError.message}`, studio_id: "", slug, name, owner_email: email, password };
  }

  const { error: servicesError } = await supabase.from("studio_services").insert(
    DEFAULT_SERVICES.map((service, i) => ({
      studio_id: studio.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration_minutes: service.duration_minutes,
      category: service.category,
      is_active: true,
      sort_order: i,
    })),
  );

  if (servicesError) {
    console.error("Seed services error:", servicesError.message);
  }

  const amount = input.payment_amount ?? PLAN_PRICES[input.plan];
  const now = new Date();
  const periodStart = now.toISOString().slice(0, 10);
  const periodEnd = new Date(now.setMonth(now.getMonth() + 1)).toISOString().slice(0, 10);

  const { error: paymentError } = await supabase.from("payments").insert({
    studio_id: studio.id,
    amount,
    status: "paid",
    period_start: periodStart,
    period_end: periodEnd,
    payment_method: input.payment_method || "cash",
    notes: "Оплата при подключении",
    confirmed_at: new Date().toISOString(),
  });

  if (paymentError) {
    console.error("Seed payment error:", paymentError.message);
  }

  return {
    studio_id: studio.id,
    slug,
    name,
    owner_email: email,
    password,
  };
}
