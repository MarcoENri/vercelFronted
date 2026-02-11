import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Divider as MuiDivider,
  FormControl,
  Select,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";

// Iconos
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";

export interface CareerStatDto {
  key: string;
  label: string;
  total: number;
  reprobados: number;
  color: string;
}

export interface PeriodHeaderDto {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface ActivePeriodState {
  loading: boolean;
  periodName?: string | null;
}

type Props = {
  verde: string;
  importing: boolean;
  onOpenAssignCareer: () => void;
  onOpenCreateUser: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  userMenuAnchor: HTMLElement | null;
  openUserMenu: boolean;
  onOpenMenu: (e: React.MouseEvent<HTMLElement>) => void;
  onCloseMenu: () => void;
  onOpenProfile: () => void;
  onUploadFile: (file: File) => void;
  onOpenPeriodModal: () => void;
  periods: PeriodHeaderDto[];
  selectedPeriodId: number | "ALL";
  activePeriod: ActivePeriodState;
  onChangePeriod: (val: number | "ALL") => void;
  onReloadPeriods: () => void;
  careerStats: CareerStatDto[];
  onOpenSidebar?: () => void; // Marcada como opcional
};

export default function AdminHeaderBar({
  verde,
  importing,
  onOpenAssignCareer,
  onOpenCreateUser,
  onRefresh,
  onLogout,
  userMenuAnchor,
  openUserMenu,
  onOpenMenu,
  onCloseMenu,
  onOpenProfile,
  onUploadFile,
  onOpenPeriodModal,
  periods,
  selectedPeriodId,
  activePeriod,
  onChangePeriod,
  onReloadPeriods,
  careerStats,
  // onOpenSidebar no se usa visualmente aquí
}: Props) {
  const [openStatsModal, setOpenStatsModal] = useState(false);

  const { totalGlobal, totalReprobadosGlobal } = useMemo(() => {
    const total = careerStats.reduce((acc, curr) => acc + (curr.total ?? 0), 0);
    const repro = careerStats.reduce((acc, curr) => acc + (curr.reprobados ?? 0), 0);
    return { totalGlobal: total, totalReprobadosGlobal: repro };
  }, [careerStats]);

  const whiteBtn = {
    borderRadius: "999px", px: 2, py: 0.7, fontWeight: 700, textTransform: "none",
    bgcolor: "#fff", color: verde, "&:hover": { bgcolor: "#f4f4f4" },
    display: { xs: "none", md: "flex" }
  };

  const whiteSelectStyles = {
    color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
    ".MuiSvgIcon-root": { color: "#fff" },
  };

  return (
    <>
      <Box component="header" sx={{ backgroundColor: verde, p: "10px 20px", display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 1100, borderBottom: "4px solid #fff", gap: 2 }}>
        
        {/* Icono de hamburguesa eliminado */}

        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", whiteSpace: "nowrap" }}>
          SISTEMA <Box component="span" sx={{ fontWeight: 300, opacity: 0.9 }}>ACADÉMICO</Box>
        </Typography>

        {/* SELECTOR DE PERIODO CENTRAL */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, justifyContent: "center" }}>
          <Box sx={{ display: { xs: "none", lg: "block" }, textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", display: "block", mb: -0.5 }}>Período Activo:</Typography>
            <Typography variant="body2" sx={{ color: "#fff", fontWeight: 700 }}>{activePeriod.loading ? "Cargando..." : activePeriod.periodName ?? "SIN PERIODO"}</Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="period-label" sx={{ color: "#fff", opacity: 0.8, "&.Mui-focused": { color: "#fff" } }}>Filtro de período</InputLabel>
            <Select labelId="period-label" value={selectedPeriodId} label="Filtro de período" onChange={(e) => onChangePeriod(e.target.value as any)} sx={whiteSelectStyles}>
              <MenuItem value="ALL"><strong>Vista Histórica</strong></MenuItem>
              {periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name} {p.isActive ? " (Actual)" : ""}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={onReloadPeriods} size="small" sx={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}><RefreshRoundedIcon fontSize="small" /></IconButton>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button onClick={onOpenAssignCareer} startIcon={<GroupRoundedIcon />} variant="contained" sx={whiteBtn}>Asignar</Button>
          <Button onClick={onOpenCreateUser} startIcon={<PersonAddAlt1RoundedIcon />} variant="contained" sx={whiteBtn}>Nuevo Usuario</Button>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: "rgba(255,255,255,0.3)", mx: 1 }} />
          <IconButton onClick={onRefresh} sx={{ color: "#fff" }} title="Refrescar Datos"><RefreshRoundedIcon /></IconButton>
          <IconButton onClick={onOpenMenu} sx={{ bgcolor: openUserMenu ? "rgba(255,255,255,0.2)" : "transparent", color: "#fff", transition: "0.3s" }}><AccountCircleRoundedIcon /></IconButton>
        </Box>

        {/* MENU DESPLEGABLE */}
        <Menu anchorEl={userMenuAnchor} open={openUserMenu} onClose={onCloseMenu} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <MenuItem onClick={() => { onCloseMenu(); onOpenProfile(); }}><ListItemIcon><AccountCircleRoundedIcon fontSize="small" /></ListItemIcon>Mi Perfil</MenuItem>
          <MenuItem onClick={() => { onCloseMenu(); onOpenPeriodModal(); }}><ListItemIcon><EventAvailableRoundedIcon fontSize="small" /></ListItemIcon>Gestión de Períodos</MenuItem>
          <MenuItem component="label"><ListItemIcon><UploadFileRoundedIcon fontSize="small" /></ListItemIcon>{importing ? "Importando..." : "Cargar Excel (.xlsx)"}<input type="file" hidden accept=".xlsx" onChange={(e) => { const file = e.target.files?.[0]; if (file) onUploadFile(file); }} /></MenuItem>
          <MuiDivider />
          <MenuItem onClick={() => { onCloseMenu(); setOpenStatsModal(true); }}><ListItemIcon><AssessmentRoundedIcon fontSize="small" sx={{ color: verde }} /></ListItemIcon><Box><Typography variant="body2" fontWeight={700}>Estadísticas</Typography><Typography variant="caption" color="text.secondary">Reporte de rendimiento</Typography></Box></MenuItem>
          <MuiDivider />
          <MenuItem onClick={() => { onCloseMenu(); onLogout(); }} sx={{ color: "error.main" }}><ListItemIcon><ExitToAppRoundedIcon fontSize="small" color="error" /></ListItemIcon>Cerrar Sesión</MenuItem>
        </Menu>
      </Box>

      {/* --- MODAL DE ESTADÍSTICAS --- */}
      <Dialog open={openStatsModal} onClose={() => setOpenStatsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: verde, color: "#fff", fontWeight: 700 }}>Resumen Académico General</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", gap: 4, mb: 3, p: 2.5, bgcolor: "#f8f9fa", borderRadius: 3, border: "1px solid #eee" }}>
            <Box><Typography variant="caption" color="text.secondary" fontWeight={700}>ESTUDIANTES TOTALES</Typography><Typography variant="h4" fontWeight={900} color={verde}>{totalGlobal}</Typography></Box>
            <Divider orientation="vertical" flexItem /><Box><Typography variant="caption" color="text.secondary" fontWeight={700}>ALUMNOS REPROBADOS</Typography><Typography variant="h4" fontWeight={900} color="error.main">{totalReprobadosGlobal}</Typography></Box>
          </Box>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#fafafa" }}><TableRow><TableCell sx={{ fontWeight: 800 }}>Carrera / Facultad</TableCell><TableCell align="center" sx={{ fontWeight: 800 }}>Matriculados</TableCell><TableCell align="center" sx={{ fontWeight: 800 }}>Reprobados</TableCell></TableRow></TableHead>
              <TableBody>
                {careerStats.map((stat) => (
                  <TableRow key={stat.key} hover>
                    <TableCell><Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: stat.color }} /><Typography variant="body2" fontWeight={600}>{stat.label}</Typography></Box></TableCell>
                    <TableCell align="center"><Chip label={stat.total} size="small" sx={{ fontWeight: 900, bgcolor: "#E8F5E9", color: "#2E7D32" }} /></TableCell>
                    <TableCell align="center"><Chip label={stat.reprobados} size="small" sx={{ fontWeight: 900, bgcolor: "#FFEBEE", color: "#C62828" }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpenStatsModal(false)} variant="outlined" sx={{ fontWeight: 700 }}>Entendido</Button></DialogActions>
      </Dialog>
    </>
  );
}