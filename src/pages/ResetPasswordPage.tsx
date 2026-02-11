import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Collapse, Avatar } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// Imágenes de fondo (las mismas que en login)
import Gastronomia from "../assets/imagenes-Tec/Gastronomia.jpeg";
import DesarrolloSoftware from "../assets/imagenes-Tec/Desarrolo-De-Software.jpeg";
import RedesTelecom from "../assets/imagenes-Tec/Redes-y-Telecomunicaciones.jpeg";
import DisenoGrafico from "../assets/imagenes-Tec/Diseno-Grafico.jpeg";
import Marketing from "../assets/imagenes-Tec/Marketing-Digital-y-Negocios.jpeg";
import Contabilidad from "../assets/imagenes-Tec/Contabilidad-y-Asesoria-Tributaria.jpeg";
import TalentoHumano from "../assets/imagenes-Tec/Talento-Humano.jpeg";
import Enfermeria from "../assets/imagenes-Tec/Enfermeria.jpeg";
import Electricidad from "../assets/imagenes-Tec/Electricidad.jpeg";

import logoImg from "../assets/imagenes/LogoTec-Photoroom.png";

// Servicio
import { resetPassword } from "../services/authService";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Fondo aleatorio
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
  const [bgRandom, setBgRandom] = useState("");
  useEffect(() => {
    const idx = Math.floor(Math.random() * slides.length);
    setBgRandom(slides[idx]);
  }, [slides]);

  const brand = { primary: "#008B8B" };

  const handleSubmit = async () => {
    setMsg("");
    if (!token) {
      setMsg("Token inválido o ausente.");
      return;
    }
    if (password.length < 6) {
      setMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setMsg("Contraseña actualizada correctamente ✅");
      setTimeout(() => nav("/"), 2000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? "Error al cambiar contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", backgroundColor: "#000" }}>
      {/* Fondo */}
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

      {/* Caja central */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 350,
          p: 3,
          borderRadius: 3,
          bgcolor: "rgba(255,255,255,0.98)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Box component="img" src={logoImg} sx={{ width: "130px", cursor: "pointer" }} onClick={() => window.location.reload()} />
        </Box>

        <Typography variant="h6" fontWeight={900} color="#222" textAlign="center" mb={2}>
          Nueva contraseña
        </Typography>

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <TextField
            label="Nueva contraseña"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={fieldStyle(brand)}
          />

          {msg && (
            <Typography sx={{ fontSize: "0.85rem", color: msg.includes("✅") ? "green" : "#d32f2f", mt: 1, textAlign: "center" }}>
              {msg}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2, borderRadius: "50px", bgcolor: brand.primary, height: 44, fontWeight: 900 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </Box>
      </Box>
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
