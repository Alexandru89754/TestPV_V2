(function () {
  function ensureConfig() {
    if (!window.CONFIG) {
      throw new Error("CONFIG manquant: chargez js/config.js avant js/api.js");
    }
  }

  async function httpJson(url, options = {}) {
    ensureConfig();

    const {
      method = "GET",
      body,
      token,
      headers = {},
    } = options;

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

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && (data.detail || data.message)) ||
        (typeof data === "string" && data) ||
        `HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  window.API = { httpJson };
})();
