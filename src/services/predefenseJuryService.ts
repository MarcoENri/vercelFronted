import { api } from "../api/api";

export type JuryStudentDto = {
  id: number;
  dni: string;
  fullName: string;
  email: string;
  status: string;
};

export type PredefenseWindowDto = {
  id: number;
  careerId?: number | null;
  careerName?: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type PredefenseSlotDto = {
  id: number;
  windowId: number;
  startsAt: string;
  endsAt: string;
  booked: boolean;
};

export type CreateBookingRequest = {
  slotId: number;
  studentId: number;
};

export type BookingDto = {
  id: number;
  slotId: number;
  studentId: number;
  createdAt: string;
};

export type CreateObservationRequest = {
  text: string;
};

export async function listCareerStudents(careerId: number, periodId?: number) {
  const res = await api.get<JuryStudentDto[]>(`/jury/predefense/careers/${careerId}/students`, {
    params: periodId ? { periodId } : undefined,
  });
  return res.data ?? [];
}

export async function listWindowsForCareer(careerId: number, periodId?: number) {
  const res = await api.get<PredefenseWindowDto[]>(`/jury/predefense/careers/${careerId}/windows`, {
    params: periodId ? { periodId } : undefined,
  });
  return res.data ?? [];
}

export async function createSlot(windowId: number, startsAt: string, endsAt: string) {
  const res = await api.post<PredefenseSlotDto>(`/jury/predefense/windows/${windowId}/slots`, null, {
    params: { startsAt, endsAt },
  });
  return res.data;
}

export async function listSlots(windowId: number) {
  const res = await api.get<PredefenseSlotDto[]>(`/jury/predefense/windows/${windowId}/slots`);
  return res.data ?? [];
}

export async function bookSlot(req: CreateBookingRequest) {
  const res = await api.post<BookingDto>(`/jury/predefense/bookings`, req);
  return res.data;
}

export async function createObservation(bookingId: number, req: CreateObservationRequest) {
  await api.post(`/jury/predefense/bookings/${bookingId}/observations`, req);
}
