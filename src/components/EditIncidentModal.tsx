import { Modal, Form, Input, DatePicker, message } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { updateIncident } from "../services/incidentManageService";

// ✅ IMPORTES PARA REACTIVIDAD
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ── AÑADIDO: locale español con una sola inicial por día ─────────────────
import esLocale from "antd/es/date-picker/locale/es_ES";

const locale = {
  ...esLocale,
  lang: {
    ...esLocale.lang,
    shortWeekDays: ["D", "L", "M", "M", "J", "V", "S"],
  },
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  periodId: number;
  studentId: number;
  incident: {
    id: number;
    stage: string;
    date: string; // "YYYY-MM-DD"
    reason: string;
    action: string;
  } | null;
};

type FormValues = {
  stage: string;
  date: Dayjs;
  reason: string;
  action: string;
};

export default function EditIncidentModal({
  open,
  onClose,
  onSaved,
  periodId,
  studentId,
  incident,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  // ✅ MUTACIÓN REACTIVA
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!incident) return;
      return await updateIncident(studentId, incident.id, periodId, {
        stage: values.stage.trim(),
        date: values.date.format("YYYY-MM-DD"),
        reason: values.reason.trim(),
        action: values.action.trim(),
      });
    },
    onSuccess: () => {
      message.success("Incidencia actualizada ✅");
      queryClient.invalidateQueries({ queryKey: ["studentDetail", String(studentId)] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onSaved();
      onClose();
      form.resetFields();
    },
    onError: (e: any) => {
      message.error(e?.response?.data?.message ?? "No se pudo actualizar");
    },
  });

  return (
    <Modal
      title="Editar incidencia"
      open={open}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      okText="Guardar"
      cancelText="Cancelar"
      afterOpenChange={(v) => {
        if (v && incident) {
          form.setFieldsValue({
            stage: incident.stage,
            date: dayjs(incident.date),
            reason: incident.reason,
            action: incident.action,
          });
        }
      }}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={(v) => mutation.mutate(v)}
      >
        <Form.Item name="stage" label="Etapa" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
          {/* AÑADIDO: locale para mostrar L M M J V S D en español */}
          <DatePicker style={{ width: "100%" }} locale={locale} />
        </Form.Item>

        <Form.Item name="reason" label="Motivo" rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="action" label="Acción" rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}