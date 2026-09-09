<!-- Header.svelte -->
<script>
    import { filters, clearTipoFilters, toggleCuartil, toggleTipo } from '../../stores/filters.svelte.js';
    import ActiveFilters from './ActiveFilters.svelte';

    let {
        carrerasDisponibles = [],
        totalPublicaciones,
        totalDocentes
    } = $props();

    const base = import.meta.env.BASE_URL;

    let hidden = $state(false);
    let lastY = 0;

    $effect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            if (currentY > lastY && currentY > 50) {
                hidden = true;
            } else if (currentY < lastY) {
                hidden = false;
            }
            lastY = currentY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    });
</script>

<header class="bg-[#003627] text-white shadow-md sticky top-0 z-50 border-b-4 border-[#C12927] transition-transform duration-300 {hidden ? '-translate-y-full' : 'translate-y-0'}">
    <!-- Top Bar: Logo, Título, Búsqueda, Métricas -->
    <div class="container mx-auto px-4 py-2">
        <div class="flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
            <!-- Branding -->
            <div class="flex items-center gap-3 w-full sm:w-auto">
                <div class="bg-white p-1 rounded-sm shadow-sm shrink-0">
                    <img src="{base}logo.webp" alt="Logo Carrera Educación" class="h-8 lg:h-10 w-auto" />
                </div>
                <div>
                    <h1 class="text-sm lg:text-base font-bold tracking-tight text-white leading-none">
                        Producción Científica
                    </h1>
                    <p class="text-green-100 text-[10px] font-medium mt-0.5">UNESUM</p>
                </div>
            </div>

            <!-- Search -->
            <div class="flex-1 w-full sm:w-auto sm:max-w-md order-3 sm:order-none mt-2 sm:mt-0">
                <div class="relative group">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-green-800/70 group-focus-within:text-[#289543]"></i>
                    <input type="text" bind:value={filters.query}
                           placeholder="Buscar publicación o autor..."
                           class="w-full pl-9 pr-3 py-2 min-h-[40px] bg-white border border-white/20 rounded-full focus:bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#289543] text-sm placeholder:text-gray-400 transition-all shadow-inner focus-ring">
                </div>
            </div>

            <!-- Metrics -->
            <div class="flex gap-4 sm:gap-6 justify-center sm:justify-end w-full sm:w-auto order-2 sm:order-none">
                <div class="text-center">
                    <div class="text-lg lg:text-xl font-bold leading-none">{totalPublicaciones}</div>
                    <div class="text-[9px] text-gray-200 uppercase tracking-wider">Publicaciones</div>
                </div>
                <div class="text-center">
                    <div class="text-lg lg:text-xl font-bold leading-none">{totalDocentes}</div>
                    <div class="text-[9px] text-gray-200 uppercase tracking-wider">Docentes</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Filter Bar: Carreras, Tipos, Cuartiles -->
    <div class="bg-[#002b1f] border-t border-white/10">
        <div class="container mx-auto px-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div class="flex items-center gap-4 lg:gap-6 min-w-max lg:min-w-0 lg:w-full">

                <!-- Filtro de Tipos -->
                <div class="flex bg-black/20 p-1 rounded-lg gap-1">
                    <button onclick={clearTipoFilters}
                            class="px-3 min-h-[36px] flex items-center justify-center rounded-md text-xs font-bold transition uppercase {filters.tipo.length === 0 ? 'bg-white text-[#003627] shadow' : 'text-white hover:bg-black/30 focus-ring'}"
                            aria-pressed={filters.tipo.length === 0}
                            title="Todos los tipos">Todos</button>
                    <button onclick={() => toggleTipo('articulo')}
                            class="px-3 min-h-[36px] flex items-center justify-center rounded-md transition {filters.tipo.includes('articulo') ? 'bg-[#289543] text-white shadow' : 'text-white hover:bg-black/30 focus-ring'}"
                            aria-pressed={filters.tipo.includes('articulo')}
                            aria-label="Filtrar por artículos" title="Artículos">
                            <i class="fas fa-newspaper text-sm mr-1.5 hidden sm:inline-block"></i>Artículos</button>
                    <button onclick={() => toggleTipo('libro')}
                            class="px-3 min-h-[36px] flex items-center justify-center rounded-md transition {filters.tipo.includes('libro') ? 'bg-[#C12927] text-white shadow' : 'text-white hover:bg-black/30 focus-ring'}"
                            aria-pressed={filters.tipo.includes('libro')}
                            aria-label="Filtrar por libros" title="Libros">
                            <i class="fas fa-book text-sm mr-1.5 hidden sm:inline-block"></i>Libros</button>
                    <button onclick={() => toggleTipo('capitulo')}
                            class="px-3 min-h-[36px] flex items-center justify-center rounded-md transition {filters.tipo.includes('capitulo') ? 'bg-[#004d37] text-white shadow' : 'text-white hover:bg-black/30 focus-ring'}"
                            aria-pressed={filters.tipo.includes('capitulo')}
                            aria-label="Filtrar por capítulos" title="Capítulos">
                            <i class="fas fa-bookmark text-sm mr-1.5 hidden sm:inline-block"></i>Capítulos</button>
                </div>

                <!-- Filtro de Cuartiles -->
                <div class="flex bg-black/20 p-1 rounded-lg gap-1">
                    {#each ['Q1','Q2','Q3','Q4'] as q}
                        <button onclick={() => toggleCuartil(q)}
                                class="w-10 min-h-[36px] flex items-center justify-center rounded-md text-xs font-bold transition {filters.cuartil.includes(q) ? 'bg-[#9333ea] text-white shadow' : 'text-white hover:bg-black/30 focus-ring'}"
                                aria-pressed={filters.cuartil.includes(q)}
                                aria-label="Filtrar cuartil {q}"
                                title="Filtrar {q}">{q}</button>
                    {/each}
                </div>

                <!-- Select Carrera -->
                {#if carrerasDisponibles.length}
                    <div class="relative shrink-0 lg:ml-auto">
                        <i class="fas fa-graduation-cap absolute left-3 top-1/2 -translate-y-1/2 text-green-100 pointer-events-none"></i>
                        <select bind:value={filters.carrera}
                                aria-label="Filtrar por carrera"
                                class="appearance-none min-w-[200px] min-h-[36px] pl-9 pr-8 py-1.5 rounded-lg text-sm font-semibold bg-black/20 text-white border border-transparent focus:border-white/30 hover:bg-black/30 focus-ring transition-colors">
                            <option value="" class="text-gray-900">Todas las carreras</option>
                            {#each carrerasDisponibles as carrera}
                                <option value={carrera} class="text-gray-900">{carrera}</option>
                            {/each}
                        </select>
                        <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-100 pointer-events-none"></i>
                    </div>
                {/if}

            </div>
        </div>
    </div>

    <ActiveFilters inHeader={true} />
</header>
