export const CRITERIA = [
  { key: "plotCharacters", label: "Сюжет" },
  { key: "atmosphereStyle", label: "Атмосфера" },
  { key: "executionQuality", label: "Качество" },
  { key: "originality", label: "Оригинальность" },
  { key: "emotionalImpact", label: "Эмоции" },
];

export const CRITERIA_STYLES = {
  box: {
    padding: "4px",
    borderRadius: "6px",
    border: "1px solid var(--mantine-color-dark-4)",
    backgroundColor: "var(--mantine-color-dark-5)",
  },
  label: {
    size: "xs",
    color: "dimmed",
    style: { marginBottom: "2px" },
  },
  starRating: {
    size: 16,
  },
};
