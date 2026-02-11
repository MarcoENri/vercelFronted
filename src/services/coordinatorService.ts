import { api } from "../api/api";

export type IncidentDto = {
  id: number;
  stage: string;
  date: string;
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
export type CoordinatorStudentRow = {
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

  incidentCount?: number;
  observationCount?: number;
};

// ✅ DETAIL (2 argumentos)
export async function getStudentDetail(
  id: number | string,
  periodId: number
): Promise<StudentDetailDto> {
  const res = await api.get<StudentDetailDto>(`/coordinator/students/${id}`, {
    params: { periodId },
  });
  return res.data;
}

// ✅ CREATE INCIDENT (3 argumentos)
export async function createIncident(
  studentId: number | string,
  periodId: number,
  body: CreateIncidentRequest
) {
  await api.post(`/coordinator/students/${studentId}/incidents`, body, {
    params: { periodId },
  });
}

// ✅ CREATE OBSERVATION (3 argumentos)
export async function createObservation(
  studentId: number | string,
  periodId: number,
  body: CreateObservationRequest
) {
  await api.post(`/coordinator/students/${studentId}/observations`, body, {
    params: { periodId },
  });
}

// ✅ ASSIGN PROJECT + TUTOR (3 argumentos)
export async function assignProject(
  studentId: number | string,
  periodId: number,
  body: AssignProjectRequest
) {
  // ⚠️ Ajusta el endpoint si tu backend lo tiene diferente
  await api.post(`/coordinator/students/${studentId}/assign-project`, body, {
    params: { periodId },
  });
}
export async function listCoordinatorStudents(periodId: number): Promise<CoordinatorStudentRow[]> {
  const res = await api.get<CoordinatorStudentRow[]>("/coordinator/students", {
    params: { periodId },
  });
  return res.data;
}
