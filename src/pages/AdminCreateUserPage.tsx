import { Card, Form, Input, Button, Select, message } from "antd";
import { useNavigate } from "react-router-dom";
import { createUser } from "../services/adminUserService";

const { Option } = Select;

export default function AdminCreateUserPage() {
  const [form] = Form.useForm();
  const nav = useNavigate();

  const onFinish = async (values: any) => {
    try {
      await createUser({
        username: values.username,
        password: values.password,
        fullName: values.fullName,
        email: values.email,
        roles: values.roles,
      });

      message.success("Usuario creado correctamente");
      form.resetFields();
      nav("/admin"); // vuelve al listado
    } catch (e: any) {
      message.error(
        e?.response?.data?.message ?? "Error al crear usuario"
      );
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <Card title="Crear usuario">
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            label="Usuario"
            name="username"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Nombre completo"
            name="fullName"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Rol"
            name="roles"
            rules={[{ required: true }]}
          >
            <Select mode="multiple" placeholder="Seleccione roles">
              <Option value="ADMIN">ADMIN</Option>
              <Option value="COORDINATOR">COORDINATOR</Option>
              <Option value="TUTOR">TUTOR</Option>
              <Option value="JURY">JURADO</Option>

            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Crear usuario
          </Button>
        </Form>
      </Card>
    </div>
  );
}
