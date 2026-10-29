import type { NicheConfig } from "./types";

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
