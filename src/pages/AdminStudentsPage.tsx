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
} from "@mui/material";

// --- FECHAS ---
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// Servicios
import { importStudentsXlsx, listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";
import { createCareer } from "../services/careerService";
import { api } from "../api/api";
import {
  createAcademicPeriod,
  listAcademicPeriods,
  type AcademicPeriodDto,
} from "../services/periodService";
import { listCareerCards, type CareerCardDto } from "../services/adminCareerCardsService";

// Componentes
import AssignCareerModal from "../components/AssignCareerModal";
import CreateUserModal from "../components/CreateUserModal";
import AdminHeaderBar from "../components/AdminHeaderBar";
import CareersSection from "../components/CareersSection";
import GeneralListSection from "../components/GeneralListSection";

import { useActivePeriod } from "../hooks/useActivePeriod";

// --- IMPORTANTE: LÓGICA REACTIVA ---
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

  const [importing, setImporting] = useState(false);
  
  // 🧠 REFERENCIAS REACTIVAS PARA ESTADO Y AUDIO
  const prevTotalsRef = useRef({ incidents: 0, observations: 0 });
  const audioAlarmRef = useRef<HTMLAudioElement | null>(null);

  const activePeriod = useActivePeriod();
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | "ALL">("ALL");

  // Modales
  const [openAssignCareer, setOpenAssignCareer] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openAddCareer, setOpenAddCareer] = useState(false);
  const [openAdminProfile, setOpenAdminProfile] = useState(false);

  const [openPeriodModal, setOpenPeriodModal] = useState(false);
  const [periodStart, setPeriodStart] = useState<Dayjs | null>(dayjs());
  const [periodEnd, setPeriodEnd] = useState<Dayjs | null>(dayjs().add(5, "month"));
  const [periodIsActive, setPeriodIsActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [adminProfile, setAdminProfile] = useState<any | null>(null);

  const [newCareerName, setNewCareerName] = useState("");
  const [newCareerColor, setNewCareerColor] = useState("#546e7a");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // -------------------------
  // ✅ CAPA REACTIVA DE DATOS ACELERADA (2 SEGUNDOS)
  // -------------------------
  const { data: rows = [], isLoading: loadingStudents } = useQuery<AdminStudentRow[]>({
    queryKey: ["students", selectedPeriodId],
    queryFn: () => (selectedPeriodId === "ALL" ? listStudents() : listStudents(selectedPeriodId)),
    enabled: !activePeriod.loading,
    staleTime: 0,
    refetchInterval: 2000, 
    refetchIntervalInBackground: true, 
    refetchOnWindowFocus: true 
  });

  const { data: careerCards = [] } = useQuery<CareerCardDto[]>({
    queryKey: ["careerCards", selectedPeriodId],
    queryFn: () => {
      const pid = selectedPeriodId === "ALL" ? (activePeriod.periodId ?? undefined) : selectedPeriodId;
      return listCareerCards(pid);
    },
    enabled: !activePeriod.loading
  });

  const { data: periods = [] } = useQuery<AcademicPeriodDto[]>({
    queryKey: ["periods"],
    queryFn: () => listAcademicPeriods() 
  });

  // --- 🔊 LÓGICA REACTIVA DE SONIDO GLOBAL ---
  useEffect(() => {
    if (rows && rows.length > 0) {
      const currentTotals = rows.reduce((acc, s) => ({
        incidents: acc.incidents + (s.incidentCount || 0),
        observations: acc.observations + (s.observationCount || 0)
      }), { incidents: 0, observations: 0 });

      const hasHistory = prevTotalsRef.current.incidents > 0 || prevTotalsRef.current.observations > 0;

      if (hasHistory) {
        let soundPath = "";
        
        if (currentTotals.incidents > prevTotalsRef.current.incidents) {
          soundPath = "/sounds/alert.mp3"; 
        } 
        else if (currentTotals.observations > prevTotalsRef.current.observations) {
          soundPath = "/sounds/burbujas.mp3";
        }

        if (soundPath) {
          if (audioAlarmRef.current) {
            audioAlarmRef.current.pause();
            audioAlarmRef.current = null;
          }
          const audio = new Audio(soundPath);
          audio.loop = true; 
          audio.play().catch(() => console.warn("Interacción requerida por Chrome para sonar"));
          audioAlarmRef.current = audio;
        }
      }
      prevTotalsRef.current = currentTotals;
    }
  }, [rows]);

  const handleStopAlarm = () => {
    if (audioAlarmRef.current) {
      audioAlarmRef.current.pause();
      audioAlarmRef.current.currentTime = 0;
      audioAlarmRef.current = null;
    }
  };

  const handleHardRefresh = () => {
    queryClient.invalidateQueries();
    window.location.reload();
  };

  const loadPeriods = async () => queryClient.invalidateQueries({ queryKey: ["periods"] });
  const loadCareerCards = async () => queryClient.invalidateQueries({ queryKey: ["careerCards"] });
  const loadStudents = async () => queryClient.invalidateQueries({ queryKey: ["students"] });

  useEffect(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (ls && ls !== "ALL" && Number.isFinite(Number(ls))) {
      setSelectedPeriodId(Number(ls));
    } else if (activePeriod?.periodId && (!ls || ls === "ALL")) {
      setSelectedPeriodId(activePeriod.periodId);
      localStorage.setItem("adminPeriodId", String(activePeriod.periodId));
    }

    (async () => {
      try {
        const res = await api.get("/me");
        setAdminProfile(res.data);
      } catch {
        setAdminProfile(null);
      }
    })();
  }, [activePeriod.periodId, activePeriod.loading]);

  const handleSelectPeriod = async (val: number | "ALL") => {
    setSelectedPeriodId(val);
    if (val === "ALL") localStorage.setItem("adminPeriodId", "ALL");
    else localStorage.setItem("adminPeriodId", String(val));
  };

  const handleFileUpload = async (file: File) => {
    setImporting(true);
    try {
      const pid = selectedPeriodId !== "ALL" ? selectedPeriodId : activePeriod.periodId ?? null;
      if (!pid) { setOpenPeriodModal(true); return; }
      await importStudentsXlsx(file, pid);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      alert("Importación completada ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error");
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
      isFixed: true 
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

      return {
        key: String(c.id),
        label: c.name,
        total: students.length,
        reprobados,
        color: c.color ?? "#546e7a",
      };
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePeriod = async () => {
    try {
      if (!periodStart || !periodEnd) {
        alert("Debes seleccionar fecha inicio y fin");
        return;
      }

      const created = await createAcademicPeriod({
        startDate: periodStart.format("YYYY-MM-DD"),
        endDate: periodEnd.format("YYYY-MM-DD"),
        isActive: periodIsActive,
      });

      alert(`Periodo creado ✅: ${created.name}`);
      queryClient.invalidateQueries({ queryKey: ["periods"] });
      setOpenPeriodModal(false);

      if (created.isActive) handleSelectPeriod(created.id);
    } catch (e: any) {
      alert("Error");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
        
        {/* Header Bar sin la prop de Sidebar */}
        <AdminHeaderBar
          verde={VERDE_INSTITUCIONAL}
          importing={loadingStudents || importing}
          onOpenAssignCareer={() => setOpenAssignCareer(true)}
          onOpenCreateUser={() => setOpenCreateUser(true)}
          onRefresh={handleHardRefresh}
          onLogout={() => { logout(); nav("/"); }}
          userMenuAnchor={userMenuAnchor}
          openUserMenu={Boolean(userMenuAnchor)}
          onOpenMenu={(e) => setUserMenuAnchor(e.currentTarget)}
          onCloseMenu={() => setUserMenuAnchor(null)}
          onOpenProfile={() => { setOpenAdminProfile(true); setUserMenuAnchor(null); }}
          onUploadFile={handleFileUpload}
          onOpenPeriodModal={() => setOpenPeriodModal(true)}
          periods={periods}
          selectedPeriodId={selectedPeriodId}
          activePeriod={activePeriod}
          onChangePeriod={handleSelectPeriod}
          onReloadPeriods={loadPeriods}
          careerStats={careerStats}
        />

        <Container maxWidth={false} sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
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
                nav(`/admin/students/${id}?periodId=${selectedPeriodId === 'ALL' ? activePeriod.periodId : selectedPeriodId}`);
            }}
            onClearIncidents={() => {}}
            onMarkIncidentsSeen={(id: number) => {
                handleStopAlarm();
                queryClient.invalidateQueries({ queryKey: ["students"] });
            }}
          />
        </Container>

        <Dialog open={openPeriodModal} onClose={() => setOpenPeriodModal(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, color: "#fff" }}>Crear Período</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
              <DatePicker label="Inicio" value={periodStart} onChange={(v) => setPeriodStart(v)} slotProps={{ textField: { fullWidth: true } }} />
              <DatePicker label="Fin" value={periodEnd} onChange={(v) => setOpenPeriodModal(false)} slotProps={{ textField: { fullWidth: true } }} />
              <FormControlLabel control={<Checkbox checked={periodIsActive} onChange={(e) => setPeriodIsActive(e.target.checked)} />} label="Periodo activo" />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenPeriodModal(false)}>Cancelar</Button>
            <Button onClick={handleCreatePeriod} variant="contained" sx={{ bgcolor: VERDE_INSTITUCIONAL, fontWeight: 800 }}>Crear</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openAdminProfile} onClose={() => setOpenAdminProfile(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Perfil Administrador</DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ mb: 2 }}>
              <b>Nombre:</b> {adminProfile?.fullName || (adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : "-")}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <b>Correo:</b> {adminProfile?.email || "-"}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdminProfile(false)} sx={{ fontWeight: 600 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openAddCareer} onClose={() => setOpenAddCareer(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Añadir Carrera</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <input placeholder="Nombre" value={newCareerName} onChange={(e) => setNewCareerName(e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
              <input type="color" value={newCareerColor} onChange={(e) => setNewCareerColor(e.target.value)} style={{ width: "100%", height: 40 }} />
              <Button variant="outlined" component="label" fullWidth sx={{ mt: 1 }}>{selectedFile ? selectedFile.name : "Subir Portada"} <input type="file" hidden accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} /></Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpenAddCareer(false)}>Cancelar</Button><Button onClick={handleAddCareer} variant="contained" sx={{ bgcolor: VERDE_INSTITUCIONAL }}>Guardar</Button></DialogActions>
        </Dialog>

        <AssignCareerModal open={openAssignCareer} onClose={() => setOpenAssignCareer(false)} onSuccess={loadStudents} availableCareers={availableCareersFromBackend} />
        <CreateUserModal open={openCreateUser} onClose={() => setOpenCreateUser(false)} onSuccess={loadStudents} />
      </Box>
    </LocalizationProvider>
  );
}