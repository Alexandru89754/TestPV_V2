document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js chargé (identifiant participant)");

  // ====== CONFIG ======
  const BACKEND_URL = "https://gpt-backend-kodi.onrender.com/chat";

  // ====== ELEMENTS UI ======
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

  if (!welcomeScreen || !chatScreen || !participantInput || !acceptBtn) {
    console.error("❌ Éléments de l'écran de bienvenue introuvables.");
    return;
  }
  if (!messagesEl || !formEl || !inputEl || !sendBtn) {
    console.error("❌ Éléments du chat introuvables.");
    return;
  }

  // ====== STORAGE KEYS ======
  const PARTICIPANT_KEY = "pv_participant_id";

  // On stocke l’historique par participant :
  // pv_chat_history_P001, pv_chat_history_P002, etc.
  function historyKeyFor(participantId) {
    return `pv_chat_history_${participantId}`;
  }

  function setStatus(text) {
    if (statusPill) statusPill.textContent = text;
  }

  function normalizeParticipantId(raw) {
    // 1) trim
    // 2) majuscules
    // 3) enlève espaces internes
    const s = String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
    return s;
  }

  function isValidParticipantId(pid) {
    // Ajuste si tu veux : ici on accepte lettres/chiffres/_/-
    // Longueur min 2
    return /^[A-Z0-9_-]{2,40}$/.test(pid);
  }

  function showWelcome(errorText = "") {
    welcomeScreen.hidden = false;
    chatScreen.hidden = true;
    welcomeError.textContent = errorText;
    participantInput.focus();
  }

  function showChat(participantId) {
    welcomeScreen.hidden = true;
    chatScreen.hidden = false;
    participantPill.textContent = `Participant: ${participantId}`;
    inputEl.focus();
  }

  function addMessageToUI(text, role) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(role === "user" ? "user-message" : role === "bot" ? "bot-message" : "system-message");
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
    } catch (e) {
      console.error("❌ Erreur lecture historique:", e);
      return [];
    }
  }

  function saveHistory(participantId, history) {
    try {
      localStorage.setItem(historyKeyFor(participantId), JSON.stringify(history));
    } catch (e) {
      console.error("❌ Erreur sauvegarde historique:", e);
    }
  }

  function renderHistory(history) {
    messagesEl.innerHTML = "";
    for (const item of history) {
      addMessageToUI(item.text, item.role);
    }
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
    return res.json(); // { reply }
  }

  // ====== STATE ======
  let participantId = localStorage.getItem(PARTICIPANT_KEY);
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

  // ====== BOOT ======
  if (participantId && isValidParticipantId(participantId)) {
    initChatForParticipant(participantId);
  } else {
    showWelcome("");
  }

  // ====== WELCOME FLOW ======
  acceptBtn.addEventListener("click", () => {
    const pid = normalizeParticipantId(participantInput.value);

    if (!isValidParticipantId(pid)) {
      showWelcome("Identifiant invalide. Utilisez un code du type P001 (lettres/chiffres, sans nom/courriel).");
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

  // ====== CHAT FLOW ======
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
    } catch (err) {
      console.error("❌ erreur fetch:", err);
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

  // ====== BUTTONS ======
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
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
  }

  if (changeIdBtn) {
    changeIdBtn.addEventListener("click", () => {
      // Option: ne pas supprimer les historiques, juste permettre de choisir un autre ID
      participantInput.value = participantId || "";
      showWelcome("Entrez un autre identifiant pour continuer (les historiques restent enregistrés par ID).");
    });
  }
});
