// frontend/src/lib/api.js
import { API_URL } from './config.js';

export async function fetchDashboard(refresh = true) {
    const action = refresh ? 'refresh' : 'dashboard';
    const separator = API_URL.includes('?') ? '&' : '?';
    const response = await fetch(`${API_URL}${separator}action=${action}&_t=${Date.now()}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return {
        articulos: data.publicaciones?.articulos || [],
        libros:    data.publicaciones?.libros    || [],
        capitulos: data.publicaciones?.capitulos || []
    };
}
