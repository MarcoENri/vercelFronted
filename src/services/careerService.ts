import { api } from "../api/api";

export type CareerDto = { id: number; name: string; imageUrl?: string };

// Tu función actual para listar
export async function listCareers() {
  const res = await api.get<CareerDto[]>("/careers");
  return res.data;
}

/**
 * ESTA ES LA QUE NECESITAS MI LLAVE:
 * Envía el nombre y la foto de la galería al servidor.
 */
export async function createCareer(formData: FormData): Promise<void> {
  await api.post("/admin/careers", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}