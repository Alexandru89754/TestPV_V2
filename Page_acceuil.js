document.addEventListener("DOMContentLoaded", () => {
  const BG_WELCOME = "assets/image extérieur.png";
  const PARTICIPANT_KEY = "pv_participant_id";

  const appBg = document.getElementById("app-bg");
  const participantInput = document.getElementById("participant-id");
  const acceptBtn = document.getElementById("accept-btn");
  const welcomeError = document.getElementById("welcome-error");

  function setBackground(url) {
    const u = String(url || "").trim();
    if (!appBg) return;
    if (!u) { appBg.style.backgroundImage = ""; return; }
    appBg.style.backgroundImage = `url("${encodeURI(u)}")`;
  }

  function normalizeParticipantId(raw) {
    return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function isValidParticipantId(pid) {
    return /^[A-Z0-9_-]{2,40}$/.test(pid);
  }

  setBackground(BG_WELCOME);

  acceptBtn.addEventListener("click", () => {
    const pid = normalizeParticipantId(participantInput.value);

    if (!isValidParticipantId(pid)) {
      welcomeError.textContent = "Identifiant invalide. Utilisez un code du type P001 (lettres/chiffres, sans espaces, sans nom/courriel).";
      participantInput.focus();
      return;
    }

    localStorage.setItem(PARTICIPANT_KEY, pid);
    window.location.href = "chat.html";
  });

  participantInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      acceptBtn.click();
    }
  });
});
