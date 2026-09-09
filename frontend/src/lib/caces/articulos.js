// frontend/src/lib/caces/articulos.js
import { PESOS_CUARTIL } from './pesos.js';

export function getCuartil(pub) {
    const val = String(pub?.cuartil || '').toUpperCase().trim();
    if (!val || val === 'NO APLICA') return '';

    // Formato Q1, Q 1, NAQ1, etc.
    const matchQ = val.match(/Q\s*([1-4])/);
    if (matchQ) return `Q${matchQ[1]}`;

    // Formato "4" o "CUARTIL 4"
    const matchD = val.match(/(?:CUARTIL\s*)?([1-4])$/);
    if (matchD) return `Q${matchD[1]}`;

    return '';
}

export function clasificarBaseDatosArticulo(pub) {
    const REGEX_ACI = /(SCOPUS|WEB\s*OF\s*SCIENCE|\bWOS\b)/i;
    const REGEX_BR = /(SCIELO|REDALYC|DIALNET|DOAJ|LILACS|EBSCO|CLASE|PERIODICA|ERIH\s*PLUS|ERIHPLUS)/i;
    const REGEX_LA = /LATINDEX/i;

    const bd = String(pub?.baseDatos || '');
    if (REGEX_ACI.test(bd)) return 'ACI';
    if (REGEX_BR.test(bd)) return 'BR';
    if (REGEX_LA.test(bd)) return 'LA';

    const tipo = String(pub?.tipoBaseDatos || '').toUpperCase().trim();
    if (tipo === 'MUNDIAL') return 'ACI';
    if (tipo === 'REGIONAL') return 'BR';

    return null;
}

export function esIntercultural(pub) {
    const v = String(pub?.interculturalidad || '').toUpperCase().trim();
    return v === 'SI' || v === 'SÍ' || v === 'YES';
}

export function getPesoArticulo(pub) {
    const q = getCuartil(pub);
    if (PESOS_CUARTIL[q] !== undefined) {
        return PESOS_CUARTIL[q];
    }
    // SciELO, Latindex, Redalyc y otros sin cuartil Q1-Q4
    return 2;
}
