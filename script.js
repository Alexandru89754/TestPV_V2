document.addEventListener("DOMContentLoaded", () => {
  const messagesEl = document.getElementById("chat-messages");
  const formEl = document.getElementById("chat-form");
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-button");
  const clearBtn = document.getElementById("clear-chat");
  const statusPill = document.getElementById("status-pill");

  // 🔴 1) REMPLACE PAR L’URL DE TON BACKEND (Render/Railway/etc.) + /chat
  // Exemple: "https://pv-backend.onrender.com/chat"
  const BACKEND_URL = "https://gpt-backend-kodi.onrender.com";

  const USER_ID = localStorage.getItem("pv_userId") || crypto.randomUUID();
  localStorage.setItem("pv_userId", USER_ID);

  function setStatus(text) {
    if (statusPill) statusPill.textContent = text;
  }

  function addMessage(text, role) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(role === "user" ? "user-message" : role === "bot" ? "bot-message" : "system-message");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
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

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = inputEl.value.trim();
    if (!text) return;

    sendBtn.disabled = true;
    inputEl.disabled = true;
    setStatus("Envoi…");

    addMessage(text, "user");
    inputEl.value = "";
    inputEl.focus();

    const typing = addMessage("…", "bot");

    try {
      const data = await sendToBackend(text);
      typing.textContent = data.reply || "Erreur: réponse vide.";
      setStatus("Prêt");
    } catch (err) {
      typing.textContent = "Erreur: impossible de joindre le serveur (URL/CORS).";
      console.error(err);
      setStatus("Erreur");
    } finally {
      sendBtn.disabled = false;
      inputEl.disabled = false;
      inputEl.focus();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      messagesEl.innerHTML = `<div class="message bot-message">Conversation effacée. Recommencez quand vous voulez.</div>`;
      s
