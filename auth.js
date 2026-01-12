document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const pass2El = document.getElementById("password2");

  const submitBtn = document.getElementById("submit");
  const clearBtn = document.getElementById("clear");
  const errEl = document.getElementById("err");

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const confirmWrap = document.getElementById("confirm-wrap");

  let mode = "login";

  function setMode(m) {
    mode = m;
    errEl.textContent = "";
    confirmWrap.style.display = mode === "register" ? "block" : "none";
    submitBtn.textContent =
      mode === "login" ? "Se connecter" : "Créer le compte";

    tabLogin.classList.toggle("active", mode === "login");
    tabRegister.classList.toggle("active", mode === "register");
  }

  tabLogin.onclick = () => setMode("login");
  tabRegister.onclick = () => setMode("register");

  clearBtn.onclick = () => {
    emailEl.value = "";
    passEl.value = "";
    if (pass2El) pass2El.value = "";
    errEl.textContent = "";
  };

  async function httpJson(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Erreur serveur");
    return data;
  }

  submitBtn.onclick = async () => {
    errEl.textContent = "";
    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value;

    if (!email || !password) {
      errEl.textContent = "Email et mot de passe requis.";
      return;
    }

    try {
      submitBtn.disabled = true;

      if (mode === "register") {
        if (pass2El.value !== password) {
          errEl.textContent = "Les mots de passe ne correspondent pas.";
          return;
        }
        await httpJson(C.AUTH_REGISTER_URL, { email, password });
      }

      const tok = await httpJson(C.AUTH_LOGIN_URL, { email, password });

      localStorage.setItem(C.TOKEN_KEY, tok.access_token);
      localStorage.setItem(C.USER_EMAIL_KEY, email);

      // reset UI state
      localStorage.removeItem("pv_active_tab");

      window.location.href = "app.html";
    } catch (e) {
      errEl.textContent = e.message;
    } finally {
      submitBtn.disabled = false;
    }
  };

  // déjà connecté → app
  if (localStorage.getItem(C.TOKEN_KEY)) {
    window.location.href = "app.html";
  }

  setMode("login");
});
