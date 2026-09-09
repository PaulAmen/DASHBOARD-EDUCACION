// frontend/src/lib/publicaciones/filtrar.js
import { getCuartil } from '../caces/index.js';
import { splitMultiValue, normalizeTextKey, normalizeJournalKey } from './strings.js';

function includesMultiValueFlex(value, expected) {
    const target = normalizeTextKey(expected);
    if (!target) return false;
    return splitMultiValue(value).some(item => normalizeTextKey(item) === target);
}

export { includesMultiValueFlex };

function toArrayFilter(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (!value || value === 'todos') return [];
    return [value];
}

export function filtrarPublicaciones(publicaciones, { tipo, cuartil, docente, carrera, revista, query } = {}) {
    let resultado = [...publicaciones];

    const tipos = toArrayFilter(tipo);
    if (tipos.length > 0) {
        resultado = resultado.filter(p => tipos.includes(p.tipo));
    }

    const cuartiles = toArrayFilter(cuartil);
    if (cuartiles.length > 0) {
        resultado = resultado.filter(p => cuartiles.includes(getCuartil(p)));
    }

    if (docente) {
        // Match tolerante para variaciones de espacios/mayúsculas/acentos sutiles
        resultado = resultado.filter(p => includesMultiValueFlex(p.autor, docente));
    }
    if (carrera) {
        resultado = resultado.filter(p => includesMultiValueFlex(p.carrera, carrera));
    }
    if (revista) {
        const revistaKey = normalizeJournalKey(revista);
        resultado = resultado.filter(p => normalizeJournalKey(p.revista) === revistaKey);
    }
    if (query) {
        const q = query.toLowerCase();
        resultado = resultado.filter(p =>
            (p.titulo || '').toLowerCase().includes(q) ||
            (p.autor || '').toLowerCase().includes(q) ||
            (p.carrera || '').toLowerCase().includes(q) ||
            (p.revista || '').toLowerCase().includes(q) ||
            (p.libroPadre || '').toLowerCase().includes(q)
        );
    }
    return resultado;
}
