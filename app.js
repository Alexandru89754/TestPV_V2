document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ======================
     AUTH CHECK
     ====================== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  const userId =
    localStorage.getItem(C.USER_EMAIL_KEY) ||
    localStorage.getItem(C.PARTICIPANT_KEY);

  if (!token || !userId) {
    window.location.replace("index.html");
    return;
  }

  /* ======================
     NAVIGATION
     ====================== */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach(s => s.classList.toggle("active", s.id === id));
    buttons.forEach(b => b.classList.toggle("active", b.dataset.target === id));
    if (id) localStorage.setItem("pv_active_tab", id);
  }

  buttons.forEach(b =>
    b.addEventListener("click", () => showSection(b.dataset.target))
  );

  showSection(localStorage.getItem("pv_active_tab") || "chat");

  /* ======================
     CHAT BOT (ISOLÉ PAR UTILISATEUR)
     ====================== */
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  const CHAT_KEY = `pv_chat_history_${userId}`;
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
        body: JSON.stringify({
          message: msg,
          history,
          userId
        })
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const reply = data.reply || "Réponse vide.";

      history.push({ role: "bot", text: reply });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));
      addBubble(reply, "bot");
    } catch {
      addBubble("❌ Erreur backend inaccessible.", "bot");
    }
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  /* ======================
     LOGOUT (PROPRE)
     ====================== */
  const logoutBtn = document.getElementById("logout-btn");

  logoutBtn.onclick = () => {
    Object.keys(localStorage).forEach(key => {
      if (
        key === C.TOKEN_KEY ||
        key === C.USER_EMAIL_KEY ||
        key === C.PARTICIPANT_KEY ||
        key === "pv_active_tab" ||
        key.startsWith("pv_chat_history_")
      ) {
        localStorage.removeItem(key);
      }
    });

    window.location.replace("index.html");
  };
});
