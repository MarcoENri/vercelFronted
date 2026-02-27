import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, CircularProgress,
  Box, Fade, Zoom,
} from "@mui/material";
import {
  Send as SendIcon,
  Subject as SubjectIcon,
  Message as MessageIcon,
  MarkEmailRead as MarkEmailReadIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { sendStudentEmail } from "../services/studentEmailService";

const VERDE = "#008B8B";

type Props = { open: boolean; studentId: number | string | null; studentEmail?: string; onClose: () => void; onSent?: () => void };
type FormValues = { subject: string; body: string };

export default function SendEmailModal({ open, studentId, studentEmail, onClose, onSent }: Props) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { subject: "", body: "" },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const watchBody = watch("body") || "";

  const handleClose = () => { if (!loading) { onClose(); reset(); setSuccess(false); } };

  const onSubmit = async (v: FormValues) => {
    if (!studentId) return;
    try {
      setLoading(true);
      await sendStudentEmail(studentId, { subject: v.subject.trim(), body: v.body.trim() });
      setSuccess(true);
      onSent?.();
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
      "&:hover fieldset": { borderColor: VERDE } 
    },
    "& label.Mui-focused": { color: VERDE },
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth 
      TransitionComponent={Zoom}
      PaperProps={{ sx: { borderRadius: "18px", overflow: "hidden", margin: "16px" } }}
    >

      <DialogTitle sx={{ fontWeight: 800, bgcolor: VERDE, color: "#fff", fontSize: "1rem", display: "flex", alignItems: "center", gap: 1.5, py: 1.5, px: 3 }}>
        <SendIcon sx={{ fontSize: 20 }} />
        <Typography variant="inherit" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {studentEmail ? `Correo a ${studentEmail}` : "Enviar correo"}
        </Typography>
      </DialogTitle>

      <DialogContent 
        sx={{ 
          pt: 5, // Espacio para que no tope con el título
          pb: 1, 
          px: 3, 
          overflowY: "auto", 
          maxHeight: "70vh",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,139,139,0.3)", borderRadius: 10 },
          "&::-webkit-scrollbar-thumb:hover": { bgcolor: VERDE },
        }}
      >
        
        {/* SUCCESS */}
        <Fade in={success}>
          <Box sx={{ display: success ? "flex" : "none", flexDirection: "column", alignItems: "center", py: 4, gap: 1.5 }}>
            <Zoom in={success}><MarkEmailReadIcon sx={{ fontSize: 72, color: VERDE }} /></Zoom>
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: VERDE }}>¡Correo enviado!</Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", textAlign: "center" }}>
              El mensaje fue enviado correctamente.
            </Typography>
          </Box>
        </Fade>

        {/* FORM */}
        <Fade in={!success}>
          <Box sx={{ display: success ? "none" : "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <Controller name="subject" control={control} rules={{ required: "Escribe el asunto" }}
              render={({ field }) => (
                <TextField {...field} label="Asunto" size="small" fullWidth
                  placeholder="Ej: Observación sobre tu documento"
                  error={!!errors.subject} helperText={errors.subject?.message} sx={fieldSx}
                  InputProps={{ startAdornment: <SubjectIcon sx={{ color: VERDE, mr: 1, fontSize: 18 }} /> }} />
              )} />

            <Controller name="body" control={control} rules={{ required: "Escribe el mensaje" }}
              render={({ field }) => (
                <TextField {...field} label="Mensaje" multiline rows={8} fullWidth
                  placeholder="Escribe aquí lo que debe hacer el estudiante..."
                  error={!!errors.body} helperText={errors.body?.message} sx={fieldSx}
                  InputProps={{ 
                    startAdornment: <MessageIcon sx={{ color: VERDE, mr: 1, mt: 0.5, fontSize: 18, alignSelf: "flex-start" }} /> 
                  }} />
              )} />

            <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", textAlign: "right", mt: -2, pr: 1 }}>
              {watchBody.length} caracteres
            </Typography>
          </Box>
        </Fade>
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 2 }}>
          <Button onClick={handleClose} variant="outlined" fullWidth disabled={loading}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#ddd", color: "#555", py: 1.2 }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" fullWidth disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: VERDE, "&:hover": { bgcolor: "#006666" }, py: 1.2 }}>
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}