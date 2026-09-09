<script>
    import { prepararCarrerasComparativa } from '../../lib/carreras.js';
    import { colorArticulo, colorLibro, colorCapitulo } from '../../lib/theme.js';

    let {
        carreras = [],
        selectedCarrera = '',
        limit = 8,
        onSelect = () => {}
    } = $props();

    let carrerasChart = $derived.by(() => prepararCarrerasComparativa(carreras, selectedCarrera, limit));
    let carrerasOmitidas = $derived(carrerasChart.find(item => item.omittedMarker)?.omittedCount || 0);
    let maxTotal = $derived.by(() => {
        const max = Math.max(...carrerasChart.filter(item => !item.omittedMarker).map(item => item.total), 0);
        return max || 1;
    });

    function getSegmentWidth(value) {
        return `${(value / maxTotal) * 100}%`;
    }
</script>

<div class="dashboard-card p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
            <h3 class="font-semibold text-[#003627] text-base sm:text-lg flex items-center">
                <i class="fas fa-chart-bar text-[#C12927] mr-2"></i>
                Comparativa por carrera
            </h3>
            <p class="text-xs text-[#5A5B5E] mt-1">Click en cualquier carrera para filtrar. Ordenada por total y desglosada por tipo.</p>
            {#if carrerasOmitidas}
                <p class="text-[11px] text-[#5A5B5E] mt-1">
                    El marcador <span class="font-semibold">⋯ +{carrerasOmitidas}</span> indica carreras omitidas entre el top visible y la carrera seleccionada.
                </p>
            {/if}
        </div>
        {#if selectedCarrera}
            <span class="text-[11px] px-2 py-1 rounded-full bg-green-100 text-[#003627] border border-green-200 self-start sm:self-auto">
                Resaltada: {selectedCarrera}
            </span>
        {/if}
    </div>

    {#if carrerasChart.length}
        <div class="space-y-3">
            {#each carrerasChart as carrera (carrera.nombre)}
                {#if carrera.omittedMarker}
                    <div class="grid grid-cols-[minmax(0,100px)_1fr_auto] sm:grid-cols-[minmax(0,180px)_1fr_auto] md:grid-cols-[minmax(0,240px)_1fr_auto] gap-2 sm:gap-3 items-center">
                        <div class="min-w-0"></div>
                        <div class="h-7 flex items-center">
                            <div class="w-full border-t-2 border-dashed border-gray-300"></div>
                        </div>
                        <div class="text-xs font-semibold text-gray-400">...</div>
                    </div>
                {:else}
                    <div
                        role="button"
                        tabindex="0"
                        onclick={() => onSelect(carrera.nombre)}
                        onkeydown={(e) => e.key === 'Enter' && onSelect(carrera.nombre)}
                        class="grid grid-cols-[minmax(0,100px)_1fr_auto] sm:grid-cols-[minmax(0,180px)_1fr_auto] md:grid-cols-[minmax(0,240px)_1fr_auto] gap-2 sm:gap-3 items-center cursor-pointer hover:bg-gray-50 p-1 -mx-1 rounded transition-colors"
                    >
                        <div class="min-w-0">
                            <p class="text-xs font-medium truncate {carrera.selected ? 'text-[#003627]' : 'text-[#5A5B5E]'}" title={carrera.nombre}>
                                {carrera.nombre}
                            </p>
                        </div>

                        <div class="h-7 rounded-full bg-gray-100 flex shadow-inner {carrera.selected ? 'ring-2 ring-green-100' : ''}">
                            <div class="h-full flex rounded-full overflow-hidden {carrera.total > 0 ? 'min-w-[1.75rem]' : ''}" style={`width: ${getSegmentWidth(carrera.total)}`}>
                                {#if carrera.articulos > 0}
                                    <div
                                        class="h-full {selectedCarrera && !carrera.selected ? 'opacity-45' : ''}"
                                        style={`width: ${(carrera.articulos / carrera.total) * 100}%; background-color: ${colorArticulo};`}
                                        title={`Artículos: ${carrera.articulos}`}
                                    ></div>
                                {/if}
                                {#if carrera.libros > 0}
                                    <div
                                        class="h-full {selectedCarrera && !carrera.selected ? 'opacity-45' : ''}"
                                        style={`width: ${(carrera.libros / carrera.total) * 100}%; background-color: ${colorLibro};`}
                                        title={`Libros: ${carrera.libros}`}
                                    ></div>
                                {/if}
                                {#if carrera.capitulos > 0}
                                    <div
                                        class="h-full {selectedCarrera && !carrera.selected ? 'opacity-45' : ''}"
                                        style={`width: ${(carrera.capitulos / carrera.total) * 100}%; background-color: ${colorCapitulo};`}
                                        title={`Capítulos: ${carrera.capitulos}`}
                                    ></div>
                                {/if}
                            </div>
                        </div>
                        <div class="text-sm font-bold {carrera.selected ? 'text-[#003627]' : 'text-[#5A5B5E]'} min-w-[2.5rem] text-right">
                            {carrera.total}
                        </div>
                    </div>
                {/if}
            {/each}
        </div>

        <div class="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100 text-xs text-[#5A5B5E]">
            <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full" style={`background-color: ${colorArticulo};`}></span>Artículos</span>
            <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full" style={`background-color: ${colorLibro};`}></span>Libros</span>
            <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full" style={`background-color: ${colorCapitulo};`}></span>Capítulos</span>
        </div>
    {:else}
        <div class="text-sm dashboard-muted bg-gray-50 rounded-lg p-4">
            No hay carreras suficientes para construir la comparativa con los filtros actuales.
        </div>
    {/if}
</div>
