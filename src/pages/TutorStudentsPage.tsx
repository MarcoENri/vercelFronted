import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import { Logout as LogoutIcon } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { logout } from "../services/authService";
import type { TutorStudentRow } from "../services/tutorService";
import { listTutorStudents } from "../services/tutorService";
import { getActiveAcademicPeriod } from "../services/periodService";
import TutorSidebar from "../components/TutorSidebar/TutorSidebar";
import type { UserResponse } from "../services/adminUserService";

const VERDE_INSTITUCIONAL = "#008B8B";

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <TableCell key={j} align="center">
              <Skeleton
                variant="rounded"
                height={20}
                sx={{ mx: "auto", maxWidth: j === 0 ? 30 : "80%" }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function TutorStudentsPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔹 Ahora periodId empieza en null, no desde localStorage
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ─── Dialog cerrar sesión ──────────────────────────────────────────────────
  const [logoutOpen, setLogoutOpen] = useState(false);
  const confirmLogout = () => {
    logout();
    nav("/");
  };

  // 🔹 Resolvemos el período en un efecto
  useEffect(() => {
    const resolve = async () => {
      // 1️⃣ Primero, si viene en la URL, eso manda
      const q = searchParams.get("periodId");
      if (q && !Number.isNaN(Number(q))) {
        const pid = Number(q);
        setPeriodId(pid);
        localStorage.setItem("periodId", String(pid));
        return;
      }

      // 2️⃣ Si no viene en la URL, preguntar SIEMPRE al backend el activo
      try {
        const p = await getActiveAcademicPeriod();
        if (p?.id) {
          setPeriodId(p.id);
          localStorage.setItem("periodId", String(p.id));
        }
      } catch {
        // 3️⃣ Si falla el backend, usar localStorage como backup
        const ls = localStorage.getItem("periodId");
        if (ls && !Number.isNaN(Number(ls))) {
          setPeriodId(Number(ls));
        }
      }
    };

    resolve();
  }, [searchParams]);

  // ✅ PROGRAMACIÓN REACTIVA: polling cada 3s → estudiantes aparecen automáticamente
  // cuando el admin los asigna, sin necesidad de recargar la página
  const { data: rows = [], isLoading: loading } = useQuery<TutorStudentRow[]>({
    queryKey: ["tutorStudents", periodId],
    enabled: !!periodId,
    queryFn: async () => {
      return await listTutorStudents(periodId!);
    },
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchInterval: 3000,             // Consulta cada 3 segundos
    refetchIntervalInBackground: true,  // Sigue aunque la pestaña no esté activa
    refetchOnWindowFocus: true,         // Refresca al volver a la pestaña
  });

  const tutorInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return { username: "", name: "Usuario", email: "", role: "Tutor" };
    try {
      const user: UserResponse = JSON.parse(userStr);
      const role =
        user.roles && user.roles.length > 0
          ? user.roles[0].replace("ROLE_", "")
          : "Tutor";
      return {
        username: user.username || "",
        name: user.fullName || "Usuario",
        email: user.email || "",
        role,
      };
    } catch {
      return { username: "", name: "Usuario", email: "", role: "Tutor" };
    }
  }, []);

  const getInitials = () => {
    const name = tutorInfo.name?.trim();
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  useEffect(() => {
    const savedPhoto = localStorage.getItem("tutorPhoto");
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === "EN_CURSO") return { bg: "#1976d2", text: "white" };
    if (status === "REPROBADO") return { bg: "#d32f2f", text: "white" };
    return { bg: "#2e7d32", text: "white" };
  };

  const showTableSkeleton = loading && rows.length === 0;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <TutorSidebar
        onLogout={() => setLogoutOpen(true)}
        verde={VERDE_INSTITUCIONAL}
        periodId={periodId}
        tutorName={tutorInfo.name}
        tutorInitials={getInitials()}
        tutorEmail={tutorInfo.email}
        tutorUsername={tutorInfo.username}
        tutorRole={tutorInfo.role}
        photoPreview={photoPreview}
        onPhotoChange={(photo) => setPhotoPreview(photo)}
      />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* HEADER — sticky */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1100,
            flexShrink: 0,
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 2,
            px: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              maxWidth: "1200px",
              mx: "auto",
              width: "100%",
            }}
          >
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, lineHeight: 1 }}
              >
                Mis Estudiantes
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Listado general — Periodo: {periodId ?? "Cargando..."}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, py: 4, overflowY: "auto" }}>
          <Container maxWidth="lg">
            <Card
              sx={{
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                border: "1px solid #e1e8ed",
                overflow: "hidden",
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Box
                  sx={{
                    p: 3,
                    borderBottom: "1px solid #eee",
                    bgcolor: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}
                  >
                    Listado General
                  </Typography>
                  {loading && !showTableSkeleton && (
                    <CircularProgress
                      size={18}
                      sx={{ color: VERDE_INSTITUCIONAL }}
                    />
                  )}
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: VERDE_INSTITUCIONAL }}>
                        {[
                          "Cédula",
                          "Nombres",
                          "Apellidos",
                          "Carrera",
                          "Corte",
                          "Sección",
                          "Estado",
                        ].map((head) => (
                          <TableCell
                            key={head}
                            sx={{
                              color: "white",
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              py: 1.2,
                              border: "none",
                            }}
                            align="center"
                          >
                            {head}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {showTableSkeleton ? (
                        <TableSkeleton />
                      ) : rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            align="center"
                            sx={{
                              py: 6,
                              color: "#999",
                              fontStyle: "italic",
                            }}
                          >
                            No hay estudiantes asignados en este periodo.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => {
                          const statusStyle = getStatusColor(row.status);
                          return (
                            <TableRow
                              key={row.id}
                              hover
                              onClick={() =>
                                nav(`/tutor/students/${row.id}`)
                              }
                              sx={{
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f8f9fa" },
                                transition: "0.2s",
                              }}
                            >
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                }}
                              >
                                {row.dni}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ fontSize: "0.85rem" }}
                              >
                                {row.firstName}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ fontSize: "0.85rem" }}
                              >
                                {row.lastName}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontSize: "0.85rem",
                                  color: "#666",
                                }}
                              >
                                {row.career}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontSize: "0.85rem",
                                  color: "#777",
                                }}
                              >
                                {row.corte || "-"}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ fontSize: "0.85rem" }}
                              >
                                {row.section || "MATUTINA"}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={row.status}
                                  size="small"
                                  sx={{
                                    bgcolor: statusStyle.bg,
                                    color: statusStyle.text,
                                    fontWeight: 900,
                                    fontSize: "0.65rem",
                                    borderRadius: "8px",
                                    height: 20,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Container>
        </Box>

        {/* FOOTER — sticky */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: 1100,
            flexShrink: 0,
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 1,
            textAlign: "center",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, opacity: 0.9, fontSize: "11px" }}
          >
            © 2025 — Panel Tutor
          </Typography>
        </Box>
      </Box>

      {/* ── DIALOG CERRAR SESIÓN ─────────────────────────────────────────────── */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            pb: 1,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "rgba(0,139,139,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogoutIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
            Cerrar sesión
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas cerrar sesión? Tu sesión actual se
            terminará.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setLogoutOpen(false)}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#ddd",
              color: "#555",
              "&:hover": { borderColor: "#bbb", bgcolor: "#f9f9f9" },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmLogout}
            variant="contained"
            fullWidth
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: VERDE_INSTITUCIONAL,
              "&:hover": { bgcolor: "#006666" },
            }}
          >
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}