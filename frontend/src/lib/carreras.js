import { getCuartil, splitMultiValue } from './publicaciones.js';

export function calcularMetricasCarreras(publicaciones = []) {
    const carreras = {};

    publicaciones.forEach(pub => {
        const carrerasPub = [...new Set(splitMultiValue(pub.carrera))];
        if (!carrerasPub.length) return;

        const peso = pub._peso || 0;

        carrerasPub.forEach(nombre => {
            if (!carreras[nombre]) {
                carreras[nombre] = {
                    nombre,
                    articulos: 0,
                    libros: 0,
                    capitulos: 0,
                    total: 0,
                    puntos: 0,
                    Q1: 0, Q2: 0, Q3: 0, Q4: 0
                };
            }

            carreras[nombre].puntos += peso;

            if (pub.tipo === 'articulo') carreras[nombre].articulos++;
            else if (pub.tipo === 'libro') carreras[nombre].libros++;
            else if (pub.tipo === 'capitulo') carreras[nombre].capitulos++;

            carreras[nombre].total = carreras[nombre].articulos + carreras[nombre].libros + carreras[nombre].capitulos;

            const cuartil = getCuartil(pub);
            if (cuartil) carreras[nombre][cuartil]++;
        });
    });

    return Object.values(carreras)
        .map(c => ({ ...c, puntos: Math.round(c.puntos * 100) / 100 }))
        .sort((a, b) => {
            if (b.puntos !== a.puntos) return b.puntos - a.puntos;
            if (b.total !== a.total) return b.total - a.total;
            return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        })
        .map((carrera, index) => ({ ...carrera, rank: index + 1 }));
}

function decorateCarrera(carrera, extra = {}) {
    return {
        ...carrera,
        omittedMarker: false,
        selected: false,
        omittedCount: 0,
        ...extra
    };
}

export function ordenarCarrerasPorTotal(carreras = []) {
    return [...carreras].sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
}

export function prepararCarrerasComparativa(carreras = [], selectedCarrera = '', limit = 8) {
    const safeLimit = Math.max(Number(limit) || 0, 0);
    if (!safeLimit) return [];
    const carrerasOrdenadas = ordenarCarrerasPorTotal(carreras);

    const selectedIndex = carrerasOrdenadas.findIndex(carrera => carrera.nombre === selectedCarrera);

    if (
        carrerasOrdenadas.length <= safeLimit ||
        !selectedCarrera ||
        selectedIndex === -1 ||
        selectedIndex < safeLimit
    ) {
        return carrerasOrdenadas
            .slice(0, safeLimit)
            .map(carrera => decorateCarrera(carrera, { selected: carrera.nombre === selectedCarrera }));
    }

    if (safeLimit === 1) {
        return [decorateCarrera(carrerasOrdenadas[selectedIndex], { selected: true })];
    }

    const visibleTopCount = Math.max(safeLimit - 2, 0);
    const omittedCount = Math.max(selectedIndex - visibleTopCount, 1);

    return [
        ...carrerasOrdenadas
            .slice(0, visibleTopCount)
            .map(carrera => decorateCarrera(carrera)),
        decorateCarrera({
            nombre: `⋯ +${omittedCount}`,
            articulos: 0,
            libros: 0,
            capitulos: 0,
            total: 0,
            puntos: 0,
            Q1: 0,
            Q2: 0,
            Q3: 0,
            Q4: 0
        }, {
            omittedMarker: true,
            omittedCount
        }),
        decorateCarrera(carrerasOrdenadas[selectedIndex], { selected: true })
    ];
}
