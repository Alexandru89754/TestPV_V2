document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const confirmWrap = document.getElementById("confirm-wrap");

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const pass2El = document.getElementById("password2");

  const submitBtn = document.getElementById("submit");
  const errEl = document.getElementById("err");

  let mode = "login";

  function setMode(m) {
    mode = m;
    errEl.textContent = "";
    confirmWrap.style.display = m === "register" ? "block" : "none";
    submitBtn.textContent = m === "login" ? "Se connecter" : "Créer le compte";
    tabLogin.classList.toggle("active", m === "login");
    tabRegister.classList.toggle("active", m === "register");
  }

  tabLogin.onclick = () => setMode("login");
  tabRegister.onclick = () => setMode("register");

  async function callBackend(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.detail || "Erreur backend");
    }
    return data;
  }

  submitBtn.onclick = async () => {
    errEl.textContent = "";

    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value;

    if (!email || !password) {
      errEl.textContent = "Champs requis.";
      return;
    }

    try {
      submitBtn.disabled = true;

      /* ===== REGISTER ===== */
      if (mode === "register") {
        if (pass2El.value !== password) {
          errEl.textContent = "Les mots de passe ne correspondent pas.";
          return;
        }

        // 👉 Stocké dans Supabase VIA BACKEND
        await callBackend(C.AUTH_REGISTER_URL, { email, password });
      }

      /* ===== LOGIN ===== */
      // 👉 Autorisé UNIQUEMENT si Supabase valide
      const result = await callBackend(C.AUTH_LOGIN_URL, { email, password });

      if (!result.access_token) {
        throw new Error("Token manquant.");
      }

      localStorage.setItem(C.TOKEN_KEY, result.access_token);
      window.location.href = "app.html";

    } catch (e) {
      errEl.textContent = e.message;
    } finally {
      submitBtn.disabled = false;
    }
  };

  setMode("login");
});
