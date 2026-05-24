import { API_BASE_URL } from "./apiConfig";

export interface ApiUser {
  userId: number;
  email?: string | null;
  username?: string | null;
  role?: string | null;
  status?: string | null;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: string;
  user: ApiUser;
}

const ACCESS_TOKEN_STORAGE_KEY = "digitalNotebookAccessToken";
const REFRESH_TOKEN_STORAGE_KEY = "digitalNotebookRefreshToken";
const DEVICE_ID_STORAGE_KEY = "digitalNotebookDeviceId";

let fallbackAccessToken: string | null = null;
let fallbackRefreshToken: string | null = null;
let fallbackDeviceId: string | null = null;
let currentUser: ApiUser | null = null;
let sessionPromise: Promise<ApiUser> | null = null;

function createDeviceId() {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return randomId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
}

function getDeviceId() {
  if (fallbackDeviceId) {
    return fallbackDeviceId;
  }

  if (typeof window === "undefined") {
    fallbackDeviceId = createDeviceId();
    return fallbackDeviceId;
  }

  try {
    const existingDeviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);

    if (existingDeviceId) {
      fallbackDeviceId = existingDeviceId;
      return existingDeviceId;
    }

    const nextDeviceId = createDeviceId();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextDeviceId);
    fallbackDeviceId = nextDeviceId;
    return nextDeviceId;
  } catch {
    fallbackDeviceId = createDeviceId();
    return fallbackDeviceId;
  }
}

function getAccessToken() {
  if (typeof window === "undefined") {
    return fallbackAccessToken;
  }

  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || fallbackAccessToken;
  } catch {
    return fallbackAccessToken;
  }
}

function getRefreshToken() {
  if (typeof window === "undefined") {
    return fallbackRefreshToken;
  }

  try {
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || fallbackRefreshToken;
  } catch {
    return fallbackRefreshToken;
  }
}

function setAccessToken(accessToken: string) {
  fallbackAccessToken = accessToken;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  } catch {
    // sessionStorage can be blocked in private or embedded browser contexts.
  }
}

function setRefreshToken(refreshToken: string) {
  fallbackRefreshToken = refreshToken;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } catch {
    // Keep the token in memory for the current visit if localStorage is unavailable.
  }
}

function clearAccessToken() {
  fallbackAccessToken = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function clearStoredTokens() {
  fallbackAccessToken = null;
  fallbackRefreshToken = null;
  currentUser = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

async function requestAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Auth request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function applyAuthResponse(authResponse: AuthResponse) {
  setAccessToken(authResponse.accessToken);
  setRefreshToken(authResponse.refreshToken);
  currentUser = authResponse.user;
  return authResponse.user;
}

async function startDeviceSession() {
  const authResponse = await requestAuth<AuthResponse>("/api/auth/device-session", {
    deviceId: getDeviceId(),
  });

  return applyAuthResponse(authResponse);
}

async function refreshSession(refreshToken: string) {
  const authResponse = await requestAuth<AuthResponse>("/api/auth/refresh", {
    refreshToken,
  });

  return applyAuthResponse(authResponse);
}

async function refreshOrStartSession() {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      return await refreshSession(refreshToken);
    } catch {
      clearStoredTokens();
    }
  }

  return startDeviceSession();
}

async function loadSession() {
  if (currentUser && getAccessToken()) {
    return currentUser;
  }

  return refreshOrStartSession();
}

export async function ensureAuthSession() {
  if (!sessionPromise) {
    sessionPromise = loadSession().finally(() => {
      sessionPromise = null;
    });
  }

  return sessionPromise;
}

export async function getAuthenticatedUser() {
  return ensureAuthSession();
}

export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  await ensureAuthSession();
  return fetchWithCurrentAccessToken(path, init, true);
}

async function fetchWithCurrentAccessToken(path: string, init: RequestInit | undefined, retry: boolean) {
  const headers = new Headers(init?.headers);
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status !== 401 || !retry) {
    return response;
  }

  clearAccessToken();
  await refreshOrStartSession();
  return fetchWithCurrentAccessToken(path, init, false);
}
