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
  Divider,
  Stack,
  Paper,
  Snackbar,
  Alert,
  InputAdornment,
  Fade,
  Zoom,
} from "@mui/material";

import {
  Logout as LogoutOutlined,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
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
  rubricScore: string;
  extraScore: string;
  observations: string;
};

export default function FinalDefenseJuryPage() {
  const nav = useNavigate();
  const location = useLocation();
  const isCoordinator = location.pathname.includes("coordinator");

  const [loading, setLoading] = useState(false);
  // ─── Loading por estudiante — solo ese botón muestra "Guardando..." ───────
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bookings, setBookings] = useState<FinalDefenseBookingDto[]>([]);
  const [openEval, setOpenEval] = useState(false);
  const [activeBooking, setActiveBooking] = useState<FinalDefenseBookingDto | null>(null);
  const [evaluations, setEvaluations] = useState<FinalDefenseEvaluationDto[]>([]);
  const [studentEvals, setStudentEvals] = useState<Record<number, StudentEvalState>>({});

  // ─── Snackbar ─────────────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "warning" }>({
    open: false, msg: "", severity: "success",
  });
  const notify = (msg: string, severity: "success" | "error" | "warning" = "success") =>
    setSnack({ open: true, msg, severity });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  // ─── Dialog cerrar sesión ──────────────────────────────────────────────────
  const [logoutOpen, setLogoutOpen] = useState(false);

  const juryInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return { username: "", name: "Usuario", email: "", role: isCoordinator ? "Coordinador" : "Tutor" };
    try {
      const user: UserResponse = JSON.parse(userStr);
      const role = isCoordinator
        ? "Coordinador"
        : user.roles && user.roles.length > 0
          ? user.roles[0].replace("ROLE_", "")
          : "Tutor";
      return { username: user.username || "", name: user.fullName || "Usuario", email: user.email || "", role };
    } catch {
      return { username: "", name: "Usuario", email: "", role: isCoordinator ? "Coordinador" : "Tutor" };
    }
  }, [isCoordinator]);

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("periodId");
    if (!ls) return null;
    const n = Number(ls);
    return Number.isFinite(n) ? n : null;
  }, []);

  const getInitials = () => {
    const name = juryInfo?.name?.trim();
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

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
    const photoKey = isCoordinator ? "coordinatorPhoto" : "tutorPhoto";
    const savedPhoto = localStorage.getItem(photoKey);
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, []);

  const handleLogout = () => setLogoutOpen(true);
  const confirmLogout = () => { localStorage.clear(); nav("/"); };
  const handlePhotoChange = (photo: string) => setPhotoPreview(photo);

  const openEvaluate = async (b: FinalDefenseBookingDto) => {
    setActiveBooking(b);
    setOpenEval(true);
    setLoading(true);
    try {
      const detail = await juryFinalBookingDetail(b.id);
      setActiveBooking(detail.booking);
      setEvaluations(detail.evaluations ?? []);
      if (detail.booking.students?.length) {
        const initial: Record<number, StudentEvalState> = {};
        detail.booking.students.forEach((s) => {
          initial[s.id] = { rubricScore: "", extraScore: "", observations: "" };
        });
        setStudentEvals(initial);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Actualiza un campo de un estudiante sin re-montar el input ───────────
  const updateEval = (studentId: number, field: keyof StudentEvalState, value: string) => {
    setStudentEvals((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const getNumeric = (val: string) =>
    val === "" ? 0 : Math.max(0, Math.min(50, Number(val)));

  const scoreColor = (val: string) => {
    const n = getNumeric(val);
    if (n >= 35) return "#2e7d32";
    if (n >= 20) return VERDE_INSTITUCIONAL;
    return "#d32f2f";
  };

  const saveStudentEvaluation = async (studentId: number) => {
    const ev = studentEvals[studentId];
    if (!ev) return;
    const rubric = getNumeric(ev.rubricScore);
    const extra = getNumeric(ev.extraScore);
    if (rubric < 0 || rubric > 50) return notify("Rúbrica debe estar entre 0 y 50", "warning");
    if (extra < 0 || extra > 50) return notify("Extra debe estar entre 0 y 50", "warning");
    setSavingStudentId(studentId);
    try {
      await juryFinalEvaluate(activeBooking!.id, {
        studentId,
        rubricScore: rubric,
        extraScore: extra,
        observations: ev.observations || null,
      });
      const detail = await juryFinalBookingDetail(activeBooking!.id);
      setEvaluations(detail.evaluations ?? []);
      notify("Nota guardada correctamente ✅");
    } catch (e: any) {
      notify(e?.response?.data?.message || "Error al guardar", "error");
    } finally {
      setSavingStudentId(null);
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
      notify("Acta descargada correctamente");
    } catch (e: any) {
      notify(e?.response?.data?.message ?? "No se pudo descargar el acta", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Sx del TextField de nota — depende del valor actual ─────────────────
  const scoreFieldSx = (val: string) => {
    const color = scoreColor(val);
    return {
      "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        bgcolor: "#fff",
        "& input": {
          fontWeight: 900,
          fontSize: "1.5rem",
          color,
          textAlign: "center",
          transition: "color 0.3s ease",
        },
        "& fieldset": { borderColor: "#e0e0e0", borderWidth: "1.5px" },
        "&:hover fieldset": { borderColor: color },
        "&.Mui-focused fieldset": { borderColor: color, borderWidth: "2px" },
      },
      "& .MuiInputLabel-root": { fontWeight: 800, color: "#999" },
      "& .MuiInputLabel-root.Mui-focused": { color },
    };
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>

      {/* SIDEBAR según rol */}
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
          tutorName={juryInfo.name}
          tutorInitials={getInitials()}
          tutorEmail={juryInfo.email}
          tutorUsername={juryInfo.username}
          tutorRole={juryInfo.role}
          photoPreview={photoPreview}
          onPhotoChange={handlePhotoChange}
        />
      )}

      {/* CONTENIDO PRINCIPAL */}
      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh", background: "#f5f7f9", display: "flex", flexDirection: "column" }}>

        {/* HEADER — sticky */}
        <Box sx={{
          position: "sticky", top: 0, zIndex: 1100, flexShrink: 0,
          bgcolor: VERDE_INSTITUCIONAL, color: "white",
          py: 2, px: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Defensa Final</Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Panel de Jurado {periodId ? `— Periodo: ${periodId}` : ""}
          </Typography>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, py: 3, overflowY: "auto" }}>
          <Container maxWidth="lg">
            <Card sx={{ borderRadius: "25px", boxShadow: "0 10px 30px rgba(0,0,0,0.04)", border: "1px solid #e1e8ed" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL, mb: 2.5 }}>
                  Mis Defensas Finales ({bookings.length})
                </Typography>
                {bookings.map((b) => (
                  <Paper key={b.id} elevation={0}
                    sx={{ p: 2.5, mb: 2, border: "2px solid #e9ecef", borderRadius: "20px", transition: "box-shadow 0.2s", "&:hover": { boxShadow: "0 8px 24px rgba(0,139,139,0.1)" } }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>Defensa #{b.id}</Typography>
                      <Chip label="Defensa Final" size="small" sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }} />
                    </Box>
                    <Stack spacing={0.8} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}><strong>Proyecto:</strong> {b.projectName || "-"}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}><strong>Estudiantes:</strong> {b.students?.map((s) => s.fullName).join(" / ")}</Typography>
                    </Stack>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Button onClick={() => openEvaluate(b)} variant="contained" startIcon={<AssessmentIcon />}
                        sx={{ bgcolor: VERDE_INSTITUCIONAL, borderRadius: "50px", fontWeight: 900, textTransform: "none" }}>
                        Evaluar
                      </Button>
                      <Button onClick={() => handleDownloadActa(b.id)} variant="outlined" startIcon={<DownloadIcon />}
                        sx={{ color: VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL, borderRadius: "50px", fontWeight: 900, textTransform: "none" }}>
                        Acta
                      </Button>
                    </Box>
                  </Paper>
                ))}
                {!bookings.length && !loading && (
                  <Typography sx={{ color: "#aaa", fontStyle: "italic", textAlign: "center", py: 4 }}>
                    No tienes defensas asignadas aún.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Container>
        </Box>

        {/* FOOTER — sticky */}
        <Box sx={{
          position: "sticky", bottom: 0, zIndex: 1100, flexShrink: 0,
          bgcolor: VERDE_INSTITUCIONAL, color: "white",
          py: 1, textAlign: "center", boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
        }}>
          <Typography variant="caption" sx={{ opacity: 0.9, fontSize: "11px" }}>
            © 2025 - Panel de Jurado
          </Typography>
        </Box>
      </Box>

      {/* ── MODAL EVALUAR ──────────────────────────────────────────────────────── */}
      <Dialog open={openEval} onClose={() => setOpenEval(false)} maxWidth="lg" fullWidth
        TransitionComponent={Fade}
        PaperProps={{ sx: { borderRadius: "25px", overflow: "hidden" } }}
      >
        <DialogTitle sx={{
          fontWeight: 900, color: VERDE_INSTITUCIONAL,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #f1f2f6", py: 2, px: 3,
        }}>
          <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
            Evaluar Defensa {activeBooking ? `#${activeBooking.id}` : ""}
          </Typography>
          <Button
            onClick={async () => {
              try {
                const blob = await juryFinalDownloadRubricPdf(activeBooking!.id);
                window.open(window.URL.createObjectURL(blob), "_blank");
              } catch {
                notify("No se pudo abrir rúbrica.", "error");
              }
            }}
            variant="outlined" startIcon={<VisibilityIcon />}
            sx={{ color: VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL, borderRadius: "50px", fontWeight: 900, textTransform: "none" }}
          >
            Ver Rúbrica PDF
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: "#f8f9fa" }}>
          {activeBooking && (
            <Box sx={{
              display: "grid",
              gridTemplateColumns: activeBooking.students.length > 1 ? "1fr 1fr" : "1fr",
              gap: 3,
            }}>
              {activeBooking.students.map((s) => {
                const ev = studentEvals[s.id] ?? { rubricScore: "", extraScore: "", observations: "" };
                const rubricNum = getNumeric(ev.rubricScore);
                const extraNum = getNumeric(ev.extraScore);
                const total = rubricNum + extraNum;
                // ✅ Regla institucional: rúbrica mínimo 35/50 para aprobar
                const verdict = rubricNum >= 35 && total >= 70 ? "APROBADO" : "REPROBADO";
                const verdictColor = verdict === "APROBADO" ? "#2e7d32" : "#d32f2f";
                const evalsStudent = evaluations.filter((e) => e.studentId === s.id);

                return (
                  <Paper key={s.id} sx={{ p: 3, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #eee" }}>

                    {/* Encabezado estudiante */}
                    <Box sx={{ mb: 3, pb: 2, borderBottom: `3px solid ${VERDE_INSTITUCIONAL}22` }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>
                        {s.fullName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#888", fontWeight: 700, mt: 0.3 }}>
                        Identificación: <span style={{ color: "#555", fontWeight: 900 }}>{s.dni}</span>
                      </Typography>
                    </Box>

                    {/* Inputs nota */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 1 }}>

                      {/* Rúbrica */}
                      <Box>
                        <TextField
                          label="Rúbrica"
                          type="number"
                          fullWidth
                          value={ev.rubricScore}
                          placeholder="0"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "" || raw === "-") { updateEval(s.id, "rubricScore", ""); return; }
                            const n = Math.min(50, Math.max(0, Number(raw)));
                            updateEval(s.id, "rubricScore", String(n));
                          }}
                          inputProps={{ min: 0, max: 50 }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography sx={{ fontWeight: 900, color: "#ccc", fontSize: "1rem" }}>/50</Typography>
                              </InputAdornment>
                            ),
                          }}
                          sx={scoreFieldSx(ev.rubricScore)}
                        />
                        {/* Barra progreso */}
                        <Box sx={{ mt: 0.8, height: 4, borderRadius: 99, bgcolor: "#f0f0f0", overflow: "hidden" }}>
                          <Box sx={{
                            height: "100%", borderRadius: 99,
                            bgcolor: scoreColor(ev.rubricScore),
                            width: `${(rubricNum / 50) * 100}%`,
                            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), background-color 0.3s ease",
                          }} />
                        </Box>
                        {/* Aviso mínimo institucional */}
                        {rubricNum > 0 && rubricNum < 35 && (
                          <Typography variant="caption" sx={{ color: "#d32f2f", fontWeight: 800, mt: 0.5, display: "block", fontSize: "0.7rem" }}>
                            ⚠ Mínimo requerido: 35/50
                          </Typography>
                        )}
                      </Box>

                      {/* Extra */}
                      <Box>
                        <TextField
                          label="Extra"
                          type="number"
                          fullWidth
                          value={ev.extraScore}
                          placeholder="0"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "" || raw === "-") { updateEval(s.id, "extraScore", ""); return; }
                            const n = Math.min(50, Math.max(0, Number(raw)));
                            updateEval(s.id, "extraScore", String(n));
                          }}
                          inputProps={{ min: 0, max: 50 }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography sx={{ fontWeight: 900, color: "#ccc", fontSize: "1rem" }}>/50</Typography>
                              </InputAdornment>
                            ),
                          }}
                          sx={scoreFieldSx(ev.extraScore)}
                        />
                        {/* Barra progreso */}
                        <Box sx={{ mt: 0.8, height: 4, borderRadius: 99, bgcolor: "#f0f0f0", overflow: "hidden" }}>
                          <Box sx={{
                            height: "100%", borderRadius: 99,
                            bgcolor: scoreColor(ev.extraScore),
                            width: `${(extraNum / 50) * 100}%`,
                            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), background-color 0.3s ease",
                          }} />
                        </Box>
                      </Box>
                    </Box>

                    {/* Total animado */}
                    <Box sx={{
                      mt: 2, mb: 2.5, p: 2,
                      bgcolor: verdict === "APROBADO" ? "#f0fff4" : "#fff5f5",
                      borderRadius: "14px", textAlign: "center",
                      border: `1.5px solid ${verdictColor}22`,
                      transition: "background-color 0.4s ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                    }}>
                      <Typography component="span" sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#333" }}>
                        Total:
                      </Typography>
                      <Typography component="span" sx={{ color: verdictColor, fontSize: "1.6rem", fontWeight: 900, transition: "color 0.3s ease", lineHeight: 1 }}>
                        {rubricNum + extraNum}
                      </Typography>
                      <Typography component="span" sx={{ color: "#bbb", fontWeight: 700, fontSize: "1rem" }}>
                        /100
                      </Typography>
                      <Chip label={verdict} size="small"
                        sx={{ bgcolor: verdictColor, color: "#fff", fontWeight: 900, fontSize: "0.75rem", transition: "background-color 0.3s ease" }}
                      />
                    </Box>

                    {/* Observaciones */}
                    <TextField
                      label="Observaciones"
                      fullWidth multiline minRows={2}
                      placeholder="Comentarios sobre el desempeño..."
                      value={ev.observations}
                      onChange={(e) => updateEval(s.id, "observations", e.target.value)}
                      sx={{
                        mb: 2.5,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          "& fieldset": { borderColor: "#e0e0e0" },
                          "&:hover fieldset": { borderColor: VERDE_INSTITUCIONAL },
                          "&.Mui-focused fieldset": { borderColor: VERDE_INSTITUCIONAL },
                        },
                        "& .MuiInputLabel-root": { fontWeight: 800 },
                        "& .MuiInputLabel-root.Mui-focused": { color: VERDE_INSTITUCIONAL },
                        "& textarea": { fontWeight: 700 },
                      }}
                    />

                    {/* Otros jurados */}
                    <Box sx={{ mb: 2.5, p: 2, bgcolor: "#fafafa", borderRadius: "12px", border: "1px solid #eee" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "#777", fontSize: "0.72rem", letterSpacing: "0.5px" }}>
                        CALIFICACIONES DE OTROS JURADOS
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      {evalsStudent.length > 0 ? (
                        evalsStudent.map((e) => (
                          <Box key={e.id} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>• {e.juryName}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>{e.totalScore}/100</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="caption" sx={{ color: "#ccc", fontWeight: 700 }}>
                          Aún no hay otras evaluaciones.
                        </Typography>
                      )}
                    </Box>

                    {/* Guardar */}
                    <Button fullWidth variant="contained"
                      disabled={savingStudentId === s.id}
                      onClick={() => saveStudentEvaluation(s.id)}
                      sx={{
                        bgcolor: VERDE_INSTITUCIONAL, color: "white",
                        fontWeight: 900, borderRadius: "50px",
                        py: 1.4, textTransform: "none", fontSize: "0.95rem",
                        boxShadow: `0 6px 20px ${VERDE_INSTITUCIONAL}44`,
                        "&:hover": { bgcolor: "#006666", transform: "scale(1.02)" },
                        transition: "all 0.2s ease",
                      }}
                    >
                      {savingStudentId === s.id ? "Guardando..." : "Guardar Nota"}
                    </Button>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "#f8f9fa", borderTop: "1px solid #f1f2f6" }}>
          <Button onClick={() => setOpenEval(false)}
            sx={{ fontWeight: 900, color: "#888", borderRadius: "50px", px: 3, textTransform: "none" }}>
            Cerrar Modal
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG CERRAR SESIÓN ─────────────────────────────────────────────── */}
      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(0,139,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogoutOutlined sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>Cerrar sesión</Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas cerrar sesión? Tu sesión actual se terminará.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setLogoutOpen(false)} variant="outlined" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555", "&:hover": { borderColor: "#bbb", bgcolor: "#f9f9f9" } }}>
            Cancelar
          </Button>
          <Button onClick={confirmLogout} variant="contained" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, "&:hover": { bgcolor: "#006666" } }}>
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR centrado en pantalla ────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={Zoom}
      >
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled"
          sx={{ fontWeight: 700, borderRadius: "16px", minWidth: 320, boxShadow: "0 12px 40px rgba(0,0,0,0.2)", fontSize: "0.95rem" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}