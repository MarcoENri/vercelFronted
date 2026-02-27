import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Stack,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

// 🔥 PROGRAMACIÓN REACTIVA
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { logout } from "../services/authService";
import {
  getTutorStudentDetail,
  createTutorIncident,
  createTutorObservation,
} from "../services/tutorService";
import { deleteIncident } from "../services/incidentManageService";
import type { StudentDetailDto } from "../services/tutorService";
import SendEmailModal from "../components/SendEmailModal";
import EditIncidentModal from "../components/EditIncidentModal";
import TutorSidebar from "../components/TutorSidebar/TutorSidebar";

const VERDE_INSTITUCIONAL = "#008B8B";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

export default function TutorStudentDetailPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();
  const queryClient = useQueryClient();

  // Lógica de periodo
  const periodId = useMemo(() => {
    const q = sp.get("periodId");
    if (q && !Number.isNaN(Number(q))) return Number(q);
    const ls = localStorage.getItem("periodId");
    if (ls && !Number.isNaN(Number(ls))) return Number(ls);
    return null;
  }, [sp]);

  // Información del tutor para el Sidebar
  const tutorInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          username: user.username || user.email?.split("@")[0] || "",
          name: user.name || user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
          email: user.email || "",
          role: user.role || (user.roles && user.roles.length > 0 ? user.roles[0].replace("ROLE_", "") : "Tutor"),
        };
      } catch {
        return { username: "", name: "Usuario", email: "", role: "Tutor" };
      }
    }
    return { username: "", name: "Usuario", email: "", role: "Tutor" };
  }, []);

  const getInitials = () => {
    const name = tutorInfo.name.trim();
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || "U").toUpperCase();
  };

  // ─── Snackbar ─────────────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "warning" }>({
    open: false, msg: "", severity: "success",
  });
  const notify = (msg: string, severity: "success" | "error" | "warning" = "success") =>
    setSnack({ open: true, msg, severity });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  // ─── Dialog cerrar sesión ──────────────────────────────────────────────────
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ─── Dialog confirmar eliminar incidencia ─────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; incId: number | null }>({
    open: false, incId: null,
  });

  // 🔥 QUERY REACTIVA AUTOMÁTICA
  const { data, isLoading, error } = useQuery<StudentDetailDto>({
    queryKey: ["tutorStudentDetail", id, periodId],
    queryFn: async () => {
      if (!id || !periodId) throw new Error("Falta ID o periodId");
      return await getTutorStudentDetail(id, periodId);
    },
    enabled: !!id && !!periodId,
    refetchInterval: 3000,
    staleTime: 0,
  });

  const [tabValue, setTabValue] = useState(0);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editIncOpen, setEditIncOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);

  // Form states
  const [incStage, setIncStage] = useState("");
  const [incDate, setIncDate] = useState<dayjs.Dayjs | null>(null);
  const [incReason, setIncReason] = useState("");
  const [incAction, setIncAction] = useState("");
  const [obsText, setObsText] = useState("");

  if (error) {
    notify("No se pudo cargar el estudiante", "error");
    nav("/tutor/students", { replace: true });
  }

  const handleLogout = () => setLogoutOpen(true);
  const confirmLogout = () => { logout(); nav("/"); };

  const handleCreateIncident = async () => {
    if (!id || !periodId || !incStage || !incDate || !incReason || !incAction) {
      notify("Por favor completa todos los campos", "warning");
      return;
    }
    try {
      await createTutorIncident(id, periodId, {
        stage: incStage,
        date: incDate.format("YYYY-MM-DD"),
        reason: incReason,
        action: incAction,
      });
      setIncidentOpen(false);
      setIncStage(""); setIncDate(null); setIncReason(""); setIncAction("");
      notify("Incidencia registrada correctamente");
      queryClient.invalidateQueries({ queryKey: ["tutorStudentDetail", id, periodId] });
    } catch (e: any) {
      notify(e?.response?.data?.message ?? "No se pudo registrar incidencia", "error");
    }
  };

  const handleCreateObservation = async () => {
    if (!id || !periodId || !obsText) {
      notify("Por favor escribe una observación", "warning");
      return;
    }
    try {
      await createTutorObservation(id, periodId, { text: obsText });
      setObsOpen(false);
      setObsText("");
      notify("Observación registrada correctamente");
      queryClient.invalidateQueries({ queryKey: ["tutorStudentDetail", id, periodId] });
    } catch (e: any) {
      notify(e?.response?.data?.message ?? "No se pudo registrar observación", "error");
    }
  };

  const handleDeleteIncident = (incId: number) => {
    setDeleteDialog({ open: true, incId });
  };

  const confirmDeleteIncident = async () => {
    if (!deleteDialog.incId || !periodId || !data?.id) return;
    const incId = deleteDialog.incId;
    setDeleteDialog({ open: false, incId: null });
    try {
      await deleteIncident(data.id, incId, periodId);
      notify("Incidencia eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["tutorStudentDetail", id, periodId] });
    } catch (e: any) {
      notify(e?.response?.data?.message ?? "No se pudo eliminar", "error");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const dateOnly = dateString.split("T")[0];
      const [year, month, day] = dateOnly.split("-");
      return `${day}/${month}/${year}`;
    } catch { return dateString; }
  };

  if (isLoading) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <CircularProgress sx={{ color: VERDE_INSTITUCIONAL }} />
    </Box>
  );

  if (!data) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", flexDirection: "row" }}>
        
        {/* SIDEBAR */}
        <TutorSidebar 
          onLogout={handleLogout}
          verde={VERDE_INSTITUCIONAL}
          periodId={periodId}
          tutorName={tutorInfo.name}
          tutorInitials={getInitials()}
          tutorEmail={tutorInfo.email}
          tutorUsername={tutorInfo.username}
          tutorRole={tutorInfo.role}
        />

        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

          {/* HEADER SUPERIOR — sticky */}
          <Box sx={{
            position: "sticky",
            top: 0,
            zIndex: 1100,
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 2,
            px: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            flexShrink: 0,
          }}>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Panel de Tutoría
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Seguimiento del estudiante
              </Typography>
            </Box>
          </Box>

          {/* CONTENIDO PRINCIPAL — scrolleable */}
          <Box sx={{ flex: 1, py: 3, overflowY: "auto" }}>
            <Container maxWidth="lg">
              <Card sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderLeft: `6px solid ${VERDE_INSTITUCIONAL}`, overflow: "hidden" }}>
                
                {/* BANNER IDENTIDAD */}
                <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: "white", color: VERDE_INSTITUCIONAL, fontSize: "1.5rem", fontWeight: 900 }}>
                      {data.firstName?.charAt(0) || "?"}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 700, opacity: 0.8, letterSpacing: 1 }}>
                        Seguimiento Académico
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>
                        {data.firstName} {data.lastName}
                      </Typography>
                    </Box>
                  </Box>
                  <Button 
                    variant="contained" 
                    startIcon={<EmailIcon />} 
                    onClick={() => setEmailOpen(true)} 
                    sx={{ bgcolor: "white", color: VERDE_INSTITUCIONAL, fontWeight: 900, "&:hover": { bgcolor: "#f5f5f5" }, borderRadius: "20px", textTransform: "none", px: 3 }}
                  >
                    Enviar Correo
                  </Button>
                </Box>

                <CardContent sx={{ p: 3 }}>
                  {/* GRID INFO */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 2, border: "1px solid #e9ecef" }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600 }}>Estudiante</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#212529" }}>{data.firstName} {data.lastName}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 2, border: "1px solid #e9ecef" }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600 }}>Email</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#212529" }}>{data.email}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 2, border: "1px solid #e9ecef" }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600 }}>Carrera</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#212529" }}>{data.career}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 2, border: "1px solid #e9ecef" }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, mb: 0.5, display: "block" }}>Estado</Typography>
                      <Chip label={data.status} color="primary" size="small" sx={{ fontWeight: 700, borderRadius: "10px" }} />
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 2, border: "1px solid #e9ecef", gridColumn: { xs: "1", sm: "1 / -1" } }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600 }}>Proyecto</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: data.thesisProject ? "#212529" : "#adb5bd", fontStyle: data.thesisProject ? "normal" : "italic" }}>
                        {data.thesisProject || "No definido"}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* TABS */}
                  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ "& .MuiTab-root": { fontWeight: 700, textTransform: "none" }, "& .Mui-selected": { color: VERDE_INSTITUCIONAL }, "& .MuiTabs-indicator": { backgroundColor: VERDE_INSTITUCIONAL } }}>
                      <Tab label={`Incidencias (${data.incidentCount})`} />
                      <Tab label={`Observaciones (${data.observationCount})`} />
                    </Tabs>
                  </Box>

                  <TabPanel value={tabValue} index={0}>
                    <Box sx={{ py: 3 }}>
                      <Button variant="contained" color="error" startIcon={<AddIcon />} disabled={data.incidentCount >= 3} onClick={() => setIncidentOpen(true)} sx={{ mb: 2, borderRadius: "20px", textTransform: "none", fontWeight: 700 }}>Nueva incidencia</Button>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Etapa</TableCell>
                              <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Fecha</TableCell>
                              <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Motivo</TableCell>
                              <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Acción</TableCell>
                              <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>Acciones</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.incidents?.length === 0 ? (
                              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "#777" }}>No hay incidencias registradas</TableCell></TableRow>
                            ) : (
                              data.incidents?.map((inc: any) => (
                                <TableRow key={inc.id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                                  <TableCell>{inc.stage}</TableCell>
                                  <TableCell>{formatDate(inc.date)}</TableCell>
                                  <TableCell>{inc.reason}</TableCell>
                                  <TableCell>{inc.action}</TableCell>
                                  <TableCell align="center">
                                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                      <Tooltip title="Editar">
                                        <IconButton size="small" onClick={() => { setEditingIncident(inc); setEditIncOpen(true); }} sx={{ color: VERDE_INSTITUCIONAL }}><EditIcon fontSize="small" /></IconButton>
                                      </Tooltip>
                                      <Tooltip title="Eliminar">
                                        <IconButton size="small" color="error" onClick={() => handleDeleteIncident(inc.id)}><DeleteIcon fontSize="small" /></IconButton>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <Box sx={{ py: 3 }}>
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setObsOpen(true)} sx={{ mb: 2, borderRadius: "20px", textTransform: "none", fontWeight: 700, borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL, "&:hover": { bgcolor: "rgba(0, 139, 139, 0.05)" } }}>Nueva observación</Button>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Autor</TableCell>
                              <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Observación</TableCell>
                              <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Fecha</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.observations?.length === 0 ? (
                              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: "#777" }}>No hay observaciones registradas</TableCell></TableRow>
                            ) : (
                              data.observations?.map((obs: any) => (
                                <TableRow key={obs.id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                                  <TableCell>{obs.author}</TableCell>
                                  <TableCell>{obs.text}</TableCell>
                                  <TableCell>{formatDate(obs.createdAt)}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </TabPanel>
                </CardContent>
              </Card>
            </Container>
          </Box>

          {/* FOOTER — sticky */}
          <Box sx={{
            position: "sticky",
            bottom: 0,
            zIndex: 1100,
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 1,
            textAlign: "center",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
            flexShrink: 0,
          }}>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: "11px" }}>
              © 2025 - Panel de Predefensas
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* MODALES */}
      <SendEmailModal open={emailOpen} studentId={data.id} studentEmail={data.email} onClose={() => setEmailOpen(false)} />
      
      <Dialog open={incidentOpen} onClose={() => setIncidentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>Registrar incidencia</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Etapa" value={incStage} onChange={(e) => setIncStage(e.target.value)} fullWidth required />
            <DatePicker label="Fecha" value={incDate} onChange={(v) => setIncDate(v)} slotProps={{ textField: { fullWidth: true, required: true } }} />
            <TextField label="Motivo" value={incReason} onChange={(e) => setIncReason(e.target.value)} multiline rows={3} fullWidth required />
            <TextField label="Acción" value={incAction} onChange={(e) => setIncAction(e.target.value)} multiline rows={3} fullWidth required />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIncidentOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleCreateIncident} sx={{ borderRadius: "20px", fontWeight: 700 }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={obsOpen} onClose={() => setObsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>Registrar observación</DialogTitle>
        <DialogContent>
          <TextField label="Observación" value={obsText} onChange={(e) => setObsText(e.target.value)} multiline rows={4} fullWidth required sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setObsOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateObservation} sx={{ borderRadius: "20px", fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <EditIncidentModal open={editIncOpen} onClose={() => setEditIncOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ["tutorStudentDetail", id, periodId] })} periodId={periodId ?? 0} studentId={data.id} incident={editingIncident} />

      {/* ── DIALOG CERRAR SESIÓN ─────────────────────────────────────────────── */}
      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(0,139,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogoutIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
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

      {/* ── DIALOG CONFIRMAR ELIMINAR INCIDENCIA ────────────────────────────── */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, incId: null })} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(211,47,47,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DeleteIcon sx={{ color: "#d32f2f", fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>Eliminar incidencia</Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas eliminar esta incidencia? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, incId: null })} variant="outlined" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555", "&:hover": { borderColor: "#bbb", bgcolor: "#f9f9f9" } }}>
            Cancelar
          </Button>
          <Button onClick={confirmDeleteIncident} variant="contained" color="error" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR ─────────────────────────────────────────────────────────── */}
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled"
          sx={{ fontWeight: 600, borderRadius: "12px", minWidth: 280 }}>
          {snack.msg}
        </Alert>
      </Snackbar>

    </LocalizationProvider>
  );
}