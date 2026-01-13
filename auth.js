document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  // 🧹 Nettoyage sécurité
  localStorage.removeItem(C.TOKEN_KEY);
  localStorage.removeItem(C.USER_EMAIL_KEY);
  localStorage.removeItem("pv_active_tab");

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const pass2El = document.getElementById("password2");
  const confirmWrap = document.getElementById("confirm-wrap");

  const submitBtn = document.getElementById("submit");
  const errEl = document.getElementById("err");

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");

  let mode = "login"; // "login" | "register"

  /* ----------------------
     UI TABS
  ---------------------- */
  tabLogin.onclick = () => {
    mode = "login";
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    confirmWrap.style.display = "none";
    submitBtn.textContent = "Se connecter";
    errEl.textContent = "";
  };

  tabRegister.onclick = () => {
    mode = "register";
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    confirmWrap.style.display = "block";
    submitBtn.textContent = "Créer un compte";
    errEl.textContent = "";
  };

  /* ----------------------
     HTTP helper
  ---------------------- */
  async function httpJson(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}

    if (!res.ok) {
      throw new Error(data.detail || "Erreur serveur");
    }
    return data;
  }

  /* ----------------------
     SUBMIT
  ---------------------- */
  submitBtn.onclick = async () => {
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
        // 🔐 LOGIN
        const tok = await httpJson(C.AUTH_LOGIN_URL, {
          email,
          password,
        });

        localStorage.setItem(C.TOKEN_KEY, tok.access_token);
        localStorage.setItem(C.USER_EMAIL_KEY, email);
        window.location.href = "app.html";

      } else {
        // 🆕 REGISTER
        await httpJson(C.AUTH_REGISTER_URL, {
          email,
          password,
        });

        // auto-login après création
        const tok = await httpJson(C.AUTH_LOGIN_URL, {
          email,
          password,
        });

        localStorage.setItem(C.TOKEN_KEY, tok.access_token);
        localStorage.setItem(C.USER_EMAIL_KEY, email);
        window.location.href = "app.html";
      }

    } catch (e) {
      errEl.textContent = e.message;
    } finally {
      submitBtn.disabled = false;
    }
  };
});
