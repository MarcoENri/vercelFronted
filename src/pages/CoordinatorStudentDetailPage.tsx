import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  IconButton,
  Divider,
  Stack,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { logout } from "../services/authService";
import {
  getStudentDetail,
  createIncident,
  createObservation,
  assignProject,
} from "../services/coordinatorStudentService";
import { deleteIncident } from "../services/incidentManageService";
import type { StudentDetailDto } from "../services/coordinatorStudentService";
import { listTutorsForCoordinator } from "../services/coordinatorLookupService";
import type { UserOption } from "../services/adminLookupService";
import SendEmailModal from "../components/SendEmailModal";
import EditIncidentModal from "../components/EditIncidentModal";
import { getActiveAcademicPeriod } from "../services/periodService";
import CoordinatorSidebar from "../components/Coordinatorsidebar/Coordinatorsidebar";

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

export default function CoordinatorStudentDetailPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();
  const queryClient = useQueryClient();

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const periodId = useMemo(() => {
    const q = sp.get("periodId");
    if (q && !Number.isNaN(Number(q))) return Number(q);
    const ls = localStorage.getItem("periodId");
    if (ls && !Number.isNaN(Number(ls))) return Number(ls);
    return null;
  }, [sp]);

  const coordinatorInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          username: user.username || user.email?.split("@")[0] || "",
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
          email: user.email || "",
          role: user.role || "Coordinador",
        };
      } catch {
        return { username: "", name: "", email: "", role: "Coordinador" };
      }
    }
    return { username: "", name: "", email: "", role: "Coordinador" };
  }, []);

  const [tabValue, setTabValue] = useState(0);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editIncOpen, setEditIncOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);

  const [tutors, setTutors] = useState<UserOption[]>([]);

  const [incStage, setIncStage] = useState("");
  const [incDate, setIncDate] = useState<dayjs.Dayjs | null>(null);
  const [incReason, setIncReason] = useState("");
  const [incAction, setIncAction] = useState("");

  const [obsText, setObsText] = useState("");

  const [projectName, setProjectName] = useState("");
  const [selectedTutorId, setSelectedTutorId] = useState<number | "">("");

  const { data, isLoading: loading, refetch: load } = useQuery<StudentDetailDto | null>({
    queryKey: ["studentDetail", id, periodId],
    queryFn: async () => {
      if (!id) return null;
      let pid = periodId;
      if (!pid) {
        const p = await getActiveAcademicPeriod();
        if (p?.id) {
          localStorage.setItem("periodId", String(p.id));
          pid = p.id;
        }
      }
      if (!pid) throw new Error("No hay periodo activo");
      return await getStudentDetail(id, pid);
    },
    enabled: !!id,
    onError: () => {
      alert("No se pudo cargar el estudiante");
      nav("/coordinator", { replace: true });
    }
  } as any);

  const incidentMutation = useMutation({
    mutationFn: (newInc: any) => createIncident(id!, periodId!, newInc),
    onSuccess: () => {
      alert("Incidencia registrada");
      queryClient.invalidateQueries({ queryKey: ["studentDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIncidentOpen(false);
      setIncStage(""); setIncDate(null); setIncReason(""); setIncAction("");
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? "No se pudo registrar")
  });

  const observationMutation = useMutation({
    mutationFn: (newObs: any) => createObservation(id!, periodId!, newObs),
    onSuccess: () => {
      alert("Observación registrada");
      queryClient.invalidateQueries({ queryKey: ["studentDetail", id] });
      setObsOpen(false);
      setObsText("");
    }
  });

  const assignMutation = useMutation({
    mutationFn: (assignData: any) => assignProject(id!, periodId!, assignData),
    onSuccess: () => {
      alert("Asignado correctamente");
      queryClient.invalidateQueries({ queryKey: ["studentDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setAssignOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (incId: number) => deleteIncident(data!.id, incId, periodId!),
    onSuccess: (res) => {
      alert(`Eliminada ✅ (Estado: ${res?.studentStatus ?? "OK"})`);
      queryClient.invalidateQueries({ queryKey: ["studentDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  });

  useEffect(() => {
    const savedPhoto = localStorage.getItem("coordinatorPhoto");
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    logout();
    nav("/");
  };

  const openAssignModal = async () => {
    const pid = periodId || Number(localStorage.getItem("periodId"));
    if (!pid) return alert("Falta periodId.");
    try {
      const tuts = await listTutorsForCoordinator(pid as any);
      setTutors(tuts);
      setProjectName(data?.thesisProject ?? "");
      setSelectedTutorId((data?.tutorId ?? "") as any);
      setAssignOpen(true);
    } catch (e: any) { alert(e?.response?.data?.message ?? "No se pudo cargar tutores"); }
  };

  const handleCreateIncident = () => {
    if (!incStage || !incDate || !incReason || !incAction) return alert("Completa todos los campos");
    incidentMutation.mutate({
      stage: incStage,
      date: incDate.format("YYYY-MM-DD"),
      reason: incReason,
      action: incAction,
    });
  };

  const handleCreateObservation = () => {
    if (!obsText) return alert("Escribe una observación");
    observationMutation.mutate({ text: obsText });
  };

  const handleAssignProject = () => {
    if (!projectName.trim() || !selectedTutorId) return alert("Completa todos los campos");
    assignMutation.mutate({ projectName: projectName.trim(), tutorId: selectedTutorId as number });
  };

  const handleDeleteIncident = (incId: number) => {
    if (!confirm("¿Eliminar incidencia?")) return;
    deleteMutation.mutate(incId);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const dateOnly = dateString.split("T")[0];
      const [year, month, day] = dateOnly.split("-");
      return `${day}/${month}/${year}`;
    } catch { return dateString; }
  };

  const getDisplayName = () => coordinatorInfo?.name || coordinatorInfo?.username || "Usuario";
  const getInitials = () => {
    if (coordinatorInfo?.name) {
      const parts = coordinatorInfo.name.split(" ");
      if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      return coordinatorInfo.name.charAt(0).toUpperCase();
    }
    if (coordinatorInfo?.username) return coordinatorInfo.username.charAt(0).toUpperCase();
    return "U";
  };

  if (!data) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* SIDEBAR */}
        <CoordinatorSidebar
          coordinatorName={getDisplayName()}
          coordinatorInitials={getInitials()}
          coordinatorEmail={coordinatorInfo?.email}
          coordinatorUsername={coordinatorInfo?.username}
          coordinatorRole={coordinatorInfo?.role}
          photoPreview={photoPreview}
          onLogout={handleLogout}
          onPhotoChange={setPhotoPreview}
        />

        {/* CONTENIDO PRINCIPAL */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minHeight: "100vh",
            background: "#f0f2f5",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER VERDE */}
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
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                  Gestión de Estudiante
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Panel del Coordinador
                </Typography>
              </Box>
              </Box>
          </Box>

          {/* CONTENIDO */}
          <Box sx={{ flex: 1, py: 3 }}>
            <Container maxWidth="lg">
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  borderLeft: `6px solid ${VERDE_INSTITUCIONAL}`,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    bgcolor: VERDE_INSTITUCIONAL,
                    color: "white",
                    p: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: "white",
                        color: VERDE_INSTITUCIONAL,
                        fontSize: "1.5rem",
                        fontWeight: 900,
                      }}
                    >
                      {data.firstName?.charAt(0) || "?"}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: "uppercase",
                          fontWeight: 700,
                          opacity: 0.8,
                          letterSpacing: 1,
                        }}
                      >
                        Detalles del Alumno
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>
                        {data.firstName} {data.lastName}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={openAssignModal}
                      sx={{
                        bgcolor: "white",
                        color: VERDE_INSTITUCIONAL,
                        fontWeight: 900,
                        borderRadius: "20px",
                        textTransform: "none",
                      }}
                    >
                      Asignar Proyecto
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<EmailIcon />}
                      onClick={() => setEmailOpen(true)}
                      sx={{
                        bgcolor: "white",
                        color: VERDE_INSTITUCIONAL,
                        fontWeight: 900,
                        borderRadius: "20px",
                        textTransform: "none",
                      }}
                    >
                      Enviar Correo
                    </Button>
                  </Box>
                </Box>

                <CardContent sx={{ p: 3 }}>
                  {/* INFORMACIÓN */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "rgba(248, 249, 250, 0.9)",
                        borderRadius: 2,
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#6c757d", fontWeight: 600 }}
                      >
                        Email
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: "#212529",
                          wordBreak: "break-word",
                        }}
                      >
                        {data.email}
                      </Typography>
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "rgba(248, 249, 250, 0.9)",
                        borderRadius: 2,
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#6c757d", fontWeight: 600 }}
                      >
                        Carrera
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, color: "#212529" }}
                      >
                        {data.career}
                      </Typography>
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "rgba(248, 249, 250, 0.9)",
                        borderRadius: 2,
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6c757d",
                          fontWeight: 600,
                          mb: 0.5,
                          display: "block",
                        }}
                      >
                        Estado
                      </Typography>
                      <Chip
                        label={data.status}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: "10px" }}
                      />
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "rgba(248, 249, 250, 0.9)",
                        borderRadius: 2,
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#6c757d", fontWeight: 600 }}
                      >
                        Proyecto
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: data.thesisProject ? "#212529" : "#adb5bd",
                          fontStyle: data.thesisProject ? "normal" : "italic",
                        }}
                      >
                        {data.thesisProject || "No asignado"}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* TABS */}
                  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                      value={tabValue}
                      onChange={(_, v) => setTabValue(v)}
                      sx={{
                        "& .MuiTab-root": {
                          fontWeight: 700,
                          textTransform: "none",
                        },
                        "& .Mui-selected": { color: VERDE_INSTITUCIONAL },
                        "& .MuiTabs-indicator": {
                          backgroundColor: VERDE_INSTITUCIONAL,
                        },
                      }}
                    >
                      <Tab label={`Incidencias (${data.incidentCount})`} />
                      <Tab label={`Observaciones (${data.observationCount})`} />
                    </Tabs>
                  </Box>

                  <TabPanel value={tabValue} index={0}>
                    <Box sx={{ py: 3 }}>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<AddIcon />}
                        disabled={data.incidentCount >= 3}
                        onClick={() => setIncidentOpen(true)}
                        sx={{
                          mb: 2,
                          borderRadius: "20px",
                          textTransform: "none",
                          fontWeight: 700,
                        }}
                      >
                        Nueva incidencia
                      </Button>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  color: "white",
                                  fontWeight: 900,
                                }}
                              >
                                Etapa
                              </TableCell>
                              <TableCell
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  color: "white",
                                  fontWeight: 900,
                                }}
                              >
                                Fecha
                              </TableCell>
                              <TableCell
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  color: "white",
                                  fontWeight: 900,
                                }}
                              >
                                Motivo
                              </TableCell>
                              <TableCell
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  color: "white",
                                  fontWeight: 900,
                                }}
                              >
                                Acción
                              </TableCell>
                              <TableCell
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  color: "white",
                                  fontWeight: 900,
                                  textAlign: "center",
                                }}
                              >
                                Acciones
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.incidents?.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  align="center"
                                  sx={{ py: 4, color: "#777" }}
                                >
                                  No hay incidencias registradas
                                </TableCell>
                              </TableRow>
                            ) : (
                              data.incidents?.map((inc: any) => (
                                <TableRow
                                  key={inc.id}
                                  sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}
                                >
                                  <TableCell>{inc.stage}</TableCell>
                                  <TableCell>{formatDate(inc.date)}</TableCell>
                                  <TableCell>{inc.reason}</TableCell>
                                  <TableCell>{inc.action}</TableCell>
                                  <TableCell align="center">
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 1,
                                        justifyContent: "center",
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setEditingIncident(inc);
                                          setEditIncOpen(true);
                                        }}
                                        sx={{ color: VERDE_INSTITUCIONAL }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteIncident(inc.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
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
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setObsOpen(true)}
                        sx={{
                          mb: 2,
                          borderRadius: "20px",
                          textTransform: "none",
                          fontWeight: 700,
                          borderColor: VERDE_INSTITUCIONAL,
                          color: VERDE_INSTITUCIONAL,
                        }}
                      >
                        Nueva observación
                      </Button>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  color: "white",
                                  fontWeight: 900,
                                }}
                              >
                                Autor
                              </TableCell>
                              <TableCell
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  color: "white",
                                  fontWeight: 900,
                                }}
                              >
                                Observación
                              </TableCell>
                              <TableCell
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  color: "white",
                                  fontWeight: 900,
                                }}
                              >
                                Fecha
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.observations?.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  align="center"
                                  sx={{ py: 4, color: "#777" }}
                                >
                                  No hay observaciones registradas
                                </TableCell>
                              </TableRow>
                            ) : (
                              data.observations?.map((obs: any) => (
                                <TableRow
                                  key={obs.id}
                                  sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}
                                >
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
        </Box>
      </Box>

      {/* MODALES */}
      <SendEmailModal
        open={emailOpen}
        studentId={data.id}
        studentEmail={data.email}
        onClose={() => setEmailOpen(false)}
      />

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>
          Asignar Proyecto y Tutor
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del Proyecto"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Tutor</InputLabel>
              <Select
                value={selectedTutorId}
                onChange={(e) => setSelectedTutorId(e.target.value as number)}
                label="Tutor"
              >
                {tutors.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAssignProject}
            disabled={assignMutation.isPending}
            sx={{ bgcolor: VERDE_INSTITUCIONAL }}
          >
            {assignMutation.isPending ? "Asignando..." : "Asignar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={incidentOpen} onClose={() => setIncidentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>
          Registrar incidencia
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Etapa"
              value={incStage}
              onChange={(e) => setIncStage(e.target.value)}
              fullWidth
              required
            />
            <DatePicker
              label="Fecha"
              value={incDate}
              onChange={(v) => setIncDate(v)}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
            <TextField
              label="Motivo"
              value={incReason}
              onChange={(e) => setIncReason(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
            />
            <TextField
              label="Acción"
              value={incAction}
              onChange={(e) => setIncAction(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIncidentOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCreateIncident}
            disabled={incidentMutation.isPending}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={obsOpen} onClose={() => setObsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>
          Registrar observación
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Observación"
            value={obsText}
            onChange={(e) => setObsText(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setObsOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateObservation}
            disabled={observationMutation.isPending}
            sx={{ bgcolor: VERDE_INSTITUCIONAL }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <EditIncidentModal
        open={editIncOpen}
        onClose={() => setEditIncOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["studentDetail", id] })}
        periodId={(periodId || Number(localStorage.getItem("periodId")))!}
        studentId={data.id}
        incident={editingIncident}
      />
    </LocalizationProvider>
  );
}