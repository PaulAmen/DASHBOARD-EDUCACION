/**
 * Dashboard Producción Científica - UNESUM Educación 2026
 * Backend Google Apps Script - VERSIÓN OPTIMIZADA
 */

// ============================================
// CONFIGURACIÓN
// ============================================
const SPREADSHEET_ID = '1Juf-kboGLYMiuuJsipB6s2cKXFinx5kcv2_tKJtev_o'; // ID de la hoja de producción UNESUM

// Campos que necesita el dashboard (soporta nombres nuevos de la hoja de producción y compatibilidad anterior)
const CAMPOS = {
  REVISTAS: {
    headerRow: 1,
    campos: {
      titulo: ['TITULO_PUBLICACION', 'TITULO_ARTICULO', 'TITULO'],
      autor: ['APELLIDOS_NOMBRES', 'AUTOR', 'AUTORES'],
      identificacion: ['IDENTIFICACION_PARTICIPANTE', 'CEDULA', 'IDENTIFICACION'],
      carrera: ['CARRERA'],
      facultad: ['FACULTAD'],
      relacionLaboral: ['RELACION_LABORAL'],
      gradoAcademico: ['GRADO ACADEMICO', 'GRADO_ACADEMICO'],
      revista: ['NOMBRE_REVISTA', 'REVISTA'],
      baseDatos: ['BASE_DATOS_INDEXADA', 'BASE_DATOS'],
      tipoBaseDatos: ['TIPO_BASE_DATOS_INDEXADA'],
      issn: ['CODIGO_ISSN', 'ISSN'],
      fecha: ['FECHA_PUBLICACION', 'FECHA'],
      link: ['LINK_PUBLICACION', 'LINK_REVISTA', 'LINK'],
      doi: ['CODIGO_PUBLICACION', 'cOdigo doi', 'DOI'],
      proyecto: ['TITULO_PROYECTO_INVESTIGACION', 'TITULO_PROYECTO_VINCULACION', 'TITULO_PROYECTO'],
      estadoProyecto: ['ESTADO_PROYECTO_INVESTIGACION', 'ESTADO_PROYECTO_VINCULACION', 'ESTADO_PROYECTO'],
      cuartil: ['CUARTIL'],
      sjr: ['SJR'],
      posicion: ['POSICION'],
      periodoAcademico: ['PERIODO_ACADEMICO', 'PERIODO ACADEMICO'],
      interculturalidad: ['INTERCULTURALIDAD (SI o NO)', 'INTERCULTURALIDAD'],
      numeroRevista: ['NUMERO_REVISTA'],
      pdfAval: ['PDF_AVAL_CARTA_CERTIFICADO-PUBLICACION', 'LINK DE EVIDENCIAS (GOOGLE DRIVE COMPARTIDO)'],
      campoDetallado: ['CAMPO_DETALLADO'],
      lineaInvestigacion: ['LINEA_INVESTIGACION'],
      filiacion: ['FILIACION'],
      participacion: ['PARTICIPACION'],
      estadoArticulo: ['ESTADO'],
      estadoRegistro: ['ESTADO_REGISTRO'],
      idRecord: ['ID']
    }
  },
  LIBROS: {
    headerRow: 1,
    campos: {
      titulo: ['TITULO_LIBRO', 'TITULO'],
      autor: ['APELLIDOS_NOMBRES', 'AUTOR', 'AUTORES'],
      identificacion: ['IDENTIFICACION_PARTICIPANTE', 'CEDULA', 'IDENTIFICACION'],
      carrera: ['CARRERA'],
      facultad: ['FACULTAD'],
      relacionLaboral: ['RELACION_LABORAL'],
      gradoAcademico: ['GRADO ACADEMICO', 'GRADO_ACADEMICO'],
      isbn: ['CODIGO_ISBN', 'ISBN'],
      fecha: ['FECHA_PUBLICACION', 'FECHA'],
      link: ['ENLACE_LIBRO', 'LINK_PUBLICACION', 'LINK'],
      proyecto: ['TITULO_PROYECTO_INVESTIGACION', 'TITULO_PROYECTO_VINCULACION', 'TITULO_PROYECTO'],
      estadoProyecto: ['ESTADO_PROYECTO_INVESTIGACION', 'ESTADO_PROYECTO_VINCULACION', 'ESTADO_PROYECTO'],
      periodoAcademico: ['PERIODO_ACADEMICO', 'PERIODO ACADEMICO'],
      posicion: ['POSICION'],
      revisadoPares: ['REVISADO_PARES'],
      campoDetallado: ['CAMPO_DETALLADO'],
      lineaInvestigacion: ['LINEA_INVESTIGACION'],
      pdfAval: ['PDF_AVAL_CARTA_CERTIFICADO-PUBLICACION'],
      filiacion: ['FILIACION'],
      participacion: ['PARTICIPACION'],
      estadoRegistro: ['ESTADO_REGISTRO'],
      idRecord: ['ID']
    }
  },
  CAPITULOS: {
    headerRow: 1,
    campos: {
      titulo: ['TITULO_CAPITULO', 'TITULO'],
      libroPadre: ['TITULO_LIBRO', 'LIBRO'],
      autor: ['APELLIDOS_NOMBRES', 'AUTOR', 'AUTORES'],
      identificacion: ['IDENTIFICACION_PARTICIPANTE', 'CEDULA', 'IDENTIFICACION'],
      carrera: ['CARRERA'],
      facultad: ['FACULTAD'],
      relacionLaboral: ['RELACION_LABORAL'],
      gradoAcademico: ['GRADO ACADEMICO', 'GRADO_ACADEMICO'],
      isbn: ['CODIGO_ISBN', 'ISBN'],
      fecha: ['FECHA_PUBLICACION', 'FECHA'],
      paginas: ['PAGINAS (DESDE_23-45)', 'PAGINAS'],
      link: ['LINK DEL CAPITULO DE LIBRO', 'ENLACE_LIBRO', 'LINK_PUBLICACION', 'LINK'],
      editor: ['EDITOR_COMPILADOR', 'EDITOR'],
      proyecto: ['TITULO_PROYECTO_INVESTIGACION', 'TITULO_PROYECTO_VINCULACION', 'TITULO_PROYECTO'],
      estadoProyecto: ['ESTADO_PROYECTO_INVESTIGACION', 'ESTADO_PROYECTO_VINCULACION', 'ESTADO_PROYECTO'],
      periodoAcademico: ['PERIODO_ACADEMICO', 'PERIODO ACADEMICO'],
      posicion: ['POSICION'],
      campoDetallado: ['CAMPO_DETALLADO'],
      lineaInvestigacion: ['LINEA_INVESTIGACION'],
      pdfAval: ['PDF_AVAL_CARTA_CERTIFICADO-PUBLICACION'],
      filiacion: ['FILIACION'],
      participacion: ['PARTICIPACION'],
      estadoRegistro: ['ESTADO_REGISTRO'],
      idRecord: ['ID']
    }
  }
};

