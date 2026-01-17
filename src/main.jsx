import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initFirebaseAnalytics } from "./lib/firebase.js";
import "./style.css";

void initFirebaseAnalytics();

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
