import { useEffect, useMemo, useRef, useState } from "react";
import { API_ENDPOINTS, ROUTES } from "../lib/config";
import { httpJson } from "../lib/api";
import { clearSession, setParticipantId, setToken, setUserEmail } from "../lib/session";
import { useNavigate } from "react-router-dom";
import heroBg from "../assets/frontend/assets/img/gpht-hero-bg.svg";
import heroIllustration from "../assets/frontend/assets/img/gpht-patient-illustration.svg";
import logo from "../assets/img/gpht-logo.svg";
import navWhy from "../assets/frontend/assets/svg/nav-why.svg";
import navFeatures from "../assets/frontend/assets/svg/nav-features.svg";
import navResources from "../assets/frontend/assets/svg/svg/nav-resources.svg";
import navContact from "../assets/frontend/assets/svg/nav-contact.svg";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeNav, setActiveNav] = useState("why");
  const authRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    clearSession();
    document.body.classList.add("bg-auth");
    document.body.classList.remove("bg-app");
    return () => {
      document.body.classList.remove("bg-auth");
    };
  }, []);

  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;
    const handleScroll = () => {
      navEl.classList.toggle("scrolled", window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = useMemo(
    () => [
      { id: "why", label: "Pourquoi GPhT", icon: navWhy },
      { id: "features", label: "Fonctionnalités", icon: navFeatures },
      { id: "resources", label: "Ressources", icon: navResources },
      { id: "contact", label: "Contact", icon: navContact },
    ],
    []
  );

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const normalized = hash.split("/").pop();
    if (normalized && navItems.some((item) => item.id === normalized)) {
      setActiveNav(normalized);
      requestAnimationFrame(() => {
        document.getElementById(normalized)?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [navItems]);

  const handleNavClick = (id) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCta = (nextMode) => {
    setMode(nextMode);
    setError("");
    requestAnimationFrame(() => {
      authRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const isLogin = mode === "login";

  const handleSubmit = async (event) => {
    event?.preventDefault();
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

      <div className="landing-page">
        <header className="landing-nav" ref={navRef}>
          <div className="landing-brand">
            <img src={logo} alt="Logo GPhT" />
          </div>
          <nav className="landing-nav-links" aria-label="Navigation principale">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`landing-nav-link ${activeNav === item.id ? "active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span
                  className="nav-icon"
                  style={{ "--icon": `url(${item.icon})` }}
                  aria-hidden="true"
                ></span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="landing-nav-cta">
            <button type="button" className="pill-btn ghost" onClick={() => handleCta("login")}>
              Login
            </button>
            <button type="button" className="pill-btn primary" onClick={() => handleCta("register")}>
              Créer un compte
            </button>
          </div>
        </header>

        <main className="landing-main">
          <section className="landing-hero" style={{ "--hero-bg": `url(${heroBg})` }}>
            <div className="hero-content">
              <p className="hero-eyebrow">GPhT · Patient virtuel nouvelle génération</p>
              <h1>Formez-vous avec un patient virtuel clinique, fluide et ultra réaliste.</h1>
              <p className="hero-text">
                Simulez des cas cliniques complets, gagnez en confiance et progressez avec un
                accompagnement pédagogique moderne.
              </p>
              <ul className="hero-list">
                <li>
                  <span className="check-pill"></span>
                  Parcours adaptatifs pour chaque niveau.
                </li>
                <li>
                  <span className="check-pill"></span>
                  Feedback instantané et recommandations ciblées.
                </li>
                <li>
                  <span className="check-pill"></span>
                  Suivi intelligent de vos progrès cliniques.
                </li>
              </ul>
              <div className="hero-actions">
                <button type="button" className="pill-btn primary" onClick={() => handleCta("register")}>
                  Créer un compte
                </button>
                <button type="button" className="pill-btn ghost" onClick={() => handleCta("login")}>
                  Login
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <img src={heroIllustration} alt="Illustration patient virtuel GPhT" />
            </div>
          </section>

          <section className="landing-section" id="why">
            <div className="section-card">
              <h2>Pourquoi GPhT</h2>
              <p>
                Une plateforme health-tech qui combine pédagogie clinique, IA conversationnelle et
                design clair pour des apprentissages plus rapides.
              </p>
            </div>
            <div className="section-card">
              <h3>Approche clinique réaliste</h3>
              <p>Des scénarios structurés pour entraîner votre raisonnement médical.</p>
            </div>
            <div className="section-card">
              <h3>Compagnon de progression</h3>
              <p>Votre progression est suivie et valorisée à chaque session.</p>
            </div>
          </section>

          <section className="landing-section" id="features">
            <div className="section-card wide">
              <h2>Fonctionnalités</h2>
              <p>
                Explorez des cas interactifs, des ressources ciblées et une interface claire pensée
                pour les étudiants en santé.
              </p>
              <div className="feature-grid">
                <div>
                  <h4>Cas interactifs</h4>
                  <p>Décisions cliniques guidées et progression pas à pas.</p>
                </div>
                <div>
                  <h4>Bibliothèque ciblée</h4>
                  <p>Accès rapide aux ressources essentielles pour chaque cas.</p>
                </div>
                <div>
                  <h4>Communauté</h4>
                  <p>Échanges et retours d’expérience entre pairs.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-section" id="resources">
            <div className="section-card">
              <h2>Ressources</h2>
              <p>Des guides, checklists et contenus pour approfondir vos pratiques.</p>
            </div>
            <div className="section-card">
              <h3>Guides de simulation</h3>
              <p>Des formats courts pour préparer vos sessions.</p>
            </div>
            <div className="section-card">
              <h3>Rappels clés</h3>
              <p>Les notions essentielles à garder sous la main.</p>
            </div>
          </section>

          <section className="landing-section" id="contact">
            <div className="section-card wide">
              <h2>Contact</h2>
              <p>
                Une question ? Notre équipe vous répond rapidement pour vous aider à démarrer avec
                GPhT.
              </p>
              <button type="button" className="pill-btn ghost" onClick={() => handleCta("login")}>
                Parler à l’équipe
              </button>
            </div>
          </section>

          <section className="landing-auth" ref={authRef}>
            <div className="login-card">
              <h1 className="login-title">GPhT</h1>
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

              <form className="login-form" onSubmit={handleSubmit}>
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

                <button className="login-btn" id="submit" type="submit" disabled={submitting}>
                  {isLogin ? "Se connecter" : "Créer un compte"}
                </button>

                <p id="err" style={{ color: "red", textAlign: "center", marginTop: "10px" }}>
                  {error}
                </p>
              </form>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
