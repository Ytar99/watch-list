import { Title, Text, Card } from "@mantine/core";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export function ProfilePage() {
  const user = useQuery(api.users.getCurrentUser);

  return (
    <>
      <Title order={2} mb="sm">
        Профиль
      </Title>
      {user === undefined ? (
        <Text c="dimmed">Загрузка…</Text>
      ) : user === null ? (
        <Text c="dimmed">
          Вы не авторизованы. Войдите через провайдер (Clerk, Auth0, Convex Auth и т.д.) — затем здесь отобразятся имя и
          email.
        </Text>
      ) : (
        <Card withBorder padding="md">
          <Text fw={500}>{user.name}</Text>
          {user.email && (
            <Text size="sm" c="dimmed" mt="xs">
              {user.email}
            </Text>
          )}
        </Card>
      )}
    </>
  );
}
