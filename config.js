// config.js
// ✅ Fichier unique de configuration (frontend)
// À charger AVANT welcome.js et chat.js (déjà fait dans tes HTML)

(function () {
  // ✅ Mets ici l’URL de TON backend Render (FastAPI)
  // Exemple: https://patient-virtuel-platform-backend.onrender.com
  const API_BASE_URL = "https://patient-virtuel-platform-backend.onrender.com";

  // ✅ Endpoints backend
  const CHAT_PATH = "/chat";
  const UPLOAD_VIDEO_PATH = "/upload-video";

  // ✅ Stockage local
  const PARTICIPANT_KEY = "pv_participant_id";

  // ✅ Images (si tu veux centraliser)
  const BG_WELCOME = "./asset/image_out.png";
  const BG_CHAT = "./asset/image_in.png";

  // ✅ Expose en global (window.CONFIG)
  window.CONFIG = {
    API_BASE_URL,
    CHAT_PATH,
    UPLOAD_VIDEO_PATH,
    PARTICIPANT_KEY,
    BG_WELCOME,
    BG_CHAT,

    // Helpers pratiques
    CHAT_URL: API_BASE_URL.replace(/\/+$/, "") + CHAT_PATH,
    UPLOAD_URL: API_BASE_URL.replace(/\/+$/, "") + UPLOAD_VIDEO_PATH,
  };
})();
