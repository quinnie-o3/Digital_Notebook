const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const defaultApiBaseUrl = "https://digital-notebook-8wf4.onrender.com";

export const API_BASE_URL = (configuredApiBaseUrl || defaultApiBaseUrl).replace(/\/$/, "");
