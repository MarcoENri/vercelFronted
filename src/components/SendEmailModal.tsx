import { Modal, Form, Input, message } from "antd";
import { useState } from "react";
import { sendStudentEmail } from "../services/studentEmailService";

type Props = {
  open: boolean;
  studentId: number | string | null;
  studentEmail?: string; // solo para mostrar en UI
  onClose: () => void;
  onSent?: () => void;
};

type FormValues = { subject: string; body: string };

export default function SendEmailModal({ open, studentId, studentEmail, onClose, onSent }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!studentId) return;
    try {
      const v = await form.validateFields();
      setLoading(true);

      await sendStudentEmail(studentId, {
        subject: v.subject.trim(),
        body: v.body.trim(),
      });

      message.success("Correo enviado ✅");
      form.resetFields();
      onSent?.();
      onClose();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Enviar correo${studentEmail ? ` a ${studentEmail}` : ""}`}
      open={open}
      onOk={handleOk}
      okText="Enviar"
      okButtonProps={{ loading }}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Asunto"
          name="subject"
          rules={[{ required: true, message: "Escribe el asunto" }]}
        >
          <Input placeholder="Ej: Observación sobre tu documento" />
        </Form.Item>

        <Form.Item
          label="Mensaje"
          name="body"
          rules={[{ required: true, message: "Escribe el mensaje" }]}
        >
          <Input.TextArea rows={6} placeholder="Escribe aquí lo que debe hacer el estudiante..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
