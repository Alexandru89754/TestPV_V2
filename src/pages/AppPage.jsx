import { useEffect, useMemo, useRef, useState } from "react";
import { API_ENDPOINTS, ASSETS, ROUTES, STORAGE_KEYS } from "../lib/config";
import { httpJson } from "../lib/api";
import { getToken, getUserEmail, logout, requireAuth } from "../lib/session";
import { useNavigate } from "react-router-dom";
import TypingIndicator from "../components/TypingIndicator";

const TYPING_INTERVAL = 32;
const TYPING_CHUNK_SIZE = 2;
const SCROLL_THRESHOLD = 24;

export default function AppPage() {
  const navigate = useNavigate();
  const token = requireAuth();
  const userId = getUserEmail();
  const chatBoxRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const typingMessageIdRef = useRef(null);
  const typingFullTextRef = useRef("");
  const userAtBottomRef = useRef(true);

  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || "chat";
  });
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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

    document.body.classList.add("bg-app");
    document.body.classList.remove("bg-auth");
    document.documentElement.style.setProperty("--app-bg", `url("${ASSETS.BG_CHAT}")`);
    return () => {
      document.body.classList.remove("bg-app");
    };
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
      if (userAtBottomRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }
  }, [chatHistory]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    if (!chatBoxRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
    userAtBottomRef.current = scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
  };

  const finalizeTyping = () => {
    if (!typingMessageIdRef.current) return;
    const finalText = typingFullTextRef.current;
    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === typingMessageIdRef.current ? { ...msg, text: finalText } : msg
      )
    );
    typingMessageIdRef.current = null;
    typingFullTextRef.current = "";
    setIsTyping(false);
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const startTyping = (text) => {
    const fullText = String(text ?? "");
    const typingId = new Date().toISOString();
    typingMessageIdRef.current = typingId;
    typingFullTextRef.current = fullText;
    setIsTyping(true);
    setChatHistory((prev) => [...prev, { id: typingId, role: "bot", text: "" }]);
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    let index = 0;
    const step = () => {
      index = Math.min(fullText.length, index + TYPING_CHUNK_SIZE);
      setChatHistory((prev) =>
        prev.map((msg) => (msg.id === typingId ? { ...msg, text: fullText.slice(0, index) } : msg))
      );
      if (chatBoxRef.current && userAtBottomRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
      if (index >= fullText.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        typingMessageIdRef.current = null;
        typingFullTextRef.current = "";
        setIsTyping(false);
      }
    };
    step();
    typingIntervalRef.current = setInterval(step, TYPING_INTERVAL);
  };

  const handleSectionChange = (id) => {
    setActiveSection(id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, id);
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg) return;

    finalizeTyping();
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: msg }]);
    setIsThinking(true);

    try {
      const data = await httpJson(API_ENDPOINTS.CHAT, {
        method: "POST",
        token: getToken(),
        body: { message: msg, userId },
      });

      setIsThinking(false);
      startTyping(data.reply);
    } catch {
      setIsThinking(false);
      startTyping("Erreur : backend inaccessible.");
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
          background: transparent;
          overflow-y: auto;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(10px);
          z-index: 0;
        }

        .app-container {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 24px 90px;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .logout-btn {
          padding: 10px 20px;
          border-radius: 999px;
          border: none;
          background: rgba(239, 68, 68, 0.85);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 1);
          box-shadow: 0 12px 24px rgba(239, 68, 68, 0.25);
          transform: translateY(-1px);
        }

        .nav {
          display: flex;
          gap: 12px;
          margin-bottom: 36px;
        }

        .nav-btn {
          flex: 1;
          padding: 14px 18px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.12);
          color: #f5f5f5;
          transition: all 0.2s ease;
        }

        .nav-btn.active {
          background: rgba(59, 130, 246, 0.9);
          color: white;
          box-shadow: 0 10px 24px rgba(59, 130, 246, 0.25);
        }

        .section {
          display: none;
          background: rgba(20, 20, 24, 0.78);
          border-radius: 28px;
          padding: 40px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          animation: fadeUp 0.35s ease;
        }

        .section.active {
          display: block;
        }

        .chat-box {
          height: 360px;
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 20px;
          background: rgba(8, 8, 12, 0.75);
        }

        .bubble {
          max-width: 75%;
          margin-bottom: 12px;
          padding: 14px 18px;
          border-radius: 20px;
          font-size: 16px;
          white-space: pre-wrap;
          line-height: 1.55;
          animation: fadeUp 0.3s ease;
        }

        .bubble.user {
          background: rgba(59, 130, 246, 0.95);
          color: white;
          margin-left: auto;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
        }

        .bubble.bot {
          background: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(6px);
        }

        .chat-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(10, 10, 12, 0.8);
          color: #f8fafc;
        }

        .chat-input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.7);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .btn {
          padding: 12px 18px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .btn.primary { background: rgba(59, 130, 246, 0.95); color:white; }
        .btn.ghost { background: rgba(255, 255, 255, 0.12); color: #f5f5f5; }
        .btn.primary:hover,
        .btn.ghost:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.25);
        }

        .typing-message {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
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

          <div id="chat-box" className="chat-box" ref={chatBoxRef} onScroll={handleScroll}>
            {chatHistory.map((message, index) => (
              <div key={message.id || `${message.role}-${index}`} className={`bubble ${message.role}`}>
                {message.text}
              </div>
            ))}
            {isThinking && !isTyping ? (
              <div className="bubble bot typing-message">
                <TypingIndicator />
              </div>
            ) : null}
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
