function initLegacyChatPage() {
  if (!window.CONFIG || !window.API) {
    alert("Erreur: config.js ou api.js n'est pas chargé. Vérifie l'ordre des <script>.");
    return;
  }

  const C = window.CONFIG;
  const api = window.API;
  const session = window.SESSION;

  const BACKEND_URL = C.API_ENDPOINTS.CHAT;

  const BG_WELCOME = C.ASSETS.BG_WELCOME;
  const BG_CHAT = C.ASSETS.BG_CHAT;

  const welcomeScreen = document.getElementById("welcome-screen");
  const chatScreen = document.getElementById("chat-screen");

  const participantInput = document.getElementById("participant-id");
  const acceptBtn = document.getElementById("accept-btn");
  const welcomeError = document.getElementById("welcome-error");

  const participantPill = document.getElementById("participant-pill");
  const statusPill = document.getElementById("status-pill");

  const messagesEl = document.getElementById("chat-messages");
  const formEl = document.getElementById("chat-form");
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-button");
  const clearBtn = document.getElementById("clear-chat");
  const changeIdBtn = document.getElementById("change-id");

  const appBg = document.getElementById("app-bg");

  const PARTICIPANT_KEY = C.STORAGE_KEYS.PARTICIPANT_ID;
  const HISTORY_PREFIX = C.STORAGE_KEYS.CHAT_HISTORY_PREFIX_LEGACY;

  function setStatus(text) {
    if (statusPill) statusPill.textContent = text;
  }

  function setBackground(url) {
    const u = String(url || "").trim();
    if (!appBg) return;
    if (!u) {
      appBg.style.backgroundImage = "";
      return;
    }
    appBg.style.backgroundImage = `url("${u.replace(/"/g, "%22")}")`;
  }

  function normalizeParticipantId(raw) {
    return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function isValidParticipantId(pid) {
    return /^[A-Z0-9_-]{2,40}$/.test(pid);
  }

  function historyKeyFor(participantId) {
    return `${HISTORY_PREFIX}${participantId}`;
  }

  function showWelcome(errorText = "") {
    setBackground(BG_WELCOME);
    if (welcomeScreen) welcomeScreen.hidden = false;
    if (chatScreen) chatScreen.hidden = true;
    if (welcomeError) welcomeError.textContent = errorText;
    if (participantInput) participantInput.focus();
  }

  function showChat(participantId) {
    setBackground(BG_CHAT);
    if (welcomeScreen) welcomeScreen.hidden = true;
    if (chatScreen) chatScreen.hidden = false;
    if (participantPill) participantPill.textContent = `Participant: ${participantId}`;
    if (inputEl) inputEl.focus();
  }

  function addMessageToUI(text, role) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(
      role === "user"
        ? "user-message"
        : role === "bot"
        ? "bot-message"
        : "system-message"
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
    for (const item of history) {
      addMessageToUI(item.text, item.role);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendToBackend(message, participantId) {
    const token = session?.getToken?.();
    return api.httpJson(BACKEND_URL, {
      method: "POST",
      token,
      body: { message, userId: participantId },
    });
  }

  let participantId = null;
  let history = [];

  function initChatForParticipant(pid) {
    participantId = pid;
    localStorage.setItem(PARTICIPANT_KEY, participantId);

    history = loadHistory(participantId);

    if (history.length === 0) {
      history.push({
        role: "bot",
        text: "Bonjour. Je suis votre patient virtuel. Quelle est votre principale raison de consultation aujourd’hui ?",
        ts: new Date().toISOString()
      });
      saveHistory(participantId, history);
    }

    renderHistory(history);
    setStatus("Prêt");
    showChat(participantId);
  }

  showWelcome("");

  acceptBtn.addEventListener("click", () => {
    const pid = normalizeParticipantId(participantInput.value);
    if (!isValidParticipantId(pid)) {
      showWelcome("Identifiant invalide. Utilisez un code du type P001 (lettres/chiffres, sans espaces, sans nom/courriel).");
      return;
    }
    initChatForParticipant(pid);
  });

  participantInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      acceptBtn.click();
    }
  });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!participantId) {
      showWelcome("Entrez un identifiant pour commencer.");
      return;
    }

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
    if (!participantId) return;

    history = [
      {
        role: "bot",
        text: "Conversation effacée. Recommencez quand vous voulez.",
        ts: new Date().toISOString()
      }
    ];
    saveHistory(participantId, history);
    renderHistory(history);
    setStatus("Prêt");
    inputEl.focus();
  });

  changeIdBtn.addEventListener("click", () => {
    participantId = null;
    history = [];
    if (participantInput) participantInput.value = "";
    showWelcome("");
  });

  messagesEl.addEventListener(
    "wheel",
    (e) => {
      const canScroll = messagesEl.scrollHeight > messagesEl.clientHeight;
      if (!canScroll) return;

      const atTop = messagesEl.scrollTop <= 0;
      const atBottom = messagesEl.scrollTop + messagesEl.clientHeight >= messagesEl.scrollHeight - 1;

      if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
        e.stopPropagation();
      }
    },
    { passive: true }
  );
}

document.addEventListener("DOMContentLoaded", initLegacyChatPage);
