import { useEffect, useMemo, useState } from "react";
import { 
  Box, Button, Container, Typography, Paper, MenuItem, 
  Select, FormControl, Chip, Fade, Toolbar, AppBar, ListItemText 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'; 
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import { listCareers } from "../services/careerService";
import type { CareerDto } from "../services/careerService";
import { adminCreateWindow, adminListWindows, adminCloseWindow } from "../services/predefenseService";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function AdminPredefensePage() {
  const nav = useNavigate();
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [careerId, setCareerId] = useState<number | "ALL" | "">("");

  const [startsAt, setStartsAt] = useState<Dayjs | null>(dayjs().add(1, "day").hour(8).minute(0));
  const [endsAt, setEndsAt] = useState<Dayjs | null>(dayjs().add(7, "day").hour(18).minute(0));

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (!ls) return undefined;
    const n = Number(ls);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [cs, ws] = await Promise.all([listCareers(), adminListWindows(periodId)]);
      setCareers(Array.isArray(cs) ? cs : []);
      setWindows(Array.isArray(ws) ? ws : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!startsAt || !endsAt || careerId === "") {
      alert("Por favor, selecciona una carrera.");
      return;
    }
    setLoading(true);
    try {
      await adminCreateWindow({
        academicPeriodId: periodId ?? null,
        careerId: careerId === "ALL" ? null : careerId,
        startsAt: startsAt.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: endsAt.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await load();
      setCareerId(""); 
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  const handleClose = async (id: number) => {
    if (!confirm("¿Finalizar este periodo?")) return;
    setLoading(true);
    try {
      await adminCloseWindow(id);
      await load();
    } finally { setLoading(false); }
  };

  const cleanPopperStyle = {
    "& .MuiPaper-root": {
      bgcolor: "#fff",
      color: "#333",
      borderRadius: "20px",
      boxShadow: "0 15px 45px rgba(0,0,0,0.15)",
      border: "1px solid #eee",

      // ✅ FIX: Configuración correcta del header de días
      "& .MuiDayCalendar-header": {
        display: "flex",
        justifyContent: "space-between",
        paddingLeft: "8px",
        paddingRight: "8px",
        marginBottom: "8px",

        "& .MuiDayCalendar-weekDayLabel": {
          width: "36px",
          height: "36px",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          color: "#444",
        }
      },

      // ✅ Asegurar que los días también tengan el tamaño correcto
      "& .MuiDayCalendar-weekContainer": {
        margin: 0,
        justifyContent: "space-between",
        
        "& .MuiPickersDay-root": {
          width: "36px",
          height: "36px",
          margin: "2px",
          fontSize: "0.875rem",
          fontWeight: 600,
        }
      },

      "& .MuiPickersDay-root": {
        "&.Mui-selected": {
          bgcolor: VERDE_INSTITUCIONAL,
          color: "#fff",
          fontWeight: 900,
          "&:hover": { bgcolor: VERDE_INSTITUCIONAL }
        },
        "&.MuiPickersDay-today": { 
          borderColor: VERDE_INSTITUCIONAL,
          borderWidth: "2px",
          fontWeight: 900,
        },
      },

      "& .MuiClock-pin": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-root": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-thumb": {
        bgcolor: VERDE_INSTITUCIONAL,
        borderColor: VERDE_INSTITUCIONAL
      },

      "& .MuiClockNumber-root": { fontWeight: 800 },
      "& .MuiDialogActions-root .MuiButton-root": {
        color: VERDE_INSTITUCIONAL,
        fontWeight: 900
      }
    }
  };

  const premiumInputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      transition: "all 0.2s ease-in-out",
      backgroundColor: "#fff",
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
      borderRadius: "50px",
      backgroundColor: "#fff",
      "& .MuiSelect-select": { fontWeight: 900, px: 3, py: 1 },
      "& fieldset": { borderColor: "#dcdde1", borderWidth: "1.5px" },
      "&.Mui-focused": { "& fieldset": { borderColor: VERDE_INSTITUCIONAL, borderWidth: "2px" } },
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f7f9", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER: DELGADO (py: 0.8) */}
      <AppBar position="static" sx={{ bgcolor: VERDE_INSTITUCIONAL, elevation: 2, zIndex: 1100 }}>
        <Toolbar sx={{ justifyContent: "space-between", px: { md: 5 }, minHeight: "56px !important", py: 0.8 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#fff", lineHeight: 1 }}>Predefensas</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: "0.65rem" }}>GESTIÓN ADMINISTRATIVA</Typography>
          </Box>
          <Button 
            variant="contained" size="small"
            startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: '12px !important' }} />}
            onClick={() => nav("/admin")} 
            sx={{ 
              bgcolor: "#fff", color: VERDE_INSTITUCIONAL, fontWeight: 900, borderRadius: "50px", 
              px: 2, fontSize: "0.75rem", textTransform: 'none', "&:hover": { bgcolor: "#f1f2f6" } 
            }}
          >
            Volver
          </Button>
        </Toolbar>
      </AppBar>

      <Fade in={true} timeout={800}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 4, alignItems: 'start' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333", display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthRoundedIcon fontSize="small" sx={{ color: VERDE_INSTITUCIONAL }} /> Programar Periodo
              </Typography>
              <Paper elevation={0} sx={{ p: 4, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    <DateTimePicker
                      label="Fecha de Apertura"
                      value={startsAt}
                      onChange={(v) => setStartsAt(v)}
                      ampm={false}
                      viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                      slotProps={{ 
                        textField: { fullWidth: true, size: "small", sx: premiumInputStyle },
                        popper: { 
                          placement: 'bottom-start',
                          sx: { ...cleanPopperStyle, zIndex: 1300 }
                        }
                      }}
                    />

                    <DateTimePicker
                      label="Fecha de Cierre"
                      value={endsAt}
                      onChange={(v) => setEndsAt(v)}
                      ampm={false}
                      viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                      slotProps={{ 
                        textField: { fullWidth: true, size: "small", sx: premiumInputStyle },
                        popper: {
                          placement: 'bottom-start',
                          sx: { ...cleanPopperStyle, zIndex: 1300 }
                        }
                      }}
                    />
                    
                    <FormControl fullWidth>
                      <Select
                        size="small" displayEmpty value={careerId}
                        onChange={(e) => setCareerId(e.target.value as any)}
                        sx={ovalSelectStyle}
                        renderValue={(selected: any) => {
                          if (selected === "") return <span style={{ color: "#95a5a6" }}>SELECCIONA CARRERA</span>;
                          return selected === "ALL" ? "TODAS LAS CARRERAS" : careers.find(c => c.id === selected)?.name.toUpperCase();
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
                        <MenuItem value="ALL" sx={{ mb: 0.5, borderRadius: "10px", px: 2 }}>
                            <ListItemText primary="TODAS LAS CARRERAS" primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem" }} />
                        </MenuItem>
                        {careers.map((c) => (
                          <MenuItem key={c.id} value={c.id} sx={{ mb: 0.5, borderRadius: "10px", px: 2 }}>
                            <ListItemText primary={c.name} primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase" }} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        onClick={handleCreate} disabled={loading} variant="contained"
                        sx={{ py: 1.5, px: 6, bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900, borderRadius: "50px", boxShadow: `0 8px 20px ${VERDE_INSTITUCIONAL}33`, textTransform: 'uppercase', "&:hover": { bgcolor: VERDE_INSTITUCIONAL, transform: 'scale(1.05)' } }}
                      >
                        {loading ? "Cargando..." : "Habilitar Acceso"}
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
                        <Typography variant="body2" sx={{ fontWeight: 900, color: "#2c3e50", textTransform: 'uppercase' }}>{w.careerName || "Todas las Carreras"}</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                          <AccessTimeRoundedIcon sx={{ fontSize: 16, color: VERDE_INSTITUCIONAL }} />
                          <Typography variant="caption" sx={{ color: "#7f8c8d", fontWeight: 900 }}>{dayjs(w.startsAt).format("DD/MM/YY HH:mm")} — {dayjs(w.endsAt).format("DD/MM/YY HH:mm")}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, borderTop: '1px solid #f1f2f6' }}>
                        <Chip size="small" label={w.isActive ? "ACTIVO" : "FIN"} sx={{ bgcolor: w.isActive ? `${VERDE_INSTITUCIONAL}15` : "#f5f5f5", color: w.isActive ? VERDE_INSTITUCIONAL : "#b2bec3", fontWeight: 900, fontSize: "0.65rem" }} />
                        {w.isActive && (
                          <Button onClick={() => handleClose(w.id)} variant="contained" size="small" sx={{ bgcolor: "#ff7675", borderRadius: "50px", fontWeight: 900, fontSize: '0.7rem', py: 0.3 }}>Cerrar</Button>
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

      {/* FOOTER: DELGADO (py: 0.5) */}
      <Box sx={{ width: "100%", bgcolor: VERDE_INSTITUCIONAL, color: "#fff", py: 0.5, mt: "auto", textAlign: "center" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, fontSize: "0.65rem" }}>
          © {new Date().getFullYear()} - Panel de Predefensas
        </Typography>
      </Box>
    </Box>
  );
}