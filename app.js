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
    sections.forEach(s => s.classList.toggle("active", s.id === id));
    buttons.forEach(b => b.classList.toggle("active", b.dataset.target === id));
    localStorage.setItem("pv_active_tab", id);
  }

  buttons.forEach(b => {
    b.addEventListener("click", () => {
      showSection(b.dataset.target);
    });
  });

  showSection(localStorage.getItem("pv_active_tab") || "chat");

  /* ======================
     LOGOUT
     ====================== */
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await fetch(C.AUTH_LOGOUT_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
      localStorage.clear();
      window.location.href = "index.html";
    };
  }

  /* ======================
     FORUM
     ====================== */
  const postsList = document.getElementById("posts-list");
  const commentsList = document.getElementById("comments-list");
  const commentInput = document.getElementById("comment-input");
  const sendCommentBtn = document.getElementById("send-comment");

  const postTitle = document.getElementById("post-title");
  const postBody = document.getElementById("post-body");
  const createPostBtn = document.getElementById("create-post");

  let activePostId = null;

  async function loadPosts() {
    if (!postsList) return;

    const res = await fetch(C.FORUM_POSTS_URL);
    const posts = await res.json();

    postsList.innerHTML = "";
    posts.forEach(p => {
      const div = document.createElement("div");
      div.style.cursor = "pointer";
      div.style.marginBottom = "14px";
      div.innerHTML = `
        <strong>${p.title}</strong><br/>
        <small>${p.body.slice(0, 100)}...</small>
      `;
      div.onclick = () => selectPost(p.id);
      postsList.appendChild(div);
    });
  }

  async function selectPost(postId) {
    activePostId = postId;
    if (!commentsList) return;

    commentsList.innerHTML = "Chargement…";

    const res = await fetch(`${C.FORUM_COMMENTS_PREFIX}${postId}/comments`);
    const comments = await res.json();

    commentsList.innerHTML = "";
    comments.forEach(c => {
      const div = document.createElement("div");
      div.style.marginBottom = "10px";
      div.textContent = c.body;
      commentsList.appendChild(div);
    });
  }

  if (sendCommentBtn) {
    sendCommentBtn.onclick = async () => {
      if (!activePostId) {
        alert("Sélectionne un post");
        return;
      }

      const text = commentInput.value.trim();
      if (!text) return;

      await fetch(`${C.FORUM_COMMENTS_PREFIX}${activePostId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ body: text })
      });

      commentInput.value = "";
      selectPost(activePostId);
    };
  }

  if (createPostBtn) {
    createPostBtn.onclick = async () => {
      const title = postTitle.value.trim();
      const body = postBody.value.trim();

      if (!title || !body) {
        alert("Titre et contenu requis");
        return;
      }

      const res = await fetch(C.FORUM_POSTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, body })
      });

      if (!res.ok) {
        alert("Erreur lors de la création du post");
        return;
      }

      postTitle.value = "";
      postBody.value = "";

      loadPosts();
    };
  }

  loadPosts();
});
