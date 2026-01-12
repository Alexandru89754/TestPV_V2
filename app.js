// app.js
document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ======================
     AUTH CHECK
     ====================== */
  const token = localStorage.getItem(C.TOKEN_KEY);

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  /* ======================
     LOGOUT (CRITIQUE)
     ====================== */
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch(C.AUTH_LOGOUT_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      } catch (e) {
        console.warn("Logout backend unreachable");
      }

      // 🔥 NETTOYAGE TOTAL (OBLIGATOIRE)
      localStorage.removeItem(C.TOKEN_KEY);
      localStorage.removeItem(C.USER_EMAIL_KEY);
      localStorage.removeItem("pv_chat_history");

      window.location.href = "index.html";
    });
  }

  /* ======================
     NAVIGATION (STATE SAFE)
     ====================== */
  const navButtons = document.querySelectorAll(".nav-btn");
  const panels = document.querySelectorAll(".panel");

  function showPanel(id) {
    panels.forEach(p => p.classList.toggle("hidden", p.id !== id));
    navButtons.forEach(b => b.classList.toggle("active", b.dataset.view === id));
    localStorage.setItem("pv_active_view", id);
  }

  navButtons.forEach(btn =>
    btn.addEventListener("click", () => showPanel(btn.dataset.view))
  );

  showPanel(localStorage.getItem("pv_active_view") || "view-profile");

  /* ======================
     CHAT BOT (USER ISOLÉ)
     ====================== */
  const chatBox = document.getElementById("ai-chatbox");
  const chatInput = document.getElementById("ai-input");
  const chatSend = document.getElementById("ai-send");

  const CHAT_KEY = `pv_chat_${token}`; // 🔐 ISOLÉ PAR USER
  let history = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");

  function renderChat() {
    chatBox.innerHTML = "";
    history.forEach(m => {
      const div = document.createElement("div");
      div.className = `bubble ${m.role}`;
      div.textContent = m.text;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  renderChat();

  async function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    chatInput.value = "";
    history.push({ role: "user", text: msg });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    renderChat();

    try {
      const res = await fetch(C.CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: msg,
          userId: localStorage.getItem(C.USER_EMAIL_KEY)
        })
      });

      const data = await res.json();
      history.push({ role: "bot", text: data.reply });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));
      renderChat();

    } catch {
      history.push({ role: "bot", text: "Erreur serveur." });
      renderChat();
    }
  }

  chatSend.addEventListener("click", sendChat);
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendChat();
  });

  /* ======================
     FRIEND SEARCH + REQUEST
     ====================== */
  const searchBtn = document.getElementById("send-request");
  const emailInput = document.getElementById("friend-email");
  const resultMsg = document.getElementById("friend-search-ok");
  const errorMsg = document.getElementById("friend-search-err");

  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim().toLowerCase();
      resultMsg.textContent = "";
      errorMsg.textContent = "";

      if (!email) {
        errorMsg.textContent = "Email requis";
        return;
      }

      try {
        // 🔍 On récupère tous les users (via forum posts / profiles)
        const me = await fetch(C.AUTH_ME_URL, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        const res = await fetch(`${C.API_BASE_URL}/profiles/search?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Utilisateur introuvable");

        const user = await res.json();

        await fetch(`${C.FRIEND_REQUEST_PREFIX}${user.user_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });

        resultMsg.textContent = "Demande d’ami envoyée";

      } catch (e) {
        errorMsg.textContent = "Impossible d’envoyer la demande";
      }
    });
  }
});
