function initChatPage() {
  if (!window.CONFIG) {
    alert("Erreur: config.js n'est pas chargé. Vérifie l'ordre des <script>.");
    return;
  }

  const C = window.CONFIG;
  const api = window.API;

  const BACKEND_CHAT_URL = C.API_ENDPOINTS.CHAT;
  const BACKEND_UPLOAD_URL = C.API_ENDPOINTS.UPLOAD;

  const BG_CHAT = C.ASSETS.BG_CHAT;
  const PARTICIPANT_KEY = C.STORAGE_KEYS.PARTICIPANT_ID;
  const HISTORY_PREFIX = C.STORAGE_KEYS.CHAT_HISTORY_PREFIX_LEGACY;

  const appBg = document.getElementById("app-bg");
  const participantPill = document.getElementById("participant-pill");
  const statusPill = document.getElementById("status-pill");

  const messagesEl = document.getElementById("chat-messages");
  const formEl = document.getElementById("chat-form");
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-button");
  const clearBtn = document.getElementById("clear-chat");
  const changeIdBtn = document.getElementById("change-id");

  const camStartBtn = document.getElementById("cam-start");
  const camStopBtn = document.getElementById("cam-stop");

  function setBackground(url) {
    if (!appBg) return;
    appBg.style.backgroundImage = `url("${url}")`;
  }

  function setStatus(text) {
    if (statusPill) statusPill.textContent = text;
  }

  function historyKeyFor(participantId) {
    return `${HISTORY_PREFIX}${participantId}`;
  }

  function addMessageToUI(text, role) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(
      role === "user" ? "user-message" : role === "bot" ? "bot-message" : "system-message"
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
    return api.httpJson(BACKEND_CHAT_URL, {
      method: "POST",
      body: { message, userId: participantId },
    });
  }

  const participantId = localStorage.getItem(PARTICIPANT_KEY);
  if (!participantId) {
    window.location.href = C.ROUTES.LOGIN_PAGE;
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
      ts: new Date().toISOString(),
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
    } catch (err) {
      typingBubble.textContent = "Erreur: serveur inaccessible.";
      addMessageToUI(String(err), "system");
      history.push({ role: "system", text: "Erreur: serveur inaccessible.", ts: new Date().toISOString() });
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
  });

  changeIdBtn.addEventListener("click", () => {
    localStorage.removeItem(PARTICIPANT_KEY);
    window.location.href = C.ROUTES.LOGIN_PAGE;
  });

  /* =========================
     CAMERA (facultatif)
     ========================= */

  let stream = null;
  let recorder = null;
  let chunks = [];

  function stopTracks() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  camStartBtn.addEventListener("click", async () => {
    try {
      setStatus("Caméra…");

      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      const mimeCandidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      let mimeType = "";
      for (const m of mimeCandidates) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) {
          mimeType = m;
          break;
        }
      }

      chunks = [];
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstart = () => {
        camStartBtn.disabled = true;
        camStopBtn.disabled = false;
        setStatus("Enregistrement");
        addMessageToUI("Caméra activée (sans audio).", "system");
      };

      recorder.onstop = async () => {
        try {
          setStatus("Upload…");

          const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
          const file = new File([blob], "recording.webm", { type: blob.type });

          const fd = new FormData();
          fd.append("userId", participantId);
          fd.append("video", file);

          const res = await fetch(BACKEND_UPLOAD_URL, { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data.ok) {
            setStatus("Erreur upload");
            addMessageToUI("Vidéo: erreur d’envoi. Mode texte disponible.", "system");
          } else {
            setStatus("Upload OK");
            addMessageToUI(`Vidéo envoyée. Path: ${data.path}`, "system");
          }
        } catch {
          setStatus("Erreur upload");
          addMessageToUI("Vidéo: erreur d’envoi. Mode texte disponible.", "system");
        } finally {
          camStartBtn.disabled = false;
          camStopBtn.disabled = true;
          stopTracks();
          recorder = null;
          chunks = [];
          setTimeout(() => setStatus("Prêt"), 1000);
        }
      };

      recorder.start(1000);
    } catch (e) {
      setStatus("Caméra refusée");
      addMessageToUI("Caméra refusée. Mode texte seulement.", "system");
      camStartBtn.disabled = false;
      camStopBtn.disabled = true;
      stopTracks();
    }
  });

  camStopBtn.addEventListener("click", () => {
    try {
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } catch {
      setStatus("Erreur caméra");
      addMessageToUI("Erreur caméra. Mode texte seulement.", "system");
      camStartBtn.disabled = false;
      camStopBtn.disabled = true;
      stopTracks();
    }
  });
}

document.addEventListener("DOMContentLoaded", initChatPage);
