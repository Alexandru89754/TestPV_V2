document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js chargé");

  const messagesEl = document.getElementById("chat-messages");
  const formEl = document.getElementById("chat-form");
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-button");
  const clearBtn = document.getElementById("clear-chat");
  const statusPill = document.getElementById("status-pill");

  if (!messagesEl || !formEl || !inputEl || !sendBtn) {
    console.error("❌ Éléments introuvables. Vérifie les IDs dans index.html.");
    return;
  }

  // ✅ Ton backend Render
  const BACKEND_URL = "https://gpt-backend-kodi.onrender.com/chat";

  // ✅ userId persistant (utile aussi côté backend)
  const USER_ID = localStorage.getItem("pv_userId") || crypto.randomUUID();
  localStorage.setItem("pv_userId", USER_ID);

  // ✅ Clés de stockage local pour l’historique
  const STORAGE_KEY = `pv_chat_history_${USER_ID}`;

  function setStatus(text) {
    if (statusPill) statusPill.textContent = text;
  }

  function escapeText(s) {
    // empêche tout HTML dans les messages
    return String(s ?? "");
  }

  function addMessageToUI(text, role) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(role === "user" ? "user-message" : role === "bot" ? "bot-message" : "system-message");
    div.textContent = escapeText(text);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("❌ Erreur lecture historique localStorage:", e);
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("❌ Erreur sauvegarde historique localStorage:", e);
    }
  }

  function renderHistory(history) {
    messagesEl.innerHTML = "";
    for (const item of history) {
      addMessageToUI(item.text, item.role);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendToBackend(message) {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId: USER_ID })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
    }

    return res.json(); // { reply: "..." }
  }

  // =========================
  // 1) Charger et afficher l’historique au démarrage
  // =========================
  let history = loadHistory();

  // Si vide, injecte un message d’accueil UNE fois
  if (history.length === 0) {
    history.push({
      role: "bot",
      text: "Bonjour. Je suis votre patient virtuel. Comment puis-je vous aider aujourd’hui ?",
      ts: new Date().toISOString()
    });
    saveHistory(history);
  }

  renderHistory(history);
  setStatus("Prêt");

  // =========================
  // 2) Envoi d’un message
  // =========================
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("✅ submit intercepté");

    const text = inputEl.value.trim();
    if (!text) return;

    // UI lock
    sendBtn.disabled = true;
    inputEl.disabled = true;
    setStatus("Envoi…");

    // Ajouter message user à l’historique + UI
    history.push({ role: "user", text, ts: new Date().toISOString() });
    saveHistory(history);
    addMessageToUI(text, "user");

    inputEl.value = "";
    inputEl.focus();

    // bubble "typing…" (pas enregistré dans l’historique)
    const typingBubble = addMessageToUI("…", "bot");

    try {
      const data = await sendToBackend(text);
      const reply = data.reply || "Erreur: réponse vide.";

      // Remplacer le bubble et enregistrer la réponse
      typingBubble.textContent = escapeText(reply);

      history.push({ role: "bot", text: reply, ts: new Date().toISOString() });
      saveHistory(history);

      setStatus("Prêt");
    } catch (err) {
      typingBubble.textContent = "Erreur: serveur inaccessible (CORS/URL).";
      console.error("❌ erreur fetch:", err);

      history.push({
        role: "system",
        text: "Erreur: impossible de joindre le serveur.",
        ts: new Date().toISOString()
      });
      saveHistory(history);

      setStatus("Erreur");
    } finally {
      sendBtn.disabled = false;
      inputEl.disabled = false;
      inputEl.focus();
    }
  });

  // =========================
  // 3) Bouton “Effacer la conversation”
  // =========================
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      history = [
        {
          role: "bot",
          text: "Conversation effacée. Recommencez quand vous voulez.",
          ts: new Date().toISOString()
        }
      ];
      saveHistory(history);
      renderHistory(history);
      setStatus("Prêt");
      inputEl.focus();
    });
  }
});
