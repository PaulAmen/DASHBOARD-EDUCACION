// frontend/src/lib/publicaciones/normalizar.js
import { splitMultiValue, normalizeTextKey } from './strings.js';
import { calcularPesosCapitulos, getPeso } from '../caces/index.js';

const CARRERA_ALIASES = new Map([
    ['PEDAGOGIA DE LOS IDIOMAS NACIONALES Y EXTRANJEROS PRESENCIAL', 'PEDAGOGIA DE LOS IDIOMAS PRESENCIAL'],
    ['PEDAGOGIA DE LOS IDIOMAS NACIONALES Y EXTRANJEROS ON LINE', 'PEDAGOGIA DE LOS IDIOMAS ON LINE'],
    ['CONTABILIDAD Y AUDITORIA', 'CONTABILIDAD Y AUDITORIA'],
    ['ADMINISTRACION DE EMPRESAS PRESENCIAL', 'ADMINISTRACION DE EMPRESAS'],
    ['TURISMO SEMIPRESENCIAL', 'TURISMO SEMI PRESENCIAL'],
    ['TURISMO-PRESENCIAL', 'TURISMO PRESENCIAL']
]);

function normalizarNombreCarrera(value) {
    const carrera = String(value || '').replace(/\s+/g, ' ').trim();
    if (!carrera) return '';
    return CARRERA_ALIASES.get(normalizeTextKey(carrera)) || carrera;
}

export function normalizarCampoCarrera(value) {
    return [...new Set(splitMultiValue(value).map(normalizarNombreCarrera).filter(Boolean))].join(' / ');
}

function mergeMultiValue(existingValue, nextValue) {
    const merged = [...splitMultiValue(existingValue), ...splitMultiValue(nextValue)];
    return [...new Set(merged)].join(' / ');
}

export function normalizarPublicaciones({ articulos = [], libros = [], capitulos = [] }) {
    const resultado = [];
    articulos.forEach(item => {
        resultado.push({
            ...item,
            carrera: normalizarCampoCarrera(item.carrera),
            tipo: 'articulo',
            tipoLabel: 'Artículo'
        });
    });
    libros.forEach(item => {
        resultado.push({
            ...item,
            carrera: normalizarCampoCarrera(item.carrera),
            tipo: 'libro',
            tipoLabel: 'Libro'
        });
    });
    capitulos.forEach(item => {
        resultado.push({
            ...item,
            carrera: normalizarCampoCarrera(item.carrera),
            tipo: 'capitulo',
            tipoLabel: 'Capítulo'
        });
    });

    // Precomputar peso CACES sobre el dataset COMPLETO una sola vez.
    // Esto asegura que TC (total de capítulos por libro) sea correcto
    // y que el peso de una publicación no cambie si se filtra el dataset.
    const pesosCapitulos = calcularPesosCapitulos(resultado);
    resultado.forEach(pub => {
        pub._peso = pub.tipo === 'capitulo'
            ? (pesosCapitulos.get(pub.id) || 0)
            : getPeso(pub);
    });

    return resultado;
}

export function deduplicarPorTitulo(publicaciones) {
    const titulosVistos = new Set();
    const unicas = [];
    for (const pub of publicaciones) {
        const tituloNormalizado = (pub.titulo || '').toLowerCase().trim();
        if (!titulosVistos.has(tituloNormalizado)) {
            titulosVistos.add(tituloNormalizado);
            unicas.push({ ...pub });
        } else {
            const pubExistente = unicas.find(p => (p.titulo || '').toLowerCase().trim() === tituloNormalizado);
            if (pubExistente) {
                const autorUnificado = mergeMultiValue(pubExistente.autor, pub.autor);
                const carreraUnificada = normalizarCampoCarrera(mergeMultiValue(pubExistente.carrera, pub.carrera));

                if (autorUnificado) pubExistente.autor = autorUnificado;
                if (carreraUnificada) pubExistente.carrera = carreraUnificada;
            }
        }
    }
    return unicas;
}
