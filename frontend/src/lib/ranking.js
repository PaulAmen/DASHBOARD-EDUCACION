// frontend/src/lib/ranking.js
import { getCuartil } from './caces/index.js';
import { claveDocente, construirMapaNombreId, esTitular, esPhD } from './caces/docente.js';

export function calcularRanking(todasLasPubs) {
    const docentes = {};
    const mapaNombreId = construirMapaNombreId(todasLasPubs);

    (todasLasPubs || []).forEach(pub => {
        const autor = pub.autor;
        if (!autor) return;

        const clave = claveDocente(pub, mapaNombreId);
        const nombre = autor.trim();

        if (!docentes[clave]) {
            docentes[clave] = {
                clave,
                nombre,
                identificacion: (pub.identificacion || '').toString().trim(),
                articulos: 0,
                libros: 0,
                capitulos: 0,
                total: 0,
                puntos: 0,
                Q1: 0, Q2: 0, Q3: 0, Q4: 0,
                isTitular: false,
                isPhD: false
            };
        }

        if (esTitular(pub)) docentes[clave].isTitular = true;
        if (esPhD(pub)) docentes[clave].isPhD = true;

        docentes[clave].puntos += (pub._peso || 0);
        if (pub.tipo === 'articulo') docentes[clave].articulos++;
        else if (pub.tipo === 'libro') docentes[clave].libros++;
        else if (pub.tipo === 'capitulo') docentes[clave].capitulos++;
        docentes[clave].total = docentes[clave].articulos + docentes[clave].libros + docentes[clave].capitulos;

        const q = getCuartil(pub);
        if (q) docentes[clave][q]++;
    });

    return Object.values(docentes)
        .map(d => ({ ...d, puntos: Math.round(d.puntos * 100) / 100 }))
        .sort((a, b) => b.puntos - a.puntos || b.total - a.total)
        .map((d, i) => ({ ...d, rank: i + 1 }));
}
