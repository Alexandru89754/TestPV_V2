import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import AppPage from "./pages/AppPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AuthGuard from "./components/AuthGuard.jsx";
import { ROUTES } from "./lib/config.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN_PAGE} element={<LoginPage />} />
        <Route
          path={ROUTES.APP_PAGE}
          element={
            <AuthGuard>
              <AppPage />
            </AuthGuard>
          }
        />
        <Route path={ROUTES.CHAT_PAGE} element={<ChatPage />} />
        <Route path={ROUTES.HOME_PAGE} element={<HomePage />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN_PAGE} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
