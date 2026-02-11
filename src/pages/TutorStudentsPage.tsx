import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
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
  Avatar,
  Drawer,
  IconButton,
  Divider,
  Stack,
  Paper,
  Fade,
} from "@mui/material";
import {
  Logout as LogoutOutlined,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  AccountCircle as AccountCircleIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";

// --- LÓGICA REACTIVA ---
import { useQuery } from "@tanstack/react-query";

import { logout } from "../services/authService";
import type { TutorStudentRow } from "../services/tutorService";
import { listTutorStudents } from "../services/tutorService";
import { useActivePeriod } from "../hooks/useActivePeriod";

// Componente Sidebar del Tutor
import TutorSidebar from "../components/TutorSidebar/TutorSidebar";
import type { UserResponse } from "../services/adminUserService";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function TutorStudentsPage() {
  const nav = useNavigate();
  const ap = useActivePeriod();

  // ESTADOS
  const [drawerOpen, setDrawerOpen] = useState(false); 
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ⚡ CAPA REACTIVA AUTOMÁTICA ---
  const { data: rows = [], isLoading: loading } = useQuery<TutorStudentRow[]>({
    queryKey: ["tutorStudents", ap.periodId],
    queryFn: () => listTutorStudents(ap.periodId!),
    enabled: !!ap.periodId,
    refetchInterval: 5000, 
    staleTime: 0,
  });

  // ✅ TutorInfo con validaciones de seguridad
  const tutorInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return { username: "", name: "Usuario", email: "", role: "Tutor" };

    try {
      const user: UserResponse = JSON.parse(userStr);
      const role = user.roles && user.roles.length > 0
          ? user.roles[0].replace("ROLE_", "")
          : "Tutor";

      return {
        username: user.username || "",
        name: user.fullName || "Usuario",
        email: user.email || "",
        role,
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { username: "", name: "Usuario", email: "", role: "Tutor" };
    }
  }, []);

  // 🔥 AJUSTE 1: Iniciales Dinámicas (2 letras)
  const getInitials = () => {
    const name = tutorInfo.name?.trim();
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  useEffect(() => {
    const savedPhoto = localStorage.getItem("tutorPhoto");
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    logout();
    nav("/");
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        setPhotoPreview(photoData);
        localStorage.setItem("tutorPhoto", photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "EN_CURSO") return { bg: "#1976d2", text: "white" };
    if (status === "REPROBADO") return { bg: "#d32f2f", text: "white" };
    return { bg: "#2e7d32", text: "white" }; // APROBADO
  };

  if (ap.loading) return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress sx={{ color: VERDE_INSTITUCIONAL }} />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      
      {/* 🟢 Sidebar Panel Fijo (Como Coordinador) */}
      <Box sx={{ width: 260, flexShrink: 0, borderRight: "1px solid #e1e8ed" }}>
        <TutorSidebar 
  onLogout={handleLogout}
  verde={VERDE_INSTITUCIONAL}
  periodId={ap.periodId}
/>

      </Box>

      {/* Contenedor de Contenido */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* 🔥 Header con maxWidth y sin botón hamburguesa */}
        <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 2, px: 3, boxShadow: 1 }}>
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            maxWidth: "1200px",
            mx: "auto",
            width: "100%"
          }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>
                Mis Estudiantes
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Listado general — Periodo: {ap.periodId || "16"}
              </Typography>
            </Box>

            <Avatar 
              onClick={() => setDrawerOpen(true)}
              src={photoPreview || undefined} 
              sx={{ 
                width: 38, height: 38, cursor: "pointer", 
                border: "2px solid white", bgcolor: "white", 
                color: VERDE_INSTITUCIONAL, fontSize: "0.95rem", fontWeight: 800,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            >
              {getInitials()}
            </Avatar>
          </Box>
        </Box>

        {/* CONTENIDO DE LA TABLA */}
        <Box sx={{ flex: 1, py: 4 }}>
          <Container maxWidth="lg">
            <Fade in={!loading} timeout={500}>
              <Card sx={{ 
                borderRadius: "12px", 
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)", 
                border: "1px solid #e1e8ed",
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ p: 3, borderBottom: "1px solid #eee", bgcolor: "#fff" }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>
                      Listado General
                    </Typography>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: VERDE_INSTITUCIONAL }}>
                          {['Inicial', 'DNI', 'Nombres', 'Apellidos', 'Carrera', 'Corte', 'Sección', 'Estado'].map((head) => (
                            <TableCell key={head} sx={{ color: "white", fontWeight: 800, fontSize: '0.85rem', py: 1.2, border: 'none' }} align="center">
                              {head}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 6, color: "#999", fontStyle: 'italic' }}>
                              No hay estudiantes asignados en este periodo.
                            </TableCell>
                          </TableRow>
                        ) : (
                          rows.map((row) => {
                            const statusStyle = getStatusColor(row.status);
                            return (
                              <TableRow 
                                key={row.id} 
                                hover
                                onClick={() => nav(`/tutor/students/${row.id}`)}
                                sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8f9fa" }, transition: '0.2s' }}
                              >
                                <TableCell align="center">
                                  <Avatar sx={{ bgcolor: VERDE_INSTITUCIONAL, width: 30, height: 30, fontSize: "0.8rem", mx: "auto", fontWeight: 700 }}>
                                    {row.firstName?.charAt(0) || "E"}
                                  </Avatar>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{row.dni}</TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{row.firstName}</TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{row.lastName}</TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.85rem', color: '#666' }}>{row.career}</TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.85rem', color: '#777' }}>{row.corte || "-"}</TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{row.section || "MATUTINA"}</TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={row.status} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: statusStyle.bg, 
                                      color: statusStyle.text,
                                      fontWeight: 900, 
                                      fontSize: '0.65rem',
                                      borderRadius: "8px",
                                      height: 20
                                    }} 
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Fade>
          </Container>
        </Box>

        {/* FOOTER */}
        <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 1.5, textAlign: "center" }}>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            © 2025 - Panel de Coordinación
          </Typography>
        </Box>
      </Box>

      {/* DRAWER PERFIL (DERECHA) */}
      <Drawer 
        anchor="right" 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 340, bgcolor: "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(8px)" } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>Mi Perfil</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
          </Box>

          <Box sx={{ flex: 1, p: 3, textAlign: 'center' }}>
            <Avatar
              src={photoPreview || undefined}
              sx={{ width: 90, height: 90, mx: "auto", mb: 2, bgcolor: VERDE_INSTITUCIONAL, border: "4px solid #f0f2f5", fontSize: "2rem", fontWeight: 800 }}
            >
              {getInitials()}
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{tutorInfo.name}</Typography>
            <Chip label={tutorInfo.role} size="small" sx={{ mt: 1, bgcolor: VERDE_INSTITUCIONAL, color: 'white', fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
            
            <Divider sx={{ my: 3 }} />

            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "12px", textAlign: 'left', bgcolor: '#fafafa' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>USUARIO</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{tutorInfo.username}</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "12px", textAlign: 'left', bgcolor: '#fafafa' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>CORREO</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{tutorInfo.email}</Typography>
              </Paper>
            </Stack>

            <Button 
              fullWidth 
              variant="contained" 
              color="error" 
              onClick={handleLogout} 
              sx={{ mt: 4, borderRadius: '10px', py: 1.2, fontWeight: 800, textTransform: 'none' }}
              startIcon={<LogoutOutlined />}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}