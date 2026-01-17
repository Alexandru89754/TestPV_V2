import { useEffect, useMemo, useState } from "react";
import { DEBUG } from "../lib/config";
import { getToken } from "../lib/session";
import {
  getMyProfile,
  updateMyProfile,
  updateMyProfileMultipart,
  uploadAvatar,
} from "../lib/client";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export default function ProfilePage() {
  const [profile, setProfile] = useState({ username: "", bio: "", avatarUrl: "" });
  const [draft, setDraft] = useState({ username: "", bio: "", avatarUrl: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const previewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return draft.avatarUrl || "";
  }, [avatarFile, draft.avatarUrl]);

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
        if (!token) {
          setStatus({ state: "error", message: "Session expirée. Veuillez vous reconnecter." });
          return;
        }
        const data = await getMyProfile({ token });
        const nextProfile = {
          username: data?.username || "",
          bio: data?.bio || "",
          avatarUrl: data?.avatar_url || data?.avatarUrl || "",
        };
        setProfile(nextProfile);
        setDraft(nextProfile);
      } catch (error) {
        setStatus({ state: "error", message: error.message || "Erreur lors du chargement." });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const validateAvatar = (file) => {
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      return "Le fichier doit être un PNG ou un JPG.";
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

  const startEditing = () => {
    setDraft(profile);
    setAvatarFile(null);
    setIsEditing(true);
    setStatus({ state: "idle", message: "" });
  };

  const cancelEditing = () => {
    setDraft(profile);
    setAvatarFile(null);
    setIsEditing(false);
    setStatus({ state: "idle", message: "" });
  };

  const handleSave = async () => {
    if (!USERNAME_REGEX.test(draft.username)) {
      setStatus({
        state: "error",
        message: "Le username doit contenir 3 à 20 caractères (lettres, chiffres, _).",
      });
      return;
    }

    setStatus({ state: "loading", message: "Enregistrement..." });
    try {
      const token = getToken();
      if (!token) {
        setStatus({ state: "error", message: "Session expirée. Veuillez vous reconnecter." });
        return;
      }
      let avatarUrl = draft.avatarUrl;
      let updated = null;
      let responseStatus = 200;

      if (avatarFile) {
        try {
          const upload = await uploadAvatar({ token, file: avatarFile });
          avatarUrl = upload?.avatar_url || upload?.avatarUrl || avatarUrl;
        } catch (error) {
          if ([404, 405, 415].includes(error?.status)) {
            const multipartResponse = await updateMyProfileMultipart({
              token,
              profile: { username: draft.username, bio: draft.bio },
              avatarFile,
            });
            updated = multipartResponse?.data;
            responseStatus = multipartResponse?.status || 200;
          } else {
            throw error;
          }
        }
      }

      if (!updated) {
        const response = await updateMyProfile({
          token,
          profile: {
            username: draft.username,
            bio: draft.bio,
            avatar_url: avatarUrl || undefined,
          },
        });
        updated = response?.data;
        responseStatus = response?.status || 200;
      }

      if (DEBUG) {
        console.warn("[DEBUG] profile save status", responseStatus);
      }

      const nextProfile = {
        username: updated?.username || draft.username,
        bio: updated?.bio || draft.bio,
        avatarUrl: updated?.avatar_url || updated?.avatarUrl || avatarUrl,
      };
      setProfile(nextProfile);
      setDraft(nextProfile);
      setAvatarFile(null);
      setIsEditing(false);
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
          <h2>{isEditing ? "Modifier le profil" : "Mon profil"}</h2>
          <p>
            {isEditing
              ? "Mettez à jour votre avatar, username et bio."
              : "Consultez les informations de votre profil."}
          </p>
        </div>
        {isEditing && (
          <div className="profile-actions">
            <button
              className="btn-secondary"
              onClick={cancelEditing}
              disabled={status.state === "loading"}
            >
              Annuler
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={status.state === "loading"}>
              Enregistrer
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="status-text">Chargement du profil...</p>
      ) : isEditing ? (
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
                  accept="image/png,image/jpeg"
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
              value={draft.username}
              onChange={(event) => setDraft({ ...draft, username: event.target.value })}
              placeholder="ex: med_student"
            />

            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={4}
              value={draft.bio}
              onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
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
                  <p className="preview-username">{draft.username || "Votre username"}</p>
                  <p className="preview-bio">{draft.bio || "Votre bio apparaîtra ici."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="profile-grid">
          <div className="profile-card">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="avatar-preview" />
            ) : (
              <div className="avatar-placeholder">Aucun avatar</div>
            )}
          </div>
          <div className="profile-summary">
            <h3>{profile.username || "Username non défini"}</h3>
            <p>{profile.bio || "Bio non renseignée."}</p>
            <button className="btn-primary" onClick={startEditing}>
              Modifier
            </button>
          </div>
        </div>
      )}
      {status.message && <p className={`status-text ${status.state}`}>{status.message}</p>}
    </section>
  );
}
