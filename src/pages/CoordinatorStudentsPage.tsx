import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import { Logout as LogoutIcon } from "@mui/icons-material";
import { logout } from "../services/authService";
import type { CoordinatorStudentRow } from "../services/coordinatorService";
import { listCoordinatorStudents } from "../services/coordinatorService";
import { getActiveAcademicPeriod } from "../services/periodService";
import CoordinatorSidebar from "../components/Coordinatorsidebar/Coordinatorsidebar";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function CoordinatorStudentsPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [periodId, setPeriodId] = useState<number | null>(() => {
    const saved = localStorage.getItem("periodId");
    return saved ? Number(saved) : null;
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const confirmLogout = () => {
    logout();
    nav("/");
  };

  useEffect(() => {
    const resolve = async () => {
      const q = searchParams.get("periodId");
      if (q && !Number.isNaN(Number(q))) {
        const pid = Number(q);
        if (pid !== periodId) {
          setPeriodId(pid);
          localStorage.setItem("periodId", String(pid));
        }
        return;
      }
      try {
        const p = await getActiveAcademicPeriod();
        if (p?.id && p.id !== periodId) {
          setPeriodId(p.id);
          localStorage.setItem("periodId", String(p.id));
        }
      } catch (e: any) {
        console.error("Error obteniendo periodo activo:", e);
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          logout();
          nav("/");
        }
      }
    };
    resolve();
  }, [searchParams]);

  // ✅ PROGRAMACIÓN REACTIVA: polling cada 3s → estudiantes aparecen automáticamente
  // cuando el admin los asigna, sin necesidad de recargar la página
  const { data: rows = [], isLoading: loading } = useQuery<CoordinatorStudentRow[]>({
    queryKey: ["coordinatorStudents", periodId],
    enabled: !!periodId,
    queryFn: () => listCoordinatorStudents(periodId!),
    staleTime: 0,
    refetchInterval: 3000,            // Consulta al servidor cada 3 segundos
    refetchIntervalInBackground: true, // Sigue aunque la pestaña no esté en foco
    refetchOnWindowFocus: true,        // Refresca inmediatamente al volver a la pestaña
  });

  const coordinatorInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return { username: "", name: "Usuario", email: "", role: "Coordinador" };
    try {
      const user = JSON.parse(userStr);
      return {
        username: user.username || "",
        name: user.fullName || user.name || "Usuario",
        email: user.email || "",
        role: user.role || "Coordinador",
      };
    } catch { return { username: "", name: "Usuario", email: "", role: "Coordinador" }; }
  }, []);

  useEffect(() => {
    const savedPhoto = localStorage.getItem("coordinatorPhoto");
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === "EN_CURSO") return "primary";
    if (status === "REPROBADO") return "error";
    return "success";
  };

  const getDisplayName = () => coordinatorInfo.name || "Usuario";
  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || "U").toUpperCase();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CoordinatorSidebar
        coordinatorName={getDisplayName()}
        coordinatorInitials={getInitials()}
        coordinatorEmail={coordinatorInfo.email}
        coordinatorUsername={coordinatorInfo.username}
        coordinatorRole={coordinatorInfo.role}
        photoPreview={photoPreview}
        onLogout={() => setLogoutOpen(true)}
        onPhotoChange={setPhotoPreview}
      />

      <Box component="main" sx={{ flexGrow: 1, background: "#f0f2f5", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* HEADER */}
        <Box sx={{ position: "sticky", top: 0, zIndex: 1100, flexShrink: 0, bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 2, px: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Mis Estudiantes</Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Listado general {periodId ? `— Periodo: ${periodId}` : "— Seleccionando periodo..."}
          </Typography>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, py: 3, overflowY: "auto" }}>
          <Container maxWidth="lg">
            <Card sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderLeft: `6px solid ${VERDE_INSTITUCIONAL}` }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: VERDE_INSTITUCIONAL }}>Listado General</Typography>
                  
                </Box>

                {!periodId && !loading ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">No se ha detectado un período académico activo.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {["Cédula", "Nombres", "Apellidos", "Carrera", "Corte", "Sección", "Estado"].map((head) => (
                            <TableCell key={head} align="center" sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>{head}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.length === 0 && !loading ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#777", fontStyle: "italic" }}>No hay estudiantes registrados.</TableCell>
                          </TableRow>
                        ) : (
                          rows.map((row) => (
                            <TableRow
                              key={row.id}
                              onClick={() => nav(`/coordinator/students/${row.id}?periodId=${periodId}`)}
                              sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f5f5f5" }, transition: "0.2s" }}
                            >
                              <TableCell align="center" sx={{ fontWeight: 700 }}>{row.dni}</TableCell>
                              <TableCell>{row.firstName}</TableCell>
                              <TableCell>{row.lastName}</TableCell>
                              <TableCell>{row.career}</TableCell>
                              <TableCell align="center">{row.corte}</TableCell>
                              <TableCell align="center">{row.section}</TableCell>
                              <TableCell align="center">
                                <Chip label={row.status} color={getStatusColor(row.status)} size="small" sx={{ fontWeight: 900, fontSize: "0.75rem", borderRadius: "10px" }} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Container>
        </Box>

        {/* FOOTER */}
        <Box sx={{ position: "sticky", bottom: 0, zIndex: 1100, flexShrink: 0, bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 1, textAlign: "center", boxShadow: "0 -2px 8px rgba(0,0,0,0.1)" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: "11px" }}>© 2025 — Panel Coordinador</Typography>
        </Box>
      </Box>

      {/* DIALOG LOGOUT */}
      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(0,139,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogoutIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>Cerrar sesión</Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">¿Estás seguro de que deseas cerrar sesión?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setLogoutOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: "10px", textTransform: "none" }}>Cancelar</Button>
          <Button onClick={confirmLogout} variant="contained" fullWidth sx={{ borderRadius: "10px", textTransform: "none", bgcolor: VERDE_INSTITUCIONAL }}>Cerrar sesión</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}