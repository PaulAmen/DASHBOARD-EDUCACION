<script>
    import { calcularMetricasTitularesPhd } from '../../lib/titularesPhd.js';
    import { filtrarPublicaciones } from '../../lib/publicaciones/filtrar.js';
    import { dataStore } from '../../data/store.svelte.js';
    import { filters } from '../../stores/filters.svelte.js';

    let publicaciones = $derived(filtrarPublicaciones(dataStore.publicacionesRaw, {
        tipo: filters.tipo,
        cuartil: filters.cuartil,
        carrera: filters.carrera,
        docente: filters.docente,
        docenteId: filters.docenteId,
        revista: filters.revista,
        query: filters.query
    }));

    let metricas = $derived.by(() => calcularMetricasTitularesPhd(publicaciones, dataStore.publicacionesRaw));

    let cuartilesEntries = $derived.by(() => {
        const dist = metricas.distribucionCuartil;
        const total = (dist.Q1 || 0) + (dist.Q2 || 0) + (dist.Q3 || 0) + (dist.Q4 || 0) + (dist.SC || 0);
        return [
            { label: 'Q1', count: dist.Q1, color: 'bg-purple-600', soft: 'bg-purple-100 text-purple-700' },
            { label: 'Q2', count: dist.Q2, color: 'bg-blue-600', soft: 'bg-blue-100 text-blue-700' },
            { label: 'Q3', count: dist.Q3, color: 'bg-yellow-500', soft: 'bg-yellow-100 text-yellow-700' },
            { label: 'Q4', count: dist.Q4, color: 'bg-orange-500', soft: 'bg-orange-100 text-orange-700' },
            { label: 'S/C', count: dist.SC, color: 'bg-gray-400', soft: 'bg-gray-100 text-gray-700' }
        ].map(item => ({
            ...item,
            pct: total > 0 ? (item.count / total) * 100 : 0
        }));
    });

    let tipoBaseEntries = $derived.by(() => {
        const items = metricas.distribucionTipoBase || [];
        const total = items.reduce((sum, item) => sum + item.count, 0);
        const palette = [
            { color: 'bg-emerald-600', soft: 'bg-emerald-100 text-emerald-700' },
            { color: 'bg-amber-600', soft: 'bg-amber-100 text-amber-700' },
            { color: 'bg-rose-600', soft: 'bg-rose-100 text-rose-700' },
            { color: 'bg-sky-600', soft: 'bg-sky-100 text-sky-700' },
            { color: 'bg-violet-600', soft: 'bg-violet-100 text-violet-700' },
            { color: 'bg-gray-500', soft: 'bg-gray-100 text-gray-700' }
        ];
        return items.map((item, idx) => ({
            ...item,
            ...palette[idx % palette.length],
            pct: total > 0 ? (item.count / total) * 100 : 0
        }));
    });

    let rankingTop = $derived.by(() => metricas.ranking.slice(0, 10));

    function fmtPct(value) {
        if (!Number.isFinite(value)) return '0%';
        return `${value.toFixed(1)}%`;
    }
</script>

