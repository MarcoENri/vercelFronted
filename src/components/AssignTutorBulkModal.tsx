import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, CircularProgress,
  Box, Fade, Zoom, Chip, MenuItem, Avatar,
  ListItemIcon, ListItemText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  WorkOutline as WorkIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { assignProject } from "../services/coordinatorStudentService";
import { listUsersByRole } from "../services/adminLookupService";

const VERDE = "#008B8B";

const scrollMenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 220,
      borderRadius: "12px",
      boxShadow: "0 8px 28px rgba(0,0,0,0.13)",
      mt: 0.5,
      "&::-webkit-scrollbar": { width: 5 },
      "&::-webkit-scrollbar-track": { bgcolor: "transparent", borderRadius: 10 },
      "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,139,139,0.35)", borderRadius: 10 },
      "&::-webkit-scrollbar-thumb:hover": { bgcolor: VERDE },
    },
  },
};

type Props = { open: boolean; studentIds: number[]; periodId: number; onClose: () => void; onSuccess: () => void };
type FormValues = { tutorId: number | ""; projectName: string };

export default function AssignTutorBulkModal({ open, studentIds, periodId, onClose, onSuccess }: Props) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { tutorId: "", projectName: "" },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const watchTutor = watch("tutorId");

  const { data: tutors = [] } = useQuery({
    queryKey: ["lookup-tutors"],
    queryFn: () => listUsersByRole("TUTOR"),
    enabled: open,
  });

  const selectedTutor = tutors.find((t) => t.id === watchTutor);

  const handleClose = () => { if (!loading) { onClose(); reset(); setSuccess(false); } };

  const onSubmit = async (v: FormValues) => {
    try {
      setLoading(true);
      await Promise.all(
        studentIds.map((id) => assignProject(id, periodId, { tutorId: v.tutorId as number, projectName: v.projectName.trim() }))
      );
      setSuccess(true);
      onSuccess();
      setTimeout(() => { setSuccess(false); handleClose(); }, 1600);
    } catch (e: any) {
      // error manejado por el padre
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      "&.Mui-focused fieldset": { borderColor: VERDE, borderWidth: 2 },
      "&:hover fieldset": { borderColor: VERDE },
    },
    "& label.Mui-focused": { color: VERDE },
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth TransitionComponent={Zoom}
      PaperProps={{ sx: { borderRadius: "18px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" } }}>

      {/* HEADER */}
      <DialogTitle sx={{ fontWeight: 800, bgcolor: VERDE, color: "#fff", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 1, py: 1.2, px: 2.5, flexShrink: 0 }}>
        <GroupIcon sx={{ fontSize: 18 }} />
        Asignar Tutor + Proyecto
      </DialogTitle>

      {/* CONTENIDO */}
      <DialogContent sx={{ pt: 2.5, pb: 1, px: 3, overflowY: "auto", flex: 1,
        "&::-webkit-scrollbar": { width: 5 },
        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,139,139,0.3)", borderRadius: 10 },
        "&::-webkit-scrollbar-thumb:hover": { bgcolor: VERDE },
      }}>

        {/* SUCCESS */}
        <Fade in={success}>
          <Box sx={{ display: success ? "flex" : "none", flexDirection: "column", alignItems: "center", py: 3, gap: 1.5 }}>
            <Zoom in={success}><CheckCircleIcon sx={{ fontSize: 64, color: VERDE }} /></Zoom>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: VERDE }}>¡Tutor asignado!</Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", textAlign: "center" }}>
              Se asignó correctamente a <strong>{studentIds.length}</strong> estudiante{studentIds.length !== 1 ? "s" : ""}.
            </Typography>
          </Box>
        </Fade>

        {/* FORM */}
        <Fade in={!success}>
          <Box sx={{ display: success ? "none" : "flex", flexDirection: "column", gap: 2.5 }}>

            {/* Badge seleccionados */}
            <Chip
              icon={<GroupIcon />}
              label={`${studentIds.length} seleccionado${studentIds.length !== 1 ? "s" : ""}`}
              size="small"
              sx={{ bgcolor: "rgba(0,139,139,0.1)", color: VERDE, fontWeight: 700, borderRadius: "8px", border: `1px solid ${VERDE}`, alignSelf: "flex-start" }}
            />

            {/* Nombre del proyecto */}
            <Controller name="projectName" control={control} rules={{ required: "Ingresa el nombre del proyecto" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nombre del Proyecto"
                  size="small"
                  fullWidth
                  placeholder="Ej: Sistema Web para Gestión de Titulación"
                  error={!!errors.projectName}
                  helperText={errors.projectName?.message}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <WorkIcon sx={{ color: VERDE, mr: 1, fontSize: 18 }} /> }}
                />
              )} />

            {/* Tutor — select con scroll y estilo MUI */}
            <Controller name="tutorId" control={control} rules={{ required: "Selecciona un tutor" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tutor"
                  size="small"
                  fullWidth
                  error={!!errors.tutorId}
                  helperText={errors.tutorId?.message}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <PersonIcon sx={{ color: VERDE, mr: 1, fontSize: 18 }} /> }}
                  SelectProps={{ MenuProps: scrollMenuProps }}
                >
                  {tutors.map((t) => (
                    <MenuItem
                      key={t.id}
                      value={t.id}
                      sx={{
                        borderRadius: "8px", mx: 0.5, my: 0.25,
                        transition: "background 0.15s",
                        "&:hover": { bgcolor: "rgba(0,139,139,0.08)" },
                        "&.Mui-selected": { bgcolor: "rgba(0,139,139,0.13)", fontWeight: 700 },
                        "&.Mui-selected:hover": { bgcolor: "rgba(0,139,139,0.18)" },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 34 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: VERDE, fontSize: "0.65rem", fontWeight: 800 }}>
                          {t.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={t.fullName}
                        secondary={`@${t.username}`}
                        primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: watchTutor === t.id ? 700 : 400 }}
                        secondaryTypographyProps={{ fontSize: "0.72rem" }}
                      />
                      {watchTutor === t.id && (
                        <CheckCircleIcon sx={{ ml: "auto", color: VERDE, fontSize: 16 }} />
                      )}
                    </MenuItem>
                  ))}
                </TextField>
              )} />

            {/* Chip preview tutor seleccionado */}
            {selectedTutor && (
              <Fade in>
                <Chip
                  icon={<PersonIcon sx={{ fontSize: "14px !important" }} />}
                  label={`${selectedTutor.fullName} · @${selectedTutor.username}`}
                  size="small"
                  sx={{ bgcolor: "rgba(0,139,139,0.08)", color: VERDE, fontWeight: 700, borderRadius: "8px", border: `1px solid ${VERDE}`, alignSelf: "flex-start" }}
                />
              </Fade>
            )}

          </Box>
        </Fade>
      </DialogContent>

      {/* BOTONES */}
      {!success && (
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1, flexShrink: 0 }}>
          <Button onClick={handleClose} variant="outlined" fullWidth disabled={loading}
            startIcon={<CloseIcon />}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555" }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" fullWidth
            disabled={loading || studentIds.length === 0}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <GroupIcon />}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE, "&:hover": { bgcolor: "#006666" } }}>
            {loading ? "Asignando..." : "Asignar"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}