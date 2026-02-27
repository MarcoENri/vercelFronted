// src/components/AssignCareerModal.tsx
import { useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, TextField, Typography, Box,
  CircularProgress, Fade, Zoom, Chip, Avatar,
  ListItemIcon, ListItemText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AssignmentInd as AssignIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { UserOption, CareerOption } from "../services/adminLookupService";
import { listUsersByRole, listCareers } from "../services/adminLookupService";
import { assignByCareer } from "../services/adminAssignService";
import { useActivePeriod } from "../hooks/useActivePeriod";

const VERDE = "#008B8B";

type CareerItem = { key: string; label: string; isFixed?: boolean };
type Props = { open: boolean; onClose: () => void; onSuccess: () => void; availableCareers: CareerItem[] };
type FormValues = { careerId: number | ""; coordinatorId: number | "" };

export default function AssignCareerModal({ open, onClose, onSuccess, availableCareers }: Props) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { careerId: "", coordinatorId: "" },
  });
  const queryClient = useQueryClient();
  const activePeriod = useActivePeriod();
  const [success, setSuccess] = useState(false);

  const watchCareer = watch("careerId");
  const watchCoord = watch("coordinatorId");

  const { data: coordinators = [] } = useQuery({
    queryKey: ["lookup-coordinators"],
    queryFn: () => listUsersByRole("COORDINATOR"),
    enabled: open,
  });
  const { data: careersRaw = [] } = useQuery({
    queryKey: ["lookup-careers"],
    queryFn: listCareers,
    enabled: open,
  });

  const careerPriority = useMemo(
    () => new Set((availableCareers ?? []).map((c) => c.key.toLowerCase().trim())),
    [availableCareers]
  );
  const sortedCareers = useMemo(() => {
    return [...careersRaw].sort((a, b) => {
      const aP = careerPriority.has(a.name.toLowerCase().trim()) ? 0 : 1;
      const bP = careerPriority.has(b.name.toLowerCase().trim()) ? 0 : 1;
      if (aP !== bP) return aP - bP;
      return a.name.localeCompare(b.name);
    });
  }, [careersRaw, careerPriority]);

  const assignMutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!activePeriod.periodId) throw new Error("No hay periodo activo.");
      return assignByCareer({
        careerId: values.careerId as number,
        coordinatorId: values.coordinatorId as number,
        academicPeriodId: activePeriod.periodId,
        projectName: null,
        tutorId: null,
        onlyUnassigned: true,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
        reset();
      }, 1600);
    },
  });

  const handleClose = () => { if (!assignMutation.isPending) { onClose(); reset(); setSuccess(false); } };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      "&.Mui-focused fieldset": { borderColor: VERDE, borderWidth: 2 },
      "&:hover fieldset": { borderColor: VERDE },
    },
    "& label.Mui-focused": { color: VERDE },
  };

  // Configuración del menú con animación en los items
  const menuProps = {
    PaperProps: {
      sx: {
        maxHeight: 250,
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        mt: 1,
        p: 0.5,
        "&::-webkit-scrollbar": { width: 5 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,139,139,0.3)", borderRadius: 10 },
      },
    },
  };

  // Estilo animado para cada MenuItem
  const menuItemSx = {
    borderRadius: "8px",
    mx: 0.5,
    my: 0.3,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      bgcolor: "rgba(0,139,139,0.08)",
      transform: "translateX(4px)", // Pequeño desplazamiento a la derecha
      "& .MuiAvatar-root": { transform: "scale(1.1)" }, // El avatar crece un poquito
    },
    "&.Mui-selected": {
      bgcolor: "rgba(0,139,139,0.15)",
      fontWeight: 700,
      "&:hover": { bgcolor: "rgba(0,139,139,0.2)" },
    },
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
        <AssignIcon sx={{ fontSize: 18 }} />
        Asignación masiva
      </DialogTitle>

      <DialogContent sx={{ pt: 5, pb: 1, px: 3, overflowY: "auto", maxHeight: "65vh" }}>
        
        <Fade in={success}>
          <Box sx={{ display: success ? "flex" : "none", flexDirection: "column", alignItems: "center", py: 4, gap: 1.5 }}>
            <Zoom in={success}><CheckCircleIcon sx={{ fontSize: 64, color: VERDE }} /></Zoom>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: VERDE }}>¡Asignado!</Typography>
          </Box>
        </Fade>

        <Fade in={!success}>
          <Box sx={{ display: success ? "none" : "flex", flexDirection: "column", gap: 3, mt: 1 }}>

            <Box sx={{ bgcolor: "rgba(0,139,139,0.07)", border: `1.2px solid ${VERDE}`, borderRadius: "10px", px: 2, py: 1, mb: 1 }}>
              <Typography sx={{ fontSize: "0.78rem", color: VERDE, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: VERDE }} />
                Período: {activePeriod.periodName ?? "Cargando..."}
              </Typography>
            </Box>

            <Controller name="careerId" control={control} rules={{ required: "Selecciona carrera" }}
              render={({ field }) => (
                <TextField {...field} select label="Carrera" fullWidth size="small"
                  error={!!errors.careerId} sx={fieldSx}
                  InputProps={{ startAdornment: <SchoolIcon sx={{ color: VERDE, mr: 1, fontSize: 18 }} /> }}
                  SelectProps={{ MenuProps: menuProps }}
                >
                  {sortedCareers.map((c) => (
                    <MenuItem key={c.id} value={c.id} sx={menuItemSx}>
                      <ListItemIcon sx={{ minWidth: 35 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: VERDE, fontSize: "0.7rem", transition: "all 0.2s" }}>
                          {c.name.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText primary={c.name} primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} />
                    </MenuItem>
                  ))}
                </TextField>
              )} />

            <Controller name="coordinatorId" control={control} rules={{ required: "Selecciona docente" }}
              render={({ field }) => (
                <TextField {...field} select label="Docente" fullWidth size="small"
                  error={!!errors.coordinatorId} sx={fieldSx}
                  InputProps={{ startAdornment: <PersonIcon sx={{ color: VERDE, mr: 1, fontSize: 18 }} /> }}
                  SelectProps={{ MenuProps: menuProps }}
                >
                  {coordinators.map((u) => (
                    <MenuItem key={u.id} value={u.id} sx={menuItemSx}>
                      <ListItemIcon sx={{ minWidth: 35 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: "#546e7a", fontSize: "0.7rem", transition: "all 0.2s" }}>
                          {u.fullName?.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={u.fullName} 
                        secondary={`@${u.username}`} 
                        primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} 
                        secondaryTypographyProps={{ fontSize: "0.7rem" }} 
                      />
                    </MenuItem>
                  ))}
                </TextField>
              )} />
          </Box>
        </Fade>
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1.5 }}>
          <Button onClick={handleClose} variant="outlined" fullWidth disabled={assignMutation.isPending}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, color: "#555", py: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit((v) => assignMutation.mutate(v))} variant="contained" fullWidth
            disabled={assignMutation.isPending}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE, "&:hover": { bgcolor: "#006666" }, py: 1 }}>
            {assignMutation.isPending ? <CircularProgress size={20} color="inherit" /> : "Asignar"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}