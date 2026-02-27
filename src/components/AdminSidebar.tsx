import { useState } from "react";
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Box, Typography, Collapse, useTheme, useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  School as SchoolIcon,
  ExpandLess,
  ExpandMore,
  LabelImportant as LabelIcon,
  AddCircle as AddCircleIcon,
  HowToVote as PredefenseIcon,
  EmojiEvents as FinalDefenseIcon,
  Storage as DatosIcon,
  CalendarMonth as PeriodIcon,
  UploadFile as UploadIcon,
  BarChart as StatsIcon,
  AccountCircle as ProfileIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  verde: string;
  careerCards: any[];
  selectedPeriodId: number | "ALL";
  onOpenAddCareer?: () => void;
  // Datos
  onOpenProfile?: () => void;
  onOpenPeriodModal?: () => void;
  onUploadFile?: () => void;
  onOpenStats?: () => void;
}

export const drawerWidth = 220;

export default function AdminSidebar({
  open, onClose, onLogout, verde, careerCards, selectedPeriodId,
  onOpenAddCareer,
  onOpenProfile,
  onOpenPeriodModal,
  onUploadFile,
  onOpenStats,
}: AdminSidebarProps) {
  const nav = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openCareers, setOpenCareers] = useState(false);
  const [openDatos, setOpenDatos] = useState(false);

  const go = (path: string) => { nav(path); if (isMobile) onClose(); };

  const goCareer = (id: number, name: string) => {
    const pid = selectedPeriodId === "ALL" ? "" : selectedPeriodId;
    const base = `/admin/students/by-career?careerId=${id}&careerName=${encodeURIComponent(name)}`;
    nav(pid ? `${base}&periodId=${pid}` : base);
    if (isMobile) onClose();
  };

  const action = (fn?: () => void) => {
    fn?.();
    if (isMobile) onClose();
  };

  const btn = { borderRadius: "10px", my: 0.3, "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } };

  const subBtn = {
    pl: 2.5, borderRadius: "8px",
    "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
  };

  const content = (
    <>
      {/* HEADER SIDEBAR */}
      <Box sx={{ display: "flex", alignItems: "center", p: 2, bgcolor: "rgba(0,0,0,0.15)" }}>
        <Typography sx={{ flexGrow: 1, fontWeight: 800, color: "#fff", fontSize: "1rem" }}>
          Panel Académico
        </Typography>
        {isMobile && (
          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />

      <List sx={{ px: 1, flex: 1, overflowY: "auto" }}>

        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => go("/admin")} sx={btn}>
            <ListItemIcon sx={{ color: "#fff", minWidth: 38 }}><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard Inicio" primaryTypographyProps={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }} />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 0.5, bgcolor: "rgba(255,255,255,0.15)" }} />

        {/* Predefensa */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => go("/admin/predefense")} sx={btn}>
            <ListItemIcon sx={{ color: "#fff", minWidth: 38 }}><PredefenseIcon /></ListItemIcon>
            <ListItemText primary="Predefensa" primaryTypographyProps={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }} />
          </ListItemButton>
        </ListItem>

        {/* Defensa Final */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => go("/admin/final-defense")} sx={btn}>
            <ListItemIcon sx={{ color: "#fff", minWidth: 38 }}><FinalDefenseIcon /></ListItemIcon>
            <ListItemText primary="Defensa Final" primaryTypographyProps={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }} />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 0.5, bgcolor: "rgba(255,255,255,0.15)" }} />

        {/* ===== CARRERAS ===== */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setOpenCareers(!openCareers)} sx={btn}>
            <ListItemIcon sx={{ color: "#fff", minWidth: 38 }}><SchoolIcon /></ListItemIcon>
            <ListItemText primary="Carreras" primaryTypographyProps={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }} />
            {openCareers ? <ExpandLess sx={{ color: "#fff" }} /> : <ExpandMore sx={{ color: "#fff" }} />}
          </ListItemButton>
        </ListItem>

        <Collapse in={openCareers} unmountOnExit>
          <List disablePadding sx={{ bgcolor: "rgba(0,0,0,0.12)", borderRadius: "10px", mx: 1, mb: 1 }}>
            {careerCards.map((c) => (
              <ListItemButton key={c.id} onClick={() => goCareer(c.id, c.name)} sx={subBtn}>
                <ListItemIcon sx={{ minWidth: 24 }}><LabelIcon sx={{ fontSize: 12, color: "#fff" }} /></ListItemIcon>
                <ListItemText primary={c.name} primaryTypographyProps={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }} />
              </ListItemButton>
            ))}
            {onOpenAddCareer && (
              <>
                <Divider sx={{ my: 0.5, bgcolor: "rgba(255,255,255,0.2)", mx: 2 }} />
                <ListItemButton onClick={() => action(onOpenAddCareer)} sx={subBtn}>
                  <ListItemIcon sx={{ minWidth: 24 }}><AddCircleIcon sx={{ fontSize: 14, color: "#fff" }} /></ListItemIcon>
                  <ListItemText primary="Añadir Carrera" primaryTypographyProps={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }} />
                </ListItemButton>
              </>
            )}
          </List>
        </Collapse>

        {/* ===== DATOS ===== */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setOpenDatos(!openDatos)} sx={btn}>
            <ListItemIcon sx={{ color: "#fff", minWidth: 38 }}><DatosIcon /></ListItemIcon>
            <ListItemText primary="Datos" primaryTypographyProps={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }} />
            {openDatos ? <ExpandLess sx={{ color: "#fff" }} /> : <ExpandMore sx={{ color: "#fff" }} />}
          </ListItemButton>
        </ListItem>

        <Collapse in={openDatos} unmountOnExit>
          <List disablePadding sx={{ bgcolor: "rgba(0,0,0,0.12)", borderRadius: "10px", mx: 1, mb: 1 }}>

            {onOpenProfile && (
              <ListItemButton onClick={() => action(onOpenProfile)} sx={subBtn}>
                <ListItemIcon sx={{ minWidth: 28 }}><ProfileIcon sx={{ color: "#fff", fontSize: 18 }} /></ListItemIcon>
                <ListItemText primary="Mi Perfil" primaryTypographyProps={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }} />
              </ListItemButton>
            )}

            {onOpenPeriodModal && (
              <ListItemButton onClick={() => action(onOpenPeriodModal)} sx={subBtn}>
                <ListItemIcon sx={{ minWidth: 28 }}><PeriodIcon sx={{ color: "#fff", fontSize: 18 }} /></ListItemIcon>
                <ListItemText primary="Gestión de Períodos" primaryTypographyProps={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }} />
              </ListItemButton>
            )}

            {onUploadFile && (
              <ListItemButton onClick={() => action(onUploadFile)} sx={subBtn}>
                <ListItemIcon sx={{ minWidth: 28 }}><UploadIcon sx={{ color: "#fff", fontSize: 18 }} /></ListItemIcon>
                <ListItemText primary="Cargar Excel (.xlsx)" primaryTypographyProps={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }} />
              </ListItemButton>
            )}

            {onOpenStats && (
              <ListItemButton onClick={() => action(onOpenStats)} sx={subBtn}>
                <ListItemIcon sx={{ minWidth: 28 }}><StatsIcon sx={{ color: "#fff", fontSize: 18 }} /></ListItemIcon>
                <ListItemText primary="Estadísticas" primaryTypographyProps={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }} />
              </ListItemButton>
            )}

          </List>
        </Collapse>

      </List>

      {/* LOGOUT */}
      <Box sx={{ pb: 2 }}>
        <Divider sx={{ mb: 1, bgcolor: "rgba(255,255,255,0.2)" }} />
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout} sx={{ borderRadius: "10px", mx: 1, "&:hover": { bgcolor: "#c62828" } }}>
            <ListItemIcon sx={{ color: "#fff", minWidth: 38 }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer variant="temporary" open={open} onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: verde, display: "flex", flexDirection: "column", border: "none" },
        }}>
        {content}
      </Drawer>
      <Drawer variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: verde, display: "flex", flexDirection: "column", border: "none", boxSizing: "border-box" },
        }}
        open>
        {content}
      </Drawer>
    </Box>
  );
}