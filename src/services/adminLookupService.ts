// src/services/adminLookupService.ts
import { api } from "../api/api";

export type UserOption = {
  id: number;
  fullName: string;
  username: string;
  email: string;
};

export type CareerOption = {
  id: number;
  name: string;
};

export async function listTutorsForCoordinator(periodId: number): Promise<UserOption[]> {
  const res = await api.get<any[]>("/coordinator/tutors", { params: { periodId } });

  return (res.data ?? []).map((u) => ({
    id: Number(u.id),
    fullName: String(u.fullName ?? ""),
    username: String(u.username ?? ""),
    email: String(u.email ?? ""),
  }));
}

export async function listUsersByRole(role: "COORDINATOR" | "TUTOR"): Promise<UserOption[]> {
  // AJUSTA la URL si la tuya es distinta (muchas veces es /admin/users?role=...)
  const res = await api.get<any[]>("/admin/users", { params: { role } });

  return (res.data ?? []).map((u) => ({
    id: Number(u.id),
    fullName: String(u.fullName ?? ""),
    username: String(u.username ?? ""),
    email: String(u.email ?? ""),
  }));
}

export async function listCareers(): Promise<CareerOption[]> {
  const res = await api.get<CareerOption[]>("/careers");
  return (res.data ?? []).map((c) => ({ id: Number(c.id), name: String(c.name ?? "") }));
}
