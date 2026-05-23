const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!configuredApiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable.");
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");
