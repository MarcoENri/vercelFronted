import { Select } from "antd";
import { useEffect, useState } from "react";
import { listAcademicPeriods, type AcademicPeriodDto } from "../services/academicPeriodService";

type Props = {
  value?: number;
  onChange: (id: number) => void;
};

export default function AcademicPeriodSelect({ value, onChange }: Props) {
  const [items, setItems] = useState<AcademicPeriodDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listAcademicPeriods(false);
        setItems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Select
      style={{ minWidth: 280 }}
      loading={loading}
      placeholder="Selecciona período académico"
      value={value}
      onChange={onChange}
      options={items.map((p) => ({
        value: p.id,
        label: p.isActive ? `${p.name} (Activo)` : p.name,
      }))}
    />
  );
}
