import { Group, Text, Button, Burger, Drawer } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuthToken, useAuthActions } from "@convex-dev/auth/react";
import { useMediaQuery } from "@mantine/hooks";
import { AppNavbar } from "./AppNavbar.jsx";

export function AppHeader() {
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [drawerOpened, setDrawerOpened] = useState(false);
  const location = useLocation();
  const onProfilePage = location.pathname === "/profile";

  return (
    <>
      <Group h="100%" px="md" justify="space-between">
        <Group gap="xs">
          {token && isMobile && (
            <Burger opened={drawerOpened} onClick={() => setDrawerOpened(!drawerOpened)} size="sm" />
          )}
          <Text fw={700}>Watch List</Text>
        </Group>
        <Group gap="xs">
          {token ? (
            <>
              {!onProfilePage && (
                <Button component={Link} to="/profile" variant="subtle" size="xs">
                  Профиль
                </Button>
              )}
              <Button onClick={() => signOut()} variant="light" size="xs">
                Выйти
              </Button>
            </>
          ) : (
            <Button component={Link} to="/login" variant="light" size="xs">
              Войти
            </Button>
          )}
        </Group>
      </Group>
      {token && isMobile && (
        <Drawer opened={drawerOpened} onClose={() => setDrawerOpened(false)} title="Мои доски" padding="md">
          <AppNavbar />
        </Drawer>
      )}
    </>
  );
}
