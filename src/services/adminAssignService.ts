// src/services/adminAssignService.ts
import { api } from "../api/api";

export type AdminAssignCareerRequest = {
  careerId: number;
  coordinatorId: number;
  tutorId?: number | null;
  projectName?: string | null;
  onlyUnassigned?: boolean;
  academicPeriodId?: number | null;
};

export async function assignByCareer(req: AdminAssignCareerRequest) {
  const res = await api.post("/admin/assign/career", req);
  return res.data;
}

export type AdminAssignStudentRequest = {
  coordinatorId: number;
  academicPeriodId?: number | null;
};

export async function assignStudentCoordinator(studentId: number, req: AdminAssignStudentRequest) {
  // ✅ JSON puro
  const res = await api.post(`/admin/assign/students/${studentId}/coordinator`, req);
  return res.data;
}

// ✅ alias (para que tu modal use assignStudent)
export async function assignStudent(studentId: number, req: AdminAssignStudentRequest) {
  return assignStudentCoordinator(studentId, req);
}
