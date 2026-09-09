// frontend/src/lib/publicaciones.js
// Re-exports para compatibilidad hacia atrás.
// El código vivo se movió a:
//   - src/lib/caces/*        (lógica de puntuación CACES)
//   - src/lib/publicaciones/* (normalización, filtrado, strings)

export {
    PESOS_CUARTIL,
    PESO_ACI,
    PESO_BR,
    PESO_LA,
    PESO_LIBRO,
    BONO_INTERCULTURAL,
    getCuartil,
    clasificarBaseDatosArticulo,
    esIntercultural,
    getPeso,
    getPesoLibro,
    calcularPesosCapitulos,
    esTitular,
    esPhD,
    normalizarNombre,
    claveDocente,
    construirMapaNombreId
} from './caces/index.js';

export {
    splitMultiValue,
    normalizeTextKey,
    normalizeJournalKey
} from './publicaciones/strings.js';

export {
    normalizarPublicaciones,
    deduplicarPorTitulo
} from './publicaciones/normalizar.js';

export {
    filtrarPublicaciones,
    includesMultiValueFlex
} from './publicaciones/filtrar.js';
