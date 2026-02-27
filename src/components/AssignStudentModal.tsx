import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, TextField, Typography, Box,
  CircularProgress, Fade, Zoom, Chip, Avatar, ListItemIcon, ListItemText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  PersonPin as PersonPinIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import type { UserOption } from "../services/adminLookupService";
import { listUsersByRole } from "../services/adminLookupService";
import { assignStudent } from "../services/adminAssignService";
import { useActivePeriod } from "../hooks/useActivePeriod";

const VERDE = "#008B8B";

type Props = { open: boolean; studentId: number | null; onClose: () => void; onSuccess: () => void };
type FormValues = { coordinatorId: number | "" };

export default function AssignStudentModal({ open, studentId, onClose, onSuccess }: Props) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { coordinatorId: "" },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [coordinators, setCoordinators] = useState<UserOption[]>([]);
  const activePeriod = useActivePeriod();
  const watchCoord = watch("coordinatorId");
  const selectedCoord = coordinators.find((c) => c.id === watchCoord);

  useEffect(() => {
    if (!open) return;
    listUsersByRole("COORDINATOR").then(setCoordinators).catch(console.error);
  }, [open]);

  const handleClose = () => { if (!loading) { onClose(); reset(); setSuccess(false); } };

  const onSubmit = async (values: FormValues) => {
    if (!studentId) return;
    try {
      setLoading(true);
      await assignStudent(studentId, { coordinatorId: values.coordinatorId as number, academicPeriodId: activePeriod.periodId ?? null });
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
    "& .MuiOutlinedInput-root": { borderRadius: "10px", "&.Mui-focused fieldset": { borderColor: VERDE, borderWidth: 2 }, "&:hover fieldset": { borderColor: VERDE } },
    "& label.Mui-focused": { color: VERDE },
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xs" 
      fullWidth 
      TransitionComponent={Zoom}
      PaperProps={{ sx: { borderRadius: "18px", overflow: "hidden" } }}
    >

      <DialogTitle sx={{ fontWeight: 800, bgcolor: VERDE, color: "#fff", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 1, py: 1.5, px: 2.5 }}>
        <PersonPinIcon sx={{ fontSize: 18 }} />
        Asignar coordinador
      </DialogTitle>

      {/* pt: 5 para que baje el contenido y no tope con el título */}
      <DialogContent 
        sx={{ 
          pt: 5, 
          pb: 1, 
          px: 3, 
          overflowY: "auto", 
          maxHeight: "60vh",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,139,139,0.3)", borderRadius: 10 },
          "&::-webkit-scrollbar-thumb:hover": { bgcolor: VERDE },
        }}
      >
        <Fade in={success}>
          <Box sx={{ display: success ? "flex" : "none", flexDirection: "column", alignItems: "center", py: 3, gap: 1.5 }}>
            <Zoom in={success}><CheckCircleIcon sx={{ fontSize: 64, color: VERDE }} /></Zoom>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: VERDE }}>¡Coordinador asignado!</Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", textAlign: "center" }}>La asignación se realizó correctamente.</Typography>
          </Box>
        </Fade>

        <Fade in={!success}>
          <Box sx={{ display: success ? "none" : "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <Box sx={{ bgcolor: "rgba(0,139,139,0.07)", border: `1.5px solid ${VERDE}`, borderRadius: "10px", px: 2, py: 1.2, display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: VERDE, animation: "pulse 2s ease-in-out infinite", "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
              <Typography sx={{ fontSize: "0.8rem", color: VERDE, fontWeight: 700 }}>
                Período: {activePeriod.loading ? "Cargando..." : activePeriod.periodName ?? "NO ACTIVO"}
              </Typography>
            </Box>

            <Controller name="coordinatorId" control={control} rules={{ required: "Selecciona un coordinador" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Docente"
                  size="small"
                  fullWidth
                  error={!!errors.coordinatorId}
                  helperText={errors.coordinatorId?.message}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <PersonIcon sx={{ color: VERDE, mr: 1, fontSize: 18 }} /> }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          maxHeight: 220,
                          borderRadius: "12px",
                          boxShadow: "0 8px 28px rgba(0,0,0,0.13)",
                          mt: 0.5,
                          "&::-webkit-scrollbar": { width: 5 },
                          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,139,139,0.35)", borderRadius: 10 },
                        },
                      },
                    },
                  }}
                >
                  {coordinators.map((u) => (
                    <MenuItem
                      key={u.id}
                      value={u.id}
                      sx={{
                        borderRadius: "10px",
                        mx: 0.5, my: 0.3,
                        transition: "transform 0.18s ease, background 0.18s ease",
                        "&:hover": {
                          bgcolor: "rgba(0,139,139,0.09)",
                          transform: "translateX(5px)",
                          boxShadow: "2px 0 0 0 #008B8B inset",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: watchCoord === u.id ? VERDE : "rgba(0,139,139,0.2)", fontSize: "0.75rem", fontWeight: 800 }}>
                          {u.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={u.fullName}
                        secondary={`@${u.username}`}
                        primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: watchCoord === u.id ? 700 : 400 }}
                        secondaryTypographyProps={{ fontSize: "0.72rem", color: "text.disabled" }}
                      />
                    </MenuItem>
                  ))}
                </TextField>
              )} />

            {selectedCoord && (
              <Fade in>
                <Chip icon={<PersonIcon />} label={`${selectedCoord.fullName}`} size="small"
                  sx={{ bgcolor: "rgba(0,139,139,0.08)", color: VERDE, fontWeight: 700, borderRadius: "8px", border: `1px solid ${VERDE}` }} />
              </Fade>
            )}
          </Box>
        </Fade>
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1.5 }}>
          <Button onClick={handleClose} variant="outlined" fullWidth disabled={loading}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555", py: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" fullWidth disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <PersonPinIcon />}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE, "&:hover": { bgcolor: "#006666" }, py: 1 }}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}