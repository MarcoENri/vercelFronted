import { api } from "../api/api";

export type CareerCardDto = {
  id: number;
  name: string;
  color: string | null;
  coverImage: string | null;   // filename que guardas en DB
  studentsCount: number;
};

// Lista tarjetas (filtra por periodo si mandas periodId)
export async function listCareerCards(periodId?: number) {
  const res = await api.get<CareerCardDto[]>("/admin/careers/cards", {
    params: periodId ? { periodId } : undefined,
  });
  return res.data ?? [];
}

// Sube portada + (opcional) color
export async function uploadCareerCover(careerId: number, file: File, color?: string) {
  const fd = new FormData();
  fd.append("file", file);
  if (color) fd.append("color", color);

  await api.post(`/admin/careers/${careerId}/cover`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// URL para mostrar imagen
export function careerCoverUrl(coverImage: string | null) {
  if (!coverImage) return null;
  return `http://localhost:8081/admin/careers/cover/${coverImage}`;
}
