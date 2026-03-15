import { Box } from "@mantine/core";

export function StarRating({ value, onChange, size = 16, interactive = false }) {
  const fullStars = Math.floor(value);
  const hasHalf = value % 1 !== 0;

  return (
    <Box style={{ display: "flex", gap: "4px", cursor: interactive ? "pointer" : "default" }}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < fullStars) {
          return (
            <span
              key={i}
              style={{
                fontSize: size,
                cursor: interactive ? "pointer" : "default",
                opacity: 1,
              }}
              onClick={interactive ? () => onChange(i + 1) : undefined}
            >
              🍌
            </span>
          );
        } else if (i === fullStars && hasHalf) {
          return (
            <span
              key={i}
              style={{
                fontSize: size,
                cursor: interactive ? "pointer" : "default",
                opacity: 0.5,
              }}
              onClick={interactive ? () => onChange(i + 1) : undefined}
            >
              🍌
            </span>
          );
        } else {
          return (
            <span
              key={i}
              style={{
                fontSize: size,
                cursor: interactive ? "pointer" : "default",
                opacity: 0.2,
              }}
              onClick={interactive ? () => onChange(i + 1) : undefined}
            >
              🍌
            </span>
          );
        }
      })}
    </Box>
  );
}
