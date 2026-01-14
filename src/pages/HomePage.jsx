import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState("home");
  const [activeNav, setActiveNav] = useState(null);

  useEffect(() => {
    const nextSection = section || "home";
    setActiveSection(nextSection);
    setActiveNav(section || null);
  }, [section]);

  const handleSelect = (section) => {
    setActiveSection(section);
    setActiveNav(section);
    navigate(`/home/${section}`);
  };

  return (
    <>
      <div className="auth-bg"></div>
      <div className="auth-overlay"></div>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Patient virtuel</h2>
          </div>

          <nav className="sidebar-nav">
            {[
              { id: "home", label: "Accueil" },
              { id: "profile", label: "Mon profil" },
              { id: "friends", label: "Mes amis" },
              { id: "forum", label: "Discussion" },
              { id: "updates", label: "Mise à jour recherche" },
            ].map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeNav === item.id ? "active" : ""}`}
                data-section={item.id}
                onClick={() => handleSelect(item.id)}
              >
                {item.label}
              </button>
            ))}

            <div className="nav-divider"></div>

            <button
              className={`nav-item beta ${activeNav === "ai" ? "active" : ""}`}
              data-section="ai"
              onClick={() => handleSelect("ai")}
            >
              Outil AI <span className="beta-pill">BETA</span>
            </button>
          </nav>
        </aside>

        <main className="content">
          <section
            className={`content-section ${activeSection === "home" ? "active" : ""}`}
            id="section-home"
          >
            <h1>Bienvenue</h1>
            <p className="content-text">
              Sélectionnez une option dans le menu à gauche pour commencer.
            </p>
          </section>

          <section
            className={`content-section ${activeSection === "profile" ? "active" : ""}`}
            id="section-profile"
          >
            <h1>Mon profil</h1>
            <p className="content-text">
              Modification de l’avatar et de la biographie (à venir).
            </p>
          </section>

          <section
            className={`content-section ${activeSection === "friends" ? "active" : ""}`}
            id="section-friends"
          >
            <h1>Mes amis</h1>
            <p className="content-text">
              Rechercher des amis, gérer les demandes et discuter de cas cliniques.
            </p>
          </section>

          <section
            className={`content-section ${activeSection === "forum" ? "active" : ""}`}
            id="section-forum"
          >
            <h1>Discussion</h1>
            <p className="content-text">Forum général pour échanger entre étudiants.</p>
          </section>

          <section
            className={`content-section ${activeSection === "updates" ? "active" : ""}`}
            id="section-updates"
          >
            <h1>Mise à jour recherche</h1>
            <pre className="code-block">
              Votre participation est importante ! Nous vous tiendrons au courant des résultats au fur et à mesure
            </pre>
          </section>

          <section
            className={`content-section ${activeSection === "ai" ? "active" : ""}`}
            id="section-ai"
          >
            <h1>Outil AI – Patient virtuel</h1>
            <p className="content-text">Le chatbot est accessible ici.</p>

            <button className="btn-primary">Lancer le patient virtuel</button>
          </section>
        </main>
      </div>
    </>
  );
}
