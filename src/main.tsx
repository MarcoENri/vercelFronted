import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "antd/dist/reset.css";

// --- CAMBIO: Limpia la sesión al cargar el archivo por primera vez ---
sessionStorage.clear(); 
// ---------------------------------------------------------------------

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);