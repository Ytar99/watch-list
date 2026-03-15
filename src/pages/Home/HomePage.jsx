import { Title, Text, Stack } from "@mantine/core";

export function HomePage() {
  return (
    <Stack gap="lg">
      <Title order={2}>Добро пожаловать в Watch List</Title>
      <Text c="dimmed">
        Выберите доску в сайдбаре слева, чтобы увидеть общий список и ваши элементы. Если досок ещё нет, нажмите на
        маленький плюс вверху сайдбара, чтобы создать первую.
      </Text>
    </Stack>
  );
}
