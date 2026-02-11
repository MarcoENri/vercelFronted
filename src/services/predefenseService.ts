// src/services/predefenseService.ts
import { api } from "../api/api";

// ==================== TYPES ====================

export type PredefenseWindowDto = {
  id: number;
  academicPeriodId?: number;
  academicPeriodName?: string;
  careerId?: number | null;
  careerName?: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type PredefenseSlotDto = {
  id: number;
  windowId?: number;
  startsAt: string;
  endsAt: string;
  bookingId?: number | null;
  booked?: boolean;
  studentId?: number | null;      // <-- agregado
  studentName?: string | null;    // <-- agregado
};

export type PredefenseBookingDto = {
  id: number;
  slotId: number;
  studentId: number;
  createdAt?: string;
};

export type PredefenseObservationDto = {
  id: number;
  authorName: string;
  text: string;
  createdAt: string;
};

export type JuryCareerStudentDto = {
  id: number;
  dni: string;
  fullName: string;
  email: string;
  status: string;
};

// ==================== HELPERS ====================

function normalizeSlot(sl: PredefenseSlotDto): PredefenseSlotDto {
  const booked =
    typeof sl.booked === "boolean" ? sl.booked : sl.bookingId != null;
  return { ...sl, booked };
}

// ==================== ADMIN ====================

export async function adminCreateWindow(body: {
  academicPeriodId?: number | null;
  careerId?: number | null;
  startsAt: string;
  endsAt: string;
}): Promise<PredefenseWindowDto> {
  const res = await api.post<PredefenseWindowDto>("/admin/predefense/windows", body);
  return res.data;
}

export async function adminListWindows(periodId?: number): Promise<PredefenseWindowDto[]> {
  const res = await api.get<PredefenseWindowDto[]>("/admin/predefense/windows", {
    params: periodId ? { periodId } : undefined,
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function adminCloseWindow(id: number): Promise<void> {
  await api.post(`/admin/predefense/windows/${id}/close`);
}

// ==================== JURY / COORDINATOR ====================

export async function juryListWindowsByCareer(
  careerId: number,
  periodId?: number
): Promise<PredefenseWindowDto[]> {
  const res = await api.get<PredefenseWindowDto[]>(
    `/jury/predefense/careers/${careerId}/windows`,
    { params: periodId ? { periodId } : undefined }
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function juryListStudentsByCareer(
  careerId: number,
  periodId?: number
): Promise<JuryCareerStudentDto[]> {
  const res = await api.get<JuryCareerStudentDto[]>(
    `/jury/predefense/careers/${careerId}/students`,
    { params: periodId ? { periodId } : undefined }
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function juryListSlots(windowId: number): Promise<PredefenseSlotDto[]> {
  const res = await api.get<PredefenseSlotDto[]>(
    `/jury/predefense/windows/${windowId}/slots`
  );
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(normalizeSlot);
}

export async function juryCreateSlot(
  windowId: number,
  startsAt: string,
  endsAt: string
): Promise<PredefenseSlotDto> {
  const res = await api.post<PredefenseSlotDto>(
    `/jury/predefense/windows/${windowId}/slots`,
    null,
    { params: { startsAt, endsAt } }
  );
  return normalizeSlot(res.data);
}

export async function juryBookSlot(body: {
  slotId: number;
  studentId: number;
}): Promise<PredefenseBookingDto> {
  const res = await api.post<PredefenseBookingDto>(
    `/jury/predefense/bookings`,
    body
  );
  return res.data;
}

export async function juryListObservations(
  bookingId: number
): Promise<PredefenseObservationDto[]> {
  const res = await api.get<PredefenseObservationDto[]>(
    `/jury/predefense/bookings/${bookingId}/observations`
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function juryCreateObservation(
  bookingId: number,
  body: { text: string }
): Promise<PredefenseObservationDto> {
  const res = await api.post<PredefenseObservationDto>(
    `/jury/predefense/bookings/${bookingId}/observations`,
    body
  );
  return res.data;
}

// ==================== TUTOR ====================

export async function tutorListWindows(periodId?: number): Promise<PredefenseWindowDto[]> {
  const res = await api.get<PredefenseWindowDto[]>(
    `/tutor/predefense/windows`,
    { params: periodId ? { periodId } : undefined }
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function tutorListSlots(windowId: number): Promise<PredefenseSlotDto[]> {
  const res = await api.get<PredefenseSlotDto[]>(
    `/tutor/predefense/windows/${windowId}/slots`
  );
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(normalizeSlot);
}

export async function tutorCreateObservation(
  bookingId: number,
  body: { text: string }
): Promise<PredefenseObservationDto> {
  const res = await api.post<PredefenseObservationDto>(
    `/tutor/predefense/bookings/${bookingId}/observations`,
    body
  );
  return res.data;
}
