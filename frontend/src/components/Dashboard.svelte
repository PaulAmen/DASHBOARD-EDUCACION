<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    // Config
    const API_URL = 'https://script.google.com/macros/s/AKfycby07gHaIc22g1AEnGSH4ht1WZ2bHx4OfbaX07w7tO26Lz5XxZ46LzXfouPCSNApzVH0/exec';
    const USE_API = true;

    // State
    let loading = $state(true);
    let searchQuery = $state('');
    let filterTipo = $state('todos');
    let selectedDocente = $state('');
    let publicaciones = $state([]);
    let topDocentes = $state([]);
    let listaDocentes = $state([]);

    // Charts
    let chartTipo;
    let chartBase;
    let canvasTipo;
    let canvasBase;

    // Derived
    let totalPublicaciones = $derived(publicaciones.length);
    let totalDocentes = $derived(topDocentes.length);
    let conteoArticulos = $derived(publicaciones.filter(p => p.tipo === 'articulo').length);
    let conteoLibros = $derived(publicaciones.filter(p => p.tipo === 'libro').length);
    let conteoCapitulos = $derived(publicaciones.filter(p => p.tipo === 'capitulo').length);
    let hasActiveFilters = $derived(searchQuery || filterTipo !== 'todos' || selectedDocente);

    let publicacionesFiltradas = $derived.by(() => {
        let resultado = [...publicaciones];
        if (filterTipo !== 'todos') resultado = resultado.filter(p => p.tipo === filterTipo);
        if (selectedDocente) resultado = resultado.filter(p => p.autor === selectedDocente);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            resultado = resultado.filter(p => 
                (p.titulo || '').toLowerCase().includes(q) ||
                (p.autor || '').toLowerCase().includes(q) ||
                (p.revista || '').toLowerCase().includes(q) ||
                (p.libroPadre || '').toLowerCase().includes(q)
            );
        }
        return resultado;
    });

    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        loading = true;
        try {
            let data;
            if (USE_API) {
                const response = await fetch(API_URL + '?action=dashboard');
                data = await response.json();
            } else {
                // ... demo data fallback (omitted for brevity in this context, but keeping structure)
                loadDemoData();
                return;
            }

            let newPublicaciones = [];

            // Process Revistas (Articles) - Clean keys
            if (data.revistas && data.revistas.data) {
                data.revistas.data.forEach((item, index) => {
                    // Skip if it looks like a metadata row (optional check)
                    if (item.TITULO_PUBLICACION === 'TITULO_PUBLICACION') return;

                    if (item.TITULO_PUBLICACION && item.APELLIDOS_NOMBRES) {
                        newPublicaciones.push({
                            id: 'A' + index,
                            tipo: 'articulo',
                            tipoLabel: 'Artículo',
                            titulo: item.TITULO_PUBLICACION,
                            autor: item.APELLIDOS_NOMBRES,
                            revista: item.NOMBRE_REVISTA,
                            baseDatos: item.BASE_DATOS_INDEXADA,
                            fecha: item.FECHA_PUBLICACION,
                            link: item.LINK_PUBLICACION,
                            proyecto: item.TITULO_PROYECTO
                        });
                    }
                });
            }

            // Process Libros (Books) - Long keys
            if (data.libros && data.libros.data) {
                data.libros.data.forEach((item, index) => {
                    // Keys based on the curl output
                    const titulo = item["AQUI SE ESCRIBE EL TEMA DE LA PUBLICACION TODO CON LETRA MAYUSCULA"];
                    const autor = item["TODO CON MUYUSCULAS PRIMERO APELLIDOS Y LUEGO NOMBRES"];
                    
                    if (titulo && autor && titulo !== 'TITULO_LIBRO') {
                         newPublicaciones.push({
                            id: 'L' + index,
                            tipo: 'libro',
                            tipoLabel: 'Libro',
                            titulo: titulo,
                            autor: autor,
                            isbn: item["SIN LA PALABRA ISBN (SOLO EL CODIGO)"],
                            fecha: item["DIA/MES/ANO (EJEMPLO: 01/02/2024)"],
                            link: item["AQUI SE ESCRIBE EL LINK DEL LIBRO DONDE SE ENCUENTRE EL PDF COMPLETO"],
                            proyecto: item["SI SON DE PROYECTOS ESTOS CASILLEROS SE LLENAN CON EL NOMBRE DEL PROYECTO TAL CUAL FUE APROBADO"]
                        });
                    }
                });
            }

            // Process Capitulos (Chapters) - Long keys
            if (data.capitulos && data.capitulos.data) {
                data.capitulos.data.forEach((item, index) => {
                    const titulo = item["AQUI SE ESCRIBE EL TEMA DE LA PUBLICACION TODO CON LETRA MAYUSCULA"];
                    const autor = item["TODO CON MUYUSCULAS PRIMERO APELLIDOS Y LUEGO NOMBRES"];

                    if (titulo && autor && titulo !== 'TITULO_CAPITULO') {
                        newPublicaciones.push({
                            id: 'C' + index,
                            tipo: 'capitulo',
                            tipoLabel: 'Capítulo',
                            titulo: titulo,
                            autor: autor,
                            libroPadre: item["AQUI SE ESCRIBE EL LIBRO DONDE FUE PUBLICADA EL CAPITULO   TODO CON LETRA MAYUSCULA"],
                            isbn: item["SIN LA PALABRA ISSN (SOLO EL CODIGO)"],
                            fecha: item["DIA/MES/ANO (EJEMPLO: 01/02/2024)"]
                        });
                    }
                });
            }

            publicaciones = newPublicaciones;
            calculateRankings();
            
            listaDocentes = topDocentes.map(d => d.nombre);
            setTimeout(createCharts, 100);

        } catch (error) {
            console.error('Error cargando datos:', error);
            loadDemoData();
        } finally {
            loading = false;
        }
    }

    function calculateRankings() {
        const docentes = {};
        
        publicaciones.forEach(pub => {
            const autor = pub.autor;
            if (!autor) return;
            
            // Normalize author name slightly (trim)
            const nombre = autor.trim();
            
            if (!docentes[nombre]) {
                docentes[nombre] = { nombre: nombre, articulos: 0, libros: 0, capitulos: 0, total: 0 };
            }
            
            docentes[nombre].total++;
            if (pub.tipo === 'articulo') docentes[nombre].articulos++;
            if (pub.tipo === 'libro') docentes[nombre].libros++;
            if (pub.tipo === 'capitulo') docentes[nombre].capitulos++;
        });

        // Convert to array and sort
        topDocentes = Object.values(docentes).sort((a, b) => b.total - a.total);
    }

    function loadDemoData() {
        topDocentes = [
            { nombre: "SOLÓRZANO ÁLAVA WILTER LEONEL", articulos: 2, libros: 1, capitulos: 1, total: 4 },
            { nombre: "GARCÍA MACÍAS VANESSA MARIUXI", articulos: 1, libros: 1, capitulos: 1, total: 3 },
            { nombre: "AMEN MORA PAUL GEOVANNY", articulos: 2, libros: 0, capitulos: 1, total: 3 },
        ];
        publicaciones = [
            { id: 'A1', tipo: 'articulo', tipoLabel: 'Artículo', titulo: "ESTRATEGIA DIDÁCTICA PARTICIPATIVA PARA LA ENSEÑANZA DE LAS CIENCIAS NATURALES", autor: "TUMBACO FIGUEROA GINA PATRICIA", revista: "Revista Científica ALCÓN", baseDatos: "ERIHPLUS", fecha: "08/12/2025", link: "https://soeici.org/index.php/alcon/article/view/867" },
            { id: 'L1', tipo: 'libro', tipoLabel: 'Libro', titulo: "Formación integral: Eje transversal en la Carrera Educación", autor: "SOLÓRZANO ÁLAVA WILTER LEONEL", isbn: "978-9942-7435-6-5", fecha: "23/12/2025", link: "https://editorialalema.org/libros/index.php/alema/article/view/61" },
            { id: 'C1', tipo: 'capitulo', tipoLabel: 'Capítulo', titulo: "Introducción a la Gestión Organizacional en Instituciones Educativas", libroPadre: "Gestión Organizacional - Zona Sur de Manabí", autor: "GARCÍA MACÍAS VANESSA MARIUXI", isbn: "978-9942-579-13-3", fecha: "06/01/2026" },
        ];
    }

    function createCharts() {
        if (chartTipo) chartTipo.destroy();
        if (chartBase) chartBase.destroy();

        // UNESUM Palette
        const colorGreen = '#289543';
        const colorRed = '#C12927';
        const colorDark = '#003627';
        const colorGrey = '#5A5B5E';

        if (canvasTipo) {
            chartTipo = new Chart(canvasTipo, {
                type: 'doughnut',
                data: {
                    labels: ['Artículos', 'Libros', 'Capítulos'],
                    datasets: [{
                        data: [conteoArticulos, conteoLibros, conteoCapitulos],
                        backgroundColor: [colorGreen, colorRed, colorDark],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: colorGrey } } } }
            });
        }

        const bases = {};
        publicaciones.filter(p => p.tipo === 'articulo').forEach(p => {
            if (p.baseDatos) bases[p.baseDatos] = (bases[p.baseDatos] || 0) + 1;
        });

        if (canvasBase) {
            chartBase = new Chart(canvasBase, {
                type: 'bar',
                data: {
                    labels: Object.keys(bases),
                    datasets: [{
                        label: 'Artículos',
                        data: Object.values(bases),
                        backgroundColor: [colorGreen, colorDark, colorRed, colorGrey],
                        borderRadius: 4
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } }, 
                    scales: { 
                        y: { beginAtZero: true, ticks: { color: colorGrey } },
                        x: { ticks: { color: colorGrey } }
                    } 
                }
            });
        }
    }

    function clearFilters() {
        searchQuery = '';
        filterTipo = 'todos';
        selectedDocente = '';
    }

    function toggleTipoFilter(tipo) {
        filterTipo = filterTipo === tipo ? 'todos' : tipo;
    }

    function filterByDocente(nombre) {
        selectedDocente = selectedDocente === nombre ? '' : nombre;
    }
