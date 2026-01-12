document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  const bg = document.getElementById("app-bg");
  if (bg) bg.style.backgroundImage = `url("${C.BG_WELCOME}")`;

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const confirmWrap = document.getElementById("confirm-wrap");

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const pass2El = document.getElementById("password2");

  const submitBtn = document.getElementById("submit");
  const clearBtn = document.getElementById("clear");
  const errEl = document.getElementById("err");

  let mode = "login"; // "login" | "register"

  function setMode(next) {
    mode = next;
    errEl.textContent = "";
    if (mode === "login") {
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      confirmWrap.style.display = "none";
      submitBtn.textContent = "Se connecter";
    } else {
      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");
      confirmWrap.style.display = "block";
      submitBtn.textContent = "Créer le compte";
    }
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  clearBtn.addEventListener("click", () => {
    emailEl.value = "";
    passEl.value = "";
    if (pass2El) pass2El.value = "";
    errEl.textContent = "";
  });

  async function httpJson(url, method, bodyObj) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj),
    });
    const text = await res.text().catch(() => "");
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!res.ok) {
      const msg = data?.detail || text || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  submitBtn.addEventListener("click", async () => {
    errEl.textContent = "";

    const email = String(emailEl.value || "").trim().toLowerCase();
    const password = String(passEl.value || "");

    if (!email || !email.includes("@")) {
      errEl.textContent = "Email invalide.";
      return;
    }
    if (!password) {
      errEl.textContent = "Mot de passe requis.";
      return;
    }

    try {
      submitBtn.disabled = true;

      if (mode === "register") {
        const p2 = String(pass2El.value || "");
        if (p2 !== password) {
          errEl.textContent = "Les mots de passe ne correspondent pas.";
          return;
        }
        await httpJson(C.AUTH_REGISTER_URL, "POST", { email, password });
      }

      const tok = await httpJson(C.AUTH_LOGIN_URL, "POST", { email, password });
      const accessToken = tok.access_token || tok.accessToken || "";
      if (!accessToken) throw new Error("Token manquant.");

      localStorage.setItem(C.TOKEN_KEY, accessToken);
      localStorage.setItem(C.USER_EMAIL_KEY, email);

      window.location.href = "app.html";
    } catch (e) {
      errEl.textContent = String(e?.message || e);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Si déjà connecté, skip direct
  const existing = localStorage.getItem(C.TOKEN_KEY);
  if (existing) {
    window.location.href = "app.html";
    return;
  }

  setMode("login");
});
