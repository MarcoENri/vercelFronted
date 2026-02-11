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
  Popconfirm,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import {
  ArrowLeftOutlined,
  MailOutlined,
  ReloadOutlined,
  LogoutOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { logout } from "../services/authService";

// ✅ IMPORTES PARA REACTIVIDAD
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ✅ modal email
import SendEmailModal from "../components/SendEmailModal";

// ✅ modal editar incidencia + service eliminar
import EditIncidentModal from "../components/EditIncidentModal";
import { deleteIncident } from "../services/incidentManageService";

// ✅ opcional: si ya tienes este service (lo usaste en coordinator)
import { getActiveAcademicPeriod } from "../services/periodService";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

/* ===================== TIPOS DE DATOS ===================== */
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

  // ✅ periodId: query -> localStorage -> null
  const periodIdFromUrlOrLs = useMemo(() => {
    const q = sp.get("periodId");
    if (q && !Number.isNaN(Number(q))) return Number(q);

    const ls = localStorage.getItem("periodId");
    if (ls && !Number.isNaN(Number(ls))) return Number(ls);

    return null;
  }, [sp]);

  const [emailOpen, setEmailOpen] = useState(false);

  // ✅ editar incidencia
  const [editIncOpen, setEditIncOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentDto | null>(null);

  // ✅ periodo real que vamos a usar
  const [resolvedPeriodId, setResolvedPeriodId] = useState<number | null>(periodIdFromUrlOrLs);

  const resolvePeriod = async () => {
    if (resolvedPeriodId) return resolvedPeriodId;
    try {
      const p = await getActiveAcademicPeriod();
      if (p?.id) {
        localStorage.setItem("periodId", String(p.id));
        setResolvedPeriodId(p.id);
        return p.id;
      }
    } catch { }
    return null;
  };

  /* ===================== LÓGICA REACTIVA (Queries & Mutations) ===================== */

  // Mantenemos el nombre 'data' y 'loading' para no romper tu diseño de abajo
  const { data, isLoading: loading, refetch: load } = useQuery<StudentDetailDto | null>({
    queryKey: ["studentDetail", id, resolvedPeriodId],
    queryFn: async () => {
      if (!id) return null;
      const pid = await resolvePeriod();
      
      if (!pid) {
        message.warning("No hay período académico activo. Las incidencias/observaciones requieren un período activo.");
        return null;
      }

      console.log("🔍 Admin cargando estudiante con periodId:", pid);

      const res = await api.get<StudentDetailDto>(`/admin/students/${id}`, {
        params: { periodId: pid },
      });

      console.log("✅ Respuesta del backend:", res.data);

      return {
        ...res.data,
        incidents: res.data.incidents || [],
        observations: res.data.observations || [],
      };
    },
    enabled: !!id,
    retry: false,
  });

  // Mutación para borrar sin recargar página
  const deleteMutation = useMutation({
    mutationFn: ({ studentId, incidentId, pid }: { studentId: number, incidentId: number, pid: number }) =>
      deleteIncident(studentId, incidentId, pid),
    onSuccess: (res) => {
      message.success(`Incidencia eliminada ✅ (Estado: ${res?.studentStatus ?? "OK"})`);
      // Esto hace que la data se refresque sola
      queryClient.invalidateQueries({ queryKey: ["studentDetail", id] });
    },
    onError: (e: any) => {
      message.error(e?.response?.data?.message ?? "No se pudo eliminar");
    }
  });

  /* ===================== EFECTOS ===================== */

  useEffect(() => {
    setResolvedPeriodId(periodIdFromUrlOrLs);
  }, [periodIdFromUrlOrLs]);

  const handleLogout = () => {
    logout();
    nav("/");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      {/* HEADER */}
      <div
        style={{
          backgroundColor: VERDE_INSTITUCIONAL,
          padding: "10px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "4px solid #fff",
        }}
      >
        <Title level={4} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
          Panel Administrativo · Historial Académico
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading} style={{ borderRadius: "20px" }} />
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              borderRadius: "20px",
              fontWeight: 600,
              backgroundColor: "#fff",
              color: "#ff4d4f",
              border: "none",
            }}
          >
            Salir
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "950px" }}>
          {/* BOTONES */}
          <Card
            style={{
              marginBottom: 15,
              borderRadius: "15px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              border: "none",
            }}
            bodyStyle={{ padding: "12px 20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => nav(-1)}
                style={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  color: VERDE_INSTITUCIONAL,
                  borderColor: VERDE_INSTITUCIONAL,
                }}
              >
                Volver al listado
              </Button>

              <Space>
                <Tag style={{ borderRadius: 999, padding: "2px 10px" }}>
                  Periodo: <b>{resolvedPeriodId ?? "NO ACTIVO"}</b>
                </Tag>

                <Button
                  type="primary"
                  icon={<MailOutlined />}
                  onClick={() => setEmailOpen(true)}
                  disabled={!data}
                  style={{ backgroundColor: VERDE_INSTITUCIONAL, borderRadius: "8px", fontWeight: 600 }}
                >
                  Notificar al Estudiante
                </Button>
              </Space>
            </div>
          </Card>

          {/* CONTENIDO */}
          <Card
            loading={loading}
            style={{
              borderRadius: "20px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              border: "none",
              overflow: "hidden",
            }}
            bodyStyle={{ padding: "0" }}
          >
            {data && (
              <>
                <div style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "12px 25px", color: "white" }}>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                    }}
                  >
                    DETALLES DEL ALUMNO
                  </Text>
                  <Title level={4} style={{ color: "white", margin: 0 }}>
                    {data.firstName} {data.lastName}
                  </Title>
                </div>

                <div style={{ padding: "25px" }}>
                  <Descriptions
                    bordered
                    size="small"
                    column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                    labelStyle={{
                      backgroundColor: "#fafafa",
                      fontWeight: 700,
                      color: VERDE_INSTITUCIONAL,
                      width: "180px",
                    }}
                  >
                    <Descriptions.Item label="DNI">{data.dni}</Descriptions.Item>
                    <Descriptions.Item label="Correo">{data.email}</Descriptions.Item>
                    <Descriptions.Item label="Carrera">{data.career}</Descriptions.Item>
                    <Descriptions.Item label="Periodo">{data.corte}</Descriptions.Item>
                    <Descriptions.Item label="Sección">{data.section || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Modalidad">{data.modality || "PRESENCIAL"}</Descriptions.Item>
                    <Descriptions.Item label="Titulación">{data.titulationType || "No asignada"}</Descriptions.Item>
                    <Descriptions.Item label="Estado">
                      <Tag color={String(data.status).toUpperCase().includes("REPROB") ? "error" : "processing"}>
                        {data.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Incidencias totales">{data.incidents.length}</Descriptions.Item>
                    <Descriptions.Item label="Total de observaciones">{data.observations.length}</Descriptions.Item>
                  </Descriptions>

                  <Tabs
                    style={{ marginTop: 20 }}
                    items={[
                      {
                        key: "inc",
                        label: `Incidencias (${data.incidents.length})`,
                        children: (
                          <Table
                            rowKey="id"
                            dataSource={data.incidents}
                            pagination={{ pageSize: 5 }}
                            size="small"
                            columns={[
                              { title: "Etapa", dataIndex: "stage", key: "stage" },
                              { title: "Fecha", dataIndex: "date", key: "date" },
                              { title: "Motivo", dataIndex: "reason", key: "reason" },
                              { title: "Acción", dataIndex: "action", key: "action" },
                              { title: "Creado", dataIndex: "createdAt", key: "createdAt" },
                              {
                                title: "Acciones",
                                key: "actions",
                                width: 140,
                                render: (_: any, inc: IncidentDto) => {
                                  const pid = resolvedPeriodId || Number(localStorage.getItem("periodId"));
                                  return (
                                    <Space>
                                      <Button
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => {
                                          setEditingIncident(inc);
                                          setEditIncOpen(true);
                                        }}
                                      />
                                      <Popconfirm
                                        title="¿Eliminar incidencia?"
                                        description="Si el estudiante queda con menos de 3 incidencias, vuelve a EN_CURSO."
                                        okText="Eliminar"
                                        cancelText="Cancelar"
                                        onConfirm={() => {
                                          if (!pid || !data?.id) {
                                            message.warning("Falta periodId activo.");
                                            return;
                                          }
                                          deleteMutation.mutate({ studentId: data.id, incidentId: inc.id, pid });
                                        }}
                                      >
                                        <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                                      </Popconfirm>
                                    </Space>
                                  );
                                },
                              },
                            ]}
                            locale={{ emptyText: "No hay incidencias registradas" }}
                          />
                        ),
                      },
                      {
                        key: "obs",
                        label: `Observaciones (${data.observations.length})`,
                        children: (
                          <Table
                            rowKey="id"
                            dataSource={data.observations}
                            pagination={{ pageSize: 5 }}
                            size="small"
                            columns={[
                              { title: "Autor", dataIndex: "author", key: "author" },
                              { title: "Observación", dataIndex: "text", key: "text" },
                              { title: "Fecha", dataIndex: "createdAt", key: "createdAt" },
                            ]}
                            locale={{ emptyText: "No hay observaciones registradas" }}
                          />
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
      <div
        style={{
          backgroundColor: VERDE_INSTITUCIONAL,
          padding: "12px",
          textAlign: "center",
          borderTop: "4px solid #fff",
        }}
      >
        <Text style={{ color: "#fff", fontSize: "11px", fontWeight: 600 }}>
          © 2026 INSTITUTO SUPERIOR TECNOLÓGICO SUDAMERICANO — SISTEMA DE CONTROL
        </Text>
      </div>

      {/* ✅ MODAL EMAIL */}
      <SendEmailModal
        open={emailOpen}
        studentId={data?.id || 0}
        studentEmail={data?.email || ""}
        onClose={() => setEmailOpen(false)}
      />

      {/* ✅ MODAL EDITAR INCIDENCIA */}
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
    </div>
  );
}