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
import { FaFacebookF, FaInstagram, FaWhatsapp, FaTiktok, FaGlobe } from "react-icons/fa";

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

import { forgotPassword } from "../services/authService";
import type { UserResponse } from "../services/adminUserService";

type LoginValues = { username: string; password: string };
type LoginResponse = { token: string };

// ─────────────────────────────────────────
//  VARIANTES Ken Burns — alternan entre slides
// ─────────────────────────────────────────
const KB_VARIANTS = [
  // zoom-in desde centro
  `@keyframes kb0 {
    0%   { transform: scale(1.0)  translate(0%,    0%);   }
    100% { transform: scale(1.12) translate(-1%,  -1%);   }
  }`,
  // zoom-in deriva derecha
  `@keyframes kb1 {
    0%   { transform: scale(1.08) translate(1%,   0.5%);  }
    100% { transform: scale(1.0)  translate(-1%,  -0.5%); }
  }`,
  // zoom-out + deriva izquierda
  `@keyframes kb2 {
    0%   { transform: scale(1.12) translate(-1.5%, 0.5%); }
    100% { transform: scale(1.0)  translate(1.5%, -0.5%); }
  }`,
  // deriva diagonal abajo-derecha
  `@keyframes kb3 {
    0%   { transform: scale(1.0)  translate(1.5%,  1%);   }
    100% { transform: scale(1.1)  translate(-1%,  -1%);   }
  }`,
  // zoom lento centrado
  `@keyframes kb4 {
    0%   { transform: scale(1.0)  translate(0%, 0.5%);    }
    100% { transform: scale(1.08) translate(0%, -0.5%);   }
  }`,
];

// ─────────────────────────────────────────
//  ESTILOS GLOBALES
// ─────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');

  ${KB_VARIANTS.join("\n")}

  @keyframes slideEnter {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes slideExit {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  @keyframes bubblePop {
    0%   { opacity: 0; transform: scale(0) translateY(20px); }
    55%  { opacity: 1; transform: scale(1.25) translateY(-8px); }
    75%  { transform: scale(0.92) translateY(2px); }
    100% { opacity: 1; transform: scale(1) translateY(0px); }
  }

  @keyframes bubbleFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-7px) scale(1.04); }
  }

  @keyframes wdrift {
    0%, 100% { opacity: 0.055; transform: translateX(-50%) rotate(-12deg) translateY(0);    }
    50%       { opacity: 0.09;  transform: translateX(-50%) rotate(-12deg) translateY(-6px); }
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(-20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .bubble-icon {
    opacity: 0;
    animation-name: bubblePop;
    animation-timing-function: cubic-bezier(0.34,1.56,0.64,1);
    animation-fill-mode: forwards;
  }
  .bubble-icon.floating {
    animation-name: bubbleFloat;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    opacity: 1;
  }

  .watermark-text {
    animation: wdrift 8s ease-in-out infinite;
  }

  .login-card-wrap {
    animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
    transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease;
  }
  .login-card-wrap:hover {
    transform: scale(1.025) translateY(-4px) !important;
    box-shadow: 0 40px 80px rgba(0,0,0,0.55) !important;
  }

  .kb-slide {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center 20%;
    animation-timing-function: ease-in-out;
    animation-fill-mode: both;
    will-change: transform, opacity;
  }
`;

function injectStyles() {
  if (document.getElementById("lgn-styles")) return;
  const el = document.createElement("style");
  el.id = "lgn-styles";
  el.textContent = GLOBAL_STYLES;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────
//  DURACIÓN del slideshow (ms)
// ─────────────────────────────────────────
const SLIDE_DURATION   = 5500;  // cuánto dura visible cada foto
const TRANSITION_FADE  = 1200;  // duración del crossfade (ms)
const KB_DURATION      = (SLIDE_DURATION + TRANSITION_FADE) / 1000; // en segundos para CSS

// ─────────────────────────────────────────
//  REDES
// ─────────────────────────────────────────
const SOCIALS = [
  { icon: <FaFacebookF />, color: "#1877F2", glow: "rgba(24,119,242,0.65)",  link: "https://www.facebook.com/institutosudamericano/",   label: "Facebook"  },
  { icon: <FaInstagram />, color: "#E4405F", glow: "rgba(228,64,95,0.65)",   link: "https://www.instagram.com/itsudamericano/", label: "Instagram" },
  { icon: <FaWhatsapp />,  color: "#25D366", glow: "rgba(37,211,102,0.65)",  link: "https://api.whatsapp.com/send/?phone=593996976449", label: "WhatsApp"  },
  { icon: <FaTiktok />,    color: "#ffffff", glow: "rgba(255,255,255,0.4)",  link: "https://www.tiktok.com/@itsudamericano",            label: "TikTok"    },
  { icon: <FaGlobe />,     color: "#00d4d4", glow: "rgba(0,212,212,0.65)",   link: "https://www.sudamericano.edu.ec/",                  label: "Web"       },
];

// ─────────────────────────────────────────
//  BURBUJA
// ─────────────────────────────────────────
function SocialBubble({ s, index, triggerKey }: { s: typeof SOCIALS[0]; index: number; triggerKey: number }) {
  const [floating, setFloating] = useState(false);
  const popDuration = 0.55;
  const popDelay    = index * 0.16;

  useEffect(() => {
    setFloating(false);
    const t = setTimeout(
      () => setFloating(true),
      (popDelay + popDuration + 0.1) * 1000
    );
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  return (
    <Box
      className={`bubble-icon${floating ? " floating" : ""}`}
      component="a"
      href={s.link}
      target="_blank"
      rel="noopener noreferrer"
      title={s.label}
      sx={{
        animationDuration: floating ? `${2.8 + index * 0.3}s` : `${popDuration}s`,
        animationDelay: floating ? `${popDelay + popDuration + 0.1}s` : `${popDelay}s`,
        width: { xs: 46, sm: 52 },
        height: { xs: 46, sm: 52 },
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: { xs: 19, sm: 22 },
        color: s.color,
        textDecoration: "none",
        cursor: "pointer",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: `0 4px 20px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
        transition: "transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease",
        "&:hover": {
          background: "rgba(255,255,255,0.24)",
          boxShadow: `0 10px 36px ${s.glow}, 0 0 0 2.5px ${s.color}88`,
          transform: "scale(1.22) translateY(-5px)",
          animationPlayState: "paused",
        },
      }}
    >
      {s.icon}
    </Box>
  );
}

