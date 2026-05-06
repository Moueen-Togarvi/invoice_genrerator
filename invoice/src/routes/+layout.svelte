<script lang="ts">
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import { removeToast, pushToast, toasts } from '$lib/toast-store';

	let { children, data } = $props();
	let lastFlashId = '';

	function getToastClasses(type: 'success' | 'error') {
		return type === 'success'
			? 'border-green-200 bg-green-50 text-green-900 shadow-green-100'
			: 'border-rose-200 bg-rose-50 text-rose-900 shadow-rose-100';
	}

	function getToastIcon(type: 'success' | 'error') {
		return type === 'success' ? 'fas fa-circle-check text-green-600' : 'fas fa-circle-xmark text-rose-600';
	}

	$effect(() => {
		if (browser && data?.flash?.id && data.flash.id !== lastFlashId) {
			lastFlashId = data.flash.id;
			pushToast(data.flash);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<script src="https://cdn.tailwindcss.com"></script>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
	/>
</svelte:head>

{@render children()}

<div class="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-3">
	{#each $toasts as toast (toast.id)}
		<div
			class={`pointer-events-auto rounded-3xl border px-4 py-3 shadow-xl backdrop-blur ${getToastClasses(toast.type)}`}
		>
			<div class="flex items-start gap-3">
				<div class="pt-0.5">
					<i class={getToastIcon(toast.type)}></i>
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-semibold">{toast.title}</p>
					<p class="mt-1 text-sm leading-5 text-current/80">{toast.message}</p>
				</div>
				<button
					type="button"
					class="rounded-full p-1.5 text-current/50 transition hover:bg-white/60 hover:text-current"
					onclick={() => removeToast(toast.id)}
					aria-label="Dismiss notification"
				>
					<i class="fas fa-xmark"></i>
				</button>
			</div>
		</div>
	{/each}
</div>

<style>
	:global(body) {
		margin: 0;
	}
</style>
