// src/components/AssignCareerModal.tsx
import { Modal, Form, Select, message } from "antd";
import { useMemo } from "react";
// ✅ IMPORTES REACTIVOS
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { UserOption, CareerOption } from "../services/adminLookupService";
import { listUsersByRole, listCareers } from "../services/adminLookupService";
import { assignByCareer } from "../services/adminAssignService";
import { useActivePeriod } from "../hooks/useActivePeriod";

type CareerItem = {
  key: string;
  label: string;
  isFixed?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableCareers: CareerItem[];
};

type FormValues = {
  careerId: number;
  coordinatorId: number;
  tutorId?: number;
  projectName?: string;
  onlyUnassigned: boolean;
};

export default function AssignCareerModal({
  open,
  onClose,
  onSuccess,
  availableCareers,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const activePeriod = useActivePeriod();

  // -------------------------
  // ✅ QUERIES (Carga de selectores)
  // -------------------------

  const { data: coordinators = [] } = useQuery({
    queryKey: ["lookup-coordinators"],
    queryFn: () => listUsersByRole("COORDINATOR"),
    enabled: open,
  });

  const { data: careersRaw = [] } = useQuery({
    queryKey: ["lookup-careers"],
    queryFn: listCareers,
    enabled: open,
  });

  // Prioridad “bonita” mantenida exacta
  const careerPriority = useMemo(() => {
    return new Set((availableCareers ?? []).map((c) => c.key.toLowerCase().trim()));
  }, [availableCareers]);

  // Ordenamiento de carreras mantenido exacto
  const sortedCareers = useMemo(() => {
    return [...careersRaw].sort((a, b) => {
      const aKey = a.name.toLowerCase().trim();
      const bKey = b.name.toLowerCase().trim();
      const aP = careerPriority.has(aKey) ? 0 : 1;
      const bP = careerPriority.has(bKey) ? 0 : 1;
      if (aP !== bP) return aP - bP;
      return a.name.localeCompare(b.name);
    });
  }, [careersRaw, careerPriority]);

  // -------------------------
  // ✅ MUTATION (Guardado reactivo)
  // -------------------------

  const assignMutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!activePeriod.periodId) {
        throw new Error(activePeriod.error ?? "No hay periodo activo.");
      }
      return assignByCareer({
        ...values,
        academicPeriodId: activePeriod.periodId,
        projectName: values.projectName?.trim() || null,
        tutorId: values.tutorId ?? null,
      });
    },
    onSuccess: () => {
      message.success("Asignación masiva aplicada ✅");
      // ESTO ES LO REACTIVO: Invalida las listas para que se refresquen solas
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onSuccess();
      onClose();
      form.resetFields();
    },
    onError: (e: any) => {
      message.error(e?.response?.data?.message ?? "Error en asignación masiva");
    },
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      assignMutation.mutate(values);
    } catch (e) {
      // Errores de validación de antd
    }
  };

  return (
    <Modal
      title="Asignación masiva por carrera"
      open={open}
      onOk={handleOk}
      confirmLoading={assignMutation.isPending}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      destroyOnClose
      okText="OK"
      cancelText="Cancelar"
    >
      <Form 
        layout="vertical" 
        form={form}
        initialValues={{ onlyUnassigned: true }}
      >
        <Form.Item
          label="Carrera"
          name="careerId"
          rules={[{ required: true, message: "Selecciona una carrera" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={sortedCareers.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            placeholder="Selecciona carrera"
          />
        </Form.Item>

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

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
          <b>Periodo activo:</b>{" "}
          {activePeriod.loading ? "Cargando..." : activePeriod.periodName ?? "NO ACTIVO"}
        </div>
      </Form>
    </Modal>
  );
}