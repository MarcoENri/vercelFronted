import React from "react";
import {
  Box,
  Typography,
  Card,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type { CareerCardDto } from "../services/adminCareerCardsService";
import type { AdminStudentRow } from "../services/adminStudentService";

type Props = {
  verde: string;
  careerCards: CareerCardDto[];
  groupedStudents: Record<number, AdminStudentRow[]>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  getStudentName: (s: any) => string;
  getSemaforo: (s: any) => { bg: string; border: string; chipBg: string; chipText: string; label: string; };
  onViewProfile: (id: any) => void;
  onClearIncidents: (id: number) => void;
  onMarkIncidentsSeen?: (id: number) => void;
};

// --- 🚨 ANIMACIONES DE EMERGENCIA (VIBRACIÓN REAL) ---
const animations = {
  '@keyframes emergencyShakeRojo': {
    '0%, 100%': { transform: 'translateX(0)', backgroundColor: '#fff', boxShadow: 'inset 10px 0 0 #FF3131' },
    '20%': { transform: 'translateX(-5px)', backgroundColor: '#FF3131', color: '#fff' },
    '40%': { transform: 'translateX(5px)' },
    '60%': { transform: 'translateX(-5px)' },
    '80%': { transform: 'translateX(5px)', boxShadow: '0 0 25px #FF3131' },
  },
  '@keyframes emergencyShakeNaranja': {
    '0%, 100%': { transform: 'translateX(0)', backgroundColor: '#fff', boxShadow: 'inset 10px 0 0 #FF8C00' },
    '25%': { transform: 'translateX(-3px)', backgroundColor: '#FF8C00', color: '#fff' },
    '75%': { transform: 'translateX(3px)', boxShadow: '0 0 20px #FF8C00' },
  },
  '@keyframes emergencyShakeAmarillo': {
    '0%, 100%': { transform: 'translateX(0)', backgroundColor: '#fff', boxShadow: 'inset 10px 0 0 #FFD700' },
    '50%': { backgroundColor: '#FFD700', transform: 'translateX(-2px)' },
  },
  '@keyframes emergencyShakeAzul': {
    '0%, 100%': { transform: 'translateY(0)', backgroundColor: '#fff', boxShadow: 'inset 10px 0 0 #1976d2' },
    '25%': { transform: 'translateY(-4px)', backgroundColor: '#1976d2', color: '#fff' },
    '75%': { transform: 'translateY(4px)', boxShadow: '0 0 20px #1976d2' },
  }
};

export default function GeneralListSection({
  verde, careerCards, groupedStudents, searchTerm, setSearchTerm, getStudentName, getSemaforo, onViewProfile, onMarkIncidentsSeen
}: Props) {
  return (
    <>
      <Box sx={{ width: "100%", maxWidth: "1100px", mb: 2, ...animations }}>
        <Card sx={{ px: 2, py: 1, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, minHeight: 58 }}>
          <Typography sx={{ fontWeight: 600, color: verde }}>Lista General</Typography>
          <TextField
            placeholder="Nombre, apellido o cédula"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small" sx={{ width: 340 }}
            InputProps={{
              startAdornment: ( <InputAdornment position="start"> <SearchRoundedIcon sx={{ color: verde }} /> </InputAdornment> ),
              sx: { borderRadius: "999px", bgcolor: "#fff", height: 34 },
            }}
          />
        </Card>
      </Box>

      <Box sx={{ width: "100%", maxWidth: "1100px" }}>
        {careerCards.map((career) => {
          const students = groupedStudents[career.id] || [];
          if (searchTerm.trim() && students.length === 0) return null;

          // 🚨 LÓGICA DE DETECCIÓN REAL POR CARRERA 🚨
          // Buscamos si algún estudiante de ESTA carrera tiene incidencias o observaciones nuevas
          const studentsWithAlert = students.filter(
            (s: any) => s.hasUnreadIncidents === true || s.hasUnreadObservations === true
          );
          
          let careerAni = "none";

          if (studentsWithAlert.length > 0) {
            // Obtenemos el nivel máximo de alerta en esta carrera
            const maxIncidents = Math.max(...studentsWithAlert.map((s: any) => s.incidentCount || 0));
            const hasObservations = studentsWithAlert.some((s: any) => s.hasUnreadObservations);

            if (maxIncidents >= 3) careerAni = "emergencyShakeRojo 0.4s infinite";
            else if (maxIncidents === 2) careerAni = "emergencyShakeNaranja 0.6s infinite";
            else if (maxIncidents === 1) careerAni = "emergencyShakeAmarillo 0.8s infinite";
            else if (hasObservations) careerAni = "emergencyShakeAzul 0.7s infinite";
          }

          return (
            <Accordion
              key={career.id}
              sx={{
                mb: 2, borderRadius: "15px !important",
                borderLeft: `8px solid ${career.color ?? "#90a4ae"}`,
                overflow: "hidden"
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  animation: careerAni, // ⚡ AQUÍ ES DONDE VIBRA LA CARRERA ⚡
                  transition: 'all 0.2s ease',
                  '&.Mui-expanded': { minHeight: 48 }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between", pr: 2 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>
                    {career.name} {studentsWithAlert.length > 0 && "🚨"}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {students.length} estudiantes
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <List sx={{ bgcolor: "#fafafa" }}>
                  {students.map((s: any, idx) => {
                    const isTarget = s.hasUnreadIncidents || s.hasUnreadObservations;
                    const sem = getSemaforo(s);

                    return (
                      <Box key={s.id || idx}>
                        <ListItem
                          onClick={() => {
                            onViewProfile(s.id);
                            if (isTarget) {
                                onMarkIncidentsSeen?.(Number(s.id)); 
                            }
                          }}
                          sx={{
                            cursor: "pointer",
                            py: 1.5, px: 4,
                            bgcolor: s.hasUnreadIncidents ? "#fff5f5" : (s.hasUnreadObservations ? "#f0f7ff" : sem.bg),
                            borderLeft: `6px solid ${isTarget ? career.color : sem.border}`,
                            "&:hover": { bgcolor: "#eee" }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", gap: 1.5, alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 800 }}>{getStudentName(s)}</Typography>
                                {isTarget && <Chip label="NUEVO" size="small" color="error" sx={{ fontWeight: 900, animation: 'pulse 1s infinite' }} />}
                                {s.incidentCount > 0 && (
                                  <Box sx={{ bgcolor: s.incidentCount >= 3 ? '#FF3131' : '#FF8C00', color: "#fff", px: 1, borderRadius: "5px", fontSize: 11, fontWeight: 900 }}>
                                    INCIDENCIAS: {s.incidentCount}
                                  </Box>
                                )}
                                {s.observationCount > 0 && (
                                  <Box sx={{ bgcolor: "#1976d2", color: "#fff", px: 1, borderRadius: "5px", fontSize: 11, fontWeight: 900 }}>
                                    OBSERVACIONES: {s.observationCount}
                                  </Box>
                                )}
                              </Box>
                            }
                            secondary={`DNI: ${s.dni ?? s.cedula ?? "-"}`}
                          />
                        </ListItem>
                        {idx < students.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </>
  );
}