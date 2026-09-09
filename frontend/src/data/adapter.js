// frontend/src/data/adapter.js
// Único lugar que conoce la forma del JSON del backend.

import { normalizarPublicaciones, deduplicarPorTitulo } from '../lib/publicaciones.js';
import { calcularRanking } from '../lib/ranking.js';

function processPublicaciones(publicacionesRaw) {
    return {
        publicacionesRaw,
        publicaciones: deduplicarPorTitulo(publicacionesRaw),
        topDocentes: calcularRanking(publicacionesRaw)
    };
}

export function toViewModel(apiPayload) {
    // fetchDashboard ya retorna { articulos, libros, capitulos }
    const grouped = {
        articulos: apiPayload.articulos || [],
        libros:    apiPayload.libros    || [],
        capitulos: apiPayload.capitulos || []
    };

    const publicacionesRaw = normalizarPublicaciones(grouped);
    const result = processPublicaciones(publicacionesRaw);

    return {
        ...result,
        meta: {
            source: 'api',
            totalArticulos: grouped.articulos.length,
            totalLibros: grouped.libros.length,
            totalCapitulos: grouped.capitulos.length
        }
    };
}

export function toViewModelFromNormalized(publicacionesRaw) {
    return {
        ...processPublicaciones(publicacionesRaw),
        meta: { source: 'demo' }
    };
}
