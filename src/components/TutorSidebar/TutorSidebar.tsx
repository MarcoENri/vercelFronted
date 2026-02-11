import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Logout as LogoutIcon,
  Group as GroupIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface TutorSidebarProps {
  onLogout: () => void;
  verde: string;
  periodId?: number | null;
  open?: boolean;        // ← Agregado
  onClose?: () => void;   // ← Necesario si vas a controlar cierre
}

const drawerWidth = 260; // Ajustado para que coincida con el layout principal

export default function TutorSidebar({
  onLogout,
  verde,
  periodId
}: TutorSidebarProps) {
  const nav = useNavigate();

  const menuItems = [
    {
      text: "Mis Estudiantes",
      icon: <GroupIcon />,
      path: "/tutor/students"
    },
    // ...
{
  text: "Predefensas",
  icon: <AssignmentIcon />,
  path: `/tutor/predefense?periodId=${periodId || ""}` // <--- Ruta específica
},
// ...
    {
      text: "Defensa Final",
      icon: <EmojiEventsIcon />,
      path: `/jury/final-defense?periodId=${periodId || ""}`
    },
  ];

  return (
    <Drawer
      variant="permanent" // 🟢 Cambio clave: Ahora es permanente
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: `linear-gradient(180deg, ${verde} 0%, ${verde}dd 100%)`,
          color: "#fff",
          border: "none",
          overflow: "hidden",
          position: "fixed", // Se mantiene fijo a la izquierda
          "&::before": {
            content: '""',
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "200px",
            height: "200px",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' opacity='0.05'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E")`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 0,
          },
        },
      }}
    >
      {/* Cabecera del Sidebar (Sin botón de cerrar) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 3,
          background: "rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <SchoolIcon sx={{ fontSize: 28, color: "white" }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "white",
              letterSpacing: "0.5px",
            }}
          >
            Panel Tutor
          </Typography>
        </Box>
      </Box>

      {/* Lista de Navegación */}
      <List sx={{ px: 2, mt: 3, position: "relative", zIndex: 1, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => nav(item.path)}
              sx={{
                borderRadius: "12px",
                py: 1.5,
                px: 2,
                background: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.15)",
                  transform: "translateX(4px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }
              }}
            >
              <ListItemIcon sx={{ color: "white", minWidth: 42 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "white",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Botón de Salida */}
      <Box sx={{ pb: 3, px: 2, position: "relative", zIndex: 1 }}>
        <Divider sx={{ mb: 2, bgcolor: "rgba(255, 255, 255, 0.15)" }} />
        <ListItemButton
          onClick={onLogout}
          sx={{
            borderRadius: "12px",
            py: 1.5,
            px: 2,
            background: "rgba(211, 47, 47, 0.15)",
            border: "1px solid rgba(211, 47, 47, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "#d32f2f",
              transform: "scale(1.02)",
              boxShadow: "0 4px 12px rgba(211, 47, 47, 0.4)",
            }
          }}
        >
          <ListItemIcon sx={{ color: "white", minWidth: 42 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar Sesión"
            primaryTypographyProps={{
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "white",
            }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}