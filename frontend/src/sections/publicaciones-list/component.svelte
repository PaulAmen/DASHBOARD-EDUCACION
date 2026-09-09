<script>
    import { getCuartil } from '../../lib/caces/index.js';
    import { filtrarPublicaciones } from '../../lib/publicaciones/filtrar.js';
    import { dataStore } from '../../data/store.svelte.js';
    import { filters, clearFilters, selectRevista } from '../../stores/filters.svelte.js';

    let publicacionesFiltradas = $derived(filtrarPublicaciones(dataStore.publicaciones, filters));
</script>

<section>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 class="text-lg sm:text-xl font-bold text-[#003627] flex items-center">
            <i class="fas fa-list-ul text-[#C12927] mr-2"></i>
            <span>{publicacionesFiltradas.length} publicaciones encontradas</span>
        </h2>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {#each publicacionesFiltradas as pub (pub.id)}
            <div class="dashboard-card p-4 sm:p-5 border-l-4 transition-all hover:bg-gray-50 flex flex-col h-full
                 {pub.tipo === 'articulo' ? 'border-[#289543]' : pub.tipo === 'libro' ? 'border-[#C12927]' : 'border-[#003627]'}">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                              {pub.tipo === 'articulo' ? 'bg-[#289543]/15 text-[#003627]' : pub.tipo === 'libro' ? 'bg-[#C12927]/15 text-[#C12927]' : 'bg-[#003627]/15 text-[#003627]'}">
                            <i class="mr-1 {pub.tipo === 'articulo' ? 'fas fa-newspaper' : pub.tipo === 'libro' ? 'fas fa-book' : 'fas fa-bookmark'}"></i>
                            {pub.tipoLabel}
                        </span>
                        {#if getCuartil(pub)}
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                {getCuartil(pub) === 'Q1' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                 getCuartil(pub) === 'Q2' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                 getCuartil(pub) === 'Q3' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                 'bg-orange-100 text-orange-800 border border-orange-200'}">
                                {getCuartil(pub)}
                            </span>
                        {/if}
                        {#if pub.baseDatos}
                            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 truncate max-w-[120px]" title={pub.baseDatos}>{pub.baseDatos}</span>
                        {/if}
                    </div>

                    {#if pub.link}
                        <div class="flex-shrink-0 -mt-1 -mr-1">
                            <a href={pub.link} target="_blank" rel="noopener noreferrer"
                               class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-[#289543] hover:text-white transition-colors focus-ring"
                               aria-label={`Ver publicación: ${pub.titulo}`} title="Ver publicación externa">
                                <i class="fas fa-external-link-alt text-xs"></i>
                            </a>
                        </div>
                    {/if}
                </div>

                <div class="flex-1">
                    <h3 class="font-bold text-[#003627] mb-2 text-sm sm:text-base line-clamp-2" title={pub.titulo}>{pub.titulo}</h3>

                    <div class="text-xs sm:text-sm text-[#5A5B5E] space-y-1.5 mb-3">
                        <p class="font-medium text-gray-800 line-clamp-1" title={pub.autor}><i class="fas fa-user w-4 text-gray-400"></i> {pub.autor}</p>
                        {#if pub.revista}
                            <button
                                type="button"
                                onclick={() => selectRevista(pub.revista)}
                                class="block max-w-full line-clamp-1 text-left text-[#289543] hover:text-[#003627] hover:underline focus-ring rounded"
                                title={`Filtrar por revista: ${pub.revista}`}
                                aria-label={`Filtrar por revista ${pub.revista}`}
                            >
                                <i class="fas fa-journal-whills w-4 text-gray-400"></i> {pub.revista}
                            </button>
                        {/if}
                        {#if pub.libroPadre}
                            <p class="text-[11px] line-clamp-1" title={`En: ${pub.libroPadre}`}><i class="fas fa-book w-4 text-gray-400"></i> En: <span class="italic">{pub.libroPadre}</span></p>
                        {/if}
                    </div>
                </div>

                <div class="mt-auto pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
                    {#if pub.carrera}
                        <div class="flex items-center truncate max-w-[180px]" title={pub.carrera}><i class="fas fa-graduation-cap w-4"></i> {pub.carrera}</div>
                    {/if}
                    {#if pub.fecha}
                        <div class="flex items-center"><i class="fas fa-calendar w-4"></i> {pub.fecha}</div>
                    {/if}
                    {#if pub.isbn}
                        <div class="flex items-center"><i class="fas fa-barcode w-4"></i> ISBN: {pub.isbn}</div>
                    {/if}
                    {#if pub.proyecto}
                        <div class="flex items-center w-full mt-1"><i class="fas fa-project-diagram w-4"></i> Proyecto: {pub.proyecto}</div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    {#if publicacionesFiltradas.length === 0}
        <div class="text-center py-12 dashboard-card">
            <i class="fas fa-search text-gray-300 text-5xl mb-4"></i>
            <p class="text-[#5A5B5E]">No se encontraron publicaciones</p>
            <button onclick={clearFilters} class="mt-4 text-[#C12927] hover:underline">Limpiar filtros</button>
        </div>
    {/if}
</section>
