import type { NicheConfig } from "./types";
import { defaultRoles, vehicleFields } from "./shared";

export const autoService: NicheConfig = {
  id: "auto_service",
  enabled: true,
  name: { az: "Avtoservis (STO)", ru: "Автосервис (СТО)" },
  tagline: { az: "Təmir, diaqnostika, ehtiyat hissələri", ru: "Ремонт, диагностика, запчасти" },
  icon: "wrench",
  terms: {
    order: { az: "Sifariş-naryad", ru: "Заказ-наряд" },
    orders: { az: "Sifariş-naryadlar", ru: "Заказ-наряды" },
    asset: { az: "Avtomobil", ru: "Автомобиль" },
    assets: { az: "Avtomobillər", ru: "Автомобили" },
    staff: { az: "Ustalar", ru: "Мастера" },
    service: { az: "İş", ru: "Работа" },
    part: { az: "Ehtiyat hissəsi", ru: "Запчасть" },
  },
  asset: vehicleFields,
  orderFields: [
    { key: "mileage", label: { az: "Qəbul zamanı yürüş, km", ru: "Пробег при приёме, км" }, type: "number" },
    { key: "complaint", label: { az: "Müştərinin şikayəti", ru: "Жалоба клиента" }, type: "text" },
  ],
  statuses: [
    { id: "new", label: { az: "Qəbul edildi", ru: "Принят" }, kind: "open", tone: "slate" },
    { id: "diagnostics", label: { az: "Diaqnostika", ru: "Диагностика" }, kind: "open", tone: "violet" },
    { id: "approval", label: { az: "Razılaşdırma", ru: "Согласование" }, kind: "open", tone: "amber" },
    { id: "in_progress", label: { az: "İşdə", ru: "В работе" }, kind: "open", tone: "blue" },
    { id: "ready", label: { az: "Hazırdır", ru: "Готов" }, kind: "open", tone: "green" },
    { id: "closed", label: { az: "Təhvil verildi", ru: "Выдан" }, kind: "done", tone: "slate" },
    { id: "cancelled", label: { az: "Ləğv edildi", ru: "Отменён" }, kind: "cancelled", tone: "red" },
  ],
  modules: ["orders", "inventory", "reminders", "staff", "finance"],
  reminderPresets: [
    { id: "oil", title: { az: "Mühərrik yağının dəyişdirilməsi", ru: "Замена моторного масла" }, months: 6 },
    { id: "service", title: { az: "Planlı texniki xidmət", ru: "Плановое ТО" }, months: 12 },
    { id: "tires", title: { az: "Mövsümi təkər dəyişimi", ru: "Сезонная смена шин" }, months: 6 },
    { id: "brakes", title: { az: "Əyləc sisteminin yoxlanışı", ru: "Проверка тормозной системы" }, months: 12 },
  ],
  roles: defaultRoles,
  catalog: [
    { kind: "service", name: { az: "Kompüter diaqnostikası", ru: "Компьютерная диагностика" }, category: { az: "Diaqnostika", ru: "Диагностика" }, price: 20, durationMin: 30 },
    { kind: "service", name: { az: "Yağ və filtrin dəyişdirilməsi", ru: "Замена масла и фильтра" }, category: { az: "Texniki xidmət", ru: "ТО" }, price: 15, durationMin: 30 },
    { kind: "service", name: { az: "Hava filtrinin dəyişdirilməsi", ru: "Замена воздушного фильтра" }, category: { az: "Texniki xidmət", ru: "ТО" }, price: 5, durationMin: 10 },
    { kind: "service", name: { az: "Əyləc kolodkalarının dəyişdirilməsi", ru: "Замена тормозных колодок" }, category: { az: "Əyləc sistemi", ru: "Тормозная система" }, price: 25, durationMin: 60 },
    { kind: "service", name: { az: "Xodovoy diaqnostikası", ru: "Диагностика ходовой" }, category: { az: "Asqı", ru: "Подвеска" }, price: 15, durationMin: 30 },
    { kind: "service", name: { az: "Amortizatorun dəyişdirilməsi", ru: "Замена амортизатора" }, category: { az: "Asqı", ru: "Подвеска" }, price: 40, durationMin: 90 },
    { kind: "service", name: { az: "Təkərlərin balanslaşdırılması", ru: "Балансировка колёс" }, category: { az: "Təkərlər", ru: "Шины" }, price: 20, durationMin: 40 },
    { kind: "service", name: { az: "Kondisionerin doldurulması", ru: "Заправка кондиционера" }, category: { az: "Kondisioner", ru: "Кондиционер" }, price: 40, durationMin: 60 },
    { kind: "part", name: { az: "Yağ filtri", ru: "Масляный фильтр" }, category: { az: "Filtrlər", ru: "Фильтры" }, price: 12 },
    { kind: "part", name: { az: "Mühərrik yağı 5W-30, 1 l", ru: "Моторное масло 5W-30, 1 л" }, category: { az: "Yağlar", ru: "Масла" }, price: 14 },
    { kind: "part", name: { az: "Əyləc kolodkaları (ön)", ru: "Тормозные колодки (перед)" }, category: { az: "Əyləc sistemi", ru: "Тормозная система" }, price: 60 },
  ],
};