// ============================================
// CACHE
// ============================================
const CACHE_TTL_SECONDS = 300;         // 5 minutos (evita datos estancados si hay inserciones externas)
const CACHE_CHUNK_SIZE = 95 * 1024;    // 95KB por chunk (límite de CacheService = 100KB)
const CACHE_KEY_META = 'dashboard:meta';
const CACHE_KEY_CHUNK = 'dashboard:chunk:';

/**
 * Devuelve el JSON del dashboard desde caché si existe, sino lo construye
 * y lo cachea. Devuelve un string (JSON), no un objeto, para evitar
 * un stringify extra en doGet.
 */
function getDashboardJsonCached(forceRefresh) {
  const cache = CacheService.getScriptCache();

  if (!forceRefresh) {
    const metaRaw = cache.get(CACHE_KEY_META);
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw);
        // Verificación estricta: si la caché tiene más de CACHE_TTL_SECONDS, expira de inmediato
        if (meta.ts && (Date.now() - meta.ts > CACHE_TTL_SECONDS * 1000)) {
          throw new Error('Caché expirada por tiempo (' + Math.round((Date.now() - meta.ts) / 1000) + 's)');
        }
        const claves = [];
        for (let i = 0; i < meta.chunks; i++) claves.push(CACHE_KEY_CHUNK + i);
        const partes = cache.getAll(claves);
        let completo = true;
        const buffer = [];
        for (let i = 0; i < meta.chunks; i++) {
          const trozo = partes[CACHE_KEY_CHUNK + i];
          if (trozo == null) { completo = false; break; }
          buffer.push(trozo);
        }
        if (completo) return buffer.join('');
      } catch (e) {
        Logger.log('Cache inválida, regenerando: ' + e);
      }
    }
  }

  // Reconstruir desde la hoja
  const result = getDashboardOptimizado();
  result._cachedAt = new Date().toISOString();
  const json = JSON.stringify(result);

  // Chunkear y guardar
  const chunks = [];
  for (let i = 0; i < json.length; i += CACHE_CHUNK_SIZE) {
    chunks.push(json.substring(i, i + CACHE_CHUNK_SIZE));
  }
  const toCache = {};
  chunks.forEach((c, i) => { toCache[CACHE_KEY_CHUNK + i] = c; });
  toCache[CACHE_KEY_META] = JSON.stringify({ chunks: chunks.length, ts: Date.now() });
  try {
    cache.putAll(toCache, CACHE_TTL_SECONDS);
  } catch (e) {
    Logger.log('No se pudo cachear (probablemente demasiado grande): ' + e);
  }
  return json;
}

