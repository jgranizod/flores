import { db } from "./firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const WHATSAPP = "593963247370";
const contenedor = document.getElementById("productos");

function normalizarClave(k){return String(k||"").trim().toLowerCase();}
function pickField(data, keys){
  if (!data) return undefined;
  const map = {};
  Object.entries(data).forEach(([k,v])=>{map[normalizarClave(k)]=v;});
  for(const key of keys){ if(map[key]!==undefined) return map[key]; }
  return undefined;
}
function parsePrecio(val){
  if(val==null) return 0;
  if(typeof val==="number") return val;
  const s=String(val).trim(); if(!s) return 0;
  const c=s.replace(/[^0-9.,-]/g,"");
  if(c.includes(",") && !c.includes(".")) return parseFloat(c.replace(",","."))||0;
  return parseFloat(c.replace(/,/g,""))||0;
}
function resolverImagen(src){
  const s=(src||"").trim(); if(!s) return "";
  if(/^https?:\/\//i.test(s)) return s;
  const rel=s.startsWith("./")||s.startsWith("../")?s:"./"+s.replace(/^\/+/,"");
  return encodeURI(rel);
}
function normalizarProducto(data,id){
  const nombre=pickField(data,["nombre","name","titulo","title"]);
  const precio=pickField(data,["precio","price","valor","costo"]);
  const categoria=pickField(data,["categoria","category","tipo"]);
  const imagen=pickField(data,["imagen","image","img","foto"]);
  const descripcion=pickField(data,["descripcion","description","desc"]);
  return {
    id,
    Nombre: nombre?String(nombre).trim():"",
    Precio: parsePrecio(precio),
    categoria:(categoria?String(categoria):"general").trim().toLowerCase(),
    imagen: resolverImagen(imagen||""),
    descripcion: descripcion?String(descripcion).trim():""
  };
}

if (!contenedor) {
  console.warn("productos.js: no hay #productos en esta página.");
} else {
  let todosLosProductos=[];
  let categoriaActual="todos";
  let textoBusqueda="";
  let precioMax=200;
  let ordenActual="nuevo";

  const modal=document.getElementById("producto-modal");
  const modalImagen=document.getElementById("modal-imagen");
  const modalCategoria=document.getElementById("modal-categoria");
  const modalTitulo=document.getElementById("modal-title");
  const modalDescripcion=document.getElementById("modal-descripcion");

  function abrirModal(p){
    modalImagen.src=p.imagen||"https://via.placeholder.com/280?text=Sin+Imagen";
    modalCategoria.textContent=p.categoria||"general";
    modalTitulo.textContent=p.Nombre||"";
    modalDescripcion.textContent=p.descripcion||"Sin descripcion.";
    modal.classList.add("activo");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }
  function cerrarModal(){
    modal.classList.remove("activo");
    modal.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
  }
  document.getElementById("modal-cerrar").addEventListener("click", cerrarModal);
  modal.addEventListener("click",(e)=>{ if(e.target===modal) cerrarModal(); });
  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") cerrarModal(); });

  function cotizarProducto(p){
    const msg=`Hola, me interesa este arreglo: ${p.Nombre}. ¿Me podrías cotizar?`;
    const url=`https://wa.me/${WHATSAPP}?text=`+encodeURIComponent(msg);
    window.open(url,"_blank");
  }

  function ordenarProductos(lista){
    const copia=lista.slice();
    if(ordenActual==="precio-asc") copia.sort((a,b)=>(a.Precio||0)-(b.Precio||0));
    else if(ordenActual==="precio-desc") copia.sort((a,b)=>(b.Precio||0)-(a.Precio||0));
    return copia;
  }

  function mostrarProductos(productos){
    contenedor.innerHTML="";
    if(productos.length===0){
      contenedor.innerHTML='<p class="loading">No hay productos en esta categoría</p>';
      return;
    }
    productos.forEach((p)=>{
      const card=document.createElement("div");
      card.className="producto";
      const imagenFinal=p.imagen||"https://via.placeholder.com/280?text=Sin+Imagen";
      card.innerHTML=`
        <img src="${imagenFinal}" alt="${p.Nombre}" class="producto-img" loading="lazy">
        <div class="producto-info">
          <span class="categoria-tag">${p.categoria||"general"}</span>
          <h3>${p.Nombre}</h3>
          <div class="acciones">
            <button class="btn-detalles">Ver detalles</button>
            <button class="btn-carrito">Cotizar este arreglo</button>
          </div>
        </div>
      `;
      card.querySelector(".btn-detalles").addEventListener("click",(e)=>{e.stopPropagation(); abrirModal(p);});
      card.querySelector(".btn-carrito").addEventListener("click",(e)=>{e.stopPropagation(); cotizarProducto(p);});
      contenedor.appendChild(card);
    });
  }

  function aplicarFiltro(){
    let filtrados=todosLosProductos;
    if(categoriaActual!=="todos") filtrados=filtrados.filter((p)=>(p.categoria||"").toLowerCase()===categoriaActual);
    if(textoBusqueda) filtrados=filtrados.filter((p)=>(p.Nombre||"").toLowerCase().includes(textoBusqueda));
    filtrados=filtrados.filter((p)=>(p.Precio||0)<=precioMax);
    filtrados=ordenarProductos(filtrados);
    mostrarProductos(filtrados);
    const resultCount=document.getElementById("result-count");
    if(resultCount){
      const n=filtrados.length;
      resultCount.textContent=n===1?"1 producto":`${n} productos`;
    }
  }

  window.filtrar=function(categoria,event){
    categoriaActual=categoria;
    aplicarFiltro();
    document.querySelectorAll(".filtro-btn").forEach((btn)=>btn.classList.remove("activo"));
    if(event && event.target) event.target.classList.add("activo");
  };

  const buscador=document.getElementById("buscador");
  if(buscador) buscador.addEventListener("input",(e)=>{textoBusqueda=e.target.value.trim().toLowerCase(); aplicarFiltro();});

  const precioInput=document.getElementById("precio-max");
  const precioLabel=document.getElementById("precio-max-label");
  if(precioInput && precioLabel){
    precioInput.addEventListener("input",()=>{precioMax=Number(precioInput.value); precioLabel.textContent="$"+precioMax; aplicarFiltro();});
  }

  const ordenar=document.getElementById("ordenar");
  if(ordenar) ordenar.addEventListener("change",(e)=>{ordenActual=e.target.value; aplicarFiltro();});

  const btnLimpiar=document.getElementById("limpiar-filtros");
  if(btnLimpiar){
    btnLimpiar.addEventListener("click",()=>{
      categoriaActual="todos"; textoBusqueda=""; precioMax=200; ordenActual="nuevo";
      if(buscador) buscador.value="";
      if(precioInput) precioInput.value=200;
      if(precioLabel) precioLabel.textContent="$200";
      if(ordenar) ordenar.value="nuevo";
      document.querySelectorAll(".filtro-btn").forEach((btn)=>btn.classList.remove("activo"));
      const primer=document.querySelector(".filtro-btn"); if(primer) primer.classList.add("activo");
      aplicarFiltro();
    });
  }

  onSnapshot(collection(db,"productos"),(snapshot)=>{
    todosLosProductos=[];
    snapshot.forEach((doc)=>{ todosLosProductos.push(normalizarProducto(doc.data(),doc.id)); });
    aplicarFiltro();
  },()=>{
    contenedor.innerHTML='<p class="loading">Error al cargar productos</p>';
  });
}
