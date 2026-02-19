import { db } from "./firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const WHATSAPP_NUMERO = "593963247370";
const contenedor = document.getElementById("productos");

function normalizarClave(k) {
  return String(k || "").trim().toLowerCase();
}
function pickField(data, keys) {
  if (!data) return undefined;
  const map = {};
  Object.entries(data).forEach(([k, v]) => {
    map[normalizarClave(k)] = v;
  });
  for (const key of keys) {
    const v = map[key];
    if (v !== undefined) return v;
  }
  return undefined;
}
function parsePrecio(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const s = String(val).trim();
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.,-]/g, "");
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    return parseFloat(cleaned.replace(",", ".")) || 0;
  }
  return parseFloat(cleaned.replace(/,/g, "")) || 0;
}
function resolverImagen(src) {
  const s = (src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const rel = s.startsWith("./") || s.startsWith("../") ? s : "./" + s.replace(/^\/+/, "");
  return encodeURI(rel);
}
function normalizarProducto(data, id) {
  const nombre = pickField(data, ["nombre", "name", "titulo", "title"]);
  const precio = pickField(data, ["precio", "price", "valor", "costo"]);
  const categoria = pickField(data, ["categoria", "category", "tipo"]);
  const imagen = pickField(data, ["imagen", "image", "img", "foto"]);
  const descripcion = pickField(data, ["descripcion", "description", "desc"]);
  const tagsRaw = pickField(data, ["tags", "keywords"]);
  const codigo = pickField(data, ["codigo", "code", "sku", "id_producto"]);

  let tags = [];
  if (Array.isArray(tagsRaw)) {
    tags = tagsRaw.map(t => String(t).trim().toLowerCase());
  } else if (typeof tagsRaw === "string") {
    tags = tagsRaw.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
  }

  return {
    id,
    codigo: codigo ? String(codigo).trim() : "",
    Nombre: nombre ? String(nombre).trim() : "",
    Precio: parsePrecio(precio),
    categoria: (categoria ? String(categoria) : "general").trim().toLowerCase(),
    imagen: resolverImagen(imagen || ""),
    descripcion: descripcion ? String(descripcion).trim() : "",
    tags
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

      const imagenFinal = p.imagen || "https://via.placeholder.com/280?text=Sin+Imagen";
      const desc = p.descripcion ? `<p class="producto-desc">${p.descripcion}</p>` : "";

      card.innerHTML = `
        <img src="${imagenFinal}" alt="Arreglo" class="producto-img" loading="lazy"
             onerror="this.src='https://via.placeholder.com/280?text=Sin+Imagen'">
        <div class="producto-info">
          <span class="categoria-tag">${p.categoria || "general"}</span>
          ${desc}
          <div class="producto-acciones">
            <button class="btn-carrito">Cotizar este arreglo</button>
          </div>
        </div>
      `;

      const img = card.querySelector(".producto-img");
      if (img) img.addEventListener("click", () => {
        const modal = document.getElementById("foto-modal");
        const foto = document.getElementById("foto-grande");
        if (!modal || !foto) return;
        foto.src = imagenFinal;
        modal.classList.add("activo");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      });

      const btnCotizar = card.querySelector(".btn-carrito");
      if (btnCotizar) btnCotizar.addEventListener("click", (e) => {
        e.stopPropagation();
        const codigo = p.codigo || p.id || "sin-codigo";
        const mensaje = `Hola, me interesa este arreglo.
Código: ${codigo}
Categoría: ${p.categoria || "general"}

¿Me podrías cotizar?`;
        const url = "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(mensaje);
        window.open(url, "_blank");
      });

      contenedor.appendChild(card);
    });
  }

  function aplicarFiltro() {
    let filtrados = todosLosProductos;
    if (categoriaActual !== "todos") {
      filtrados = filtrados.filter((p) => (p.categoria || "").toLowerCase() === categoriaActual);
    }

    if (textoBusqueda) {
      filtrados = filtrados.filter((p) => {
        const base = [
          p.Nombre,
          p.descripcion,
          p.categoria,
          ...(p.tags || [])
        ].join(" ");
        return base.toLowerCase().includes(textoBusqueda);
      });
    }

    filtrados = filtrados.filter((p) => (p.Precio || 0) <= precioMax);
    filtrados = ordenarProductos(filtrados);
    mostrarProductos(filtrados);
  }

  window.filtrar = function(categoria, event) {
    categoriaActual = categoria;
    aplicarFiltro();
    document.querySelectorAll(".filtro-btn").forEach((btn) => btn.classList.remove("activo"));
    if (event && event.target) event.target.classList.add("activo");
  };

  const buscador = document.getElementById("buscador");
  if (buscador) buscador.addEventListener("input", (e) => {
    textoBusqueda = e.target.value.trim().toLowerCase();
    aplicarFiltro();
  });

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

  const btnLimpiar = document.getElementById("limpiar-filtros");
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

  // cerrar modal foto
  const fotoModal = document.getElementById("foto-modal");
  const fotoCerrar = document.getElementById("foto-cerrar");
  if (fotoCerrar) {
    fotoCerrar.addEventListener("click", () => {
      fotoModal.classList.remove("activo");
      fotoModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    });
  }
  if (fotoModal) {
    fotoModal.addEventListener("click", (e) => {
      if (e.target === fotoModal) {
        fotoModal.classList.remove("activo");
        fotoModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    });
  }
}
