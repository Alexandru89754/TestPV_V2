import { useEffect, useMemo, useState } from "react";
import { DEBUG } from "../lib/config";
import { getToken, getUserEmail } from "../lib/session";
import { getMyProfile, updateMyProfile } from "../lib/client";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export default function ProfilePage() {
  const [profile, setProfile] = useState({ username: "", bio: "", avatarUrl: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [loading, setLoading] = useState(true);

  const previewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return profile.avatarUrl || "";
  }, [avatarFile, profile.avatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [avatarFile, previewUrl]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = getToken();
        const userId = getUserEmail();
        if (!userId) {
          setStatus({ state: "error", message: "Utilisateur introuvable. Veuillez vous reconnecter." });
          return;
        }
        const data = await getMyProfile({ token, userId });
        setProfile({
          username: data?.username || "",
          bio: data?.bio || "",
          avatarUrl: data?.avatar_url || data?.avatarUrl || "",
        });
      } catch (error) {
        setStatus({ state: "error", message: error.message || "Erreur lors du chargement." });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const validateAvatar = (file) => {
    if (!file.type.startsWith("image/")) {
      return "Le fichier doit être une image.";
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return "L’image dépasse 5 Mo.";
    }
    return null;
  };

  const handleFile = (file) => {
    const error = validateAvatar(file);
    if (error) {
      setStatus({ state: "error", message: error });
      return;
    }
    setAvatarFile(file);
    setStatus({ state: "idle", message: "" });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const readAvatarBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        const [, base64 = ""] = result.split(",");
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Erreur lors de la lecture de l’image."));
      reader.readAsDataURL(file);
    });

  const handleSave = async () => {
    if (!USERNAME_REGEX.test(profile.username)) {
      setStatus({
        state: "error",
        message: "Le username doit contenir 3 à 20 caractères (lettres, chiffres, _).",
      });
      return;
    }

    setStatus({ state: "loading", message: "Enregistrement..." });
    try {
      const token = getToken();
      const userId = getUserEmail();
      if (!userId) {
        setStatus({ state: "error", message: "Utilisateur introuvable. Veuillez vous reconnecter." });
        return;
      }
      let avatarUrl = profile.avatarUrl;
      let avatarBase64 = "";

      if (avatarFile) {
        avatarBase64 = await readAvatarBase64(avatarFile);
      }

      const { data: updated, status: responseStatus } = await updateMyProfile({
        token,
        userId,
        profile: {
          user_id: userId,
          username: profile.username,
          bio: profile.bio,
          avatar_url: avatarUrl || undefined,
          avatar_base64: avatarBase64 || undefined,
        },
      });

      if (DEBUG) {
        console.warn("[DEBUG] profile save status", responseStatus);
      }

      setProfile({
        username: updated?.username || profile.username,
        bio: updated?.bio || profile.bio,
        avatarUrl: updated?.avatar_url || updated?.avatarUrl || avatarUrl,
      });
      setAvatarFile(null);
      setStatus({ state: "success", message: "Profil enregistré." });
    } catch (error) {
      console.error("[DEBUG] profile save error", {
        status: error?.status,
        message: error?.message,
      });
      setStatus({ state: "error", message: error.message || "Erreur lors de la sauvegarde." });
    }
  };

  return (
    <section className="app-panel">
      <div className="panel-header">
        <div>
          <h2>Mon profil</h2>
          <p>Mettez à jour votre avatar, username et bio.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={status.state === "loading"}>
          Enregistrer
        </button>
      </div>

      {loading ? (
        <p className="status-text">Chargement du profil...</p>
      ) : (
        <div className="profile-grid">
          <div className="profile-card">
            <div
              className="upload-zone"
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">Aucun avatar</div>
              )}
              <p>Glissez une image ici</p>
              <label className="btn-secondary">
                Parcourir
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleFile(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="profile-form">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={profile.username}
              onChange={(event) => setProfile({ ...profile, username: event.target.value })}
              placeholder="ex: med_student"
            />

            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={4}
              value={profile.bio}
              onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
              placeholder="Parlez de vous..."
            />

            <div className="profile-preview">
              <h3>Aperçu</h3>
              <div className="profile-preview-card">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder small">Aucun avatar</div>
                )}
                <div>
                  <p className="preview-username">{profile.username || "Votre username"}</p>
                  <p className="preview-bio">{profile.bio || "Votre bio apparaîtra ici."}</p>
                </div>
              </div>
            </div>

            {status.message && (
              <p className={`status-text ${status.state}`}>{status.message}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
