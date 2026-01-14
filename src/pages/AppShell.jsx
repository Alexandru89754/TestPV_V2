import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ASSETS, ROUTES } from "../lib/config";
import { logout } from "../lib/session";

const navItems = [
  { to: "patient-virtuel", label: "Patient virtuel" },
  { to: "forum", label: "Forum" },
  { to: "profile", label: "Mon profil" },
  { to: "friends", label: "Amis" },
];

export default function AppShell() {
  const navigate = useNavigate();

  return (
    <div
      className="app-shell"
      style={{ "--app-shell-bg": `url("${ASSETS.BG_CHAT}")` }}
    >
      <div className="app-shell-overlay" aria-hidden="true"></div>
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="brand-dot"></span>
          <div>
            <p className="brand-title">Patient virtuel</p>
            <p className="brand-subtitle">Communauté</p>
          </div>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `app-nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <h1>Patient virtuel</h1>
          <button
            className="btn-secondary"
            onClick={() => logout({ redirectTo: ROUTES.LOGIN_PAGE, clearAll: true, navigate })}
          >
            Déconnexion
          </button>
        </header>

        <Outlet />
      </div>
    </div>
  );
}