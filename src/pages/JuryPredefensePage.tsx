import 'dayjs/locale/es';
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Divider,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Zoom,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  School as SchoolIcon,
  CalendarMonth as CalendarMonthIcon,
  BookOnline as BookOnlineIcon,
  Send as SendIcon,
  Logout as LogoutIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { esES } from "@mui/x-date-pickers/locales";
import dayjs, { Dayjs } from "dayjs";

import type { UserResponse } from "../services/adminUserService";
import { listCareers } from "../services/careerService";
import type { CareerDto } from "../services/careerService";
import {
  juryListStudentsByCareer,
  juryListWindowsByCareer,
  juryListSlots,
  juryBookSlot,
  juryCreateObservation,
  juryCreateSlot,
} from "../services/predefenseService";
import CoordinatorSidebar from "../components/Coordinatorsidebar/Coordinatorsidebar";
import TutorSidebar from "../components/TutorSidebar/TutorSidebar";

const VERDE_INSTITUCIONAL = "#008B8B";

// ─── Locale text español para MUI pickers ─────────────────────────────────
const esLocaleText = esES.components.MuiLocalizationProvider.defaultProps.localeText;

// ─── Estilos del popper del DateTimePicker (desktop) ──────────────────────
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
    // Iniciales fijas — independiente del idioma del navegador
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

