import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { api } from "./api/api";
import { Box } from "@mui/material";

// --- LÓGICA REACTIVA ---
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Pages
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminStudentsByCareerPage from "./pages/AdminStudentsByCareerPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import CoordinatorStudentsPage from "./pages/CoordinatorStudentsPage";
import CoordinatorStudentDetailPage from "./pages/CoordinatorStudentDetailPage";
import TutorStudentsPage from "./pages/TutorStudentsPage";
import TutorStudentDetailPage from "./pages/TutorStudentDetailPage";

// Predefensa y Defensa Final
import AdminPredefensePage from "./pages/AdminPredefensePage";
import JuryPredefensePage from "./pages/JuryPredefensePage";
import FinalDefenseAdminPage from "./pages/FinalDefenseAdminPage";
import FinalDefenseJuryPage from "./pages/FinalDefenseJuryPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type MeDto = { username: string; roles: string[] };

const normalizeRoles = (roles: string[]) =>
  roles.map((r) => (r.startsWith("ROLE_") ? r : `ROLE_${r}`));

// Fondo de espera — mismo color que la app, evita el flash blanco
const LoadingScreen = () => (
  <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }} />
);

// --- COMPONENTES DE PROTECCIÓN DE RUTAS ---

function RequireRole({
  children,
  role,
}: {
  children: ReactNode;
  role: "ROLE_ADMIN" | "ROLE_COORDINATOR" | "ROLE_TUTOR" | "ROLE_JURY";
}) {
  return <RequireAnyRole rolesAllowed={[role]}>{children}</RequireAnyRole>;
}

function RequireAnyRole({
  children,
  rolesAllowed,
}: {
  children: ReactNode;
  rolesAllowed: Array<"ROLE_ADMIN" | "ROLE_COORDINATOR" | "ROLE_TUTOR" | "ROLE_JURY">;
}) {
  const token = localStorage.getItem("token");

  // ✅ Lee del caché primero — evita llamada a /me si ya existe
  const [me, setMe] = useState<MeDto | null>(() => {
    const cached = sessionStorage.getItem("me");
    return cached ? JSON.parse(cached) : null;
  });

  // ✅ Solo muestra "cargando" si no hay caché y hay token
  const [loading, setLoading] = useState(!me && !!token);

  useEffect(() => {
    // Si no hay token o ya tenemos usuario en caché, no hacemos nada
    if (!token || me) return;

    (async () => {
      try {
        const res = await api.get<MeDto>("/me");
        setMe(res.data);
        sessionStorage.setItem("me", JSON.stringify(res.data));
      } catch {
        localStorage.clear();
        sessionStorage.clear();
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]); // ✅ Solo depende de token, no de me

  // 1. Sin token → al login
  if (!token) return <Navigate to="/" replace />;

  // 2. Cargando y sin usuario → pantalla del mismo color (sin flash blanco)
  if (loading && !me) return <LoadingScreen />;

  // 3. Terminó de cargar y no hay usuario → al login
  if (!me) return <Navigate to="/" replace />;

  const userRoles = normalizeRoles(me.roles);
  const allowed = rolesAllowed.some((r) => userRoles.includes(r));

  // 4. Tiene el rol → muestra el contenido; si no → al inicio
  return allowed ? <>{children}</> : <Navigate to="/" replace />;
}

// --- REDIRECCIÓN INICIAL POR ROL ---

function HomeRedirect() {
  const token = localStorage.getItem("token");

  // ✅ Lee del caché igual que RequireAnyRole
  const [me, setMe] = useState<MeDto | null>(() => {
    const cached = sessionStorage.getItem("me");
    return cached ? JSON.parse(cached) : null;
  });

  // ✅ Solo carga si no hay caché y hay token
  const [loading, setLoading] = useState(!me && !!token);

  useEffect(() => {
    // Si no hay token o ya tenemos usuario en caché, no hacemos nada
    if (!token || me) return;

    (async () => {
      try {
        const res = await api.get<MeDto>("/me");
        setMe(res.data);
        sessionStorage.setItem("me", JSON.stringify(res.data)); // ✅ guarda en caché
      } catch {
        localStorage.clear();
        sessionStorage.clear();
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]); // ✅ Solo depende de token

  // Sin token → login directo
  if (!token) return <LoginPage />;

  // Cargando → pantalla del mismo color (sin flash blanco)
  if (loading) return <LoadingScreen />;

  const roles = normalizeRoles(me?.roles ?? []);

  if (roles.includes("ROLE_ADMIN")) return <Navigate to="/admin" replace />;
  if (roles.includes("ROLE_COORDINATOR")) return <Navigate to="/coordinator" replace />;
  if (roles.includes("ROLE_TUTOR")) return <Navigate to="/tutor" replace />;
  if (roles.includes("ROLE_JURY")) return <Navigate to="/jury/predefense" replace />;

  // Si llegó aquí, el token es inválido → limpiar y mostrar login
  localStorage.clear();
  sessionStorage.clear();
  return <LoginPage />;
}

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* RUTAS DE ADMINISTRADOR */}
          <Route path="/admin" element={<RequireRole role="ROLE_ADMIN"><AdminStudentsPage /></RequireRole>} />
          <Route path="/admin/students/by-career" element={<RequireRole role="ROLE_ADMIN"><AdminStudentsByCareerPage /></RequireRole>} />
          <Route path="/admin/students/:id" element={<RequireRole role="ROLE_ADMIN"><StudentDetailPage /></RequireRole>} />
          <Route path="/admin/predefense" element={<RequireRole role="ROLE_ADMIN"><AdminPredefensePage /></RequireRole>} />
          <Route path="/admin/final-defense" element={<RequireRole role="ROLE_ADMIN"><FinalDefenseAdminPage /></RequireRole>} />

          {/* RUTAS DE COORDINADOR */}
          <Route path="/coordinator" element={<RequireRole role="ROLE_COORDINATOR"><CoordinatorStudentsPage /></RequireRole>} />
          <Route path="/coordinator/students/:id" element={<RequireRole role="ROLE_COORDINATOR"><CoordinatorStudentDetailPage /></RequireRole>} />
          <Route path="/coordinator/predefense" element={<RequireRole role="ROLE_COORDINATOR"><JuryPredefensePage /></RequireRole>} />
          <Route path="/coordinator/final-defense" element={<RequireRole role="ROLE_COORDINATOR"><FinalDefenseJuryPage /></RequireRole>} />

          {/* RUTAS DE TUTOR */}
          <Route path="/tutor" element={<RequireRole role="ROLE_TUTOR"><TutorStudentsPage /></RequireRole>} />
          <Route path="/tutor/students/:id" element={<RequireRole role="ROLE_TUTOR"><TutorStudentDetailPage /></RequireRole>} />
          <Route path="/tutor/predefense" element={<RequireRole role="ROLE_TUTOR"><JuryPredefensePage /></RequireRole>} />

          {/* RUTAS DE JURADO */}
          <Route
            path="/jury/predefense"
            element={
              <RequireAnyRole rolesAllowed={["ROLE_JURY"]}>
                <JuryPredefensePage />
              </RequireAnyRole>
            }
          />
          <Route
            path="/jury/final-defense"
            element={
              <RequireAnyRole rolesAllowed={["ROLE_JURY", "ROLE_COORDINATOR", "ROLE_TUTOR"]}>
                <FinalDefenseJuryPage />
              </RequireAnyRole>
            }
          />

          {/* REDIRECCIÓN POR DEFECTO */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}