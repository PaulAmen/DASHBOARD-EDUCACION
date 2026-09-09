// frontend/src/lib/caces/index.js
// Coordinador del dominio CACES

export {
    PESOS_CUARTIL,
    PESO_ACI,
    PESO_BR,
    PESO_LA,
    PESO_LIBRO,
    BONO_INTERCULTURAL
} from './pesos.js';

export {
    getCuartil,
    clasificarBaseDatosArticulo,
    esIntercultural,
    getPesoArticulo
} from './articulos.js';

export { getPesoLibro } from './libros.js';
export { calcularPesosCapitulos } from './capitulos.js';
export { esTitular, esPhD, normalizarNombre, claveDocente, construirMapaNombreId } from './docente.js';

import { getPesoArticulo } from './articulos.js';
import { getPesoLibro } from './libros.js';

/**
 * Peso para artículos y libros. Para capítulos, devuelve 0 — el peso real
 * depende del contexto global (CL/TC) y se calcula con calcularPesosCapitulos().
 */
export function getPeso(pub) {
    if (pub.tipo === 'articulo') return getPesoArticulo(pub);
    if (pub.tipo === 'libro') return getPesoLibro(pub);
    return 0;
}
