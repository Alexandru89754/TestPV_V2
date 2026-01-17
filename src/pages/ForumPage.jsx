import { useEffect, useMemo, useState } from "react";
import { getToken, getUserEmail } from "../lib/session";
import { createComment, createPost, listComments, listPosts } from "../lib/client";

const TABS = [
  { id: "feed", label: "Feed" },
  { id: "activities", label: "Activities" },
];

const resolveAuthor = (entry) => {
  const username =
    entry?.author_username ||
    entry?.username ||
    entry?.user?.username ||
    entry?.user?.name ||
    "Utilisateur";
  const avatarUrl =
    entry?.author_avatar_url ||
    entry?.avatar_url ||
    entry?.avatarUrl ||
    entry?.user?.avatar_url ||
    entry?.user?.avatarUrl ||
    "";
  return { username, avatarUrl };
};

const getInitial = (name) => {
  if (!name) return "?";
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
};

function CommentRow({ comment }) {
  const author = resolveAuthor(comment);
  return (
    <div className="comment-row">
      <div className="avatar-circle small">
        {author.avatarUrl ? (
          <img src={author.avatarUrl} alt={author.username} />
        ) : (
          <span className="avatar-fallback">{getInitial(author.username)}</span>
        )}
      </div>
      <div>
        <p className="forum-username">{author.username || "Utilisateur"}</p>
        <p className="forum-meta">{formatTime(comment.created_at)}</p>
        <p>{comment.body}</p>
      </div>
    </div>
  );
}

function formatTime(value) {
  if (!value) return "à l’instant";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ForumPage() {
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [status, setStatus] = useState("");
  const [activePostId, setActivePostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentText, setCommentText] = useState("");

  const currentUser = useMemo(() => getUserEmail(), []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const data = await listPosts({ token });
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setStatus("Impossible de charger le feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!postText.trim()) {
      setStatus("Le post ne peut pas être vide.");
      return;
    }
    try {
      const token = getToken();
      await createPost({ token, body: { body: postText } });
      setPostText("");
      setComposerOpen(false);
      setStatus("Post publié.");
      loadPosts();
    } catch {
      setStatus("Erreur lors de la publication.");
    }
  };

  const handleToggleComments = async (postId) => {
    if (activePostId === postId) {
      setActivePostId(null);
      return;
    }

    setActivePostId(postId);
    try {
      const token = getToken();
      const data = await listComments({ token, postId });
      setCommentsByPost((prev) => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
    } catch {
      setStatus("Impossible de charger les commentaires.");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !activePostId) return;
    try {
      const token = getToken();
      await createComment({ token, postId: activePostId, body: { body: commentText } });
      setCommentText("");
      const data = await listComments({ token, postId: activePostId });
      setCommentsByPost((prev) => ({ ...prev, [activePostId]: Array.isArray(data) ? data : [] }));
    } catch {
      setStatus("Erreur lors de l’ajout du commentaire.");
    }
  };

  return (
    <section className="forum-layout">
      <div className="forum-left">
        <button className="btn-primary" onClick={() => setComposerOpen(true)}>
          Créer
        </button>
      </div>

      <div className="forum-center">
        <div className="forum-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`forum-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {status && <p className="status-text">{status}</p>}

        {loading ? (
          <p className="status-text">Chargement...</p>
        ) : (
          <div className="forum-feed">
            {posts.map((post) => (
              <article key={post.id} className="forum-card">
                {(() => {
                  const author = resolveAuthor(post);
                  return (
                    <>
                      <div className="forum-card-header">
                        <div className="avatar-circle">
                          {author.avatarUrl ? (
                            <img src={author.avatarUrl} alt={author.username} />
                          ) : (
                            <span className="avatar-fallback">{getInitial(author.username)}</span>
                          )}
                        </div>
                        <div>
                          <p className="forum-username">{author.username || "Utilisateur"}</p>
                          <p className="forum-meta">{formatTime(post.created_at)}</p>
                        </div>
                      </div>
                      <p className="forum-body">{post.body || post.content}</p>
                    </>
                  );
                })()}
                <div className="forum-actions">
                  <button className="ghost-btn">❤️ {post.likes_count || 0}</button>
                  <button className="ghost-btn" onClick={() => handleToggleComments(post.id)}>
                    💬 {post.comments_count || 0}
                  </button>
                </div>

                {activePostId === post.id && (
                  <div className="comments-section">
                    {(commentsByPost[post.id] || []).map((comment) => (
                      <CommentRow key={comment.id} comment={comment} />
                    ))}

                    {currentUser && (
                      <div className="comment-input">
                        <input
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                          placeholder="Ajouter un commentaire..."
                        />
                        <button className="btn-secondary" onClick={handleAddComment}>
                          Publier
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {composerOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Nouveau post</h3>
            <textarea
              rows={5}
              value={postText}
              onChange={(event) => setPostText(event.target.value)}
              placeholder="Exprimez-vous..."
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setComposerOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleCreatePost}>
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
