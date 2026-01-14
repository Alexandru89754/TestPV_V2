function initAppPage() {
  const C = window.CONFIG;
  const api = window.API;
  const session = window.SESSION;

  const token = session.requireAuthOrRedirect({ redirectTo: C.ROUTES.LOGIN_PAGE });
  if (!token) return;

  document.documentElement.style.setProperty(
    "--app-bg",
    `url("${C.ASSETS.BG_CHAT}")`
  );

  /* NAV */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach((s) => s.classList.toggle("active", s.id === id));
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.target === id));
    localStorage.setItem(C.STORAGE_KEYS.ACTIVE_TAB, id);
  }

  buttons.forEach((b) => {
    b.onclick = () => showSection(b.dataset.target);
  });
  showSection(localStorage.getItem(C.STORAGE_KEYS.ACTIVE_TAB) || "chat");

  /* LOGOUT */
  document.getElementById("logout-btn").onclick = async () => {
    await session.logout({ redirectTo: C.ROUTES.LOGIN_PAGE, clearAll: true });
  };

  /* ======================
   CHAT
====================== */
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  const userId = session.getUserEmail();

  if (!userId) {
    alert("Utilisateur non identifié. Veuillez vous reconnecter.");
    window.location.href = C.ROUTES.LOGIN_PAGE;
    return;
  }

  const CHAT_KEY = `${C.STORAGE_KEYS.CHAT_HISTORY_PREFIX_APP}${userId}`;
  let history = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");

  function renderChat() {
    chatBox.innerHTML = "";
    history.forEach((m) => {
      const div = document.createElement("div");
      div.className = `bubble ${m.role}`;
      div.textContent = m.text;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  renderChat();

  sendBtn.onclick = async () => {
    const msg = input.value.trim();
    if (!msg) return;

    input.value = "";

    history.push({ role: "user", text: msg });
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
    renderChat();

    try {
      const data = await api.httpJson(C.API_ENDPOINTS.CHAT, {
        method: "POST",
        token,
        body: {
          message: msg,
          userId: userId,
        },
      });

      history.push({ role: "bot", text: data.reply });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));
      renderChat();
    } catch (e) {
      history.push({
        role: "bot",
        text: "Erreur : backend inaccessible.",
      });
      localStorage.setItem(CHAT_KEY, JSON.stringify(history));
      renderChat();
    }
  };

  /* FORUM */
  const postsList = document.getElementById("posts-list");
  const commentsList = document.getElementById("comments-list");
  const commentInput = document.getElementById("comment-input");

  const postTitle = document.getElementById("post-title");
  const postBody = document.getElementById("post-body");

  let activePost = null;

  async function loadPosts() {
    try {
      const posts = await api.httpJson(C.API_ENDPOINTS.FORUM_POSTS, { method: "GET" });
      postsList.innerHTML = "";
      posts.forEach((p) => {
        const d = document.createElement("div");
        d.innerHTML = `<strong>${p.title}</strong>`;
        d.style.cursor = "pointer";
        d.onclick = () => loadComments(p.id);
        postsList.appendChild(d);
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function loadComments(postId) {
    activePost = postId;
    try {
      const comments = await api.httpJson(
        `${C.API_ENDPOINTS.FORUM_COMMENTS_PREFIX}${postId}/comments`,
        { method: "GET" }
      );
      commentsList.innerHTML = "";
      comments.forEach((c) => {
        const d = document.createElement("div");
        d.textContent = c.body;
        commentsList.appendChild(d);
      });
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById("create-post").onclick = async () => {
    await api.httpJson(C.API_ENDPOINTS.FORUM_POSTS, {
      method: "POST",
      token,
      body: {
        title: postTitle.value,
        body: postBody.value,
      },
    });
    postTitle.value = "";
    postBody.value = "";
    loadPosts();
  };

  document.getElementById("send-comment").onclick = async () => {
    if (!activePost) return;
    await api.httpJson(`${C.API_ENDPOINTS.FORUM_COMMENTS_PREFIX}${activePost}/comments`, {
      method: "POST",
      token,
      body: { body: commentInput.value },
    });
    commentInput.value = "";
    loadComments(activePost);
  };

  loadPosts();

  /* ======================
   FIN DE L’ACTIVITÉ
====================== */
  const endChatBtn = document.getElementById("end-chat-btn");

  if (endChatBtn) {
    endChatBtn.onclick = async () => {
      if (!history.length) {
        alert("Aucun message à sauvegarder.");
        return;
      }

      const confirmEnd = confirm(
        "Voulez-vous vraiment terminer l’activité ?\n\nLe chat sera sauvegardé et réinitialisé."
      );

      if (!confirmEnd) return;

      try {
        await api.httpJson(C.API_ENDPOINTS.CHAT_END, {
          method: "POST",
          token,
          body: {
            userId: userId,
            history: history,
          },
        });

        history = [];
        localStorage.setItem(CHAT_KEY, JSON.stringify(history));
        renderChat();
        alert("Activité terminée et sauvegardée ✅");
      } catch (err) {
        alert("Erreur lors de la sauvegarde.");
      }
    };
  }
}

document.addEventListener("DOMContentLoaded", initAppPage);
