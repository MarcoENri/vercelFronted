import {
  Button,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  Dropdown,
  Select,
  Avatar,
} from "antd";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listStudents } from "../services/adminStudentService";
import { listCareerCards } from "../services/adminCareerCardsService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";
import {
  ReloadOutlined,
  SearchOutlined,
  UserSwitchOutlined,
  GlobalOutlined,
  BookOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UserOutlined,
  MenuOutlined,
} from "@ant-design/icons";

import logoImg from "../assets/imagenes/LogoTec-Photoroom.png";
import AssignStudentModal from "../components/AssignStudentModal";
import AdminSidebar from "../components/SidebarAdmin/AdminSidebar";

const { Text } = Typography;
const { Option } = Select;
const VERDE_INSTITUCIONAL = "#008B8B";

const API_URL = "http://localhost:8081";

/* ===================== FUNCIONES DE FORMATO ===================== */

function sectionTag(section?: string) {
  const v = (section ?? "").toUpperCase();
  if (v.includes("DIUR")) return <Tag color="cyan" style={{ borderRadius: 20, fontWeight: 600 }}>DIURNA</Tag>;
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

/* ===================== COMPONENTE PRINCIPAL ===================== */

export default function AdminStudentsByCareerPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  
  const careerId = Number(searchParams.get("careerId"));
  const periodIdFromUrl = searchParams.get("periodId");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [careersList, setCareersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const [q, setQ] = useState("");
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [openAssign, setOpenAssign] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const getSelectedPeriodId = useCallback(() => {
    if (periodIdFromUrl && Number.isFinite(Number(periodIdFromUrl))) return Number(periodIdFromUrl);
    const pidStr = localStorage.getItem("adminPeriodId");
    return pidStr ? Number(pidStr) : undefined;
  }, [periodIdFromUrl]);

  const loadInitialData = async () => {
    try {
      const pid = getSelectedPeriodId();
      const res = await listCareerCards(pid);
      setCareersList(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Error al cargar carreras", e);
    }
  };

  const loadStudents = useCallback(async () => {
    if (!careerId) return;
    setLoading(true);
    try {
      const pid = getSelectedPeriodId();
      const data = await listStudents(pid);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        logout();
        nav("/");
      }
    } finally {
      setLoading(false);
    }
  }, [careerId, getSelectedPeriodId, nav]);

  useEffect(() => {
    loadStudents();
    loadInitialData();
    setQ("");
    setFilterSection(null);
    setFilterStatus(null);
  }, [careerId, periodIdFromUrl, loadStudents]);

  const filtered = useMemo(() => {
    let result = rows.filter((r: any) => Number(r.careerId) === careerId);
    
    if (filterSection) result = result.filter((r: any) => (r.section ?? "").toUpperCase().includes(filterSection));
    if (filterStatus) result = result.filter((r: any) => (r.status ?? "").toUpperCase().includes(filterStatus));
    
    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter(r => 
        String(r.dni).toLowerCase().includes(s) || 
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(s)
      );
    }
    return result;
  }, [rows, careerId, q, filterSection, filterStatus]);

  const columns = [
    
    { title: "DNI/CÉDULA", dataIndex: "dni", width: 120, render: (v: string) => <Text strong>{v}</Text> },
    { title: "Nombres", dataIndex: "firstName", width: 160 },
    { title: "Apellidos", dataIndex: "lastName", width: 160 },
   {
  title: "Carrera",
  dataIndex: "careerId",
  width: 220,
  render: (careerId: number) => {
    const careerName = careersList.find(c => c.id === careerId)?.name;
    return (
      <Text style={{ fontSize: "12px", color: "#555", fontWeight: 500 }}>
        {careerName ? careerName.toUpperCase() : "NO ASIGNADA"}
      </Text>
    );
  }
},


    { title: "Sección", dataIndex: "section", width: 130, render: (v: string) => sectionTag(v) },
    { title: "Estado", dataIndex: "status", width: 130, render: (v: string) => statusTag(v) },
    {
      title: "Acción",
      width: 160,
      render: (_: any, row: any) => (
        <Space size="middle">
          <Button type="text" shape="circle" icon={<InfoCircleOutlined style={{ color: VERDE_INSTITUCIONAL }} />} onClick={() => nav(`/admin/students/${row.id}`)} />
          <Button size="small" shape="round" icon={<UserSwitchOutlined />} style={{ backgroundColor: "#0b7f7a", color: "white", border: "none" }} onClick={() => { setSelectedStudentId(row.id); setOpenAssign(true); }} >Asignar</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", overflow: "hidden" }}>
      <style>{`
        .custom-table .ant-table-thead > tr > th { background-color: ${VERDE_INSTITUCIONAL} !important; color: white !important; font-weight: 800 !important; }
        .green-border-left { border-left: 5px solid ${VERDE_INSTITUCIONAL} !important; }
      `}</style>

      <AdminSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={() => { logout(); nav("/"); }}
        verde={VERDE_INSTITUCIONAL}
        careerCards={careersList}
        selectedPeriodId={getSelectedPeriodId() || "ALL"}
      />

      {/* CABECERA SIN EL NOMBRE DE LA CARRERA */}
      <div style={{ backgroundColor: VERDE_INSTITUCIONAL, height: "65px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", borderBottom: "2.5px solid #fff", flexShrink: 0 }}>
        <Space size="large">
          <Button 
            type="text" 
            icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />} 
            onClick={() => setSidebarOpen(true)} 
          />
          
          <Dropdown menu={{ items: [
            { key: "sga", label: <a href="https://sudamericano.edu.ec/" target="_blank">SGA</a>, icon: <GlobalOutlined /> },
            { key: "eva", label: <a href="https://eva.sudamericano.edu.ec/" target="_blank">EVA</a>, icon: <BookOutlined /> }
          ] }} trigger={["click"]}>
            <img src={logoImg} alt="TEC" style={{ height: "35px", cursor: "pointer" }} />
          </Dropdown>
        </Space>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadStudents} loading={loading} shape="round" style={{ fontWeight: 600 }}>
            Actualizar
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, padding: "15px 10px", display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ width: "100%", maxWidth: "1300px", display: "flex", flexDirection: "column" }}>
          
          <div className="search-container green-border-left" style={{ backgroundColor: "#fff", padding: "15px 20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <Space size="large">
              <Input allowClear value={q} onChange={(e) => setQ(e.target.value)} prefix={<SearchOutlined style={{ color: VERDE_INSTITUCIONAL }} />} placeholder="Buscar estudiante..." style={{ width: "350px", borderRadius: 30 }} />
              <Select placeholder="Estado" style={{ width: 180 }} allowClear value={filterStatus} onChange={(val) => setFilterStatus(val)}>
                <Option value="EN_CURSO">EN CURSO</Option>
                <Option value="APROB">APROBADO</Option>
                <Option value="REPROB">REPROBADO</Option>
              </Select>
            </Space>
            
            <Dropdown menu={{ items: [
                { key: "null", label: "TODOS", onClick: () => setFilterSection(null) },
                { key: "DIUR", label: "DIURNA", onClick: () => setFilterSection("DIUR") },
                { key: "VESP", label: "VESPERTINA", onClick: () => setFilterSection("VESP") },
                { key: "NOCT", label: "NOCTURNA", onClick: () => setFilterSection("NOCT") },
              ] }} trigger={["click"]}>
              <Button shape="round" icon={<DownOutlined />} style={{ color: VERDE_INSTITUCIONAL, fontWeight: 700 }}>
                {filterSection ? `SESIÓN: ${filterSection}` : "SESIONES"}
              </Button>
            </Dropdown>
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
            />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: VERDE_INSTITUCIONAL, height: "35px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Text style={{ color: "#fff", fontSize: "11px", fontWeight: 600 }}>© 2026 ISTS</Text>
      </div>

      <AssignStudentModal open={openAssign} studentId={selectedStudentId} onClose={() => setOpenAssign(false)} onSuccess={loadStudents} />
    </div>
  );
}