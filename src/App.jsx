import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AuthGuard from "./components/AuthGuard.jsx";
import { ROUTES } from "./lib/config.js";

export default function App() {
  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to={ROUTES.LOGIN_PAGE} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
