import { useState, useEffect } from "react";
import { Modal, TextInput, Textarea, Button, Group, Text, Box } from "@mantine/core";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { CRITERIA, CRITERIA_STYLES } from "./criteria";
import { StarRating } from "./StarRating";

export function AddReviewModal({ itemId, opened, onClose, initialRating }) {
  const submitRating = useMutation(api.ratings.submitRating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ratings, setRatings] = useState({
    plotCharacters: 3,
    atmosphereStyle: 3,
    executionQuality: 3,
    originality: 3,
    emotionalImpact: 3,
  });
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (opened) {
      if (initialRating && initialRating !== undefined) {
        setRatings({
          plotCharacters: initialRating.plotCharacters,
          atmosphereStyle: initialRating.atmosphereStyle,
          executionQuality: initialRating.executionQuality,
          originality: initialRating.originality,
          emotionalImpact: initialRating.emotionalImpact,
        });
        setComment(initialRating.comment || "");
      } else {
        setRatings({
          plotCharacters: 3,
          atmosphereStyle: 3,
          executionQuality: 3,
          originality: 3,
          emotionalImpact: 3,
        });
        setComment("");
      }
      setError("");
    }
  }, [opened, initialRating]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await submitRating({
        itemId,
        plotCharacters: ratings.plotCharacters,
        atmosphereStyle: ratings.atmosphereStyle,
        executionQuality: ratings.executionQuality,
        originality: ratings.originality,
        emotionalImpact: ratings.emotionalImpact,
        comment: comment.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err?.message ?? "Ошибка при сохранении оценки");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Добавить рецензию" size="lg">
      <form onSubmit={handleSubmit}>
        <Text size="sm" c="dimmed" mb="md">
          Оцените каждый критерий по шкале от 1 до 5 бананов
        </Text>

        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px 24px",
          }}
        >
          {CRITERIA.map((criterion) => (
            <Box key={criterion.key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Group justify="space-between" align="center" style={{ flexWrap: "nowrap" }}>
                <Text size="sm" fw={500}>
                  {criterion.label}
                </Text>
                <StarRating
                  value={ratings[criterion.key]}
                  onChange={(value) => setRatings((prev) => ({ ...prev, [criterion.key]: value }))}
                  size={16}
                  interactive={true}
                />
              </Group>
            </Box>
          ))}
        </Box>

        <Textarea
          label="Ваш комментарий (необязательно)"
          placeholder="Расскажите, что вам понравилось или не понравилось..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          mt="md"
          minRows={4}
          maxLength={1000}
          description={`${comment.length}/1000`}
        />

        {error && (
          <Text color="red" size="sm" mt="sm">
            {error}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button type="button" variant="subtle" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={loading}>
            Сохранить оценку
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
