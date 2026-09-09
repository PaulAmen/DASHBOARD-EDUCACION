// frontend/src/lib/caces/capitulos.js

/**
 * Calcula los pesos de capítulos como CL/TC repartido fila por fila.
 * Cada fila única (autor × capítulo × libroPadre) suma 1/TC al autor.
 * Filas duplicadas reciben peso 0 para no inflar.
 *
 * @param {Array} publicaciones - array completo (articulos, libros, capítulos)
 * @returns {Map<string, number>} id → peso
 */
export function calcularPesosCapitulos(publicaciones) {
    const capitulos = (publicaciones || []).filter(p => p.tipo === 'capitulo');

    const norm = v => String(v || '').replace(/\s+/g, ' ').trim().toUpperCase();

    // TC: capítulos únicos por libro
    const tcPorLibro = new Map();
    capitulos.forEach(p => {
        const libro = norm(p.libroPadre);
        const titulo = norm(p.titulo);
        if (!libro || !titulo) return;
        if (!tcPorLibro.has(libro)) tcPorLibro.set(libro, new Set());
        tcPorLibro.get(libro).add(titulo);
    });

    // Asignar 1/TC a la primera ocurrencia única; 0 a duplicados
    const pesos = new Map();
    const yaContado = new Set();
    capitulos.forEach(p => {
        const libro = norm(p.libroPadre);
        const titulo = norm(p.titulo);
        const autor = norm(p.autor);
        if (!libro || !titulo || !autor) { pesos.set(p.id, 0); return; }
        const clave = libro + '||' + autor + '||' + titulo;
        if (yaContado.has(clave)) { pesos.set(p.id, 0); return; }
        yaContado.add(clave);
        const tc = tcPorLibro.get(libro)?.size || 0;
        pesos.set(p.id, tc > 0 ? 1 / tc : 0);
    });

    return pesos;
}
