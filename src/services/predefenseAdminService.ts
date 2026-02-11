import { api } from "../api/api";

export type CreatePredefenseWindowRequest = {
  academicPeriodId?: number;   // opcional (si no mandas, usa el activo)
  careerId?: number | null;    // null = todas las carreras
  startsAt: string;            // ISO string
  endsAt: string;              // ISO string
};

export type PredefenseWindowDto = {
  id: number;
  academicPeriodId: number;
  academicPeriodName?: string;
  careerId?: number | null;
  careerName?: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export async function createWindow(req: CreatePredefenseWindowRequest) {
  const res = await api.post<PredefenseWindowDto>("/admin/predefense/windows", req);
  return res.data;
}

export async function listWindows(periodId?: number) {
  const res = await api.get<PredefenseWindowDto[]>("/admin/predefense/windows", {
    params: periodId ? { periodId } : undefined,
  });
  return res.data ?? [];
}

export async function closeWindow(windowId: number) {
  await api.post(`/admin/predefense/windows/${windowId}/close`);
}
