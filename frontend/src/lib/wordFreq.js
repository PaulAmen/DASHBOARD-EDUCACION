// frontend/src/lib/wordFreq.js
export const stopWords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'y', 'e', 'o', 'u', 'de', 'del', 'a', 'al', 'en', 'con',
    'por', 'para', 'su', 'sus', 'que', 'se', 'lo', 'si', 'no',
    'esta', 'este', 'esto', 'como', 'entre', 'sobre', 'desde',
    'hasta', 'durante', 'mediante', 'ante', 'bajo', 'tras',
    'analisis', 'estudio', 'estrategia', 'investigacion',
    'desarrollo', 'impacto', 'caso', 'proceso', 'univeridad',
    'estatal', 'sur', 'manabi', 'educacion', 'carrera',
    'docentes', 'estudiantes', 'instituciones', 'educativas', 'hacia'
]);

export function generarWordFreq(publicaciones, max = 40) {
    const counts = {};

    publicaciones.forEach(pub => {
        const words = (pub.titulo || '').toLowerCase()
            .replace(/[.,:;()!¡?¿]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));

        words.forEach(w => {
            counts[w] = (counts[w] || 0) + 1;
        });
    });

    return Object.entries(counts)
        .map(([text, size]) => ({ text: text.toUpperCase(), size }))
        .sort((a, b) => b.size - a.size)
        .slice(0, max);
}
