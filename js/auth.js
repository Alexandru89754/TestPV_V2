function initLoginPage() {
  const C = window.CONFIG;
  const session = window.SESSION;
  const api = window.API;

  session.clearSession();

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const pass2El = document.getElementById("password2");
  const confirmWrap = document.getElementById("confirm-wrap");

  const submitBtn = document.getElementById("submit");
  const errEl = document.getElementById("err");

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");

  let mode = "login"; // "login" | "register"

  function setMode(nextMode) {
    mode = nextMode;
    const isLogin = mode === "login";

    tabLogin.classList.toggle("active", isLogin);
    tabRegister.classList.toggle("active", !isLogin);
    confirmWrap.style.display = isLogin ? "none" : "block";
    submitBtn.textContent = isLogin ? "Se connecter" : "Créer un compte";
    errEl.textContent = "";
  }

  function setLoginBackground() {
    document.documentElement.style.setProperty(
      "--login-bg",
      `url("${C.ASSETS.BG_WELCOME}")`
    );
  }

  setLoginBackground();
  setMode("login");

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  submitBtn.addEventListener("click", async () => {
    errEl.textContent = "";

    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value;
    const password2 = pass2El?.value;

    if (!email || !password) {
      errEl.textContent = "Email et mot de passe requis.";
      return;
    }

    if (mode === "register") {
      if (!password2) {
        errEl.textContent = "Confirme le mot de passe.";
        return;
      }
      if (password !== password2) {
        errEl.textContent = "Les mots de passe ne correspondent pas.";
        return;
      }
    }

    try {
      submitBtn.disabled = true;

      if (mode === "login") {
        const tok = await api.httpJson(C.API_ENDPOINTS.AUTH_LOGIN, {
          method: "POST",
          body: { email, password },
        });

        session.setToken(tok.access_token);
        session.setUserEmail(email);
        window.location.href = C.ROUTES.APP_PAGE;
        return;
      }

      await api.httpJson(C.API_ENDPOINTS.AUTH_REGISTER, {
        method: "POST",
        body: { email, password },
      });

      const tok = await api.httpJson(C.API_ENDPOINTS.AUTH_LOGIN, {
        method: "POST",
        body: { email, password },
      });

      session.setToken(tok.access_token);
      session.setUserEmail(email);
      window.location.href = C.ROUTES.APP_PAGE;
    } catch (e) {
      errEl.textContent = e.message;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", initLoginPage);
