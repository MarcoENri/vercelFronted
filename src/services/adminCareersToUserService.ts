import { api } from "../api/api";

export async function assignCareersToUser(
  userId: number,
  careerIds: number[]
): Promise<void> {
  await api.post(`/admin/users/${userId}/careers`, { careerIds });
}
