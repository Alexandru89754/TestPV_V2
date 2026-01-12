document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ===== AUTH GUARD ===== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  /* ===== NAV ===== */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach(s => s.classList.toggle("active", s.id === id));
    buttons.forEach(b => b.classList.toggle("active", b.dataset.target === id));
    window.scrollTo({ top: 0 });
  }

  buttons.forEach(b =>
    b.addEventListener("click", () => showSection(b.dataset.target))
  );

  showSection(null);

  /* ===== CHAT ===== */
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  const startVideoBtn = document.getElementById("start-video");
  const stopVideoBtn = document.getElementById("stop-video");

  let mediaRecorder;
  let videoChunks = [];

  function addBubble(text, role) {
    const div = document.createElement("div");
    div.className = `bubble ${role}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendMessage(message) {
    addBubble(message, "user");

    const res = await fetch(C.CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    addBubble(data.reply || "Erreur réponse.", "bot");
  }

  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if (!msg) return;
    input.value = "";
    sendMessage(msg);
  };

  /* ===== VIDEO ===== */
  startVideoBtn.onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    mediaRecorder = new MediaRecorder(stream);
    videoChunks = [];

    mediaRecorder.ondataavailable = e => videoChunks.push(e.data);
    mediaRecorder.start();

    startVideoBtn.disabled = true;
    stopVideoBtn.disabled = false;
  };

  stopVideoBtn.onclick = async () => {
    mediaRecorder.stop();

    mediaRecorder.onstop = async () => {
      const blob = new Blob(videoChunks, { type:"video/webm" });
      const formData = new FormData();
      formData.append("video", blob);

      await fetch(C.UPLOAD_URL, {
        method:"POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      addBubble("🎥 Vidéo envoyée au patient.", "user");
    };

    startVideoBtn.disabled = false;
    stopVideoBtn.disabled = true;
  };
});
