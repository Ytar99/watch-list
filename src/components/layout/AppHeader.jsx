import { Group, Text, Button } from "@mantine/core";
import { Link } from "react-router-dom";

export function AppHeader() {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Group gap="xs">
        <Text fw={700}>Watch List</Text>
      </Group>
      <Group gap="xs">
        <Button component={Link} to="/" variant="subtle" size="xs">
          Доски
        </Button>
        <Button component={Link} to="/profile" variant="subtle" size="xs">
          Профиль
        </Button>
        <Button component={Link} to="/login" variant="light" size="xs">
          Войти
        </Button>
      </Group>
    </Group>
  );
}
