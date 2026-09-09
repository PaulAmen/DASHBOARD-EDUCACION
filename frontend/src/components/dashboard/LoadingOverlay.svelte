<!-- LoadingOverlay.svelte -->
<script>
    let { loading } = $props();
</script>

{#if loading}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
        <div class="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <div class="w-12 h-12 border-4 border-[#289543] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-[#5A5B5E]">Cargando...</p>
        </div>
    </div>
{/if}