// ─────────────────────────────────────────
//  LOGIN PAGE
// ─────────────────────────────────────────
export default function LoginPage() {
  const nav = useNavigate();

  useEffect(() => { injectStyles(); }, []);

  const [values, setValues]             = useState<LoginValues>({ username: "", password: "" });
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLogin, setShowLogin]       = useState(() => localStorage.getItem("loginOpen") === "true");
  const [triggerKey, setTriggerKey]     = useState(0);

  // ── Slideshow state ──
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide]       = useState<number | null>(null);
  const [kbIndex, setKbIndex]           = useState(0); // qué variante KB usar

  const brand = { primary: "#008B8B" };

  const slides = useMemo(() => [
    Gastronomia, DisenoGrafico, RedesTelecom, Marketing,
    Contabilidad, TalentoHumano, Enfermeria, Electricidad, DesarrolloSoftware,
  ], []);

  // ── Iniciar slideshow ──
  useEffect(() => {
    // Empezar en slide aleatorio
    const start = Math.floor(Math.random() * slides.length);
    setCurrentSlide(start);
    setTriggerKey(k => k + 1);

    const interval = setInterval(() => {
      setCurrentSlide(cur => {
        const next = (cur + 1) % slides.length;
        setPrevSlide(cur);
        setKbIndex(k => (k + 1) % KB_VARIANTS.length);
        // limpiar prevSlide después del fade
        setTimeout(() => setPrevSlide(null), TRANSITION_FADE + 50);
        return next;
      });
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [slides]);

  useEffect(() => {
    if (showLogin) setTriggerKey(k => k + 1);
    localStorage.setItem("loginOpen", showLogin.toString());
  }, [showLogin]);

  // ── Recuperar contraseña ──
  const [openReset, setOpenReset]       = useState(false);
  const [resetEmail, setResetEmail]     = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg]         = useState("");

  const openResetModal  = () => { setResetMsg(""); setResetEmail(""); setOpenReset(true); };
  const closeResetModal = () => setOpenReset(false);

  const handleSendToken = async () => {
    setResetMsg("");
    if (!resetEmail.trim()) { setResetMsg("Ingresa tu correo."); return; }
    setResetLoading(true);
    try {
      const res = await forgotPassword(resetEmail.trim());
      setResetMsg(res.message || "Se ha enviado un correo con las instrucciones ✅");
    } catch (e: any) {
      setResetMsg(e?.response?.data?.message ?? "Error al enviar correo.");
    } finally {
      setResetLoading(false);
    }
  };

  // ── Login ──
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res   = await api.post<LoginResponse>("/auth/login", values);
      const token = res.data.token;
      localStorage.setItem("token", token);
      const meRes = await api.get<UserResponse>("/me");
      localStorage.setItem("user", JSON.stringify(meRes.data));
      const roles = meRes.data.roles ?? [];
      if      (roles.includes("ROLE_ADMIN"))       nav("/admin",           { replace: true });
      else if (roles.includes("ROLE_COORDINATOR")) nav("/coordinator",     { replace: true });
      else if (roles.includes("ROLE_TUTOR"))       nav("/tutor",           { replace: true });
      else if (roles.includes("ROLE_JURY"))        nav("/jury/predefense", { replace: true });
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

      {/* ══════════════════════════════════════
          SLIDESHOW KEN BURNS — capa de fondo
      ══════════════════════════════════════ */}
      <Box sx={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>

        {/* Slide ANTERIOR — hace fade-out */}
        {prevSlide !== null && (
          <Box
            className="kb-slide"
            sx={{
              backgroundImage: `url(${slides[prevSlide]})`,
              animationName: "slideExit",
              animationDuration: `${TRANSITION_FADE}ms`,
              animationTimingFunction: "ease-in-out",
              animationFillMode: "forwards",
              zIndex: 1,
            }}
          />
        )}

        {/* Slide ACTUAL — entra con fade + Ken Burns */}
        <Box
          key={currentSlide}
          className="kb-slide"
          sx={{
            backgroundImage: `url(${slides[currentSlide]})`,
            animationName: `slideEnter, kb${kbIndex}`,
            animationDuration: `${TRANSITION_FADE}ms, ${KB_DURATION}s`,
            animationTimingFunction: "ease-in-out, ease-in-out",
            animationFillMode: "forwards, both",
            zIndex: 2,
          }}
        />
      </Box>

      {/* Overlay gradiente */}
      <Box sx={{
        position: "fixed", inset: 0, zIndex: 3,
        background: "linear-gradient(160deg, rgba(0,0,0,0.38) 0%, rgba(0,50,50,0.32) 100%)",
      }} />

      {/* ── MARCA DE AGUA ── */}
      <Box
        className="watermark-text"
        sx={{
          position: "fixed",
          bottom: "11%",
          left: "50%",
          zIndex: 4,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(34px, 7.5vw, 88px)",
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,1)",
          opacity: 0.06,
          userSelect: "none",
          textTransform: "uppercase",
        }}
      >
        INSTITUTO SUDAMERICANO
      </Box>

      {/* ── BURBUJAS SNAKE ── */}
      <Box sx={{
        position: "fixed",
        bottom: 26,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        gap: { xs: 1.8, sm: 2.4 },
        alignItems: "center",
      }}>
        {SOCIALS.map((s, i) => (
          <SocialBubble key={s.label} s={s} index={i} triggerKey={triggerKey} />
        ))}
      </Box>

      {/* ── Botón ACCESO ── */}
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
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255,255,255,0.4)",
          transition: "top 0.5s ease, transform 0.2s",
          "&:hover": { transform: "scale(1.05)", background: "rgba(255,255,255,0.4)" },
        }}
      >
        <Avatar sx={{ bgcolor: brand.primary, width: 40, height: 40 }}>
          <AccountCircleIcon />
        </Avatar>
        <Typography sx={{ color: "#fff", fontWeight: 900 }}>ACCESO</Typography>
      </Box>

      {/* ── Card Login ── */}
      <Box sx={{
        position: "absolute", top: 20, right: 20, zIndex: 40,
        width: "330px", pointerEvents: showLogin ? "auto" : "none",
      }}>
        <Collapse in={showLogin} timeout={600}>
          <Box
            className="login-card-wrap"
            sx={{
              backgroundColor: "rgba(255,255,255,0.97)",
              borderRadius: "28px",
              p: 3,
              position: "relative",
              boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
              transformOrigin: "top right",
            }}
          >
            <IconButton
              onClick={() => setShowLogin(false)}
              size="small"
              sx={{ position: "absolute", top: 12, right: 12, color: "#bbb" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box component="img" src={logoImg} onClick={handleReload}
                sx={{ width: "130px", cursor: "pointer" }} />
            </Box>

            <Typography variant="body1" fontWeight={900} color="#222" textAlign="center" mb={2}>
              SISTEMA ACADÉMICO
            </Typography>

            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 1.5 }}>
              <TextField
                placeholder="Usuario o correo"
                required
                value={values.username}
                onChange={(e) => setValues({ ...values, username: e.target.value })}
                sx={fieldStyle(brand)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineRoundedIcon sx={{ color: brand.primary }} />
                    </InputAdornment>
                  ),
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
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: brand.primary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                        {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Link href="#" onClick={openResetModal}
                sx={{ fontSize: "0.7rem", color: brand.primary, textAlign: "right", textDecoration: "none" }}>
                ¿Olvidaste tu contraseña?
              </Link>

              {errorMsg && (
                <Typography sx={{ color: "#d32f2f", fontSize: "0.75rem", textAlign: "center" }}>
                  {errorMsg}
                </Typography>
              )}

              <Button type="submit" disabled={loading} variant="contained" fullWidth
                sx={{ borderRadius: "50px", bgcolor: brand.primary, height: 44, fontWeight: 900 }}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* ── Modal Recuperar Contraseña ── */}
      <Dialog open={openReset} onClose={closeResetModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Recuperar contraseña</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Correo Institucional"
            fullWidth
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            sx={{ mt: 1 }}
            disabled={resetLoading}
          />
          {resetMsg && (
            <Typography sx={{ fontSize: "0.8rem", mt: 1.5, color: resetMsg.includes("✅") ? "green" : "red" }}>
              {resetMsg}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResetModal}>Cancelar</Button>
          <Button variant="contained" disabled={resetLoading} onClick={handleSendToken}
            sx={{ bgcolor: brand.primary }}>
            {resetLoading ? "Enviando..." : "Enviar correo"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

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