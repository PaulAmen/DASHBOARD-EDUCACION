// frontend/src/lib/caces/docente.js

function normalizarTexto(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .trim();
}

export function normalizarNombre(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

export function esTitular(pub) {
    const v = normalizarTexto(pub?.relacionLaboral);
    if (!v) return false;
    if (v.includes('NO TITULAR') || v.includes('NOTITULAR')) return false;
    return v.includes('TITULAR');
}

export function esPhD(pub) {
    const v = normalizarTexto(pub?.gradoAcademico);
    if (!v) return false;
    return (
        /\bPH\.?\s*D\.?\b/.test(v) ||
        /\bPHD\b/.test(v) ||
        /\bDR\.?\b/.test(v) ||
        v.includes('DOCTOR') ||
        v.includes('DOCTORADO')
    );
}

export function construirMapaNombreId(publicaciones) {
    const mapa = new Map();
    (publicaciones || []).forEach(pub => {
        const id = (pub.identificacion || '').toString().trim();
        const nombre = normalizarNombre(pub.autor);
        if (id && nombre && !mapa.has(nombre)) mapa.set(nombre, id);
    });
    return mapa;
}

export function claveDocente(pub, mapaNombreId) {
    const id = (pub.identificacion || '').toString().trim();
    if (id) return 'ID:' + id;
    const nombre = normalizarNombre(pub.autor);
    const idResuelto = mapaNombreId ? mapaNombreId.get(nombre) : null;
    if (idResuelto) return 'ID:' + idResuelto;
    return 'N:' + nombre;
}
