import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import { logout } from "../services/authService";
import type { CoordinatorStudentRow } from "../services/coordinatorService";
import { listCoordinatorStudents } from "../services/coordinatorService";
import { getActiveAcademicPeriod } from "../services/periodService";
import CoordinatorSidebar from "../components/Coordinatorsidebar/Coordinatorsidebar";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function CoordinatorStudentsPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const queryClient = useQueryClient();

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Información del coordinador
  const coordinatorInfo = useMemo(() => {
    const possibleKeys = ["user", "currentUser", "userData", "authUser"];
    let user = null;
    for (const key of possibleKeys) {
      const userStr = localStorage.getItem(key);
      if (userStr) {
        try {
          user = JSON.parse(userStr);
          break;
        } catch (e) {}
      }
    }
    if (!user) return { username: "", name: "", email: "", role: "Coordinador" };

    return {
      username: user.username || user.userName || user.user || user.email?.split("@")[0] || "",
      name: user.name || user.fullName || user.displayName ||
            (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "") ||
            (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : "") || "",
      email: user.email || user.correo || user.mail || "",
      role: user.role || user.rol || user.type || user.userType || "Coordinador",
    };
  }, []);

  const fallbackPeriodId = useMemo(() => {
    const q = sp.get("periodId");
    if (q && !Number.isNaN(Number(q))) return Number(q);
    const ls = localStorage.getItem("periodId");
    if (ls && !Number.isNaN(Number(ls))) return Number(ls);
    return null;
  }, [sp]);

  const [periodId, setPeriodId] = useState<number | null>(fallbackPeriodId);

  const resolvePeriod = async (): Promise<number | null> => {
    if (periodId) return periodId;
    if (fallbackPeriodId) {
      setPeriodId(fallbackPeriodId);
      return fallbackPeriodId;
    }
    try {
      const p = await getActiveAcademicPeriod();
      if (!p?.id) return null;
      localStorage.setItem("periodId", String(p.id));
      setPeriodId(p.id);
      return p.id;
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
        return null;
      }
      return null;
    }
  };

  // Query reactiva
  const { data: rows = [], isLoading: loading, refetch: load } = useQuery<CoordinatorStudentRow[]>({
    queryKey: ["students", periodId], 
    queryFn: async () => {
      const pid = await resolvePeriod();
      if (!pid) {
        return [];
      }
      return await listCoordinatorStudents(pid);
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
    onError: (e: any) => {
      console.error(e?.response?.data ?? e);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
      }
    }
  } as any);

  useEffect(() => {
    const savedPhoto = localStorage.getItem("coordinatorPhoto");
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    logout();
    nav("/");
  };

  const getStatusColor = (status: string) => {
    if (status === "EN_CURSO") return "primary";
    if (status === "REPROBADO") return "error";
    return "success";
  };

  const getDisplayName = () => coordinatorInfo?.name || coordinatorInfo?.username || "Usuario";
  const getInitials = () => {
    if (coordinatorInfo?.name) {
      const parts = coordinatorInfo.name.split(" ");
      if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      return coordinatorInfo.name.charAt(0).toUpperCase();
    }
    if (coordinatorInfo?.username) return coordinatorInfo.username.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <CoordinatorSidebar
        coordinatorName={getDisplayName()}
        coordinatorInitials={getInitials()}
        coordinatorEmail={coordinatorInfo?.email}
        coordinatorUsername={coordinatorInfo?.username}
        coordinatorRole={coordinatorInfo?.role}
        photoPreview={photoPreview}
        onLogout={handleLogout}
        onPhotoChange={setPhotoPreview}
      />

      {/* CONTENIDO PRINCIPAL */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          background: "#f0f2f5",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER VERDE */}
        <Box
          sx={{
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 2,
            px: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Mis Estudiantes
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Listado general {periodId ? `— Periodo: ${periodId}` : ""}
              </Typography>
            </Box>

            </Box>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, py: 3 }}>
          <Container maxWidth="lg">
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                borderLeft: `6px solid ${VERDE_INSTITUCIONAL}`,
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: VERDE_INSTITUCIONAL }}
                  >
                    Listado General
                  </Typography>
                </Box>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress sx={{ color: VERDE_INSTITUCIONAL }} />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL,
                              color: "white",
                              fontWeight: 900,
                              textAlign: "center",
                            }}
                          >
                            Inicial
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL,
                              color: "white",
                              fontWeight: 900,
                              textAlign: "center",
                            }}
                          >
                            DNI
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL,
                              color: "white",
                              fontWeight: 900,
                            }}
                          >
                            Nombres
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL,
                              color: "white",
                              fontWeight: 900,
                            }}
                          >
                            Apellidos
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL,
                              color: "white",
                              fontWeight: 900,
                            }}
                          >
                            Carrera
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL,
                              color: "white",
                              fontWeight: 900,
                              textAlign: "center",
                            }}
                          >
                            Corte
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL,
                              color: "white",
                              fontWeight: 900,
                              textAlign: "center",
                            }}
                          >
                            Sección
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: VERDE_INSTITUCIONAL,
                              color: "white",
                              fontWeight: 900,
                              textAlign: "center",
                            }}
                          >
                            Estado
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              align="center"
                              sx={{ py: 4, color: "#777" }}
                            >
                              No hay estudiantes registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          rows.map((row) => (
                            <TableRow
                              key={row.id}
                              onClick={() =>
                                nav(
                                  `/coordinator/students/${row.id}?periodId=${
                                    periodId ?? ""
                                  }`
                                )
                              }
                              sx={{
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f5f5f5" },
                              }}
                            >
                              <TableCell align="center">
                                <Avatar
                                  sx={{
                                    bgcolor: VERDE_INSTITUCIONAL,
                                    width: 32,
                                    height: 32,
                                    fontSize: "0.875rem",
                                    mx: "auto",
                                  }}
                                >
                                  {row.firstName?.charAt(0) || "?"}
                                </Avatar>
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>
                                {row.dni}
                              </TableCell>
                              <TableCell>{row.firstName}</TableCell>
                              <TableCell>{row.lastName}</TableCell>
                              <TableCell>{row.career}</TableCell>
                              <TableCell align="center">{row.corte}</TableCell>
                              <TableCell align="center">{row.section}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={row.status}
                                  color={getStatusColor(row.status)}
                                  size="small"
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: "0.75rem",
                                    borderRadius: "10px",
                                  }}
                                />
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
        <Box
          sx={{
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="body2">© 2025 - Panel de Coordinador</Typography>
        </Box>
      </Box>
    </Box>
  );
}