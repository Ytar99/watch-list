import { useState } from "react";
import { Modal, TextInput, NumberInput, Button, Group } from "@mantine/core";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function CreateItemModal({ boardId, opened, onClose }) {
  const create = useMutation(api.items.create);
  const [title, setTitle] = useState("");
  const [totalEpisodes, setTotalEpisodes] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError("Введите название");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await create({
        boardId,
        title: t,
        totalEpisodes: Math.max(1, totalEpisodes),
        currentEpisode: Math.max(0, currentEpisode),
        url: url.trim() || undefined,
      });
      setTitle("");
      setTotalEpisodes(1);
      setCurrentEpisode(0);
      setUrl("");
      onClose();
    } catch (err) {
      setError(err?.message ?? "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setError("");
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Добавить элемент">
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Название"
          placeholder="Фильм / сериал / книга"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
        />
        <NumberInput
          label="Всего эпизодов / глав"
          min={1}
          value={totalEpisodes}
          onChange={(v) => setTotalEpisodes(Number(v) || 1)}
          mt="sm"
        />
        <NumberInput
          label="Текущий эпизод / глава"
          min={0}
          value={currentEpisode}
          onChange={(v) => setCurrentEpisode(Number(v) || 0)}
          mt="sm"
        />
        <TextInput
          label="Ссылка (необязательно)"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          mt="sm"
        />
        <Group justify="flex-end" mt="md">
          <Button type="button" variant="subtle" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={loading}>
            Добавить
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
