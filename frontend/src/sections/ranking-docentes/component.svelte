<script>
    import { dataStore } from '../../data/store.svelte.js';
    import { filters, selectDocente } from '../../stores/filters.svelte.js';
    import { filtrarPublicaciones } from '../../lib/publicaciones/filtrar.js';
    import { isSamePerson } from '../../lib/publicaciones/strings.js';
    import { calcularRanking } from '../../lib/ranking.js';

    let publicacionesRanking = $derived(filtrarPublicaciones(dataStore.publicacionesRaw, {
        tipo: filters.tipo,
        cuartil: filters.cuartil,
        carrera: filters.carrera,
        revista: filters.revista,
        query: filters.query
    }));
    let topDocentes = $derived(calcularRanking(publicacionesRanking));
    let top3Global = $derived(dataStore.topDocentes.slice(0, 3).map(d => d.nombre));

    let filtroTitular = $state('todos'); // 'todos', 'titulares', 'no_titulares'
    let filtroPhD = $state('todos');     // 'todos', 'phd', 'no_phd'

    function isDocenteSelected(docente) {
        if (!filters.docente && !filters.docenteId) return false;
        if (filters.docenteId && docente.identificacion && String(filters.docenteId).trim() === String(docente.identificacion).trim()) {
            return true;
        }
        return isSamePerson(docente.nombre, filters.docente);
    }

    let docentesMostrados = $derived(topDocentes.filter(d => {
        if (filtroTitular === 'titulares' && !d.isTitular) return false;
        if (filtroTitular === 'no_titulares' && d.isTitular) return false;
        if (filtroPhD === 'phd' && !d.isPhD) return false;
        if (filtroPhD === 'no_phd' && d.isPhD) return false;
        if ((filters.docente || filters.docenteId) && !isDocenteSelected(d)) return false;
        return true;
    }));

    function filterByDocente(docente) {
        selectDocente(docente.nombre, docente.identificacion);
    }

    function totalCuartilesSeleccionados(docente) {
        if (!filters.cuartil || filters.cuartil.length === 0) return 0;
        return filters.cuartil.reduce((sum, q) => sum + (docente[q] || 0), 0);
    }

    function medallaGlobal(nombre) {
        const idx = top3Global.indexOf(nombre);
        return idx >= 0 ? idx + 1 : 0;
    }
</script>

