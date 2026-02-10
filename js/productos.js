import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Cambia esto por tu GitHub Pages base:
const BASE_GITHUB = "https://TUUSUARIO.github.io/TU-REPO/";

// Contenedor donde se muestran los productos
const contenedor = document.getElementById("productos");

async function cargarProductos() {
  try {
    const snapshot = await getDocs(collection(db, "productos"));

    contenedor.innerHTML = "";
    snapshot.forEach((doc) => {
      const p = doc.data();
      const nombre = p.Nombre || "";
      const precio = parseFloat(p.Precio || 0).toFixed(2);
      const stock = p.stock ?? 0;
      const categoria = p.categoria || "General";

      // Construir URL final (si NO es url completa)
      const imagenFinal = p.imagen?.startsWith("http")
        ? p.imagen
        : BASE_GITHUB + (p.imagen || "");

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
    contenedor.innerHTML = '<p class="loading">Error al cargar productos</p>';
  }
}

cargarProductos();
