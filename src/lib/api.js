import { DEBUG } from "./config";

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

export async function httpJson(url, options = {}) {
  const { method = "GET", body, token, headers = {} } = options;

  const finalHeaders = { ...headers };
  const init = { method, headers: finalHeaders };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
    init.body = JSON.stringify(body);
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, init);
  const text = await res.text();
  const data = parseBody(text);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, res.status));
    err.status = res.status;
    err.data = data;
    if (DEBUG) {
      console.error("[DEBUG] httpJson error", {
        url,
        method,
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
  const { method = "GET", body, token, headers = {} } = options;

  const finalHeaders = { ...headers };
  const init = { method, headers: finalHeaders };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
    init.body = JSON.stringify(body);
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, init);
  const text = await res.text();
  const data = parseBody(text);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, res.status));
    err.status = res.status;
    err.data = data;
    if (DEBUG) {
      console.error("[DEBUG] httpJsonWithStatus error", {
        url,
        method,
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
  const { method = "POST", body, token, headers = {} } = options;

  const finalHeaders = { ...headers };
  const init = { method, headers: finalHeaders, body };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, init);
  const text = await res.text();
  const data = parseBody(text);

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data, res.status));
    err.status = res.status;
    err.data = data;
    if (DEBUG) {
      console.error("[DEBUG] httpForm error", {
        url,
        method,
        status: res.status,
        message: err.message,
        data,
      });
    }
    throw err;
  }

  return data;
}
