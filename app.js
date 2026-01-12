document.addEventListener("DOMContentLoaded", () => {
  const C = window.CONFIG;

  /* ===== AUTH GUARD ===== */
  const token = localStorage.getItem(C.TOKEN_KEY);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  /* ===== NAV LOGIC ===== */
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  function showSection(id) {
    sections.forEach(sec =>
      sec.classList.toggle("active", sec.id === id)
    );
    buttons.forEach(btn =>
      btn.classList.toggle("active", btn.dataset.target === id)
    );
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      showSection(btn.dataset.target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ===== START WITH NOTHING SELECTED ===== */
  showSection(null);
});
