import type { NicheConfig } from "./types";
import { defaultRoles, vehicleFields } from "./shared";

export const carWash: NicheConfig = {
  id: "car_wash",
  enabled: true,
  name: { az: "Avtoyuma", ru: "Автомойка" },
  tagline: { az: "Yuma, növbə, sadiq müştərilər", ru: "Мойка, очередь, постоянные клиенты" },
  icon: "droplets",
  terms: {
    order: { az: "Yuma", ru: "Мойка" },
    orders: { az: "Yumalar", ru: "Мойки" },
    asset: { az: "Avtomobil", ru: "Автомобиль" },
    assets: { az: "Avtomobillər", ru: "Автомобили" },
    staff: { az: "Yuyucular", ru: "Мойщики" },
    service: { az: "Xidmət", ru: "Услуга" },
    part: { az: "Məhsul", ru: "Товар" },
  },
  asset: vehicleFields,
  orderFields: [],
  statuses: [
    { id: "queue", label: { az: "Növbədə", ru: "В очереди" }, kind: "open", tone: "slate" },
    { id: "in_progress", label: { az: "Yuyulur", ru: "Моется" }, kind: "open", tone: "blue" },
    { id: "closed", label: { az: "Bitdi", ru: "Готово" }, kind: "done", tone: "green" },
    { id: "cancelled", label: { az: "Ləğv edildi", ru: "Отменено" }, kind: "cancelled", tone: "red" },
  ],
  modules: ["orders", "reminders", "staff", "finance"],
  reminderPresets: [{ id: "wash", title: { az: "Növbəti yuma", ru: "Следующая мойка" }, months: 1 }],
  // Washers take the next car in line rather than assigned jobs, so their home is the queue.
  roles: {
    ...defaultRoles,
    staff: { home: "board", homeLabel: { az: "Növbə", ru: "Очередь" }, nav: ["dashboard", "orders", "clients"] },
  },
  catalog: [
    { kind: "service", name: { az: "Kuzov yuma", ru: "Мойка кузова" }, category: { az: "Yuma", ru: "Мойка" }, price: 10, durationMin: 20 },
    { kind: "service", name: { az: "Kompleks yuma", ru: "Комплексная мойка" }, category: { az: "Yuma", ru: "Мойка" }, price: 20, durationMin: 45 },
    { kind: "service", name: { az: "Mum ilə örtük", ru: "Покрытие воском" }, category: { az: "Əlavə", ru: "Дополнительно" }, price: 10, durationMin: 15 },
  ],
};
