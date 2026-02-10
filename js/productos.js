import { db } from "./firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const contenedor = document.getElementById("productos");

function resolverImagen(src) {
  const s = (src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("./") || s.startsWith("../")) return encodeURI(s);
  return encodeURI("./" + s.replace(/^\/+/, ""));
}

function normalizarProducto(data, id) {
  return {
    id,
    Nombre: data.Nombre || data.nombre || data.name || "",
    Precio: Number(data.Precio ?? data.precio ?? data.price ?? 0),
    categoria: (data.categoria || data.Categoria || data.category || "general").toLowerCase(),
    imagen: resolverImagen(data.imagen || data.image || data.img || ""),
    stock: data.stock ?? data.Stock ?? 0,
    descripcion: data.descripcion || data.Descripcion || data.description || ""
  };
}

if (!contenedor) {
  console.warn("productos.js: no hay #productos en esta página.");
} else {
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

  function abrirModal(p) {
    const imagenFinal = p.imagen || "https://via.placeholder.com/280?text=Sin+Imagen";
    modalImagen.src = imagenFinal;
    modalImagen.alt = p.Nombre || "Producto";
    modalCategoria.textContent = p.categoria || "general";
    modalTitulo.textContent = p.Nombre || "";
    modalDescripcion.textContent = p.descripcion || "Sin descripcion.";
    modalPrecio.textContent = "$" + (p.Precio || 0).toFixed(2);
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

  const btnCerrar = document.getElementById("modal-cerrar");
  if (btnCerrar) btnCerrar.addEventListener("click", cerrarModal);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

  if (btnModalAgregar) {
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
  }

  function ordenarProductos(lista) {
    const copia = lista.slice();
    if (ordenActual === "precio-asc") copia.sort((a, b) => (a.Precio || 0) - (b.Precio || 0));
    else if (ordenActual === "precio-desc") copia.sort((a, b) => (b.Precio || 0) - (a.Precio || 0));
    return copia;
  }

  function mostrarProductos(productos) {
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
      const imagenFinal = p.imagen || "https://via.placeholder.com/280?text=Sin+Imagen";
      const imagenEscapada = imagenFinal.replace(/'/g, "\\'");

      card.innerHTML = `
        <img src="${imagenFinal}" alt="${nombre}" class="producto-img" loading="lazy"
             onerror="this.src='https://via.placeholder.com/280?text=Sin+Imagen'">
        <div class="producto-info">
          <span class="categoria-tag">${p.categoria || "general"}</span>
          <h3>${nombre}</h3>
          <div class="precio-container"><span class="precio">$${(p.Precio || 0).toFixed(2)}</span></div>
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

  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", (e) => {
      textoBusqueda = e.target.value.trim().toLowerCase();
      aplicarFiltro();
    });
  }

  const precioInput = document.getElementById("precio-max");
  const precioLabel = document.getElementById("precio-max-label");
  if (precioInput && precioLabel) {
    precioInput.addEventListener("input", () => {
      precioMax = Number(precioInput.value);
      precioLabel.textContent = "$" + precioMax;
      aplicarFiltro();
    });
  }

  const ordenar = document.getElementById("ordenar");
  if (ordenar) {
    ordenar.addEventListener("change", (e) => {
      ordenActual = e.target.value;
      aplicarFiltro();
    });
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      categoriaActual = "todos";
      textoBusqueda = "";
      precioMax = 200;
      ordenActual = "nuevo";

      if (buscador) buscador.value = "";
      if (precioInput) precioInput.value = 200;
      if (precioLabel) precioLabel.textContent = "$200";
      if (ordenar) ordenar.value = "nuevo";

      document.querySelectorAll(".filtro-btn").forEach((btn) => btn.classList.remove("activo"));
      const primer = document.querySelector(".filtro-btn");
      if (primer) primer.classList.add("activo");

      aplicarFiltro();
    });
  }

  onSnapshot(collection(db, "productos"), (snapshot) => {
    todosLosProductos = [];
    snapshot.forEach((doc) => {
      todosLosProductos.push(normalizarProducto(doc.data(), doc.id));
    });
    aplicarFiltro();
  }, () => {
    contenedor.innerHTML = '<p class="loading">Error al cargar productos</p>';
  });
}
