import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8081",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    // ⚠️ RECOMENDADO: limpia sesión solo con 401 (token inválido/expirado)
    if (status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }

    // Si es 403 puede ser "no tienes permiso" (NO necesariamente token malo)
    return Promise.reject(err);
  }
);
