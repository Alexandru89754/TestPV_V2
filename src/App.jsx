import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AppPage from "./pages/AppPage.jsx";
import AppShell from "./pages/AppShell.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import ForumPage from "./pages/ForumPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import AuthGuard from "./components/AuthGuard.jsx";
import { DEBUG, ROUTES } from "./lib/config.js";

function DebugRouteLogger() {
  const location = useLocation();

  if (DEBUG) {
    console.log("[DEBUG] route:", `${location.pathname}${location.search}${location.hash}`);
  }

  return null;
}

export default function App() {
  return (
    <HashRouter>
      <DebugRouteLogger />
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.LOGIN_PAGE} replace />} />
        <Route path={ROUTES.LOGIN_PAGE} element={<LoginPage />} />
        <Route
          path={ROUTES.HOME_PAGE}
          element={
            <AuthGuard>
              <HomePage />
            </AuthGuard>
          }
        />
        <Route
          path={`${ROUTES.HOME_PAGE}/:section`}
          element={
            <AuthGuard>
              <HomePage />
            </AuthGuard>
          }
        />
        <Route
          path={ROUTES.APP_PAGE}
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="forum" replace />} />
          <Route path="patient" element={<AppPage />} />
          <Route path="forum" element={<ForumPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="legacy" element={<AppPage />} />
        </Route>
        <Route
          path={ROUTES.CHAT_PAGE}
          element={
            <AuthGuard>
              <ChatPage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN_PAGE} replace />} />
      </Routes>
    </HashRouter>
  );
}
