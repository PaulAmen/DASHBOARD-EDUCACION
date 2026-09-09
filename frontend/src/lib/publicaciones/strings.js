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

export function normalizePersonName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenSimilarity(tokA, tokB) {
    if (tokA === tokB) return true;
    if (tokA.startsWith(tokB) || tokB.startsWith(tokA)) {
        if (Math.abs(tokA.length - tokB.length) <= 2) return true;
    }
    if (tokA === 'STEFANIA' && tokB === 'ESTEFANIA') return true;
    if (tokB === 'STEFANIA' && tokA === 'ESTEFANIA') return true;
    return false;
}

export function isSamePerson(nameA, nameB) {
    const normA = normalizePersonName(nameA);
    const normB = normalizePersonName(nameB);
    if (!normA || !normB) return false;
    if (normA === normB) return true;

    const tokensA = normA.split(' ').filter(t => t.length > 1);
    const tokensB = normB.split(' ').filter(t => t.length > 1);

    if (tokensA.length === tokensB.length) {
        const sortedA = [...tokensA].sort();
        const sortedB = [...tokensB].sort();
        if (sortedA.every((t, i) => tokenSimilarity(t, sortedB[i]))) return true;
    }

    const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
    if (shorter.length >= 2 && (shorter.length / longer.length) >= 0.7) {
        const allMatched = shorter.every(sTok => longer.some(lTok => tokenSimilarity(sTok, lTok)));
        if (allMatched) return true;
    }

    return false;
}
