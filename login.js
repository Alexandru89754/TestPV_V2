document.addEventListener("DOMContentLoaded", () => {
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const submitBtn = document.getElementById("submit-btn");
  const form = document.getElementById("auth-form");
  const errorEl = document.getElementById("auth-error");

  let mode = "login"; // login | register

  function setMode(newMode) {
    mode = newMode;
    tabLogin.classList.toggle("active", mode === "login");
    tabRegister.classList.toggle("active", mode === "register");
    submitBtn.textContent = mode === "login" ? "Se connecter" : "Créer un compte";
    errorEl.textContent = "";
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      errorEl.textContent = "Veuillez remplir tous les champs.";
      return;
    }

    // ⚠️ Backend sera branché PLUS TARD
    console.log("MODE:", mode, email, password);

    // Temporaire
    window.location.href = "home.html";
  });
});
