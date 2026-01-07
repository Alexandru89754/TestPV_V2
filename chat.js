document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "https://gpt-backend-kodi.onrender.com/chat";

  const BG_CHAT = "./asset/image_in.png";
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
    appBg.style.backgroundImage = `url("${url}")`;
  }

  function setStatus(text) {
    if (statusPill) statusPill.textContent = text;
  }

  function historyKeyFor(participantId) {
    return `pv_chat_history_${participantId}`;
  }

  function addMessageToUI(text, role) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(
      role === "user" ? "user-message" :
      role === "bot" ? "bot-message" : "system-message"
    );
    div.textContent = String(text ?? "");
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function loadHistory(participantId) {
    try {
      const raw = localStorage.getItem(historyKeyFor(participantId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(participantId, history) {
    try {
      localStorage.setItem(historyKeyFor(participantId), JSON.stringify(history));
    } catch {}
  }

  function renderHistory(history) {
    messagesEl.innerHTML = "";
    for (const item of history) addMessageToUI(item.text, item.role);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendToBackend(message, participantId) {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId: participantId })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
    }
    return res.json();
  }

  const participantId = localStorage.getItem(PARTICIPANT_KEY);
  if (!participantId) {
    window.location.href = "index.html";
    return;
  }

  setBackground(BG_CHAT);
  participantPill.textContent = `Participant: ${participantId}`;
  setStatus("Prêt");

  let history = loadHistory(participantId);
  if (history.length === 0) {
    history.push({
      role: "bot",
      text: "Bonjour. Je suis votre patient virtuel. Quelle est votre principale raison de consultation aujourd’hui ?",
      ts: new Date().toISOString()
    });
    saveHistory(participantId, history);
  }
  renderHistory(history);

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = inputEl.value.trim();
    if (!text) return;

    sendBtn.disabled = true;
    inputEl.disabled = true;
    setStatus("Envoi…");

    history.push({ role: "user", text, ts: new Date().toISOString() });
    saveHistory(participantId, history);
    addMessageToUI(text, "user");

    inputEl.value = "";
    inputEl.focus();

    const typingBubble = addMessageToUI("…", "bot");

    try {
      const data = await sendToBackend(text, participantId);
      const reply = data.reply || "Erreur: réponse vide.";

      typingBubble.textContent = reply;

      history.push({ role: "bot", text: reply, ts: new Date().toISOString() });
      saveHistory(participantId, history);

      setStatus("Prêt");
    } catch {
      typingBubble.textContent = "Erreur: impossible de joindre le serveur.";

      history.push({ role: "system", text: "Erreur: impossible de joindre le serveur.", ts: new Date().toISOString() });
      saveHistory(participantId, history);

      setStatus("Erreur");
    } finally {
      sendBtn.disabled = false;
      inputEl.disabled = false;
      inputEl.focus();
    }
  });

  clearBtn.addEventListener("click", () => {
    history = [
      { role: "bot", text: "Conversation effacée. Recommencez quand vous voulez.", ts: new Date().toISOString() }
    ];
    saveHistory(participantId, history);
    renderHistory(history);
    setStatus("Prêt");
    inputEl.focus();
  });

  changeIdBtn.addEventListener("click", () => {
    localStorage.removeItem(PARTICIPANT_KEY);
    window.location.href = "index.html";
  });

  messagesEl.addEventListener(
    "wheel",
    (e) => {
      const canScroll = messagesEl.scrollHeight > messagesEl.clientHeight;
      if (!canScroll) return;

      const atTop = messagesEl.scrollTop <= 0;
      const atBottom = messagesEl.scrollTop + messagesEl.clientHeight >= messagesEl.scrollHeight - 1;

      if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) e.stopPropagation();
    },
    { passive: true }
  );
});
