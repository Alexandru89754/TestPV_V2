import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ASSETS, ROUTES } from "../lib/config";
import { logout } from "../lib/session";

const navItems = [
  { to: `${ROUTES.APP_PAGE}/patient-virtuel`, label: "Patient virtuel" },
  { to: `${ROUTES.APP_PAGE}/forum`, label: "Forum" },
  { to: `${ROUTES.APP_PAGE}/profile`, label: "Mon profil" },
  { to: `${ROUTES.APP_PAGE}/friends`, label: "Amis" },
];

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add("bg-app");
    document.body.classList.remove("bg-auth");
    document.documentElement.style.setProperty("--app-bg", `url("${ASSETS.BG_CHAT}")`);
    return () => {
      document.body.classList.remove("bg-app");
    };
  }, []);

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
              onClick={(event) => {
                if (location.pathname === item.to) {
                  event.preventDefault();
                }
              }}
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
