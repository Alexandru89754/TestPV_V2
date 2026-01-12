document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const form = document.querySelector(".login-form");
  const submitBtn = document.querySelector(".login-btn");

  let mode = "login"; // login | register

  function switchMode(newMode) {
    mode = newMode;

    tabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.mode === mode);
    });

    if (mode === "login") {
      submitBtn.textContent = "Se connecter";
    } else {
      submitBtn.textContent = "Créer le compte";
    }
  }

  // Initialisation
  tabs[0].dataset.mode = "login";
  tabs[1].dataset.mode = "register";
  switchMode("login");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      switchMode(tab.dataset.mode);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value.trim();

    if (!email || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    if (mode === "login") {
      console.log("LOGIN", { email, password });
      alert("Connexion simulée (backend à venir)");
    } else {
      console.log("REGISTER", { email, password });
      alert("Création de compte simulée (backend à venir)");
    }
  });
});
