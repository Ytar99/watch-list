import { Title, Text, Stack, SimpleGrid, Card, Button, Loader, Group } from "@mantine/core";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { CreateBoardModal } from "@/components/boards/CreateBoardModal";

export function HomePage() {
  const boards = useQuery(api.boards.list);
  const createBoard = useMutation(api.boards.create);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (name) => {
    setLoading(true);
    try {
      await createBoard({ name });
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={2}>Мои доски</Title>
        <Button onClick={() => setModalOpen(true)} disabled={loading}>
          {loading ? "Создание..." : "Создать доску"}
        </Button>
      </Group>
      {boards === undefined ? (
        <Loader />
      ) : boards.length === 0 ? (
        <Stack align="center" justify="center" style={{ minHeight: 300 }}>
          <Title order={3} c="dimmed">
            Нет досок
          </Title>
          <Text c="dimmed">Создайте свою первую доску, чтобы начать.</Text>
        </Stack>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
          {boards.map((board) => (
            <Card
              key={board._id}
              withBorder
              padding="md"
              component={Link}
              to={`/board/${board._id}`}
              style={{ textDecoration: "none" }}
            >
              <Text fw={500}>{board.name}</Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
      <CreateBoardModal opened={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </Stack>
  );
}