/**
 * Invalida la caché del dashboard.
 */
function clearDashboardCache() {
  const cache = CacheService.getScriptCache();
  const metaRaw = cache.get(CACHE_KEY_META);
  const claves = [CACHE_KEY_META];
  if (metaRaw) {
    try {
      const meta = JSON.parse(metaRaw);
      for (let i = 0; i < meta.chunks; i++) claves.push(CACHE_KEY_CHUNK + i);
    } catch (e) {}
  }
  cache.removeAll(claves);
  Logger.log('Caché eliminada (' + claves.length + ' claves)');
}

/**
 * Pre-calienta la caché. Ideal para programar como trigger horario.
 * Ejecutar manualmente la primera vez para que el primer usuario no espere.
 */
function warmCache() {
  clearDashboardCache();
  const t0 = Date.now();
  getDashboardJsonCached(true);
  Logger.log('Caché regenerada en ' + (Date.now() - t0) + 'ms');
}

// ============================================
// ENDPOINT PRINCIPAL
// ============================================
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || 'dashboard';

  try {
    if (action === 'dashboard') {
      const json = getDashboardJsonCached(false);
      return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'refresh') {
      const json = getDashboardJsonCached(true);
      return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'autores') {
      const result = getAutoresRanking();
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    const json = getDashboardJsonCached(false);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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

  // REVISTAS es la tabla maestra: construir registro de docentes y propagarlo a
  // todas las hojas (incluida REVISTAS) para que las filas con celdas vacías
  // en RELACION_LABORAL/GRADO ACADEMICO/etc. hereden los valores ya cargados
  // en otra fila del mismo docente.
  const registroDocentes = construirRegistroDocentes(revistas);
  enriquecerConRegistro(revistas, registroDocentes);
  enriquecerConRegistro(libros, registroDocentes);
  enriquecerConRegistro(capitulos, registroDocentes);

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
 * Normaliza un nombre de encabezado: trim + colapsar espacios internos + mayúsculas.
 */
function normalizarHeader(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/**
 * Detecta la fila de encabezados buscando la que contenga cualquiera de los encabezados `titulo` configurados.
 * Recorre las primeras 5 filas. Devuelve el índice 0-based, o null si no se encuentra.
 */
function detectarHeaderRow(data, tituloConfig) {
  const objetivos = (Array.isArray(tituloConfig) ? tituloConfig : [tituloConfig]).map(normalizarHeader);
  const limite = Math.min(data.length, 5);
  for (let i = 0; i < limite; i++) {
    const fila = data[i] || [];
    if (fila.some(c => objetivos.includes(normalizarHeader(c)))) return i;
  }
  return null;
}

/**
 * Lee una hoja y extrae solo los campos configurados
 */
function getHojaOptimizada(ss, nombreHoja) {
  const config = CAMPOS[nombreHoja];
  if (!config) return [];

  const sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) {
    Logger.log('[' + nombreHoja + '] Hoja no encontrada');
    return [];
  }

  const data = sheet.getDataRange().getValues();
  if (!data.length) return [];

  // Auto-detectar fila de encabezados; si no, usar la configurada
  let headerIdx = detectarHeaderRow(data, config.campos.titulo);
  if (headerIdx === null) headerIdx = config.headerRow - 1;

  const headers = (data[headerIdx] || []).map(normalizarHeader);
  const rows = data.slice(headerIdx + 1);

  // Crear mapa de índices para los campos que necesitamos (soporta múltiples candidatos por campo)
  const OPCIONALES_ENRIQUECIBLES = new Set(['relacionLaboral', 'gradoAcademico', 'facultad']);

  const indices = {};
  const faltantesCriticos = [];
  for (const [key, candidateHeaders] of Object.entries(config.campos)) {
    const list = Array.isArray(candidateHeaders) ? candidateHeaders : [candidateHeaders];
    let foundIdx = -1;
    for (const h of list) {
      const objetivo = normalizarHeader(h);
      const idx = headers.indexOf(objetivo);
      if (idx >= 0) {
        foundIdx = idx;
        break;
      }
    }
    indices[key] = foundIdx;
    if (foundIdx < 0 && !OPCIONALES_ENRIQUECIBLES.has(key) && ['titulo', 'autor'].includes(key)) {
      faltantesCriticos.push(list.join(' / '));
    }
  }

  if (faltantesCriticos.length) {
    Logger.log('[' + nombreHoja + '] Columnas críticas no encontradas: ' + faltantesCriticos.join(' | '));
  }
  if (indices.titulo < 0 || indices.autor < 0) {
    Logger.log('[' + nombreHoja + '] No se pudieron localizar titulo/autor. Encabezados leídos: ' + headers.join(' | '));
    return [];
  }
  
  // Extraer solo los campos necesarios
  const registros = [];
  rows.forEach((row, idx) => {
    // Si la fila tiene estado de registro y es BORRADOR, se omite del dashboard público
    if (indices.estadoRegistro >= 0) {
      const estadoReg = String(row[indices.estadoRegistro] || '').trim().toUpperCase();
      if (estadoReg === 'BORRADOR') return;
    }

    // Verificar que la fila tenga datos esenciales
    const tieneAutor = indices.autor >= 0 && row[indices.autor];
    const tieneTitulo = indices.titulo >= 0 && row[indices.titulo];
    
    if (tieneAutor && tieneTitulo) {
      const idReal = indices.idRecord >= 0 && row[indices.idRecord] ? String(row[indices.idRecord]).trim() : '';
      const registro = { id: idReal || (nombreHoja + '_' + idx) };
      if (idReal) registro.recordId = idReal;
      
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

      // Si no hay proyecto unificado pero sí columnas de investigación/vinculación
      if (!registro.proyecto) {
        const idxInv = headers.indexOf(normalizarHeader('TITULO_PROYECTO_INVESTIGACION'));
        const idxVin = headers.indexOf(normalizarHeader('TITULO_PROYECTO_VINCULACION'));
        const valInv = idxInv >= 0 ? String(row[idxInv] || '').trim() : '';
        const valVin = idxVin >= 0 ? String(row[idxVin] || '').trim() : '';
        if (valInv && valVin) registro.proyecto = valInv + ' / ' + valVin;
        else if (valInv) registro.proyecto = valInv;
        else if (valVin) registro.proyecto = valVin;
      }
      
      registros.push(registro);
    }
  });
  
  return registros;
}

/**
 * Construye un mapa identificacion -> datos laborales/académicos a partir de REVISTAS.
 * REVISTAS es la fuente autoritativa para RELACION_LABORAL y GRADO ACA..
 */
function construirRegistroDocentes(revistas) {
  const mapa = {};
  (revistas || []).forEach(r => {
    const id = (r.identificacion || '').toString().trim();
    if (!id) return;
    if (!mapa[id]) {
      mapa[id] = {
        nombre: r.autor || '',
        relacionLaboral: r.relacionLaboral || '',
        gradoAcademico: r.gradoAcademico || '',
        carrera: r.carrera || '',
        facultad: r.facultad || ''
      };
    } else {
      // Completar campos faltantes si una fila los trae
      const reg = mapa[id];
      if (!reg.relacionLaboral && r.relacionLaboral) reg.relacionLaboral = r.relacionLaboral;
      if (!reg.gradoAcademico && r.gradoAcademico) reg.gradoAcademico = r.gradoAcademico;
      if (!reg.carrera && r.carrera) reg.carrera = r.carrera;
      if (!reg.facultad && r.facultad) reg.facultad = r.facultad;
    }
  });
  return mapa;
}

/**
 * Enriquece publicaciones (libros/capítulos) con datos del registro de docentes
 * cuando la fila no trae relacionLaboral/gradoAcademico/facultad.
 */
function enriquecerConRegistro(publicaciones, registro) {
  (publicaciones || []).forEach(pub => {
    const id = (pub.identificacion || '').toString().trim();
    if (!id) return;
    const reg = registro[id];
    if (!reg) return;
    if (!pub.relacionLaboral && reg.relacionLaboral) pub.relacionLaboral = reg.relacionLaboral;
    if (!pub.gradoAcademico && reg.gradoAcademico) pub.gradoAcademico = reg.gradoAcademico;
    if (!pub.facultad && reg.facultad) pub.facultad = reg.facultad;
    if (!pub.carrera && reg.carrera) pub.carrera = reg.carrera;
  });
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

  const registro = construirRegistroDocentes(revistas);
  enriquecerConRegistro(revistas, registro);
  enriquecerConRegistro(libros, registro);
  enriquecerConRegistro(capitulos, registro);

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

/**
 * Diagnóstico específico para REVISTAS: dice qué fila tiene los encabezados,
 * qué columnas configuradas no se encontraron y cuenta filas con titulo+autor.
 * Ejecutar desde el editor de Apps Script.
 */
function debugRevistas() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('REVISTAS');
  if (!sheet) {
    Logger.log('❌ No existe la hoja REVISTAS. Hojas disponibles:');
    ss.getSheets().forEach(s => Logger.log('  - ' + s.getName()));
    return;
  }
  const data = sheet.getDataRange().getValues();
  Logger.log('Filas totales: ' + data.length);

  const config = CAMPOS.REVISTAS;
  const detectado = detectarHeaderRow(data, config.campos.titulo);
  Logger.log('headerRow configurado: ' + config.headerRow + '  (índice ' + (config.headerRow - 1) + ')');
  Logger.log('headerRow detectado automáticamente: ' + (detectado === null ? 'NO ENCONTRADO' : (detectado + 1) + ' (índice ' + detectado + ')'));

  // Mostrar las primeras 3 filas crudas
  for (let i = 0; i < Math.min(3, data.length); i++) {
    Logger.log('Fila ' + (i + 1) + ': ' + JSON.stringify(data[i].slice(0, 10)));
  }

  const headerIdx = detectado !== null ? detectado : (config.headerRow - 1);
  const headers = (data[headerIdx] || []).map(normalizarHeader);
  Logger.log('Encabezados normalizados: ' + headers.join(' | '));

  const faltantes = [];
  for (const [key, candidateHeaders] of Object.entries(config.campos)) {
    const list = Array.isArray(candidateHeaders) ? candidateHeaders : [candidateHeaders];
    const found = list.some(h => headers.indexOf(normalizarHeader(h)) >= 0);
    if (!found) faltantes.push(key + '=' + list.join('/'));
  }
  Logger.log('Columnas configuradas que NO se encontraron: ' + (faltantes.length ? faltantes.join(' , ') : 'ninguna'));

  const tituloList = (Array.isArray(config.campos.titulo) ? config.campos.titulo : [config.campos.titulo]).map(normalizarHeader);
  const autorList = (Array.isArray(config.campos.autor) ? config.campos.autor : [config.campos.autor]).map(normalizarHeader);
  const idxTitulo = headers.findIndex(h => tituloList.includes(h));
  const idxAutor = headers.findIndex(h => autorList.includes(h));
  let conTituloYAutor = 0;
  data.slice(headerIdx + 1).forEach(row => {
    if (idxTitulo >= 0 && idxAutor >= 0 && row[idxTitulo] && row[idxAutor]) conTituloYAutor++;
  });
  Logger.log('Filas con TITULO_PUBLICACION + APELLIDOS_NOMBRES llenos: ' + conTituloYAutor);
}

// ============================================
// ACTIVADORES AUTOMÁTICOS
// ============================================

/**
 * CONFIGURACIÓN RECOMENDADA (Ejecutar esta función una vez):
 * Combina dos mecanismos para que NUNCA tengas que editar la hoja manualmente:
 * 1. Activador onChange: Detecta al instante cualquier edición manual en la hoja.
 * 2. Activador por tiempo cada 5 minutos: Detecta automáticamente cualquier artículo
 *    o libro insertado por sistemas externos (como el backend de producción o formularios),
 *    los cuales Google Sheets NO notifica a través de onChange por diseño de seguridad.
 */
function activarSincronizacionAutomatica() {
  eliminarTriggers();

  // 1. Detectar cambios manuales en la hoja
  ScriptApp.newTrigger('warmCache')
    .forSpreadsheet(SpreadsheetApp.openById(SPREADSHEET_ID))
    .onChange()
    .create();

  // 2. Revisión automática periódica cada 5 minutos para capturar lo que agregue el sistema de producción
  ScriptApp.newTrigger('warmCache')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('✅ Sincronización automática configurada con éxito (onChange + cada 5 minutos)');
}

/**
 * Registra únicamente el activador onChange.
 */
function activarOnChange() {
  eliminarTriggers();

  ScriptApp.newTrigger('warmCache')
    .forSpreadsheet(SpreadsheetApp.openById(SPREADSHEET_ID))
    .onChange()
    .create();

  Logger.log('✅ Activador onChange configurado con éxito para la hoja: ' + SPREADSHEET_ID);
}

/**
 * Elimina todos los activadores asociados a este script.
 */
function eliminarTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('Activadores eliminados: ' + triggers.length);
}