</script>

<!-- Header -->
<header class="bg-gradient-to-r from-[#003627] to-[#289543] text-white shadow-xl sticky top-0 z-40">
    <div class="container mx-auto px-4 py-4">
        <div class="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div class="text-center lg:text-left">
                <h1 class="text-lg lg:text-2xl font-bold">
                    <i class="fas fa-graduation-cap mr-2"></i>
                    Producción Científica 2025
                </h1>
                <p class="text-gray-200 text-xs lg:text-sm">Carrera Educación - UNESUM</p>
            </div>
            <div class="flex items-center gap-6">
                <div class="text-center">
                    <div class="text-2xl lg:text-3xl font-bold">{totalPublicaciones}</div>
                    <div class="text-[10px] lg:text-xs text-gray-200">Publicaciones</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl lg:text-3xl font-bold">{totalDocentes}</div>
                    <div class="text-[10px] lg:text-xs text-gray-200">Docentes</div>
                </div>
            </div>
        </div>
    </div>
</header>

{#if loading}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <div class="w-12 h-12 border-4 border-[#289543] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-[#5A5B5E]">Cargando...</p>
        </div>
    </div>
{/if}

<main class="container mx-auto px-4 py-6">
    <!-- Gráficos al principio -->
    <section class="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-md p-6">
            <h3 class="font-semibold text-[#003627] mb-4"><i class="fas fa-chart-pie text-[#289543] mr-2"></i>Distribución por Tipo</h3>
            <div class="h-64"><canvas bind:this={canvasTipo}></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-md p-6">
            <h3 class="font-semibold text-[#003627] mb-4"><i class="fas fa-database text-[#C12927] mr-2"></i>Artículos por Base de Datos</h3>
            <div class="h-64"><canvas bind:this={canvasBase}></canvas></div>
        </div>
    </section>

    <!-- Ranking Docentes -->
    <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-[#003627]">
                <i class="fas fa-trophy text-[#C12927] mr-2"></i>
                Ranking de Docentes
            </h2>
            <span class="text-sm text-[#5A5B5E]">Click para filtrar publicaciones</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {#each topDocentes as docente, idx}
                <div onclick={() => filterByDocente(docente.nombre)}
                     class="bg-white rounded-xl p-4 shadow-md cursor-pointer border-2 transition-all hover:scale-[1.02] hover:shadow-lg {selectedDocente === docente.nombre ? 'border-[#289543] ring-2 ring-green-100' : 'border-transparent hover:border-gray-200'}"
                     role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && filterByDocente(docente.nombre)}>
                    
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                             {idx === 0 ? 'bg-yellow-100' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-orange-100' : 'bg-green-50'}">
                            {#if idx === 0}
                                <i class="fas fa-medal text-[#fbbf24]"></i>
                            {:else if idx === 1}
                                <i class="fas fa-medal text-[#9ca3af]"></i>
                            {:else if idx === 2}
                                <i class="fas fa-medal text-[#d97706]"></i>
                            {:else}
                                <span class="text-[#5A5B5E]">{idx + 1}</span>
                            {/if}
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-[#003627] text-sm truncate" title={docente.nombre}>{docente.nombre}</h3>
                            <div class="flex flex-wrap items-center gap-2 mt-2">
                                <span class="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-[#003627]" title="Artículos">
                                    <i class="fas fa-newspaper mr-1"></i>{docente.articulos}
                                </span>
                                <span class="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-[#C12927]" title="Libros">
                                    <i class="fas fa-book mr-1"></i>{docente.libros}
                                </span>
                                <span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-[#003627]" title="Capítulos">
                                    <i class="fas fa-bookmark mr-1"></i>{docente.capitulos}
                                </span>
                            </div>
                            <div class="mt-2 text-right">
                                <span class="text-lg font-bold text-[#289543]">{docente.total}</span>
                                <span class="text-xs text-[#5A5B5E]">total</span>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- Filtros -->
    <section class="bg-white rounded-xl shadow-md p-4 mb-6 sticky top-20 z-30 overflow-hidden">
        <div class="flex flex-col md:flex-row items-center gap-4">
            <div class="w-full md:flex-1 md:min-w-64 min-w-0">
                <div class="relative w-full">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5B5E]"></i>
                    <input type="text" bind:value={searchQuery}
                           placeholder="Buscar publicación..."
                           class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#289543] text-[#5A5B5E] text-sm truncate">
                </div>
            </div>
            
            <div class="flex flex-wrap items-center gap-2 w-full md:w-auto justify-center md:justify-start">
                <button onclick={() => filterTipo = 'todos'} class="px-3 py-2 rounded-lg text-sm font-medium transition flex-grow md:flex-grow-0 text-center
                        {filterTipo === 'todos' ? 'bg-[#003627] text-white' : 'bg-gray-100 text-[#5A5B5E] hover:bg-gray-200'}">
                    Todos
                </button>
                <button onclick={() => toggleTipoFilter('articulo')} class="px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 flex-grow md:flex-grow-0
                        {filterTipo === 'articulo' ? 'bg-[#289543] text-white' : 'bg-green-50 text-[#289543] hover:bg-green-100'}">
                    <i class="fas fa-newspaper"></i> Artículos <span class="bg-white/20 px-1.5 rounded">{conteoArticulos}</span>
                </button>
                <button onclick={() => toggleTipoFilter('libro')} class="px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 flex-grow md:flex-grow-0
                        {filterTipo === 'libro' ? 'bg-[#C12927] text-white' : 'bg-red-50 text-[#C12927] hover:bg-red-100'}">
                    <i class="fas fa-book"></i> Libros <span class="bg-white/20 px-1.5 rounded">{conteoLibros}</span>
                </button>
                <button onclick={() => toggleTipoFilter('capitulo')} class="px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 flex-grow md:flex-grow-0
                        {filterTipo === 'capitulo' ? 'bg-[#003627] text-white' : 'bg-gray-200 text-[#003627] hover:bg-gray-300'}">
                    <i class="fas fa-bookmark"></i> Capítulos <span class="bg-white/20 px-1.5 rounded">{conteoCapitulos}</span>
                </button>
            </div>
            
            <select bind:value={selectedDocente}
                    class="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#289543] text-sm text-[#5A5B5E]">
                <option value="">Todos los docentes</option>
                {#each listaDocentes as docente}
                    <option value={docente}>{docente}</option>
                {/each}
            </select>
            
            {#if hasActiveFilters}
                <button onclick={clearFilters}
                        class="w-full md:w-auto px-4 py-2 text-[#C12927] hover:bg-red-50 rounded-lg text-sm font-medium text-center">
                    <i class="fas fa-times mr-1"></i> Limpiar
                </button>
            {/if}
        </div>
        
        {#if selectedDocente}
            <div class="mt-3 flex items-center gap-2">
                <span class="text-sm text-[#5A5B5E]">Filtrando:</span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-[#003627] text-sm">
                    <i class="fas fa-user mr-2"></i>{selectedDocente}
                    <button onclick={() => selectedDocente = ''} class="ml-2 hover:text-[#C12927]"><i class="fas fa-times"></i></button>
                </span>
            </div>
        {/if}
    </section>

    <!-- Resultados -->
    <section>
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-[#003627]">
                <span>{publicacionesFiltradas.length}</span> publicaciones encontradas
            </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {#each publicacionesFiltradas as pub (pub.id)}
                <div class="bg-white rounded-xl p-5 shadow-sm border-l-4 transition-all hover:bg-gray-50
                     {pub.tipo === 'articulo' ? 'border-[#289543]' : pub.tipo === 'libro' ? 'border-[#C12927]' : 'border-[#003627]'}">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="px-2 py-0.5 rounded text-xs font-medium
                                      {pub.tipo === 'articulo' ? 'bg-green-100 text-[#003627]' : pub.tipo === 'libro' ? 'bg-red-100 text-[#C12927]' : 'bg-gray-200 text-[#003627]'}">
                                    <i class="mr-1 {pub.tipo === 'articulo' ? 'fas fa-newspaper' : pub.tipo === 'libro' ? 'fas fa-book' : 'fas fa-bookmark'}"></i>
                                    {pub.tipoLabel}
                                </span>
                                {#if pub.baseDatos}
                                    <span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-[#5A5B5E]">{pub.baseDatos}</span>
                                {/if}
                            </div>
                            
                            <h3 class="font-semibold text-[#003627] mb-2">{pub.titulo}</h3>
                            
                            <div class="text-sm text-[#5A5B5E] space-y-1">
                                {#if pub.revista}
                                    <p><i class="fas fa-journal-whills w-5 text-gray-400"></i> {pub.revista}</p>
                                {/if}
                                {#if pub.isbn}
                                    <p><i class="fas fa-barcode w-5 text-gray-400"></i> ISBN: {pub.isbn}</p>
                                {/if}
                                {#if pub.libroPadre}
                                    <p class="text-xs"><i class="fas fa-book w-5 text-gray-400"></i> En: <span class="italic">{pub.libroPadre}</span></p>
                                {/if}
                                <p><i class="fas fa-user w-5 text-gray-400"></i> <span class="font-medium">{pub.autor}</span></p>
                                {#if pub.fecha}
                                    <p><i class="fas fa-calendar w-5 text-gray-400"></i> {pub.fecha}</p>
                                {/if}
                            </div>
                        </div>
                        
                        {#if pub.link}
                            <div class="flex-shrink-0">
                                <a href={pub.link} target="_blank" rel="noopener noreferrer"
                                   class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-[#289543] hover:bg-[#289543] hover:text-white transition"
                                   title="Ver publicación">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        {/if}
                    </div>
                    
                    {#if pub.proyecto}
                        <div class="mt-3 pt-3 border-t border-gray-100">
                            <p class="text-xs text-[#5A5B5E]"><i class="fas fa-project-diagram mr-1"></i> Proyecto: <span class="text-gray-700">{pub.proyecto}</span></p>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        {#if publicacionesFiltradas.length === 0}
            <div class="text-center py-12 bg-white rounded-xl">
                <i class="fas fa-search text-gray-300 text-5xl mb-4"></i>
                <p class="text-[#5A5B5E]">No se encontraron publicaciones</p>
                <button onclick={clearFilters} class="mt-4 text-[#C12927] hover:underline">Limpiar filtros</button>
            </div>
        {/if}
    </section>
</main>

<footer class="bg-gray-800 text-gray-400 py-6 mt-12">
    <div class="container mx-auto px-4 text-center">
        <p><i class="fas fa-university mr-2"></i>Universidad Estatal del Sur de Manabí</p>
        <p class="text-sm mt-1">Facultad de Ciencias Sociales, Humanísticas y de la Educación</p>
        <p class="text-sm mt-2"><i class="fas fa-envelope mr-2"></i>paul.amen@unesum.edu.ec</p>
    </div>
</footer>

<style>
    :global(.medal-gold) { color: #fbbf24; }
    :global(.medal-silver) { color: #9ca3af; }
    :global(.medal-bronze) { color: #d97706; }
</style>
