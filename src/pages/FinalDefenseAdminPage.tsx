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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/en";

// Configurar locale inglés
dayjs.locale("en");

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


const VERDE_INSTITUCIONAL = "#008B8B";

export default function FinalDefenseAdminPage() {
  const nav = useNavigate();

  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [windows, setWindows] = useState<FinalDefenseWindowDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [careerId, setCareerId] = useState<number | "ALL">("ALL");

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

  // -------- modal gestionar ventana --------
  const [openManage, setOpenManage] = useState(false);
  const [activeWindow, setActiveWindow] = useState<FinalDefenseWindowDto | null>(null);

  // Estado para manejar la carrera seleccionada manualmente en el modal
  const [manageCareerId, setManageCareerId] = useState<number | "">("");

  // Estado para el archivo de rúbrica
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

  useEffect(() => {
    loadMain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateWindow = async () => {
    if (!startsAt || !endsAt) return alert("Selecciona fecha inicio/fin válida");

    setLoading(true);
    try {
      await adminFinalCreateWindow({
        academicPeriodId: periodId ?? null,
        careerId: careerId === "ALL" ? null : careerId,
        startsAt: startsAt.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: endsAt.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await loadMain();
      alert("Ventana creada ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo crear ventana");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWindow = async (id: number) => {
    if (!confirm("¿Cerrar esta ventana?")) return;
    setLoading(true);
    try {
      await adminFinalCloseWindow(id);
      await loadMain();
    } finally {
      setLoading(false);
    }
  };

  // ✅ AQUÍ ESTÁ EL CAMBIO SOLICITADO
  const openWindowManage = async (w: FinalDefenseWindowDto) => {
    setActiveWindow(w);
    setOpenManage(true);

    // Inicializamos manageCareerId si la ventana ya tiene carrera, sino vacío
    setManageCareerId(w.careerId ?? "");
    setRubricFile(null);

    setSelectedSlotId("");
    setSelectedStudentIds([]);
    setSelectedJuryIds([]);

    setLoading(true);
    try {
      // 1. Cargamos Slots y Juries en paralelo
      const [sl, ju] = await Promise.all([
        adminFinalListSlots(w.id),
        adminFinalListJuries() // 👈 Llamada al nuevo servicio
      ]);
      
      setSlots(sl);
      setJuries(ju);

      // 2. 🔍 Console.table para depuración
      console.table(
        ju.map(j => ({
          id: j.id,
          name: j.fullName,
          roles: j.roles
        }))
      );

      // Carga condicional: si la ventana tiene carrera fija, cargamos. Si no, esperamos selección.
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

  // Función para subir rúbrica
  const handleUploadRubric = async () => {
    if (!activeWindow) return;
    if (!rubricFile) return alert("Selecciona un PDF");

    // Validación simple PDF
    const isPdf =
      rubricFile.type.toLowerCase().includes("pdf") ||
      rubricFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) return alert("Solo se permite PDF");

    setLoading(true);
    try {
      await adminFinalUploadRubric(activeWindow.id, rubricFile);
      setRubricFile(null);
      
      await loadMain();
      
      // Actualizamos visualmente el activeWindow
      setActiveWindow(prev => prev ? ({ ...prev, hasRubric: true }) : null);

      alert("Rúbrica subida ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo subir la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!activeWindow) return;
    if (!slotStart || !slotEnd) return alert("Selecciona inicio/fin slot válido");

    setLoading(true);
    try {
      await adminFinalCreateSlot(activeWindow.id, {
        startsAt: slotStart.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: slotEnd.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await reloadSlots();
      alert("Slot creado ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo crear slot");
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
  setSelectedJuryIds(prev =>
    prev.includes(id)
      ? prev.filter(j => j !== id) // Quitar si ya existe
      : [...prev, id]              // ✅ Agregar sin restricción de cantidad
  );
};

  const handleCreateBooking = async () => {
  if (!activeWindow) return;
  if (!selectedSlotId) return alert("Selecciona un slot");
  if (selectedStudentIds.length < 1) return alert("Selecciona 1 o 2 estudiantes")
  if (selectedJuryIds.length < 1)
    return alert("Selecciona al menos un jurado");

  const selected = students.filter(s =>
    selectedStudentIds.includes(s.id)
  );

  const invalid = selected.find(s => !s.projectName?.trim());
  if (invalid) {
    return alert(
      `El estudiante ${invalid.fullName} (${invalid.dni}) no tiene proyecto asignado`
    );
  }

  setLoading(true);
  try {
    await adminFinalCreateBooking({
      slotId: Number(selectedSlotId),
      studentIds: selectedStudentIds,
      juryUserIds: selectedJuryIds, // ✅ cualquier cantidad
    });

    await reloadSlots();
    setSelectedSlotId("");
    setSelectedStudentIds([]);
    setSelectedJuryIds([]);

    alert("Booking creado ✅");
  } catch (e: any) {
    alert(e?.response?.data?.message ?? "No se pudo crear booking");
  } finally {
    setLoading(false);
  }
};

  // ESTILOS PREMIUM
  const cleanPopperStyle = {
    "& .MuiPaper-root": {
      bgcolor: "#fff",
      color: "#333",
      borderRadius: "20px",
      boxShadow: "0 15px 45px rgba(0,0,0,0.15)",
      border: "1px solid #eee",
      "& .MuiTypography-root, & .MuiButtonBase-root": { color: "#444", fontWeight: 700 },
      "& .MuiPickersDay-root": {
        "&.Mui-selected": { bgcolor: VERDE_INSTITUCIONAL, color: "#fff", "&:hover": { bgcolor: VERDE_INSTITUCIONAL } },
        "&.MuiPickersDay-today": { borderColor: VERDE_INSTITUCIONAL },
      },
      "& .MuiClock-pin": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-root": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-thumb": { bgcolor: VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL },
      "& .MuiClockNumber-root": { fontWeight: 800 },
      "& .MuiDialogActions-root .MuiButton-root": { color: VERDE_INSTITUCIONAL, fontWeight: 900 }
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
      
      {/* HEADER DELGADO */}
      <AppBar position="static" sx={{ bgcolor: VERDE_INSTITUCIONAL, elevation: 2, zIndex: 1100 }}>
        <Toolbar sx={{ justifyContent: "space-between", px: { md: 5 }, minHeight: "56px !important", py: 0.8 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#fff", lineHeight: 1 }}>
              Defensas Finales
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: "0.65rem" }}>
              GESTIÓN ADMINISTRATIVA
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            size="small"
            startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: '12px !important' }} />}
            onClick={() => nav("/admin")} 
            sx={{ 
              bgcolor: "#fff", 
              color: VERDE_INSTITUCIONAL, 
              fontWeight: 900, 
              borderRadius: "50px", 
              px: 2, 
              fontSize: "0.75rem", 
              textTransform: 'none', 
              "&:hover": { bgcolor: "#f1f2f6" } 
            }}
          >
            Volver
          </Button>
        </Toolbar>
      </AppBar>

      <Fade in={true} timeout={800}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 4, alignItems: 'start' }}>
            
            {/* COLUMNA IZQUIERDA: CREAR VENTANA */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333", display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthRoundedIcon fontSize="small" sx={{ color: VERDE_INSTITUCIONAL }} /> 
                Programar Periodo
              </Typography>
              
              <Paper elevation={0} sx={{ p: 4, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
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
                    
                    <FormControl sx={{ maxWidth: 400 }}>
                      <Select
                        size="small" 
                        displayEmpty 
                        value={careerId}
                        onChange={(e) => setCareerId(e.target.value as any)}
                        sx={ovalSelectStyle}
                        renderValue={(selected: any) => {
                          if (selected === "ALL") return "TODAS LAS CARRERAS";
                          return careers.find(c => c.id === selected)?.name.toUpperCase() || "SELECCIONA CARRERA";
                        }}
                        MenuProps={{
                          PaperProps: { 
                            sx: { 
                              borderRadius: "16px", 
                              mt: 1, 
                              maxHeight: 220, 
                              "&::-webkit-scrollbar": { width: "5px" },
                              "&::-webkit-scrollbar-thumb": { background: VERDE_INSTITUCIONAL, borderRadius: "10px" }
                            } 
                          },
                        }}
                      >
                        <MenuItem value="ALL" sx={{ mb: 0.5, borderRadius: "10px", px: 2 }}>
                          <ListItemText 
                            primary="TODAS LAS CARRERAS" 
                            primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem" }} 
                          />
                        </MenuItem>
                        {careers.map((c) => (
                          <MenuItem key={c.id} value={c.id} sx={{ mb: 0.5, borderRadius: "10px", px: 2 }}>
                            <ListItemText 
                              primary={c.name} 
                              primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase" }} 
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        onClick={handleCreateWindow} 
                        disabled={loading} 
                        variant="contained"
                        sx={{ 
                          py: 1.5, 
                          px: 6, 
                          bgcolor: VERDE_INSTITUCIONAL, 
                          fontWeight: 900, 
                          borderRadius: "50px", 
                          boxShadow: `0 8px 20px ${VERDE_INSTITUCIONAL}33`, 
                          textTransform: 'uppercase', 
                          "&:hover": { bgcolor: VERDE_INSTITUCIONAL, transform: 'scale(1.05)' } 
                        }}
                      >
                        {loading ? "Confirmar" : "Habilitar Acceso"}
                      </Button>
                    </Box>
                  </Box>
                </LocalizationProvider>
              </Paper>
            </Box>

            {/* COLUMNA DERECHA: VENTANAS ACTIVAS */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333", display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentTurnedInRoundedIcon fontSize="small" sx={{ color: VERDE_INSTITUCIONAL }} /> 
                Periodos en Curso ({windows.length})
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {windows.map((w, index) => (
                  <Fade in={true} timeout={300 + index * 100} key={w.id}>
                    <Paper sx={{ 
                      p: 2.5, 
                      borderRadius: "22px", 
                      display: "flex", 
                      flexDirection: 'column', 
                      gap: 1.5, 
                      borderLeft: `7px solid ${w.isActive ? VERDE_INSTITUCIONAL : "#bdc3c7"}`, 
                      boxShadow: "0 5px 15px rgba(0,0,0,0.03)" 
                    }}>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: "#2c3e50", textTransform: 'uppercase' }}>
                            {w.careerName || "Todas las Carreras"}
                          </Typography>
                          
                          {w.hasRubric ? (
                            <Chip 
                              label="Rúbrica ✅" 
                              size="small"
                              sx={{ 
                                bgcolor: "rgba(46,125,50,0.12)", 
                                color: "#2e7d32", 
                                fontWeight: 900, 
                                fontSize: "0.65rem",
                                height: "20px"
                              }} 
                            />
                          ) : (
                            <Chip 
                              label="Sin rúbrica" 
                              size="small"
                              sx={{ 
                                bgcolor: "rgba(198,40,40,0.10)", 
                                color: "#c62828", 
                                fontWeight: 900, 
                                fontSize: "0.65rem",
                                height: "20px"
                              }} 
                            />
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
                        <Chip 
                          size="small" 
                          label={w.isActive ? "ACTIVO" : "CERRADO"} 
                          sx={{ 
                            bgcolor: w.isActive ? `${VERDE_INSTITUCIONAL}15` : "#f5f5f5", 
                            color: w.isActive ? VERDE_INSTITUCIONAL : "#b2bec3", 
                            fontWeight: 900, 
                            fontSize: "0.65rem" 
                          }} 
                        />
                        
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button 
                            onClick={() => openWindowManage(w)} 
                            variant="outlined" 
                            size="small" 
                            sx={{ 
                              borderColor: VERDE_INSTITUCIONAL, 
                              color: VERDE_INSTITUCIONAL, 
                              borderRadius: "50px", 
                              fontWeight: 900, 
                              fontSize: '0.7rem', 
                              py: 0.3,
                              px: 1.5
                            }}
                          >
                            Gestionar
                          </Button>

                          {w.isActive && (
                            <Button 
                              onClick={() => handleCloseWindow(w.id)} 
                              variant="contained" 
                              size="small" 
                              sx={{ 
                                bgcolor: "#ff7675", 
                                borderRadius: "50px", 
                                fontWeight: 900, 
                                fontSize: '0.7rem', 
                                py: 0.3,
                                px: 1.5
                              }}
                            >
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

      {/* MODAL GESTIONAR VENTANA */}
      <Dialog 
        open={openManage} 
        onClose={() => setOpenManage(false)} 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: "25px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            width: '90%',
            maxWidth: 800
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 900, 
          color: VERDE_INSTITUCIONAL, 
          borderBottom: "1px solid #f1f2f6",
          py: 1.5,
          px: 3
        }}>
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

                  <Chip
                    label={activeWindow?.hasRubric ? "Rúbrica ✅" : "Sin rúbrica"}
                    color={activeWindow?.hasRubric ? "success" : "default"}
                    variant={activeWindow?.hasRubric ? "filled" : "outlined"}
                    sx={{ fontWeight: 900 }}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    startIcon={<UploadFileRoundedIcon />}
                    sx={{ 
                      borderColor: VERDE_INSTITUCIONAL, 
                      color: VERDE_INSTITUCIONAL, 
                      fontWeight: 900,
                      borderRadius: "50px",
                      "&:hover": { borderColor: VERDE_INSTITUCIONAL, bgcolor: `${VERDE_INSTITUCIONAL}08` }
                    }}
                  >
                    Seleccionar PDF
                    <input
                      type="file"
                      hidden
                      accept="application/pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setRubricFile(f);
                      }}
                    />
                  </Button>

                  <Typography sx={{ color: "#666", fontSize: "0.9rem", flex: 1 }}>
                    {rubricFile ? `📄 ${rubricFile.name}` : "Ningún archivo seleccionado"}
                  </Typography>

                  <Button
                    onClick={handleUploadRubric}
                    disabled={loading || !rubricFile}
                    variant="contained"
                    sx={{ 
                      bgcolor: VERDE_INSTITUCIONAL, 
                      fontWeight: 900,
                      borderRadius: "50px",
                      px: 3
                    }}
                  >
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

                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <DateTimePicker
                      label="Inicio del Slot"
                      value={slotStart}
                      onChange={(v) => setSlotStart(v)}
                      ampm={false}
                      viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                      slotProps={{ 
                        textField: { size: "small", sx: { width: 250, ...premiumInputStyle } },
                        popper: { sx: { ...cleanPopperStyle, zIndex: 1400 } }
                      }}
                    />
                    <DateTimePicker
                      label="Fin del Slot"
                      value={slotEnd}
                      onChange={(v) => setSlotEnd(v)}
                      ampm={false}
                      viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                      slotProps={{ 
                        textField: { size: "small", sx: { width: 250, ...premiumInputStyle } },
                        popper: { sx: { ...cleanPopperStyle, zIndex: 1400 } }
                      }}
                    />
                  </Box>
                </LocalizationProvider>

                <Button
                  onClick={handleCreateSlot}
                  disabled={loading}
                  variant="contained"
                  sx={{ 
                    bgcolor: VERDE_INSTITUCIONAL, 
                    fontWeight: 900,
                    borderRadius: "50px",
                    px: 6,
                    maxWidth: 400,
                    mx: 'auto',
                    display: 'block'
                  }}
                >
                  Crear Slot
                </Button>
              </Paper>

              {/* CREAR BOOKING */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #e1e8ed", bgcolor: "#fafbfc" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GroupsRoundedIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                  <Typography sx={{ fontWeight: 900 }}>
                    Crear Reserva (Slot + Estudiantes + Jurados)
                  </Typography>
                </Box>

                {/* SLOT */}
                <Typography sx={{ fontWeight: 800, mt: 2, mb: 1, fontSize: "0.9rem" }}>
                  📅 Seleccionar Slot
                </Typography>
                <FormControl sx={{ maxWidth: 400 }}>
                  <Select
                    size="small"
                    displayEmpty
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value ? Number(e.target.value) : "")}
                    sx={ovalSelectStyle}
                    renderValue={(selected: any) => {
                      if (!selected) return <span style={{ color: "#95a5a6" }}>SELECCIONA UN SLOT</span>;
                      const slot = slots.find(s => s.id === selected);
                      return slot ? `${slot.startsAt} → ${slot.endsAt}` : "Slot seleccionado";
                    }}
                  >
                    <MenuItem value="" disabled>SELECCIONA UN SLOT</MenuItem>
                    {slots.map((s) => (
                      <MenuItem key={s.id} value={s.id} disabled={s.booked}>
                        <ListItemText 
                          primary={`${s.startsAt} → ${s.endsAt} ${s.booked ? " (RESERVADO)" : ""}`}
                          primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem" }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* ESTUDIANTES */}
                <Typography sx={{ fontWeight: 800, mt: 3, mb: 1, fontSize: "0.9rem" }}>
                  👨‍🎓 Estudiantes (máximo 2)
                </Typography>

                {!activeWindow.careerId && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: "0.85rem", color: "#666", mb: 1 }}>
                      Selecciona carrera para ver estudiantes:
                    </Typography>
                    <FormControl sx={{ maxWidth: 400 }}>
                      <Select
                        size="small"
                        displayEmpty
                        value={manageCareerId}
                        onChange={async (e) => {
                          const cid = e.target.value ? Number(e.target.value) : "";
                          setManageCareerId(cid);
                          setSelectedStudentIds([]);

                          if (!cid) {
                            setStudents([]);
                            return;
                          }
                          
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
                            <ListItemText 
                              primary={c.name} 
                              primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase" }}
                            />
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
                        <Box
                          key={st.id}
                          onClick={() => {
                            if (!hasProject) return;
                            toggleStudent(st.id);
                          }}
                          sx={{
                            p: 2,
                            borderRadius: "16px",
                            border: `2px solid ${checked ? VERDE_INSTITUCIONAL : "#eee"}`,
                            cursor: hasProject ? "pointer" : "not-allowed",
                            background: checked ? `${VERDE_INSTITUCIONAL}08` : "#fff",
                            opacity: hasProject ? 1 : 0.5,
                            transition: "all 0.2s",
                            "&:hover": hasProject ? { transform: "scale(1.02)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" } : {}
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonRoundedIcon sx={{ color: checked ? VERDE_INSTITUCIONAL : "#999", fontSize: 20 }} />
                              <Typography sx={{ fontWeight: 900, fontSize: "0.9rem" }}>
                                {st.fullName} ({st.dni})
                              </Typography>
                            </Box>
                            {checked && (
                              <Box sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: "50%", 
                                bgcolor: VERDE_INSTITUCIONAL, 
                                color: "#fff",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: "0.9rem"
                              }}>
                                ✓
                              </Box>
                            )}
                          </Box>
                          
                          {hasProject ? (
                            <Typography sx={{ color: "#555", fontSize: "0.85rem", mt: 0.5, ml: 3.5 }}>
                              📋 Proyecto: <b>{st.projectName}</b>
                            </Typography>
                          ) : (
                            <Typography sx={{ color: "#c62828", fontSize: "0.85rem", mt: 0.5, fontWeight: 800, ml: 3.5 }}>
                              ⚠️ SIN PROYECTO ASIGNADO
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                    
                    {!students.length && (
                      <Typography sx={{ color: "#777", fontStyle: "italic", p: 2, textAlign: 'center' }}>
                        No se encontraron estudiantes en esta carrera/período.
                      </Typography>
                    )}

                    {selectedStudentIds.length === 2 && (
                      <Typography sx={{ color: VERDE_INSTITUCIONAL, fontSize: "0.85rem", fontWeight: 900, textAlign: 'center' }}>
                        ✓ Seleccionaste 2 estudiantes (máximo)
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography sx={{ color: "#777", fontStyle: "italic", mt: 1, p: 2, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 2 }}>
                    Esperando selección de carrera...
                  </Typography>
                )}

                {/* JURADOS - COMPONENTE SIMPLIFICADO */}
                <JuriesSelector
                  juries={juries}
                  selectedJuryIds={selectedJuryIds}
                  toggleJury={toggleJury}
                />

                <Button
                  onClick={handleCreateBooking}
                  disabled={
                    loading ||
                    (!activeWindow.careerId && !manageCareerId) ||
                    !selectedSlotId ||
                    selectedStudentIds.length < 1 ||
                    selectedStudentIds.length > 2 ||
                    selectedJuryIds.length < 1
                  }
                  variant="contained"
                  sx={{ 
                    mt: 3, 
                    bgcolor: VERDE_INSTITUCIONAL, 
                    fontWeight: 900,
                    borderRadius: "50px",
                    py: 1.5,
                    px: 6,
                    maxWidth: 400,
                    mx: 'auto',
                    display: 'block',
                    boxShadow: `0 8px 20px ${VERDE_INSTITUCIONAL}33`
                  }}
                >
                  Crear Reserva
                </Button>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f2f6' }}>
          <Button 
            onClick={() => setOpenManage(false)} 
            sx={{ 
              fontWeight: 900,
              borderRadius: "50px",
              px: 3,
              color: VERDE_INSTITUCIONAL
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* FOOTER DELGADO */}
      <Box sx={{ width: "100%", bgcolor: VERDE_INSTITUCIONAL, color: "#fff", py: 0.5, mt: "auto", textAlign: "center" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, fontSize: "0.65rem" }}>
          © {new Date().getFullYear()} - Panel de Defensas Finales
        </Typography>
      </Box>
    </Box>
  );
}