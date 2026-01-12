document.addEventListener("DOMContentLoaded", async () => {
  const C = window.CONFIG;

  /* ===== PROTECTION AUTH ===== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  /* ===== BACKGROUND ===== */
  const bg = document.getElementById("app-bg");
  if (bg) bg.style.backgroundImage = `url("${C.BG_CHAT}")`;

  /* ===== UI ===== */
  const navBtns = document.querySelectorAll(".nav-btn");
  const panels = document.querySelectorAll(".panel");
  const userPill = document.getElementById("user-pill");
  const welcomeText = document.getElementById("welcome-text");
  const logoutBtn = document.getElementById("logout-btn");

  function showView(id) {
    panels.forEach(p => p.classList.toggle("hidden", p.id !== id));
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.view === id));
  }

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.view);
    });
  });

  /* ===== API HELPER ===== */
  async function apiGet(url) {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Session invalide");
    }
    return res.json();
  }

  /* ===== LOAD USER (SUPABASE VIA BACKEND) ===== */
  try {
    const me = await apiGet(C.AUTH_ME_URL);

    userPill.textContent = me.email;
    welcomeText.textContent = `Connecté en tant que ${me.email}`;

  } catch {
    localStorage.removeItem(C.TOKEN_KEY);
    window.location.href = "index.html";
    return;
  }

  /* ===== LOGOUT ===== */
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch(C.AUTH_LOGOUT_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch {}

    localStorage.removeItem(C.TOKEN_KEY);
    window.location.href = "index.html";
  });

  /* ===== DEFAULT VIEW ===== */
  showView("view-home");
});
