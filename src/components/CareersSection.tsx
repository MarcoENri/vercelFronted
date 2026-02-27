import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PhotoIcon from "@mui/icons-material/Photo";
import PaletteIcon from "@mui/icons-material/Palette";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { useMemo, useState } from "react";

import type { CareerCardDto } from "../services/adminCareerCardsService";
import { api } from "../api/api";
import { uploadCareerCover } from "../services/adminCareerCardsService";

type Props = {
  verde: string;
  cards: CareerCardDto[];
  onCareerClick: (careerId: number) => void;
  onOpenAddCareer?: () => void;
  onGoPredefense: () => void;
  onGoFinalDefense: () => void;
  onReloadCards: () => Promise<void>;
};

export default function CareersSection({
  verde,
  cards,
  onCareerClick,
  onGoPredefense,
  onGoFinalDefense,
  onReloadCards,
}: Props) {
  const base = api.defaults.baseURL ?? "";
  const coverUrl = (filename?: string | null) =>
    filename ? `${base}/admin/careers/cover/${filename}` : null;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [careerId, setCareerId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  const handleSave = async () => {
    if (!careerId || !file || !color) return;
    setSaving(true);
    try {
      await uploadCareerCover(careerId, file, color);
      setOpen(false);
      setCareerId("");
      setFile(null);
      setColor("");
      onReloadCards();
    } finally {
      setSaving(false);
    }
  };

  // Tarjeta: estrecha y alta como la captura de referencia
  const CARD_W = 130;  // ancho fijo estrecho
  const CARD_H = 210;  // alto mayor para que se vea vertical

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Encabezado */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "900px",
          mb: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            sx={{ fontWeight: 800, color: verde, fontSize: { xs: "1rem", sm: "1.1rem" } }}
          >
            Listado de Estudiantes por Carrera
          </Typography>
          <Typography sx={{ color: "#aaa", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Estudiantes · Carrera · Periodo Titulación
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Button
            onClick={onGoPredefense}
            size="small"
            sx={{
              bgcolor: verde, color: "#fff", borderRadius: "999px",
              px: 2.5, fontWeight: 700, fontSize: "0.75rem",
              textTransform: "uppercase",
              "&:hover": { bgcolor: verde, opacity: 0.88 },
            }}
          >
            Predefensa
          </Button>
          <Button
            onClick={onGoFinalDefense}
            size="small"
            sx={{
              bgcolor: verde, color: "#fff", borderRadius: "999px",
              px: 2.5, fontWeight: 700, fontSize: "0.75rem",
              textTransform: "uppercase",
              "&:hover": { bgcolor: verde, opacity: 0.88 },
            }}
          >
            Defensa Final
          </Button>
          <Tooltip title="Modificar tarjetas">
            <IconButton
              onClick={() => setOpen(true)}
              size="small"
              sx={{
                bgcolor: verde, color: "#fff", borderRadius: "999px",
                width: 32, height: 32,
                "&:hover": { bgcolor: verde, opacity: 0.88 },
              }}
            >
              <ViewModuleIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Contenedor blanco con tarjetas */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "900px",
          bgcolor: "#fff",
          borderRadius: "20px",
          p: { xs: 2, sm: "24px 32px" },
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        }}
      >
        {/* Grid: 5 columnas de ancho fijo, centradas */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: `repeat(2, ${CARD_W}px)`,
              sm: `repeat(3, ${CARD_W}px)`,
              md: `repeat(5, ${CARD_W}px)`,
            },
            gap: { xs: "12px", sm: "14px", md: "16px" },
            justifyContent: "center",
          }}
        >
          {cards.map((c) => {
            const cover = coverUrl(c.coverImage);
            const bg = c.color ?? "#546e7a";

            return (
              <Paper
                key={c.id}
                onClick={() => onCareerClick(c.id)}
                elevation={0}
                sx={{
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: "16px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform .2s ease, box-shadow .2s ease",
                  "&:hover": {
                    transform: "translateY(-4px) scale(1.03)",
                    boxShadow: `0 12px 28px ${bg}66`,
                  },
                }}
              >
                {/* Imagen de fondo */}
                {cover && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${cover})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center top",
                    }}
                  />
                )}

                {/* Overlay color sobre la imagen */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: bg,
                    opacity: cover ? 0.6 : 1,
                    mixBlendMode: cover ? "multiply" : "normal",
                  }}
                />

                {/* Gradiente oscuro en la parte inferior para el texto */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "50%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
                  }}
                />

                {/* Badge contador — círculo blanco arriba derecha */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                  }}
                >
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: bg, lineHeight: 1 }}>
                    {c.studentsCount}
                  </Typography>
                </Box>

                {/* Nombre de la carrera — abajo centrado */}
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 10,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.6rem",
                    textTransform: "uppercase",
                    px: "6px",
                    lineHeight: 1.4,
                    letterSpacing: "0.3px",
                    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {c.name}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* Modal modificar tarjeta */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontSize: "1rem", fontWeight: 700 }}>
          Modificar tarjeta
        </DialogTitle>

        <DialogContent dividers>
          <Select
            fullWidth
            value={careerId}
            onChange={(e) => {
              const id = e.target.value as number;
              setCareerId(id);
              const c = cards.find((x) => x.id === id);
              if (c?.color) setColor(c.color);
            }}
            displayEmpty
            sx={{ mb: 2, borderRadius: "14px", fontWeight: 700 }}
            MenuProps={{ PaperProps: { sx: { borderRadius: "18px", mt: 1, maxHeight: 320, p: 1 } } }}
          >
            <MenuItem value="" disabled>Selecciona carrera</MenuItem>
            {cards.map((c) => (
              <MenuItem
                key={c.id}
                value={c.id}
                sx={{
                  mb: 0.8, borderRadius: "14px", px: 2, py: 1.2,
                  display: "flex", alignItems: "center", gap: 1.5,
                  border: "2px solid transparent",
                  "&.Mui-selected": { bgcolor: "rgba(0,0,0,0.06)", borderColor: c.color ?? "#999" },
                  "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
                }}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c.color ?? "#777", flexShrink: 0 }} />
                <ListItemText
                  primary={c.name}
                  primaryTypographyProps={{ fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase" }}
                />
              </MenuItem>
            ))}
          </Select>

          <Button component="label" fullWidth startIcon={<PhotoIcon />} sx={{ mb: 2 }}>
            Cambiar foto portada
            <input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Button>

          <Button startIcon={<PaletteIcon />} fullWidth sx={{ mb: 2 }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: "100%", height: 36, border: "none", background: "none" }}
            />
          </Button>

          <Box
            sx={{
              mt: 1, height: 120, borderRadius: "10px",
              bgcolor: color || "#ccc",
              backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!careerId || !file || !color || saving} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}