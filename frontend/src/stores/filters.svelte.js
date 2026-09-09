export const filters = $state({
    tipo: [],        // array para multiselección
    cuartil: [],     // array para multiselección
    carrera: '',
    docente: '',
    docenteId: '',
    revista: '',
    query: ''
});

export function clearFilters() {
    filters.tipo = [];
    filters.cuartil = [];
    filters.carrera = '';
    filters.docente = '';
    filters.docenteId = '';
    filters.revista = '';
    filters.query = '';
}

export function clearDocente() {
    filters.docente = '';
    filters.docenteId = '';
}

export function clearTipoFilters() {
    filters.tipo = [];
    filters.cuartil = [];
}

export function selectDocente(nombre, identificacion = '') {
    const cleanId = String(identificacion || '').trim();
    if (filters.docente === nombre || (cleanId && filters.docenteId === cleanId)) {
        filters.docente = '';
        filters.docenteId = '';
    } else {
        filters.docente = nombre;
        filters.docenteId = cleanId;
    }
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
        !!filters.docenteId ||
        !!filters.revista ||
        !!filters.query
    );
}
