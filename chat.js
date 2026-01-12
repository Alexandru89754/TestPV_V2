document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // CONFIG (depuis config.js)
  // -------------------------
  const CFG = window.__PV_CONFIG__ || {};
  const API_BASE_URL = String(CFG.API_BASE_URL || "").replace(/\/+$/, "");
  const CHAT_PATH = String(CFG.CHAT_PATH || "/chat");
  const UPLOAD_VIDEO_PATH = String(CFG.UPLOAD_VIDEO_PATH || "/upload-video");
  const PARTICIPANT_KEY = String(CFG.PARTICIPANT_KEY || "pv_participant_id");
  const TOKEN_KEY = String(CFG.TOKEN_KEY || "pv_access_token");

  // URLs finales
  const BACKEND_CHAT_URL = `${API_BASE_URL}${CHAT_PATH}`;
  const BACKEND_UPLOAD_URL = `${API_BASE_URL}${UPLOAD_VIDEO_PATH}`;

  // -------------------------
  // UI constants
  // -------------------------
  const BG_CHAT = "./asset/image_in.png";

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
    return `pv_chat_history_${participantId}`;
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

  function getToken() {
    return (localStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function authHeaders() {
    const token = getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async function safeReadJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function sendToBackend(message, participantId) {
    const res = await fetch(BACKEND_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ message, userId: participantId }),
    });

    if (!res.ok) {
      const data = await safeReadJson(res);
      const detail =
        (data && (data.detail || data.message || data.error)) ||
        (await res.text().catch(() => "")) ||
        "";
      const err = new Error(`chat http ${res.status} ${detail}`.trim());
      err.status = res.status;
      err.detail = detail;
      throw err;
    }

    const data = await res.json();
    return data;
  }

  // -------------------------
  // Participant gating
  // -------------------------
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
      ts: new Date().toISOString(),
    });
    saveHistory(participantId, history);
  }
  renderHistory(history);

  // -------------------------
  // Chat submit
  // -------------------------
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

      // Ton backend historique renvoyait data.reply.
      // On supporte aussi data.answer / data.message au cas où.
      const reply =
        (data && (data.reply || data.answer || data.message)) || "Erreur: réponse vide.";

      typingBubble.textContent = reply;

      history.push({ role: "bot", text: reply, ts: new Date().toISOString() });
      saveHistory(participantId, history);

      setStatus("Prêt");
    } catch (err) {
      const status = err && err.status ? Number(err.status) : 0;

      if (status === 401) {
        typingBubble.textContent = "Erreur: accès refusé (non connecté).";
        addMessageToUI(
          "Le backend exige un token Bearer, mais aucun token valide n’a été fourni.",
          "system"
        );
        setStatus("401");
      } else if (status === 422) {
        typingBubble.textContent = "Erreur: requête invalide (422).";
        addMessageToUI("Vérifie le JSON envoyé (email/password/message).", "system");
        setStatus("422");
      } else if (status >= 500) {
        typingBubble.textContent = "Erreur: serveur (500).";
        addMessageToUI("Le backend a planté. Vérifie les logs Render.", "system");
        setStatus("500");
      } else {
        typingBubble.textContent = "Erreur: serveur inaccessible.";
        addMessageToUI(String(err?.message || err), "system");
        setStatus("Erreur");
      }

      history.push({
        role: "system",
        text: "Erreur: impossible d’obtenir une réponse.",
        ts: new Date().toISOString(),
      });
      saveHistory(participantId, history);
    } finally {
      sendBtn.disabled = false;
      inputEl.disabled = false;
      inputEl.focus();
    }
  });

  // -------------------------
  // Clear + Change ID
  // -------------------------
  clearBtn.addEventListener("click", () => {
    history = [
      { role: "bot", text: "Conversation effacée. Recommencez quand vous voulez.", ts: new Date().toISOString() },
    ];
    saveHistory(participantId, history);
    renderHistory(history);
    setStatus("Prêt");
  });

  changeIdBtn.addEventListener("click", () => {
    localStorage.removeItem(PARTICIPANT_KEY);
    window.location.href = "index.html";
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

          const res = await fetch(BACKEND_UPLOAD_URL, {
            method: "POST",
            headers: {
              ...authHeaders(),
            },
            body: fd,
          });

          const data = await safeReadJson(res);

          if (!res.ok) {
            setStatus("Erreur upload");
            addMessageToUI("Vidéo: erreur d’envoi. Mode texte disponible.", "system");
          } else if (data && data.ok === false) {
            setStatus("Erreur upload");
            addMessageToUI("Vidéo: backend a refusé le fichier. Mode texte disponible.", "system");
          } else {
            setStatus("Upload OK");
            const path = data && data.path ? data.path : "(ok)";
            addMessageToUI(`Vidéo envoyée. Path: ${path}`, "system");
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
});
