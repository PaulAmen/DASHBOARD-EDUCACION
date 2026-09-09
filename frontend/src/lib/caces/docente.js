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

export function esIdentificacionValida(id) {
    const s = String(id || '').trim();
    if (!s) return false;
    if (['DOCENTE', 'AUTOR', 'N/A', 'SIN CEDULA', 'NULL', 'UNDEFINED'].includes(s.toUpperCase())) return false;
    return /\d/.test(s);
}

export function construirMapaNombreId(publicaciones) {
    const mapa = new Map();
    (publicaciones || []).forEach(pub => {
        const id = (pub.identificacion || '').toString().trim();
        const nombre = normalizarNombre(pub.autor);
        if (esIdentificacionValida(id) && nombre && !mapa.has(nombre)) {
            mapa.set(nombre, id);
        }
    });
    return mapa;
}

export function claveDocente(pub, mapaNombreId) {
    const id = (pub.identificacion || '').toString().trim();
    if (esIdentificacionValida(id)) return 'ID:' + id;
    const nombre = normalizarNombre(pub.autor);
    const idResuelto = mapaNombreId ? mapaNombreId.get(nombre) : null;
    if (idResuelto) return 'ID:' + idResuelto;
    return 'N:' + nombre;
}
