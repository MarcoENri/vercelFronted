import { api } from "../api/api";

type LoginResponse = { token: string };

/** ✅ Iniciar sesión y guardar persistencia */
export async function login(username: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/login", { username, password });
  localStorage.setItem("token", res.data.token);
  return res.data;
}

/** ✅ Cerrar sesión de forma selectiva */
export function logout() {
  localStorage.removeItem("token");
  // Nota: Mantenemos el resto de claves como adminPeriodId intactas.
}

/** * ✅ Forgot password (Actualizado)
 * El backend ahora solo confirma el envío del correo sin exponer el token.
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/auth/forgot-password", { email });
  return res.data;
}

/** ✅ Reset password (Usando el token que el usuario recibe por email) */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, newPassword });
}