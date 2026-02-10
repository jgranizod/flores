const WHATSAPP_NUMERO = "593985700805";
let carritoCache = [];
let colaOperaciones = Promise.resolve();

function enCola(tarea) {
  colaOperaciones = colaOperaciones.then(tarea, tarea).catch(console.error);
  return colaOperaciones;
}

function resolverImagen(src) {
  const s = (src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const rel = s.startsWith("./") || s.startsWith("../") ? s : "./" + s.replace(/^\/+/, "");
  return encodeURI(rel);
}

function obtenerCarrito() {
  return carritoCache;
}

function guardarCarrito(carrito) {
  carritoCache = carrito;
  actualizarContador();
}

function actualizarContador() {
  const total = carritoCache.reduce((sum, item) => sum + item.cantidad, 0);
  document.querySelectorAll("#carrito-count, .carrito-count").forEach((el) => {
    el.textContent = total;
    el.style.display = total > 0 ? "inline-block" : "none";
  });
}

window.agregarAlCarrito = function(id, nombre, precio, imagen) {
  return enCola(async () => {
    const carrito = obtenerCarrito();
    const existente = carrito.find((i) => i.id === id);
    const imagenFinal = resolverImagen(imagen);

    if (existente) {
      existente.cantidad++;
      if (!existente.imagen && imagenFinal) existente.imagen = imagenFinal;
    } else {
      carrito.push({ id, nombre, precio: parseFloat(precio), imagen: imagenFinal, cantidad: 1 });
    }

    guardarCarrito(carrito);
    mostrarNotificacion("Agregado a tu selección");
    const sidebar = document.getElementById("carrito-sidebar");
    if (sidebar && sidebar.classList.contains("abierto")) renderizarCarrito();
  });
};

window.aumentarCantidad = function(id) {
  return enCola(async () => {
    const item = carritoCache.find((i) => i.id === id);
    if (item) item.cantidad++;
    guardarCarrito(carritoCache);
    renderizarCarrito();
  });
};

window.disminuirCantidad = function(id) {
  return enCola(async () => {
    let carrito = carritoCache;
    const item = carrito.find((i) => i.id === id);
    if (!item) return;
    if (item.cantidad > 1) item.cantidad--;
    else carrito = carrito.filter((i) => i.id !== id);
    guardarCarrito(carrito);
    renderizarCarrito();
  });
};

window.eliminarDelCarrito = function(id) {
  return enCola(async () => {
    const nuevo = carritoCache.filter((i) => i.id !== id);
    guardarCarrito(nuevo);
    renderizarCarrito();
  });
};

window.vaciarCarrito = function() {
  return enCola(async () => {
    carritoCache = [];
    actualizarContador();
    renderizarCarrito();
  });
};

function calcularTotal() {
  return carritoCache.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

function renderizarCarrito() {
  const contenedor = document.getElementById("carrito-items");
  const footer = document.getElementById("carrito-footer");
  if (!contenedor || !footer) return;

  if (carritoCache.length === 0) {
    contenedor.innerHTML = `
      <div class="carrito-vacio">
        <p>Tu selección está vacía</p>
      </div>
    `;
    footer.style.display = "none";
    return;
  }

  contenedor.innerHTML = "";
  carritoCache.forEach((item) => {
    const imagenFinal = resolverImagen(item.imagen) || "https://via.placeholder.com/120?text=Sin+Imagen";

    const div = document.createElement("div");
    div.className = "carrito-item";
    div.innerHTML = `
      <img src="${imagenFinal}" alt="${item.nombre}" class="carrito-item-img"
           onerror="this.src='https://via.placeholder.com/120?text=Sin+Imagen'">
      <div class="carrito-item-info">
        <h4>${item.nombre}</h4>
        <p class="carrito-item-precio">$${item.precio.toFixed(2)}</p>
        <div class="carrito-item-cantidad">
          <button onclick="disminuirCantidad('${item.id}')" class="btn-cantidad">-</button>
          <span>${item.cantidad}</span>
          <button onclick="aumentarCantidad('${item.id}')" class="btn-cantidad">+</button>
        </div>
      </div>
      <div class="carrito-item-acciones">
        <p class="carrito-item-subtotal">$${(item.precio * item.cantidad).toFixed(2)}</p>
        <button onclick="eliminarDelCarrito('${item.id}')" class="btn-eliminar">X</button>
      </div>
    `;
    contenedor.appendChild(div);
  });

  const subtotal = calcularTotal();
  const envio = subtotal > 0 ? 2.5 : 0;
  const impuestos = subtotal * 0.05;
  const total = subtotal + envio + impuestos;

  document.getElementById("carrito-subtotal").textContent = "$" + subtotal.toFixed(2);
  document.getElementById("carrito-envio").textContent = "$" + envio.toFixed(2);
  document.getElementById("carrito-impuestos").textContent = "$" + impuestos.toFixed(2);
  document.getElementById("carrito-total").textContent = "$" + total.toFixed(2);

  footer.style.display = "block";
}

window.toggleCarrito = function() {
  const sidebar = document.getElementById("carrito-sidebar");
  const overlay = document.getElementById("carrito-overlay");
  if (!sidebar || !overlay) return;

  sidebar.classList.toggle("abierto");
  overlay.classList.toggle("activo");
  document.body.style.overflow = sidebar.classList.contains("abierto") ? "hidden" : "";
  if (sidebar.classList.contains("abierto")) renderizarCarrito();
};

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("carrito-overlay");
  if (overlay) overlay.addEventListener("click", toggleCarrito);
  actualizarContador();
});

window.checkoutWhatsApp = function() {
  return enCola(async () => {
    if (carritoCache.length === 0) {
      alert("Tu selección está vacía");
      return;
    }

    let mensaje = "*SELECCIÓN FLORAL*\\n\\n";
    mensaje += "*REFERENCIAS ELEGIDAS:*\\n";
    mensaje += "------------------------------\\n";

    carritoCache.forEach((item, index) => {
      const img = resolverImagen(item.imagen);
      mensaje += (index + 1) + ". *" + item.nombre + "*\\n";
      mensaje += "   Cantidad: " + item.cantidad + "\\n";
      mensaje += "   Foto: " + img + "\\n\\n";
    });

    const total = calcularTotal();
    mensaje += "------------------------------\\n";
    mensaje += "*TOTAL ESTIMADO: $" + total.toFixed(2) + "*\\n\\n";
    mensaje += "Quisiera cotizar este estilo. ¿Podemos coordinar colores y disponibilidad?";

    const urlWhatsApp = "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(mensaje);
    window.open(urlWhatsApp, "_blank");

    await window.vaciarCarrito();
    toggleCarrito();
  });
};

function mostrarNotificacion(mensaje) {
  const notif = document.createElement("div");
  notif.className = "notificacion";
  notif.textContent = mensaje;
  document.body.appendChild(notif);
  setTimeout(() => notif.classList.add("mostrar"), 10);
  setTimeout(() => {
    notif.classList.remove("mostrar");
    setTimeout(() => notif.remove(), 300);
  }, 2500);
}
