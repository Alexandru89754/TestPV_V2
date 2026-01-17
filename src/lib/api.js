import { DEBUG, STORAGE_KEYS } from "./config";

function parseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(data, status) {
  if (data && typeof data === "object") {
    return data.detail || data.message || `HTTP ${status}`;
  }
  if (typeof data === "string" && data.trim()) {
    return data;
  }
  return `HTTP ${status}`;
}

export async function authFetch(url, options = {}) {
  const { method = "GET", body, token, headers = {} } = options;

  const finalHeaders = { ...headers };
  let finalBody = body;

  const storedToken =
    token ??
    (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null);

  if (DEBUG) {
    const tokenValue = storedToken || "";
    console.info("[DEBUG] authFetch", {
      url,
      method,
      hasToken: Boolean(tokenValue),
      tokenLength: tokenValue.length,
    });
  }

  if (storedToken) {
    finalHeaders.Authorization = `Bearer ${storedToken}`;
  }

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
    if (typeof body !== "string") {
      finalBody = JSON.stringify(body);
    }
  }

  const res = await fetch(url, { method, headers: finalHeaders, body: finalBody });

  if (res.status === 401) {
    const tokenValue = storedToken || "";
    console.warn("[DEBUG] authFetch unauthorized", {
      url,
      method,
      hasToken: Boolean(tokenValue),
      tokenLength: tokenValue.length,
    });
  }

  return res;
}

function extractUnauthorizedMessage(status, data) {
  if (status === 401) {
    return "Token invalide";
  }
  return extractErrorMessage(data, status);
}

export async function httpJson(url, options = {}) {
  const res = await authFetch(url, options);
  const text = await res.text();
  const data = parseBody(text);
  const requestMethod = options?.method ?? "GET";

  if (!res.ok) {
    const err = new Error(extractUnauthorizedMessage(res.status, data));
    err.status = res.status;
    err.data = data;
    if (DEBUG) {
      console.error("[DEBUG] httpJson error", {
        url,
        method: requestMethod,
        status: res.status,
        message: err.message,
        data,
      });
    }
    throw err;
  }

  return data;
}

export async function httpJsonWithStatus(url, options = {}) {
  const res = await authFetch(url, options);
  const text = await res.text();
  const data = parseBody(text);
  const requestMethod = options?.method ?? "GET";

  if (!res.ok) {
    const err = new Error(extractUnauthorizedMessage(res.status, data));
    err.status = res.status;
    err.data = data;
    if (DEBUG) {
      console.error("[DEBUG] httpJsonWithStatus error", {
        url,
        method: requestMethod,
        status: res.status,
        message: err.message,
        data,
      });
    }
    throw err;
  }

  return { data, status: res.status };
}

export async function httpForm(url, options = {}) {
  const res = await authFetch(url, options);
  const text = await res.text();
  const data = parseBody(text);
  const requestMethod = options?.method ?? "GET";

  if (!res.ok) {
    const err = new Error(extractUnauthorizedMessage(res.status, data));
    err.status = res.status;
    err.data = data;
    if (DEBUG) {
      console.error("[DEBUG] httpForm error", {
        url,
        method: requestMethod,
        status: res.status,
        message: err.message,
        data,
      });
    }
    throw err;
  }

  return data;
}
