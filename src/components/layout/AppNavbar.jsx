import { Stack, Text, Loader, Group, ActionIcon, Box, NavLink } from "@mantine/core";
import { IconPlus, IconList } from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();

  if (!token) return null;

  const handleCreate = async ({ name, emoji }) => {
    setLoading(true);
    try {
      await createBoard({ name, emoji });
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  return (
    <Stack gap="xs" p="md">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed">
          Доски
        </Text>
        <ActionIcon
          variant="light"
          size="sm"
          onClick={() => setModalOpen(true)}
          aria-label="Создать доску"
          loading={loading}
        >
          <IconPlus size={14} />
        </ActionIcon>
      </Group>
      {boards === undefined ? (
        <Loader size="sm" />
      ) : boards.length === 0 ? (
        <Text c="dimmed" size="sm">
          Нет досок
        </Text>
      ) : (
        boards.map((board) => (
          <NavLink
            key={board._id}
            component={Link}
            to={`/board/${board._id}`}
            active={location.pathname === `/board/${board._id}`}
            label={
              <Text size="sm" fw={500}>
                {board.name}
              </Text>
            }
            description={
              <Text size="xs" c="dimmed">
                {board.role === "creator"
                  ? "Создатель"
                  : board.role === "moderator"
                    ? "Модератор"
                    : "Участник"}
              </Text>
            }
            leftSection={
              <Box w={20} style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                {board.emoji ? (
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{board.emoji}</span>
                ) : (
                  <IconList size={16} />
                )}
              </Box>
            }
            variant="light"
            styles={{
              label: { fontWeight: 500 },
            }}
          />
        ))
      )}
      <CreateBoardModal opened={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </Stack>
  );
}
