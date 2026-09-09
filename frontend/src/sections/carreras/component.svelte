<script>
    import Chart from './chart.svelte';
    import { dataStore } from '../../data/store.svelte.js';
    import { filters, toggleCarrera } from '../../stores/filters.svelte.js';
    import { filtrarPublicaciones } from '../../lib/publicaciones/filtrar.js';
    import { calcularMetricasCarreras } from '../../lib/carreras.js';

    let publicaciones = $derived(filtrarPublicaciones(dataStore.publicaciones, {
        tipo: filters.tipo,
        cuartil: filters.cuartil,
        docente: filters.docente,
        revista: filters.revista,
        query: filters.query
    }));
    let carreras = $derived(calcularMetricasCarreras(publicaciones));
</script>

<section class="mb-8">
    <Chart {carreras} selectedCarrera={filters.carrera} onSelect={toggleCarrera} />
</section>
