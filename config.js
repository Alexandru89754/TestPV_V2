// config.js
// ⚠️ Fichier frontend (public). Ne mets jamais de secrets ici.

window.__PV_CONFIG__ = {
  // Backend Render (FastAPI)
  API_BASE_URL: "https://patient-virtuel-platform-backend.onrender.com",

  // Endpoints attendus par ton frontend
  CHAT_PATH: "/chat",
  UPLOAD_VIDEO_PATH: "/upload-video",

  // LocalStorage keys
  PARTICIPANT_KEY: "pv_participant_id",
  TOKEN_KEY: "pv_access_token",
};
