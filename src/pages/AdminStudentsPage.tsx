import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  Collapse,
  Grow,
  Chip,
} from "@mui/material";

import { Logout as LogoutIcon, CheckCircle as CheckCircleIcon, RadioButtonUnchecked as RadioButtonUncheckedIcon } from "@mui/icons-material";

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

import { importStudentsXlsx, listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";
import { createCareer } from "../services/careerService";
import { api } from "../api/api";
import {
  createAcademicPeriod,
  listAcademicPeriods,
  type AcademicPeriodDto,
  activateAcademicPeriod,
} from "../services/periodService";
import { listCareerCards, type CareerCardDto } from "../services/adminCareerCardsService";

import AssignCareerModal from "../components/AssignCareerModal";
import CreateUserModal from "../components/CreateUserModal";
import AdminHeaderBar from "../components/AdminHeaderBar";
import AdminSidebar, { drawerWidth } from "../components/AdminSidebar";
import CareersSection from "../components/CareersSection";
import GeneralListSection from "../components/GeneralListSection";

import { useActivePeriod } from "../hooks/useActivePeriod";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const VERDE_INSTITUCIONAL = "#008B8B";

export type CareerItem = {
  key: string;
  label: string;
  cover?: string;
  imageUrl?: string;
  color: string;
  imgPos?: string;
  isFixed?: boolean;
};

export default function AdminStudentsPage() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [importing, setImporting] = useState(false);
  const [creatingPeriod, setCreatingPeriod] = useState(false);

  // ─── Dialog cerrar sesión ──────────────────────────────────────────────────
  const [logoutOpen, setLogoutOpen] = useState(false);
  const confirmLogout = () => { logout(); nav("/"); };

  const prevTotalsRef = useRef({ incidents: 0, observations: 0 });
  const audioAlarmRef = useRef<HTMLAudioElement | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const firstLoadRef = useRef(true);

  const activePeriod = useActivePeriod();
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | "ALL">("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modales
  const [openAssignCareer, setOpenAssignCareer] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openAddCareer, setOpenAddCareer] = useState(false);
  const [openAdminProfile, setOpenAdminProfile] = useState(false);
  const [openPeriodModal, setOpenPeriodModal] = useState(false);
  const [openStatsModal, setOpenStatsModal] = useState(false);

  const [periodStart, setPeriodStart] = useState<Dayjs | null>(dayjs());
  const [periodEnd, setPeriodEnd] = useState<Dayjs | null>(dayjs().add(5, "month"));
  const [periodIsActive, setPeriodIsActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [adminProfile, setAdminProfile] = useState<any | null>(null);

  const [newCareerName, setNewCareerName] = useState("");
  const [newCareerColor, setNewCareerColor] = useState("#546e7a");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // NUEVO: para animar el período recién activado
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ open: boolean; msg: string; type: "success" | "error" | "warning" }>({
    open: false, msg: "", type: "success",
  });
  const showToast = (msg: string, type: "success" | "error" | "warning" = "success") =>
    setToast({ open: true, msg, type });

  const { data: rows = [], isLoading: loadingStudents } = useQuery<AdminStudentRow[]>({
    queryKey: ["students", selectedPeriodId],
    queryFn: () => (selectedPeriodId === "ALL" ? listStudents() : listStudents(selectedPeriodId as number)),
    enabled: !activePeriod.loading,
    staleTime: 0,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const { data: careerCards = [] } = useQuery<CareerCardDto[]>({
    queryKey: ["careerCards", selectedPeriodId],
    queryFn: () => {
      const pid = selectedPeriodId === "ALL" ? (activePeriod.periodId ?? undefined) : selectedPeriodId as number;
      return listCareerCards(pid);
    },
    enabled: !activePeriod.loading,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });

  const { data: periods = [] } = useQuery<AcademicPeriodDto[]>({
    queryKey: ["periods"],
    queryFn: () => listAcademicPeriods(),
  });

  // NUEVO: períodos ordenados por id ascendente (orden de creación)
  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.id - b.id), [periods]);

  useEffect(() => {
    if (!rows || rows.length === 0) return;

    const currentTotals = rows.reduce(
      (acc, s) => ({
        incidents: acc.incidents + (s.incidentCount || 0),
        observations: acc.observations + (s.observationCount || 0),
      }),
      { incidents: 0, observations: 0 }
    );

    if (firstLoadRef.current) {
      prevTotalsRef.current = currentTotals;
      firstLoadRef.current = false;
      return;
    }

    let soundPath = "";

    if (currentTotals.incidents > prevTotalsRef.current.incidents) {
      soundPath = "/sounds/incidencias.mp3";
    }
    else if (currentTotals.observations > prevTotalsRef.current.observations) {
      soundPath = "/sounds/burbujas.mp3";
    }

    if (soundPath) {
      if (audioAlarmRef.current) {
        audioAlarmRef.current.pause();
        audioAlarmRef.current.currentTime = 0;
        audioAlarmRef.current = null;
      }

      const audio = new Audio(soundPath);
      audio.loop = false;

      audio
        .play()
        .catch(() => {
          console.warn("Interacción requerida por el navegador para sonar");
        });

      audioAlarmRef.current = audio;

      setTimeout(() => {
        if (audioAlarmRef.current === audio) {
          audio.pause();
          audio.currentTime = 0;
          audioAlarmRef.current = null;
        }
      }, 2100);
    }

    prevTotalsRef.current = currentTotals;
  }, [rows]);

  const handleStopAlarm = () => {
    if (audioAlarmRef.current) {
      audioAlarmRef.current.pause();
      audioAlarmRef.current.currentTime = 0;
      audioAlarmRef.current = null;
    }
  };

  const handleHardRefresh = () => { queryClient.invalidateQueries(); window.location.reload(); };
  const loadPeriods = async () => queryClient.invalidateQueries({ queryKey: ["periods"] });
  const loadCareerCards = async () => queryClient.invalidateQueries({ queryKey: ["careerCards"] });
  const loadStudents = async () => queryClient.invalidateQueries({ queryKey: ["students"] });

  const reloadStudentsAndCards = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["students"] }),
      queryClient.invalidateQueries({ queryKey: ["careerCards"] }),
    ]);
  };

  useEffect(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (ls && ls !== "ALL" && Number.isFinite(Number(ls))) {
      setSelectedPeriodId(Number(ls));
    } else if (activePeriod?.periodId && (!ls || ls === "ALL")) {
      setSelectedPeriodId(activePeriod.periodId);
      localStorage.setItem("adminPeriodId", String(activePeriod.periodId));
    }
    (async () => {
      try { const res = await api.get("/me"); setAdminProfile(res.data); }
      catch { setAdminProfile(null); }
    })();
  }, [activePeriod.periodId, activePeriod.loading]);

  const handleSelectPeriod = async (val: number | "ALL") => {
    if (val === "ALL") localStorage.setItem("adminPeriodId", "ALL");
    else localStorage.setItem("adminPeriodId", String(val));
    setSelectedPeriodId(val);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["students", val] });
      queryClient.invalidateQueries({ queryKey: ["careerCards", val] });
    }, 0);
  };

  const handleFileUpload = async (file: File) => {
    setImporting(true);
    try {
      const pid = selectedPeriodId !== "ALL" ? selectedPeriodId as number : activePeriod.periodId ?? null;
      if (!pid) { setOpenPeriodModal(true); return; }
      await importStudentsXlsx(file, pid);
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({ queryKey: ["careerCards"] }),
      ]);

      showToast("Importación completada ✅");
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "Error al importar", "error");
    } finally {
      setImporting(false);
    }
  };

  const availableCareersFromBackend: CareerItem[] = useMemo(() => {
    return careerCards.map((c) => ({
      key: String(c.id),
      label: c.name.toUpperCase(),
      color: c.color ?? "#546e7a",
      imageUrl: c.coverImage ? `${api.defaults.baseURL}/admin/careers/cover/${c.coverImage}` : undefined,
      isFixed: true,
    }));
  }, [careerCards]);

  const groupedStudents = useMemo(() => {
    const groups: Record<number, AdminStudentRow[]> = {};
    const q = searchTerm.toLowerCase().trim();
    rows.forEach((s: any) => {
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const dni = String(s.dni ?? s.cedula ?? "");
      if (!q || name.includes(q) || dni.includes(q)) {
        const cid = Number(s.careerId);
        if (Number.isFinite(cid)) {
          if (!groups[cid]) groups[cid] = [];
          groups[cid].push(s);
        }
      }
    });
    return groups;
  }, [rows, searchTerm]);

  const careerStats = useMemo(() => {
    return careerCards.map((c) => {
      const students = groupedStudents[c.id] || [];
      const reprobados = students.filter((s: any) => {
        const st = (s.status || s.estado || "").toUpperCase();
        return st === "REPROBADO" || st === "RETIRADO";
      }).length;
      return { key: String(c.id), label: c.name, total: students.length, reprobados, color: c.color ?? "#546e7a" };
    });
  }, [careerCards, groupedStudents]);

  const handleAddCareer = async () => {
    if (!newCareerName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("name", newCareerName.trim());
      formData.append("color", newCareerColor);
      if (selectedFile) formData.append("image", selectedFile);
      await createCareer(formData);
      queryClient.invalidateQueries({ queryKey: ["careerCards"] });
      setOpenAddCareer(false);
      setNewCareerName("");
      setSelectedFile(null);
    } catch (e) { console.error(e); }
  };

  const handleCreatePeriod = async () => {
    if (!periodStart || !periodEnd) {
      showToast("Selecciona fecha de inicio y fin", "warning");
      return;
    }
    setCreatingPeriod(true);
    try {
      const created = await createAcademicPeriod({
        startDate: periodStart.format("YYYY-MM-DD"),
        endDate: periodEnd.format("YYYY-MM-DD"),
        isActive: periodIsActive,
      });
      setOpenPeriodModal(false);
      await queryClient.invalidateQueries({ queryKey: ["periods"] });
      if (created.isActive) {
        handleSelectPeriod(created.id);
        await queryClient.invalidateQueries({ queryKey: ["students"] });
        await queryClient.invalidateQueries({ queryKey: ["careerCards"] });
      }
      showToast(`Período "${created.name}" creado ✅`);
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "Error al crear período", "error");
    } finally {
      setCreatingPeriod(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f7f6", overflowX: "hidden", width: "100%" }}>

        <input
          type="file"
          hidden
          ref={uploadRef}
          accept=".xlsx"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
        />

        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => setLogoutOpen(true)}
          verde={VERDE_INSTITUCIONAL}
          careerCards={careerCards}
          selectedPeriodId={selectedPeriodId}
          onOpenAddCareer={() => setOpenAddCareer(true)}
          onOpenProfile={() => setOpenAdminProfile(true)}
          onOpenPeriodModal={() => setOpenPeriodModal(true)}
          onUploadFile={() => uploadRef.current?.click()}
          onOpenStats={() => setOpenStatsModal(true)}
        />

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

          <AdminHeaderBar
            verde={VERDE_INSTITUCIONAL}
            importing={loadingStudents || importing}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenAssignCareer={() => setOpenAssignCareer(true)}
            onOpenCreateUser={() => setOpenCreateUser(true)}
            onRefresh={handleHardRefresh}
            onLogout={() => setLogoutOpen(true)}
            userMenuAnchor={userMenuAnchor}
            openUserMenu={Boolean(userMenuAnchor)}
            onOpenMenu={(e) => setUserMenuAnchor(e.currentTarget)}
            onCloseMenu={() => setUserMenuAnchor(null)}
            onOpenProfile={() => setOpenAdminProfile(true)}
            onUploadFile={handleFileUpload}
            onOpenPeriodModal={() => setOpenPeriodModal(true)}
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            activePeriod={activePeriod}
            onChangePeriod={handleSelectPeriod}
            onReloadPeriods={loadPeriods}
            careerStats={careerStats}
            openStatsModal={openStatsModal}
            onCloseStatsModal={() => setOpenStatsModal(false)}
          />

          <Container
            maxWidth={false}
            sx={{
              py: { xs: 2, sm: 3, md: 4 },
              px: { xs: 1, sm: 2, md: 3 },
              display: "flex", flexDirection: "column", alignItems: "center",
              flex: 1, width: "100%", overflowX: "hidden", overflowY: "auto",
            }}
          >
            <CareersSection
              verde={VERDE_INSTITUCIONAL}
              cards={careerCards}
              onCareerClick={(careerId) => {
                handleStopAlarm();
                const pid = selectedPeriodId === "ALL" ? (activePeriod.periodId ?? "") : selectedPeriodId;
                const card = careerCards.find((c) => c.id === careerId);
                const base = `/admin/students/by-career?careerId=${careerId}&careerName=${encodeURIComponent(card?.name ?? "Carrera")}`;
                nav(pid ? `${base}&periodId=${pid}` : base);
              }}
              onOpenAddCareer={() => setOpenAddCareer(true)}
              onGoPredefense={() => nav("/admin/predefense")}
              onGoFinalDefense={() => nav("/admin/final-defense")}
              onReloadCards={loadCareerCards}
            />

            <GeneralListSection
              verde={VERDE_INSTITUCIONAL}
              careerCards={careerCards}
              groupedStudents={groupedStudents}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              getStudentName={(s) => `${(s as any).firstName || ""} ${(s as any).lastName || ""}`}
              getSemaforo={(s) => {
                const inc = (s as any).incidentCount ?? 0;
                if (inc >= 3) return { bg: "#FF3131", border: "#8B0000", chipBg: "#8B0000", chipText: "#fff", label: "REPROBADO" };
                if (inc === 2) return { bg: "#FF8C00", border: "#CC7000", chipBg: "#CC7000", chipText: "#fff", label: "RIESGO ALTO" };
                if (inc === 1) return { bg: "#FFD700", border: "#B8860B", chipBg: "#B8860B", chipText: "#fff", label: "ALERTA" };
                return { bg: "#e8f5e9", border: "#2e7d32", chipBg: "#2e7d32", chipText: "#fff", label: "SIN NOVEDAD" };
              }}
              onViewProfile={(id) => {
                handleStopAlarm();
                nav(`/admin/students/${id}?periodId=${selectedPeriodId === "ALL" ? activePeriod.periodId : selectedPeriodId}`);
              }}
              onClearIncidents={() => {}}
              onMarkIncidentsSeen={(id: number) => {
                handleStopAlarm();
                queryClient.invalidateQueries({ queryKey: ["students"] });
              }}
            />
          </Container>

          {/* Modal Período con LISTADO Y ACTIVACIÓN */}
          <Dialog open={openPeriodModal} onClose={() => setOpenPeriodModal(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
            <DialogTitle sx={{ fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, color: "#fff" }}>Gestión de Períodos</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Nuevo Período</Typography>
                {isMobile ? (
                  <MobileDatePicker
                    label="Inicio"
                    value={periodStart}
                    onChange={(v) => setPeriodStart(v)}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true },
                      dialog: { sx: { "& .MuiDialog-paper": { borderRadius: "16px", m: 2 }, "& .MuiPickersDay-root.Mui-selected": { bgcolor: VERDE_INSTITUCIONAL }, "& .MuiDialogActions-root .MuiButton-root": { color: VERDE_INSTITUCIONAL, fontWeight: 900 } } },
                    }}
                  />
                ) : (
                  <DatePicker label="Inicio" value={periodStart} onChange={(v) => setPeriodStart(v)} format="DD/MM/YYYY" slotProps={{ textField: { fullWidth: true } }} />
                )}
                {isMobile ? (
                  <MobileDatePicker
                    label="Fin"
                    value={periodEnd}
                    onChange={(v) => setPeriodEnd(v)}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true },
                      dialog: { sx: { "& .MuiDialog-paper": { borderRadius: "16px", m: 2 }, "& .MuiPickersDay-root.Mui-selected": { bgcolor: VERDE_INSTITUCIONAL }, "& .MuiDialogActions-root .MuiButton-root": { color: VERDE_INSTITUCIONAL, fontWeight: 900 } } },
                    }}
                  />
                ) : (
                  <DatePicker label="Fin" value={periodEnd} onChange={(v) => setPeriodEnd(v)} format="DD/MM/YYYY" slotProps={{ textField: { fullWidth: true } }} />
                )}
                <FormControlLabel control={<Checkbox checked={periodIsActive} onChange={(e) => setPeriodIsActive(e.target.checked)} />} label="Periodo activo" />

                {/* LISTA DE PERÍODOS — ordenados por creación, período activo destacado */}
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      Períodos académicos registrados
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                      {sortedPeriods.length} período{sortedPeriods.length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>

                  {sortedPeriods.length === 0 && (
                    <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                      Aún no hay períodos registrados.
                    </Typography>
                  )}

                  {sortedPeriods.map((p, index) => (
                    <Grow
                      key={p.id}
                      in={openPeriodModal}
                      timeout={200 + index * 80}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 1,
                          px: 1.5,
                          mb: 0.75,
                          borderRadius: "10px",
                          // NUEVO: fondo y borde verde más visible para el activo
                          bgcolor: p.isActive ? "rgba(0,139,139,0.08)" : "rgba(0,0,0,0.02)",
                          border: p.isActive
                            ? `1.5px solid ${VERDE_INSTITUCIONAL}`
                            : "1px solid rgba(0,0,0,0.08)",
                          // NUEVO: transición suave al activarse
                          transition: "all 0.4s ease",
                          boxShadow: p.isActive ? "0 2px 8px rgba(0,139,139,0.15)" : "none",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                          {/* NUEVO: ícono de estado */}
                          {p.isActive
                            ? <CheckCircleIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 18 }} />
                            : <RadioButtonUncheckedIcon sx={{ color: "#bbb", fontSize: 18 }} />
                          }
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {/* NUEVO: nombre en verde si está activo */}
                              <Typography sx={{
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                color: p.isActive ? VERDE_INSTITUCIONAL : "text.primary",
                                transition: "color 0.3s ease",
                              }}>
                                {p.name}
                              </Typography>
                              {/* NUEVO: chip "ACTUAL" animado */}
                              <Collapse in={p.isActive} orientation="horizontal">
                                <Chip
                                  label="ACTUAL"
                                  size="small"
                                  sx={{
                                    bgcolor: VERDE_INSTITUCIONAL,
                                    color: "#fff",
                                    fontWeight: 900,
                                    fontSize: "0.6rem",
                                    height: 18,
                                    borderRadius: "6px",
                                    "& .MuiChip-label": { px: 0.8 },
                                  }}
                                />
                              </Collapse>
                            </Box>
                            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                              {p.startDate} — {p.endDate}
                            </Typography>
                          </Box>
                        </Box>

                        <Button
                          size="small"
                          variant={p.isActive ? "contained" : "outlined"}
                          disabled={p.isActive || activatingId === p.id}
                          sx={{
                            minWidth: 80,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            borderRadius: "8px",
                            bgcolor: p.isActive ? VERDE_INSTITUCIONAL : undefined,
                            borderColor: p.isActive ? VERDE_INSTITUCIONAL : undefined,
                            transition: "all 0.3s ease",
                          }}
                          onClick={async () => {
                            setActivatingId(p.id);
                            try {
                              await activateAcademicPeriod(p.id);
                              await Promise.all([
                                loadPeriods(),
                                queryClient.invalidateQueries({ queryKey: ["students"] }),
                                queryClient.invalidateQueries({ queryKey: ["careerCards"] }),
                              ]);
                              handleSelectPeriod(p.id);
                              showToast(`Período "${p.name}" activado ✅`);
                            } catch (err) {
                              console.error(err);
                              showToast("No se pudo activar el período", "error");
                            } finally {
                              setActivatingId(null);
                            }
                          }}
                        >
                          {activatingId === p.id ? "..." : p.isActive ? "Activo" : "Activar"}
                        </Button>
                      </Box>
                    </Grow>
                  ))}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenPeriodModal(false)} disabled={creatingPeriod}>Cancelar</Button>
              <Button onClick={handleCreatePeriod} variant="contained" disabled={creatingPeriod}
                sx={{ bgcolor: VERDE_INSTITUCIONAL, fontWeight: 800, minWidth: 90 }}>
                {creatingPeriod ? "Creando..." : "Crear"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Otros Modales... */}
          <Dialog open={openAdminProfile} onClose={() => setOpenAdminProfile(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
            <DialogTitle sx={{ fontWeight: 700 }}>Perfil Administrador</DialogTitle>
            <DialogContent dividers>
              <Typography sx={{ mb: 2 }}>
                <b>Nombre:</b> {adminProfile?.fullName || (adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : "-")}
              </Typography>
              <Typography sx={{ mb: 1 }}><b>Correo:</b> {adminProfile?.email || "-"}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAdminProfile(false)} sx={{ fontWeight: 600 }}>Cerrar</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={openAddCareer} onClose={() => setOpenAddCareer(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
            <DialogTitle sx={{ fontWeight: 700 }}>Añadir Carrera</DialogTitle>
            <DialogContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <input placeholder="Nombre" value={newCareerName} onChange={(e) => setNewCareerName(e.target.value)}
                  style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd", fontSize: "16px", width: "100%", boxSizing: "border-box" }} />
                <input type="color" value={newCareerColor} onChange={(e) => setNewCareerColor(e.target.value)} style={{ width: "100%", height: 44 }} />
                <Button variant="outlined" component="label" fullWidth sx={{ mt: 1 }}>
                  {selectedFile ? selectedFile.name : "Subir Portada"}
                  <input type="file" hidden accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenAddCareer(false)}>Cancelar</Button>
              <Button onClick={handleAddCareer} variant="contained" sx={{ bgcolor: VERDE_INSTITUCIONAL }}>Guardar</Button>
            </DialogActions>
          </Dialog>

          <AssignCareerModal 
            open={openAssignCareer} 
            onClose={() => setOpenAssignCareer(false)} 
            onSuccess={reloadStudentsAndCards} 
            availableCareers={availableCareersFromBackend} 
          />
          <CreateUserModal 
            open={openCreateUser} 
            onClose={() => setOpenCreateUser(false)} 
            onSuccess={reloadStudentsAndCards} 
          />
        </Box>
      </Box>

      {/* DIALOG LOGOUT */}
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

      {/* TOAST */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity={toast.type} variant="filled"
          sx={{ fontWeight: 700, fontSize: "0.95rem", borderRadius: "12px" }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
}