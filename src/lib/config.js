import bgWelcome from "../assets/image_out.png";
import bgChat from "../assets/image_in.png";

export const API_BASE_URL = "https://patient-virtuel-platform-backend.onrender.com";
export const DEBUG = true;

const apiUrl = (path) => `${API_BASE_URL}${path}`;

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
  CHAT_END: apiUrl("/chat/end"),
  UPLOAD: apiUrl("/upload-video"),

  PROFILE_ME: apiUrl("/profiles/me"),
  PROFILE_UPDATE: apiUrl("/profiles/me"),
  PROFILE_AVATAR_UPLOAD: apiUrl("/profiles/me/avatar"),

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

export const SUPABASE = {
  URL: import.meta.env.VITE_SUPABASE_URL || "",
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

if (typeof window !== "undefined") {
  window.ASSETS ??= ASSETS;
}
