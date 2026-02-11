import { api } from "../api/api";
// Importamos esto para la reactividad (asegúrate de tener instalado @tanstack/react-query)
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UpdateIncidentRequest = {
  stage: string;
  date: string;   // "YYYY-MM-DD"
  reason: string;
  action: string;
};

// --- TU LÓGICA ORIGINAL (MANTENIDA INTACTA) ---

export async function updateIncident(
  studentId: number,
  incidentId: number,
  periodId: number,
  body: UpdateIncidentRequest
) {
  const res = await api.put(
    `/incidents/students/${studentId}/${incidentId}`,
    body,
    { params: { periodId } }
  );
  return res.data;
}

export async function deleteIncident(
  studentId: number,
  incidentId: number,
  periodId: number
) {
  const res = await api.delete(
    `/incidents/students/${studentId}/${incidentId}`,
    { params: { periodId } }
  );
  return res.data; // trae remainingIncidents y studentStatus
}

// --- CAPA DE PROGRAMACIÓN REACTIVA (AÑADIDA) ---
// Esta función permite que los componentes se "suscriban" a los cambios

export function useIncidentActions() {
  const queryClient = useQueryClient();

  // Mutación reactiva para actualizar
  const updateMutation = useMutation({
    mutationFn: ({ studentId, incidentId, periodId, body }: any) => 
      updateIncident(studentId, incidentId, periodId, body),
    onSuccess: () => {
      // ESTO ES LO REACTIVO: Al terminar, avisa a toda la app que refresque los datos
      queryClient.invalidateQueries({ queryKey: ["students"] }); 
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    }
  });

  // Mutación reactiva para eliminar
  const deleteMutation = useMutation({
    mutationFn: ({ studentId, incidentId, periodId }: any) => 
      deleteIncident(studentId, incidentId, periodId),
    onSuccess: () => {
      // Avisa al Coordinador/Tutor que la incidencia ya no existe y la UI se limpia sola
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    }
  });

  return {
    updateReactive: updateMutation.mutate,
    deleteReactive: deleteMutation.mutate,
    isLoading: updateMutation.isPending || deleteMutation.isPending
  };
}