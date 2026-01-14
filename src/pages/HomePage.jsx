import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ASSETS, ROUTES } from "../lib/config";

const LEARN_SECTIONS = [
  { id: "clinical-cases", label: "Clinical Cases" },
  { id: "study", label: "Study" },
  { id: "qbank", label: "Qbank" },
  { id: "file-manager", label: "File Manager" },
  { id: "interview-lab", label: "Interview Lab" },
];

const CONNECT_SECTIONS = [
  { id: "network", label: "Network" },
  { id: "messages", label: "Message" },
  { id: "feed", label: "Feed" },
  { id: "events", label: "Events" },
];

const CONTENT = {
  "clinical-cases": {
    title: "Clinical Cases",
    description:
      "Lancez des scénarios interactifs et entraînez-vous à la prise de décision clinique.",
  },
  study: {
    title: "Study",
    description: "Accédez à vos parcours d’étude et reprenez votre progression.",
  },
  qbank: {
    title: "Qbank",
    description: "Révisez avec des banques de questions personnalisées.",
  },
  "file-manager": {
    title: "File Manager",
    description: "Centralisez vos notes et documents de cours.",
  },
  "interview-lab": {
    title: "Interview Lab",
    description: "Entraînez-vous aux entretiens cliniques avec feedback guidé.",
  },
  network: {
    title: "Network",
    description: "Retrouvez vos collègues et suivez leurs activités.",
  },
  messages: {
    title: "Message",
    description: "Discutez avec votre réseau et gérez vos conversations.",
  },
  feed: {
    title: "Feed",
    description: "Découvrez les nouveautés et annonces de la communauté.",
  },
  events: {
    title: "Events",
    description: "Inscrivez-vous aux prochains événements et webinaires.",
  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = section || "clinical-cases";
  const activeContent = useMemo(
    () => CONTENT[activeSection] || CONTENT["clinical-cases"],
    [activeSection]
  );

  useEffect(() => {
    if (!section) {
      navigate(`${ROUTES.HOME_PAGE}/clinical-cases`, { replace: true });
    }
  }, [navigate, section]);

  useEffect(() => {
    document.documentElement.style.setProperty("--dashboard-bg", `url("${ASSETS.BG_WELCOME}")`);
  }, []);

  const handleSelect = (nextSection) => {
    if (nextSection === activeSection) return;
    navigate(`${ROUTES.HOME_PAGE}/${nextSection}`);
  };

  const handleLaunchClinicalCases = () => {
    handleSelect("clinical-cases");
  };

  const handleLaunchChat = () => {
    navigate(ROUTES.CHAT_PAGE);
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="brand-dot"></span>
          <div>
            <p className="brand-title">Patient virtuel</p>
            <p className="brand-subtitle">Dashboard</p>
          </div>
        </div>

        <div className="sidebar-group">
          <p className="sidebar-heading">Learn</p>
          <div className="sidebar-links">
            {LEARN_SECTIONS.map((item) => (
              <button
                key={item.id}
                className={`sidebar-link ${activeSection === item.id ? "active" : ""}`}
                onClick={() => handleSelect(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-group">
          <p className="sidebar-heading">Connect</p>
          <div className="sidebar-links">
            {CONNECT_SECTIONS.map((item) => (
              <button
                key={item.id}
                className={`sidebar-link ${activeSection === item.id ? "active" : ""}`}
                onClick={() => handleSelect(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>{activeContent.title}</h1>
            <p className="dashboard-subtitle">{activeContent.description}</p>
          </div>
          <div className="dashboard-actions">
            <button className="btn-primary" onClick={handleLaunchClinicalCases}>
              Lancer le patient virtuel
            </button>
            <button className="btn-secondary" onClick={handleLaunchChat}>
              Ouvrir le chat classique
            </button>
          </div>
        </header>

        <section className="dashboard-card">
          <h2>{activeContent.title}</h2>
          <p>{activeContent.description}</p>
          <div className="dashboard-card-grid">
            <div>
              <h3>Prochaine étape</h3>
              <p>
                Choisissez un module dans la barre latérale ou démarrez directement les
                Clinical Cases.
              </p>
            </div>
            <div>
              <h3>Conseil</h3>
              <p>
                Revenez régulièrement pour suivre vos progrès et débloquer de nouvelles
                activités.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
