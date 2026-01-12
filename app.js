document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ======================
     AUTH GUARD
     ====================== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  /* ======================
     LOGOUT (PURGE USER)
     ====================== */
  const logoutBtn = document.getElementById("logout-btn");

  const tokenHash = btoa(token.slice(0, 40));
  const CHAT_KEY = `pv_chat_history_${tokenHash}`;

  logoutBtn.addEventListener("click", () => {
    // 🔥 purge UNIQUEMENT l’historique de CE user
    localStorage.removeItem(CHAT_KEY);
    localStorage.removeItem("pv_active_tab");

    // token logout
    localStorage.removeItem(C.TOKEN_KEY);

    window.location.href = "index.html";
  });

  /* ======================
     NAV
     ====================== */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach(s => s.classList.toggle("active", s.id === id));
    buttons.forEach(b => b.classList.toggle("active", b.dataset.target === id));
    if (id) localStorage.setItem("pv_active_tab", id);
  }

  buttons.forEach(btn =>
    btn.addEventListener("click", () => showSection(btn.dataset.target))
  );

  showSection(localStorage.getItem("pv_active_tab") || "chat");

  /* ======================
     CHAT BOT — ISOLÉ PAR USER
     ====================== */
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  const userId =
    localStorage.getItem(C.USER_EMAIL_KEY) ||
    localStorage.getItem(C.PARTICIPANT_KEY) ||
    "anonymous";

  let history = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");

  function addBubble(text, role) {
    const div = document.createElement("div");
    div.className = `bubble ${role}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function renderHistory() {
    chatBox.innerHTML = "";
    history.forEach(m => addBubble(m.text, m.role));
  }

  if (history.length === 0) {
    history.push({
      role: "bot",
      text: "Bonjour. Je suis votre patient virtuel. Quelle est votre principale raison de consultation aujourd’hui ?"
    });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
  }

  renderHistory();

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    input.value = "";

    history.push({ role: "user", text: msg });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    addBubble(msg, "user");

    try {
      const res = await fetch(C.CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, userId })
      });

      const raw = await res.text();
      if (!res.ok) throw new Error(raw);

      const data = JSON.parse(raw);
      const reply = data.reply || "Réponse vide.";

      history.push({ role: "bot", text: reply });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));
      addBubble(reply, "bot");

    } catch (e) {
      addBubble(`❌ Erreur backend:\n${e.message}`, "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
});
