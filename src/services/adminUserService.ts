// src/services/adminUserService.ts
import { api } from "../api/api";

export type RoleName = "ADMIN" | "COORDINATOR" | "TUTOR" | "JURY";

export type CreateUserRequest = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roles: RoleName[];
};

export type UserResponse = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  enabled: boolean;
  roles: string[]; // te lo devuelve como ROLE_ADMIN etc o como strings, depende tu back
};

export async function createUser(req: CreateUserRequest): Promise<UserResponse> {
  const res = await api.post<UserResponse>("/admin/users", req);
  return res.data;
}

export async function listUsers(role?: string): Promise<UserResponse[]> {
  const res = await api.get<UserResponse[]>("/admin/users", {
    params: role ? { role } : undefined,
  });
  return res.data;
}
