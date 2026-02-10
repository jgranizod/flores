import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const contenedor = document.getElementById("productos");

function resolverImagen(src) {
  const s = (src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("./") || s.startsWith("../")) return s;
  return "./" + s.replace(/^\/+/, "");
}

async function cargarProductos() {
  try {
    if (!contenedor) return;

    const snapshot = await getDocs(collection(db, "productos"));
    contenedor.innerHTML = "";

    snapshot.forEach((doc) => {
      const p = doc.data();
      const nombre = p.Nombre || "";
      const precio = parseFloat(p.Precio || 0).toFixed(2);
      const stock = p.stock ?? 0;
      const categoria = p.categoria || "General";
      const imagenFinal = resolverImagen(p.imagen);

      const card = document.createElement("div");
      card.className = "producto";
      card.innerHTML = `
        <img src="${imagenFinal}" alt="${nombre}" class="producto-img"
             onerror="this.src='https://via.placeholder.com/280x280?text=Sin+Imagen'">
        <div class="producto-info">
          <span class="categoria-tag">${categoria}</span>
          <h3>${nombre}</h3>
          <div class="precio-container">
            <span class="precio">$${precio}</span>
          </div>
          <p class="stock">Stock disponible: ${stock}</p>
        </div>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
    if (contenedor) contenedor.innerHTML = '<p class="loading">Error al cargar productos</p>';
  }
}

cargarProductos();
