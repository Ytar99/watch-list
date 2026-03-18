import { Title, Text, Button, Stack, TextInput, PasswordInput, Group } from "@mantine/core";
import { useState, useEffect } from "react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { notifications } from "@mantine/notifications";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const { signIn } = useAuthActions();
  const token = useAuthToken();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const updateProfile = useMutation(api.users.updateProfile);

  // Автоматический редирект после авторизации
  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  const handleAuth = async () => {
    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        name: isSignUp ? name : undefined,
        flow: isSignUp ? "signUp" : "signIn",
      });
      if (isSignUp && name) {
        try {
          await updateProfile({ name });
        } catch {
          // ignore, профиль можно изменить вручную позже
        }
      }
      notifications.show({ color: "green", message: "Вход выполнен успешно!" });
    } catch (error) {
      notifications.show({ color: "red", message: error.message || "Ошибка входа" });
    }
  };

  return (
    <Stack align="center" justify="center" h={400}>
      <Title order={2} mb="sm">
        {isSignUp ? "Регистрация" : "Вход"} в Watch List
      </Title>
      <Text c="dimmed" mb="lg">
        {isSignUp ? "Создайте аккаунт" : "Войдите в свой аккаунт"}.
      </Text>
      <TextInput
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        size="lg"
        style={{ width: 300 }}
        label="Email"
      />
      {isSignUp && (
        <TextInput
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="lg"
          style={{ width: 300 }}
          label="Имя"
        />
      )}
      <PasswordInput
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        size="lg"
        style={{ width: 300 }}
        label="Пароль"
      />
      <Group>
        <Button size="lg" onClick={handleAuth} disabled={!email || !password || (isSignUp && !name)}>
          {isSignUp ? "Зарегистрироваться" : "Войти"}
        </Button>
        <Button variant="subtle" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Уже есть аккаунт?" : "Создать аккаунт"}
        </Button>
      </Group>
    </Stack>
  );
}
