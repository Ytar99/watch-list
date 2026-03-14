import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import App from "./App.jsx";
import { theme } from "./theme.js";
import { CONVEX_URL } from "./convex-env.js";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

const convex = new ConvexReactClient(CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications />
        <HashRouter>
          <App />
        </HashRouter>
      </MantineProvider>
    </ConvexAuthProvider>
  </React.StrictMode>,
);
