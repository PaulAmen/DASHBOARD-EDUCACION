<script>
    import { onDestroy } from 'svelte';
    import * as d3 from 'd3';
    import cloud from 'd3-cloud';
    import { colorArticulo, colorLibro, colorCapitulo, colorGrey } from '../lib/theme.js';

    let { words = [] } = $props();
    let chartContainer = $state();
    let resizeObserver;
    let currentWidth = $state(0);
    let activeLayout;

    $effect(() => {
        const node = chartContainer;
        if (!node || typeof ResizeObserver === 'undefined') return;

        if (resizeObserver) resizeObserver.disconnect();

        resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) return;

            const newWidth = Math.round(entry.contentRect.width);
            if (Math.abs(newWidth - currentWidth) > 10) {
                currentWidth = newWidth;
            }
        });

        resizeObserver.observe(node);
        currentWidth = Math.round(node.offsetWidth || 500);

        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }
        };
    });

    $effect(() => {
        const node = chartContainer;
        const visibleWords = words;
        const width = currentWidth || node?.offsetWidth || 0;

        if (!visibleWords.length) {
            if (activeLayout) activeLayout.stop();
            return;
        }

        if (node && width > 0) {
            renderCloud(visibleWords, width);
        }
    });

    onDestroy(() => {
        if (resizeObserver) resizeObserver.disconnect();
        if (activeLayout) activeLayout.stop();
    });

    function renderCloud(sourceWords, width) {
        if (!chartContainer) return;
        if (activeLayout) activeLayout.stop();
        d3.select(chartContainer).selectAll("*").remove();

        const height = width < 600 ? 320 : 380;
        const isMobile = width < 600;
        const maxCount = Math.max(...sourceWords.map(d => d.size), 1);
        const minFont = isMobile ? 11 : 12;
        const maxFont = isMobile ? 28 : 42;

        function getFontSize(word) {
            const weight = Math.sqrt(word.size / maxCount);
            return Math.round(minFont + weight * (maxFont - minFont));
        }

        const layout = cloud()
            .size([width, height])
            .words(sourceWords.map(d => ({ text: d.text, size: d.size })))
            .padding(isMobile ? 2 : 3)
            // Deterministic rotation: alternate between 0 and 90, but on mobile keep it mostly 0
            .rotate((d, i) => {
                if (isMobile) return 0;
                return (i % 3 === 0) ? 90 : 0;
            })
            .font("'Inter', system-ui, sans-serif")
            .fontWeight("bold")
            .fontSize(getFontSize)
            .on("end", draw);

        activeLayout = layout;
        layout.start();

        function draw(renderedWords) {
            if (layout !== activeLayout || !chartContainer) return;
            const colors = [colorArticulo, colorCapitulo, colorLibro, colorGrey];

            d3.select(chartContainer)
                .append("svg")
                .attr("width", layout.size()[0])
                .attr("height", layout.size()[1])
                .append("g")
                .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .selectAll("text")
                .data(renderedWords)
                .enter().append("text")
                .style("font-size", d => d.size + "px")
                .style("font-family", "'Inter', system-ui, sans-serif")
                .style("font-weight", "bold")
                .style("fill", (d, i) => colors[i % colors.length])
                .attr("text-anchor", "middle")
                .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
                .text(d => d.text);
        }
    }
</script>

{#if words.length === 0}
    <div class="h-80 sm:h-96 w-full flex items-center justify-center dashboard-muted bg-gray-50 rounded-lg">
        No hay datos suficientes para generar la nube de palabras.
    </div>
{:else}
    <div bind:this={chartContainer} class="w-full h-80 sm:h-96 flex items-center justify-center overflow-hidden"></div>
{/if}
