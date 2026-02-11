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
} from "@mui/material";
import {
  School as SchoolIcon,
  CalendarMonth as CalendarMonthIcon,
  BookOnline as BookOnlineIcon,
  Send as SendIcon,
} from "@mui/icons-material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

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

export default function JuryPredefensePage() {
  const nav = useNavigate();
  const location = useLocation();

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [careerId, setCareerId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [windowId, setWindowId] = useState<number | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  // 💡 CAMBIO: Usar un mapa para las observaciones por bookingId
  const [obsTextMap, setObsTextMap] = useState<{ [bookingId: number]: string }>({});
  
  const [loading, setLoading] = useState(false);

  const [slotStartsAt, setSlotStartsAt] = useState<Dayjs | null>(
    dayjs().add(1, "hour").startOf("hour")
  );
  const [slotEndsAt, setSlotEndsAt] = useState<Dayjs | null>(
    dayjs().add(1, "hour").add(30, "minute").startOf("hour")
  );

  const isCoordinator = useMemo(
    () => location.pathname.includes("coordinator"),
    [location.pathname]
  );

  const juryInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          username: user.username || "",
          name:
            user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario",
          email: user.email || "",
          role: user.role || "Jurado",
        };
      } catch {
        return { username: "", name: "Usuario", email: "", role: "Jurado" };
      }
    }
    return { username: "", name: "Usuario", email: "", role: "Jurado" };
  }, []);

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("periodId");
    return ls ? Number(ls) : undefined;
  }, []);

  useEffect(() => {
    (async () => {
      const cs = await listCareers();
      setCareers(Array.isArray(cs) ? cs : []);
    })();
    const photoKey = isCoordinator ? "coordinatorPhoto" : "juryPhoto";
    const savedPhoto = localStorage.getItem(photoKey);
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, [isCoordinator]);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    localStorage.clear();
    nav("/");
  };

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
    if (!windowId || !slotStartsAt || !slotEndsAt) return alert("Datos incompletos");
    setLoading(true);
    try {
      await juryCreateSlot(
        windowId,
        slotStartsAt.format("YYYY-MM-DDTHH:mm:ss"),
        slotEndsAt.format("YYYY-MM-DDTHH:mm:ss")
      );
      const sl = await juryListSlots(windowId);
      setSlots(sl);
      alert("Slot creado correctamente ✅");
    } catch {
      alert("Error al crear slot");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (slotId: number) => {
    if (!selectedStudentId) return alert("Selecciona un estudiante");
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
      alert("Reservado ✅");
    } catch {
      alert("Error al reservar");
    } finally {
      setLoading(false);
    }
  };

  // 💡 CAMBIO: Lógica de envío actualizada para manejar el mapa
  const handleSendObservation = async (bookingId: number) => {
    const text = obsTextMap[bookingId]?.trim();
    if (!text) return alert("Escribe una observación");
    
    setLoading(true);
    try {
      await juryCreateObservation(bookingId, { text });
      // Limpiar solo el texto de este bookingId específico
      setObsTextMap((prev) => ({ ...prev, [bookingId]: "" }));
      alert("Observación enviada ✅");
    } catch {
      alert("Error al enviar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {isCoordinator ? (
          <CoordinatorSidebar
            coordinatorName={juryInfo.name}
            coordinatorInitials={juryInfo.name.charAt(0)}
            coordinatorEmail={juryInfo.email}
            coordinatorUsername={juryInfo.username}
            coordinatorRole={juryInfo.role}
            photoPreview={photoPreview}
            onLogout={handleLogout}
          />
        ) : (
          <TutorSidebar onLogout={handleLogout} verde={VERDE_INSTITUCIONAL} periodId={periodId} />
        )}

        <Box
          component="main"
          sx={{ flexGrow: 1, background: "#f5f7f9", display: "flex", flexDirection: "column" }}
        >
          <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 2, px: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {isCoordinator
                ? "Gestión de Predefensas (Coordinador)"
                : "Mis Estudiantes (Tutor)"}
            </Typography>
          </Box>

          <Container maxWidth="lg" sx={{ py: 3 }}>
            <Stack spacing={3}>
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <SchoolIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                    Seleccionar Carrera
                  </Typography>
                </Box>
                <FormControl fullWidth>
                  <Select
                    value={careerId ?? ""}
                    onChange={(e) => {
                      setCareerId(Number(e.target.value));
                      loadCareer(Number(e.target.value));
                    }}
                    displayEmpty
                    sx={{ borderRadius: "50px" }}
                  >
                    <MenuItem value="" disabled>
                      Seleccione Carrera
                    </MenuItem>
                    {careers.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>

              {careerId && (
                <Fade in={true}>
                  <Stack spacing={3}>
                    <Paper
                      elevation={0}
                      sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <CalendarMonthIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                          Ventana Activa
                        </Typography>
                      </Box>
                      <Select
                        fullWidth
                        value={windowId ?? ""}
                        onChange={(e) => handleSelectWindow(Number(e.target.value))}
                        sx={{ borderRadius: "50px" }}
                      >
                        {windows.map((w) => (
                          <MenuItem key={w.id} value={w.id}>
                            {dayjs(w.startsAt).format("DD/MM/YY HH:mm")} -{" "}
                            {w.isActive ? "ACTIVA" : "CERRADA"}
                          </MenuItem>
                        ))}
                      </Select>
                      <Divider sx={{ my: 3 }} />
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                        <DateTimePicker label="Inicio" value={slotStartsAt} onChange={setSlotStartsAt} />
                        <DateTimePicker label="Fin" value={slotEndsAt} onChange={setSlotEndsAt} />
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCreateSlot}
                        sx={{ bgcolor: VERDE_INSTITUCIONAL, borderRadius: "50px" }}
                      >
                        Crear Slot
                      </Button>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed" }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
                        Estudiante para Reservar
                      </Typography>
                      <Select
                        fullWidth
                        value={selectedStudentId ?? ""}
                        onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                        sx={{ borderRadius: "50px" }}
                      >
                        <MenuItem value="" disabled>
                          Seleccione Estudiante
                        </MenuItem>
                        {students.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.fullName}
                          </MenuItem>
                        ))}
                      </Select>
                    </Paper>

                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 900 }}>
                        Horarios y Observaciones
                      </Typography>
                      {slots.map((sl) => (
                        <Paper
                          key={sl.id}
                          sx={{
                            p: 3,
                            mb: 2,
                            borderRadius: "20px",
                            border: `2px solid ${sl.booked ? "#ff7675" : VERDE_INSTITUCIONAL}`,
                            bgcolor: sl.booked ? "#fff5f5" : "#f0fff4",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography fontWeight={900}>
                              {dayjs(sl.startsAt).format("HH:mm")} - {dayjs(sl.endsAt).format("HH:mm")}
                            </Typography>
                            <Chip
                              label={sl.booked ? "RESERVADO" : "LIBRE"}
                              color={sl.booked ? "error" : "success"}
                            />
                          </Box>

                          {sl.booked ? (
                            <Box sx={{ mt: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 800, mb: 1, color: "#c62828" }}
                              >
                                Reservado por:{" "}
                                {sl.studentName ||
                                  students.find((s) => Number(s.id) === Number(sl.studentId))
                                    ?.fullName ||
                                  "Estudiante asignado"}{" "}
                                (ID Reserva: {sl.bookingId})
                              </Typography>

                              {/* 💡 CAMBIO: TextField vinculado al obsTextMap */}
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Nueva Observación / Correcciones"
                                value={obsTextMap[sl.bookingId!] || ""}
                                onChange={(e) =>
                                  setObsTextMap((prev) => ({
                                    ...prev,
                                    [sl.bookingId!]: e.target.value,
                                  }))
                                }
                                sx={{
                                  bgcolor: "#fff",
                                  mt: 1,
                                  "& .MuiOutlinedInput-root": { borderRadius: "14px" },
                                }}
                              />

                              <Button
                                fullWidth
                                variant="contained"
                                startIcon={<SendIcon />}
                                onClick={() => handleSendObservation(sl.bookingId)}
                                sx={{ mt: 2, bgcolor: "#0b7f7a", borderRadius: "50px", py: 1.2 }}
                              >
                                Enviar Observación
                              </Button>
                            </Box>
                          ) : (
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<BookOnlineIcon />}
                              onClick={() => handleReserve(sl.id)}
                              sx={{ mt: 2, borderRadius: "50px", py: 1.2 }}
                            >
                              Asignar Estudiante Seleccionado
                            </Button>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </Stack>
                </Fade>
              )}
            </Stack>
          </Container>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}