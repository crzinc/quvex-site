import type { NicheConfig } from "./types";
import { vehicleFields } from "./shared";

export const detailing: NicheConfig = {
  id: "detailing",
  enabled: true,
  name: { az: "Detailing studiyası", ru: "Детейлинг-студия" },
  tagline: { az: "Polirovka, keramika, plyonka", ru: "Полировка, керамика, плёнка" },
  icon: "sparkles",
  terms: {
    order: { az: "Sifariş", ru: "Заказ" },
    orders: { az: "Sifarişlər", ru: "Заказы" },
    asset: { az: "Avtomobil", ru: "Автомобиль" },
    assets: { az: "Avtomobillər", ru: "Автомобили" },
    staff: { az: "Ustalar", ru: "Мастера" },
    service: { az: "Xidmət", ru: "Услуга" },
    part: { az: "Material", ru: "Материал" },
  },
  asset: vehicleFields,
  orderFields: [
    { key: "condition", label: { az: "Kuzovun vəziyyəti", ru: "Состояние кузова" }, type: "text" },
  ],
  statuses: [
    { id: "new", label: { az: "Yeni", ru: "Новый" }, kind: "open", tone: "slate" },
    { id: "in_progress", label: { az: "İşdə", ru: "В работе" }, kind: "open", tone: "blue" },
    { id: "ready", label: { az: "Hazırdır", ru: "Готов" }, kind: "open", tone: "green" },
    { id: "closed", label: { az: "Təhvil verildi", ru: "Выдан" }, kind: "done", tone: "slate" },
    { id: "cancelled", label: { az: "Ləğv edildi", ru: "Отменён" }, kind: "cancelled", tone: "red" },
  ],
  modules: ["orders", "inventory", "reminders", "staff", "finance"],
  reminderPresets: [
    { id: "ceramic", title: { az: "Keramik örtüyün yenilənməsi", ru: "Обновление керамики" }, months: 12 },
    { id: "wash", title: { az: "Detailing yuma", ru: "Детейлинг-мойка" }, months: 1 },
  ],
  catalog: [
    { kind: "service", name: { az: "Kuzovun polirovkası", ru: "Полировка кузова" }, category: { az: "Kuzov", ru: "Кузов" }, price: 250, durationMin: 480 },
    { kind: "service", name: { az: "Keramik örtük", ru: "Керамическое покрытие" }, category: { az: "Qoruma", ru: "Защита" }, price: 450, durationMin: 600 },
    { kind: "service", name: { az: "Salonun kimyəvi təmizlənməsi", ru: "Химчистка салона" }, category: { az: "Salon", ru: "Салон" }, price: 150, durationMin: 300 },
    { kind: "service", name: { az: "PPF plyonka (ön hissə)", ru: "PPF плёнка (перед)" }, category: { az: "Qoruma", ru: "Защита" }, price: 900, durationMin: 960 },
    { kind: "part", name: { az: "Keramik tərkib", ru: "Керамический состав" }, category: { az: "Materiallar", ru: "Материалы" }, price: 120 },
  ],
};
