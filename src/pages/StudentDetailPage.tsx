import {
  Card,
  Descriptions,
  Table,
  Tabs,
  Button,
  message,
  Space,
  Typography,
  Tag,
} from "antd";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import {
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { logout } from "../services/authService";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SendEmailModal from "../components/SendEmailModal";
import EditIncidentModal from "../components/EditIncidentModal";
import { deleteIncident } from "../services/incidentManageService";
import { getActiveAcademicPeriod } from "../services/periodService";

// ✅ SIDEBAR
import AdminSidebar, { drawerWidth } from "../components/AdminSidebar";
import { listCareerCards, type CareerCardDto } from "../services/adminCareerCardsService";
import { useActivePeriod } from "../hooks/useActivePeriod";
import { useTheme, useMediaQuery } from "@mui/material";

// ✅ MUI para el dialog de logout y eliminar
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import { Typography as MuiTypography, Button as MuiButton } from "@mui/material";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

// ─── Intervalo de polling: cada 10 segundos se re-fetcha automáticamente ───
const POLLING_INTERVAL_MS = 10_000;

// ─── Formatea ISO timestamp → "27 Feb 2026" (sin hora) ────────────────────
function formatDate(raw: string): string {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("es-EC", {
      day:   "2-digit",
      month: "short",
      year:  "numeric",
    });
  } catch {
    return raw;
  }
}

type IncidentDto = {
  id: number;
  stage: string;
  date: string;
  reason: string;
  action: string;
  createdAt: string;
};

type ObservationDto = {
  id: number;
  author: string;
  text: string;
  createdAt: string;
};

