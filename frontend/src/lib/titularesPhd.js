// frontend/src/lib/titularesPhd.js
import { getCuartil, esTitular, esPhD } from './caces/index.js';
import { claveDocente, construirMapaNombreId, normalizarNombre } from './caces/docente.js';
import { splitMultiValue } from './publicaciones/strings.js';

function construirClavesTitularesPhd(publicaciones, mapaNombreId) {
    const claves = new Set();
    const metadatos = {};

    (publicaciones || []).forEach(pub => {
        if (!esTitular(pub) || !esPhD(pub)) return;

        const clave = claveDocente(pub, mapaNombreId);
        if (!clave) return;

        claves.add(clave);
        if (!metadatos[clave]) {
            metadatos[clave] = {
                nombre: (pub.autor || '').trim(),
                identificacion: (pub.identificacion || '').toString().trim(),
                carrera: pub.carrera || '',
                facultad: pub.facultad || '',
                gradoAcademico: pub.gradoAcademico || ''
            };
        }
    });

    return { claves, metadatos };
}

function construirContextoTitulares(publicaciones, publicacionesBase = publicaciones) {
    const todas = [...(publicacionesBase || []), ...(publicaciones || [])];
    const mapaNombreId = construirMapaNombreId(todas);
    const { claves, metadatos } = construirClavesTitularesPhd(publicacionesBase, mapaNombreId);

    return { mapaNombreId, clavesTitularesPhd: claves, metadatosTitularesPhd: metadatos };
}

export function filtrarTitularesPhd(publicaciones, publicacionesBase = publicaciones) {
    const { mapaNombreId, clavesTitularesPhd } = construirContextoTitulares(publicaciones, publicacionesBase);

    return (publicaciones || []).filter(pub => {
        const clave = claveDocente(pub, mapaNombreId);
        return clave && clavesTitularesPhd.has(clave);
    });
}

export function calcularRankingTitularesPhd(publicaciones, publicacionesBase = publicaciones) {
    const docentes = {};
    const { mapaNombreId, clavesTitularesPhd, metadatosTitularesPhd } = construirContextoTitulares(publicaciones, publicacionesBase);

    (publicaciones || []).forEach(pub => {
        const clave = claveDocente(pub, mapaNombreId);
        if (!clave || !clavesTitularesPhd.has(clave)) return;

        const nombre = (pub.autor || '').trim();
        const meta = metadatosTitularesPhd[clave] || {};

        if (!docentes[clave]) {
            docentes[clave] = {
                clave,
                nombre: nombre || meta.nombre || '',
                identificacion: (pub.identificacion || '').toString().trim() || meta.identificacion || '',
                carrera: pub.carrera || meta.carrera || '',
                facultad: pub.facultad || meta.facultad || '',
                gradoAcademico: pub.gradoAcademico || meta.gradoAcademico || '',
                articulos: 0,
                libros: 0,
                capitulos: 0,
                total: 0,
                puntos: 0,
                Q1: 0, Q2: 0, Q3: 0, Q4: 0
            };
        }

        const reg = docentes[clave];
        reg.puntos += (pub._peso || 0);
        if (pub.tipo === 'articulo') reg.articulos++;
        else if (pub.tipo === 'libro') reg.libros++;
        else if (pub.tipo === 'capitulo') reg.capitulos++;
        reg.total = reg.articulos + reg.libros + reg.capitulos;

        const q = getCuartil(pub);
        if (pub.tipo === 'articulo' && q) reg[q]++;
    });

    return Object.values(docentes)
        .map(d => ({ ...d, puntos: Math.round(d.puntos * 100) / 100 }))
        .sort((a, b) => b.puntos - a.puntos || b.total - a.total)
        .map((d, i) => ({ ...d, rank: i + 1 }));
}

import { deduplicarPorTitulo } from './publicaciones/normalizar.js';

export function calcularMetricasTitularesPhd(publicaciones, publicacionesBase = publicaciones) {
    const pubsFiltradas = filtrarTitularesPhd(publicaciones, publicacionesBase);
    const pubsFiltradasUnicas = deduplicarPorTitulo(pubsFiltradas);
    const articulosFiltrados = pubsFiltradasUnicas.filter(pub => pub.tipo === 'articulo');
    const ranking = calcularRankingTitularesPhd(publicaciones, publicacionesBase);

    const distribucionCuartil = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, SC: 0 };
    const distribucionTipoBase = {};
    const porPeriodo = {};
    const porCarrera = {};

    pubsFiltradasUnicas.forEach(pub => {
        if (pub.tipo === 'articulo') {
            const q = getCuartil(pub);
            if (q) distribucionCuartil[q]++;
            else distribucionCuartil.SC++;

            const tb = (pub.tipoBaseDatos || '').toString().trim().toUpperCase() || 'SIN CLASIFICAR';
            distribucionTipoBase[tb] = (distribucionTipoBase[tb] || 0) + 1;
        }

        const periodo = (pub.periodoAcademico || '').toString().trim() || 'Sin periodo';
        if (!porPeriodo[periodo]) porPeriodo[periodo] = { periodo, articulos: 0, libros: 0, capitulos: 0, total: 0 };
        if (pub.tipo === 'articulo') porPeriodo[periodo].articulos++;
        else if (pub.tipo === 'libro') porPeriodo[periodo].libros++;
        else if (pub.tipo === 'capitulo') porPeriodo[periodo].capitulos++;
        porPeriodo[periodo].total++;

        splitMultiValue(pub.carrera).forEach(carr => {
            if (!porCarrera[carr]) porCarrera[carr] = { carrera: carr, total: 0 };
            porCarrera[carr].total++;
        });
    });

    const totalPubs = pubsFiltradasUnicas.length;
    const totalArticulos = articulosFiltrados.length;
    const q1q2 = distribucionCuartil.Q1 + distribucionCuartil.Q2;

    return {
        totalDocentes: ranking.length,
        totalPublicaciones: totalPubs,
        totalArticulos,
        porcentajeQ1Q2: totalArticulos > 0 ? (q1q2 / totalArticulos) * 100 : 0,
        distribucionCuartil,
        distribucionTipoBase: Object.entries(distribucionTipoBase)
            .map(([tipo, count]) => ({ tipo, count }))
            .sort((a, b) => b.count - a.count),
        ranking,
        porPeriodo: Object.values(porPeriodo).sort((a, b) => a.periodo.localeCompare(b.periodo, 'es')),
        porCarrera: Object.values(porCarrera).sort((a, b) => b.total - a.total)
    };
}
