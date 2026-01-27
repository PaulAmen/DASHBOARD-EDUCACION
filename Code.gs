/**
 * Dashboard Producción Científica - UNESUM Educación 2026
 * Backend Google Apps Script - VERSIÓN OPTIMIZADA
 */

// ============================================
// CONFIGURACIÓN
// ============================================
const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI'; // Reemplazar con el ID real

// Campos que necesita el dashboard (solo estos se envían)
const CAMPOS = {
  REVISTAS: {
    headerRow: 2,
    campos: {
      titulo: 'TITULO_PUBLICACION',
      autor: 'APELLIDOS_NOMBRES',
      revista: 'NOMBRE_REVISTA',
      baseDatos: 'BASE_DATOS_INDEXADA',
      issn: 'CODIGO_ISSN',
      fecha: 'FECHA_PUBLICACION',
      link: 'LINK_PUBLICACION',
      proyecto: 'TITULO_PROYECTO'
    }
  },
  LIBROS: {
    headerRow: 1,
    campos: {
      titulo: 'TITULO_LIBRO',
      autor: 'APELLIDOS_NOMBRES',
      isbn: 'CODIGO_ISBN',
      fecha: 'FECHA_PUBLICACION',
      link: 'ENLACE_LIBRO',
      proyecto: 'TITULO_PROYECTO'
    }
  },
  CAPITULOS: {
    headerRow: 1,
    campos: {
      titulo: 'TITULO_CAPITULO',
      libroPadre: 'TITULO_LIBRO',
      autor: 'APELLIDOS_NOMBRES',
      isbn: 'CODIGO_ISBN',
      fecha: 'FECHA_PUBLICACION',
      paginas: 'PAGINAS (DESDE_23-45)'
    }
  }
};

// ============================================
// ENDPOINT PRINCIPAL
// ============================================
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || 'dashboard';
  
  let result;
  
  try {
    switch(action) {
      case 'dashboard':
        result = getDashboardOptimizado();
        break;
      case 'autores':
        result = getAutoresRanking();
        break;
      default:
        result = getDashboardOptimizado();
    }
  } catch (error) {
    result = { error: error.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// FUNCIONES OPTIMIZADAS
// ============================================

/**
 * Obtiene solo los datos necesarios para el dashboard
 */
function getDashboardOptimizado() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Obtener datos de cada hoja con solo los campos necesarios
  const revistas = getHojaOptimizada(ss, 'REVISTAS');
  const libros = getHojaOptimizada(ss, 'LIBROS');
  const capitulos = getHojaOptimizada(ss, 'CAPITULOS');
  
  // Calcular ranking de docentes
  const docentes = calcularRankingDocentes(revistas, libros, capitulos);
  
  // Estadísticas por base de datos
  const basesDatos = {};
  revistas.forEach(r => {
    if (r.baseDatos) basesDatos[r.baseDatos] = (basesDatos[r.baseDatos] || 0) + 1;
  });
  
  return {
    publicaciones: {
      articulos: revistas,
      libros: libros,
      capitulos: capitulos
    },
    docentes: docentes,
    estadisticas: {
      totalArticulos: revistas.length,
      totalLibros: libros.length,
      totalCapitulos: capitulos.length,
      totalDocentes: docentes.length,
      porBaseDatos: Object.entries(basesDatos).map(([base, count]) => ({ base, count }))
    }
  };
}

/**
 * Lee una hoja y extrae solo los campos configurados
 */
function getHojaOptimizada(ss, nombreHoja) {
  const config = CAMPOS[nombreHoja];
  if (!config) return [];
  
  const sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[config.headerRow - 1];
  const rows = data.slice(config.headerRow);
  
  // Crear mapa de índices para los campos que necesitamos
  const indices = {};
  for (const [key, headerName] of Object.entries(config.campos)) {
    indices[key] = headers.indexOf(headerName);
  }
  
  // Extraer solo los campos necesarios
  const registros = [];
  rows.forEach((row, idx) => {
    // Verificar que la fila tenga datos
    const tieneAutor = indices.autor >= 0 && row[indices.autor];
    const tieneTitulo = indices.titulo >= 0 && row[indices.titulo];
    
    if (tieneAutor && tieneTitulo) {
      const registro = { id: nombreHoja + '_' + idx };
      
      for (const [key, colIdx] of Object.entries(indices)) {
        if (colIdx >= 0) {
          let valor = row[colIdx];
          // Formatear fechas
          if (valor instanceof Date) {
            valor = formatearFecha(valor);
          }
          // Solo incluir si tiene valor
          if (valor !== '' && valor !== null && valor !== undefined) {
            registro[key] = valor;
          }
        }
      }
      
      registros.push(registro);
    }
  });
  
  return registros;
}

/**
 * Calcula el ranking de docentes
 */
function calcularRankingDocentes(revistas, libros, capitulos) {
  const docentes = {};
  
  // Procesar artículos
  revistas.forEach(r => {
    const autor = r.autor;
    if (!autor) return;
    if (!docentes[autor]) docentes[autor] = { nombre: autor, articulos: 0, libros: 0, capitulos: 0, total: 0 };
    docentes[autor].articulos++;
    docentes[autor].total++;
  });
  
  // Procesar libros
  libros.forEach(l => {
    const autor = l.autor;
    if (!autor) return;
    if (!docentes[autor]) docentes[autor] = { nombre: autor, articulos: 0, libros: 0, capitulos: 0, total: 0 };
    docentes[autor].libros++;
    docentes[autor].total++;
  });
  
  // Procesar capítulos
  capitulos.forEach(c => {
    const autor = c.autor;
    if (!autor) return;
    if (!docentes[autor]) docentes[autor] = { nombre: autor, articulos: 0, libros: 0, capitulos: 0, total: 0 };
    docentes[autor].capitulos++;
    docentes[autor].total++;
  });
  
  // Ordenar por total descendente
  return Object.values(docentes).sort((a, b) => b.total - a.total);
}

/**
 * Obtiene solo el ranking de autores (endpoint ligero)
 */
function getAutoresRanking() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const revistas = getHojaOptimizada(ss, 'REVISTAS');
  const libros = getHojaOptimizada(ss, 'LIBROS');
  const capitulos = getHojaOptimizada(ss, 'CAPITULOS');
  
  return calcularRankingDocentes(revistas, libros, capitulos);
}

/**
 * Formatea fecha a DD/MM/YYYY
 */
function formatearFecha(date) {
  if (!date || !(date instanceof Date)) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// ============================================
// FUNCIONES DE PRUEBA
// ============================================

function testDashboard() {
  const result = getDashboardOptimizado();
  
  Logger.log('=== DASHBOARD OPTIMIZADO ===');
  Logger.log('Artículos: ' + result.publicaciones.articulos.length);
  Logger.log('Libros: ' + result.publicaciones.libros.length);
  Logger.log('Capítulos: ' + result.publicaciones.capitulos.length);
  Logger.log('Docentes: ' + result.docentes.length);
  Logger.log('');
  Logger.log('Top 3 Docentes:');
  result.docentes.slice(0, 3).forEach((d, i) => {
    Logger.log((i+1) + '. ' + d.nombre + ' (' + d.total + ' publicaciones)');
  });
  Logger.log('');
  Logger.log('Tamaño JSON: ' + JSON.stringify(result).length + ' bytes');
  
  return result;
}

function testConexion() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Conectado a: ' + ss.getName());
    ss.getSheets().forEach(s => Logger.log('  - ' + s.getName()));
    return true;
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
    return false;
  }
}
