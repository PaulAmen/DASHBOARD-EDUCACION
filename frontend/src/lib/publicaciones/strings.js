// frontend/src/lib/publicaciones/strings.js

export function splitMultiValue(value) {
    return String(value || '')
        .split(' / ')
        .map(item => item.trim())
        .filter(Boolean);
}

export function normalizeTextKey(value) {
    return String(value || '')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeJournalKey(value) {
    return normalizeTextKey(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[“”"']/g, '')
        .replace(/[.,;:()[\]{}]/g, ' ')
        .replace(/\b(ISSN|EISSN|E-ISSN|ONLINE|EN LINEA|ON LINE|PRINT|IMPRESA|REVISTA)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
