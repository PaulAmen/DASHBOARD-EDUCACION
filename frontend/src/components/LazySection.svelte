<script>
    let {
        loader,
        componentProps = {},
        minHeight = '12rem',
        rootMargin = '200px',
        label = 'seccion'
    } = $props();

    let componentPromise = $state(null);

    function startLoading() {
        if (!componentPromise) {
            componentPromise = loader();
        }
    }

    function observeVisibility(node) {
        if (typeof IntersectionObserver === 'undefined') {
            startLoading();
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    startLoading();
                    observer.disconnect();
                }
            },
            { rootMargin }
        );

        observer.observe(node);

        return {
            destroy() {
                observer.disconnect();
            }
        };
    }
</script>

<div use:observeVisibility style={`min-height: ${minHeight};`}>
    {#if componentPromise}
        {#await componentPromise then module}
            {@const Component = module.default}
            <Component {...componentProps} />
        {:catch}
            <div class="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-[#C12927]">
                No se pudo cargar la seccion de {label}.
            </div>
        {/await}
    {:else}
        <slot>
            <div class="animate-pulse rounded-xl bg-white p-6 shadow-md">
                <div class="mb-4 h-5 w-48 rounded bg-gray-200"></div>
                <div class="space-y-3">
                    <div class="h-4 rounded bg-gray-100"></div>
                    <div class="h-4 rounded bg-gray-100"></div>
                    <div class="h-4 w-5/6 rounded bg-gray-100"></div>
                </div>
            </div>
        </slot>
    {/if}
</div>
