import { api } from "../api/api";

export type TutorStudentRow = {
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

  thesisProject?: string | null;
  thesisProjectSetAt?: string | null;

  tutorId?: number | null;
  coordinatorId?: number | null;

  incidentCount?: number;
  observationCount?: number;
};

export type IncidentDto = {
  id: number;
  stage: string;
  date: string;      // "2026-01-01"
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
  thesisProject?: string | null;
  thesisProjectSetAt?: string | null;

  incidentCount: number;
  observationCount: number;

  incidents: IncidentDto[];
  observations: ObservationDto[];
};

export type CreateIncidentRequest = {
  stage: string;
  date: string;
  reason: string;
  action: string;
};

export type CreateObservationRequest = {
  text: string;
};

export async function listTutorStudents(periodId: number): Promise<TutorStudentRow[]> {
  const res = await api.get<TutorStudentRow[]>("/tutor/students", {
    params: { periodId },
  });
  return res.data;
}

export async function getTutorStudentDetail(
  id: number | string,
  periodId: number
): Promise<StudentDetailDto> {
  const res = await api.get<StudentDetailDto>(`/tutor/students/${id}`, {
    params: { periodId },
  });
  return res.data;
}

export async function createTutorIncident(
  studentId: number | string,
  periodId: number,
  body: CreateIncidentRequest
) {
  await api.post(`/tutor/students/${studentId}/incidents`, body, {
    params: { periodId },
  });
}

export async function createTutorObservation(
  studentId: number | string,
  periodId: number,
  body: CreateObservationRequest
) {
  await api.post(`/tutor/students/${studentId}/observations`, body, {
    params: { periodId },
  });
}