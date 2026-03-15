import { useState } from "react";
import { Modal, Text, Box, Group, Badge, Card, ScrollArea, Flex } from "@mantine/core";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CRITERIA, CRITERIA_STYLES } from "./criteria";
import { StarRating } from "./StarRating";

export function ViewReviewsModal({ itemId, opened, onClose }) {
  const reviews = useQuery(api.ratings.getItemReviews, { itemId });

  const overallAverage =
    reviews && reviews.length > 0
      ? reviews.reduce((acc, review) => {
          const r = review.rating;
          return (
            acc + (r.plotCharacters + r.atmosphereStyle + r.executionQuality + r.originality + r.emotionalImpact) / 5
          );
        }, 0) / reviews.length
      : 0;

  return (
    <Modal opened={opened} onClose={onClose} title="Все рецензии" size="xl">
      {!reviews || reviews.length === 0 ? (
        <Text c="dimmed" size="sm">
          Пока нет оценок для этого элемента.
        </Text>
      ) : (
        <Box>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Средний рейтинг: {overallAverage.toFixed(1)}</Text>
            <Badge color="yellow" variant="light">
              {reviews.length} оцен{reviews.length === 1 ? "ка" : reviews.length <= 4 ? "ки" : "ок"}
            </Badge>
          </Group>

          <ScrollArea style={{ height: 500 }}>
            <Box>
              {reviews.map((review) => (
                <Card key={review._id} shadow="sm" padding="sm" mb="sm" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600}>{review.user?.name || review.user?.email || "Аноним"}</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                    </Text>
                  </Group>

                  <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    {CRITERIA.map((criterion) => (
                      <Group key={criterion.key} justify="space-between" align="center">
                        <Text {...CRITERIA_STYLES.label} style={{ minWidth: 120 }}>
                          {criterion.label}
                        </Text>
                        <StarRating value={review.rating[criterion.key]} />
                      </Group>
                    ))}
                  </Box>

                  {review.comment && (
                    <Box
                      mt="sm"
                      p="sm"
                      style={{
                        backgroundColor: "var(--mantine-color-dark-5)",
                        borderRadius: "6px",
                        border: "1px solid var(--mantine-color-dark-4)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                      }}
                    >
                      <Text
                        size="sm"
                        style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "var(--mantine-color-gray-0)" }}
                      >
                        {review.comment}
                      </Text>
                    </Box>
                  )}
                </Card>
              ))}
            </Box>
          </ScrollArea>
        </Box>
      )}
    </Modal>
  );
}
