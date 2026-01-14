function initHomePage() {
  const buttons = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".content-section");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;

      sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === `section-${target}`);
      });

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", initHomePage);
