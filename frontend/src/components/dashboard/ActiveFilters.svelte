<!-- ActiveFilters.svelte -->
<script>
    import { filters, clearFilters } from '../../stores/filters.svelte.js';

    let { onClearAll = clearFilters, inHeader = false } = $props();

    function removeTipo(tipo) {
        filters.tipo = filters.tipo.filter(t => t !== tipo);
    }

    function removeCuartil(q) {
        filters.cuartil = filters.cuartil.filter(item => item !== q);
    }
</script>

{#if filters.docente || filters.tipo.length > 0 || filters.cuartil.length > 0 || filters.carrera || filters.revista || filters.query}
    <div class="{inHeader ? 'border-t border-white/10 bg-white/95 px-4 py-2 shadow-inner' : 'mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-100'}">
        <div class="container mx-auto flex flex-wrap items-center gap-2 {inHeader ? '' : '!px-0'}">
        <span class="text-xs font-bold text-gray-400 uppercase mr-2">Filtros activos:</span>

        {#if filters.query}
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                <i class="fas fa-search mr-2"></i>{filters.query}
                <button onclick={() => filters.query = ''} class="ml-2 hover:text-red-600 transition" aria-label="Quitar búsqueda"><i class="fas fa-times"></i></button>
            </span>
        {/if}

        {#if filters.docente}
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-[#003627] text-xs font-medium border border-green-200">
                <i class="fas fa-user mr-2"></i>{filters.docente}
                <button onclick={() => filters.docente = ''} class="ml-2 hover:text-red-600 transition" aria-label="Quitar docente"><i class="fas fa-times"></i></button>
            </span>
        {/if}

        {#if filters.carrera}
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200">
                <i class="fas fa-graduation-cap mr-2"></i>{filters.carrera}
                <button onclick={() => filters.carrera = ''} class="ml-2 hover:text-red-600 transition" aria-label="Quitar carrera"><i class="fas fa-times"></i></button>
            </span>
        {/if}

        {#if filters.revista}
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-medium border border-cyan-200 max-w-full">
                <i class="fas fa-journal-whills mr-2"></i><span class="truncate max-w-[16rem]" title={filters.revista}>{filters.revista}</span>
                <button onclick={() => filters.revista = ''} class="ml-2 hover:text-red-600 transition" aria-label="Quitar revista"><i class="fas fa-times"></i></button>
            </span>
        {/if}

        {#each filters.tipo as tipo}
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200">
                <i class="fas fa-filter mr-2"></i>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}s
                <button onclick={() => removeTipo(tipo)} class="ml-2 hover:text-red-600 transition" aria-label={`Quitar ${tipo}`}><i class="fas fa-times"></i></button>
            </span>
        {/each}

        {#each filters.cuartil as q}
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium border border-purple-200">
                <i class="fas fa-layer-group mr-2"></i>{q}
                <button onclick={() => removeCuartil(q)} class="ml-2 hover:text-red-600 transition" aria-label={`Quitar ${q}`}><i class="fas fa-times"></i></button>
            </span>
        {/each}

        <button onclick={onClearAll} class="text-xs text-red-600 font-bold hover:underline ml-auto">
            <i class="fas fa-trash-alt mr-1"></i> LIMPIAR TODO
        </button>
        </div>
    </div>
{/if}
