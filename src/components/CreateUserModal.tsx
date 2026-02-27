import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Switch, FormControlLabel,
  CircularProgress, Box, Typography, Fade, Zoom, Chip, Avatar,
  InputAdornment, IconButton, ListItemIcon,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Visibility, VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AdminPanelSettings, School, SupervisorAccount, Gavel,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { createUser } from "../services/adminUserService";

const VERDE = "#008B8B";

const ROLE_CONFIG = {
  ADMIN:       { color: "#d32f2f", bg: "#ffebee", icon: <AdminPanelSettings sx={{ fontSize: 14 }} /> },
  COORDINATOR: { color: "#1565c0", bg: "#e3f2fd", icon: <SupervisorAccount sx={{ fontSize: 14 }} /> },
  TUTOR:       { color: "#2e7d32", bg: "#e8f5e9", icon: <School sx={{ fontSize: 14 }} /> },
  JURY:        { color: "#e65100", bg: "#fff3e0", icon: <Gavel sx={{ fontSize: 14 }} /> },
} as const;

type RoleKey = keyof typeof ROLE_CONFIG;
type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };
type FormValues = {
  username: string; password: string; fullName: string;
  email: string; roles: RoleKey[]; enabled: boolean;
};

export default function CreateUserModal({ open, onClose, onSuccess }: Props) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { username: "", password: "", fullName: "", email: "", roles: [], enabled: true },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const watchRoles = watch("roles");

  const handleClose = () => { if (!loading) { onClose(); reset(); setSuccess(false); } };

  const onSubmit = async (v: FormValues) => {
    try {
      setLoading(true);
      await createUser({ username: v.username.trim(), password: v.password, fullName: v.fullName.trim(), email: v.email.trim(), roles: v.roles });
      setSuccess(true);
      onSuccess?.();
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
      maxWidth="sm"
      fullWidth 
      TransitionComponent={Zoom}
      PaperProps={{ 
        sx: { 
          borderRadius: "18px", 
          overflow: "hidden",
          margin: "16px"
        } 
      }}
    >

      <DialogTitle sx={{ fontWeight: 800, bgcolor: VERDE, color: "#fff", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 1, py: 1.5, px: 2.5 }}>
        <PersonAddIcon sx={{ fontSize: 18 }} />
        Crear usuario
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 1, px: 3, overflowY: "auto", maxHeight: "65vh" }}>

        {/* SUCCESS */}
        <Fade in={success}>
          <Box sx={{ display: success ? "flex" : "none", flexDirection: "column", alignItems: "center", py: 3, gap: 1.5 }}>
            <Zoom in={success}>
              <CheckCircleIcon sx={{ fontSize: 64, color: VERDE }} />
            </Zoom>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: VERDE }}>¡Usuario creado!</Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>El usuario fue registrado exitosamente.</Typography>
          </Box>
        </Fade>

        {/* FORM */}
        <Fade in={!success}>
          <Box sx={{ display: success ? "none" : "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>

            <Controller name="username" control={control} rules={{ required: "Ingresa el username", minLength: { value: 3, message: "Mínimo 3 caracteres" } }}
              render={({ field }) => (
                <TextField {...field} label="Usuario" size="small" fullWidth placeholder="Ej: jurado_01"
                  error={!!errors.username} helperText={errors.username?.message} sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: VERDE, fontSize: 18 }} /></InputAdornment> }} />
              )} />

            <Controller name="password" control={control} rules={{ required: "Ingresa la contraseña" }}
              render={({ field }) => (
                <TextField {...field} label="Contraseña" type={showPass ? "text" : "password"} size="small" fullWidth
                  error={!!errors.password} helperText={errors.password?.message} sx={fieldSx}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: VERDE, fontSize: 18 }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPass(!showPass)}>{showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>,
                  }} />
              )} />

            <Controller name="fullName" control={control} rules={{ required: "Ingresa el nombre completo" }}
              render={({ field }) => (
                <TextField {...field} label="Nombre completo" size="small" fullWidth placeholder="Ej: Juan Pérez"
                  error={!!errors.fullName} helperText={errors.fullName?.message} sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon sx={{ color: VERDE, fontSize: 18 }} /></InputAdornment> }} />
              )} />

            <Controller name="email" control={control} rules={{ required: "Ingresa el email", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" } }}
              render={({ field }) => (
                <TextField {...field} label="Email" size="small" fullWidth placeholder="ejemplo@correo.com"
                  error={!!errors.email} helperText={errors.email?.message} sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: VERDE, fontSize: 18 }} /></InputAdornment> }} />
              )} />

            <Controller name="roles" control={control} rules={{ validate: (v) => v.length > 0 || "Selecciona al menos 1 rol" }}
              render={({ field }) => (
                <TextField {...field} select label="Roles" size="small" fullWidth
                  error={!!errors.roles} helperText={(errors.roles as any)?.message} sx={fieldSx}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {(selected as RoleKey[]).map((r) => (
                          <Chip key={r} label={r} size="small"
                            sx={{ bgcolor: ROLE_CONFIG[r].bg, color: ROLE_CONFIG[r].color, fontWeight: 800, fontSize: "0.65rem", height: 20, borderRadius: "6px" }} />
                        ))}
                      </Box>
                    ),
                  }}
                >
                  {(Object.keys(ROLE_CONFIG) as RoleKey[]).map((r) => (
                    <MenuItem key={r} value={r}
                      sx={{ borderRadius: "8px", mx: 0.5, my: 0.2, "&:hover": { bgcolor: ROLE_CONFIG[r].bg }, "&.Mui-selected": { bgcolor: ROLE_CONFIG[r].bg, fontWeight: 700 } }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: ROLE_CONFIG[r].color, fontSize: "0.6rem" }}>
                          {ROLE_CONFIG[r].icon}
                        </Avatar>
                      </ListItemIcon>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: watchRoles.includes(r) ? 700 : 400 }}>{r}</Typography>
                      {watchRoles.includes(r) && <CheckCircleIcon sx={{ ml: "auto", color: ROLE_CONFIG[r].color, fontSize: 16 }} />}
                    </MenuItem>
                  ))}
                </TextField>
              )} />

            <Controller name="enabled" control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange}
                    sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: VERDE }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: VERDE } }} />}
                  label={<Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Usuario activo</Typography>}
                />
              )} />
          </Box>
        </Fade>
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 2 }}>
          <Button onClick={handleClose} variant="outlined" fullWidth disabled={loading}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555", py: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" fullWidth disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE, "&:hover": { bgcolor: "#006666" }, py: 1 }}>
            {loading ? "Creando..." : "Crear"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}