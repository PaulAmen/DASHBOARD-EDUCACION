<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import cloud from 'd3-cloud';

    let { words = [] } = $props();
    let chartContainer;

    $effect(() => {
        if (words.length > 0 && chartContainer) {
            renderCloud();
        }
    });

    function renderCloud() {
        d3.select(chartContainer).selectAll("*").remove();

        const width = chartContainer.offsetWidth || 500;
        const height = 300;

        const layout = cloud()
            .size([width, height])
            .words(words.map(d => ({ text: d.text, size: d.size })))
            .padding(5)
            .rotate(() => (~~(Math.random() * 2) * 90))
            .font("Impact")
            .fontSize(d => Math.sqrt(d.size) * 10)
            .on("end", draw);

        layout.start();

        function draw(words) {
            const colors = ['#003627', '#289543', '#C12927', '#5A5B5E'];
            
            d3.select(chartContainer)
                .append("svg")
                .attr("width", layout.size()[0])
                .attr("height", layout.size()[1])
                .append("g")
                .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => d.size + "px")
                .style("font-family", "Impact")
                .style("fill", (d, i) => colors[i % colors.length])
                .attr("text-anchor", "middle")
                .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
                .text(d => d.text);
        }
    }
</script>

<div bind:this={chartContainer} class="w-full h-[300px]"></div>