type StudentDetailDto = {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  corte: string;
  section: string;
  modality?: string | null;
  career: string;
  titulationType: string;
  status: string;
  incidentCount: number;
  observationCount: number;
  incidents: IncidentDto[];
  observations: ObservationDto[];
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const queryClient = useQueryClient();
  const activePeriod = useActivePeriod();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Dialog cerrar sesión
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ✅ Dialog eliminar incidencia
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; incident: IncidentDto | null }>({
    open: false, incident: null,
  });

  const selectedPeriodId: number | "ALL" = useMemo(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (ls && ls !== "ALL" && Number.isFinite(Number(ls))) return Number(ls);
    return activePeriod.periodId ?? "ALL";
  }, [activePeriod.periodId]);

  const { data: careerCards = [] } = useQuery<CareerCardDto[]>({
    queryKey: ["careerCards", selectedPeriodId],
    queryFn: () => {
      const pid = selectedPeriodId === "ALL" ? (activePeriod.periodId ?? undefined) : selectedPeriodId;
      return listCareerCards(pid);
    },
    enabled: !activePeriod.loading,
  });

  const periodIdFromUrlOrLs = useMemo(() => {
    const q = sp.get("periodId");
    if (q && !Number.isNaN(Number(q))) return Number(q);
    const ls = localStorage.getItem("periodId");
    if (ls && !Number.isNaN(Number(ls))) return Number(ls);
    return null;
  }, [sp]);

  const [emailOpen, setEmailOpen] = useState(false);
  const [editIncOpen, setEditIncOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentDto | null>(null);
  const [resolvedPeriodId, setResolvedPeriodId] = useState<number | null>(periodIdFromUrlOrLs);

  const resolvePeriod = useCallback(async () => {
    if (resolvedPeriodId) return resolvedPeriodId;
    try {
      const p = await getActiveAcademicPeriod();
      if (p?.id) {
        localStorage.setItem("periodId", String(p.id));
        setResolvedPeriodId(p.id);
        return p.id;
      }
    } catch {}
    return null;
  }, [resolvedPeriodId]);

  const { data, isLoading: loading } = useQuery<StudentDetailDto | null>({
    queryKey: ["studentDetail", id, resolvedPeriodId],
    queryFn: async () => {
      if (!id) return null;
      const pid = await resolvePeriod();
      if (!pid) {
        message.warning("No hay período académico activo.");
        return null;
      }
      const res = await api.get<StudentDetailDto>(`/admin/students/${id}`, {
        params: { periodId: pid },
      });
      return {
        ...res.data,
        incidents: res.data.incidents || [],
        observations: res.data.observations || [],
      };
    },
    enabled: !!id,
    retry: false,
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ studentId, incidentId, pid }: { studentId: number; incidentId: number; pid: number }) =>
      deleteIncident(studentId, incidentId, pid),
    onSuccess: (res) => {
      message.success(`Incidencia eliminada ✅ (Estado: ${res?.studentStatus ?? "OK"})`);
      queryClient.invalidateQueries({ queryKey: ["studentDetail", id] });
      setDeleteDialog({ open: false, incident: null });
    },
    onError: (e: any) => {
      message.error(e?.response?.data?.message ?? "No se pudo eliminar");
      setDeleteDialog({ open: false, incident: null });
    },
  });

  const confirmDelete = () => {
    const inc = deleteDialog.incident;
    const pid = resolvedPeriodId || Number(localStorage.getItem("periodId"));
    if (!inc || !pid || !data?.id) { message.warning("Falta periodId activo."); return; }
    deleteMutation.mutate({ studentId: data.id, incidentId: inc.id, pid });
  };

  useEffect(() => {
    setResolvedPeriodId(periodIdFromUrlOrLs);
  }, [periodIdFromUrlOrLs]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f7f6" }}>

      {/* SIDEBAR — permanente en sm+, drawer en mobile */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => setLogoutOpen(true)}
        verde={VERDE_INSTITUCIONAL}
        careerCards={careerCards}
        selectedPeriodId={selectedPeriodId}
      />

      {/* CONTENIDO — se desplaza a la derecha del sidebar en sm+ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "100vh",
        overflow: "hidden",
      }}>

        {/* HEADER */}
        <div
          style={{
            backgroundColor: VERDE_INSTITUCIONAL,
            height: 60,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 20px",
            borderBottom: "4px solid #fff",
            flexShrink: 0,
          }}
        >
          {/* ✅ Hamburguesa SOLO en mobile */}
          {isMobile && (
            <Button
              icon={<MenuOutlined />}
              onClick={() => setSidebarOpen(true)}
              style={{
                borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#fff",
                fontWeight: 700,
              }}
            />
          )}
          <Title level={4} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
            Panel Administrativo · Historial Académico
          </Title>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div style={{ flex: 1, padding: "30px 40px", overflowY: "auto" }}>
          <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

            <Card
              style={{ marginBottom: 20, borderRadius: "15px", border: "none" }}
              bodyStyle={{ padding: "12px 20px" }}
            >
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Space>
                  <Tag style={{ borderRadius: 999, padding: "2px 10px" }}>
                    Periodo: <b>{resolvedPeriodId ?? "NO ACTIVO"}</b>
                  </Tag>
                  <Button
                    type="primary"
                    icon={<MailOutlined />}
                    onClick={() => setEmailOpen(true)}
                    disabled={!data}
                    style={{ backgroundColor: VERDE_INSTITUCIONAL, borderRadius: "8px" }}
                  >
                    Notificar al Estudiante
                  </Button>
                </Space>
              </div>
            </Card>

            <Card
              loading={loading}
              style={{ borderRadius: "20px", border: "none", overflow: "hidden" }}
              bodyStyle={{ padding: 0 }}
            >
              {data && (
                <>
                  <div style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "15px 25px", color: "white" }}>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", fontWeight: 700 }}>
                      DETALLES DEL ALUMNO
                    </Text>
                    <Title level={4} style={{ color: "white", margin: 0 }}>
                      {data.firstName} {data.lastName}
                    </Title>
                  </div>

                  <div style={{ padding: "30px" }}>
                    <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                      <Descriptions.Item label="Cédula">{data.dni}</Descriptions.Item>
                      <Descriptions.Item label="Correo">{data.email}</Descriptions.Item>
                      <Descriptions.Item label="Carrera">{data.career}</Descriptions.Item>
                      <Descriptions.Item label="Periodo">{data.corte}</Descriptions.Item>
                      <Descriptions.Item label="Sección">{data.section || "N/A"}</Descriptions.Item>
                      <Descriptions.Item label="Modalidad">{data.modality || "PRESENCIAL"}</Descriptions.Item>
                      <Descriptions.Item label="Titulación">{data.titulationType}</Descriptions.Item>
                      <Descriptions.Item label="Estado">
                        <Tag>{data.status}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Incidencias totales">{data.incidents.length}</Descriptions.Item>
                      <Descriptions.Item label="Total de observaciones">{data.observations.length}</Descriptions.Item>
                    </Descriptions>

                    <Tabs
                      style={{ marginTop: 30 }}
                      items={[
                        {
                          key: "inc",
                          label: `Incidencias (${data.incidents.length})`,
                          children: (
                            <div style={{ overflowX: "auto" }}>
                              <Table
                                rowKey="id"
                                dataSource={data.incidents}
                                pagination={{ pageSize: 5 }}
                                size="small"
                                scroll={{ x: "max-content" }}
                                columns={[
                                  { title: "Etapa",  dataIndex: "stage",  width: 90,  ellipsis: true },
                                  {
                                    title: "Fecha",
                                    dataIndex: "date",
                                    width: 110,
                                    render: (v: string) => formatDate(v),
                                  },
                                  { title: "Motivo", dataIndex: "reason", width: 140, ellipsis: true },
                                  { title: "Acción", dataIndex: "action", width: 120, ellipsis: true },
                                  {
                                    title: "Creado",
                                    dataIndex: "createdAt",
                                    width: 120,
                                    render: (v: string) => formatDate(v),
                                  },
                                  {
                                    title: "Acciones",
                                    key: "actions",
                                    width: 90,
                                    render: (_: any, inc: IncidentDto) => (
                                      <Space>
                                        <Button
                                          size="small"
                                          icon={<EditOutlined />}
                                          onClick={() => { setEditingIncident(inc); setEditIncOpen(true); }}
                                        />
                                        {/* ✅ Reemplazado Popconfirm por Dialog MUI */}
                                        <Button
                                          size="small"
                                          danger
                                          icon={<DeleteOutlined />}
                                          loading={deleteMutation.isPending && deleteDialog.incident?.id === inc.id}
                                          onClick={() => setDeleteDialog({ open: true, incident: inc })}
                                        />
                                      </Space>
                                    ),
                                  },
                                ]}
                                locale={{ emptyText: "No hay incidencias registradas" }}
                              />
                            </div>
                          ),
                        },
                        {
                          key: "obs",
                          label: `Observaciones (${data.observations.length})`,
                          children: (
                            <div style={{ overflowX: "auto" }}>
                              <Table
                                rowKey="id"
                                dataSource={data.observations}
                                pagination={{ pageSize: 5 }}
                                size="small"
                                scroll={{ x: "max-content" }}
                                columns={[
                                  { title: "Autor",       dataIndex: "author",    width: 130, ellipsis: true },
                                  { title: "Observación", dataIndex: "text",      width: 240, ellipsis: true },
                                  {
                                    title: "Fecha",
                                    dataIndex: "createdAt",
                                    width: 120,
                                    render: (v: string) => formatDate(v),
                                  },
                                ]}
                                locale={{ emptyText: "No hay observaciones registradas" }}
                              />
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                </>
              )}
            </Card>

          </div>
        </div>

        {/* FOOTER */}
        <div style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "12px", textAlign: "center", flexShrink: 0 }}>
          <Text style={{ color: "#fff", fontSize: "11px" }}>
            © 2026 INSTITUTO SUPERIOR TECNOLÓGICO SUDAMERICANO — SISTEMA DE CONTROL
          </Text>
        </div>

      </div>

      <SendEmailModal
        open={emailOpen}
        studentId={data?.id || 0}
        studentEmail={data?.email || ""}
        onClose={() => setEmailOpen(false)}
      />

      {data && (
        <EditIncidentModal
          open={editIncOpen}
          onClose={() => setEditIncOpen(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["studentDetail", id] })}
          periodId={(resolvedPeriodId || Number(localStorage.getItem("periodId")))!}
          studentId={data.id}
          incident={editingIncident}
        />
      )}

      {/* ── DIALOG ELIMINAR INCIDENCIA ─────────────────────────────────────── */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, incident: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px" } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pt: 3, px: 3, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#d32f2f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <DeleteIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <MuiTypography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>Eliminar incidencia</MuiTypography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <MuiTypography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas eliminar esta incidencia? Esta acción no se puede deshacer.
          </MuiTypography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <MuiButton
            onClick={() => setDeleteDialog({ open: false, incident: null })}
            variant="outlined"
            fullWidth
            sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 700, borderColor: "#ccc", color: "#555", py: 1.2, "&:hover": { borderColor: "#aaa", bgcolor: "#f9f9f9" } }}
          >
            Cancelar
          </MuiButton>
          <MuiButton
            onClick={confirmDelete}
            variant="contained"
            fullWidth
            disabled={deleteMutation.isPending}
            sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 700, bgcolor: "#d32f2f", py: 1.2, "&:hover": { bgcolor: "#b71c1c" } }}
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG CERRAR SESIÓN ─────────────────────────────────────────────── */}
      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(0,139,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogoutIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
          </Box>
          <MuiTypography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>Cerrar sesión</MuiTypography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <MuiTypography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas cerrar sesión? Tu sesión actual se terminará.
          </MuiTypography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <MuiButton onClick={() => setLogoutOpen(false)} variant="outlined" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555" }}>
            Cancelar
          </MuiButton>
          <MuiButton onClick={() => { logout(); nav("/"); }} variant="contained" fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, "&:hover": { bgcolor: "#006666" } }}>
            Cerrar sesión
          </MuiButton>
        </DialogActions>
      </Dialog>

    </div>
  );
}