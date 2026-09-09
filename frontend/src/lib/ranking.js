// frontend/src/lib/ranking.js
import { getCuartil } from './caces/index.js';
import { claveDocente, construirMapaNombreId, esTitular, esPhD, normalizarNombre, esIdentificacionValida } from './caces/docente.js';

export function calcularRanking(todasLasPubs) {
    const docentes = {};
    const mapaNombreId = construirMapaNombreId(todasLasPubs);

    (todasLasPubs || []).forEach(pub => {
        const autor = pub.autor;
        if (!autor) return;

        const clave = claveDocente(pub, mapaNombreId);
        const nombre = autor.trim();
        const rawId = (pub.identificacion || '').toString().trim();
        const idResuelto = (esIdentificacionValida(rawId) ? rawId : '') || (mapaNombreId ? mapaNombreId.get(normalizarNombre(autor)) : '') || (clave.startsWith('ID:') ? clave.slice(3) : '');

        if (!docentes[clave]) {
            docentes[clave] = {
                clave,
                nombre,
                identificacion: idResuelto,
                articulos: 0,
                libros: 0,
                capitulos: 0,
                total: 0,
                puntos: 0,
                Q1: 0, Q2: 0, Q3: 0, Q4: 0,
                isTitular: false,
                isPhD: false,
                _titulos: new Set()
            };
        } else if (!docentes[clave].identificacion && idResuelto) {
            docentes[clave].identificacion = idResuelto;
        }

        if (esTitular(pub)) docentes[clave].isTitular = true;
        if (esPhD(pub)) docentes[clave].isPhD = true;

        const tituloNorm = (pub.titulo || '').toLowerCase().trim();
        if (tituloNorm && docentes[clave]._titulos.has(tituloNorm)) {
            return;
        }
        if (tituloNorm) docentes[clave]._titulos.add(tituloNorm);

        docentes[clave].puntos += (pub._peso || 0);
        if (pub.tipo === 'articulo') docentes[clave].articulos++;
        else if (pub.tipo === 'libro') docentes[clave].libros++;
        else if (pub.tipo === 'capitulo') docentes[clave].capitulos++;
        docentes[clave].total = docentes[clave].articulos + docentes[clave].libros + docentes[clave].capitulos;

        const q = getCuartil(pub);
        if (q) docentes[clave][q]++;
    });

    return Object.values(docentes)
        .map(d => {
            const { _titulos, ...rest } = d;
            return { ...rest, puntos: Math.round(rest.puntos * 100) / 100 };
        })
        .sort((a, b) => b.puntos - a.puntos || b.total - a.total)
        .map((d, i) => ({ ...d, rank: i + 1 }));
}
