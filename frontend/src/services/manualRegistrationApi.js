import { api } from "./api.js";

export const manualRegistrationApi = {
  batches: () => api.get("/admin/manual-registrations/batches", "admin"),
  countries: () => api.get("/admin/manual-registrations/countries", "admin"),
  usdRate: () => api.get("/admin/manual-registrations/usd-rate", "admin"),

  preview: (data) =>
    api.post("/admin/manual-registrations/preview", data, "admin"),

  create: (data) =>
    api.post("/admin/manual-registrations", data, "admin"),
};
