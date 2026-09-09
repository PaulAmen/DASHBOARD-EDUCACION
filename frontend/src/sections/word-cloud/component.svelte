<script>
    import WordCloud from '../../components/WordCloud.svelte';
    import { dataStore } from '../../data/store.svelte.js';
    import { filters } from '../../stores/filters.svelte.js';
    import { filtrarPublicaciones } from '../../lib/publicaciones.js';
    import { generarWordFreq } from '../../lib/wordFreq.js';

    let publicaciones = $derived(filtrarPublicaciones(dataStore.publicaciones, filters));
    let words = $derived(generarWordFreq(publicaciones, 90));
</script>

<section class="mb-8">
    <div class="dashboard-card p-4 sm:p-6">
        <h2 class="text-lg sm:text-xl font-bold text-[#003627] flex items-center mb-4">
            <i class="fas fa-cloud text-[#C12927] mr-2"></i>
            Nube de Palabras
        </h2>
        <WordCloud {words} />
    </div>
</section>
