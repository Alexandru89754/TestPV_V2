import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEBUG, ROUTES } from "../lib/config";
import { getToken } from "../lib/session";

export default function AuthGuard({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getToken());

  useEffect(() => {
    const nextToken = getToken();
    if (DEBUG) {
      console.log("[DEBUG] token present:", Boolean(nextToken));
    }
    if (!nextToken) {
      navigate(ROUTES.LOGIN_PAGE, { replace: true });
      return;
    }
    setToken(nextToken);
  }, [navigate]);

  if (!token) {
    return null;
  }

  return children;
}
