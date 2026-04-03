const AUTH_TOKEN_KEY = "cloudops.auth.token";

let authToken: string | null = null;

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") {
    return authToken;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthToken(): string | null {
  if (authToken) {
    return authToken;
  }

  authToken = getStoredAuthToken();
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;

  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}
