// frontend/src/data/store.svelte.js
import { fetchDashboard } from '../lib/api.js';
import { toViewModel, toViewModelFromNormalized } from './adapter.js';
import { publicacionesDemo } from '../lib/demoData.js';

export const dataStore = $state({
    loading: true,
    error: null,
    publicaciones: [],
    publicacionesRaw: [],
    topDocentes: []
});

export async function loadData(refresh = false) {
    dataStore.loading = true;
    dataStore.error = null;
    try {
        const payload = await fetchDashboard(refresh);
        const vm = toViewModel(payload);
        dataStore.publicacionesRaw = vm.publicacionesRaw;
        dataStore.publicaciones = vm.publicaciones;
        dataStore.topDocentes = vm.topDocentes;
    } catch (err) {
        console.error('Error cargando datos:', err);
        dataStore.error = err;
        const demoVm = toViewModelFromNormalized(publicacionesDemo);
        dataStore.publicacionesRaw = demoVm.publicacionesRaw;
        dataStore.publicaciones = demoVm.publicaciones;
        dataStore.topDocentes = demoVm.topDocentes;
    } finally {
        dataStore.loading = false;
    }
}

export async function refreshData() {
    return loadData(true);
}
