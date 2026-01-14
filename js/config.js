(function () {
  const API_BASE_URL = "https://patient-virtuel-platform-backend.onrender.com";

  const apiUrl = (path) => `${API_BASE_URL}${path}`;

  window.CONFIG = {
    API_BASE_URL,

    ROUTES: {
      LOGIN_PAGE: "index.html",
      APP_PAGE: "app.html",
      CHAT_PAGE: "chat.html",
      HOME_PAGE: "home.html",
    },

    STORAGE_KEYS: {
      TOKEN: "pv_access_token",
      USER_EMAIL: "pv_user_email",
      PARTICIPANT_ID: "pv_participant_id",
      ACTIVE_TAB: "pv_active_tab",
      CHAT_HISTORY_PREFIX_APP: "pv_chat_",
      CHAT_HISTORY_PREFIX_LEGACY: "pv_chat_history_",
    },

    API_ENDPOINTS: {
      AUTH_REGISTER: apiUrl("/auth/register"),
      AUTH_LOGIN: apiUrl("/auth/login"),
      AUTH_ME: apiUrl("/auth/me"),
      AUTH_LOGOUT: apiUrl("/auth/logout"),

      CHAT: apiUrl("/chat"),
      CHAT_END: apiUrl("/chat/end"),
      UPLOAD: apiUrl("/upload-video"),

      PROFILE_ME: apiUrl("/profiles/me"),
      PROFILE_UPDATE: apiUrl("/profiles/me"),

      FRIENDS_LIST: apiUrl("/friends"),
      FRIEND_INCOMING: apiUrl("/friends/requests/incoming"),
      FRIEND_OUTGOING: apiUrl("/friends/requests/outgoing"),
      FRIEND_REQUEST_PREFIX: apiUrl("/friends/request/"),
      FRIEND_ACCEPT_PREFIX: apiUrl("/friends/accept/"),
      FRIEND_DECLINE_PREFIX: apiUrl("/friends/decline/"),

      FORUM_POSTS_WITH_COUNTS: apiUrl("/forum/posts_with_counts"),
      FORUM_POSTS: apiUrl("/forum/posts"),
      FORUM_COMMENTS_PREFIX: apiUrl("/forum/posts/"),
    },

    ASSETS: {
      BG_WELCOME: "./asset/image_out.png",
      BG_CHAT: "./asset/image_in.png",
    },
  };
})();
