// Convex deployment URL. For local dev use `npx convex dev` and copy the URL here or into .env.local.
// See https://docs.convex.dev/production/hosting
export const CONVEX_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_CONVEX_URL
    ? import.meta.env.VITE_CONVEX_URL
    : "";