// ─── Estilos del dialog móvil — SIN viewRenderers (selector digital) ──────
const mobileDialogStyle = {
  sx: {
    zIndex: 1400,
    "& .MuiDialog-paper": { borderRadius: "20px", m: 2, width: "calc(100% - 32px)", maxWidth: 360 },
    "& .MuiPickersToolbar-root": { bgcolor: VERDE_INSTITUCIONAL, color: "#fff" },
    "& .MuiDateTimePickerToolbar-dateContainer .MuiTypography-root": { color: "#fff" },
    "& .MuiDateTimePickerToolbar-timeContainer .MuiTypography-root": { color: "rgba(255,255,255,0.7)" },
    "& .MuiPickersDay-root.Mui-selected": { bgcolor: VERDE_INSTITUCIONAL },
    "& .MuiMultiSectionDigitalClock-root": { width: "100%" },
    "& .MuiMultiSectionDigitalClockSection-item.Mui-selected": {
      bgcolor: VERDE_INSTITUCIONAL,
      color: "#fff",
      borderRadius: "8px",
      fontWeight: 900,
    },
    "& .MuiDialogActions-root .MuiButton-root": { color: VERDE_INSTITUCIONAL, fontWeight: 900 },
    // Iniciales fijas en el calendar del móvil
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

export default function JuryPredefensePage() {
  const nav = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [careerId, setCareerId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [windowId, setWindowId] = useState<number | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [obsTextMap, setObsTextMap] = useState<{ [bookingId: number]: string }>({});
  const [loading, setLoading] = useState(false);

  // ─── Reloj digital en tiempo real ─────────────────────────────────────────
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [slotStartsAt, setSlotStartsAt] = useState<Dayjs | null>(
    dayjs().add(1, "hour").startOf("hour")
  );
  const [slotEndsAt, setSlotEndsAt] = useState<Dayjs | null>(
    dayjs().add(1, "hour").add(30, "minute").startOf("hour")
  );

  // ─── Snackbar ──────────────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "warning" }>({
    open: false, msg: "", severity: "success",
  });
  const notify = (msg: string, severity: "success" | "error" | "warning" = "success") =>
    setSnack({ open: true, msg, severity });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  // ─── Dialog cerrar sesión ──────────────────────────────────────────────────
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isCoordinator = useMemo(
    () => location.pathname.includes("coordinator"),
    [location.pathname]
  );

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

  const getInitials = () => {
    const name = juryInfo?.name?.trim();
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("periodId");
    return ls ? Number(ls) : undefined;
  }, []);

  useEffect(() => {
    (async () => {
      const cs = await listCareers();
      setCareers(Array.isArray(cs) ? cs : []);
    })();
    const photoKey = isCoordinator ? "coordinatorPhoto" : "tutorPhoto";
    const savedPhoto = localStorage.getItem(photoKey);
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, [isCoordinator]);

  const handleLogout = () => setLogoutOpen(true);
  const confirmLogout = () => { localStorage.clear(); nav("/"); };
  const handlePhotoChange = (photo: string) => setPhotoPreview(photo);

  const loadCareer = async (cid: number) => {
    setLoading(true);
    try {
      const [ss, ws] = await Promise.all([
        juryListStudentsByCareer(cid, periodId),
        juryListWindowsByCareer(cid, periodId),
      ]);
      setStudents(Array.isArray(ss) ? ss : []);
      setWindows(Array.isArray(ws) ? ws : []);
      if (ws?.length > 0) {
        const firstWinId = ws[0].id;
        setWindowId(firstWinId);
        const sl = await juryListSlots(firstWinId);
        setSlots(sl);
      } else {
        setWindowId(null);
        setSlots([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWindow = async (wid: number) => {
    setWindowId(wid);
    setLoading(true);
    try {
      const sl = await juryListSlots(wid);
      setSlots(sl);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!windowId || !slotStartsAt || !slotEndsAt) return notify("Datos incompletos", "warning");
    setLoading(true);
    try {
      await juryCreateSlot(windowId, slotStartsAt.format("YYYY-MM-DDTHH:mm:ss"), slotEndsAt.format("YYYY-MM-DDTHH:mm:ss"));
      const sl = await juryListSlots(windowId);
      setSlots(sl);
      notify("Slot creado correctamente ✅");
    } catch {
      notify("Error al crear slot", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (slotId: number) => {
    if (!selectedStudentId) return notify("Selecciona un estudiante", "warning");
    setLoading(true);
    try {
      await juryBookSlot({ slotId, studentId: selectedStudentId });
      const sl = await juryListSlots(windowId!);
      const student = students.find((s) => s.id === selectedStudentId);
      if (student) {
        sl.forEach((slot) => {
          if (slot.id === slotId) slot.studentName = student.fullName;
        });
      }
      setSlots(sl);
      notify("Reservado correctamente ✅");
    } catch {
      notify("Error al reservar", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendObservation = async (bookingId: number) => {
    const text = obsTextMap[bookingId]?.trim();
    if (!text) return notify("Escribe una observación", "warning");
    setLoading(true);
    try {
      await juryCreateObservation(bookingId, { text });
      setObsTextMap((prev) => ({ ...prev, [bookingId]: "" }));
      notify("Observación enviada correctamente ✅");
    } catch {
      notify("Error al enviar", "error");
    } finally {
      setLoading(false);
    }
  };

  const ovalSelectSx = {
    borderRadius: "50px",
    fontWeight: 800,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ddd" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: VERDE_INSTITUCIONAL },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: VERDE_INSTITUCIONAL, borderWidth: "2px" },
  };

  // ─── Helper: picker fecha/hora adaptado a dispositivo ─────────────────────
  // Móvil  → MobileDateTimePicker SIN viewRenderers (selector digital, idioma-agnóstico)
  // Desktop → DateTimePicker con reloj analógico (renderTimeViewClock)
  const renderDTP = (
    label: string,
    value: Dayjs | null,
    onChange: (v: Dayjs | null) => void,
    fullWidthMobile = false
  ) => {
    if (isMobile) {
      return (
        <MobileDateTimePicker
          label={label}
          value={value}
          onChange={onChange}
          ampm={false}
          slotProps={{
            textField: { fullWidth: fullWidthMobile, size: "small", sx: premiumInputStyle },
            dialog: mobileDialogStyle,
          }}
        />
      );
    }
    return (
      <DateTimePicker
        label={label}
        value={value}
        onChange={onChange}
        ampm={false}
        viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
        slotProps={{
          textField: { fullWidth: fullWidthMobile, size: "small", sx: premiumInputStyle },
          popper: { placement: "bottom-start", sx: { ...cleanPopperStyle, zIndex: 1300 } },
        }}
      />
    );
  };

  return (
    // ✅ LocalizationProvider con adapterLocale="es" y localeText español
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es" localeText={esLocaleText}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>

        {/* SIDEBAR */}
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

        <Box component="main" sx={{ flexGrow: 1, background: "#f5f7f9", display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

          {/* HEADER */}
          <Box sx={{
            position: "sticky", top: 0, zIndex: 1100, flexShrink: 0,
            bgcolor: VERDE_INSTITUCIONAL, color: "white",
            py: 1.5, px: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                {isCoordinator ? "Gestión de Predefensas (Coordinador)" : "Gestión de Predefensas (Tutor)"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Panel de Jurado
              </Typography>
            </Box>

            {/* RELOJ DIGITAL */}
            <Box sx={{
              display: "flex", alignItems: "center", gap: 1,
              bgcolor: "rgba(255,255,255,0.12)",
              borderRadius: "50px", px: 2, py: 0.8,
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
              <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.9 }} />
              <Box>
                <Typography sx={{
                  fontWeight: 900, fontSize: "1.15rem", lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.05em",
                  fontFamily: "'Courier New', monospace",
                }}>
                  {now.format("HH:mm:ss")}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", opacity: 0.8, fontWeight: 700, textAlign: "center", letterSpacing: "0.03em" }}>
                  {now.format("DD MMM YYYY").toUpperCase()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* CONTENIDO SCROLLEABLE */}
          <Box sx={{ flex: 1, overflowY: "auto", py: 3 }}>
            <Container maxWidth="lg">
              <Stack spacing={3}>

                {/* SELECCIONAR CARRERA */}
                <Fade in timeout={400}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <SchoolIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Seleccionar Carrera</Typography>
                    </Box>
                    <FormControl fullWidth>
                      <Select
                        value={careerId ?? ""}
                        onChange={(e) => { setCareerId(Number(e.target.value)); loadCareer(Number(e.target.value)); }}
                        displayEmpty
                        sx={ovalSelectSx}
                        renderValue={(val: any) => {
                          if (!val) return <span style={{ color: "#aaa", fontWeight: 700 }}>Seleccione Carrera</span>;
                          return careers.find(c => c.id === val)?.name ?? "Seleccione Carrera";
                        }}
                      >
                        <MenuItem value="" disabled>Seleccione Carrera</MenuItem>
                        {careers.map((c) => (
                          <MenuItem key={c.id} value={c.id} sx={{ fontWeight: 800 }}>{c.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Fade>

                {careerId && (
                  <Fade in timeout={500}>
                    <Stack spacing={3}>

                      {/* VENTANA ACTIVA — solo coordinador */}
                      {isCoordinator && (
                        <Paper elevation={0} sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <CalendarMonthIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Ventana Activa</Typography>
                          </Box>
                          <Select
                            fullWidth value={windowId ?? ""}
                            onChange={(e) => handleSelectWindow(Number(e.target.value))}
                            sx={ovalSelectSx}
                          >
                            {windows.map((w) => (
                              <MenuItem key={w.id} value={w.id} sx={{ fontWeight: 800 }}>
                                {dayjs(w.startsAt).format("DD/MM/YY HH:mm")} — {dayjs(w.endsAt).format("DD/MM/YY HH:mm")} · {w.isActive ? "ACTIVA" : "CERRADA"}
                              </MenuItem>
                            ))}
                          </Select>
                          <Divider sx={{ my: 3 }} />

                          {/* ✅ Pickers con helper — móvil: digital, desktop: reloj analógico */}
                          <Box sx={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 2, mb: 2 }}>
                            {renderDTP("Inicio", slotStartsAt, setSlotStartsAt, true)}
                            {renderDTP("Fin", slotEndsAt, setSlotEndsAt, true)}
                          </Box>

                          <Button
                            fullWidth variant="contained"
                            onClick={handleCreateSlot}
                            disabled={loading}
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL, borderRadius: "50px", fontWeight: 900,
                              textTransform: "none", py: 1.3,
                              boxShadow: `0 6px 20px ${VERDE_INSTITUCIONAL}44`,
                              "&:hover": { bgcolor: "#006666", transform: "scale(1.01)" },
                              transition: "all 0.2s ease",
                            }}
                          >
                            Crear Slot
                          </Button>
                        </Paper>
                      )}

                      {/* ESTUDIANTE PARA RESERVAR — solo coordinador */}
                      {isCoordinator && (
                        <Paper elevation={0} sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
                            Estudiante para Reservar
                          </Typography>
                          <Select
                            fullWidth
                            value={selectedStudentId ?? ""}
                            onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                            sx={ovalSelectSx}
                            displayEmpty
                            renderValue={(val: any) => {
                              if (!val) return <span style={{ color: "#aaa", fontWeight: 700 }}>Seleccione Estudiante</span>;
                              return students.find(s => s.id === val)?.fullName ?? "Estudiante";
                            }}
                          >
                            <MenuItem value="" disabled>Seleccione Estudiante</MenuItem>
                            {students.map((s) => (
                              <MenuItem key={s.id} value={s.id} sx={{ fontWeight: 800 }}>{s.fullName}</MenuItem>
                            ))}
                          </Select>
                        </Paper>
                      )}

                      {/* HORARIOS Y OBSERVACIONES */}
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 900, color: "#2c3e50" }}>
                          Horarios y Observaciones
                        </Typography>
                        {slots.length === 0 && (
                          <Typography sx={{ color: "#aaa", fontStyle: "italic", textAlign: "center", py: 4 }}>
                            No hay slots disponibles para esta ventana.
                          </Typography>
                        )}
                        {slots.map((sl, idx) => (
                          <Fade in timeout={300 + idx * 80} key={sl.id}>
                            <Paper
                              sx={{
                                p: 3, mb: 2, borderRadius: "20px",
                                border: `2px solid ${sl.booked ? "#ffb3b3" : `${VERDE_INSTITUCIONAL}55`}`,
                                bgcolor: sl.booked ? "#fff5f5" : "#f0fff4",
                                transition: "box-shadow 0.2s",
                                "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.08)" },
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Box sx={{
                                    bgcolor: sl.booked ? "#ff7675" : VERDE_INSTITUCIONAL,
                                    borderRadius: "12px", px: 1.5, py: 0.6,
                                    display: "flex", alignItems: "center", gap: 0.8,
                                  }}>
                                    <AccessTimeIcon sx={{ color: "#fff", fontSize: 15 }} />
                                    <Typography sx={{
                                      color: "#fff", fontWeight: 900, fontSize: "1rem",
                                      fontFamily: "'Courier New', monospace",
                                      fontVariantNumeric: "tabular-nums",
                                      letterSpacing: "0.05em",
                                    }}>
                                      {dayjs(sl.startsAt).format("HH:mm")}
                                    </Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "0.85rem" }}>→</Typography>
                                    <Typography sx={{
                                      color: "#fff", fontWeight: 900, fontSize: "1rem",
                                      fontFamily: "'Courier New', monospace",
                                      fontVariantNumeric: "tabular-nums",
                                      letterSpacing: "0.05em",
                                    }}>
                                      {dayjs(sl.endsAt).format("HH:mm")}
                                    </Typography>
                                  </Box>
                                  <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#888" }}>
                                    {dayjs(sl.startsAt).format("DD MMM").toUpperCase()}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={sl.booked ? "RESERVADO" : "LIBRE"}
                                  size="small"
                                  sx={{
                                    bgcolor: sl.booked ? "#ff7675" : VERDE_INSTITUCIONAL,
                                    color: "#fff", fontWeight: 900, fontSize: "0.7rem",
                                    borderRadius: "50px",
                                  }}
                                />
                              </Box>

                              {sl.booked ? (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, mb: 1, color: "#c62828" }}>
                                    Reservado por:{" "}
                                    <span style={{ color: "#333" }}>
                                      {sl.studentName || students.find((s) => Number(s.id) === Number(sl.studentId))?.fullName || "Estudiante asignado"}
                                    </span>
                                    {"  "}
                                    <span style={{ color: "#888", fontWeight: 600 }}>(ID Reserva: {sl.bookingId})</span>
                                  </Typography>
                                  <TextField
                                    fullWidth multiline rows={2}
                                    label="Nueva Observación / Correcciones"
                                    value={obsTextMap[sl.bookingId!] || ""}
                                    onChange={(e) => setObsTextMap((prev) => ({ ...prev, [sl.bookingId!]: e.target.value }))}
                                    sx={{
                                      bgcolor: "#fff", mt: 1,
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "14px", fontWeight: 700,
                                        "& fieldset": { borderColor: "#e0e0e0" },
                                        "&:hover fieldset": { borderColor: VERDE_INSTITUCIONAL },
                                        "&.Mui-focused fieldset": { borderColor: VERDE_INSTITUCIONAL },
                                      },
                                      "& .MuiInputLabel-root": { fontWeight: 800 },
                                      "& .MuiInputLabel-root.Mui-focused": { color: VERDE_INSTITUCIONAL },
                                    }}
                                  />
                                  <Button
                                    fullWidth variant="contained" startIcon={<SendIcon />}
                                    onClick={() => handleSendObservation(sl.bookingId)}
                                    disabled={loading}
                                    sx={{
                                      mt: 2, bgcolor: VERDE_INSTITUCIONAL, borderRadius: "50px",
                                      fontWeight: 900, py: 1.2, textTransform: "none",
                                      boxShadow: `0 6px 16px ${VERDE_INSTITUCIONAL}44`,
                                      "&:hover": { bgcolor: "#006666", transform: "scale(1.01)" },
                                      transition: "all 0.2s ease",
                                    }}
                                  >
                                    Enviar Observación
                                  </Button>
                                </Box>
                              ) : (
                                isCoordinator && (
                                  <Button
                                    fullWidth variant="outlined" startIcon={<BookOnlineIcon />}
                                    onClick={() => handleReserve(sl.id)}
                                    disabled={loading}
                                    sx={{
                                      mt: 2, borderRadius: "50px", fontWeight: 900,
                                      borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL,
                                      textTransform: "none", py: 1.2,
                                      "&:hover": { bgcolor: `${VERDE_INSTITUCIONAL}10`, transform: "scale(1.01)" },
                                      transition: "all 0.2s ease",
                                    }}
                                  >
                                    Asignar Estudiante Seleccionado
                                  </Button>
                                )
                              )}
                            </Paper>
                          </Fade>
                        ))}
                      </Box>
                    </Stack>
                  </Fade>
                )}
              </Stack>
            </Container>
          </Box>

          {/* FOOTER */}
          <Box sx={{
            position: "sticky", bottom: 0, zIndex: 1100, flexShrink: 0,
            bgcolor: VERDE_INSTITUCIONAL, color: "white",
            py: 1, textAlign: "center", boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
          }}>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: "11px", fontWeight: 700 }}>
              © 2025 - Panel de Predefensas
            </Typography>
          </Box>
        </Box>

        {/* ── DIALOG CERRAR SESIÓN ──────────────────────────────────────────── */}
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

        {/* ── SNACKBAR ─────────────────────────────────────────────────────── */}
        <Snackbar open={snack.open} autoHideDuration={3500} onClose={closeSnack}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          TransitionComponent={Zoom}
        >
          <Alert onClose={closeSnack} severity={snack.severity} variant="filled"
            sx={{ fontWeight: 700, borderRadius: "16px", minWidth: 320, boxShadow: "0 12px 40px rgba(0,0,0,0.2)", fontSize: "0.95rem" }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}