import { Title, Text, Stack } from "@mantine/core";

export function HomePage() {
  return (
    <Stack align="center" justify="center" style={{ minHeight: 300, paddingTop: 40 }}>
      <Title order={2} ta="center">
        Добро пожаловать в Watch List!
      </Title>
      <Text c="dimmed" ta="center">
        Выберите доску или создайте новую через меню слева.
      </Text>
    </Stack>
  );
}
