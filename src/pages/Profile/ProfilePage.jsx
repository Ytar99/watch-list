import { Title, Text, Card, Stack, TextInput, PasswordInput, Button, Group } from "@mantine/core";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";

export function ProfilePage() {
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user !== null) {
      setName(user.name ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({ name });
      notifications.show({ color: "green", message: "Профиль обновлён" });
    } catch (error) {
      notifications.show({ color: "red", message: error.message || "Не удалось сохранить профиль" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
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
        <Stack gap="md">
          <Card withBorder padding="md">
            <Stack gap="sm">
              <TextInput label="Имя" value={name} onChange={(e) => setName(e.target.value)} />
              {user.email && (
                <Text size="sm" c="dimmed">
                  Email (нельзя изменить): {user.email}
                </Text>
              )}
              <Group justify="flex-end" mt="sm">
                <Button onClick={handleSave} loading={saving}>
                  Сохранить
                </Button>
              </Group>
            </Stack>
          </Card>
          <Card withBorder padding="md">
            <Stack gap="xs">
              <Text fw={500}>Смена пароля</Text>
              <Text size="sm" c="dimmed">
                Возможность смены пароля будет добавлена позже. Сейчас вы можете выйти и войти снова, используя актуальные
                данные доступа.
              </Text>
              <PasswordInput label="Текущий пароль" disabled />
              <PasswordInput label="Новый пароль" disabled />
              <PasswordInput label="Повторите новый пароль" disabled />
              <Group justify="flex-end" mt="sm">
                <Button disabled>Обновить пароль</Button>
              </Group>
            </Stack>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}
