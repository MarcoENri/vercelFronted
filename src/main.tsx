import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "antd/dist/reset.css";

// Escala global — hace todo 13% más compacto sin tocar nada más
document.documentElement.style.fontSize = "13.5px";

sessionStorage.clear();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);