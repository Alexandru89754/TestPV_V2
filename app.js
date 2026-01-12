document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ===== AUTH GUARD ===== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  /* ======================
     NAV + STATE
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
     CHAT BOT
     ====================== */
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  const userId =
    localStorage.getItem(C.PARTICIPANT_KEY) ||
    localStorage.getItem(C.USER_EMAIL_KEY) ||
    "anonymous";

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

  /* ===== BOT PARLE EN PREMIER ===== */
  if (history.length === 0) {
    const firstMessage = "Bonjour. Je suis votre patient virtuel. Quelle est votre principale raison de consultation aujourd’hui ?";
    history.push({ role: "bot", text: firstMessage });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
  }

  renderHistory();

  async function sendMessage(textOverride = null) {
    const msg = textOverride ?? input.value.trim();
    if (!msg) return;

    input.value = "";

    history.push({ role: "user", text: msg });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    addBubble(msg, "user");

    try {
      const res = await fetch(C.CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: msg,
          history,
          userId
        })
      });

      const raw = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} → ${raw}`);
      }

      const data = JSON.parse(raw);
      const reply = data.reply || "Réponse vide du backend.";

      history.push({ role: "bot", text: reply });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));
      addBubble(reply, "bot");

    } catch (e) {
      addBubble(`❌ Backend erreur:\n${e.message}`, "bot");
      console.error("CHAT BACKEND ERROR:", e);
    }
  }

  sendBtn.addEventListener("click", () => sendMessage());
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  /* ======================
     VIDEO
     ====================== */
  const startVideoBtn = document.getElementById("start-video");
  const stopVideoBtn = document.getElementById("stop-video");

  let recorder, chunks = [];

  startVideoBtn.onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    startVideoBtn.disabled = true;
    stopVideoBtn.disabled = false;
  };

  stopVideoBtn.onclick = () => {
    recorder.stop();
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const fd = new FormData();
      fd.append("video", blob);

      try {
        await fetch(C.UPLOAD_URL, {
          method: "POST",
          body: fd
        });
        addBubble("🎥 Vidéo envoyée.", "user");
      } catch (e) {
        addBubble("❌ Erreur envoi vidéo.", "bot");
      }
    };

    startVideoBtn.disabled = false;
    stopVideoBtn.disabled = true;
  };
});
