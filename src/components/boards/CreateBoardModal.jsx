import { useState } from "react";
import { Modal, TextInput, Button, Group, Stack, SimpleGrid, Paper, Text } from "@mantine/core";

const EMOJI_OPTIONS = [
  "🎬",
  "🎥",
  "📺",
  "🍿",
  "📚",
  "📖",
  "🎮",
  "🕹️",
  "🎧",
  "🎵",
  "🎼",
  "🏀",
  "⚽",
  "🏈",
  "🎯",
  "🧩",
  "🚀",
  "🌟",
  "🔥",
  "💡",
  "✅",
  "⭐",
  "❤️",
  "😊",
  "😎",
  "🤔",
  "📝",
  "📌",
  "📆",
  "🗂️",
];

export function CreateBoardModal({ opened, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [emoji, setEmoji] = useState("🎬");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введите название");
      return;
    }
    onSubmit({ name: trimmed, emoji });
    setName("");
    setEmoji("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setEmoji("🎬");
    setError("");
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Новая доска">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Название"
            placeholder="Например: Сериалы 2025"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            error={error}
          />
          <Stack gap={4}>
            <Group justify="space-between" align="center">
              <Text size="sm" fw={500}>
                Эмодзи доски
              </Text>
              <Text size="sm">
                Выбрано: <span style={{ fontSize: 18 }}>{emoji}</span>
              </Text>
            </Group>
            <SimpleGrid cols={8} spacing={4}>
              {EMOJI_OPTIONS.map((option) => (
                <Paper
                  key={option}
                  withBorder
                  radius="md"
                  p={4}
                  style={{
                    textAlign: "center",
                    cursor: "pointer",
                    borderColor: option === emoji ? "var(--mantine-color-indigo-5)" : undefined,
                    boxShadow: option === emoji ? "0 0 0 1px var(--mantine-color-indigo-5)" : "none",
                  }}
                  onClick={() => setEmoji(option)}
                >
                  <Text style={{ fontSize: 18, lineHeight: 1 }}>{option}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button type="button" variant="subtle" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit">Создать</Button>
        </Group>
      </form>
    </Modal>
  );
}
