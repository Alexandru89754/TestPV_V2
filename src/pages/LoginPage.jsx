import { useEffect, useState } from "react";
import { API_ENDPOINTS, ASSETS, ROUTES } from "../lib/config";
import { httpJson } from "../lib/api";
import { clearSession, setParticipantId, setToken, setUserEmail } from "../lib/session";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearSession();
    document.documentElement.style.setProperty("--login-bg", `url("${ASSETS.BG_WELCOME}")`);
  }, []);

  const isLogin = mode === "login";

  const handleSubmit = async () => {
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Email et mot de passe requis.");
      return;
    }

    if (!isLogin) {
      if (!password2) {
        setError("Confirme le mot de passe.");
        return;
      }
      if (password !== password2) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
    }

    try {
      setSubmitting(true);

      if (isLogin) {
        const tok = await httpJson(API_ENDPOINTS.AUTH_LOGIN, {
          method: "POST",
          body: { email: trimmedEmail, password },
        });

        setToken(tok.access_token);
        setUserEmail(trimmedEmail);
        setParticipantId(trimmedEmail);
        navigate(ROUTES.APP_PAGE, { replace: true });
        return;
      }

      await httpJson(API_ENDPOINTS.AUTH_REGISTER, {
        method: "POST",
        body: { email: trimmedEmail, password },
      });

      const tok = await httpJson(API_ENDPOINTS.AUTH_LOGIN, {
        method: "POST",
        body: { email: trimmedEmail, password },
      });

      setToken(tok.access_token);
      setUserEmail(trimmedEmail);
      setParticipantId(trimmedEmail);
      navigate(ROUTES.APP_PAGE, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="login-bg"></div>
      <div className="login-overlay" style={{ pointerEvents: "none" }}></div>

      <div className="login-wrapper">
        <div className="login-card">
          <h1 className="login-title">Patient virtuel</h1>
          <p className="login-subtitle">Crée un compte ou connecte-toi pour continuer</p>

          <div className="login-tabs">
            <button
              className={`tab ${isLogin ? "active" : ""}`}
              id="tab-login"
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Connexion
            </button>
            <button
              className={`tab ${!isLogin ? "active" : ""}`}
              id="tab-register"
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Créer un compte
            </button>
          </div>

          <form
            className="login-form"
            action="javascript:void(0);"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <label>Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <label>Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <div id="confirm-wrap" style={{ display: isLogin ? "none" : "block" }}>
              <label>Confirmer le mot de passe</label>
              <input
                id="password2"
                type="password"
                value={password2}
                onChange={(event) => setPassword2(event.target.value)}
              />
            </div>

            <button
              className="login-btn"
              id="submit"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {isLogin ? "Se connecter" : "Créer un compte"}
            </button>

            <p id="err" style={{ color: "red", textAlign: "center", marginTop: "10px" }}>
              {error}
            </p>
          </form>
        </div>
      </div>
    </>
  );
}