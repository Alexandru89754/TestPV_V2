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
  CHAT_ANXIETY_PREFIX: "pv_chat_anxiety_",
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
  PROFILE_AVATAR_UPLOAD: apiUrl("/api/profile/me/avatar"),
  PROFILE: apiUrl("/api/profile"),
  PROFILE_BY_ID_PREFIX: apiUrl("/api/profile/"),

  FRIENDS_LIST: apiUrl("/friends"),
  FRIEND_INCOMING: apiUrl("/friends/requests/incoming"),
  FRIEND_OUTGOING: apiUrl("/friends/requests/outgoing"),
  FRIEND_REQUEST_PREFIX: apiUrl("/friends/request/"),
  FRIEND_ACCEPT_PREFIX: apiUrl("/friends/accept/"),
  FRIEND_DECLINE_PREFIX: apiUrl("/friends/decline/"),
  USER_SEARCH: apiUrl("/api/users/search"),

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

const applyFirebaseConfig = (values = {}) => {
  const source = values.firebase || values.FIREBASE || values;

  const mapping = {
    API_KEY:
      source.apiKey ||
      source.api_key ||
      source.firebase_api_key ||
      source.FIREBASE_API_KEY ||
      source.API_KEY,
    AUTH_DOMAIN:
      source.authDomain ||
      source.auth_domain ||
      source.firebase_auth_domain ||
      source.FIREBASE_AUTH_DOMAIN ||
      source.AUTH_DOMAIN,
    PROJECT_ID:
      source.projectId ||
      source.project_id ||
      source.firebase_project_id ||
      source.FIREBASE_PROJECT_ID ||
      source.PROJECT_ID,
    STORAGE_BUCKET:
      source.storageBucket ||
      source.storage_bucket ||
      source.firebase_storage_bucket ||
      source.FIREBASE_STORAGE_BUCKET ||
      source.STORAGE_BUCKET,
    MESSAGING_SENDER_ID:
      source.messagingSenderId ||
      source.messaging_sender_id ||
      source.firebase_messaging_sender_id ||
      source.FIREBASE_MESSAGING_SENDER_ID ||
      source.MESSAGING_SENDER_ID,
    APP_ID:
      source.appId ||
      source.app_id ||
      source.firebase_app_id ||
      source.FIREBASE_APP_ID ||
      source.APP_ID,
    MEASUREMENT_ID:
      source.measurementId ||
      source.measurement_id ||
      source.firebase_measurement_id ||
      source.FIREBASE_MEASUREMENT_ID ||
      source.MEASUREMENT_ID,
  };

  Object.entries(mapping).forEach(([key, value]) => {
    if (!FIREBASE[key] && value) {
      FIREBASE[key] = value;
    }
  });
};

const resolveFirebaseValue = (key) => {
  if (typeof window !== "undefined" && window.CONFIG) {
    const direct = window.CONFIG[`FIREBASE_${key}`];
    if (direct) return direct;
    if (window.CONFIG.FIREBASE && window.CONFIG.FIREBASE[key]) {
      return window.CONFIG.FIREBASE[key];
    }
  }
  return import.meta.env[`VITE_FIREBASE_${key}`] || "";
};

export const FIREBASE = {
  API_KEY: resolveFirebaseValue("API_KEY"),
  AUTH_DOMAIN: resolveFirebaseValue("AUTH_DOMAIN"),
  PROJECT_ID: resolveFirebaseValue("PROJECT_ID"),
  STORAGE_BUCKET: resolveFirebaseValue("STORAGE_BUCKET"),
  MESSAGING_SENDER_ID: resolveFirebaseValue("MESSAGING_SENDER_ID"),
  APP_ID: resolveFirebaseValue("APP_ID"),
  MEASUREMENT_ID: resolveFirebaseValue("MEASUREMENT_ID"),
};

const isFirebaseConfigured = () =>
  Boolean(
    FIREBASE.API_KEY &&
      FIREBASE.AUTH_DOMAIN &&
      FIREBASE.PROJECT_ID &&
      FIREBASE.STORAGE_BUCKET &&
      FIREBASE.MESSAGING_SENDER_ID &&
      FIREBASE.APP_ID
  );

export const loadFirebaseConfig = async () => {
  if (isFirebaseConfigured()) {
    return FIREBASE;
  }

  const shouldFetch =
    typeof window !== "undefined" && Boolean(window.CONFIG && window.CONFIG.FETCH_FIREBASE_CONFIG);

  if (!shouldFetch) {
    return FIREBASE;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/config/firebase`);
    if (!response.ok) {
      return FIREBASE;
    }
    const data = await response.json();
    applyFirebaseConfig(data);
  } catch (error) {
    return FIREBASE;
  }

  if (typeof window !== "undefined") {
    window.CONFIG ??= {};
    window.CONFIG.FIREBASE ??= {};
    window.CONFIG.FIREBASE.API_KEY ??= FIREBASE.API_KEY;
    window.CONFIG.FIREBASE.AUTH_DOMAIN ??= FIREBASE.AUTH_DOMAIN;
    window.CONFIG.FIREBASE.PROJECT_ID ??= FIREBASE.PROJECT_ID;
    window.CONFIG.FIREBASE.STORAGE_BUCKET ??= FIREBASE.STORAGE_BUCKET;
    window.CONFIG.FIREBASE.MESSAGING_SENDER_ID ??= FIREBASE.MESSAGING_SENDER_ID;
    window.CONFIG.FIREBASE.APP_ID ??= FIREBASE.APP_ID;
    window.CONFIG.FIREBASE.MEASUREMENT_ID ??= FIREBASE.MEASUREMENT_ID;
  }

  return FIREBASE;
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
  window.CONFIG.FIREBASE_API_KEY ??= FIREBASE.API_KEY;
  window.CONFIG.FIREBASE_AUTH_DOMAIN ??= FIREBASE.AUTH_DOMAIN;
  window.CONFIG.FIREBASE_PROJECT_ID ??= FIREBASE.PROJECT_ID;
  window.CONFIG.FIREBASE_STORAGE_BUCKET ??= FIREBASE.STORAGE_BUCKET;
  window.CONFIG.FIREBASE_MESSAGING_SENDER_ID ??= FIREBASE.MESSAGING_SENDER_ID;
  window.CONFIG.FIREBASE_APP_ID ??= FIREBASE.APP_ID;
  window.CONFIG.FIREBASE_MEASUREMENT_ID ??= FIREBASE.MEASUREMENT_ID;
  window.CONFIG.FIREBASE ??= {
    API_KEY: FIREBASE.API_KEY,
    AUTH_DOMAIN: FIREBASE.AUTH_DOMAIN,
    PROJECT_ID: FIREBASE.PROJECT_ID,
    STORAGE_BUCKET: FIREBASE.STORAGE_BUCKET,
    MESSAGING_SENDER_ID: FIREBASE.MESSAGING_SENDER_ID,
    APP_ID: FIREBASE.APP_ID,
    MEASUREMENT_ID: FIREBASE.MEASUREMENT_ID,
  };
}
