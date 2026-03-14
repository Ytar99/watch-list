import { useState } from "react";
import { Modal, TextInput, Button, Group } from "@mantine/core";

export function CreateBoardModal({ opened, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введите название");
      return;
    }
    onSubmit(trimmed);
    setName("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Новая доска">
      <form onSubmit={handleSubmit}>
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
