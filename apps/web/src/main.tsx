import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App.tsx";

import "@fontsource-variable/space-grotesk";

import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@/styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
