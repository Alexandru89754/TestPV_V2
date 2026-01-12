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

  const userEmail = localStorage.getItem(C.USER_EMAIL_KEY);

  /* ======================
     NAVIGATION
     ====================== */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach(sec => {
      sec.classList.toggle("active", sec.id === id);
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

  const savedTab = localStorage.getItem("pv_active_tab");
  const initialTab =
    savedTab && document.getElementById(savedTab)
      ? savedTab
      : "chat";

  showSection(initialTab);

  /* ======================
     LOGOUT
     ====================== */
  document.getElementById("logout-btn").addEventListener("click", async () => {
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
     CHAT BOT (PAR UTILISATEUR)
     ====================== */
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

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

  /* ======================
     FORUM (PUBLIC)
     ====================== */
  const postsList = document.getElementById("posts-list");
  const commentsList = document.getElementById("comments-list");
  const commentInput = document.getElementById("comment-input");
  const sendCommentBtn = document.getElementById("send-comment");

  let currentPostId = null;

  async function loadPosts() {
    const res = await fetch(C.FORUM_POSTS_URL, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const posts = await res.json();

    postsList.innerHTML = "";
    posts.forEach(p => {
      const div = document.createElement("div");
      div.textContent = p.title;
      div.style.cursor = "pointer";
      div.style.padding = "8px";
      div.style.borderBottom = "1px solid #ddd";
      div.onclick = () => openPost(p.id);
      postsList.appendChild(div);
    });
  }

  async function openPost(postId) {
    currentPostId = postId;

    const res = await fetch(
      `${C.FORUM_COMMENTS_PREFIX}${postId}/comments`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    const comments = await res.json();
    renderComments(comments);
  }

  function renderComments(comments) {
    commentsList.innerHTML = "";
    comments.forEach(c => {
      const div = document.createElement("div");
      div.style.marginBottom = "10px";
      div.innerHTML = `
        <strong>Utilisateur #${c.author_id}</strong><br/>
        ${c.body}
      `;
      commentsList.appendChild(div);
    });
  }

  sendCommentBtn.addEventListener("click", async () => {
    if (!currentPostId) return;

    const text = commentInput.value.trim();
    if (!text) return;

    await fetch(
      `${C.FORUM_COMMENTS_PREFIX}${currentPostId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ body: text })
      }
    );

    commentInput.value = "";
    openPost(currentPostId);
  });

  loadPosts();
});
