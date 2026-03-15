import { useParams } from "react-router-dom";
import { Title, Text, Tabs, Card, Group, Badge, Stack, Button, Progress, Loader, TextInput } from "@mantine/core";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { CreateItemModal } from "@/components/items/CreateItemModal";
import { EditItemModal } from "@/components/items/EditItemModal";
import { RatingDisplay } from "@/components/items/RatingDisplay";
import { PersonalRatingDisplay } from "@/components/items/PersonalRatingDisplay";
import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ item, onEdit, onComplete, onHide, onHardDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pct = item.totalEpisodes > 0 ? Math.round((item.currentEpisode / item.totalEpisodes) * 100) : 0;
  const isCompleted = pct >= 100;

  return (
    <Card ref={setNodeRef} style={style} padding="sm" withBorder>
      <Group justify="space-between">
        <div {...attributes} {...listeners} style={{ cursor: "grab", flex: 1 }}>
          <Text fw={500}>{item.title}</Text>
          <Text size="xs" c="dimmed">
            {item.currentEpisode}/{item.totalEpisodes}
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer">
                {" "}
                · ссылка
              </a>
            )}
          </Text>
        </div>
        <Group gap="xs">
          <Button size="xs" variant="subtle" onClick={() => onEdit(item._id)}>
            Изменить
          </Button>
          {pct < 100 && (
            <Button size="xs" variant="light" onClick={() => onComplete(item._id)}>
              Готово
            </Button>
          )}
          {!item.isHidden ? (
            <Button size="xs" variant="subtle" color="red" onClick={() => onHide({ itemId: item._id })}>
              Скрыть
            </Button>
          ) : (
            <Button size="xs" variant="subtle" color="red" onClick={() => onHardDelete({ itemId: item._id })}>
              Удалить окончательно
            </Button>
          )}
        </Group>
      </Group>
      <Progress value={pct} size="sm" mt="xs" />
      <PersonalRatingDisplay itemId={item._id} isCompleted={isCompleted} />
    </Card>
  );
}

function MergedList({ boardId }) {
  const merged = useQuery(api.items.getMergedBoardItems, { boardId });
  const removeItem = useMutation(api.items.remove);
  const completeItem = useMutation(api.items.complete);
  const [editingId, setEditingId] = useState(null);

  if (merged === undefined) return <Loader size="sm" />;
  if (merged.length === 0) return <Text c="dimmed">Нет элементов. Добавьте в разделе «Мои элементы».</Text>;

  const editingItem = merged.find(({ item }) => item._id === editingId)?.item;

  return (
    <Stack gap="sm">
      <EditItemModal itemId={editingId} item={editingItem} onClose={() => setEditingId(null)} />
      {merged.map(({ item, userName }) => {
        const pct = item.totalEpisodes > 0 ? Math.round((item.currentEpisode / item.totalEpisodes) * 100) : 0;
        const isCompleted = pct >= 100;
        return (
          <Card key={item._id} padding="sm" withBorder>
            <Group justify="space-between">
              <div>
                <Text fw={500}>{item.title}</Text>
                <Text size="xs" c="dimmed">
                  {userName} · {item.currentEpisode}/{item.totalEpisodes}
                </Text>
              </div>
              <Group gap="xs">
                <Button size="xs" variant="subtle" onClick={() => setEditingId(item._id)}>
                  Изменить
                </Button>
                {pct < 100 && (
                  <Button size="xs" variant="light" onClick={() => completeItem({ itemId: item._id })}>
                    Готово
                  </Button>
                )}
                <Button size="xs" variant="subtle" color="red" onClick={() => removeItem({ itemId: item._id })}>
                  Скрыть
                </Button>
              </Group>
            </Group>
            <Progress value={pct} size="sm" mt="xs" />
            <RatingDisplay itemId={item._id} isCompleted={isCompleted} />
          </Card>
        );
      })}
    </Stack>
  );
}

