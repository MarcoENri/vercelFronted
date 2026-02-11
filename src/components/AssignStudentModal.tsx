import { Modal, Form, Select, message } from "antd";
import { useEffect, useState } from "react";
import type { UserOption } from "../services/adminLookupService";
import { listUsersByRole } from "../services/adminLookupService";
import { assignStudent } from "../services/adminAssignService"; // ✅ opción B alias
import { useActivePeriod } from "../hooks/useActivePeriod";

type Props = {
  open: boolean;
  studentId: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

type FormValues = {
  coordinatorId: number;
};

export default function AssignStudentModal({ open, studentId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const [coordinators, setCoordinators] = useState<UserOption[]>([]);
  const activePeriod = useActivePeriod();

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const coords = await listUsersByRole("COORDINATOR");
        setCoordinators(coords);
      } catch (e: any) {
        message.error(e?.response?.data?.message ?? "No se pudo cargar coordinadores");
      }
    })();
  }, [open]);

  const handleOk = async () => {
    if (!studentId) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // ✅ enviar JSON
      await assignStudent(studentId, {
        coordinatorId: values.coordinatorId,
        academicPeriodId: activePeriod.periodId ?? null, // opcional; backend puede usar activo
      });

      message.success("Coordinador asignado ✅");
      onSuccess();
      onClose();
      form.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "Error al asignar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Asignar coordinador"
      open={open}
      onOk={handleOk}
      okButtonProps={{ loading }}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      destroyOnClose
      okText="Guardar"
      cancelText="Cancelar"
    >
      <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
        <b>Periodo activo:</b>{" "}
        {activePeriod.loading ? "Cargando..." : activePeriod.periodName ?? "NO ACTIVO"}
      </div>

      <Form layout="vertical" form={form}>
        <Form.Item
          label="Docente"
          name="coordinatorId"
          rules={[{ required: true, message: "Selecciona un coordinador" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={coordinators.map((u) => ({
              value: u.id,
              label: `${u.fullName} (@${u.username})`,
            }))}
            placeholder="Selecciona coordinador"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
