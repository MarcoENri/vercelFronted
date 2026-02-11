import { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Box,
  Typography,
  Collapse,
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
  Edit as EditIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  verde: string;
  careerCards: any[];
  selectedPeriodId: number | "ALL";
  // Propiedades opcionales para evitar errores de TS
  onOpenPeriod?: () => void;
  onOpenUser?: () => void;
  onOpenAssign?: () => void;
  onOpenAddCareer?: () => void;
  onOpenModifyCards?: () => void;
}

const drawerWidth = 280;

export default function AdminSidebar({ 
  open, 
  onClose, 
  onLogout, 
  verde,
  careerCards,
  selectedPeriodId,
  onOpenAddCareer,
  onOpenModifyCards,
}: AdminSidebarProps) {
  const nav = useNavigate();
  const [openCareers, setOpenCareers] = useState(false);

  const handleToggleCareers = () => {
    setOpenCareers(!openCareers);
  };

  const navigateToCareer = (careerId: number, careerName: string) => {
    const pid = selectedPeriodId === "ALL" ? "" : selectedPeriodId;
    const base = `/admin/students/by-career?careerId=${careerId}&careerName=${encodeURIComponent(careerName)}`;
    nav(pid ? `${base}&periodId=${pid}` : base);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#1a1a1a",
          color: "#fff",
        },
      }}
    >
      {/* HEADER DEL SIDEBAR */}
      <Box sx={{ display: "flex", alignItems: "center", p: 2, bgcolor: verde }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold", color: "white" }}>
          Panel Académico
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <List sx={{ px: 1 }}>
        {/* INICIO */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => { nav("/admin"); onClose(); }}>
            <ListItemIcon sx={{ color: verde }}><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard Inicio" />
          </ListItemButton>
        </ListItem>

        {/* SUBMENÚ CARRERAS */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleToggleCareers}>
            <ListItemIcon sx={{ color: verde }}><SchoolIcon /></ListItemIcon>
            <ListItemText primary="Carreras" />
            {openCareers ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={openCareers} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "10px", mx: 1 }}>
            {careerCards.map((career) => (
              <ListItemButton 
                key={career.id} 
                sx={{ pl: 4, borderRadius: "8px" }}
                onClick={() => navigateToCareer(career.id, career.name)}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <LabelIcon sx={{ fontSize: 14, color: career.color || verde }} />
                </ListItemIcon>
                <ListItemText 
                  primary={career.name} 
                  primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} 
                />
              </ListItemButton>
            ))}

            {(onOpenAddCareer || onOpenModifyCards) && (
              <Divider sx={{ my: 1, bgcolor: "rgba(255,255,255,0.2)", mx: 2 }} />
            )}

            {/* Añadir Carrera */}
            {onOpenAddCareer && (
              <ListItemButton 
                sx={{ pl: 4, borderRadius: "8px", color: verde }}
                onClick={() => { onOpenAddCareer(); onClose(); }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <AddCircleIcon sx={{ fontSize: 18, color: verde }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Añadir Carrera" 
                  primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }} 
                />
              </ListItemButton>
            )}

            {/* Modificar Tarjetas */}
            {onOpenModifyCards && (
              <ListItemButton 
                sx={{ pl: 4, borderRadius: "8px", color: verde }}
                onClick={() => { onOpenModifyCards(); onClose(); }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <EditIcon sx={{ fontSize: 18, color: verde }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Modificar Tarjetas" 
                  primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }} 
                />
              </ListItemButton>
            )}
          </List>
        </Collapse>
      </List>

      {/* BOTÓN CERRAR SESIÓN AL FINAL */}
      <Box sx={{ mt: "auto", pb: 2 }}>
        <Divider sx={{ mb: 1, bgcolor: "rgba(255,255,255,0.1)" }} />
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout} sx={{ "&:hover": { bgcolor: "#d32f2f" } }}>
            <ListItemIcon sx={{ color: "white" }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
}