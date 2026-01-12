document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ======================
     AUTH CHECK
     ====================== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  const userId =
    localStorage.getItem(C.PARTICIPANT_KEY) ||
    localStorage.getItem(C.USER_EMAIL_KEY);

  if (!token || !userId) {
    window.location.href = "index.html";
    return;
  }

  /* ======================
     NAV + STATE PERSISTENCE
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
     CHAT BOT (PAR UTILISATEUR)
     ====================== */
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

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

  renderHistory();

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    input.value = "";

    history.push({ role: "user", text: msg });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    addBubble(msg, "user");

    try {
      const res = await fetch(C.CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history,
          userId
        })
      });

      if (!res.ok) throw new Error("backend error");

      const data = await res.json();
      const reply = data.reply || "Erreur : réponse vide.";

      history.push({ role: "bot", text: reply });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));
      addBubble(reply, "bot");
    } catch {
      addBubble("❌ Erreur backend inaccessible.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  /* ======================
     VIDEO (OPTIONNEL – inchangé)
     ====================== */
  const startVideoBtn = document.getElementById("start-video");
  const stopVideoBtn = document.getElementById("stop-video");

  let recorder, chunks = [];

  if (startVideoBtn && stopVideoBtn) {
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

        await fetch(C.UPLOAD_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });

        addBubble("🎥 Vidéo envoyée.", "user");
      };

      startVideoBtn.disabled = false;
      stopVideoBtn.disabled = true;
    };
  }

  /* ======================
     LOGOUT (CORRECTION CRITIQUE)
     ====================== */
  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Supprime UNIQUEMENT les données de l'utilisateur courant
      localStorage.removeItem(C.TOKEN_KEY);
      localStorage.removeItem(C.USER_EMAIL_KEY);
      localStorage.removeItem(C.PARTICIPANT_KEY);
      localStorage.removeItem(CHAT_KEY);
      localStorage.removeItem("pv_active_tab");

      // Redirection propre
      window.location.href = "index.html";
    });
  }
});
