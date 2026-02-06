(function () {
  const toggleId = "theme-toggle";
  const body = document.body;
  const stored = localStorage.getItem("tema");
  if (stored === "dark") body.classList.add("modo-oscuro");

  function actualizarTexto(btn) {
    btn.textContent = body.classList.contains("modo-oscuro") ? "Modo claro 🌞" : "Modo oscuro 🌙";
  }

  function crearBoton() {
    const btn = document.getElementById(toggleId);
    if (!btn) return;
    actualizarTexto(btn);
    btn.addEventListener("click", () => {
      body.classList.toggle("modo-oscuro");
      localStorage.setItem("tema", body.classList.contains("modo-oscuro") ? "dark" : "light");
      actualizarTexto(btn);
    });
  }

  document.addEventListener("DOMContentLoaded", crearBoton);
})();
