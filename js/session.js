(function () {
  function ensureConfig() {
    if (!window.CONFIG) {
      throw new Error("CONFIG manquant: chargez js/config.js avant js/session.js");
    }
  }

  function getToken() {
    ensureConfig();
    return localStorage.getItem(window.CONFIG.STORAGE_KEYS.TOKEN);
  }

  function setToken(token) {
    ensureConfig();
    localStorage.setItem(window.CONFIG.STORAGE_KEYS.TOKEN, token);
  }

  function getUserEmail() {
    ensureConfig();
    return localStorage.getItem(window.CONFIG.STORAGE_KEYS.USER_EMAIL);
  }

  function setUserEmail(email) {
    ensureConfig();
    localStorage.setItem(window.CONFIG.STORAGE_KEYS.USER_EMAIL, email);
  }

  function clearSession(options = {}) {
    ensureConfig();
    const { clearAll = false } = options;

    if (clearAll) {
      localStorage.clear();
      return;
    }

    const keys = window.CONFIG.STORAGE_KEYS;
    localStorage.removeItem(keys.TOKEN);
    localStorage.removeItem(keys.USER_EMAIL);
    localStorage.removeItem(keys.ACTIVE_TAB);
  }

  async function logout(options = {}) {
    ensureConfig();

    const {
      redirectTo = window.CONFIG.ROUTES.LOGIN_PAGE,
      clearAll = true,
    } = options;

    const token = getToken();

    try {
      if (token && window.API?.httpJson) {
        await window.API.httpJson(window.CONFIG.API_ENDPOINTS.AUTH_LOGOUT, {
          method: "POST",
          token,
        });
      }
    } catch {
      // ignore logout errors
    } finally {
      clearSession({ clearAll });
      window.location.href = redirectTo;
    }
  }

  function requireAuthOrRedirect(options = {}) {
    ensureConfig();
    const { redirectTo = window.CONFIG.ROUTES.LOGIN_PAGE } = options;
    const token = getToken();

    if (!token) {
      window.location.href = redirectTo;
      return null;
    }

    return token;
  }

  window.SESSION = {
    getToken,
    setToken,
    getUserEmail,
    setUserEmail,
    clearSession,
    logout,
    requireAuthOrRedirect,
  };
})();
