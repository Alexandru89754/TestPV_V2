document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;
  const token = localStorage.getItem(C.TOKEN_KEY);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  /* NAV */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach(s => s.classList.toggle("active", s.id === id));
    buttons.forEach(b => b.classList.toggle("active", b.dataset.target === id));
    localStorage.setItem("pv_active_tab", id);
  }

  buttons.forEach(b => b.onclick = () => showSection(b.dataset.target));
  showSection(localStorage.getItem("pv_active_tab") || "chat");

  /* LOGOUT */
  document.getElementById("logout-btn").onclick = async () => {
    await fetch(C.AUTH_LOGOUT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    localStorage.clear();
    window.location.href = "index.html";
  };

  /* CHAT */
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  const CHAT_KEY = `pv_chat_${token}`;
  let history = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");

  function renderChat() {
    chatBox.innerHTML = "";
    history.forEach(m => {
      const div = document.createElement("div");
      div.className = `bubble ${m.role}`;
      div.textContent = m.text;
      chatBox.appendChild(div);
    });
  }

  renderChat();

  sendBtn.onclick = async () => {
    const msg = input.value.trim();
    if (!msg) return;
    input.value = "";

    history.push({ role: "user", text: msg });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    renderChat();

    const userId = localStorage.getItem(C.USER_EMAIL_KEY);

const res = await fetch(C.CHAT_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({
    message: msg,
    userId: userId
  })
});
    const data = await res.json();
    history.push({ role: "bot", text: data.reply });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    renderChat();
  };

  /* FORUM */
  const postsList = document.getElementById("posts-list");
  const commentsList = document.getElementById("comments-list");
  const commentInput = document.getElementById("comment-input");

  const postTitle = document.getElementById("post-title");
  const postBody = document.getElementById("post-body");

  let activePost = null;

  async function loadPosts() {
    const res = await fetch(C.FORUM_POSTS_URL);
    const posts = await res.json();
    postsList.innerHTML = "";
    posts.forEach(p => {
      const d = document.createElement("div");
      d.innerHTML = `<strong>${p.title}</strong>`;
      d.style.cursor = "pointer";
      d.onclick = () => loadComments(p.id);
      postsList.appendChild(d);
    });
  }

  async function loadComments(postId) {
    activePost = postId;
    const res = await fetch(`${C.FORUM_COMMENTS_PREFIX}${postId}/comments`);
    const comments = await res.json();
    commentsList.innerHTML = "";
    comments.forEach(c => {
      const d = document.createElement("div");
      d.textContent = c.body;
      commentsList.appendChild(d);
    });
  }

  document.getElementById("create-post").onclick = async () => {
    await fetch(C.FORUM_POSTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: postTitle.value,
        body: postBody.value
      })
    });
    postTitle.value = "";
    postBody.value = "";
    loadPosts();
  };

  document.getElementById("send-comment").onclick = async () => {
    if (!activePost) return;
    await fetch(`${C.FORUM_COMMENTS_PREFIX}${activePost}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ body: commentInput.value })
    });
    commentInput.value = "";
    loadComments(activePost);
  };

  loadPosts();
});