<section class="mb-8 bg-[#003627]/[0.03] border border-[#003627]/10 rounded-2xl p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
            <div class="inline-block bg-[#003627] text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider mb-2">
                Métricas Exclusivas
            </div>
            <h2 class="text-lg sm:text-xl font-bold text-[#003627] flex items-center">
                <i class="fas fa-user-graduate text-[#C12927] mr-2"></i>
                Producción científica de Docentes Titulares con PhD
            </h2>
            <p class="text-xs text-[#5A5B5E] mt-1">
                Incluye artículos, libros y capítulos.
            </p>
        </div>
    </div>

    {#if metricas.totalDocentes === 0}
        <div class="bg-white rounded-xl shadow-md p-4 sm:p-6 text-sm text-[#5A5B5E]">
            No hay registros de docentes titulares con PhD para los filtros actuales.
        </div>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div class="dashboard-card p-4">
                <p class="text-[11px] uppercase tracking-wide text-[#5A5B5E]">Docentes Titulares PhD</p>
                <p class="text-2xl font-bold text-[#003627] mt-1">{metricas.totalDocentes}</p>
            </div>
            <div class="dashboard-card p-4">
                <p class="text-[11px] uppercase tracking-wide text-[#5A5B5E]">Publicaciones totales</p>
                <p class="text-2xl font-bold text-[#289543] mt-1">{metricas.totalPublicaciones}</p>
            </div>
            <div class="dashboard-card p-4">
                <p class="text-[11px] uppercase tracking-wide text-[#5A5B5E]">% artículos Q1 + Q2</p>
                <p class="text-2xl font-bold text-purple-600 mt-1">{fmtPct(metricas.porcentajeQ1Q2)}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div class="dashboard-card p-4 sm:p-6">
                <h3 class="font-semibold text-[#003627] mb-3 text-sm sm:text-base flex items-center">
                    <i class="fas fa-layer-group text-[#C12927] mr-2"></i>
                    Distribución por cuartil (artículos)
                </h3>
                <div class="space-y-2">
                    {#each cuartilesEntries as item}
                        <div class="grid grid-cols-[3rem_1fr_auto] items-center gap-3">
                            <span class="text-xs font-semibold text-[#003627]">{item.label}</span>
                            <div class="h-5 rounded-full bg-gray-100 overflow-hidden">
                                {#if item.count > 0}
                                    <div class="h-full {item.color} rounded-full min-w-[1.25rem]" style={`width: ${item.pct}%`}></div>
                                {/if}
                            </div>
                            <span class="text-xs font-medium {item.soft} px-2 py-0.5 rounded">{item.count}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="dashboard-card p-4 sm:p-6">
                <h3 class="font-semibold text-[#003627] mb-3 text-sm sm:text-base flex items-center">
                    <i class="fas fa-globe-americas text-[#C12927] mr-2"></i>
                    Alcance de indexación (artículos)
                </h3>
                {#if tipoBaseEntries.length === 0}
                    <p class="text-sm text-[#5A5B5E]">Sin datos de TIPO_BASE_DATOS_INDEXADA en los artículos visibles.</p>
                {:else}
                    <div class="space-y-2">
                        {#each tipoBaseEntries as item (item.tipo)}
                            <div class="grid grid-cols-[8rem_1fr_auto] items-center gap-3">
                                <span class="text-xs font-semibold text-[#003627] truncate" title={item.tipo}>{item.tipo}</span>
                                <div class="h-5 rounded-full bg-gray-100 overflow-hidden">
                                    {#if item.count > 0}
                                        <div class="h-full {item.color} rounded-full min-w-[1.25rem]" style={`width: ${item.pct}%`}></div>
                                    {/if}
                                </div>
                                <span class="text-xs font-medium {item.soft} px-2 py-0.5 rounded">{item.count}</span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <div class="dashboard-card p-4 sm:p-6 overflow-hidden">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-3 flex-wrap gap-2">
                <h3 class="font-semibold text-[#003627] text-sm sm:text-base flex items-center">
                    <i class="fas fa-trophy text-[#C12927] mr-2"></i>
                    Ranking de Titulares PhD
                </h3>
                <span class="text-xs text-[#5A5B5E]">Top {rankingTop.length} de {metricas.ranking.length}</span>
            </div>
            <div class="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table class="w-full text-sm border-collapse min-w-[500px]">
                    <thead class="bg-gray-50">
                        <tr class="text-left text-[10px] sm:text-[11px] uppercase tracking-wide text-[#5A5B5E] border-b border-gray-200">
                            <th class="py-2.5 px-3 sticky left-0 bg-gray-50 z-10 font-bold whitespace-nowrap">Docente</th>
                            <th class="py-2.5 px-3 hidden md:table-cell">Carrera</th>
                            <th class="py-2.5 px-2 text-center" title="Artículos">Art.</th>
                            <th class="py-2.5 px-2 text-center hidden sm:table-cell" title="Libros">Lib.</th>
                            <th class="py-2.5 px-2 text-center hidden sm:table-cell" title="Capítulos">Cap.</th>
                            <th class="py-2.5 px-2 text-center text-purple-700">Q1</th>
                            <th class="py-2.5 px-2 text-center text-blue-700">Q2</th>
                            <th class="py-2.5 px-3 text-right">Puntos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each rankingTop as d (d.clave)}
                            <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
                                <td class="py-2.5 px-3 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-50 sm:border-transparent">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-bold text-gray-400 w-4">{d.rank}</span>
                                        <div>
                                            <div class="font-medium text-[#003627] truncate max-w-[12rem] sm:max-w-[16rem]" title={d.nombre}>{d.nombre}</div>
                                            {#if d.gradoAcademico}
                                                <div class="text-[10px] text-[#5A5B5E]">{d.gradoAcademico}</div>
                                            {/if}
                                        </div>
                                    </div>
                                </td>
                                <td class="py-2.5 px-3 hidden md:table-cell text-xs text-[#5A5B5E] truncate max-w-[16rem]" title={d.carrera}>{d.carrera}</td>
                                <td class="py-2.5 px-2 text-center font-medium bg-[#289543]/5">{d.articulos}</td>
                                <td class="py-2.5 px-2 text-center hidden sm:table-cell bg-[#C12927]/5">{d.libros}</td>
                                <td class="py-2.5 px-2 text-center hidden sm:table-cell bg-[#003627]/5">{d.capitulos}</td>
                                <td class="py-2.5 px-2 text-center font-medium bg-purple-50 text-purple-800">{d.Q1}</td>
                                <td class="py-2.5 px-2 text-center font-medium bg-blue-50 text-blue-800">{d.Q2}</td>
                                <td class="py-2.5 px-3 text-right font-bold text-[#289543]">{d.puntos.toFixed(2)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</section>
