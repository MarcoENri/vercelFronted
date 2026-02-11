import { api } from "../api/api";

export type AcademicPeriodDto = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export async function listAcademicPeriods(onlyActive?: boolean) {
  const res = await api.get<AcademicPeriodDto[]>("/admin/academic-periods", {
    params: { onlyActive },
  });
  return res.data;
}
