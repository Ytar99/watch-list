import { useState, useEffect } from "react";
import { Modal, TextInput, NumberInput, Button, Group } from "@mantine/core";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function EditItemModal({ itemId, item, onClose }) {
  const update = useMutation(api.items.update);
  const [title, setTitle] = useState("");
  const [totalEpisodes, setTotalEpisodes] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setTotalEpisodes(item.totalEpisodes);
      setCurrentEpisode(item.currentEpisode);
      setUrl(item.url ?? "");
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemId) return;
    setLoading(true);
    try {
      await update({
        itemId,
        title: title.trim(),
        totalEpisodes: Math.max(1, totalEpisodes),
        currentEpisode: Math.max(0, currentEpisode),
        url: url.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!itemId) return null;

  return (
    <Modal opened={!!itemId} onClose={onClose} title="Изменить элемент">
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          mt="sm"
        />
        <Group justify="flex-end" mt="md">
          <Button type="button" variant="subtle" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={loading}>
            Сохранить
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
