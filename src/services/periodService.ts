import { api } from "../api/api";

export type AcademicPeriodDto = {
  id: number;
  name: string;
  startDate: string; // "2026-01-01"
  endDate: string;   // "2026-06-30"
  isActive: boolean;
};

export type CreateAcademicPeriodRequest = {
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  isActive: boolean;
};

// ✅ lista (admin)
export async function listAcademicPeriods(onlyActive?: boolean): Promise<AcademicPeriodDto[]> {
  const res = await api.get<AcademicPeriodDto[]>("/admin/academic-periods", {
    params: onlyActive ? { onlyActive: true } : undefined,
  });
  return Array.isArray(res.data) ? res.data : [];
}

// ✅ crear (admin)
export async function createAcademicPeriod(body: CreateAcademicPeriodRequest): Promise<AcademicPeriodDto> {
  const res = await api.post<AcademicPeriodDto>("/admin/academic-periods", body);
  return res.data;
}

// ✅ activar (admin)
export async function activateAcademicPeriod(periodId: number): Promise<void> {
  await api.post(`/admin/academic-periods/${periodId}/activate`);
}

// ✅ activo (tutor/coordinator/admin)
export async function getActiveAcademicPeriod(): Promise<AcademicPeriodDto | null> {
  try {
    const res = await api.get<AcademicPeriodDto>("/admin/academic-periods/active");
    return res.data ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

// ✅ resumen (admin)
export type PeriodSummaryRow = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  studentCount: number;
};

export async function getAcademicPeriodSummary(): Promise<PeriodSummaryRow[]> {
  const res = await api.get<PeriodSummaryRow[]>("/admin/academic-periods/summary");
  return Array.isArray(res.data) ? res.data : [];
}

// ✅ cuántos están sin periodo (admin)
export async function getUnassignedStudentsCount(): Promise<number> {
  const res = await api.get<{ sinPeriodo: number }>("/admin/academic-periods/unassigned-count");
  return res.data?.sinPeriodo ?? 0;
}

// ✅ asignar periodo a estudiantes null (admin)
export async function assignNullStudentsToPeriod(periodId: number): Promise<{ periodId: number; updatedCount: number }> {
  const res = await api.post<{ periodId: number; updatedCount: number }>(
    `/admin/academic-periods/${periodId}/assign-null-students`
  );
  return res.data;
}
