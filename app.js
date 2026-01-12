document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ======================
     AUTH CHECK
     ====================== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  const userEmail = localStorage.getItem(C.USER_EMAIL_KEY);

  if (!token || !userEmail) {
    window.location.href = "index.html";
    return;
  }

  /* ======================
     NAV + STATE
     ====================== */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    if (!id) return;
    sections.forEach(s => s.classList.toggle("active", s.id === id));
    buttons.forEach(b => b.classList.toggle("active", b.dataset.target === id));
    localStorage.setItem("pv_active_tab", id);
  }

  buttons.forEach(b =>
    b.addEventListener("click", () => showSection(b.dataset.target))
  );

  showSection(localStorage.getItem("pv_active_tab") || "section-chat");

  /* ======================
     LOGOUT (CRITIQUE)
     ====================== */
  const logoutBtn = document.getElementById("logout-btn");

  logoutBtn?.addEventListener("click", async () => {
    try {
      await fetch(C.AUTH_LOGOUT_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch {}

    // 🔥 nettoyage TOTAL
    Object.keys(localStorage)
      .filter(k => k.startsWith("pv_"))
      .forEach(k => localStorage.removeItem(k));

    window.location.href = "index.html";
  });

  /* ======================
     CHAT BOT (USER-SCOPED)
     ====================== */
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  // 🔐 conversation isolée par utilisateur
  const CHAT_KEY = `pv_chat_history_${userEmail}`;

  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
  } catch {
    history = [];
  }

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
    addBubble(msg, "user");

    history.push({ role: "user", text: msg });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));

    try {
      const res = await fetch(C.CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: msg,
          userId: userEmail // 🔑 OBLIGATOIRE POUR TON BACKEND
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur backend");

      const reply = data.reply || "Réponse vide.";
      addBubble(reply, "bot");

      history.push({ role: "bot", text: reply });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));

    } catch (e) {
      addBubble("❌ Erreur backend inaccessible.", "bot");
    }
  }

  sendBtn?.addEventListener("click", sendMessage);
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  /* ======================
     VIDEO (OPTIONNEL)
     ====================== */
  const startVideoBtn = document.getElementById("start-video");
  const stopVideoBtn = document.getElementById("stop-video");

  let recorder, chunks = [];

  startVideoBtn?.addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    startVideoBtn.disabled = true;
    stopVideoBtn.disabled = false;
  });

  stopVideoBtn?.addEventListener("click", () => {
    recorder.stop();
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const fd = new FormData();
      fd.append("video", blob);
      fd.append("userId", userEmail);

      try {
        await fetch(C.UPLOAD_URL, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: fd
        });
        addBubble("🎥 Vidéo envoyée.", "user");
      } catch {
        addBubble("❌ Échec upload vidéo.", "bot");
      }
    };

    startVideoBtn.disabled = false;
    stopVideoBtn.disabled = true;
  });
});
