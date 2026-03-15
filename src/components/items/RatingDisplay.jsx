import { useState, useEffect } from "react";
import { Card, Group, Text, Button, Badge, Flex, Box, ActionIcon } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { AddReviewModal } from "./AddReviewModal";
import { ViewReviewsModal } from "./ViewReviewsModal";
import { CRITERIA, CRITERIA_STYLES } from "./criteria";
import { StarRating } from "./StarRating";

export function RatingDisplay({ itemId, isCompleted }) {
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [viewReviewsOpen, setViewReviewsOpen] = useState(false);

  const ratings = useQuery(api.ratings.getAverageRatings, { itemId });
  const reviews = useQuery(api.ratings.getItemReviews, { itemId });
  const userRating = useQuery(api.ratings.getUserRating, { itemId });

  if (!isCompleted) {
    return null;
  }

  const hasRatings = ratings && ratings.count > 0;
  const hasUserRating = userRating !== null && userRating !== undefined;

  return (
    <>
      <Card shadow="sm" padding="xs" mt="sm" withBorder>
        <Group justify="space-between" mb="xs">
          <Group gap="sm">
            <Button size="xs" variant="subtle" onClick={() => setAddReviewOpen(true)}>
              Моё ревью
            </Button>
          </Group>
          {hasRatings && (
            <Group gap="sm">
              <Badge
                color="yellow"
                variant="light"
                style={{ cursor: "pointer" }}
                onClick={() => setViewReviewsOpen(true)}
                leftSection={<IconEye size={14} />}
              >
                {ratings.count} оцен{ratings.count === 1 ? "ка" : ratings.count <= 4 ? "ки" : "ок"}
              </Badge>
            </Group>
          )}
        </Group>

        <Flex direction={{ base: "column", md: "row" }} gap="sm" align="center">
          <Flex gap="sm" wrap="wrap" align="flex-start" style={{ flex: 1 }}>
            {CRITERIA.map((criterion) => (
              <Box key={criterion.key} style={CRITERIA_STYLES.box}>
                <Text {...CRITERIA_STYLES.label}>{criterion.label}</Text>
                <StarRating value={ratings?.[criterion.key] || 0} />
              </Box>
            ))}
          </Flex>

          {hasRatings && (
            <Group justify="flex-start" gap="sm">
              <Text fw={600} size="md">
                Общий: {ratings.overall.toFixed(1)}
              </Text>
              <StarRating value={ratings.overall} size={16} />
            </Group>
          )}
        </Flex>
      </Card>

      <AddReviewModal
        itemId={itemId}
        opened={addReviewOpen}
        onClose={() => setAddReviewOpen(false)}
        initialRating={userRating}
      />

      <ViewReviewsModal itemId={itemId} opened={viewReviewsOpen} onClose={() => setViewReviewsOpen(false)} />
    </>
  );
}
