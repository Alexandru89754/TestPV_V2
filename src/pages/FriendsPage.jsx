import { useEffect, useState } from "react";
import { getToken } from "../lib/session";
import { searchUsers, sendFriendRequest } from "../lib/client";

const resolveUser = (user) => ({
  id: user?.id,
  username: user?.author_username || user?.username || user?.name || "Utilisateur",
  email: user?.email || "",
  avatarUrl:
    user?.author_avatar_url ||
    user?.avatar_url ||
    user?.avatarUrl ||
    user?.profile?.avatar_url ||
    user?.profile?.avatarUrl ||
    "",
});

const getInitial = (name) => {
  if (!name) return "?";
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
};

export default function FriendsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setStatus({ state: "idle", message: "" });
      return undefined;
    }

    setStatus({ state: "loading", message: "Recherche..." });
    const timer = setTimeout(async () => {
      try {
        const token = getToken();
        if (!token) {
          setStatus({ state: "error", message: "Session expirée. Veuillez vous reconnecter." });
          setResults([]);
          return;
        }
        const data = await searchUsers({ token, query: trimmed });
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : data
          ? [data]
          : [];
        setResults(list.map(resolveUser));
        setStatus({
          state: "success",
          message: list.length
            ? `${list.length} utilisateur${list.length > 1 ? "s" : ""} trouvé${
                list.length > 1 ? "s" : ""
              }.`
            : "Aucun utilisateur trouvé.",
        });
      } catch (error) {
        setStatus({ state: "error", message: error.message || "Erreur de recherche." });
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (userId) => {
    if (!userId) return;
    setSendingId(userId);
    setStatus({ state: "loading", message: "Envoi de la demande..." });
    try {
      const token = getToken();
      if (!token) {
        setStatus({ state: "error", message: "Session expirée. Veuillez vous reconnecter." });
        return;
      }
      await sendFriendRequest({ token, userId });
      setStatus({ state: "success", message: "Demande envoyée." });
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Impossible d’envoyer la demande." });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <section className="app-panel">
      <div className="panel-header">
        <div>
          <h2>Amis</h2>
          <p>Recherchez des utilisateurs par username ou email.</p>
        </div>
      </div>

      <div className="friends-search">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="username ou email"
        />
      </div>

      {status.message && <p className={`status-text ${status.state}`}>{status.message}</p>}

      {results.length > 0 && (
        <div className="friends-results">
          {results.map((result) => (
            <div key={result.id || result.email} className="friend-card">
              <div className="friend-avatar">
                {result.avatarUrl ? (
                  <img src={result.avatarUrl} alt={result.username} />
                ) : (
                  <span className="avatar-fallback">{getInitial(result.username)}</span>
                )}
              </div>
              <div className="friend-info">
                <p className="friend-name">{result.username || "Utilisateur"}</p>
                {result.email && <p className="friend-email">{result.email}</p>}
              </div>
              <button
                className="btn-secondary"
                onClick={() => handleAdd(result.id)}
                disabled={sendingId === result.id}
              >
                {sendingId === result.id ? "Envoi..." : "Ajouter"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