<section class="mb-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
            <h2 class="text-lg sm:text-xl font-bold text-[#003627] flex items-center">
                <i class="fas fa-trophy text-[#C12927] mr-2"></i>
                Ranking de Docentes
            </h2>
            <span class="text-sm text-[#5A5B5E]">Click para filtrar publicaciones</span>
        </div>
        
        <div class="flex flex-wrap gap-2">
            <div class="inline-flex bg-gray-100 rounded-lg p-1">
                {#each [{id: 'todos', label: 'Todos'}, {id: 'titulares', label: 'Titulares'}, {id: 'no_titulares', label: 'No Titulares'}] as opt}
                    <button type="button"
                        onclick={() => filtroTitular = opt.id}
                        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {filtroTitular === opt.id ? 'bg-white text-[#003627] shadow-sm' : 'text-[#5A5B5E] hover:text-[#003627]'}">
                        {opt.label}
                    </button>
                {/each}
            </div>
            
            <div class="inline-flex bg-gray-100 rounded-lg p-1">
                {#each [{id: 'todos', label: 'Todos'}, {id: 'phd', label: 'Con PhD'}, {id: 'no_phd', label: 'Sin PhD'}] as opt}
                    <button type="button"
                        onclick={() => filtroPhD = opt.id}
                        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {filtroPhD === opt.id ? 'bg-white text-[#003627] shadow-sm' : 'text-[#5A5B5E] hover:text-[#003627]'}">
                        {opt.label}
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each docentesMostrados as docente (docente.clave)}
            {@const medalla = medallaGlobal(docente.nombre)}
            {@const isSelected = isDocenteSelected(docente)}
            <div onclick={() => filterByDocente(docente)}
                 class="dashboard-card p-4 cursor-pointer border-2 transition-colors duration-200 focus-ring
                 {isSelected ? 'border-[#289543] bg-green-50 shadow-md' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}"
                 role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && filterByDocente(docente)}
                 aria-label={`Filtrar por ${docente.nombre}`} aria-pressed={isSelected}>

                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                         {medalla === 1 ? 'bg-yellow-100' : medalla === 2 ? 'bg-gray-100' : medalla === 3 ? 'bg-orange-100' : 'bg-gray-100/50'}">
                        {#if medalla === 1}
                            <i class="fas fa-medal text-[#fbbf24]"></i>
                        {:else if medalla === 2}
                            <i class="fas fa-medal text-[#9ca3af]"></i>
                        {:else if medalla === 3}
                            <i class="fas fa-medal text-[#d97706]"></i>
                        {:else}
                            <span class="text-[#5A5B5E] text-base">{docente.rank}</span>
                        {/if}
                    </div>

                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-[#003627] text-sm truncate" title={docente.nombre}>{docente.nombre}</h3>
                        <div class="flex flex-wrap items-center gap-1.5 mt-2">
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#289543]/15 text-[#003627]" title="Artículos">
                                <i class="fas fa-newspaper mr-1"></i>{docente.articulos}
                            </span>
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#C12927]/15 text-[#C12927]" title="Libros">
                                <i class="fas fa-book mr-1"></i>{docente.libros}
                            </span>
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#003627]/15 text-[#003627]" title="Capítulos">
                                <i class="fas fa-bookmark mr-1"></i>{docente.capitulos}
                            </span>
                            {#each ['Q1','Q2','Q3','Q4'] as q}
                                {#if docente[q] > 0}
                                    <span class="inline-flex items-center rounded text-[10px] font-bold overflow-hidden border
                                        {q === 'Q1' ? 'border-purple-200' : q === 'Q2' ? 'border-blue-200' : q === 'Q3' ? 'border-yellow-200' : 'border-orange-200'}"
                                          title="{q}: {docente[q]} artículo(s)">
                                        <span class="{q === 'Q1' ? 'bg-purple-600' : q === 'Q2' ? 'bg-blue-600' : q === 'Q3' ? 'bg-yellow-500' : 'bg-orange-500'} text-white px-1.5 py-0.5">{q}</span>
                                        <span class="{q === 'Q1' ? 'bg-purple-100 text-purple-700' : q === 'Q2' ? 'bg-blue-100 text-blue-700' : q === 'Q3' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'} px-1.5 py-0.5">{docente[q]}</span>
                                    </span>
                                {/if}
                            {/each}
                        </div>
                        <div class="mt-2.5 flex items-end justify-between gap-3 pt-2 border-t border-gray-100">
                            <div class="text-left leading-tight" title="Puntaje CACES (Indicador 26)">
                                <div class="text-base font-bold text-[#003627]">{docente.puntos.toFixed(2)}</div>
                                <div class="text-[9px] uppercase tracking-wider text-[#5A5B5E]">puntos</div>
                            </div>
                            {#if filters.cuartil && filters.cuartil.length > 0}
                                <div class="text-right leading-tight">
                                    <div class="text-base font-bold text-purple-600">{totalCuartilesSeleccionados(docente)}</div>
                                    <div class="text-[9px] uppercase tracking-wider text-purple-400">
                                        {filters.cuartil.length === 1 ? filters.cuartil[0] : 'Sel.'}
                                    </div>
                                </div>
                            {:else}
                                <div class="text-right leading-tight">
                                    <div class="text-base font-bold text-[#289543]">{docente.total}</div>
                                    <div class="text-[9px] uppercase tracking-wider text-[#5A5B5E]">publicaciones</div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>
