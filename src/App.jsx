import { AppShell, Container } from "@mantine/core";
import { AppHeader } from "./components/layout/AppHeader.jsx";
import { AppNavbar } from "./components/layout/AppNavbar.jsx";
import { AppRoutes } from "./router/index.jsx";
import { useAuthToken } from "@convex-dev/auth/react";

import { useMediaQuery } from "@mantine/hooks";

function App() {
  const token = useAuthToken();
  const isMobile = useMediaQuery("(max-width: 600px)");
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={token && !isMobile ? { width: 260, breakpoint: "sm" } : undefined}
      padding={isMobile ? 0 : "md"}
    >
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      {token && !isMobile && (
        <AppShell.Navbar>
          <AppNavbar />
        </AppShell.Navbar>
      )}
      <AppShell.Main>
        <Container size={isMobile ? false : "lg"} px={isMobile ? "xs" : undefined}>
          <AppRoutes />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
