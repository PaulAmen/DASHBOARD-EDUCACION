<!-- Footer.svelte -->
<script>
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

<footer class="fixed bottom-0 left-0 right-0 bg-[#003627] border-t-2 border-[#C12927] py-2 z-40 transition-transform duration-300 {hidden ? 'translate-y-full' : 'translate-y-0'}">
    <div class="container mx-auto px-4 text-center text-xs">
        <p class="text-white font-extrabold text-lg uppercase tracking-wide mb-0.5">Dirección de Investigación</p>
        <p class="text-green-200 font-medium text-sm">Coordinación Gestión de la Difusión, Divulgación Científica y Propiedad Intelectual</p>
        <p class="text-gray-300 text-xs font-bold mt-1">by: <a href="mailto:paul.amen@unesum.edu.ec" class="text-[#289543] hover:text-white hover:underline transition-colors font-mono">paul.amen@unesum.edu.ec</a></p>
    </div>
</footer>
