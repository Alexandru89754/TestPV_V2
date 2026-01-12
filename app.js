document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ======================
     AUTH CHECK
     ====================== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  /* ======================
     NAVIGATION
     ====================== */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach(section => {
      section.classList.toggle("active", section.id === id);
    });

    buttons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.target === id);
    });

    localStorage.setItem("pv_active_tab", id);
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      showSection(btn.dataset.target);
    });
  });

  // ✅ section par défaut (ou restaurée)
  const savedTab = localStorage.getItem("pv_active_tab");
  const initialTab =
    savedTab && document.getElementById(savedTab)
      ? savedTab
      : "chat";

  showSection(initialTab);

  /* ======================
     LOGOUT
     ====================== */
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch(C.AUTH_LOGOUT_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch {}

    localStorage.removeItem(C.TOKEN_KEY);
    localStorage.removeItem(C.USER_EMAIL_KEY);
    localStorage.removeItem("pv_active_tab");

    window.location.href = "index.html";
  });

  /* ======================
     CHAT BOT
     ====================== */
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  const userEmail = localStorage.getItem(C.USER_EMAIL_KEY);
  const CHAT_KEY = `pv_chat_${userEmail}`;

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
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";

    history.push({ role: "user", text });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    addBubble(text, "user");

    try {
      const res = await fetch(C.CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          userId: userEmail
        })
      });

      const data = await res.json();
      const reply = data.reply || "Réponse vide.";

      history.push({ role: "bot", text: reply });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));
      addBubble(reply, "bot");

    } catch {
      addBubble("❌ Erreur : backend inaccessible.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  /* ======================
     VIDEO
     ====================== */
  const startVideoBtn = document.getElementById("start-video");
  const stopVideoBtn = document.getElementById("stop-video");

  let recorder;
  let chunks = [];

  startVideoBtn.onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

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
      fd.append("userId", userEmail);

      await fetch(C.UPLOAD_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: fd
      });

      addBubble("🎥 Vidéo envoyée.", "user");
    };

    startVideoBtn.disabled = false;
    stopVideoBtn.disabled = true;
  };
});
