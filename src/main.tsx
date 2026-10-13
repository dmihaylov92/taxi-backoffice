import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import "./common/ui/assets/styles.css";
import "./common/ui/assets/approved-theme.css";
import "./common/ui/assets/shell.css";
import "./common/ui/assets/lists.css";
import "./rides/ui/assets/rides.css";
import { consumeLinkToken } from "./auth/domain/services/ResetLinkService";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App linkToken={consumeLinkToken()} />
    </BrowserRouter>
  </StrictMode>,
);
