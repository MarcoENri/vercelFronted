// src/services/studentEmailService.ts
import { api } from "../api/api";

export type SendStudentEmailRequest = {
  subject: string;
  body: string;
};

export async function sendStudentEmail(studentId: number | string, body: SendStudentEmailRequest) {
  await api.post(`/students/${studentId}/email`, body);
}
