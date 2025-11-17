// CONFIGURACIÓN BÁSICA
const API_BASE = 'http://localhost:5269';
const API_USUARIO = `${API_BASE}/api/usuario`;
const API_PRODUCTOS = `${API_BASE}/api/productos`;

// ESTADO GLOBAL
let usuarioLogueado = null;
let modalAbierto = null;
let productosGlobales = [];
let productosFiltrados = [];
let paginaActual = 1;
const productosPorPagina = 12;
let modoActual = 'principal';
let categoriaActual = '';
let subcategoriaActual = '';
let terminoBusqueda = '';
let productosDestacadosIds = JSON.parse(localStorage.getItem('productosDestacados')) || [];