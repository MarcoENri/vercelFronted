import { api } from "../api/api";

export type CareerCardDto = {
  id: number;
  name: string;
  color?: string | null;
  coverImage?: string | null;
  studentsCount: number;
};

export async function listCareerCards(periodId?: number) {
  const res = await api.get<CareerCardDto[]>("/admin/careers/cards", {
    params: periodId ? { periodId } : {},
  });
  return res.data;
}

export async function uploadCareerCover(careerId: number, file: File, color?: string) {
  const fd = new FormData();
  fd.append("file", file);
  if (color) fd.append("color", color);

  await api.post(`/admin/careers/${careerId}/cover`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}