import {
  Button, Input, Space, Table, Tag, Typography, Dropdown, Select,
} from "antd";
import { useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listStudents } from "../services/adminStudentService";
import { listCareerCards } from "../services/adminCareerCardsService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";
import {
  SearchOutlined, UserSwitchOutlined,
  InfoCircleOutlined,
  DownOutlined, MenuOutlined,
} from "@ant-design/icons";

import {
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { Button as MuiButton, Typography as MuiTypography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PublicIcon from "@mui/icons-material/Public";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import { useQuery } from "@tanstack/react-query";

import logoImg from "../assets/imagenes/LogoTec-Photoroom.png";
import AssignStudentModal from "../components/AssignStudentModal";
import AdminSidebar from "../components/AdminSidebar";

const { Text } = Typography;
const { Option } = Select;
const VERDE_INSTITUCIONAL = "#008B8B";

const POLLING_INTERVAL_MS = 5_000;

function sectionTag(section?: string) {
  const v = (section ?? "").toUpperCase();
  if (v.includes("MATU")) return <Tag color="cyan" style={{ borderRadius: 20, fontWeight: 600 }}>MATUTINA</Tag>;
  if (v.includes("VESP")) return <Tag color="orange" style={{ borderRadius: 20, fontWeight: 600 }}>VESPERTINA</Tag>;
  if (v.includes("NOCT")) return <Tag color="geekblue" style={{ borderRadius: 20, fontWeight: 600 }}>NOCTURNA</Tag>;
  return <Tag style={{ borderRadius: 20 }}>{section ?? "-"}</Tag>;
}

function statusTag(status?: string) {
  const v = (status ?? "").toUpperCase();
  if (v.includes("EN_CURSO")) return <Tag color="processing" bordered={false} style={{ borderRadius: 20 }}>EN CURSO</Tag>;
  if (v.includes("APROB")) return <Tag color="success" bordered={false} style={{ borderRadius: 20 }}>APROBADO</Tag>;
  if (v.includes("REPROB")) return <Tag color="error" bordered={false} style={{ borderRadius: 20 }}>REPROBADO</Tag>;
  return <Tag bordered={false} style={{ borderRadius: 20 }}>{status ?? "-"}</Tag>;
}

export default function AdminStudentsByCareerPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const careerId = Number(searchParams.get("careerId"));
  const periodIdFromUrl = searchParams.get("periodId");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [openAssign, setOpenAssign] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [anchorElTec, setAnchorElTec] = useState<null | HTMLElement>(null);
  const openTec = Boolean(anchorElTec);

  const [logoutOpen, setLogoutOpen] = useState(false);

  const getSelectedPeriodId = useCallback(() => {
    if (periodIdFromUrl && Number.isFinite(Number(periodIdFromUrl))) return Number(periodIdFromUrl);
    const pidStr = localStorage.getItem("adminPeriodId");
    return pidStr ? Number(pidStr) : undefined;
  }, [periodIdFromUrl]);

  const { data: rows = [], isLoading: loading } = useQuery<AdminStudentRow[]>({
    queryKey: ["adminStudents", careerId, periodIdFromUrl],
    queryFn: async () => {
      const pid = getSelectedPeriodId();
      const data = await listStudents(pid);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!careerId,
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const { data: careersList = [] } = useQuery<any[]>({
    queryKey: ["careerCards", getSelectedPeriodId()],
    queryFn: async () => {
      const pid = getSelectedPeriodId();
      const res = await listCareerCards(pid);
      return Array.isArray(res) ? res : [];
    },
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const filtered = useMemo(() => {
    let result = rows.filter((r: any) => Number(r.careerId) === careerId);
    if (filterSection) result = result.filter((r: any) => (r.section ?? "").toUpperCase().includes(filterSection));
    if (filterStatus) result = result.filter((r: any) => (r.status ?? "").toUpperCase().includes(filterStatus));
    const s = q.trim().toLowerCase();
    if (s) result = result.filter(r => String(r.dni).toLowerCase().includes(s) || `${r.firstName} ${r.lastName}`.toLowerCase().includes(s));
    return result;
  }, [rows, careerId, q, filterSection, filterStatus]);

  const columns = [
    { title: "Cédula", dataIndex: "dni", width: 120, render: (v: string) => <Text strong>{v}</Text> },
    { title: "Nombres", dataIndex: "firstName", width: 160 },
    { title: "Apellidos", dataIndex: "lastName", width: 160 },
    {
      title: "Carrera", dataIndex: "careerId", width: 220,
      render: (cid: number) => {
        const name = careersList.find((c: any) => c.id === cid)?.name;
        return <Text style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}>{name ? name.toUpperCase() : "NO ASIGNADA"}</Text>;
      }
    },
    { title: "Sección", dataIndex: "section", width: 130, render: (v: string) => sectionTag(v) },
    {
      title: "Estado",
      dataIndex: "status",
      width: 130,
      render: (v: string) => statusTag(v),
    },
    {
      title: "Acción", width: 160,
      render: (_: any, row: any) => (
        <Space size="middle">
          <Tooltip title="Mayor información" arrow>
            <Button
              type="text"
              shape="circle"
              icon={<InfoCircleOutlined style={{ color: VERDE_INSTITUCIONAL }} />}
              onClick={() => nav(`/admin/students/${row.id}`)}
            />
          </Tooltip>
          <Button
            size="small"
            shape="round"
            icon={<UserSwitchOutlined />}
            style={{ backgroundColor: "#0b7f7a", color: "white", border: "none" }}
            onClick={() => { setSelectedStudentId(row.id); setOpenAssign(true); }}
          >
            Asignar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "#f0f2f5" }}>
      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: ${VERDE_INSTITUCIONAL} !important;
          color: white !important;
          font-weight: 800 !important;
        }
        .green-border-left {
          border-left: 5px solid ${VERDE_INSTITUCIONAL} !important;
        }
      `}</style>

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => setLogoutOpen(true)}
        verde={VERDE_INSTITUCIONAL}
        careerCards={careersList}
        selectedPeriodId={getSelectedPeriodId() || "ALL"}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <Box sx={{
          bgcolor: VERDE_INSTITUCIONAL,
          height: 59.1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: "20px",
          borderBottom: "2.5px solid #fff",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          flexShrink: 0,
        }}>
          <Space size="large">
            <Box sx={{ display: { xs: "block", sm: "none" } }}>
              <Button
                type="text"
                icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />}
                onClick={() => setSidebarOpen(true)}
              />
            </Box>

            <img
              src={logoImg}
              alt="TEC"
              style={{ height: "46px", cursor: "pointer" }}
              onClick={(e) => setAnchorElTec(e.currentTarget)}
            />

            <Menu anchorEl={anchorElTec} open={openTec} onClose={() => setAnchorElTec(null)}>
              <MenuItem
                sx={{ color: VERDE_INSTITUCIONAL, fontWeight: 600, "& svg": { color: VERDE_INSTITUCIONAL } }}
                onClick={() => { window.open("https://its.academicok.com/login?next=/", "_blank"); setAnchorElTec(null); }}
              >
                <PublicIcon sx={{ mr: 1 }} /> SGA
              </MenuItem>
              <MenuItem
                sx={{ color: VERDE_INSTITUCIONAL, fontWeight: 600, "& svg": { color: VERDE_INSTITUCIONAL } }}
                onClick={() => { window.open("https://eva.sudamericano.edu.ec/login/index.php", "_blank"); setAnchorElTec(null); }}
              >
                <MenuBookIcon sx={{ mr: 1 }} /> EVA
              </MenuItem>
            </Menu>
          </Space>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, p: "15px 10px", display: "flex", justifyContent: "center", overflowY: "auto", overflowX: "hidden" }}>
          <Box sx={{ width: "100%", maxWidth: "1300px", display: "flex", flexDirection: "column" }}>

            {/* ✅ BARRA DE FILTROS RESPONSIVE */}
            <div className="search-container green-border-left" style={{
              backgroundColor: "#fff",
              padding: "12px 16px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              marginBottom: "15px",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? "10px" : "0",
            }}>

              {/* Fila 1 móvil: Búsqueda */}
              <Input
                allowClear
                value={q}
                onChange={(e) => setQ(e.target.value)}
                prefix={<SearchOutlined style={{ color: VERDE_INSTITUCIONAL }} />}
                placeholder="Buscar estudiante..."
                style={{
                  width: isMobile ? "100%" : "350px",
                  borderRadius: 30,
                }}
              />

              {/* Fila 2 móvil: Estado + Sesiones lado a lado */}
              <div style={{
                display: "flex",
                gap: "8px",
                width: isMobile ? "100%" : "auto",
                alignItems: "center",
              }}>
                <Select
                  placeholder="Estado"
                  style={{ flex: isMobile ? 1 : undefined, width: isMobile ? undefined : 180 }}
                  allowClear
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val)}
                >
                  <Option value="EN_CURSO">EN CURSO</Option>
                  <Option value="APROB">APROBADO</Option>
                  <Option value="REPROB">REPROBADO</Option>
                </Select>

                <Dropdown menu={{
                  items: [
                    { key: "null", label: "TODOS", onClick: () => setFilterSection(null) },
                    { key: "MATU", label: "MATUTINA", onClick: () => setFilterSection("MATU") },
                    { key: "VESP", label: "VESPERTINA", onClick: () => setFilterSection("VESP") },
                    { key: "NOCT", label: "NOCTURNA", onClick: () => setFilterSection("NOCT") },
                  ]
                }} trigger={["click"]}>
                  <Button
                    shape="round"
                    icon={<DownOutlined />}
                    style={{
                      color: VERDE_INSTITUCIONAL,
                      fontWeight: 700,
                      flex: isMobile ? 1 : undefined,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {filterSection ? `${filterSection}` : "SESIONES"}
                  </Button>
                </Dropdown>
              </div>
            </div>

            <div className="green-border-left" style={{ flex: 1, overflow: "hidden", backgroundColor: "white", borderRadius: "12px" }}>
              <Table<AdminStudentRow>
                className="custom-table"
                rowKey="id"
                loading={loading}
                dataSource={filtered}
                columns={columns}
                size="middle"
                scroll={{ x: "max-content", y: "calc(100vh - 310px)" }}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                rowClassName={(record: any) =>
                  (record.status ?? "").toUpperCase().includes("REPROB") ? "row-reprobado" : ""
                }
              />
            </div>
          </Box>
        </Box>

        {/* FOOTER */}
        <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, height: "35px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Text style={{ color: "#fff", fontSize: "11px", fontWeight: 600 }}>© 2026 ISTS</Text>
        </Box>
      </Box>

      {/* DIALOG CERRAR SESIÓN */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(0,139,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogoutIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
          </Box>
          <MuiTypography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
            Cerrar sesión
          </MuiTypography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <MuiTypography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas cerrar sesión? Tu sesión actual se terminará.
          </MuiTypography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <MuiButton
            onClick={() => setLogoutOpen(false)}
            variant="outlined"
            fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555", "&:hover": { borderColor: "#bbb", bgcolor: "#f9f9f9" } }}
          >
            Cancelar
          </MuiButton>
          <MuiButton
            onClick={() => { logout(); nav("/"); }}
            variant="contained"
            fullWidth
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, "&:hover": { bgcolor: "#006666" } }}
          >
            Cerrar sesión
          </MuiButton>
        </DialogActions>
      </Dialog>

      <AssignStudentModal
        open={openAssign}
        studentId={selectedStudentId}
        onClose={() => setOpenAssign(false)}
        onSuccess={() => {}}
      />
    </Box>
  );
}