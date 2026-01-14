import { useEffect, useMemo, useRef, useState } from "react";
import { API_ENDPOINTS, ASSETS, ROUTES, STORAGE_KEYS } from "../lib/config";
import { httpJson } from "../lib/api";
import { getToken, getUserEmail, logout, requireAuth } from "../lib/session";
import { useNavigate } from "react-router-dom";

export default function AppPage() {
  const navigate = useNavigate();
  const token = requireAuth();
  const userId = getUserEmail();
  const chatBoxRef = useRef(null);

  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || "chat";
  });
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [commentInput, setCommentInput] = useState("");

  const chatKey = useMemo(() => {
    if (!userId) return null;
    return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX_APP}${userId}`;
  }, [userId]);

  useEffect(() => {
    if (!token) {
      navigate(ROUTES.LOGIN_PAGE, { replace: true });
      return;
    }

    document.documentElement.style.setProperty("--app-bg", `url("${ASSETS.BG_CHAT}")`);
  }, [navigate, token]);

  useEffect(() => {
    if (!userId) {
      alert("Utilisateur non identifié. Veuillez vous reconnecter.");
      navigate(ROUTES.LOGIN_PAGE, { replace: true });
      return;
    }

    if (!chatKey) return;
    const stored = JSON.parse(localStorage.getItem(chatKey) || "[]");
    setChatHistory(Array.isArray(stored) ? stored : []);
  }, [chatKey, navigate, userId]);

  useEffect(() => {
    if (!chatKey) return;
    localStorage.setItem(chatKey, JSON.stringify(chatHistory));
  }, [chatHistory, chatKey]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSectionChange = (id) => {
    setActiveSection(id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, id);
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg) return;

    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: msg }]);

    try {
      const data = await httpJson(API_ENDPOINTS.CHAT, {
        method: "POST",
        token: getToken(),
        body: { message: msg, userId },
      });

      setChatHistory((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", text: "Erreur : backend inaccessible." },
      ]);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await httpJson(API_ENDPOINTS.FORUM_POSTS, { method: "GET" });
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = async (postId) => {
    setActivePost(postId);
    try {
      const data = await httpJson(`${API_ENDPOINTS.FORUM_COMMENTS_PREFIX}${postId}/comments`, {
        method: "GET",
      });
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createPost = async () => {
    await httpJson(API_ENDPOINTS.FORUM_POSTS, {
      method: "POST",
      token: getToken(),
      body: { title: postTitle, body: postBody },
    });
    setPostTitle("");
    setPostBody("");
    loadPosts();
  };

  const sendComment = async () => {
    if (!activePost) return;
    await httpJson(`${API_ENDPOINTS.FORUM_COMMENTS_PREFIX}${activePost}/comments`, {
      method: "POST",
      token: getToken(),
      body: { body: commentInput },
    });
    setCommentInput("");
    loadComments(activePost);
  };

  const endChatActivity = async () => {
    if (!chatHistory.length) {
      alert("Aucun message à sauvegarder.");
      return;
    }

    const confirmEnd = confirm(
      "Voulez-vous vraiment terminer l’activité ?\n\nLe chat sera sauvegardé et réinitialisé."
    );

    if (!confirmEnd) return;

    try {
      await httpJson(API_ENDPOINTS.CHAT_END, {
        method: "POST",
        token: getToken(),
        body: { userId, history: chatHistory },
      });

      setChatHistory([]);
      alert("Activité terminée et sauvegardée ✅");
    } catch {
      alert("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          min-height: 100vh;
          background: var(--app-bg, url("./asset/image_in.png")) center / cover no-repeat fixed;
          overflow-y: auto;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(6px);
          z-index: 0;
        }

        .app-container {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 20px 80px;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .logout-btn {
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          background: #ef4444;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .nav {
          display: flex;
          gap: 12px;
          margin-bottom: 40px;
        }

        .nav-btn {
          flex: 1;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          background: #e5e7eb;
        }

        .nav-btn.active {
          background: #2f5bea;
          color: white;
        }

        .section {
          display: none;
          background: rgba(255,255,255,0.92);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }

        .section.active {
          display: block;
        }

        .chat-box {
          height: 360px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          background: #fff;
        }

        .bubble {
          max-width: 75%;
          margin-bottom: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          white-space: pre-wrap;
        }

        .bubble.user {
          background: #2f5bea;
          color: white;
          margin-left: auto;
        }

        .bubble.bot {
          background: #e5e7eb;
        }

        .chat-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .chat-input {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #ccc;
        }

        .btn {
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        .btn.primary { background:#2f5bea; color:white; }
        .btn.ghost { background:#e5e7eb; }
      `}</style>

      <div className="overlay"></div>

      <div className="app-container">
        <div className="top-bar">
          <h2>Patient virtuel</h2>
          <button
            id="logout-btn"
            className="logout-btn"
            onClick={() => logout({ redirectTo: ROUTES.LOGIN_PAGE, clearAll: true, navigate })}
          >
            Déconnexion
          </button>
        </div>

        <div className="nav">
          {[
            { id: "chat", label: "Chat_bot_Beta" },
            { id: "forum", label: "Forum" },
            { id: "projects", label: "Projets" },
            { id: "friends", label: "Amis" },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeSection === item.id ? "active" : ""}`}
              data-target={item.id}
              onClick={() => handleSectionChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section id="chat" className={`section ${activeSection === "chat" ? "active" : ""}`}>
          <h1>Chat_bot_Beta</h1>

          <div id="chat-box" className="chat-box" ref={chatBoxRef}>
            {chatHistory.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="chat-controls">
            <input
              id="chat-input"
              className="chat-input"
              placeholder="Écris ton message…"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
            />
            <button id="send-btn" className="btn primary" onClick={sendChatMessage}>
              Envoyer
            </button>
          </div>

          <button
            id="end-chat-btn"
            className="btn ghost"
            style={{ marginTop: "12px", background: "#ef4444", color: "white" }}
            onClick={endChatActivity}
          >
            Fin de l’activité
          </button>
        </section>

        <section id="forum" className={`section ${activeSection === "forum" ? "active" : ""}`}>
          <h1>Forum</h1>

          <h3>Créer un post</h3>
          <input
            id="post-title"
            placeholder="Titre"
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            value={postTitle}
            onChange={(event) => setPostTitle(event.target.value)}
          />
          <textarea
            id="post-body"
            placeholder="Contenu…"
            style={{ width: "100%", height: "100px" }}
            value={postBody}
            onChange={(event) => setPostBody(event.target.value)}
          ></textarea>
          <button
            id="create-post"
            className="btn primary"
            style={{ marginTop: "10px" }}
            onClick={createPost}
          >
            Publier
          </button>

          <hr style={{ margin: "30px 0" }} />

          <div style={{ display: "flex", gap: "30px" }}>
            <div style={{ width: "40%" }}>
              <h3>Posts</h3>
              <div id="posts-list">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => loadComments(post.id)}
                  >
                    <strong>{post.title}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: "60%" }}>
              <h3>Commentaires</h3>
              <div id="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id}>{comment.body}</div>
                ))}
              </div>

              <textarea
                id="comment-input"
                placeholder="Répondre…"
                style={{ width: "100%", height: "80px", marginTop: "10px" }}
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
              ></textarea>
              <button
                id="send-comment"
                className="btn primary"
                style={{ marginTop: "10px" }}
                onClick={sendComment}
              >
                Répondre
              </button>
            </div>
          </div>
        </section>

        <section
          id="projects"
          className={`section ${activeSection === "projects" ? "active" : ""}`}
        >
          <h1>Projets</h1>
        </section>

        <section
          id="friends"
          className={`section ${activeSection === "friends" ? "active" : ""}`}
        >
          <h1>Amis</h1>
        </section>
      </div>
    </>
  );
}
