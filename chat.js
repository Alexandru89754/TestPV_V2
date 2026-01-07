document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "https://gpt-backend-kodi.onrender.com/chat";

  const BG_CHAT = "TestPV_V2/asset/image intérieur.png";
  const PARTICIPANT_KEY = "pv_participant_id";

  const appBg = document.getElementById("app-bg");
  const participantPill = document.getElementById("participant-pill");
  const statusPill = document.getElementById("status-pill");

  const messagesEl = document.getElementById("chat-messages");
  const formEl = document.getElementById("chat-form");
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-button");
  const clearBtn = document.getElementById("clear-chat");
  const changeIdBtn = document.getElementById("change-id");

  function setBackground(url) {
    if (!appBg) return;
    appBg.style.backgroundImage = `url("${encodeURI(url)}")`;
  }

  function historyKey(id) {
    return `pv_chat_history_${id}`;
  }

  const participantId = localStorage.getItem(PARTICIPANT_KEY);
  if (!participantId) {
    window.location.href = "index.html";
    return;
  }

  setBackground(BG_CHAT);
  participantPill.textContent = `Participant: ${participantId}`;
  statusPill.textContent = "Prêt";

  let history = JSON.parse(localStorage.getItem(historyKey(participantId)) || "[]");

  if (history.length === 0) {
    history.push({
      role: "bot",
      text: "Bonjour. Quelle est votre principale raison de consultation aujourd’hui ?"
    });
  }

  function render() {
    messagesEl.innerHTML = "";
    history.forEach(m => {
      const div = document.createElement("div");
      div.className = `message ${m.role}-message`;
      div.textContent = m.text;
      messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  render();

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;

    history.push({ role: "user", text });
    render();
    localStorage.setItem(historyKey(participantId), JSON.stringify(history));
    inputEl.value = "";

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, userId: participantId })
    });

    const data = await res.json();
    history.push({ role: "bot", text: data.reply || "Erreur." });
    render();
    localStorage.setItem(historyKey(participantId), JSON.stringify(history));
  });

  clearBtn.addEventListener("click", () => {
    history = [];
    localStorage.removeItem(historyKey(participantId));
    render();
  });

  changeIdBtn.addEventListener("click", () => {
    localStorage.removeItem(PARTICIPANT_KEY);
    window.location.href = "index.html";
  });
});
