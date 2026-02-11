import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

// ================= MUI =================
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Collapse,
  Link,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CloseIcon from "@mui/icons-material/Close";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// ============== ICONOS SOCIALES =========
import { FaFacebookF, FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";

// ================= IMÁGENES ============
import logoImg from "../assets/imagenes/LogoTec-Photoroom.png";
import Gastronomia from "../assets/imagenes-Tec/Gastronomia.jpeg";
import DesarrolloSoftware from "../assets/imagenes-Tec/Desarrolo-De-Software.jpeg";
import RedesTelecom from "../assets/imagenes-Tec/Redes-y-Telecomunicaciones.jpeg";
import DisenoGrafico from "../assets/imagenes-Tec/Diseno-Grafico.jpeg";
import Marketing from "../assets/imagenes-Tec/Marketing-Digital-y-Negocios.jpeg";
import Contabilidad from "../assets/imagenes-Tec/Contabilidad-y-Asesoria-Tributaria.jpeg";
import TalentoHumano from "../assets/imagenes-Tec/Talento-Humano.jpeg";
import Enfermeria from "../assets/imagenes-Tec/Enfermeria.jpeg";
import Electricidad from "../assets/imagenes-Tec/Electricidad.jpeg";

// ✅ Servicios
import { forgotPassword, resetPassword } from "../services/authService";
import type { UserResponse } from "../services/adminUserService";

// ================= TIPOS =================
type LoginValues = { username: string; password: string };
type LoginResponse = { token: string };

export default function LoginPage() {
  const nav = useNavigate();

  // Estados de Login
  const [values, setValues] = useState<LoginValues>({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bgRandom, setBgRandom] = useState("");
  const [showLogin, setShowLogin] = useState(() => {
    const saved = localStorage.getItem("loginOpen");
    return saved === "true";
  });

  const brand = { primary: "#008B8B" };

  // Slider de fondo
  const slides = useMemo(
    () => [
      Gastronomia,
      DisenoGrafico,
      RedesTelecom,
      Marketing,
      Contabilidad,
      TalentoHumano,
      Enfermeria,
      Electricidad,
      DesarrolloSoftware,
    ],
    []
  );

  useEffect(() => {
    const idx = Math.floor(Math.random() * slides.length);
    setBgRandom(slides[idx]);
  }, [slides]);

  useEffect(() => {
    localStorage.setItem("loginOpen", showLogin.toString());
  }, [showLogin]);

  // ================= LÓGICA RECUPERAR CONTRASEÑA =================
  const [openReset, setOpenReset] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "reset">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const openResetModal = () => {
    setResetMsg("");
    setResetStep("email");
    setResetEmail("");
    setResetToken("");
    setResetNewPass("");
    setOpenReset(true);
  };

  const closeResetModal = () => setOpenReset(false);

  const handleSendToken = async () => {
    setResetMsg("");
    if (!resetEmail.trim()) {
      setResetMsg("Ingresa tu correo.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await forgotPassword(resetEmail.trim());
      setResetMsg(res.message || "Se envió un código a tu correo ✅");
      setResetStep("reset");
    } catch (e: any) {
      setResetMsg(e?.response?.data?.message ?? "Error al enviar correo.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleDoReset = async () => {
    setResetMsg("");
    if (!resetToken.trim()) {
      setResetMsg("Pega el token recibido.");
      return;
    }
    if (resetNewPass.length < 6) {
      setResetMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(resetToken.trim(), resetNewPass);
      setResetMsg("Contraseña actualizada ✅ Ya puedes iniciar sesión.");
      setTimeout(() => setOpenReset(false), 2000);
    } catch (e: any) {
      setResetMsg(e?.response?.data?.message ?? "No se pudo cambiar la contraseña.");
    } finally {
      setResetLoading(false);
    }
  };

  // ================= LÓGICA LOGIN =================
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>("/auth/login", values);
      const token = res.data.token;
      localStorage.setItem("token", token);

      const meRes = await api.get<UserResponse>("/me");
      localStorage.setItem("user", JSON.stringify(meRes.data));

      const roles = meRes.data.roles ?? [];

      if (roles.includes("ROLE_ADMIN")) nav("/admin", { replace: true });
      else if (roles.includes("ROLE_COORDINATOR")) nav("/coordinator", { replace: true });
      else if (roles.includes("ROLE_TUTOR")) nav("/tutor", { replace: true });
      else if (roles.includes("ROLE_JURY")) nav("/jury/predefense", { replace: true });
      else {
        setErrorMsg("Tu usuario no tiene rol asignado.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } catch (err: any) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setErrorMsg(err?.response?.data?.message ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleReload = () => window.location.reload();

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", backgroundColor: "#000" }}>
      {/* Fondo Aleatorio */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          backgroundImage: bgRandom ? `url(${bgRandom})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          transition: "background-image 0.5s ease-in-out",
        }}
      />

      {/* Botón Flotante ACCESO */}
      <Box
        onClick={() => setShowLogin(true)}
        sx={{
          position: "absolute",
          top: showLogin ? -150 : 25,
          right: 25,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 2,
          cursor: "pointer",
          p: "8px 22px 8px 10px",
          borderRadius: "50px",
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          transition: "top 0.5s ease, transform 0.2s",
          "&:hover": { transform: "scale(1.05)", background: "rgba(255, 255, 255, 0.4)" },
        }}
      >
        <Avatar sx={{ bgcolor: brand.primary, width: 40, height: 40 }}>
          <AccountCircleIcon />
        </Avatar>
        <Typography sx={{ color: "#fff", fontWeight: 900 }}>ACCESO</Typography>
      </Box>

      {/* Formulario de Login Colapsable */}
      <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 40, width: "330px", pointerEvents: showLogin ? "auto" : "none" }}>
        <Collapse in={showLogin} timeout={600}>
          <Box sx={{ backgroundColor: "rgba(255, 255, 255, 0.98)", borderRadius: "28px", p: 3, position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
            <IconButton onClick={() => setShowLogin(false)} size="small" sx={{ position: "absolute", top: 12, right: 12, color: "#bbb" }}>
              <CloseIcon fontSize="small" />
            </IconButton>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box component="img" src={logoImg} onClick={handleReload} sx={{ width: "130px", cursor: "pointer" }} />
            </Box>

            <Typography variant="body1" fontWeight={900} color="#222" textAlign="center" mb={2}>SISTEMA ACADÉMICO</Typography>

            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 1.5 }}>
              <TextField
                placeholder="Usuario o correo"
                required
                value={values.username}
                onChange={(e) => setValues({ ...values, username: e.target.value })}
                sx={fieldStyle(brand)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PersonOutlineRoundedIcon sx={{ color: brand.primary }} /></InputAdornment>,
                }}
              />
              <TextField
                placeholder="Contraseña"
                type={showPassword ? "text" : "password"}
                required
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
                sx={fieldStyle(brand)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: brand.primary }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                        {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Link href="#" onClick={openResetModal} sx={{ fontSize: "0.7rem", color: brand.primary, textAlign: "right", textDecoration: "none" }}>
                ¿Olvidaste tu contraseña?
              </Link>
              
              {errorMsg && <Typography sx={{ color: "#d32f2f", fontSize: "0.75rem", textAlign: "center" }}>{errorMsg}</Typography>}
              
              <Button type="submit" disabled={loading} variant="contained" fullWidth sx={{ borderRadius: "50px", bgcolor: brand.primary, height: 44, fontWeight: 900 }}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>

              {/* Redes Sociales */}
              <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 1 }}>
                <Social icon={<FaFacebookF />} color="#1877F2" link="https://www.facebook.com/institutosudamericano" />
                <Social icon={<FaInstagram />} color="#E4405F" link="https://www.instagram.com/itsudamericano"/>
                <Social icon={<FaWhatsapp />} color="#25D366" link="https://api.whatsapp.com/send/?phone=593996976449"/>
                <Social icon={<FaTiktok />} color="#000" link="https://www.tiktok.com/@itsudamericano"/>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* Modal Recuperar Contraseña (2 Pasos) */}
      <Dialog open={openReset} onClose={closeResetModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Recuperar contraseña</DialogTitle>
        <DialogContent dividers>
          {resetStep === "email" ? (
            <TextField 
              label="Correo Institucional" 
              fullWidth 
              value={resetEmail} 
              onChange={(e) => setResetEmail(e.target.value)} 
              sx={{ mt: 1 }} 
            />
          ) : (
            <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
              <TextField 
                label="Token del correo" 
                fullWidth 
                value={resetToken} 
                onChange={(e) => setResetToken(e.target.value)} 
              />
              <TextField 
                label="Nueva Contraseña" 
                type="password" 
                fullWidth 
                value={resetNewPass} 
                onChange={(e) => setResetNewPass(e.target.value)} 
              />
            </Box>
          )}
          {resetMsg && (
            <Typography sx={{ fontSize: "0.8rem", mt: 1, color: resetMsg.includes("✅") ? "green" : "red" }}>
              {resetMsg}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResetModal}>Cancelar</Button>
          <Button 
            variant="contained" 
            disabled={resetLoading}
            onClick={resetStep === "email" ? handleSendToken : handleDoReset} 
            sx={{ bgcolor: brand.primary }}
          >
            {resetLoading ? "Procesando..." : "Continuar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Estilos Reutilizables
const fieldStyle = (brand: any) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "50px",
    height: "44px",
    backgroundColor: "#f7f7f7",
    "& fieldset": { borderColor: "#eee" },
    "&.Mui-focused fieldset": { borderColor: brand.primary },
  },
  "& .MuiInputBase-input": { fontSize: "0.85rem", ml: 0.5 },
});

function Social({ icon, color, link }: { icon: any; color: string; link: string }) {
  return (
    <IconButton size="small" component="a" href={link} target="_blank" sx={{ color }}>
      {icon}
    </IconButton>
  );
}