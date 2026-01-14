import { API_ENDPOINTS, ROUTES, STORAGE_KEYS } from "./config";
import { httpJson } from "./api";

export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export function getUserEmail() {
  return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
}

export function setUserEmail(email) {
  localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
}

export function clearSession({ clearAll = false } = {}) {
  if (clearAll) {
    localStorage.clear();
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
}

export async function logout({ redirectTo = ROUTES.LOGIN_PAGE, clearAll = true, navigate } = {}) {
  const token = getToken();

  try {
    if (token) {
      await httpJson(API_ENDPOINTS.AUTH_LOGOUT, { method: "POST", token });
    }
  } catch {
    // ignore logout errors
  } finally {
    clearSession({ clearAll });
    if (typeof navigate === "function") {
      navigate(redirectTo, { replace: true });
    } else {
      window.location.href = redirectTo;
    }
  }
}

export function requireAuth() {
  const token = getToken();
  if (!token) return null;
  return token;
}
