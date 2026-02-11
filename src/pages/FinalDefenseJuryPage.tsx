import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Drawer,
  IconButton,
  Divider,
  Stack,
  Paper,
  Tooltip,
} from "@mui/material";

import {
  Logout as LogoutOutlined,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AccountCircle as AccountCircleIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

// 🟢 PASO 1 — Importar el tipo de usuario correcto
import type { UserResponse } from "../services/adminUserService";

import {
  juryFinalMyBookings,
  juryFinalBookingDetail,
  juryFinalEvaluate,
  juryFinalDownloadActaPdf,
  juryFinalDownloadRubricPdf,
  type FinalDefenseBookingDto,
  type FinalDefenseEvaluationDto,
} from "../services/finalDefenseService";
import CoordinatorSidebar from "../components/Coordinatorsidebar/Coordinatorsidebar";
import TutorSidebar from "../components/TutorSidebar/TutorSidebar";


const VERDE_INSTITUCIONAL = "#008B8B";

type StudentEvalState = {
  rubricScore: number;
  extraScore: number;
  observations: string;
};

export default function FinalDefenseJuryPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [bookings, setBookings] = useState<FinalDefenseBookingDto[]>([]);
  const [openEval, setOpenEval] = useState(false);
  const [activeBooking, setActiveBooking] = useState<FinalDefenseBookingDto | null>(null);
  const [evaluations, setEvaluations] = useState<FinalDefenseEvaluationDto[]>([]);

  const [studentEvals, setStudentEvals] = useState<Record<number, StudentEvalState>>({});
  const [error, setError] = useState("");

  // Detectar si es coordinador
  const isCoordinator = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      const roles = user.roles || [];
      return roles.some((r: string) => r.includes("COORDINATOR") || r.includes("ADMIN"));
    } catch {
      return false;
    }
  }, []);

  // 🟢 PASO 2 — Reemplazo de juryInfo para usar fullName y UserResponse
  const juryInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");

    if (!userStr) {
      return { username: "", name: "", email: "", role: "Jurado" };
    }

    try {
      const user: UserResponse = JSON.parse(userStr);

      return {
        username: user.username,
        name: user.fullName ?? "",
        email: user.email ?? "",
        role: (user.roles && user.roles[0]) ? user.roles[0].replace("ROLE_", "") : "Jurado",
      };
    } catch {
      return { username: "", name: "", email: "", role: "Jurado" };
    }
  }, []);

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("periodId");
    if (!ls) return null;
    const n = Number(ls);
    return Number.isFinite(n) ? n : null;
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const b = await juryFinalMyBookings();
      setBookings(Array.isArray(b) ? b : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const photoKey = isCoordinator ? "coordinatorPhoto" : "juryPhoto";
    const savedPhoto = localStorage.getItem(photoKey);
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, [isCoordinator]);

  const handleLogout = () => {
    if (!confirm("¿Cerrar sesión?")) return;
    localStorage.clear();
    nav("/");
  };

  const handlePhotoChange = (photoData: string) => {
    setPhotoPreview(photoData);
  };

  const openEvaluate = async (b: FinalDefenseBookingDto) => {
    setActiveBooking(b);
    setOpenEval(true);
    setError("");

    setLoading(true);
    try {
      const detail = await juryFinalBookingDetail(b.id);
      setActiveBooking(detail.booking);
      setEvaluations(detail.evaluations ?? []);

      if (detail.booking.students?.length) {
        const initial: Record<number, StudentEvalState> = {};
        detail.booking.students.forEach((s) => {
          initial[s.id] = {
            rubricScore: 0,
            extraScore: 0,
            observations: "",
          };
        });
        setStudentEvals(initial);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveStudentEvaluation = async (studentId: number) => {
    const ev = studentEvals[studentId];
    if (!ev) return;

    if (ev.rubricScore < 0 || ev.rubricScore > 50)
      return alert("Rúbrica debe estar entre 0 y 50");

    if (ev.extraScore < 0 || ev.extraScore > 50)
      return alert("Extra debe estar entre 0 y 50");

    setLoading(true);
    try {
      await juryFinalEvaluate(activeBooking!.id, {
        studentId,
        rubricScore: ev.rubricScore,
        extraScore: ev.extraScore,
        observations: ev.observations || null,
      });

      const detail = await juryFinalBookingDetail(activeBooking!.id);
      setEvaluations(detail.evaluations ?? []);
      alert("Nota guardada correctamente ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadActa = async (bookingId: number) => {
    setLoading(true);
    try {
      const blob = await juryFinalDownloadActaPdf(bookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acta_final_defense_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo descargar el acta");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 PASO 3 — Reemplazo de getInitials() para manejar fullName
  const getInitials = () => {
    const name = juryInfo?.name?.trim();

    if (!name) return "U"; // Usuario genérico

    const parts = name.split(" ").filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return parts[0][0].toUpperCase();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR PARA COORDINADOR */}
      {isCoordinator ? (
  <CoordinatorSidebar
    coordinatorName={juryInfo.name}
    coordinatorInitials={getInitials()}
    coordinatorEmail={juryInfo.email}
    coordinatorUsername={juryInfo.username}
    coordinatorRole={juryInfo.role}
    photoPreview={photoPreview}
    onLogout={handleLogout}
    onPhotoChange={handlePhotoChange}
  />
) : (
  <TutorSidebar
    onLogout={handleLogout}
    verde={VERDE_INSTITUCIONAL}
    periodId={periodId}
  />
)}
      {/* CONTENIDO PRINCIPAL */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          background: "#f5f7f9",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 2,
            px: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Defensa Final
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Panel de Jurado {periodId ? `— Periodo: ${periodId}` : ""}
              </Typography>
            </Box>

            {/* AVATAR SOLO SI NO ES COORDINADOR */}
            {!isCoordinator && (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ p: 0 }}>
                <Avatar
                  src={photoPreview || undefined}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "white",
                    color: VERDE_INSTITUCIONAL,
                    fontWeight: 900,
                  }}
                >
                  {getInitials()}
                </Avatar>
              </IconButton>
            )}
          </Box>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, py: 3 }}>
          <Container maxWidth="lg">
            <Card
              sx={{
                borderRadius: "25px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                border: "1px solid #e1e8ed",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL, mb: 2.5 }}
                >
                  Mis Defensas Finales ({bookings.length})
                </Typography>
                {bookings.map((b) => (
                  <Paper
                    key={b.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      mb: 2,
                      border: "2px solid #e9ecef",
                      borderRadius: "20px",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                        Defensa #{b.id}
                      </Typography>
                      <Chip
                        label="Defensa Final"
                        size="small"
                        sx={{
                          bgcolor: VERDE_INSTITUCIONAL,
                          color: "white",
                          fontWeight: 900,
                        }}
                      />
                    </Box>
                    <Stack spacing={0.8} sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Proyecto:</strong> {b.projectName || "-"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Estudiantes:</strong>{" "}
                        {b.students?.map((s) => s.fullName).join(" / ")}
                      </Typography>
                    </Stack>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Button
                        onClick={() => openEvaluate(b)}
                        variant="contained"
                        startIcon={<AssessmentIcon />}
                        sx={{
                          bgcolor: VERDE_INSTITUCIONAL,
                          borderRadius: "50px",
                          fontWeight: 900,
                        }}
                      >
                        Evaluar
                      </Button>
                      <Button
                        onClick={() => handleDownloadActa(b.id)}
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        sx={{
                          color: VERDE_INSTITUCIONAL,
                          borderColor: VERDE_INSTITUCIONAL,
                          borderRadius: "50px",
                          fontWeight: 900,
                        }}
                      >
                        Acta
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </CardContent>
            </Card>
          </Container>
        </Box>

        {/* FOOTER */}
        <Box
          sx={{
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="body2">© 2025 - Panel de Jurado</Typography>
        </Box>
      </Box>

      {/* MODAL EVALUAR */}
      <Dialog
        open={openEval}
        onClose={() => setOpenEval(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: "25px" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
            color: VERDE_INSTITUCIONAL,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Evaluar Defensa {activeBooking ? `#${activeBooking.id}` : ""}
          <Button
            onClick={async () => {
              try {
                const blob = await juryFinalDownloadRubricPdf(activeBooking!.id);
                window.open(window.URL.createObjectURL(blob), "_blank");
              } catch {
                alert("No se pudo abrir rúbrica.");
              }
            }}
            variant="text"
            startIcon={<VisibilityIcon />}
            sx={{ color: VERDE_INSTITUCIONAL, fontWeight: 900 }}
          >
            Ver Rúbrica PDF
          </Button>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: "#f8f9fa" }}>
          {activeBooking && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  activeBooking.students.length > 1 ? "1fr 1fr" : "1fr",
                gap: 3,
              }}
            >
              {activeBooking.students.map((s) => {
                const ev = studentEvals[s.id];
                const total = (ev?.rubricScore || 0) + (ev?.extraScore || 0);
                const verdict = total >= 70 ? "APROBADO" : "REPROBADO";
                const evalsStudent = evaluations.filter((e) => e.studentId === s.id);

                return (
                  <Paper
                    key={s.id}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 900, mb: 0.5, color: VERDE_INSTITUCIONAL }}
                    >
                      {s.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Identificación: {s.dni}
                    </Typography>

                    <Box
                      sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
                    >
                      <TextField
                        label="Rúbrica (0–50)"
                        type="number"
                        fullWidth
                        value={ev?.rubricScore || 0}
                        onChange={(e) =>
                          setStudentEvals({
                            ...studentEvals,
                            [s.id]: {
                              ...ev,
                              rubricScore: Number(e.target.value),
                            },
                          })
                        }
                      />
                      <TextField
                        label="Extra (0–50)"
                        type="number"
                        fullWidth
                        value={ev?.extraScore || 0}
                        onChange={(e) =>
                          setStudentEvals({
                            ...studentEvals,
                            [s.id]: {
                              ...ev,
                              extraScore: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </Box>

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: total >= 70 ? "#f0fff4" : "#fff5f5",
                        borderRadius: 2,
                        textAlign: "center",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                        Total: {total}/100 —{" "}
                        <span
                          style={{
                            color: verdict === "APROBADO" ? "#2e7d32" : "#d32f2f",
                          }}
                        >
                          {verdict}
                        </span>
                      </Typography>
                    </Box>

                    <TextField
                      label="Observaciones"
                      fullWidth
                      multiline
                      minRows={2}
                      sx={{ mt: 2 }}
                      placeholder="Comentarios sobre el desempeño..."
                      value={ev?.observations || ""}
                      onChange={(e) =>
                        setStudentEvals({
                          ...studentEvals,
                          [s.id]: {
                            ...ev,
                            observations: e.target.value,
                          },
                        })
                      }
                    />

                    <Box sx={{ mt: 3, mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 900, mb: 1, color: "text.secondary" }}
                      >
                        CALIFICACIONES DE OTROS JURADOS
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      {evalsStudent.length > 0 ? (
                        evalsStudent.map((e) => (
                          <Box
                            key={e.id}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2">• {e.juryName}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {e.totalScore}/100
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Aún no hay otras evaluaciones.
                        </Typography>
                      )}
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        mt: 1,
                        bgcolor: VERDE_INSTITUCIONAL,
                        color: "white",
                        fontWeight: 900,
                        borderRadius: "50px",
                        py: 1.2,
                        "&:hover": { bgcolor: "#006666" },
                      }}
                      onClick={() => saveStudentEvaluation(s.id)}
                    >
                      Guardar Nota
                    </Button>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "#f8f9fa" }}>
          <Button
            onClick={() => setOpenEval(false)}
            sx={{ fontWeight: 900, color: "text.secondary" }}
          >
            Cerrar Modal
          </Button>
        </DialogActions>
      </Dialog>

      {/* DRAWER PERFIL SOLO PARA NO-COORDINADORES */}
      {!isCoordinator && (
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: 320 } }}
        >
          <Box sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 900, mb: 2, color: VERDE_INSTITUCIONAL }}
            >
              Mi Perfil
            </Typography>
            <Avatar
              src={photoPreview || undefined}
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 2,
                bgcolor: VERDE_INSTITUCIONAL,
              }}
            >
              {getInitials()}
            </Avatar>
            <Typography align="center" sx={{ fontWeight: 900 }}>
              {juryInfo.name}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              onClick={handleLogout}
              color="error"
              startIcon={<LogoutOutlined />}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Drawer>
      )}
    </Box>
  );
}