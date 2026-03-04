<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import WordCloud from './WordCloud.svelte';

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
    let wordFreq = $state([]);

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
        if (selectedDocente) {
            resultado = resultado.filter(p => 
                p.autor === selectedDocente || 
                (p.autor || '').split(' / ').some(a => a.trim() === selectedDocente)
            );
        }
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

    let topDocentesFiltrados = $derived.by(() => {
        if (!searchQuery) return topDocentes;
        const q = searchQuery.toLowerCase();
        return topDocentes.filter(d => d.nombre.toLowerCase().includes(q));
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
                            titulo: (item.TITULO_PUBLICACION || '').trim(),
                            autor: (item.APELLIDOS_NOMBRES || '').trim(),
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
                    const titulo = (item["AQUI SE ESCRIBE EL TEMA DE LA PUBLICACION TODO CON LETRA MAYUSCULA"] || '').trim();
                    const autor = (item["TODO CON MUYUSCULAS PRIMERO APELLIDOS Y LUEGO NOMBRES"] || '').trim();
                    
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
                    const titulo = (item["AQUI SE ESCRIBE EL TEMA DE LA PUBLICACION TODO CON LETRA MAYUSCULA"] || '').trim();
                    const autor = (item["TODO CON MUYUSCULAS PRIMERO APELLIDOS Y LUEGO NOMBRES"] || '').trim();

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

            // Calcular rankings con todos los registros para que cada autor reciba su crédito
            calculateRankings(newPublicaciones);

            // Deduplicar publicaciones para la lista y conteos
            let titulosVistos = new Set();
            let unicas = [];
            for (let pub of newPublicaciones) {
                let tituloNormalizado = (pub.titulo || '').toLowerCase().trim();
                if (!titulosVistos.has(tituloNormalizado)) {
                    titulosVistos.add(tituloNormalizado);
                    unicas.push({ ...pub });
                } else {
                    let pubExistente = unicas.find(p => (p.titulo || '').toLowerCase().trim() === tituloNormalizado);
                    if (pubExistente && pub.autor && !pubExistente.autor.includes(pub.autor)) {
                        pubExistente.autor += ' / ' + pub.autor;
                    }
                }
            }
            publicaciones = unicas;
            
            generateWordFreq();
            
            listaDocentes = topDocentes.map(d => d.nombre);
            setTimeout(createCharts, 100);

        } catch (error) {
            console.error('Error cargando datos:', error);
            loadDemoData();
        } finally {
            loading = false;
        }
    }

    function generateWordFreq() {
        const stopWords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para', 'su', 'sus', 'que', 'se', 'lo', 'si', 'no', 'esta', 'este', 'esto', 'como', 'entre', 'sobre', 'desde', 'hasta', 'durante', 'mediante', 'ante', 'bajo', 'tras', 'mediante', 'analisis', 'estudio', 'estrategia', 'investigacion', 'desarrollo', 'impacto', 'caso', 'proceso', 'univeridad', 'estatal', 'sur', 'manabi', 'educacion', 'carrera', 'docentes', 'estudiantes', 'instituciones', 'educativas', 'hacia']);
        const counts = {};
        
        publicaciones.forEach(pub => {
            const words = (pub.titulo || '').toLowerCase()
                .replace(/[.,:;()!¡?¿]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));
            
            words.forEach(w => {
                counts[w] = (counts[w] || 0) + 1;
            });
        });

        wordFreq = Object.entries(counts)
            .map(([text, size]) => ({ text: text.toUpperCase(), size }))
            .sort((a, b) => b.size - a.size)
            .slice(0, 40);
    }

    function calculateRankings(todasLasPubs) {
        const docentes = {};
        
        (todasLasPubs || publicaciones).forEach(pub => {
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

        // Convert to array and sort, then store original rank
        topDocentes = Object.values(docentes)
            .sort((a, b) => b.total - a.total)
            .map((d, i) => ({ ...d, rank: i + 1 }));
    }

    function loadDemoData() {
        topDocentes = [
            { nombre: "SOLÓRZANO ÁLAVA WILTER LEONEL", articulos: 2, libros: 1, capitulos: 1, total: 4 },
            { nombre: "GARCÍA MACÍAS VANESSA MARIUXI", articulos: 1, libros: 1, capitulos: 1, total: 3 },
            { nombre: "AMEN MORA PAUL GEOVANNY", articulos: 2, libros: 0, capitulos: 1, total: 3 },
        ];
        publicaciones = [
            { id: 'A1', tipo: 'articulo', tipoLabel: 'Artículo', titulo: "ESTRATEGIA DIDÁCTICA PARTICIPATIVA PARA LA ENSEÑANZA DE LAS CIENCIAS NATURALES", autor: "TUMBACO FIGUEROA GINA PATRICIA", revista: "Revista Científica ALCÓN", baseDatos: "ERIHPLUS", fecha: "08/12/2026", link: "https://soeici.org/index.php/alcon/article/view/867" },
            { id: 'L1', tipo: 'libro', tipoLabel: 'Libro', titulo: "Formación integral: Eje transversal en la Carrera Educación", autor: "SOLÓRZANO ÁLAVA WILTER LEONEL", isbn: "978-9942-7435-6-5", fecha: "23/12/2026", link: "https://editorialalema.org/libros/index.php/alema/article/view/61" },
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

        const basesMap = {};
        publicaciones.filter(p => p.tipo === 'articulo').forEach(p => {
            if (p.baseDatos) {
                if (!basesMap[p.baseDatos]) basesMap[p.baseDatos] = [];
                // Extraer solo apellidos (asumiendo formato "APELLIDO1 APELLIDO2 NOMBRE1...")
                const apellidos = p.autor ? p.autor.split(' ').slice(0, 2).join(' ') : 'Anonimo';
                basesMap[p.baseDatos].push(apellidos);
            }
        });

        // Convertir a array y ordenar por cantidad
        const basesSorted = Object.entries(basesMap)
            .map(([base, autores]) => ({ base, count: autores.length, autores }))
            .sort((a, b) => b.count - a.count);

        if (canvasBase) {
            chartBase = new Chart(canvasBase, {
                type: 'bar',
                data: {
                    labels: basesSorted.map(d => d.base),
                    datasets: [{
                        label: 'Artículos',
                        data: basesSorted.map(d => d.count),
                        backgroundColor: [colorGreen, colorDark, colorRed, colorGrey],
                        borderRadius: 4,
                        // Guardamos autores en el dataset para usarlos en el tooltip
                        autoresList: basesSorted.map(d => d.autores) 
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                afterBody: function(context) {
                                    const index = context[0].dataIndex;
                                    const autores = context[0].dataset.autoresList[index];
                                    // Mostrar máximo 10 autores para no hacer un tooltip gigante
                                    const display = autores.slice(0, 10).map(a => `• ${a}`);
                                    if (autores.length > 10) display.push(`...y ${autores.length - 10} más`);
                                    return ['', 'Autores:', ...display];
                                }
                            }
                        }
                    }, 
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

    const base = import.meta.env.BASE_URL;
</script>

<!-- Header Fijo -->
<header class="bg-gradient-to-r from-[#003627] via-[#004d37] to-[#289543] text-white shadow-xl fixed top-0 left-0 right-0 z-50 border-b-4 border-[#C12927]">
    <div class="container mx-auto px-4 py-2">
        <div class="flex flex-col lg:flex-row justify-between items-center gap-3">
            <div class="flex items-center gap-3 w-full lg:w-auto">
                <div class="bg-white p-1 rounded-sm shadow-sm shrink-0">
                    <img src="{base}carrera-educacion.png" alt="Logo Carrera Educación" class="h-10 lg:h-12 w-auto" />
                </div>
                <div class="hidden sm:block">
                    <h1 class="text-sm lg:text-base font-bold tracking-tight text-white leading-tight">
                        Producción 2026
                    </h1>
                    <p class="text-green-100 text-[9px] lg:text-[10px] font-medium">UNESUM Educación</p>
                </div>
                
                <!-- Buscador Integrado en Header -->
                <div class="flex-1 max-w-md ml-2 lg:ml-6">
                    <div class="relative group">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-green-800/70 group-focus-within:text-[#289543]"></i>
                        <input type="text" bind:value={searchQuery}
                               placeholder="Buscar por publicación o autor..."
                               class="w-full pl-9 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-full focus:bg-white focus:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C12927] text-base placeholder:text-green-100/50 transition-all shadow-inner">
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between w-full lg:w-auto gap-4 lg:gap-8 border-t lg:border-t-0 border-white/10 pt-2 lg:pt-0">
                <div class="flex gap-4">
                    <div class="text-center">
                        <div class="text-lg lg:text-xl font-bold leading-none">{totalPublicaciones}</div>
                        <div class="text-[9px] text-gray-200 uppercase tracking-wider">Publicaciones</div>
                    </div>
                    <div class="text-center">
                        <div class="text-lg lg:text-xl font-bold leading-none">{totalDocentes}</div>
                        <div class="text-[9px] text-gray-200 uppercase tracking-wider">Docentes</div>
                    </div>
                </div>

                <div class="flex gap-1">
                    <button onclick={() => filterTipo = 'todos'} 
                            class="px-2 py-1 rounded text-[10px] font-bold transition uppercase {filterTipo === 'todos' ? 'bg-white text-[#003627]' : 'bg-black/20 text-white hover:bg-black/30'}"
                            title="Ver todos">Todos</button>
                    <button onclick={() => toggleTipoFilter('articulo')} 
                            class="p-1.5 rounded transition {filterTipo === 'articulo' ? 'bg-[#289543] text-white ring-1 ring-white' : 'bg-black/20 text-white hover:bg-black/30'}"
                            title="Artículos"><i class="fas fa-newspaper text-xs"></i></button>
                    <button onclick={() => toggleTipoFilter('libro')} 
                            class="p-1.5 rounded transition {filterTipo === 'libro' ? 'bg-[#C12927] text-white ring-1 ring-white' : 'bg-black/20 text-white hover:bg-black/30'}"
                            title="Libros"><i class="fas fa-book text-xs"></i></button>
                    <button onclick={() => toggleTipoFilter('capitulo')} 
                            class="p-1.5 rounded transition {filterTipo === 'capitulo' ? 'bg-[#003627] text-white ring-1 ring-white' : 'bg-black/20 text-white hover:bg-black/30'}"
                            title="Capítulos"><i class="fas fa-bookmark text-xs"></i></button>
                </div>
            </div>
        </div>
    </div>
</header>

{#if loading}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
        <div class="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <div class="w-12 h-12 border-4 border-[#289543] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-[#5A5B5E]">Cargando...</p>
        </div>
    </div>
{/if}

<main class="container mx-auto px-4 pt-[130px] lg:pt-[84px] pb-8">
    {#if selectedDocente || filterTipo !== 'todos' || searchQuery}
        <div class="mb-6 flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <span class="text-xs font-bold text-gray-400 uppercase mr-2">Filtros activos:</span>
            
            {#if selectedDocente}
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-[#003627] text-xs font-medium border border-green-200">
                    <i class="fas fa-user mr-2"></i>{selectedDocente}
                    <button onclick={() => selectedDocente = ''} class="ml-2 hover:text-red-600 transition" aria-label="Quitar docente"><i class="fas fa-times"></i></button>
                </span>
            {/if}

            {#if filterTipo !== 'todos'}
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200">
                    <i class="fas fa-filter mr-2"></i>{filterTipo.charAt(0).toUpperCase() + filterTipo.slice(1)}s
                    <button onclick={() => filterTipo = 'todos'} class="ml-2 hover:text-red-600 transition"><i class="fas fa-times"></i></button>
                </span>
            {/if}

            <button onclick={clearFilters} class="text-xs text-red-600 font-bold hover:underline ml-auto">
                <i class="fas fa-trash-alt mr-1"></i> LIMPIAR TODO
            </button>
        </div>
    {/if}

    <!-- Gráficos -->
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

    <!-- Nube de Palabras -->
    <section class="mb-8">
        <div class="bg-white rounded-xl shadow-md p-6">
            <h3 class="font-semibold text-[#003627] mb-2 text-center">
                <i class="fas fa-cloud text-[#289543] mr-2"></i>
                Nube de Conceptos Clave
            </h3>
            <p class="text-center text-xs text-[#5A5B5E] mb-4 italic">Huella digital visual de nuestra producción científica</p>
            <WordCloud words={wordFreq} />
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
            {#each topDocentesFiltrados as docente (docente.nombre)}
                <div onclick={() => filterByDocente(docente.nombre)}
                     class="bg-white rounded-xl p-4 shadow-md cursor-pointer border-2 transition-all duration-300
                     {selectedDocente === docente.nombre ? 'border-[#289543] ring-2 ring-green-100 scale-[1.03] z-10 shadow-lg' : (selectedDocente ? 'opacity-30 grayscale-[0.5] scale-[0.97]' : 'border-transparent hover:border-gray-200 hover:scale-[1.02] hover:shadow-lg')}"
                     role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && filterByDocente(docente.nombre)}>
                    
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                             {docente.rank === 1 ? 'bg-yellow-100' : docente.rank === 2 ? 'bg-gray-100' : docente.rank === 3 ? 'bg-orange-100' : 'bg-green-50'}">
                            {#if docente.rank === 1}
                                <i class="fas fa-medal text-[#fbbf24]"></i>
                            {:else if docente.rank === 2}
                                <i class="fas fa-medal text-[#9ca3af]"></i>
                            {:else if docente.rank === 3}
                                <i class="fas fa-medal text-[#d97706]"></i>
                            {:else}
                                <span class="text-[#5A5B5E]">{docente.rank}</span>
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

<footer class="bg-[#003627] text-gray-200 py-8 mt-12 border-t-4 border-[#C12927]">
    <div class="container mx-auto px-4 text-center">
        <div class="flex justify-center mb-4">
             <img src="{base}carrera-educacion.png" alt="Logo Carrera Educación" class="h-10 w-auto brightness-0 invert opacity-80" />
        </div>
        <p class="font-semibold text-white"><i class="fas fa-university mr-2"></i>Universidad Estatal del Sur de Manabí</p>
        <p class="text-sm mt-1">Facultad de Ciencias Sociales, Humanísticas y de la Educación</p>
        <p class="text-sm mt-2 font-mono"><i class="fas fa-envelope mr-2 text-[#289543]"></i>paul.amen@unesum.edu.ec</p>
    </div>
</footer>

<style>
    :global(.medal-gold) { color: #fbbf24; }
    :global(.medal-silver) { color: #9ca3af; }
    :global(.medal-bronze) { color: #d97706; }
</style>
