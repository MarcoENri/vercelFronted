import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";


import "antd/dist/reset.css";


document.documentElement.style.fontSize = "13.5px";


document.documentElement.lang = "es";


document.documentElement.setAttribute("translate", "no");

const meta = document.createElement("meta");
meta.name = "google";
meta.content = "notranslate";
document.head.appendChild(meta);


sessionStorage.clear();


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);