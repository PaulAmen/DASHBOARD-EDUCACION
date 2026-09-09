<script>
    import { onMount } from 'svelte';
    import Header from './dashboard/Header.svelte';
    import LoadingOverlay from './dashboard/LoadingOverlay.svelte';
    import ScrollTopButton from './dashboard/ScrollTopButton.svelte';
    import Footer from './dashboard/Footer.svelte';
    import LazySection from './LazySection.svelte';

    import { dataStore, loadData } from '../data/store.svelte.js';
    import { filters } from '../stores/filters.svelte.js';
    import { filtrarPublicaciones, splitMultiValue } from '../lib/publicaciones.js';
    import { sections } from '../sections/registry.js';

    // Derived from dataStore
    let totalPublicaciones = $derived(dataStore.publicaciones.length);
    let totalDocentes = $derived(dataStore.topDocentes.length);

    let publicacionesParaCarreras = $derived(filtrarPublicaciones(dataStore.publicaciones, {
        tipo: filters.tipo,
        cuartil: filters.cuartil,
        docente: filters.docente,
        revista: filters.revista,
        query: filters.query
    }));

    let carrerasDisponibles = $derived.by(() => {
        const carreras = new Set(publicacionesParaCarreras.flatMap(pub => splitMultiValue(pub.carrera)));
        if (filters.carrera) carreras.add(filters.carrera);

        return [...carreras]
            .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    });

    onMount(async () => {
        await loadData();
    });
</script>

<Header
    {carrerasDisponibles}
    {totalPublicaciones}
    {totalDocentes}
/>

<LoadingOverlay loading={dataStore.loading} />

<main class="container mx-auto px-4 pt-4 pb-16 flex-1">
    {#each sections as section}
        <LazySection
            loader={section.loader}
            label={section.label}
            minHeight={section.minHeight}
            rootMargin={section.rootMargin}
        />
    {/each}
</main>

<ScrollTopButton />
<Footer />
