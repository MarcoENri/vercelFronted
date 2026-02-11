import { Modal, Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { createCareer } from "../services/careerService";

// ✅ IMPORTES REACTIVOS
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateCareerModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // ✅ MUTACIÓN REACTIVA
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      formData.append("name", values.name);
      
      if (fileList.length > 0) {
        // Tomamos el archivo binario real de tu galería
        formData.append("image", fileList[0].originFileObj);
      }
      return await createCareer(formData);
    },
    onSuccess: () => {
      message.success("Carrera creada y foto subida con éxito, mi llave ✅");
      
      // REACCIÓN: Refresca las tarjetas de carreras y la lista de estudiantes
      queryClient.invalidateQueries({ queryKey: ["careerCards"] });
      queryClient.invalidateQueries({ queryKey: ["lookup-careers"] });
      
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    },
    onError: () => {
      message.error("No se pudo subir la imagen al servidor");
    }
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      mutation.mutate(values); // Ejecuta la mutación
    } catch (error) {
      // Errores de validación de antd
    }
  };

  return (
    <Modal 
      title="Crear Nueva Carrera" 
      open={open} 
      onOk={handleOk} 
      onCancel={() => {
        onClose();
        form.resetFields();
        setFileList([]);
      }} 
      confirmLoading={mutation.isPending} // Carga automática en el botón
      okText="Crear ahora"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="name" 
          label="Nombre de la Carrera" 
          rules={[{ required: true, message: 'Ponle un nombre' }]}
        >
          <Input placeholder="Ej: Redes y Telecomunicaciones" />
        </Form.Item>

        <Form.Item label="Foto (Selecciona de tu galería)">
          <Upload 
            beforeUpload={() => false} // Detiene la subida automática
            maxCount={1} 
            listType="picture"
            fileList={fileList} 
            onChange={({ fileList }) => setFileList(fileList)}
          >
            <Button icon={<UploadOutlined />}>Elegir archivo</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}