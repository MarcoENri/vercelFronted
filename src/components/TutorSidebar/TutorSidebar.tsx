import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Typography,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  Stack,
  Paper,
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Logout as LogoutIcon,
  Group as GroupIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AccountCircle as AccountCircleIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const VERDE_INSTITUCIONAL = "#008B8B";
const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

interface TutorSidebarProps {
  onLogout: () => void;
  verde?: string;
  periodId?: number | null;
  tutorName?: string;
  tutorInitials?: string;
  tutorEmail?: string;
  tutorUsername?: string;
  tutorRole?: string;
  photoPreview?: string | null;
  onPhotoChange?: (photo: string) => void;
}

export default function TutorSidebar({
  onLogout,
  verde = VERDE_INSTITUCIONAL,
  periodId,
  tutorName = "Usuario",
  tutorInitials = "U",
  tutorEmail = "",
  tutorUsername = "",
  tutorRole = "Tutor",
  photoPreview = null,
  onPhotoChange,
}: TutorSidebarProps) {
  const nav = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState(!isMobile);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    {
      text: "Mis Estudiantes",
      icon: <GroupIcon />,
      path: "/tutor",
      tooltip: "Ver todos mis estudiantes",
    },
    {
      text: "Predefensas",
      icon: <AssignmentIcon />,
      path: `/tutor/predefense?periodId=${periodId || ""}`,
      tooltip: "Gestionar predefensas",
    },
    {
      text: "Defensa Final",
      icon: <EmojiEventsIcon />,
      path: `/jury/final-defense?periodId=${periodId || ""}`,
      tooltip: "Gestionar defensas finales",
    },
  ];

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es muy grande. Máximo 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const photoData = reader.result as string;
      localStorage.setItem("tutorPhoto", photoData);
      if (onPhotoChange) onPhotoChange(photoData);
    };
    reader.readAsDataURL(file);
  };

  // ✅ No navega si ya estás en esa ruta
  const handleNavigation = (path: string) => {
    const basePath = path.split("?")[0];
    if (location.pathname === basePath) return;
    nav(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleToggle = () => {
    if (isMobile) setMobileOpen(!mobileOpen);
    else setOpen(!open);
  };

  // ✅ Detecta ruta activa
  const isActive = (path: string) => {
    const basePath = path.split("?")[0];
    if (basePath === "/tutor") {
      return location.pathname === "/tutor" || location.pathname.startsWith("/tutor/students");
    }
    return location.pathname === basePath;
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: verde, color: "white" }}>

      {/* HEADER */}
      <Box sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 80,
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        {(isMobile || open) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
            <Avatar
              src={photoPreview || undefined}
              onClick={() => setProfileDrawerOpen(true)}
              sx={{
                width: 48, height: 48,
                bgcolor: "white", color: verde, fontWeight: 900,
                border: "2px solid rgba(255, 255, 255, 0.3)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": { transform: "scale(1.05)", border: "2px solid white" },
              }}
            >
              {tutorInitials}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="subtitle1" sx={{
                fontWeight: 900, fontSize: "0.95rem", lineHeight: 1.2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {tutorName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: "0.75rem", display: "block" }}>
                Tutor
              </Typography>
            </Box>
          </Box>
        )}

        {/* Avatar pequeño cuando está colapsado */}
        {!isMobile && !open && (
          <Box sx={{ mx: "auto" }}>
            <Avatar
              src={photoPreview || undefined}
              onClick={() => setProfileDrawerOpen(true)}
              sx={{
                width: 40, height: 40,
                bgcolor: "white", color: verde, fontWeight: 900,
                cursor: "pointer", border: "2px solid rgba(255,255,255,0.3)",
                "&:hover": { transform: "scale(1.05)" },
              }}
            >
              {tutorInitials}
            </Avatar>
          </Box>
        )}

        {!isMobile && (
          <IconButton onClick={handleToggle} sx={{ color: "white" }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        )}
      </Box>

      {/* MENÚ */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 2 }}>
        <List sx={{ px: 1 }}>
          {menuItems.map((item, index) => (
            <Tooltip key={index} title={!open && !isMobile ? item.tooltip : ""} placement="right" arrow>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={isActive(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    transition: "all 0.3s ease",
                    bgcolor: isActive(item.path) ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                      transform: "translateX(4px)",
                    },
                    "&.Mui-selected": {
                      bgcolor: "rgba(255, 255, 255, 0.15)",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                    },
                    justifyContent: open || isMobile ? "initial" : "center",
                    px: 2,
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 0,
                    mr: open || isMobile ? 2 : "auto",
                    justifyContent: "center",
                    color: "white",
                    "& svg": { fontSize: 24 },
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {(open || isMobile) && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.9rem",
                        fontWeight: isActive(item.path) ? 700 : 500,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>

      <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} />

      {/* CERRAR SESIÓN */}
      <Box sx={{ p: 1 }}>
        <Tooltip title={!open && !isMobile ? "Cerrar Sesión" : ""} placement="right" arrow>
          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: 2, minHeight: 48,
              justifyContent: open || isMobile ? "initial" : "center",
              px: 2, transition: "all 0.3s ease",
              "&:hover": { bgcolor: "rgba(255, 0, 0, 0.2)", transform: "translateX(4px)" },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0, mr: open || isMobile ? 2 : "auto",
              justifyContent: "center", color: "#ffcdd2",
            }}>
              <LogoutIcon />
            </ListItemIcon>
            {(open || isMobile) && (
              <ListItemText
                primary="Cerrar Sesión"
                primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600, color: "#ffcdd2" }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      {/* HAMBURGUESA — solo móvil */}
      {isMobile && (
        <IconButton
          onClick={handleToggle}
          sx={{
            position: "fixed", top: 16, left: 16, zIndex: 1300,
            bgcolor: verde, color: "white",
            "&:hover": { bgcolor: verde, opacity: 0.9 },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* DRAWER MÓVIL */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", border: "none" },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* DRAWER DESKTOP */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            display: { xs: "none", md: "block" },
            width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
            flexShrink: 0,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            "& .MuiDrawer-paper": {
              width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
              boxSizing: "border-box",
              overflowX: "hidden",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              border: "none",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* DRAWER PERFIL */}
      <Drawer
        anchor="right"
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 360 }, bgcolor: "rgba(255,255,255,0.98)", backdropFilter: "blur(10px)" },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: verde }}>Mi Perfil</Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Cerrar Sesión" arrow>
                <IconButton onClick={onLogout} size="small" sx={{ color: "#d32f2f" }}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setProfileDrawerOpen(false)} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <Avatar
                src={photoPreview || undefined}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  width: 90, height: 90, mx: "auto", mb: 1.5,
                  bgcolor: verde, cursor: "pointer",
                  border: "3px solid #f0f2f5", transition: "all 0.3s ease",
                  "&:hover": { transform: "scale(1.05)", border: `3px solid ${verde}` },
                }}
              >
                {tutorInitials}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, fontSize: "1rem" }}>
                {tutorName}
              </Typography>
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: "none" }} />
              <Button
                variant="text"
                startIcon={<PhotoCameraIcon fontSize="small" />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ color: verde, textTransform: "none", fontSize: "0.75rem", fontWeight: 600 }}
              >
                Cambiar Foto
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.2}>
              {[
                { icon: <AccountCircleIcon sx={{ color: verde, fontSize: 20 }} />, label: "Username", value: tutorUsername },
                { icon: <PersonIcon sx={{ color: verde, fontSize: 20 }} />, label: "Nombre Completo", value: tutorName },
                { icon: <EmailIcon sx={{ color: verde, fontSize: 20 }} />, label: "Email", value: tutorEmail },
              ].map((item) => (
                <Paper key={item.label} elevation={0} sx={{ p: 1.2, bgcolor: "rgba(248,249,250,0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    {item.icon}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.813rem", wordBreak: "break-word" }}>
                        {item.value || "No disponible"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}

              <Paper elevation={0} sx={{ p: 1.2, bgcolor: "rgba(248,249,250,0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <BadgeIcon sx={{ color: verde, fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem", mb: 0.3, display: "block" }}>
                      Rol
                    </Typography>
                    <Box sx={{
                      display: "inline-block", bgcolor: verde, color: "white",
                      px: 1.5, py: 0.4, borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700,
                    }}>
                      {tutorRole}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}