function MyItemsList({ boardId }) {
  const myItems = useQuery(api.items.listMyByBoard, { boardId });
  const removeItem = useMutation(api.items.remove);
  const restoreItem = useMutation(api.items.restore);
  const hardDeleteItem = useMutation(api.items.hardDelete);
  const completeItem = useMutation(api.items.complete);
  const reorderItems = useMutation(api.items.reorder);
  const [editingId, setEditingId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }
    if (active.id !== over.id) {
      const oldIndex = myItems.findIndex((item) => item._id === active.id);
      const newIndex = myItems.findIndex((item) => item._id === over.id);

      const newOrder = arrayMove(myItems, oldIndex, newIndex).map((item) => item._id);
      reorderItems({ boardId, newOrder });
    }
  }

  if (myItems === undefined) return <Loader size="sm" />;
  if (myItems.length === 0) return <Text c="dimmed">У вас пока нет элементов. Добавьте первый ниже.</Text>;

  const visibleItems = myItems.filter((item) => !item.isHidden);
  const hiddenItems = myItems.filter((item) => item.isHidden);

  return (
    <Stack gap="sm">
      <EditItemModal
        itemId={editingId}
        item={myItems.find((i) => i._id === editingId)}
        onClose={() => setEditingId(null)}
      />
      {visibleItems.length === 0 ? (
        <Text c="dimmed">Все ваши элементы скрыты. Вы можете восстановить их ниже.</Text>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleItems.map((item) => item._id)} strategy={verticalListSortingStrategy}>
            {visibleItems.map((item) => (
              <SortableItem
                key={item._id}
                item={item}
                onEdit={setEditingId}
                onComplete={completeItem}
                onHide={removeItem}
                onHardDelete={hardDeleteItem}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      {hiddenItems.length > 0 && (
        <Stack gap="xs" mt="md">
          <Text fw={500}>Скрытые элементы</Text>
          {hiddenItems.map((item) => (
            <Card key={item._id} padding="sm" withBorder>
              <Group justify="space-between">
                <div>
                  <Text fw={500}>{item.title}</Text>
                  <Text size="xs" c="dimmed">
                    {item.currentEpisode}/{item.totalEpisodes}
                  </Text>
                </div>
                <Group gap="xs">
                  <Button size="xs" variant="light" onClick={() => restoreItem({ itemId: item._id })}>
                    Восстановить
                  </Button>
                  <Button size="xs" variant="subtle" color="red" onClick={() => hardDeleteItem({ itemId: item._id })}>
                    Удалить окончательно
                  </Button>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function MembersList({ boardId }) {
  const members = useQuery(api.boardMembers.listByBoard, { boardId });
  const removeMember = useMutation(api.boardMembers.remove);
  const addMember = useMutation(api.boardMembers.add);
  const board = useQuery(api.boards.get, { boardId });
  const isCreatorOrMod = board?.myRole === "creator" || board?.myRole === "moderator";
  const [inviteEmail, setInviteEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchByEmail = useQuery(api.users.searchByEmail, inviteEmail.trim() ? { email: inviteEmail.trim() } : "skip");

  useEffect(() => {
    setSearchResults(searchByEmail ?? []);
  }, [searchByEmail]);

  const existingIds = new Set((members ?? []).map((m) => m.userId));
  const canAdd = searchResults.filter((u) => !existingIds.has(u._id));

  if (members === undefined) return <Loader size="sm" />;
  return (
    <Stack gap="md">
      {isCreatorOrMod && (
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Пригласить по email
          </Text>
          <Group gap="xs">
            <TextInput
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ flex: 1 }}
            />
          </Group>
          {canAdd.length > 0 && (
            <Stack gap="xs">
              {canAdd.map((u) => (
                <Group key={u._id} justify="space-between">
                  <Text size="sm">{u.name ?? u.email ?? u._id}</Text>
                  <Button
                    size="xs"
                    onClick={async () => {
                      await addMember({ boardId, userId: u._id, role: "member" });
                      setInviteEmail("");
                    }}
                  >
                    Добавить
                  </Button>
                </Group>
              ))}
            </Stack>
          )}
          {inviteEmail.trim() && searchResults !== undefined && canAdd.length === 0 && searchResults.length === 0 && (
            <Text size="xs" c="dimmed">
              Пользователь с таким email не найден.
            </Text>
          )}
        </Stack>
      )}
      <Stack gap="xs">
        {members.map((m) => (
          <Group key={m._id} justify="space-between">
            <div>
              <Text fw={500}>{m.userName}</Text>
              {m.userEmail && (
                <Text size="xs" c="dimmed">
                  {m.userEmail}
                </Text>
              )}
            </div>
            <Badge>{m.role}</Badge>
            {isCreatorOrMod && m.role !== "creator" && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => removeMember({ boardId, userId: m.userId })}
              >
                Удалить
              </Button>
            )}
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}

function HistoryList({ boardId }) {
  const history = useQuery(api.history.listByBoard, { boardId });
  if (history === undefined) return <Loader size="sm" />;
  if (history.length === 0) return <Text c="dimmed">История пуста.</Text>;
  const actionLabels = {
    create: "создал элемент",
    update: "обновил элемент",
    delete: "удалил элемент",
    complete: "отметил как просмотренный",
    uncomplete: "снял отметку просмотра",
  };
  return (
    <Stack gap="xs">
      {history.map((e) => (
        <Text key={e._id} size="sm">
          <strong>{e.userName}</strong> {actionLabels[e.action] ?? e.action} — {new Date(e.timestamp).toLocaleString()}
        </Text>
      ))}
    </Stack>
  );
}

export function BoardPage() {
  const { boardId } = useParams();
  const board = useQuery(api.boards.get, boardId ? { boardId } : "skip");
  const removeBoard = useMutation(api.boards.remove);
  const [createOpen, setCreateOpen] = useState(false);

  if (!boardId) return <Text>Не указана доска.</Text>;
  if (board === undefined) return <Loader />;
  if (board === null) return <Text>Доска не найдена или нет доступа.</Text>;

  const handleRemoveBoard = async () => {
    if (confirm("Удалить доску? Это действие нельзя отменить.")) {
      await removeBoard({ boardId });
      // Redirect to home
      window.location.href = "/";
    }
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>{board.name}</Title>
        <Group gap="xs">
          <Badge>{board.myRole}</Badge>
          {board.myRole === "creator" && (
            <Button size="xs" variant="subtle" color="red" onClick={handleRemoveBoard}>
              Удалить доску
            </Button>
          )}
        </Group>
      </Group>
      <Tabs defaultValue="merged">
        <Tabs.List>
          <Tabs.Tab value="merged">Общий список</Tabs.Tab>
          <Tabs.Tab value="mine">Мои элементы</Tabs.Tab>
          <Tabs.Tab value="members">Участники</Tabs.Tab>
          <Tabs.Tab value="history">История</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="merged" pt="md">
          <MergedList boardId={boardId} />
        </Tabs.Panel>
        <Tabs.Panel value="mine" pt="md">
          <Stack gap="md">
            <Button onClick={() => setCreateOpen(true)}>Добавить элемент</Button>
            <MyItemsList boardId={boardId} />
          </Stack>
          <CreateItemModal boardId={boardId} opened={createOpen} onClose={() => setCreateOpen(false)} />
        </Tabs.Panel>
        <Tabs.Panel value="members" pt="md">
          <MembersList boardId={boardId} />
        </Tabs.Panel>
        <Tabs.Panel value="history" pt="md">
          <HistoryList boardId={boardId} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
