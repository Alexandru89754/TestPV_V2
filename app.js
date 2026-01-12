document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  const bg = document.getElementById("app-bg");
  if (bg) bg.style.backgroundImage = `url("${C.BG_CHAT}")`;

  const token = localStorage.getItem(C.TOKEN_KEY) || "";
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  // ===== UI refs
  const userPill = document.getElementById("user-pill");
  const logoutBtn = document.getElementById("logout-btn");

  const navBtns = Array.from(document.querySelectorAll(".nav-btn"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  // Profile
  const avatarPreview = document.getElementById("avatar-preview");
  const displayNameEl = document.getElementById("display-name");
  const emailLine = document.getElementById("email-line");
  const avatarUrlEl = document.getElementById("avatar-url");
  const bioEl = document.getElementById("bio");
  const saveProfileBtn = document.getElementById("save-profile");
  const refreshProfileBtn = document.getElementById("refresh-profile");
  const profileErr = document.getElementById("profile-err");
  const profileOk = document.getElementById("profile-ok");

  // Participant
  const participantIdEl = document.getElementById("participant-id");
  const saveParticipantBtn = document.getElementById("save-participant");
  const clearParticipantBtn = document.getElementById("clear-participant");
  const participantErr = document.getElementById("participant-err");
  const participantOk = document.getElementById("participant-ok");

  // Friends
  const friendEmailEl = document.getElementById("friend-email");
  const sendRequestBtn = document.getElementById("send-request");
  const friendSearchErr = document.getElementById("friend-search-err");
  const friendSearchOk = document.getElementById("friend-search-ok");

  const friendsList = document.getElementById("friends-list");
  const incomingList = document.getElementById("incoming-list");
  const outgoingList = document.getElementById("outgoing-list");
  const friendsErr = document.getElementById("friends-err");

  // Friend chat (local MVP)
  const chatFriendIdEl = document.getElementById("chat-friend-id");
  const loadFriendChatBtn = document.getElementById("load-friend-chat");
  const friendChatInput = document.getElementById("friend-chat-input");
  const sendFriendChatBtn = document.getElementById("send-friend-chat");
  const friendChatbox = document.getElementById("friend-chatbox");
  const friendChatErr = document.getElementById("friend-chat-err");

  // Forum
  const postTitleEl = document.getElementById("post-title");
  const postBodyEl = document.getElementById("post-body");
  const createPostBtn = document.getElementById("create-post");
  const postsList = document.getElementById("posts-list");
  const selectedPost = document.getElementById("selected-post");
  const commentsWrap = document.getElementById("comments-wrap");
  const commentsList = document.getElementById("comments-list");
  const commentBodyEl = document.getElementById("comment-body");
  const addCommentBtn = document.getElementById("add-comment");
  const forumErr = document.getElementById("forum-err");
  const forumOk = document.getElementById("forum-ok");
  const commentsErr = document.getElementById("comments-err");
  const commentsOk = document.getElementById("comments-ok");

  // AI
  const aiParticipantPill = document.getElementById("ai-participant-pill");
  const aiStatus = document.getElementById("ai-status");
  const aiChatbox = document.getElementById("ai-chatbox");
  const aiInput = document.getElementById("ai-input");
  const aiSend = document.getElementById("ai-send");
  const aiErr = document.getElementById("ai-err");

  // ===== helpers
  function setActiveView(viewId) {
    panels.forEach(p => p.classList.toggle("hidden", p.id !== viewId));
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.view === viewId));
  }

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setActiveView(btn.dataset.view);
      if (btn.dataset.view === "view-profile") loadProfile();
      if (btn.dataset.view === "view-friends") loadFriendsAll();
      if (btn.dataset.view === "view-forum") loadPosts();
      if (btn.dataset.view === "view-ai") initAiView();
    });
  });

  async function apiJson(url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(opts.headers || {})
      }
    });
    const text = await res.text().catch(() => "");
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!res.ok) {
      const msg = data?.detail || text || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  function safeText(s) {
    return String(s ?? "");
  }

  function clearMsg(errEl, okEl) {
    if (errEl) errEl.textContent = "";
    if (okEl) okEl.textContent = "";
  }

  // ===== logout
  logoutBtn.addEventListener("click", async () => {
    try {
      await apiJson(C.AUTH_LOGOUT_URL, { method: "POST", body: "{}" });
    } catch {}
    localStorage.removeItem(C.TOKEN_KEY);
    // On garde email/participant si tu veux, mais on peut aussi les clear:
    // localStorage.removeItem(C.USER_EMAIL_KEY);
    window.location.href = "index.html";
  });

  // ===== PROFILE
  async function loadMe() {
    const me = await apiJson(C.AUTH_ME_URL, { method: "GET" });
    return me;
  }

  async function loadProfile() {
    clearMsg(profileErr, profileOk);
    try {
      const me = await loadMe();
      userPill.textContent = me.email ? `Connecté: ${me.email}` : "Connecté";
      emailLine.textContent = me.email || "—";

      const prof = await apiJson(C.PROFILE_ME_URL, { method: "GET" });

      displayNameEl.textContent = prof.display_name || (me.email ? me.email.split("@")[0] : "Utilisateur");
      avatarUrlEl.value = prof.avatar_url || "";
      bioEl.value = prof.bio || "";

      const avatarSrc = prof.avatar_url && prof.avatar_url.trim()
        ? prof.avatar_url.trim()
        : "https://www.gravatar.com/avatar/?d=mp&f=y";
      avatarPreview.src = avatarSrc;
    } catch (e) {
      profileErr.textContent = safeText(e.message || e);
    }
  }

  saveProfileBtn.addEventListener("click", async () => {
    clearMsg(profileErr, profileOk);
    try {
      saveProfileBtn.disabled = true;

      const payload = {
        avatar_url: String(avatarUrlEl.value || "").trim() || null,
        bio: String(bioEl.value || "").trim() || null
      };

      const prof = await apiJson(C.PROFILE_UPDATE_URL, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      profileOk.textContent = "Profil enregistré.";
      const avatarSrc = prof.avatar_url && prof.avatar_url.trim()
        ? prof.avatar_url.trim()
        : "https://www.gravatar.com/avatar/?d=mp&f=y";
      avatarPreview.src = avatarSrc;
    } catch (e) {
      profileErr.textContent = safeText(e.message || e);
    } finally {
      saveProfileBtn.disabled = false;
    }
  });

  refreshProfileBtn.addEventListener("click", loadProfile);

  // Participant id storage
  function normalizeParticipantId(raw) {
    return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
  }
  function isValidParticipantId(pid) {
    return /^[A-Z0-9_-]{2,40}$/.test(pid);
  }

  function loadParticipantIntoUI() {
    const pid = localStorage.getItem(C.PARTICIPANT_KEY) || "";
    participantIdEl.value = pid;
  }

  saveParticipantBtn.addEventListener("click", () => {
    clearMsg(participantErr, participantOk);
    const pid = normalizeParticipantId(participantIdEl.value);
    if (!isValidParticipantId(pid)) {
      participantErr.textContent = "Identifiant invalide (ex: P001).";
      return;
    }
    localStorage.setItem(C.PARTICIPANT_KEY, pid);
    participantOk.textContent = "Identifiant sauvegardé.";
  });

  clearParticipantBtn.addEventListener("click", () => {
    localStorage.removeItem(C.PARTICIPANT_KEY);
    participantIdEl.value = "";
    participantOk.textContent = "Identifiant effacé.";
  });

  // ===== FRIENDS
  async function loadFriendsAll() {
    friendsErr.textContent = "";
    try {
      const [friends, incoming, outgoing] = await Promise.all([
        apiJson(C.FRIENDS_LIST_URL, { method: "GET" }),
        apiJson(C.FRIEND_INCOMING_URL, { method: "GET" }),
        apiJson(C.FRIEND_OUTGOING_URL, { method: "GET" })
      ]);

      renderFriends(friends || []);
      renderIncoming(incoming || []);
      renderOutgoing(outgoing || []);
    } catch (e) {
      friendsErr.textContent = safeText(e.message || e);
    }
  }

  function renderFriends(items) {
    friendsList.innerHTML = "";
    if (!items.length) {
      friendsList.innerHTML = `<div class="item muted">Aucun ami.</div>`;
      return;
    }
    for (const f of items) {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="item-left">
          <div class="mini-avatar" style="background-image:url('${(f.avatar_url || "https://www.gravatar.com/avatar/?d=mp&f=y")}')"></div>
          <div>
            <div class="item-title">${safeText(f.display_name || "Ami")}</div>
            <div class="item-sub muted">user_id: ${safeText(f.user_id)}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn ghost small" data-open-chat="${safeText(f.user_id)}" type="button">Chat</button>
        </div>
      `;
      friendsList.appendChild(div);
    }

    friendsList.querySelectorAll("[data-open-chat]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-open-chat");
        setActiveView("view-friends");
        chatFriendIdEl.value = id;
        openFriendChat();
      });
    });
  }

  function renderIncoming(items) {
    incomingList.innerHTML = "";
    if (!items.length) {
      incomingList.innerHTML = `<div class="item muted">Aucune demande.</div>`;
      return;
    }
    for (const r of items) {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="item-left">
          <div>
            <div class="item-title">Demande #${safeText(r.id)}</div>
            <div class="item-sub muted">de user_id: ${safeText(r.from_user_id)}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn primary small" data-accept="${safeText(r.id)}" type="button">Accepter</button>
          <button class="btn ghost small" data-decline="${safeText(r.id)}" type="button">Refuser</button>
        </div>
      `;
      incomingList.appendChild(div);
    }

    incomingList.querySelectorAll("[data-accept]").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          btn.disabled = true;
          await apiJson(C.FRIEND_ACCEPT_PREFIX + btn.getAttribute("data-accept"), { method: "POST", body: "{}" });
          await loadFriendsAll();
        } catch (e) {
          friendsErr.textContent = safeText(e.message || e);
        } finally {
          btn.disabled = false;
        }
      });
    });

    incomingList.querySelectorAll("[data-decline]").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          btn.disabled = true;
          await apiJson(C.FRIEND_DECLINE_PREFIX + btn.getAttribute("data-decline"), { method: "POST", body: "{}" });
          await loadFriendsAll();
        } catch (e) {
          friendsErr.textContent = safeText(e.message || e);
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  function renderOutgoing(items) {
    outgoingList.innerHTML = "";
    if (!items.length) {
      outgoingList.innerHTML = `<div class="item muted">Aucune demande envoyée.</div>`;
      return;
    }
    for (const r of items) {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="item-left">
          <div>
            <div class="item-title">Demande #${safeText(r.id)}</div>
            <div class="item-sub muted">à user_id: ${safeText(r.to_user_id)}</div>
          </div>
        </div>
        <div class="item-actions">
          <span class="muted">En attente</span>
        </div>
      `;
      outgoingList.appendChild(div);
    }
  }

  // Search/add friend (MVP via email)
  // NOTE: ton backend actuel ajoute par user_id. Donc: on fait 2 étapes MVP:
  // - tu entres un email
  // - on récupère le user_id via forum/profile? => pas dispo.
  // Solution simple maintenant: tu ajoutes en entrant le user_id.
  //
  // Donc ici, on va demander un "email" MAIS on te dit de mettre user_id.
  //
  // Pour respecter ton besoin "rechercher", on ajoutera une route backend /users/search plus tard.
  // Là: fonctionnalité stable => ajouter via user_id.
  sendRequestBtn.addEventListener("click", async () => {
    friendSearchErr.textContent = "";
    friendSearchOk.textContent = "";

    const raw = String(friendEmailEl.value || "").trim();
    if (!raw) {
      friendSearchErr.textContent = "Entre un user_id (nombre) pour l’instant. Exemple: 7";
      return;
    }

    const toId = parseInt(raw, 10);
    if (!Number.isFinite(toId) || toId <= 0) {
      friendSearchErr.textContent = "Pour l’instant, entre un user_id numérique (ex: 7).";
      return;
    }

    try {
      sendRequestBtn.disabled = true;
      await apiJson(C.FRIEND_REQUEST_PREFIX + toId, { method: "POST", body: "{}" });
      friendSearchOk.textContent = "Demande envoyée.";
      await loadFriendsAll();
    } catch (e) {
      friendSearchErr.textContent = safeText(e.message || e);
    } finally {
      sendRequestBtn.disabled = false;
    }
  });

  // ===== Friend chat (local MVP)
  function friendChatKey(myEmail, friendId) {
    return `pv_friend_chat_${myEmail || "me"}_${friendId}`;
  }

  function renderFriendChat(messages) {
    friendChatbox.innerHTML = "";
    for (const m of messages) {
      const div = document.createElement("div");
      div.className = "bubble " + (m.role === "me" ? "me" : "them");
      div.textContent = m.text;
      friendChatbox.appendChild(div);
    }
    friendChatbox.scrollTop = friendChatbox.scrollHeight;
  }

  function openFriendChat() {
    friendChatErr.textContent = "";
    const myEmail = localStorage.getItem(C.USER_EMAIL_KEY) || "";
    const friendId = parseInt(chatFriendIdEl.value, 10);
    if (!Number.isFinite(friendId) || friendId <= 0) {
      friendChatErr.textContent = "Entre un user_id ami valide.";
      return;
    }

    const raw = localStorage.getItem(friendChatKey(myEmail, friendId));
    let arr = [];
    try { arr = raw ? JSON.parse(raw) : []; } catch { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    renderFriendChat(arr);
  }

  loadFriendChatBtn.addEventListener("click", openFriendChat);

  sendFriendChatBtn.addEventListener("click", () => {
    friendChatErr.textContent = "";
    const myEmail = localStorage.getItem(C.USER_EMAIL_KEY) || "";
    const friendId = parseInt(chatFriendIdEl.value, 10);
    const text = String(friendChatInput.value || "").trim();
    if (!Number.isFinite(friendId) || friendId <= 0) {
      friendChatErr.textContent = "Entre un user_id ami valide.";
      return;
    }
    if (!text) return;

    const key = friendChatKey(myEmail, friendId);
    const raw = localStorage.getItem(key);
    let arr = [];
    try { arr = raw ? JSON.parse(raw) : []; } catch { arr = []; }
    if (!Array.isArray(arr)) arr = [];

    arr.push({ role: "me", text, ts: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(arr));

    friendChatInput.value = "";
    renderFriendChat(arr);
  });

  // ===== FORUM
  let currentPostId = null;

  async function loadPosts() {
    forumErr.textContent = "";
    forumOk.textContent = "";
    postsList.innerHTML = "";
    selectedPost.innerHTML = `<div class="muted">Chargement…</div>`;
    commentsWrap.classList.add("hidden");
    currentPostId = null;

    try {
      const posts = await apiJson(C.FORUM_POSTS_WITH_COUNTS_URL, { method: "GET" });
      renderPosts(posts || []);
      selectedPost.innerHTML = `<div class="muted">Sélectionne un post à gauche.</div>`;
    } catch (e) {
      forumErr.textContent = safeText(e.message || e);
    }
  }

  function renderPosts(posts) {
    postsList.innerHTML = "";
    if (!posts.length) {
      postsList.innerHTML = `<div class="item muted">Aucun post.</div>`;
      return;
    }

    for (const p of posts) {
      const div = document.createElement("div");
      div.className = "item clickable";
      div.innerHTML = `
        <div class="item-left">
          <div>
            <div class="item-title">${safeText(p.title)}</div>
            <div class="item-sub muted">${safeText(p.comment_count)} commentaire(s)</div>
          </div>
        </div>
        <div class="item-actions">
          <span class="muted">#${safeText(p.id)}</span>
        </div>
      `;
      div.addEventListener("click", () => openPost(p.id));
      postsList.appendChild(div);
    }
  }

  async function openPost(postId) {
    commentsErr.textContent = "";
    commentsOk.textContent = "";
    currentPostId = postId;

    try {
      const post = await apiJson(C.FORUM_POSTS_URL + "/" + postId, { method: "GET" });
      selectedPost.innerHTML = `
        <div class="post">
          <div class="post-title">${safeText(post.title)}</div>
          <div class="muted">post_id: ${safeText(post.id)} · author_id: ${safeText(post.author_id)}</div>
          <div class="post-body">${safeText(post.body)}</div>
        </div>
      `;

      commentsWrap.classList.remove("hidden");
      await loadComments(postId);
    } catch (e) {
      forumErr.textContent = safeText(e.message || e);
    }
  }

  async function loadComments(postId) {
    commentsList.innerHTML = `<div class="muted">Chargement…</div>`;
    try {
      const comments = await apiJson(C.FORUM_COMMENTS_PREFIX + postId + "/comments", { method: "GET" });
      renderComments(comments || []);
    } catch (e) {
      commentsErr.textContent = safeText(e.message || e);
      commentsList.innerHTML = "";
    }
  }

  function renderComments(comments) {
    commentsList.innerHTML = "";
    if (!comments.length) {
      commentsList.innerHTML = `<div class="item muted">Aucun commentaire.</div>`;
      return;
    }
    for (const c of comments) {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="item-left">
          <div>
            <div class="item-title">Commentaire #${safeText(c.id)}</div>
            <div class="item-sub muted">author_id: ${safeText(c.author_id)}</div>
            <div style="margin-top:6px;">${safeText(c.body)}</div>
          </div>
        </div>
      `;
      commentsList.appendChild(div);
    }
  }

  createPostBtn.addEventListener("click", async () => {
    forumErr.textContent = "";
    forumOk.textContent = "";

    const title = String(postTitleEl.value || "").trim();
    const body = String(postBodyEl.value || "").trim();
    if (!title || !body) {
      forumErr.textContent = "Titre et contenu requis.";
      return;
    }

    try {
      createPostBtn.disabled = true;
      await apiJson(C.FORUM_POSTS_URL, {
        method: "POST",
        body: JSON.stringify({ title, body })
      });
      forumOk.textContent = "Post publié.";
      postTitleEl.value = "";
      postBodyEl.value = "";
      await loadPosts();
    } catch (e) {
      forumErr.textContent = safeText(e.message || e);
    } finally {
      createPostBtn.disabled = false;
    }
  });

  addCommentBtn.addEventListener("click", async () => {
    commentsErr.textContent = "";
    commentsOk.textContent = "";

    if (!currentPostId) {
      commentsErr.textContent = "Aucun post sélectionné.";
      return;
    }
    const body = String(commentBodyEl.value || "").trim();
    if (!body) return;

    try {
      addCommentBtn.disabled = true;
      await apiJson(C.FORUM_COMMENTS_PREFIX + currentPostId + "/comments", {
        method: "POST",
        body: JSON.stringify({ body })
      });
      commentsOk.textContent = "Commentaire envoyé.";
      commentBodyEl.value = "";
      await loadComments(currentPostId);
      await loadPosts();
    } catch (e) {
      commentsErr.textContent = safeText(e.message || e);
    } finally {
      addCommentBtn.disabled = false;
    }
  });

  // ===== AI TOOL
  function aiHistoryKey(pid) {
    return `pv_ai_history_${pid}`;
  }

  function addAiBubble(text, who) {
    const div = document.createElement("div");
    div.className = "bubble " + (who === "me" ? "me" : "them");
    div.textContent = safeText(text);
    aiChatbox.appendChild(div);
    aiChatbox.scrollTop = aiChatbox.scrollHeight;
  }

  function loadAiHistory(pid) {
    const raw = localStorage.getItem(aiHistoryKey(pid));
    let arr = [];
    try { arr = raw ? JSON.parse(raw) : []; } catch { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    return arr;
  }

  function saveAiHistory(pid, arr) {
    localStorage.setItem(aiHistoryKey(pid), JSON.stringify(arr));
  }

  function renderAi(pid) {
    aiChatbox.innerHTML = "";
    const hist = loadAiHistory(pid);
    if (hist.length === 0) {
      const first = "Bonjour. Je suis votre patient virtuel. Quelle est votre principale raison de consultation aujourd’hui ?";
      hist.push({ role: "them", text: first, ts: new Date().toISOString() });
      saveAiHistory(pid, hist);
    }
    for (const m of hist) addAiBubble(m.text, m.role);
  }

  function initAiView() {
    aiErr.textContent = "";
    const pid = localStorage.getItem(C.PARTICIPANT_KEY) || "P001";
    aiParticipantPill.textContent = `Participant: ${pid}`;
    renderAi(pid);
    aiStatus.textContent = "Prêt";
  }

  async function sendAiMessage() {
    aiErr.textContent = "";
    const pid = localStorage.getItem(C.PARTICIPANT_KEY) || "P001";
    const text = String(aiInput.value || "").trim();
    if (!text) return;

    aiSend.disabled = true;
    aiInput.disabled = true;
    aiStatus.textContent = "Envoi…";

    const hist = loadAiHistory(pid);
    hist.push({ role: "me", text, ts: new Date().toISOString() });
    saveAiHistory(pid, hist);
    addAiBubble(text, "me");
    aiInput.value = "";

    try {
      const res = await fetch(C.CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: text, userId: pid })
      });

      const raw = await res.text().catch(() => "");
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

      if (!res.ok) {
        throw new Error(data?.detail || raw || `HTTP ${res.status}`);
      }

      const reply = data.reply || "Réponse vide.";
      hist.push({ role: "them", text: reply, ts: new Date().toISOString() });
      saveAiHistory(pid, hist);
      addAiBubble(reply, "them");

      aiStatus.textContent = "Prêt";
    } catch (e) {
      aiErr.textContent = safeText(e.message || e);
      aiStatus.textContent = "Erreur";
    } finally {
      aiSend.disabled = false;
      aiInput.disabled = false;
      aiInput.focus();
    }
  }

  aiSend.addEventListener("click", sendAiMessage);
  aiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendAiMessage();
  });

  // ===== boot
  (async () => {
    // Default view
    setActiveView("view-profile");
    loadParticipantIntoUI();
    await loadProfile();
  })();
});
