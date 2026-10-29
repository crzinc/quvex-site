import type { NicheConfig, RoleTemplate } from "./types";
import type { Role } from "@/lib/types";

/** Asset definition shared by every auto-related niche: same car, same owner, one history. */
export const vehicleFields: NicheConfig["asset"] = {
  kind: "vehicle",
  identifierLabel: { az: "Dövlət nömrəsi", ru: "Госномер" },
  identifierPlaceholder: "10-AA-123",
  fields: [
    { key: "make", label: { az: "Marka", ru: "Марка" }, type: "car_make", required: true },
    { key: "model", label: { az: "Model", ru: "Модель" }, type: "car_model" },
    { key: "year", label: { az: "Buraxılış ili", ru: "Год выпуска" }, type: "year" },
    { key: "vin", label: { az: "VIN", ru: "VIN" }, type: "text", placeholder: "17 simvol" },
  ],
};

/** Default role workspaces for service businesses: owner sees the business, manager runs the flow, master sees own work. */
export const defaultRoles: Record<Role, RoleTemplate> = {
  owner: {
    home: "overview",
    homeLabel: { az: "İcmal", ru: "Обзор" },
    nav: ["dashboard", "orders", "clients", "reminders", "catalog", "staff", "finance", "settings"],
  },
  manager: {
    home: "board",
    homeLabel: { az: "Lövhə", ru: "Доска" },
    nav: ["dashboard", "orders", "clients", "reminders", "catalog", "staff", "finance"],
  },
  staff: {
    home: "my_work",
    homeLabel: { az: "İşlərim", ru: "Мои работы" },
    nav: ["dashboard", "orders", "clients", "catalog"],
  },
};
