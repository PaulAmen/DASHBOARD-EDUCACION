<!-- ScrollTopButton.svelte -->
<script>
    import { onMount } from 'svelte';

    let showScrollTop = $state(false);

    onMount(() => {
        if (typeof window === 'undefined') return;
        const handler = () => {
            showScrollTop = window.scrollY > 300;
        };
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    });
</script>

{#if showScrollTop}
    <button onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            class="fixed bottom-14 right-4 z-50 w-10 h-10 bg-[#C12927] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#a02020] transition"
            title="Ir arriba">
        <i class="fas fa-chevron-up"></i>
    </button>
{/if}
