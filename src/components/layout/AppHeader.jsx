import { Group, Text, Button, Burger, Drawer } from "@mantine/core";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuthToken, useAuthActions } from "@convex-dev/auth/react";
import { useMediaQuery } from "@mantine/hooks";
import { AppNavbar } from "./AppNavbar.jsx";

export function AppHeader() {
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [drawerOpened, setDrawerOpened] = useState(false);

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
            <Button onClick={() => signOut()} variant="light" size="xs">
              Выйти
            </Button>
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
