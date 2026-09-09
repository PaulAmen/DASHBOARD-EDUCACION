export const filters = $state({
    tipo: [],        // array para multiselección
    cuartil: [],     // array para multiselección
    carrera: '',
    docente: '',
    revista: '',
    query: ''
});

export function clearFilters() {
    filters.tipo = [];
    filters.cuartil = [];
    filters.carrera = '';
    filters.docente = '';
    filters.revista = '';
    filters.query = '';
}

export function clearTipoFilters() {
    filters.tipo = [];
    filters.cuartil = [];
}

export function selectDocente(nombre) {
    filters.docente = filters.docente === nombre ? '' : nombre;
}

export function toggleTipo(tipo) {
    if (filters.tipo.includes(tipo)) {
        filters.tipo = filters.tipo.filter(t => t !== tipo);
        if (tipo === 'articulo') {
            filters.cuartil = [];
        }
    } else {
        filters.tipo = [...filters.tipo, tipo];
    }
}

export function toggleCuartil(cuartil) {
    if (!filters.tipo.includes('articulo')) {
        filters.tipo = [...filters.tipo, 'articulo'];
    }

    if (filters.cuartil.includes(cuartil)) {
        filters.cuartil = filters.cuartil.filter(q => q !== cuartil);
    } else {
        filters.cuartil = [...filters.cuartil, cuartil];
    }
}

export function toggleCarrera(carrera) {
    filters.carrera = filters.carrera === carrera ? '' : carrera;
}

export function selectRevista(revista) {
    filters.revista = filters.revista === revista ? '' : revista;
}

export function isActive() {
    return (
        filters.tipo.length > 0 ||
        filters.cuartil.length > 0 ||
        !!filters.carrera ||
        !!filters.docente ||
        !!filters.revista ||
        !!filters.query
    );
}
