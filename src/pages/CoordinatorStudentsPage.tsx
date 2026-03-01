import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Fade,
  Collapse,
  IconButton,
} from "@mui/material";

import { Logout as LogoutIcon, SyncRounded, Menu as MenuIcon } from "@mui/icons-material";
import { logout } from "../services/authService";
import type { CoordinatorStudentRow } from "../services/coordinatorService";
import { listCoordinatorStudents } from "../services/coordinatorService";
import { getActiveAcademicPeriod } from "../services/periodService";
import CoordinatorSidebar from "../components/Coordinatorsidebar/Coordinatorsidebar";

const VERDE = "#008B8B";

// ─── Banner de cambio de período ──────────────────────────────────────────────
function PeriodChangeBanner({ periodName, show }: { periodName: string; show: boolean }) {
  return (
    <Collapse in={show}>
      <Box
        sx={{
          bgcolor: "rgba(0,139,139,0.1)",
          border: `1px solid ${VERDE}`,
          borderRadius: "10px",
          mb: 2,
          px: 2.5,
          py: 1.2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <SyncRounded sx={{ color: VERDE, fontSize: 18, animation: "spin 1s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: VERDE }}>
          Período académico actualizado a <strong>{periodName}</strong> — cargando tus estudiantes...
        </Typography>
      </Box>
    </Collapse>
  );
}

export default function CoordinatorStudentsPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; msg: string }>({ open: false, msg: "" });
  const [showBanner, setShowBanner] = useState(false);
  const [bannerPeriodName, setBannerPeriodName] = useState("");

  // ── AÑADIDO: ref para abrir sidebar móvil desde el header ─────────────────
  const toggleMobileRef = useRef<() => void>(() => {});

  // ─── Referencia al último periodId conocido para detectar cambios ──────────
  const prevPeriodIdRef = useRef<number | null>(null);
  const isFirstPeriodLoad = useRef(true);

  const confirmLogout = () => { logout(); nav("/"); };

  // ─── 1. Query del período activo — se refresca cada 5s ────────────────────
  const { data: activePeriod } = useQuery({
    queryKey: ["activePeriod"],
    queryFn: () => getActiveAcademicPeriod(),
    initialData: (() => {
      const q = searchParams.get("periodId");
      if (q && !Number.isNaN(Number(q))) return { id: Number(q), name: `Período ${q}`, isActive: true } as any;
      return undefined;
    })(),
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const periodId = activePeriod?.id ?? null;

  // ─── 2. Detectar cambio de período y mostrar banner ───────────────────────
  useEffect(() => {
    if (!periodId) return;

    if (isFirstPeriodLoad.current) {
      prevPeriodIdRef.current = periodId;
      isFirstPeriodLoad.current = false;
      localStorage.setItem("periodId", String(periodId));
      return;
    }

    if (prevPeriodIdRef.current !== null && prevPeriodIdRef.current !== periodId) {
      const name = activePeriod?.name ?? `Período ${periodId}`;
      setBannerPeriodName(name);
      setShowBanner(true);
      setToast({ open: true, msg: `📅 Período cambiado a "${name}"` });
      localStorage.setItem("periodId", String(periodId));

      setTimeout(() => setShowBanner(false), 4000);
    }

    prevPeriodIdRef.current = periodId;
  }, [periodId, activePeriod?.name]);

  // ─── 3. Query de estudiantes — depende de periodId ────────────────────────
  const { data: rows = [], isLoading: loading } = useQuery<CoordinatorStudentRow[]>({
    queryKey: ["coordinatorStudents", periodId],
    enabled: !!periodId,
    queryFn: () => listCoordinatorStudents(periodId!),
    staleTime: 0,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  // ─── Info del coordinador ─────────────────────────────────────────────────
  const coordinatorInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return { username: "", name: "Usuario", email: "", role: "Coordinador" };
    try {
      const user = JSON.parse(userStr);
      return { username: user.username || "", name: user.fullName || user.name || "Usuario", email: user.email || "", role: user.role || "Coordinador" };
    } catch { return { username: "", name: "Usuario", email: "", role: "Coordinador" }; }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("coordinatorPhoto");
    if (saved) setPhotoPreview(saved);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === "EN_CURSO") return "primary";
    if (status === "REPROBADO") return "error";
    return "success";
  };

  const getDisplayName = () => coordinatorInfo.name || "Usuario";
  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || "U").toUpperCase();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CoordinatorSidebar
        coordinatorName={getDisplayName()}
        coordinatorInitials={getInitials()}
        coordinatorEmail={coordinatorInfo.email}
        coordinatorUsername={coordinatorInfo.username}
        coordinatorRole={coordinatorInfo.role}
        photoPreview={photoPreview}
        onLogout={() => setLogoutOpen(true)}
        onPhotoChange={setPhotoPreview}
        onToggleMobileRef={(fn) => { toggleMobileRef.current = fn; }}
      />

      <Box component="main" sx={{ flexGrow: 1, background: "#f0f2f5", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* HEADER */}
        <Box sx={{ position: "sticky", top: 0, zIndex: 1100, flexShrink: 0, bgcolor: VERDE, color: "white", py: 2, px: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {/* AÑADIDO: botón hamburguesa solo en móvil */}
              <IconButton
                onClick={() => toggleMobileRef.current?.()}
                sx={{ display: { xs: "flex", md: "none" }, color: "white", p: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>Mis Estudiantes</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.3 }}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {activePeriod?.name ? `📅 ${activePeriod.name}` : "Seleccionando período..."}
                  </Typography>
                  {loading && rows.length > 0 && (
                    <CircularProgress size={10} sx={{ color: "rgba(255,255,255,0.7)" }} />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Indicador EN VIVO */}
            
          </Box>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, py: 3, overflowY: "auto" }}>
          <Container maxWidth="lg">

            {/* Banner de cambio de período */}
            <PeriodChangeBanner show={showBanner} periodName={bannerPeriodName} />

            <Card sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderLeft: `6px solid ${VERDE}` }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: VERDE }}>Listado General</Typography>
                  <Typography variant="caption" sx={{ color: "#999" }}>
                    
                  </Typography>
                </Box>

                {!periodId && !loading ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">No se ha detectado un período académico activo.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {["Cédula", "Nombres", "Apellidos", "Carrera", "Corte", "Sección", "Estado"].map((head) => (
                            <TableCell key={head} align="center" sx={{ bgcolor: VERDE, color: "white", fontWeight: 900 }}>{head}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.length === 0 && !loading ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#777", fontStyle: "italic" }}>
                              No hay estudiantes registrados en este período.
                            </TableCell>
                          </TableRow>
                        ) : (
                          rows.map((row) => (
                            <TableRow
                              key={row.id}
                              onClick={() => nav(`/coordinator/students/${row.id}?periodId=${periodId}`)}
                              sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f5f5f5" }, transition: "0.2s" }}
                            >
                              <TableCell align="center" sx={{ fontWeight: 700 }}>{row.dni}</TableCell>
                              <TableCell>{row.firstName}</TableCell>
                              <TableCell>{row.lastName}</TableCell>
                              <TableCell>{row.career}</TableCell>
                              <TableCell align="center">{row.corte}</TableCell>
                              <TableCell align="center">{row.section}</TableCell>
                              <TableCell align="center">
                                <Chip label={row.status} color={getStatusColor(row.status)} size="small" sx={{ fontWeight: 900, fontSize: "0.75rem", borderRadius: "10px" }} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Container>
        </Box>

        {/* FOOTER */}
        <Box sx={{ position: "sticky", bottom: 0, zIndex: 1100, flexShrink: 0, bgcolor: VERDE, color: "white", py: 1, textAlign: "center", boxShadow: "0 -2px 8px rgba(0,0,0,0.1)" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: "11px" }}>© 2025 — Panel Coordinador</Typography>
        </Box>
      </Box>

      {/* DIALOG LOGOUT */}
      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(0,139,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogoutIcon sx={{ color: VERDE, fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>Cerrar sesión</Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">¿Estás seguro de que deseas cerrar sesión?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setLogoutOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: "10px", textTransform: "none", borderColor: "#ddd", color: "#555" }}>Cancelar</Button>
          <Button onClick={confirmLogout} variant="contained" fullWidth sx={{ borderRadius: "10px", textTransform: "none", bgcolor: VERDE, "&:hover": { bgcolor: "#006666" } }}>Cerrar sesión</Button>
        </DialogActions>
      </Dialog>

      {/* TOAST de cambio de período */}
      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity="info" variant="filled" sx={{ fontWeight: 700, borderRadius: "12px", bgcolor: VERDE }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}