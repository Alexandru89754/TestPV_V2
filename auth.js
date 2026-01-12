document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  // 🔥 CORRECTION CRITIQUE
  // Si on arrive sur la page login → on nettoie TOUT
  localStorage.removeItem(C.TOKEN_KEY);
  localStorage.removeItem(C.USER_EMAIL_KEY);
  localStorage.removeItem("pv_active_tab");

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const submitBtn = document.getElementById("submit");
  const errEl = document.getElementById("err");

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

  submitBtn.addEventListener("click", async () => {
    errEl.textContent = "";

    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value;

    if (!email || !password) {
      errEl.textContent = "Email et mot de passe requis.";
      return;
    }

    try {
      submitBtn.disabled = true;

      const tok = await httpJson(C.AUTH_LOGIN_URL, { email, password });

      if (!tok.access_token) {
        throw new Error("Token manquant");
      }

      localStorage.setItem(C.TOKEN_KEY, tok.access_token);
      localStorage.setItem(C.USER_EMAIL_KEY, email);

      window.location.href = "app.html";

    } catch (e) {
      errEl.textContent = e.message;
    } finally {
      submitBtn.disabled = false;
    }
  });
});
