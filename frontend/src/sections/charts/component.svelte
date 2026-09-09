<script>
    import { onDestroy } from 'svelte';
    import Chart from 'chart.js/auto';
    import { palettes, commonDoughnutOptions, commonBarOptions } from '../../lib/chartTheme.js';
    import { getCuartil } from '../../lib/caces/index.js';
    import { filtrarPublicaciones } from '../../lib/publicaciones/filtrar.js';
    import { normalizeJournalKey, splitMultiValue } from '../../lib/publicaciones/strings.js';
    import { dataStore } from '../../data/store.svelte.js';
    import { filters, toggleTipo, toggleCuartil, selectRevista } from '../../stores/filters.svelte.js';

    let publicaciones = $derived(filtrarPublicaciones(dataStore.publicaciones, filters));
    let articulos = $derived(publicaciones.filter(p => p.tipo === 'articulo'));
    let conteoArticulos = $derived(articulos.length);
    let conteoLibros = $derived(publicaciones.filter(p => p.tipo === 'libro').length);
    let conteoCapitulos = $derived(publicaciones.filter(p => p.tipo === 'capitulo').length);

    let totalPublicaciones = $derived(conteoArticulos + conteoLibros + conteoCapitulos);

    let chartTipo;
    let chartCuartil;
    let chartBase;

    let canvasTipo;
    let canvasCuartil;
    let canvasBase;

    let revistaSort = $state('total');
    let revistaRows = $derived.by(() => buildJournalRows(articulos, revistaSort));
    let maxRevistaTotal = $derived(Math.max(...revistaRows.map(row => row.total), 1));

    // Derived flags for empty states
    let hasArticulos = $derived(conteoArticulos > 0);
    let hasBases = $derived(articulos.some(p => p.baseDatos));
    let hasRevistas = $derived(revistaRows.length > 0);

    $effect(() => {
        const arts = conteoArticulos;
        const libs = conteoLibros;
        const caps = conteoCapitulos;
        const visibleArticulos = articulos;
        const timer = setTimeout(() => createCharts(arts, libs, caps, visibleArticulos), 50);
        return () => clearTimeout(timer);
    });

    onDestroy(() => {
        destroyCharts();
    });

    function destroyCharts() {
        if (chartTipo) {
            chartTipo.destroy();
            chartTipo = null;
        }
        if (chartCuartil) {
            chartCuartil.destroy();
            chartCuartil = null;
        }
        if (chartBase) {
            chartBase.destroy();
            chartBase = null;
        }
    }

    function createCharts(arts, libs, caps, visibleArticulos) {
        destroyCharts();

        if (canvasTipo && (arts > 0 || libs > 0 || caps > 0)) {
            chartTipo = new Chart(canvasTipo, {
                type: 'doughnut',
                data: {
                    labels: ['Artículos', 'Libros', 'Capítulos'],
                    datasets: [{
                        data: [arts, libs, caps],
                        backgroundColor: palettes.tipos,
                        borderWidth: 0
                    }]
                },
                options: {
                    ...commonDoughnutOptions,
                    onClick: (_event, elements) => {
                        if (!elements.length) return;
                        const tipo = ['articulo', 'libro', 'capitulo'][elements[0].index];
                        if (tipo) toggleTipo(tipo);
                    },
                    onHover: (event, elements) => {
                        const target = event?.native?.target;
                        if (target) target.style.cursor = elements.length ? 'pointer' : 'default';
                    }
                }
            });
        }

        const distQ = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, SC: 0 };
        visibleArticulos.forEach(p => {
            const q = getCuartil(p);
            if (q) distQ[q]++;
            else distQ.SC++;
        });

        const totalQ = Object.values(distQ).reduce((a,b)=>a+b, 0);

        if (canvasCuartil && totalQ > 0) {
            chartCuartil = new Chart(canvasCuartil, {
                type: 'doughnut',
                data: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4', 'S/C'],
                    datasets: [{
                        data: [distQ.Q1, distQ.Q2, distQ.Q3, distQ.Q4, distQ.SC],
                        backgroundColor: palettes.cuartiles,
                        borderWidth: 0
                    }]
                },
                options: {
                    ...commonDoughnutOptions,
                    onClick: (_event, elements) => {
                        if (!elements.length) return;
                        const cuartil = ['Q1', 'Q2', 'Q3', 'Q4', 'SC'][elements[0].index];
                        if (cuartil && cuartil !== 'SC') toggleCuartil(cuartil);
                    },
                    onHover: (event, elements) => {
                        const target = event?.native?.target;
                        if (target) target.style.cursor = elements.length && elements[0].index < 4 ? 'pointer' : 'default';
                    }
                }
            });
        }

        const basesMap = {};
        visibleArticulos.forEach(p => {
            if (p.baseDatos) {
                if (!basesMap[p.baseDatos]) basesMap[p.baseDatos] = [];
                const autoresLista = splitMultiValue(p.autor);
                if (autoresLista.length > 0) {
                    autoresLista.forEach(a => basesMap[p.baseDatos].push(getAutorCorto(a)));
                } else {
                    basesMap[p.baseDatos].push('Anonimo');
                }
            }
        });

        const basesSorted = Object.entries(basesMap)
            .map(([base, autores]) => ({ base, count: autores.length, autores }))
            .sort((a, b) => b.count - a.count);

        if (canvasBase && basesSorted.length > 0) {
            chartBase = new Chart(canvasBase, {
                type: 'bar',
                data: {
                    labels: basesSorted.map(d => d.base),
                    datasets: [{
                        label: 'Artículos',
                        data: basesSorted.map(d => d.count),
                        backgroundColor: palettes.bases,
                        borderRadius: 4,
                        autoresList: basesSorted.map(d => d.autores)
                    }]
                },
                options: {
                    ...commonBarOptions,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                afterBody: function(context) {
                                    const index = context[0].dataIndex;
                                    const autores = context[0].dataset.autoresList[index];
                                    const display = autores.slice(0, 10).map(a => `• ${a}`);
                                    if (autores.length > 10) display.push(`...y ${autores.length - 10} más`);
                                    return ['', 'Autores:', ...display];
                                }
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    function buildJournalRows(items, sortBy = 'total') {
        const revistasMap = {};

        items.filter(p => p.revista).forEach(p => {
            const nombre = String(p.revista).trim();
            if (!nombre) return;

            const key = normalizeJournalKey(nombre);
            const tipo = String(p.tipoBaseDatos || '').toUpperCase() === 'MUNDIAL' ? 'MUNDIAL' : 'REGIONAL';
            if (!revistasMap[key]) {
                revistasMap[key] = {
                    MUNDIAL: 0,
                    REGIONAL: 0,
                    autores: [],
                    variantes: {},
                    etiqueta: nombre
                };
            }

            revistasMap[key][tipo]++;
            revistasMap[key].variantes[nombre] = (revistasMap[key].variantes[nombre] || 0) + 1;
            revistasMap[key].etiqueta = pickJournalLabel(revistasMap[key].variantes);
            
            const autoresLista = splitMultiValue(p.autor);
            if (autoresLista.length > 0) {
                autoresLista.forEach(a => revistasMap[key].autores.push(getAutorCorto(a)));
            } else {
                revistasMap[key].autores.push(getAutorCorto(null));
            }
        });

        const rows = Object.entries(revistasMap).map(([key, v]) => ({
            key,
            revista: v.etiqueta,
            variantes: Object.keys(v.variantes).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
            mundial: v.MUNDIAL,
            regional: v.REGIONAL,
            total: v.MUNDIAL + v.REGIONAL,
            autoresRanking: rankAuthors(v.autores)
        }));

        return rows.sort((a, b) => {
            if (sortBy === 'nombre') {
                return a.revista.localeCompare(b.revista, 'es', { sensitivity: 'base' });
            }
            if (sortBy === 'mundial' && b.mundial !== a.mundial) return b.mundial - a.mundial;
            if (sortBy === 'regional' && b.regional !== a.regional) return b.regional - a.regional;
            if (b.total !== a.total) return b.total - a.total;
            return a.revista.localeCompare(b.revista, 'es', { sensitivity: 'base' });
        });
    }

    function getAutorCorto(value) {
        return value ? String(value).split(' ').slice(0, 2).join(' ') : 'Anonimo';
    }

    function totalPct(value) {
        if (!maxRevistaTotal) return 0;
        return Math.max((value / maxRevistaTotal) * 100, value > 0 ? 6 : 0);
    }

    function pickJournalLabel(variantes) {
        return Object.entries(variantes)
            .sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1];
                return b[0].length - a[0].length;
            })[0][0];
    }

    function rankAuthors(autores) {
        const counts = {};
        autores.forEach(autor => {
            counts[autor] = (counts[autor] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([nombre, count]) => ({ nombre, count }))
            .sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
            });
    }

    function getAlcance(row) {
        if (row.mundial > 0 && row.regional > 0) return 'inconsistente';
        if (row.mundial > 0) return 'mundial';
        return 'regional';
    }
</script>

<section class="mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    <div class="dashboard-card p-4 sm:p-6 flex flex-col">
        <h3 class="font-semibold text-[#003627] mb-3 sm:mb-4 text-base sm:text-lg flex items-center"><i class="fas fa-chart-pie text-[#289543] mr-2"></i>Distribución por Tipo</h3>
        <p class="text-[11px] text-[#5A5B5E] mb-2 -mt-2">Click en una sección para filtrar por tipo</p>
        {#if totalPublicaciones === 0}
            <div class="flex-1 flex items-center justify-center dashboard-muted text-center p-4">No hay datos suficientes.</div>
        {:else}
            <div class="h-64 sm:h-72 w-full relative cursor-pointer"><canvas bind:this={canvasTipo}></canvas></div>
        {/if}
    </div>

    <div class="dashboard-card p-4 sm:p-6 flex flex-col">
        <h3 class="font-semibold text-[#003627] mb-3 sm:mb-4 text-base sm:text-lg flex items-center"><i class="fas fa-layer-group text-purple-600 mr-2"></i>Distribución por Cuartil</h3>
        <p class="text-[11px] text-[#5A5B5E] mb-2 -mt-2">Click en Q1-Q4 para filtrar por cuartil</p>
        {#if !hasArticulos}
            <div class="flex-1 flex items-center justify-center dashboard-muted text-center p-4">No hay artículos para mostrar cuartiles.</div>
        {:else}
            <div class="h-64 sm:h-72 w-full relative cursor-pointer"><canvas bind:this={canvasCuartil}></canvas></div>
        {/if}
    </div>

    <div class="dashboard-card p-4 sm:p-6 flex flex-col md:col-span-2 xl:col-span-1">
        <h3 class="font-semibold text-[#003627] mb-3 sm:mb-4 text-base sm:text-lg flex items-center"><i class="fas fa-database text-[#C12927] mr-2"></i>Artículos por Base de Datos</h3>
        {#if !hasArticulos}
            <div class="flex-1 flex items-center justify-center dashboard-muted text-center p-4">No hay artículos para mostrar.</div>
        {:else if !hasBases}
            <div class="flex-1 flex items-center justify-center dashboard-muted text-center p-4">Los artículos visibles no tienen base de datos registrada.</div>
        {:else}
            <div class="h-64 sm:h-72 w-full relative"><canvas bind:this={canvasBase}></canvas></div>
        {/if}
    </div>

    <div class="dashboard-card p-4 sm:p-6 flex flex-col md:col-span-2 xl:col-span-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
                <h3 class="font-semibold text-[#003627] text-base sm:text-lg flex items-center"><i class="fas fa-book-open text-[#289543] mr-2"></i>Revistas por alcance</h3>
                <p class="text-[11px] text-[#5A5B5E] mt-1">Todas las revistas agrupadas por nombre equivalente. Click en una revista para filtrar.</p>
            </div>
            <div class="flex flex-wrap gap-1 text-[11px]" aria-label="Ordenar revistas">
                {#each [
                    { value: 'total', label: 'Total' },
                    { value: 'mundial', label: 'Mundiales' },
                    { value: 'regional', label: 'Regionales' },
                    { value: 'nombre', label: 'A-Z' }
                ] as option}
                    <button
                        type="button"
                        onclick={() => revistaSort = option.value}
                        aria-pressed={revistaSort === option.value}
                        class="px-2.5 py-1 rounded-md border transition-colors focus-ring {revistaSort === option.value ? 'bg-[#003627] text-white border-[#003627]' : 'bg-white text-[#5A5B5E] border-gray-200 hover:border-[#289543]'}"
                    >
                        {option.label}
                    </button>
                {/each}
            </div>
        </div>
        {#if !hasArticulos}
            <div class="flex-1 flex items-center justify-center dashboard-muted text-center p-4">No hay artículos en revistas para mostrar.</div>
        {:else if !hasRevistas}
            <div class="flex-1 flex items-center justify-center dashboard-muted text-center p-4">Los artículos visibles no tienen revista registrada.</div>
        {:else}
            <div class="max-h-[34rem] overflow-auto pr-1">
                <div class="min-w-[46rem] lg:min-w-0">
                    <div class="grid grid-cols-[minmax(14rem,1.4fr)_5rem_minmax(14rem,1fr)_minmax(13rem,1fr)] gap-3 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#5A5B5E] border-b border-gray-100">
                        <div>Revista</div>
                        <div class="text-right">Total</div>
                        <div>Alcance registrado</div>
                        <div>Autores principales</div>
                    </div>

                    <div class="divide-y divide-gray-100">
                        {#each revistaRows as row}
                            {@const alcance = getAlcance(row)}
                            <div class="grid grid-cols-[minmax(14rem,1.4fr)_5rem_minmax(14rem,1fr)_minmax(13rem,1fr)] gap-3 items-center px-3 py-3 hover:bg-gray-50">
                                <div class="min-w-0">
                                    <button
                                        type="button"
                                        onclick={() => selectRevista(row.revista)}
                                        class="text-left text-sm font-semibold text-[#003627] leading-snug hover:text-[#289543] hover:underline focus-ring rounded"
                                        title={`Filtrar por revista: ${row.revista}`}
                                        aria-label={`Filtrar por revista ${row.revista}`}
                                    >
                                        {row.revista}
                                    </button>
                                    {#if row.variantes.length > 1}
                                        <p class="text-[11px] text-[#5A5B5E] mt-1">Agrupa {row.variantes.length} variantes</p>
                                    {/if}
                                </div>

                                <div class="text-right">
                                    <p class="text-lg font-bold text-[#003627] leading-none">{row.total}</p>
                                    <p class="text-[10px] text-[#5A5B5E] mt-1">art.</p>
                                </div>

                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold
                                            {alcance === 'mundial' ? 'bg-green-100 text-[#003627]' : alcance === 'regional' ? 'bg-red-100 text-[#C12927]' : 'bg-yellow-100 text-yellow-800'}">
                                            {alcance === 'mundial' ? 'Mundial' : alcance === 'regional' ? 'Regional' : 'Revisar dato'}
                                        </span>
                                        {#if alcance === 'inconsistente'}
                                            <span class="text-[11px] text-yellow-700">aparece como mundial y regional</span>
                                        {/if}
                                    </div>
                                    <div class="h-4 rounded-full bg-gray-100 overflow-hidden shadow-inner" title={`Total: ${row.total} artículos`}>
                                        <div
                                            class="h-full rounded-full {alcance === 'mundial' ? 'bg-[#289543]' : alcance === 'regional' ? 'bg-[#C12927]' : 'bg-yellow-500'}"
                                            style={`width: ${totalPct(row.total)}%`}
                                        ></div>
                                    </div>
                                </div>

                                <div class="min-w-0">
                                    <div class="flex flex-wrap gap-1.5">
                                        {#each row.autoresRanking.slice(0, 3) as autor}
                                            <span class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[11px] text-[#003627]" title={`${autor.nombre}: ${autor.count} artículo(s)`}>
                                                <span class="truncate max-w-[8rem]">{autor.nombre}</span>
                                                <strong>{autor.count}</strong>
                                            </span>
                                        {/each}
                                        {#if row.autoresRanking.length > 3}
                                            <span class="rounded bg-gray-50 px-2 py-0.5 text-[11px] text-[#5A5B5E]">+{row.autoresRanking.length - 3}</span>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</section>
