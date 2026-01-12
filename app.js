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

  function show(id) {
    sections.forEach(s => s.classList.toggle("active", s.id === id));
    buttons.forEach(b => b.classList.toggle("active", b.dataset.target === id));
  }

  buttons.forEach(b => b.onclick = () => show(b.dataset.target));

  /* LOGOUT */
  document.getElementById("logout-btn").onclick = async () => {
    await fetch(C.AUTH_LOGOUT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    localStorage.clear();
    window.location.href = "index.html";
  };

  /* FORUM */
  const postsList = document.getElementById("posts-list");
  const commentsList = document.getElementById("comments-list");
  const commentInput = document.getElementById("comment-input");
  const sendCommentBtn = document.getElementById("send-comment");

  const postTitle = document.getElementById("post-title");
  const postBody = document.getElementById("post-body");
  const createPostBtn = document.getElementById("create-post");

  let activePostId = null;

  async function loadPosts() {
    const res = await fetch(C.FORUM_POSTS_URL);
    const posts = await res.json();
    postsList.innerHTML = "";

    posts.forEach(p => {
      const div = document.createElement("div");
      div.style.cursor = "pointer";
      div.innerHTML = `<strong>${p.title}</strong>`;
      div.onclick = () => selectPost(p.id);
      postsList.appendChild(div);
    });
  }

  async function selectPost(id) {
    activePostId = id;
    const res = await fetch(`${C.FORUM_COMMENTS_PREFIX}${id}/comments`);
    const comments = await res.json();
    commentsList.innerHTML = "";
    comments.forEach(c => {
      const d = document.createElement("div");
      d.textContent = c.body;
      commentsList.appendChild(d);
    });
  }

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
      alert("Erreur backend");
      return;
    }

    postTitle.value = "";
    postBody.value = "";
    loadPosts();
  };

  sendCommentBtn.onclick = async () => {
    if (!activePostId) return alert("Sélectionne un post");
    const body = commentInput.value.trim();
    if (!body) return;

    await fetch(`${C.FORUM_COMMENTS_PREFIX}${activePostId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ body })
    });

    commentInput.value = "";
    selectPost(activePostId);
  };

  loadPosts();
});
