import { api } from "../api/api";

/** Tipos (ajusta si tu backend devuelve más campos) */
export type IncidentDto = {
  id: number;
  stage: string;
  date: string;       // "2026-01-01"
  reason: string;
  action: string;
  createdAt: string;
  createdByUserId?: number | null;
};

export type ObservationDto = {
  id: number;
  author: string;
  text: string;
  createdAt: string;
  authorUserId?: number | null;
};

export type StudentDetailDto = {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  corte: string;
  section: string;
  modality?: string | null;
  career: string;
  titulationType: string;
  status: string;

  tutorId?: number | null;
  coordinatorId?: number | null;

  tutorName?: string | null;
  tutorUsername?: string | null;
  coordinatorName?: string | null;
  coordinatorUsername?: string | null;

  thesisProject?: string | null;
  thesisProjectSetAt?: string | null;

  incidentCount: number;
  observationCount: number;
  incidents: IncidentDto[];
  observations: ObservationDto[];
};

export type CreateIncidentRequest = {
  stage: string;
  date: string; // "YYYY-MM-DD"
  reason: string;
  action: string;
};

export type CreateObservationRequest = {
  text: string;
};

export type AssignProjectRequest = {
  projectName: string;
  tutorId: number;
};

/** ✅ GET detalle con periodId */
export async function getStudentDetail(
  id: number | string,
  periodId: number
): Promise<StudentDetailDto> {
  const res = await api.get<StudentDetailDto>(`/coordinator/students/${id}`, {
    params: { periodId },
  });
  return res.data;
}

/** ✅ POST incidencia con periodId */
export async function createIncident(
  studentId: number | string,
  periodId: number,
  body: CreateIncidentRequest
) {
  await api.post(`/coordinator/students/${studentId}/incidents`, body, {
    params: { periodId },
  });
}

/** ✅ POST observación con periodId */
export async function createObservation(
  studentId: number | string,
  periodId: number,
  body: CreateObservationRequest
) {
  await api.post(`/coordinator/students/${studentId}/observations`, body, {
    params: { periodId },
  });
}

/** ✅ POST asignación proyecto+tutor con periodId */
export async function assignProject(
  studentId: number | string,
  periodId: number,
  body: AssignProjectRequest
) {
  await api.post(`/coordinator/students/${studentId}/assign`, body, {
    params: { periodId },
  });
}
