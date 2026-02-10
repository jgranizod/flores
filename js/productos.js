import { db } from "./firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let todosLosProductos = [];
let categoriaActual = "todos";
let textoBusqueda = "";
let precioMax = 200;
let ordenActual = "nuevo";
let productoActual = null;

const modal = document.getElementById("producto-modal");
const modalImagen = document.getElementById("modal-imagen");
const modalCategoria = document.getElementById("modal-categoria");
const modalTitulo = document.getElementById("modal-title");
const modalDescripcion = document.getElementById("modal-descripcion");
const modalPrecio = document.getElementById("modal-precio");
const btnModalAgregar = document.getElementById("modal-agregar");
const resultCount = document.getElementById("result-count");
const btnLimpiar = document.getElementById("limpiar-filtros");

function resolverImagen(src) {
  const s = (src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("./") || s.startsWith("../")) return s;
  return "./" + s.replace(/^\/+/, "");
}

function abrirModal(p) {
  const imagenFinal = resolverImagen(p.imagen);
  modalImagen.src = imagenFinal || "https://via.placeholder.com/280?text=Sin+Imagen";
  modalImagen.alt = p.Nombre || "Producto";
  modalCategoria.textContent = p.categoria || "General";
  modalTitulo.textContent = p.Nombre || "";
  modalDescripcion.textContent = p.descripcion || p.Descripcion || "Sin descripcion.";
  modalPrecio.textContent = "$" + parseFloat(p.Precio || 0).toFixed(2);
  productoActual = { ...p, imagen: imagenFinal };
  modal.classList.add("activo");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  modal.classList.remove("activo");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("modal-cerrar").addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

btnModalAgregar.addEventListener("click", () => {
  if (!productoActual) return;
  agregarAlCarrito(
    productoActual.id,
    productoActual.Nombre || "",
    productoActual.Precio || 0,
    productoActual.imagen || ""
  );
  cerrarModal();
});

function ordenarProductos(lista) {
  const copia = lista.slice();
  if (ordenActual === "precio-asc") copia.sort((a, b) => (a.Precio || 0) - (b.Precio || 0));
  else if (ordenActual === "precio-desc") copia.sort((a, b) => (b.Precio || 0) - (a.Precio || 0));
  return copia;
}

function mostrarProductos(productos) {
  const contenedor = document.getElementById("productos");
  if (productos.length === 0) {
    contenedor.innerHTML = '<p class="loading">No hay productos en esta categoria</p>';
    return;
  }

  contenedor.innerHTML = "";
  productos.forEach((p) => {
    const card = document.createElement("div");
    card.className = "producto";
    const nombre = p.Nombre || "";
    const nombreEscapado = nombre.replace(/'/g, "\\'");
    const imagenFinal = resolverImagen(p.imagen);
    const imagenEscapada = imagenFinal.replace(/'/g, "\\'");

    card.innerHTML = `
      <img src="${imagenFinal}" alt="${nombre}" class="producto-img" loading="lazy"
           onerror="this.src='https://via.placeholder.com/280?text=Sin+Imagen'">
      <div class="producto-info">
        <span class="categoria-tag">${p.categoria || "General"}</span>
        <h3>${nombre}</h3>
        <div class="precio-container"><span class="precio">$${parseFloat(p.Precio || 0).toFixed(2)}</span></div>
        <button class="btn-carrito" onclick="agregarAlCarrito('${p.id}', '${nombreEscapado}', ${p.Precio || 0}, '${imagenEscapada}')">Me interesa 🌻</button>
      </div>
    `;

    const img = card.querySelector(".producto-img");
    if (img) img.addEventListener("click", () => abrirModal(p));

    const btnCarrito = card.querySelector(".btn-carrito");
    if (btnCarrito) btnCarrito.addEventListener("click", (e) => e.stopPropagation());

    contenedor.appendChild(card);
  });
}

function aplicarFiltro() {
  let filtrados = todosLosProductos;

  if (categoriaActual !== "todos") {
    filtrados = filtrados.filter((p) => (p.categoria || "").toLowerCase() === categoriaActual);
  }
  if (textoBusqueda) {
    filtrados = filtrados.filter((p) => (p.Nombre || "").toLowerCase().includes(textoBusqueda));
  }

  filtrados = filtrados.filter((p) => (p.Precio || 0) <= precioMax);
  filtrados = ordenarProductos(filtrados);
  mostrarProductos(filtrados);

  if (resultCount) {
    const n = filtrados.length;
    resultCount.textContent = n === 1 ? "1 producto" : `${n} productos`;
  }
}

window.filtrar = function(categoria, event) {
  categoriaActual = categoria;
  aplicarFiltro();
  document.querySelectorAll(".filtro-btn").forEach((btn) => btn.classList.remove("activo"));
  if (event && event.target) event.target.classList.add("activo");
};

document.getElementById("buscador").addEventListener("input", (e) => {
  textoBusqueda = e.target.value.trim().toLowerCase();
  aplicarFiltro();
});

const precioInput = document.getElementById("precio-max");
const precioLabel = document.getElementById("precio-max-label");
precioInput.addEventListener("input", () => {
  precioMax = Number(precioInput.value);
  precioLabel.textContent = "$" + precioMax;
  aplicarFiltro();
});

document.getElementById("ordenar").addEventListener("change", (e) => {
  ordenActual = e.target.value;
  aplicarFiltro();
});

btnLimpiar.addEventListener("click", () => {
  categoriaActual = "todos";
  textoBusqueda = "";
  precioMax = 200;
  ordenActual = "nuevo";

  document.getElementById("buscador").value = "";
  document.getElementById("precio-max").value = 200;
  document.getElementById("precio-max-label").textContent = "$200";
  document.getElementById("ordenar").value = "nuevo";

  document.querySelectorAll(".filtro-btn").forEach((btn) => btn.classList.remove("activo"));
  document.querySelector(".filtro-btn").classList.add("activo");

  aplicarFiltro();
});

function cargarProductos() {
  const contenedor = document.getElementById("productos");
  onSnapshot(collection(db, "productos"), (snapshot) => {
    todosLosProductos = [];
    snapshot.forEach((doc) => {
      todosLosProductos.push({ id: doc.id, ...doc.data() });
    });
    aplicarFiltro();
  }, () => {
    contenedor.innerHTML = '<p class="loading">Error al cargar productos</p>';
  });
}

cargarProductos();
