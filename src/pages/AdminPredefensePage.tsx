import { useEffect, useMemo, useState } from "react";
import { 
  Box, Button, Container, Typography, Paper, MenuItem, 
  Select, FormControl, Chip, Fade, Toolbar, AppBar, ListItemText,
  IconButton, useTheme, useMediaQuery,
  Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import LogoutIcon from "@mui/icons-material/Logout";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'; 
import dayjs, { Dayjs } from "dayjs";

import { listCareers } from "../services/careerService";
import type { CareerDto } from "../services/careerService";
import { adminCreateWindow, adminListWindows, adminCloseWindow } from "../services/predefenseService";
import { listCareerCards, type CareerCardDto } from "../services/adminCareerCardsService";
import { logout } from "../services/authService";
import AdminSidebar from "../components/AdminSidebar";
import { useActivePeriod } from "../hooks/useActivePeriod";
import { useQuery } from "@tanstack/react-query";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function AdminPredefensePage() {
  const nav = useNavigate();
  const activePeriod = useActivePeriod();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [careerId, setCareerId] = useState<number | "">("");
  const [careerError, setCareerError] = useState(false);
  const [startsAt, setStartsAt] = useState<Dayjs | null>(dayjs().add(1, "day").hour(8).minute(0));
  const [endsAt, setEndsAt] = useState<Dayjs | null>(dayjs().add(7, "day").hour(18).minute(0));

  // ─── Snackbar ─────────────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "warning" }>({
    open: false, msg: "", severity: "success",
  });
  const notify = (msg: string, severity: "success" | "error" | "warning" = "success") =>
    setSnack({ open: true, msg, severity });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  // ─── Dialog cierre de sesión ──────────────────────────────────────────────
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ─── Dialog cerrar ventana ────────────────────────────────────────────────
  const [closeWindowId, setCloseWindowId] = useState<number | null>(null);

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (!ls) return undefined;
    const n = Number(ls);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  const selectedPeriodId: number | "ALL" = periodId ?? "ALL";

  const { data: careerCards = [] } = useQuery<CareerCardDto[]>({
    queryKey: ["careerCards", selectedPeriodId],
    queryFn: () => {
      const pid = selectedPeriodId === "ALL" ? (activePeriod.periodId ?? undefined) : selectedPeriodId;
      return listCareerCards(pid);
    },
    enabled: !activePeriod.loading,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [cs, ws] = await Promise.all([listCareers(), adminListWindows(periodId)]);
      setCareers(Array.isArray(cs) ? cs : []);
      setWindows(Array.isArray(ws) ? ws : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!startsAt || !endsAt || careerId === "") {
      setCareerError(true);
      return;
    }
    setCareerError(false);
    setLoading(true);
    try {
      await adminCreateWindow({
        academicPeriodId: periodId ?? null,
        careerId: careerId,
        startsAt: startsAt.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: endsAt.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await load();
      setCareerId("");
      notify("Periodo habilitado correctamente");
    } catch (e: any) {
      notify(e?.response?.data?.message ?? "Error al crear el periodo", "error");
    } finally { setLoading(false); }
  };

  // Abre el dialog de confirmación antes de cerrar ventana
  const handleClose = (id: number) => setCloseWindowId(id);

  const confirmCloseWindow = async () => {
    if (closeWindowId === null) return;
    setLoading(true);
    setCloseWindowId(null);
    try {
      await adminCloseWindow(closeWindowId);
      await load();
      notify("Periodo cerrado correctamente");
    } catch (e: any) {
      notify(e?.response?.data?.message ?? "Error al cerrar el periodo", "error");
    } finally { setLoading(false); }
  };

  const cleanPopperStyle = {
    "& .MuiPaper-root": {
      bgcolor: "#fff", color: "#333", borderRadius: "20px",
      boxShadow: "0 15px 45px rgba(0,0,0,0.15)", border: "1px solid #eee",
      "& .MuiPickersDay-root": {
        "&.Mui-selected": { bgcolor: VERDE_INSTITUCIONAL, color: "#fff", "&:hover": { bgcolor: VERDE_INSTITUCIONAL } },
        "&.MuiPickersDay-today": { borderColor: VERDE_INSTITUCIONAL, borderWidth: "2px", fontWeight: 900 },
      },
      "& .MuiClock-pin": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-root": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-thumb": { bgcolor: VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL },
      "& .MuiDialogActions-root .MuiButton-root": { color: VERDE_INSTITUCIONAL, fontWeight: 900 },
      // ✅ Fix días de la semana
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
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f5f7f9" }}>

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => setLogoutOpen(true)}
        verde={VERDE_INSTITUCIONAL}
        careerCards={careerCards}
        selectedPeriodId={selectedPeriodId}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* HEADER sticky */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: VERDE_INSTITUCIONAL, zIndex: 1100, top: 0 }}
        >
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1, md: 4 }, minHeight: "56px !important" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={() => setSidebarOpen(true)}
                sx={{ color: "#fff", display: { xs: "flex", sm: "none" } }}
              >
                <MenuIcon />
              </IconButton>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  Predefensas
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
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 4, alignItems: 'start' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333", display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonthRoundedIcon fontSize="small" sx={{ color: VERDE_INSTITUCIONAL }} /> Programar Periodo
                  </Typography>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                        {isMobile ? (
                          <MobileDateTimePicker
                            label="Fecha de Apertura"
                            value={startsAt}
                            onChange={(v) => setStartsAt(v)}
                            ampm={false}
                            viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                            slotProps={{
                              textField: { fullWidth: true, size: "small", sx: premiumInputStyle },
                              dialog: { sx: mobileDialogStyle },
                            }}
                          />
                        ) : (
                          <DateTimePicker
                            label="Fecha de Apertura"
                            value={startsAt}
                            onChange={(v) => setStartsAt(v)}
                            ampm={false}
                            viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                            slotProps={{ textField: { fullWidth: true, size: "small", sx: premiumInputStyle }, popper: { placement: 'bottom-start', sx: { ...cleanPopperStyle, zIndex: 1300 } } }}
                          />
                        )}

                        {isMobile ? (
                          <MobileDateTimePicker
                            label="Fecha de Cierre"
                            value={endsAt}
                            onChange={(v) => setEndsAt(v)}
                            ampm={false}
                            viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                            slotProps={{
                              textField: { fullWidth: true, size: "small", sx: premiumInputStyle },
                              dialog: { sx: mobileDialogStyle },
                            }}
                          />
                        ) : (
                          <DateTimePicker
                            label="Fecha de Cierre"
                            value={endsAt}
                            onChange={(v) => setEndsAt(v)}
                            ampm={false}
                            viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                            slotProps={{ textField: { fullWidth: true, size: "small", sx: premiumInputStyle }, popper: { placement: 'bottom-start', sx: { ...cleanPopperStyle, zIndex: 1300 } } }}
                          />
                        )}

                        <FormControl fullWidth>
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
                              return careers.find(c => c.id === selected)?.name.toUpperCase();
                            }}
                            MenuProps={{ PaperProps: { sx: { borderRadius: "16px", mt: 1, maxHeight: 220 } } }}
                          >
                            <MenuItem value="" disabled>SELECCIONA CARRERA</MenuItem>
                            {careers.map((c) => (
                              <MenuItem key={c.id} value={c.id}>
                                <ListItemText primary={c.name} primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase" }} />
                              </MenuItem>
                            ))}
                          </Select>
                          {/* ✅ Mensaje inline — sin alert, sin Snackbar */}
                          {careerError && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#e74c3c",
                                fontWeight: 700,
                                mt: 0.8,
                                ml: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              ⚠ Debes seleccionar una carrera para continuar
                            </Typography>
                          )}
                        </FormControl>

                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Button
                            onClick={handleCreate}
                            disabled={loading}
                            variant="contained"
                            sx={{ py: 1.5, px: 6, bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900, borderRadius: "50px", textTransform: 'uppercase', "&:hover": { bgcolor: VERDE_INSTITUCIONAL, transform: 'scale(1.05)' } }}
                          >
                            {loading ? "Confirmar" : "Habilitar Acceso"}
                          </Button>
                        </Box>
                      </Box>
                    </LocalizationProvider>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333", display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentTurnedInRoundedIcon fontSize="small" sx={{ color: VERDE_INSTITUCIONAL }} /> Periodos en Curso
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    {windows.map((w, index) => (
                      <Fade in={true} timeout={300 + index * 100} key={w.id}>
                        <Paper sx={{ p: 2.5, borderRadius: "22px", display: "flex", flexDirection: 'column', gap: 1.5, borderLeft: `7px solid ${w.isActive ? VERDE_INSTITUCIONAL : "#bdc3c7"}`, boxShadow: "0 5px 15px rgba(0,0,0,0.03)" }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: "#2c3e50", textTransform: 'uppercase' }}>
                              {w.careerName || "Todas las Carreras"}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                              <AccessTimeRoundedIcon sx={{ fontSize: 16, color: VERDE_INSTITUCIONAL }} />
                              <Typography variant="caption" sx={{ color: "#7f8c8d", fontWeight: 900 }}>
                                {dayjs(w.startsAt).format("DD/MM/YY HH:mm")} — {dayjs(w.endsAt).format("DD/MM/YY HH:mm")}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, borderTop: '1px solid #f1f2f6' }}>
                            <Chip size="small" label={w.isActive ? "ACTIVO" : "FIN"} sx={{ bgcolor: w.isActive ? `${VERDE_INSTITUCIONAL}15` : "#f5f5f5", color: w.isActive ? VERDE_INSTITUCIONAL : "#b2bec3", fontWeight: 900, fontSize: "0.65rem" }} />
                            {w.isActive && (
                              <Button
                                onClick={() => handleClose(w.id)}
                                variant="contained"
                                size="small"
                                sx={{ bgcolor: "#ff7675", borderRadius: "50px", fontWeight: 900, fontSize: '0.7rem', py: 0.3 }}
                              >
                                Cerrar
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      </Fade>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Container>
          </Fade>
        </Box>

        {/* FOOTER FIJO */}
        <Box sx={{ width: "100%", bgcolor: VERDE_INSTITUCIONAL, color: "#fff", py: 0.5, textAlign: "center", flexShrink: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, fontSize: "0.65rem" }}>
            © {new Date().getFullYear()} - Panel de Predefensas
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
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(0,139,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogoutIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
            Cerrar sesión
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas cerrar sesión? Tu sesión actual se terminará.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setLogoutOpen(false)}
            variant="outlined"
            fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555", "&:hover": { borderColor: "#bbb", bgcolor: "#f9f9f9" } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => { logout(); nav("/"); }}
            variant="contained"
            fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, "&:hover": { bgcolor: "#006666" } }}
          >
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG CONFIRMAR CIERRE DE VENTANA ──────────────────────────────── */}
      <Dialog
        open={closeWindowId !== null}
        onClose={() => setCloseWindowId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", pb: 1 }}>
          ¿Finalizar este periodo?
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Esta acción cerrará el periodo de predefensa seleccionado. Los estudiantes ya no podrán inscribirse.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setCloseWindowId(null)}
            variant="outlined"
            fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmCloseWindow}
            variant="contained"
            fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: "#ff7675", "&:hover": { bgcolor: "#d63031" } }}
          >
            Finalizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR ─────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ fontWeight: 600, borderRadius: "12px", minWidth: 280 }}>
          {snack.msg}
        </Alert>
      </Snackbar>

    </Box>
  );
}