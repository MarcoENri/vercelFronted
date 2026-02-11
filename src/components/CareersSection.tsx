import {
  Box,
  Typography,
  Grid,
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
  onOpenAddCareer?: () => void; // ✅ AÑADIR ESTO
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

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: "1100px",
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: verde }}>
            Listado de Estudiantes por Carrera
          </Typography>
          <Typography sx={{ color: "#888", fontSize: "0.85rem", fontWeight: 700 }}>
            Estudiantes - Carrera Periodo Titulación
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Button
            onClick={onGoPredefense}
            sx={{
              bgcolor: verde,
              color: "#fff",
              borderRadius: "999px",
              px: 3,
              fontWeight: 700,
              "&:hover": { bgcolor: verde },
            }}
          >
            Predefensa
          </Button>

          <Button
            onClick={onGoFinalDefense}
            sx={{
              bgcolor: verde,
              color: "#fff",
              borderRadius: "999px",
              px: 3,
              fontWeight: 700,
              "&:hover": { bgcolor: verde },
            }}
          >
            Defensa Final
          </Button>

          <Tooltip title="Modificar tarjetas">
            <IconButton
              onClick={() => setOpen(true)}
              sx={{
                bgcolor: verde,
                color: "#fff",
                width: 44,
                height: 44,
                borderRadius: "999px",
                "&:hover": { bgcolor: verde },
              }}
            >
              <ViewModuleIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ width: "100%", maxWidth: "1100px", p: 4, borderRadius: "25px", bgcolor: "#fff" }}>
        <Grid container spacing={3} justifyContent="center">
          {cards.map((c) => {
            const cover = coverUrl(c.coverImage);
            const bg = c.color ?? "#546e7a";

            return (
              <Grid key={c.id}>
                <Paper
                  onClick={() => onCareerClick(c.id)}
                  sx={{
                    width: 168,
                    height: 250,
                    borderRadius: "22px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform .25s ease",
                    "&:hover": { transform: "scale(1.07)" },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: cover ? `url(${cover})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      bgcolor: bg,
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: bg,
                      mixBlendMode: "multiply",
                      opacity: 0.75,
                    }}
                  />
                  <Avatar
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      bgcolor: "#fff",
                      color: bg,
                      width: 26,
                      height: 26,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {c.studentsCount}
                  </Avatar>
                  <Typography
                    sx={{
                      position: "absolute",
                      bottom: 15,
                      width: "100%",
                      textAlign: "center",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {c.name}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Modificar tarjeta</DialogTitle>

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
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: "18px",
                  mt: 1,
                  maxHeight: 320,
                  p: 1,
                },
              },
            }}
          >
            <MenuItem value="" disabled>
              Selecciona carrera
            </MenuItem>

            {cards.map((c) => (
              <MenuItem
                key={c.id}
                value={c.id}
                sx={{
                  mb: 0.8,
                  borderRadius: "14px",
                  px: 2,
                  py: 1.2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  border: "2px solid transparent",
                  "&.Mui-selected": {
                    bgcolor: "rgba(0,0,0,0.06)",
                    borderColor: c.color ?? "#999",
                  },
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.08)",
                    transform: "scale(1.02)",
                  },
                }}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c.color ?? "#777" }} />

                <ListItemText
                  primary={c.name}
                  primaryTypographyProps={{
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                  }}
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
              mt: 1,
              height: 120,
              borderRadius: "10px",
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
