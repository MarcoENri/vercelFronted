import { useEffect, useState } from "react";
import { getActiveAcademicPeriod } from "../services/periodService";

type State = {
  loading: boolean;
  periodId: number | null;
  periodName: string | null;
  error: string | null;
};

export function useActivePeriod() {
  const [state, setState] = useState<State>({
    loading: true,
    periodId: null,
    periodName: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const p = await getActiveAcademicPeriod();
        if (!mounted) return;

        if (!p) {
          localStorage.removeItem("periodId");
          setState({
            loading: false,
            periodId: null,
            periodName: null,
            error: "No existe un periodo académico activo. Pide al administrador que lo active.",
          });
          return;
        }

        localStorage.setItem("periodId", String(p.id));
        setState({
          loading: false,
          periodId: p.id,
          periodName: p.name,
          error: null,
        });
      } catch (e: any) {
        if (!mounted) return;

        localStorage.removeItem("periodId");
        setState({
          loading: false,
          periodId: null,
          periodName: null,
          error:
            e?.response?.data?.message ??
            "No se pudo obtener el periodo activo",
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
