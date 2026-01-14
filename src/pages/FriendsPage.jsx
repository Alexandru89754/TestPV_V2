import { useState } from "react";
import { getToken } from "../lib/session";
import { searchUserByEmail, sendFriendRequest } from "../lib/client";

export default function FriendsPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const handleSearch = async () => {
    if (!email.trim()) {
      setStatus({ state: "error", message: "Veuillez entrer un email." });
      return;
    }

    setStatus({ state: "loading", message: "Recherche..." });
    try {
      const token = getToken();
      const data = await searchUserByEmail({ token, email: email.trim() });
      const user = Array.isArray(data) ? data[0] : data;
      setResult(user || null);
      setStatus({
        state: "success",
        message: user ? "Utilisateur trouvé." : "Aucun utilisateur trouvé.",
      });
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Erreur de recherche." });
    }
  };

  const handleAdd = async () => {
    if (!result?.id) return;
    setStatus({ state: "loading", message: "Envoi de la demande..." });
    try {
      const token = getToken();
      await sendFriendRequest({ token, userId: result.id });
      setStatus({ state: "success", message: "Demande envoyée." });
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Impossible d’envoyer la demande." });
    }
  };

  return (
    <section className="app-panel">
      <div className="panel-header">
        <div>
          <h2>Amis</h2>
          <p>Recherchez des utilisateurs par email.</p>
        </div>
      </div>

      <div className="friends-search">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@exemple.com"
        />
        <button className="btn-primary" onClick={handleSearch}>
          Rechercher
        </button>
      </div>

      {status.message && <p className={`status-text ${status.state}`}>{status.message}</p>}

      {result && (
        <div className="friend-card">
          <div className="friend-avatar">
            {result.avatarUrl ? <img src={result.avatarUrl} alt={result.username} /> : null}
          </div>
          <div className="friend-info">
            <p className="friend-name">{result.username || "Utilisateur"}</p>
            <p className="friend-email">{result.email}</p>
          </div>
          <button className="btn-secondary" onClick={handleAdd}>
            Ajouter
          </button>
        </div>
      )}
    </section>
  );
}
