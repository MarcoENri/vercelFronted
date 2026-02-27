// src/pages/FinalDefenseAdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Chip,
  Paper,
  MenuItem,
  Select,
  FormControl,
  Fade,
  Toolbar,
  AppBar,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import LogoutIcon from "@mui/icons-material/Logout";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs, { Dayjs } from "dayjs";

import { listCareers } from "../services/careerService";
import type { CareerDto } from "../services/careerService";

import {
  adminFinalCreateWindow,
  adminFinalListWindows,
  adminFinalCloseWindow,
  adminFinalCreateSlot,
  adminFinalListSlots,
  adminFinalListStudentsByCareer,
  adminFinalListJuries,
  adminFinalCreateBooking,
  adminFinalUploadRubric,
  type FinalDefenseWindowDto,
  type FinalDefenseSlotDto,
  type FinalDefenseStudentMiniDto,
  type JuryUserDto,
} from "../services/finalDefenseService";
import JuriesSelector from "../components/JuriesSelector";

import AdminSidebar from "../components/AdminSidebar";
import { logout } from "../services/authService";
import { listCareerCards, type CareerCardDto } from "../services/adminCareerCardsService";
import { useActivePeriod } from "../hooks/useActivePeriod";
import { useQuery } from "@tanstack/react-query";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function FinalDefenseAdminPage() {
  const nav = useNavigate();
  const activePeriod = useActivePeriod();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Snackbar ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ open: boolean; msg: string; type: "success" | "error" | "warning" }>({ open: false, msg: "", type: "success" });
  const showToast = (msg: string, type: "success" | "error" | "warning" = "success") => setToast({ open: true, msg, type });

  // ─── Dialog confirmar acción ───────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; msg: string; onConfirm: () => void }>({ open: false, msg: "", onConfirm: () => {} });
  const showConfirm = (msg: string, onConfirm: () => void) => setConfirmDialog({ open: true, msg, onConfirm });

  // ─── Dialog cerrar sesión ──────────────────────────────────────────────────
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ─── Error inline carrera ──────────────────────────────────────────────────
  const [careerError, setCareerError] = useState(false);

  const selectedPeriodId: number | "ALL" = useMemo(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (ls && ls !== "ALL" && Number.isFinite(Number(ls))) return Number(ls);
    return activePeriod.periodId ?? "ALL";
  }, [activePeriod.periodId]);

  const { data: careerCards = [] } = useQuery<CareerCardDto[]>({
    queryKey: ["careerCards", selectedPeriodId],
    queryFn: () => {
      const pid = selectedPeriodId === "ALL" ? (activePeriod.periodId ?? undefined) : selectedPeriodId;
      return listCareerCards(pid);
    },
    enabled: !activePeriod.loading,
  });

  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [windows, setWindows] = useState<FinalDefenseWindowDto[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Carrera OBLIGATORIA — no permite vacío ni "todas"
  const [careerId, setCareerId] = useState<number | "">("");

  const [startsAt, setStartsAt] = useState<Dayjs | null>(
    dayjs().add(1, "day").hour(8).minute(0).second(0)
  );
  const [endsAt, setEndsAt] = useState<Dayjs | null>(
    dayjs().add(7, "day").hour(18).minute(0).second(0)
  );

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (!ls) return undefined;
    const n = Number(ls);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  const [openManage, setOpenManage] = useState(false);
  const [activeWindow, setActiveWindow] = useState<FinalDefenseWindowDto | null>(null);
  const [manageCareerId, setManageCareerId] = useState<number | "">("");
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [slots, setSlots] = useState<FinalDefenseSlotDto[]>([]);
  const [slotStart, setSlotStart] = useState<Dayjs | null>(
    dayjs().add(2, "day").hour(9).minute(0).second(0)
  );
  const [slotEnd, setSlotEnd] = useState<Dayjs | null>(
    dayjs().add(2, "day").hour(10).minute(0).second(0)
  );
  const [students, setStudents] = useState<FinalDefenseStudentMiniDto[]>([]);
  const [juries, setJuries] = useState<JuryUserDto[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedJuryIds, setSelectedJuryIds] = useState<number[]>([]);

  const loadMain = async () => {
    setLoading(true);
    try {
      const [cs, ws] = await Promise.all([listCareers(), adminFinalListWindows(periodId)]);
      setCareers(Array.isArray(cs) ? cs : []);
      setWindows(Array.isArray(ws) ? ws : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMain(); }, []);

  // ✅ Carrera obligatoria — error inline, sin alert, sin "Todas las carreras"
  const handleCreateWindow = async () => {
    if (!startsAt || !endsAt) return showToast("Selecciona fecha inicio/fin válida", "warning");
    if (careerId === "") {
      setCareerError(true);
      return;
    }
    setCareerError(false);
    setLoading(true);
    try {
      await adminFinalCreateWindow({
        academicPeriodId: periodId ?? null,
        careerId: careerId,          // siempre un número, nunca null
        startsAt: startsAt.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: endsAt.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await loadMain();
      setCareerId("");
      showToast("Ventana creada exitosamente");
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "No se pudo crear ventana", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWindow = async (id: number) => {
    showConfirm("¿Estás seguro de cerrar esta ventana?", async () => {
      setLoading(true);
      try {
        await adminFinalCloseWindow(id);
        await loadMain();
        showToast("Ventana cerrada correctamente");
      } finally {
        setLoading(false);
      }
    });
  };

  const openWindowManage = async (w: FinalDefenseWindowDto) => {
    setActiveWindow(w);
    setOpenManage(true);
    setManageCareerId(w.careerId ?? "");
    setRubricFile(null);
    setSelectedSlotId("");
    setSelectedStudentIds([]);
    setSelectedJuryIds([]);
    setLoading(true);
    try {
      const [sl, ju] = await Promise.all([adminFinalListSlots(w.id), adminFinalListJuries()]);
      setSlots(sl);
      setJuries(ju);
      const cid = w.careerId ?? null;
      if (cid) {
        const st = await adminFinalListStudentsByCareer(cid, periodId);
        setStudents(st);
      } else {
        setStudents([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const reloadSlots = async () => {
    if (!activeWindow) return;
    const sl = await adminFinalListSlots(activeWindow.id);
    setSlots(sl);
  };

  const handleUploadRubric = async () => {
    if (!activeWindow) return;
    if (!rubricFile) return showToast("Selecciona un PDF", "warning");
    const isPdf = rubricFile.type.toLowerCase().includes("pdf") || rubricFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return showToast("Solo se permite formato PDF", "warning");
    setLoading(true);
    try {
      await adminFinalUploadRubric(activeWindow.id, rubricFile);
      setRubricFile(null);
      await loadMain();
      setActiveWindow(prev => prev ? ({ ...prev, hasRubric: true }) : null);
      showToast("Rúbrica subida correctamente");
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "No se pudo subir la rúbrica", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!activeWindow) return;
    if (!slotStart || !slotEnd) return showToast("Selecciona inicio/fin del slot", "warning");
    setLoading(true);
    try {
      await adminFinalCreateSlot(activeWindow.id, {
        startsAt: slotStart.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: slotEnd.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await reloadSlots();
      showToast("Slot creado correctamente");
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "No se pudo crear slot", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const toggleJury = (id: number) => {
    setSelectedJuryIds(prev => prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]);
  };

  const handleCreateBooking = async () => {
    if (!activeWindow) return;
    if (!selectedSlotId) return showToast("Selecciona un slot", "warning");
    if (selectedStudentIds.length < 1) return showToast("Selecciona 1 o 2 estudiantes", "warning");
    if (selectedJuryIds.length < 1) return showToast("Selecciona al menos un jurado", "warning");
    const selected = students.filter(s => selectedStudentIds.includes(s.id));
    const invalid = selected.find(s => !s.projectName?.trim());
    if (invalid) return showToast(`${invalid.fullName} no tiene proyecto asignado`, "error");
    setLoading(true);
    try {
      await adminFinalCreateBooking({
        slotId: Number(selectedSlotId),
        studentIds: selectedStudentIds,
        juryUserIds: selectedJuryIds,
      });
      await reloadSlots();
      setSelectedSlotId("");
      setSelectedStudentIds([]);
      setSelectedJuryIds([]);
      showToast("Reserva creada correctamente");
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "No se pudo crear la reserva", "error");
    } finally {
      setLoading(false);
    }
  };

  const cleanPopperStyle = {
    "& .MuiPaper-root": {
      bgcolor: "#fff", color: "#333", borderRadius: "20px",
      boxShadow: "0 15px 45px rgba(0,0,0,0.15)", border: "1px solid #eee",
      "& .MuiTypography-root, & .MuiButtonBase-root": { color: "#444", fontWeight: 700 },
      "& .MuiPickersDay-root": {
        "&.Mui-selected": { bgcolor: VERDE_INSTITUCIONAL, color: "#fff", "&:hover": { bgcolor: VERDE_INSTITUCIONAL } },
        "&.MuiPickersDay-today": { borderColor: VERDE_INSTITUCIONAL },
      },
      "& .MuiClock-pin": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-root": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-thumb": { bgcolor: VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL },
      "& .MuiClockNumber-root": { fontWeight: 800 },
      "& .MuiDialogActions-root .MuiButton-root": { color: VERDE_INSTITUCIONAL, fontWeight: 900 },
      "& .MuiDayCalendar-weekDayLabel": { fontSize: 0 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(1)::after": { content: '"L"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(2)::after": { content: '"M"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(3)::after": { content: '"M"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(4)::after": { content: '"J"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(5)::after": { content: '"V"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(6)::after": { content: '"S"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(7)::after": { content: '"D"', fontSize: "0.75rem", fontWeight: 700 },
    }
  };

  const mobileDialogStyle = {
    sx: {
      zIndex: 1400,
      "& .MuiDialog-paper": { borderRadius: "20px", m: 2, width: "calc(100% - 32px)", maxWidth: 360 },
      "& .MuiPickersToolbar-root": { bgcolor: VERDE_INSTITUCIONAL, color: "#fff" },
      "& .MuiDateTimePickerToolbar-dateContainer .MuiTypography-root": { color: "#fff" },
      "& .MuiDateTimePickerToolbar-timeContainer .MuiTypography-root": { color: "rgba(255,255,255,0.7)" },
      "& .MuiPickersDay-root.Mui-selected": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClock-pin": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-root": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-thumb": { bgcolor: VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL },
      "& .MuiMultiSectionDigitalClock-root": { width: "100%" },
      "& .MuiDialogActions-root .MuiButton-root": { color: VERDE_INSTITUCIONAL, fontWeight: 900 },
      "& .MuiDayCalendar-weekDayLabel": { fontSize: 0 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(1)::after": { content: '"L"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(2)::after": { content: '"M"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(3)::after": { content: '"M"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(4)::after": { content: '"J"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(5)::after": { content: '"V"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(6)::after": { content: '"S"', fontSize: "0.75rem", fontWeight: 700 },
      "& .MuiDayCalendar-weekDayLabel:nth-of-type(7)::after": { content: '"D"', fontSize: "0.75rem", fontWeight: 700 },
    }
  };

  const premiumInputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px", transition: "all 0.2s ease-in-out", backgroundColor: "#fff",
      "& input": { fontWeight: 900, color: "#000", fontSize: "0.95rem" },
      "& fieldset": { borderColor: "#dcdde1", borderWidth: "1.5px" },
      "&:hover": { transform: "scale(1.01)", "& fieldset": { borderColor: "#000" } },
      "&.Mui-focused": { "& fieldset": { borderColor: VERDE_INSTITUCIONAL, borderWidth: "2px" } },
    },
    "& .MuiInputLabel-root": { fontWeight: 800, color: "#666" },
    "& .MuiInputLabel-root.Mui-focused": { color: VERDE_INSTITUCIONAL },
  };

  const ovalSelectStyle = {
    "&.MuiOutlinedInput-root": {
      borderRadius: "50px", backgroundColor: "#fff",
      "& .MuiSelect-select": { fontWeight: 900, px: 3, py: 1 },
      "& fieldset": { borderColor: "#dcdde1", borderWidth: "1.5px" },
      "&.Mui-focused": { "& fieldset": { borderColor: VERDE_INSTITUCIONAL, borderWidth: "2px" } },
    }
  };

  return (
    <Box sx={{ height: "100vh", overflow: "hidden", background: "#f5f7f9", display: "flex" }}>

      {/* SIDEBAR */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => setLogoutOpen(true)}
        verde={VERDE_INSTITUCIONAL}
        careerCards={careerCards}
        selectedPeriodId={selectedPeriodId}
      />

      {/* CONTENIDO PRINCIPAL */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

        {/* HEADER */}
        <AppBar position="sticky" sx={{ bgcolor: VERDE_INSTITUCIONAL, elevation: 2, zIndex: 1100 }}>
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1, md: 5 }, minHeight: "56px !important", py: 0.8 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => setSidebarOpen(true)} sx={{ color: "#fff", mr: 0.5, display: { xs: "flex", sm: "none" } }}>
                <MenuIcon />
              </IconButton>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  Defensas Finales
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: "0.65rem" }}>
                  GESTIÓN ADMINISTRATIVA
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* CONTENIDO SCROLLEABLE */}
        <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <Fade in={true} timeout={800}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 4, alignItems: 'start' }}>

                {/* COLUMNA IZQUIERDA */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333", display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonthRoundedIcon fontSize="small" sx={{ color: VERDE_INSTITUCIONAL }} />
                    Programar Periodo
                  </Typography>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                        {/* Fecha apertura */}
                        {isMobile ? (
                          <MobileDateTimePicker label="Fecha de Apertura" value={startsAt} onChange={(v) => setStartsAt(v)} ampm={false}
                            viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                            slotProps={{ textField: { fullWidth: true, size: "small", sx: premiumInputStyle }, dialog: mobileDialogStyle }}
                          />
                        ) : (
                          <DateTimePicker label="Fecha de Apertura" value={startsAt} onChange={(v) => setStartsAt(v)} ampm={false}
                            viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                            slotProps={{ textField: { fullWidth: true, size: "small", sx: premiumInputStyle }, popper: { placement: 'bottom-start', sx: { ...cleanPopperStyle, zIndex: 1300 } } }}
                          />
                        )}

                        {/* Fecha cierre */}
                        {isMobile ? (
                          <MobileDateTimePicker label="Fecha de Cierre" value={endsAt} onChange={(v) => setEndsAt(v)} ampm={false}
                            viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                            slotProps={{ textField: { fullWidth: true, size: "small", sx: premiumInputStyle }, dialog: mobileDialogStyle }}
                          />
                        ) : (
                          <DateTimePicker label="Fecha de Cierre" value={endsAt} onChange={(v) => setEndsAt(v)} ampm={false}
                            viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                            slotProps={{ textField: { fullWidth: true, size: "small", sx: premiumInputStyle }, popper: { placement: 'bottom-start', sx: { ...cleanPopperStyle, zIndex: 1300 } } }}
                          />
                        )}

                        {/* ✅ Carrera OBLIGATORIA con error inline */}
                        <FormControl sx={{ maxWidth: 400 }}>
                          <Select
                            size="small"
                            displayEmpty
                            value={careerId}
                            onChange={(e) => { setCareerId(e.target.value as any); setCareerError(false); }}
                            sx={{
                              ...ovalSelectStyle,
                              ...(careerError && {
                                "&.MuiOutlinedInput-root fieldset": {
                                  borderColor: "#e74c3c !important",
                                  borderWidth: "2px !important",
                                },
                              }),
                            }}
                            renderValue={(selected: any) => {
                              if (selected === "") return <span style={{ color: careerError ? "#e74c3c" : "#95a5a6" }}>SELECCIONA CARRERA</span>;
                              return careers.find(c => c.id === selected)?.name.toUpperCase() || "SELECCIONA CARRERA";
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  borderRadius: "16px", mt: 1, maxHeight: 220,
                                  "&::-webkit-scrollbar": { width: "5px" },
                                  "&::-webkit-scrollbar-thumb": { background: VERDE_INSTITUCIONAL, borderRadius: "10px" }
                                }
                              },
                            }}
                          >
                            <MenuItem value="" disabled>SELECCIONA CARRERA</MenuItem>
                            {careers.map((c) => (
                              <MenuItem key={c.id} value={c.id} sx={{ mb: 0.5, borderRadius: "10px", px: 2 }}>
                                <ListItemText primary={c.name} primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase" }} />
                              </MenuItem>
                            ))}
                          </Select>

                          {/* Mensaje inline — sin alert */}
                          {careerError && (
                            <Typography variant="caption" sx={{ color: "#e74c3c", fontWeight: 700, mt: 0.8, ml: 2, display: "flex", alignItems: "center", gap: 0.5 }}>
                              ⚠ Debes seleccionar una carrera para continuar
                            </Typography>
                          )}
                        </FormControl>

                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Button
                            onClick={handleCreateWindow}
                            disabled={loading}
                            variant="contained"
                            sx={{ py: 1.5, px: 6, bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900, borderRadius: "50px", boxShadow: `0 8px 20px ${VERDE_INSTITUCIONAL}33`, textTransform: 'uppercase', "&:hover": { bgcolor: VERDE_INSTITUCIONAL, transform: 'scale(1.05)' } }}
                          >
                            {loading ? "Habilitar" : "Habilitar Acceso"}
                          </Button>
                        </Box>
                      </Box>
                    </LocalizationProvider>
                  </Paper>
                </Box>

                {/* COLUMNA DERECHA */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333", display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentTurnedInRoundedIcon fontSize="small" sx={{ color: VERDE_INSTITUCIONAL }} />
                    Periodos en Curso ({windows.length})
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    {windows.map((w, index) => (
                      <Fade in={true} timeout={300 + index * 100} key={w.id}>
                        <Paper sx={{ p: 2.5, borderRadius: "22px", display: "flex", flexDirection: 'column', gap: 1.5, borderLeft: `7px solid ${w.isActive ? VERDE_INSTITUCIONAL : "#bdc3c7"}`, boxShadow: "0 5px 15px rgba(0,0,0,0.03)" }}>
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: "#2c3e50", textTransform: 'uppercase' }}>
                                {w.careerName}
                              </Typography>
                              {w.hasRubric ? (
                                <Chip label="Rúbrica ✅" size="small" sx={{ bgcolor: "rgba(46,125,50,0.12)", color: "#2e7d32", fontWeight: 900, fontSize: "0.65rem", height: "20px" }} />
                              ) : (
                                <Chip label="Sin rúbrica" size="small" sx={{ bgcolor: "rgba(198,40,40,0.10)", color: "#c62828", fontWeight: 900, fontSize: "0.65rem", height: "20px" }} />
                              )}
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                              <AccessTimeRoundedIcon sx={{ fontSize: 16, color: VERDE_INSTITUCIONAL }} />
                              <Typography variant="caption" sx={{ color: "#7f8c8d", fontWeight: 900 }}>
                                {dayjs(w.startsAt).format("DD/MM/YY HH:mm")} — {dayjs(w.endsAt).format("DD/MM/YY HH:mm")}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, borderTop: '1px solid #f1f2f6', gap: 1 }}>
                            <Chip size="small" label={w.isActive ? "ACTIVO" : "CERRADO"} sx={{ bgcolor: w.isActive ? `${VERDE_INSTITUCIONAL}15` : "#f5f5f5", color: w.isActive ? VERDE_INSTITUCIONAL : "#b2bec3", fontWeight: 900, fontSize: "0.65rem" }} />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Button onClick={() => openWindowManage(w)} variant="outlined" size="small" sx={{ borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL, borderRadius: "50px", fontWeight: 900, fontSize: '0.7rem', py: 0.3, px: 1.5 }}>
                                Gestionar
                              </Button>
                              {w.isActive && (
                                <Button onClick={() => handleCloseWindow(w.id)} variant="contained" size="small" sx={{ bgcolor: "#ff7675", borderRadius: "50px", fontWeight: 900, fontSize: '0.7rem', py: 0.3, px: 1.5 }}>
                                  Cerrar
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      </Fade>
                    ))}
                    {!windows.length && (
                      <Typography sx={{ color: "#777", fontStyle: "italic", gridColumn: "1 / -1" }}>
                        No hay ventanas aún.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Container>
          </Fade>
        </Box>

        {/* FOOTER */}
        <Box sx={{ width: "100%", bgcolor: VERDE_INSTITUCIONAL, color: "#fff", py: 0.5, textAlign: "center", flexShrink: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, fontSize: "0.65rem" }}>
            © {new Date().getFullYear()} - Panel de Defensas Finales
          </Typography>
        </Box>
      </Box>

      {/* MODAL GESTIONAR VENTANA */}
      <Dialog open={openManage} onClose={() => setOpenManage(false)} maxWidth="md"
        PaperProps={{ sx: { borderRadius: "25px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: '90%', maxWidth: 800 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL, borderBottom: "1px solid #f1f2f6", py: 1.5, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentTurnedInRoundedIcon sx={{ fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
              Gestionar Ventana {activeWindow ? `#${activeWindow.id}` : ""}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {!activeWindow ? (
            <Typography sx={{ color: "#777" }}>Sin ventana seleccionada.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* RÚBRICA PDF */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #e1e8ed", bgcolor: "#fafbfc" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionRoundedIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                    <Typography sx={{ fontWeight: 900 }}>Rúbrica (PDF)</Typography>
                  </Box>
                  <Chip label={activeWindow?.hasRubric ? "Rúbrica ✅" : "Sin rúbrica"} color={activeWindow?.hasRubric ? "success" : "default"} variant={activeWindow?.hasRubric ? "filled" : "outlined"} sx={{ fontWeight: 900 }} />
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                  <Button variant="outlined" component="label" startIcon={<UploadFileRoundedIcon />}
                    sx={{ borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL, fontWeight: 900, borderRadius: "50px" }}
                  >
                    Seleccionar PDF
                    <input type="file" hidden accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0] ?? null; setRubricFile(f); }} />
                  </Button>
                  <Typography sx={{ color: "#666", fontSize: "0.9rem", flex: 1 }}>
                    {rubricFile ? `📄 ${rubricFile.name}` : "Ningún archivo seleccionado"}
                  </Typography>
                  <Button onClick={handleUploadRubric} disabled={loading || !rubricFile} variant="contained" sx={{ bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900, borderRadius: "50px", px: 3 }}>
                    Subir rúbrica
                  </Button>
                </Box>
              </Paper>

              {/* CREAR SLOT */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #e1e8ed" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AccessTimeRoundedIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                  <Typography sx={{ fontWeight: 900 }}>Crear Slot de Tiempo</Typography>
                </Box>
                <LocalizationProvider dateAdapter={AdapterDayjs} >
                  <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <DateTimePicker label="Inicio del Slot" value={slotStart} onChange={(v) => setSlotStart(v)} ampm={false}
                      viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                      slotProps={{ textField: { size: "small", sx: { width: 250, ...premiumInputStyle } }, popper: { sx: { ...cleanPopperStyle, zIndex: 1400 } } }}
                    />
                    <DateTimePicker label="Fin del Slot" value={slotEnd} onChange={(v) => setSlotEnd(v)} ampm={false}
                      viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                      slotProps={{ textField: { size: "small", sx: { width: 250, ...premiumInputStyle } }, popper: { sx: { ...cleanPopperStyle, zIndex: 1400 } } }}
                    />
                  </Box>
                </LocalizationProvider>
                <Button onClick={handleCreateSlot} disabled={loading} variant="contained" sx={{ bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900, borderRadius: "50px", px: 6, maxWidth: 400, mx: 'auto', display: 'block' }}>
                  Crear Slot
                </Button>
              </Paper>

              {/* CREAR BOOKING */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #e1e8ed", bgcolor: "#fafbfc" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GroupsRoundedIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                  <Typography sx={{ fontWeight: 900 }}>Crear Reserva (Slot + Estudiantes + Jurados)</Typography>
                </Box>

                <Typography sx={{ fontWeight: 800, mt: 2, mb: 1, fontSize: "0.9rem" }}>📅 Seleccionar Slot</Typography>
                <FormControl sx={{ maxWidth: 400 }}>
                  <Select size="small" displayEmpty value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value ? Number(e.target.value) : "")}
                    sx={ovalSelectStyle}
                    renderValue={(selected: any) => {
                      if (!selected) return <span style={{ color: "#95a5a6" }}>SELECCIONA UN SLOT</span>;
                      const slot = slots.find(s => s.id === selected);
                      return slot
                        ? `${dayjs(slot.startsAt).format("DD/MM/YY HH:mm")} → ${dayjs(slot.endsAt).format("DD/MM/YY HH:mm")}`
                        : "Slot seleccionado";
                    }}
                  >
                    <MenuItem value="" disabled>SELECCIONA UN SLOT</MenuItem>
                    {slots.map((s) => (
                      <MenuItem key={s.id} value={s.id} disabled={s.booked}>
                        <ListItemText
                          primary={`${dayjs(s.startsAt).format("DD/MM/YY HH:mm")} → ${dayjs(s.endsAt).format("DD/MM/YY HH:mm")}${s.booked ? "  (RESERVADO)" : ""}`}
                          primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem" }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography sx={{ fontWeight: 800, mt: 3, mb: 1, fontSize: "0.9rem" }}>👨‍🎓 Estudiantes (máximo 2)</Typography>
                {!activeWindow.careerId && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: "0.85rem", color: "#666", mb: 1 }}>Selecciona carrera para ver estudiantes:</Typography>
                    <FormControl sx={{ maxWidth: 400 }}>
                      <Select size="small" displayEmpty value={manageCareerId}
                        onChange={async (e) => {
                          const cid = e.target.value ? Number(e.target.value) : "";
                          setManageCareerId(cid);
                          setSelectedStudentIds([]);
                          if (!cid) { setStudents([]); return; }
                          const st = await adminFinalListStudentsByCareer(cid, periodId);
                          setStudents(st);
                        }}
                        sx={ovalSelectStyle}
                        renderValue={(selected: any) => {
                          if (!selected) return <span style={{ color: "#95a5a6" }}>SELECCIONA CARRERA</span>;
                          return careers.find(c => c.id === selected)?.name.toUpperCase() || "CARRERA";
                        }}
                      >
                        <MenuItem value="" disabled>SELECCIONA CARRERA</MenuItem>
                        {careers.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            <ListItemText primary={c.name} primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase" }} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {(activeWindow.careerId || manageCareerId) ? (
                  <Box sx={{ display: "grid", gap: 1.5, maxHeight: 300, overflowY: "auto", pr: 1 }}>
                    {students.map((st) => {
                      const checked = selectedStudentIds.includes(st.id);
                      const hasProject = !!st.projectName?.trim();
                      return (
                        <Box key={st.id}
                          onClick={() => { if (!hasProject) return; toggleStudent(st.id); }}
                          sx={{ p: 2, borderRadius: "16px", border: `2px solid ${checked ? VERDE_INSTITUCIONAL : "#eee"}`, cursor: hasProject ? "pointer" : "not-allowed", background: checked ? `${VERDE_INSTITUCIONAL}08` : "#fff", opacity: hasProject ? 1 : 0.5, transition: "all 0.2s" }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonRoundedIcon sx={{ color: checked ? VERDE_INSTITUCIONAL : "#999", fontSize: 20 }} />
                              <Typography sx={{ fontWeight: 900, fontSize: "0.9rem" }}>{st.fullName} ({st.dni})</Typography>
                            </Box>
                            {checked && (
                              <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: VERDE_INSTITUCIONAL, color: "#fff", display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: "0.9rem" }}>✓</Box>
                            )}
                          </Box>
                          {hasProject ? (
                            <Typography sx={{ color: "#555", fontSize: "0.85rem", mt: 0.5, ml: 3.5 }}>📋 Proyecto: <b>{st.projectName}</b></Typography>
                          ) : (
                            <Typography sx={{ color: "#c62828", fontSize: "0.85rem", mt: 0.5, fontWeight: 800, ml: 3.5 }}>⚠️ SIN PROYECTO ASIGNADO</Typography>
                          )}
                        </Box>
                      );
                    })}
                    {!students.length && (
                      <Typography sx={{ color: "#777", fontStyle: "italic", p: 2, textAlign: 'center' }}>No se encontraron estudiantes.</Typography>
                    )}
                  </Box>
                ) : (
                  <Typography sx={{ color: "#777", fontStyle: "italic", mt: 1, p: 2, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 2 }}>
                    Esperando selección de carrera...
                  </Typography>
                )}

                <JuriesSelector juries={juries} selectedJuryIds={selectedJuryIds} toggleJury={toggleJury} />

                <Button
                  onClick={handleCreateBooking}
                  disabled={loading || (!activeWindow.careerId && !manageCareerId) || !selectedSlotId || selectedStudentIds.length < 1 || selectedStudentIds.length > 2 || selectedJuryIds.length < 1}
                  variant="contained"
                  sx={{ mt: 3, bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900, borderRadius: "50px", py: 1.5, px: 6, maxWidth: 400, mx: 'auto', display: 'block' }}
                >
                  Crear Reserva
                </Button>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f2f6' }}>
          <Button onClick={() => setOpenManage(false)} sx={{ fontWeight: 900, borderRadius: "50px", px: 3, color: VERDE_INSTITUCIONAL }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

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
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555" }}>
            Cancelar
          </Button>
          <Button onClick={() => { logout(); nav("/"); }} variant="contained" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, "&:hover": { bgcolor: "#006666" } }}>
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG CONFIRMAR ACCIÓN ──────────────────────────────────────────── */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(c => ({ ...c, open: false }))}
        PaperProps={{ sx: { borderRadius: "16px", p: 1, minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#2c3e50", pb: 1 }}>¿Confirmar acción?</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">{confirmDialog.msg}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDialog(c => ({ ...c, open: false }))} variant="outlined" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555" }}>
            Cancelar
          </Button>
          <Button onClick={() => { setConfirmDialog(c => ({ ...c, open: false })); confirmDialog.onConfirm(); }}
            variant="contained" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: "#ff7675", "&:hover": { bgcolor: "#d63031" } }}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR ─────────────────────────────────────────────────────────── */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity={toast.type} variant="filled"
          icon={toast.type === "success" ? <CheckCircleRoundedIcon /> : toast.type === "error" ? <ErrorRoundedIcon /> : <WarningAmberRoundedIcon />}
          sx={{ borderRadius: "16px", fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>

    </Box>
  );
}