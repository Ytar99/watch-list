import { useState } from "react";
import { Card, Group, Text, Button, Flex, Box } from "@mantine/core";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AddReviewModal } from "./AddReviewModal";
import { CRITERIA, CRITERIA_STYLES } from "./criteria";
import { StarRating } from "./StarRating";

export function PersonalRatingDisplay({ itemId, isCompleted }) {
  const [addReviewOpen, setAddReviewOpen] = useState(false);

  const userRating = useQuery(api.ratings.getUserRating, { itemId });

  if (!isCompleted) {
    return null;
  }

  const hasRating = userRating !== null && userRating !== undefined;
  const overall = hasRating
    ? (userRating.plotCharacters +
        userRating.atmosphereStyle +
        userRating.executionQuality +
        userRating.originality +
        userRating.emotionalImpact) /
      5
    : 0;

  return (
    <>
      <Card shadow="sm" padding="sm" mt="sm" withBorder>
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Ваша оценка</Text>
          {hasRating && (
            <Text size="sm" c="dimmed">
              {new Date(userRating.updatedAt).toLocaleDateString("ru-RU")}
            </Text>
          )}
        </Group>

        {hasRating ? (
          <Flex direction="column" gap="xs" mb="sm">
            <Flex gap="md" wrap="wrap" align="flex-start">
              {CRITERIA.map((criterion) => (
                <Box key={criterion.key} style={CRITERIA_STYLES.box}>
                  <Text {...CRITERIA_STYLES.label}>{criterion.label}</Text>
                  <StarRating value={userRating[criterion.key]} />
                </Box>
              ))}
            </Flex>

            <Group justify="flex-start" mt="sm" gap="sm">
              <Text fw={600} size="md">
                Общий: {overall.toFixed(1)}
              </Text>
              <StarRating value={overall} size={16} />
            </Group>
          </Flex>
        ) : (
          <Text size="sm" c="dimmed" mb="sm">
            Вы еще не оценили этот элемент
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button size="xs" onClick={() => setAddReviewOpen(true)}>
            {hasRating ? "Редактировать рецензию" : "Оценить элемент"}
          </Button>
        </Group>
      </Card>

      <AddReviewModal
        itemId={itemId}
        opened={addReviewOpen}
        onClose={() => setAddReviewOpen(false)}
        initialRating={userRating}
      />
    </>
  );
}
