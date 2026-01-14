import bgWelcome from "../assets/image_out.png";
import bgChat from "../assets/image_in.png";

const FALLBACK_BACKEND_URL = "https://patient-virtuel-platform-backend.onrender.com";
export const DEBUG = true;

const resolveBackendUrl = () => {
  if (typeof window !== "undefined" && window.CONFIG && window.CONFIG.BACKEND_URL) {
    return window.CONFIG.BACKEND_URL;
  }
  return import.meta.env.VITE_BACKEND_URL || FALLBACK_BACKEND_URL;
};

export const BACKEND_URL = resolveBackendUrl();
export const API_BASE_URL = BACKEND_URL;

const apiUrl = (path) => `${BACKEND_URL}${path}`;

export const ROUTES = {
  LOGIN_PAGE: "/login",
  HOME_PAGE: "/home",
  APP_PAGE: "/app",
  CHAT_PAGE: "/chat",
};

export const STORAGE_KEYS = {
  TOKEN: "pv_access_token",
  USER_EMAIL: "pv_user_email",
  PARTICIPANT_ID: "pv_participant_id",
  ACTIVE_TAB: "pv_active_tab",
  CHAT_HISTORY_PREFIX_APP: "pv_chat_",
  CHAT_HISTORY_PREFIX_LEGACY: "pv_chat_history_",
  CHAT_SESSION_PREFIX: "pv_chat_session_",
};

export const API_ENDPOINTS = {
  AUTH_REGISTER: apiUrl("/auth/register"),
  AUTH_LOGIN: apiUrl("/auth/login"),
  AUTH_ME: apiUrl("/auth/me"),
  AUTH_LOGOUT: apiUrl("/auth/logout"),

  CHAT: apiUrl("/chat"),
  CHAT_END: apiUrl("/api/chat/end"),
  UPLOAD: apiUrl("/upload-video"),

  PROFILE_ME: apiUrl("/profiles/me"),
  PROFILE_UPDATE: apiUrl("/profiles/me"),
  PROFILE_AVATAR_UPLOAD: apiUrl("/profiles/me/avatar"),
  PROFILE: apiUrl("/api/profile"),
  PROFILE_BY_ID_PREFIX: apiUrl("/api/profile/"),

  FRIENDS_LIST: apiUrl("/friends"),
  FRIEND_INCOMING: apiUrl("/friends/requests/incoming"),
  FRIEND_OUTGOING: apiUrl("/friends/requests/outgoing"),
  FRIEND_REQUEST_PREFIX: apiUrl("/friends/request/"),
  FRIEND_ACCEPT_PREFIX: apiUrl("/friends/accept/"),
  FRIEND_DECLINE_PREFIX: apiUrl("/friends/decline/"),

  FORUM_POSTS_WITH_COUNTS: apiUrl("/forum/posts_with_counts"),
  FORUM_POSTS: apiUrl("/forum/posts"),
  FORUM_COMMENTS_PREFIX: apiUrl("/forum/posts/"),
};

export const ASSETS = {
  BG_WELCOME: bgWelcome,
  BG_CHAT: bgChat,
};

const resolveSupabaseValue = (key) => {
  if (typeof window !== "undefined" && window.CONFIG) {
    const direct = window.CONFIG[key];
    if (direct) return direct;
    if (window.CONFIG.SUPABASE && window.CONFIG.SUPABASE[key]) {
      return window.CONFIG.SUPABASE[key];
    }
  }
  return import.meta.env[`VITE_${key}`] || "";
};

export const SUPABASE = {
  URL: resolveSupabaseValue("SUPABASE_URL"),
  ANON_KEY: resolveSupabaseValue("SUPABASE_ANON_KEY"),
};

if (typeof window !== "undefined") {
  window.ASSETS ??= ASSETS;
  window.CONFIG ??= {};
  window.CONFIG.BACKEND_URL ??= BACKEND_URL;
  window.CONFIG.SUPABASE_URL ??= SUPABASE.URL;
  window.CONFIG.SUPABASE_ANON_KEY ??= SUPABASE.ANON_KEY;
  window.CONFIG.SUPABASE ??= {
    URL: SUPABASE.URL,
    ANON_KEY: SUPABASE.ANON_KEY,
  };
}
