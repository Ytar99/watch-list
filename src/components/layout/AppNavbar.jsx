import { Stack, Button, Text, Loader } from "@mantine/core";
import { IconPlus, IconList } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuthToken } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { CreateBoardModal } from "@/components/boards/CreateBoardModal";

export function AppNavbar() {
  const token = useAuthToken();
  const boards = useQuery(api.boards.list);
  const createBoard = useMutation(api.boards.create);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) return null;

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
    <Stack gap="xs" p="md">
      <Button onClick={() => setModalOpen(true)} fullWidth disabled={loading} leftSection={<IconPlus size={16} />}>
        {loading ? "Создание..." : "Создать доску"}
      </Button>
      {boards === undefined ? (
        <Loader size="sm" />
      ) : boards.length === 0 ? (
        <Text c="dimmed" size="sm">
          Нет досок
        </Text>
      ) : (
        boards.map((board) => (
          <Button
            key={board._id}
            component={Link}
            to={`/board/${board._id}`}
            variant="subtle"
            fullWidth
            style={{ justifyContent: "flex-start" }}
            leftSection={<IconList size={16} />}
          >
            {board.name}
          </Button>
        ))
      )}
      <CreateBoardModal opened={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </Stack>
  );
}
