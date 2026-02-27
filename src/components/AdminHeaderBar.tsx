import React, { useMemo } from "react";
import {
  Box, Typography, Button, IconButton, Divider,
  FormControl, Select, InputLabel, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Tooltip,
} from "@mui/material";

import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import MenuIcon from "@mui/icons-material/Menu";

export interface CareerStatDto {
  key: string; label: string; total: number; reprobados: number; color: string;
}
export interface PeriodHeaderDto {
  id: number; name: string; isActive?: boolean;
}
export interface ActivePeriodState {
  loading: boolean; periodName?: string | null;
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
  onOpenSidebar?: () => void;
  openStatsModal?: boolean;
  onCloseStatsModal?: () => void;
};

export default function AdminHeaderBar({
  verde, importing, onOpenAssignCareer, onOpenCreateUser,
  periods, selectedPeriodId, activePeriod, onChangePeriod,
  careerStats, onOpenSidebar, openStatsModal = false, onCloseStatsModal,
}: Props) {
  const { totalGlobal, totalReprobadosGlobal } = useMemo(() => {
    const total = careerStats.reduce((acc, c) => acc + (c.total ?? 0), 0);
    const repro = careerStats.reduce((acc, c) => acc + (c.reprobados ?? 0), 0);
    return { totalGlobal: total, totalReprobadosGlobal: repro };
  }, [careerStats]);

  // ✅ FIX: valor seguro para el Select — evita crash "out-of-range value"
  const safeSelectedPeriodId = useMemo(() => {
    if (selectedPeriodId === "ALL") return "ALL";
    const exists = periods.some((p) => p.id === selectedPeriodId);
    return exists ? selectedPeriodId : "ALL";
  }, [selectedPeriodId, periods]);

  // ✅ FIX: nombre del período nunca undefined/null — evita crash en <Text> de antd
  const safePeriodName = useMemo(() => {
    if (activePeriod.loading) return "Cargando...";
    if (!activePeriod.periodName) return "SIN PERIODO";
    return String(activePeriod.periodName);
  }, [activePeriod.loading, activePeriod.periodName]);

  const whiteSelectStyles = {
    color: "#fff",
    ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
    ".MuiSvgIcon-root": { color: "#fff" },
    fontSize: { xs: "0.78rem", sm: "0.875rem" },
  };

  const actionBtnStyle = {
    borderRadius: "999px",
    fontWeight: 700,
    textTransform: "none",
    bgcolor: "#fff",
    color: verde,
    "&:hover": { bgcolor: "#f4f4f4" },
    fontSize: { xs: "0.72rem", sm: "0.8rem", md: "0.875rem" },
    px: { xs: 1.2, sm: 1.8, md: 2 },
    py: { xs: 0.4, sm: 0.6, md: 0.7 },
    minWidth: { xs: "auto", sm: "auto" },
    whiteSpace: "nowrap",
  };

  return (
    <>
      <Box
        component="header"
        sx={{
          backgroundColor: verde,
          boxSizing: "border-box",
          px: { xs: 1, sm: 2, md: 3 },
          pt: { xs: 1, sm: 0 },
          pb: { xs: 1, sm: 0 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          borderBottom: "4px solid #fff",
          gap: { xs: 0.8, sm: 0 },
          minHeight: { xs: "auto", sm: 61 },
        }}
      >
        {/* FILA 1 en mobile / todo en una fila en desktop */}
        <Box sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 0.5, sm: 1, md: 2 },
          flex: { xs: "none", sm: 1 },
        }}>
          {/* Hamburguesa — solo móvil */}
          {onOpenSidebar && (
            <IconButton
              onClick={onOpenSidebar}
              sx={{ color: "#fff", display: { xs: "flex", sm: "none" }, p: 0.5 }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}

          <Typography sx={{
            color: "#fff", fontWeight: 800, whiteSpace: "nowrap",
            fontSize: { xs: "0.82rem", sm: "0.95rem", md: "1.1rem" },
          }}>
            SISTEMA <Box component="span" sx={{ fontWeight: 300, opacity: 0.9 }}>ACADÉMICO</Box>
          </Typography>

          {/* SELECTOR PERÍODO — desktop */}
          <Box sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            gap: 1.5,
            flex: 1,
            justifyContent: "center",
          }}>
            <Box sx={{ display: { xs: "none", lg: "block" }, textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", display: "block", mb: -0.5 }}>
                Período Activo:
              </Typography>
              {/* ✅ FIX: usa safePeriodName — nunca null/undefined */}
              <Typography variant="body2" sx={{ color: "#fff", fontWeight: 700 }}>
                {safePeriodName}
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel sx={{ color: "#fff", opacity: 0.8, "&.Mui-focused": { color: "#fff" } }}>
                Filtro de período
              </InputLabel>
              <Select
                value={safeSelectedPeriodId}
                label="Filtro de período"
                onChange={(e) => onChangePeriod(e.target.value as any)}
                sx={whiteSelectStyles}
              >
                <MenuItem value="ALL"><strong>Vista Histórica</strong></MenuItem>
                {(periods ?? []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {/* ✅ FIX: String() garantiza que nunca se pase undefined a <Text> */}
                    {String(p.name ?? "")}{p.isActive ? " (Actual)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* BOTONES */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1, alignItems: "center", flexShrink: 0 }}>
            <Button onClick={onOpenAssignCareer} startIcon={<GroupRoundedIcon />} variant="contained"
              sx={{ ...actionBtnStyle, display: { xs: "none", lg: "flex" } }}>
              Asignar
            </Button>
            <Button onClick={onOpenCreateUser} startIcon={<PersonAddAlt1RoundedIcon />} variant="contained"
              sx={{ ...actionBtnStyle, display: { xs: "none", lg: "flex" } }}>
              Nuevo Usuario
            </Button>
            <Tooltip title="Asignar Carrera" arrow>
              <Button onClick={onOpenAssignCareer} variant="contained"
                sx={{ ...actionBtnStyle, display: { xs: "none", sm: "flex", lg: "none" }, minWidth: 36, width: 36, height: 36, p: 0, borderRadius: "50%" }}>
                <GroupRoundedIcon sx={{ fontSize: 18 }} />
              </Button>
            </Tooltip>
            <Tooltip title="Nuevo Usuario" arrow>
              <Button onClick={onOpenCreateUser} variant="contained"
                sx={{ ...actionBtnStyle, display: { xs: "none", sm: "flex", lg: "none" }, minWidth: 36, width: 36, height: 36, p: 0, borderRadius: "50%" }}>
                <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* FILA 2 — solo en mobile */}
        <Box sx={{
          display: { xs: "flex", sm: "none" },
          alignItems: "center",
          gap: 0.8,
          pb: 0.5,
        }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel sx={{ color: "#fff", opacity: 0.8, fontSize: "0.75rem", "&.Mui-focused": { color: "#fff" } }}>
              Filtro de período
            </InputLabel>
            <Select
              value={safeSelectedPeriodId}
              label="Filtro de período"
              onChange={(e) => onChangePeriod(e.target.value as any)}
              sx={{ ...whiteSelectStyles, fontSize: "0.75rem" }}
            >
              <MenuItem value="ALL"><strong>Vista Histórica</strong></MenuItem>
              {(periods ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: "0.8rem" }}>
                  {String(p.name ?? "")}{p.isActive ? " (Actual)" : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Asignar Carrera" arrow>
            <Button onClick={onOpenAssignCareer} variant="contained"
              sx={{ ...actionBtnStyle, minWidth: 36, width: 36, height: 36, p: 0, borderRadius: "50%" }}>
              <GroupRoundedIcon sx={{ fontSize: 18 }} />
            </Button>
          </Tooltip>
          <Tooltip title="Nuevo Usuario" arrow>
            <Button onClick={onOpenCreateUser} variant="contained"
              sx={{ ...actionBtnStyle, minWidth: 36, width: 36, height: 36, p: 0, borderRadius: "50%" }}>
              <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* MODAL ESTADÍSTICAS */}
      <Dialog open={openStatsModal} onClose={onCloseStatsModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: verde, color: "#fff", fontWeight: 700 }}>
          Resumen Académico General
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", gap: 4, mb: 3, p: 2.5, bgcolor: "#f8f9fa", borderRadius: 3, border: "1px solid #eee" }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ESTUDIANTES TOTALES</Typography>
              <Typography variant="h4" fontWeight={900} color={verde}>{totalGlobal}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ALUMNOS REPROBADOS</Typography>
              <Typography variant="h4" fontWeight={900} color="error.main">{totalReprobadosGlobal}</Typography>
            </Box>
          </Box>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#fafafa" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Carrera / Facultad</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Matriculados</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Reprobados</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(careerStats ?? []).map((stat) => (
                  <TableRow key={stat.key} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: stat.color }} />
                        {/* ✅ FIX: String() evita que label undefined crashee <Text> de antd */}
                        <Typography variant="body2" fontWeight={600}>{String(stat.label ?? "")}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={stat.total ?? 0} size="small" sx={{ fontWeight: 900, bgcolor: "#E8F5E9", color: "#2E7D32" }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={stat.reprobados ?? 0} size="small" sx={{ fontWeight: 900, bgcolor: "#FFEBEE", color: "#C62828" }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onCloseStatsModal} variant="outlined" sx={{ fontWeight: 700 }}>Entendido</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}