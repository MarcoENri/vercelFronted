import { Modal, Form, Input, Select, Switch, message } from "antd";
import { useState } from "react";
import { createUser } from "../services/adminUserService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type FormValues = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roles: Array<"ADMIN" | "COORDINATOR" | "TUTOR" | "JURY">;
  enabled?: boolean;
};

export default function CreateUserModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const v = await form.validateFields();
      setLoading(true);

      await createUser({
        username: v.username.trim(),
        password: v.password,
        fullName: v.fullName.trim(),
        email: v.email.trim(),
        roles: v.roles,
      });

      message.success("Usuario creado ✅");
      onSuccess?.();
      form.resetFields();
      onClose();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Crear usuario"
      open={open}
      onOk={handleOk}
      okText="Crear"
      okButtonProps={{ loading }}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Usuario"
          name="username"
          rules={[
            { required: true, message: "Ingresa el username" },
            { min: 3, message: "Mínimo 3 caracteres" },
          ]}
        >
          <Input placeholder="Ej: jurado_01" />
        </Form.Item>

        <Form.Item
          label="Contraseña"
          name="password"
          rules={[{ required: true, message: "Ingresa la contraseña" }]}
        >
          <Input.Password placeholder="Ej: Admin123*" />
        </Form.Item>

        <Form.Item
          label="Nombre completo"
          name="fullName"
          rules={[{ required: true, message: "Ingresa el nombre completo" }]}
        >
          <Input placeholder="Ej: Juan Pérez" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Ingresa el email" },
            { type: "email", message: "Email inválido" },
          ]}
        >
          <Input placeholder="ejemplo@correo.com" />
        </Form.Item>

        <Form.Item
          label="Roles"
          name="roles"
          rules={[{ required: true, message: "Selecciona al menos 1 rol" }]}
        >
          <Select
            mode="multiple"
            placeholder="Selecciona roles"
            options={[
              { value: "ADMIN", label: "ADMIN" },
              { value: "COORDINATOR", label: "COORDINATOR" },
              { value: "TUTOR", label: "TUTOR" },
              { value: "JURY", label: "JURY" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Activo (solo visual por ahora)"
          name="enabled"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
