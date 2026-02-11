import { Button, Card, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { activateAcademicPeriod, listAcademicPeriods, type AcademicPeriodDto } from "../services/periodService";

const { Title } = Typography;
const VERDE = "#008B8B";

export default function AdminAcademicPeriodsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AcademicPeriodDto[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAcademicPeriods();
      setRows(data);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo cargar periodos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onActivate = async (id: number) => {
    try {
      await activateAcademicPeriod(id);
      message.success("Periodo activado");
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo activar");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title={<Title level={4} style={{ margin: 0, color: VERDE }}>Períodos académicos</Title>}>
        <Table<AcademicPeriodDto>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: "Nombre", dataIndex: "name" },
            { title: "Inicio", dataIndex: "startDate", width: 120 },
            { title: "Fin", dataIndex: "endDate", width: 120 },
            {
              title: "Estado",
              dataIndex: "isActive",
              width: 120,
              render: (v: boolean) => v ? <Tag color="success">ACTIVO</Tag> : <Tag>INACTIVO</Tag>,
            },
            {
              title: "Acción",
              width: 140,
              render: (_, r) => (
                <Button
                  type="primary"
                  disabled={r.isActive}
                  onClick={() => onActivate(r.id)}
                  style={{ backgroundColor: VERDE }}
                >
                  Activar
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
