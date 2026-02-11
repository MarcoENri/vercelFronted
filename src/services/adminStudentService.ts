import { api } from "../api/api";

export type ImportBatchResponse = {
  batchId: number;
  status: string;
  fileName: string;
  totalRows: number;
  insertedRows: number;
  updatedRows: number;
  failedRows: number;
};

export type AdminStudentRow = {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  corte: string;
  section: string;
  modality?: string | null;

  career: string;      // ya lo tenías
  careerId?: number | null; // ✅ NUEVO (viene del backend)

  titulationType: string;
  status: string;
  incidentCount: number;
  observationCount: number;
  academicPeriodName: string;
};


export async function importStudentsXlsx(file: File, academicPeriodId: number) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await api.post("/admin/students/import/xlsx", fd, {
    params: { academicPeriodId }, // ✅ coincide con tu controller de import
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data as ImportBatchResponse;
}

// ✅ LISTA POR PERIODO (usa academicPeriodId)
export async function listStudents(academicPeriodId?: number) {
  const { data } = await api.get<AdminStudentRow[]>("/admin/students", {
    params: academicPeriodId ? { academicPeriodId } : undefined,
  });
  return Array.isArray(data) ? data : [];
}
