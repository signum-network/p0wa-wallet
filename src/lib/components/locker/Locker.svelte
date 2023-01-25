<script>
	import { locked } from './lockerStore';
	import { vault } from '$lib/security/vault';
	import { onMount, setContext } from 'svelte';

	onMount(() => {
		setContext('vault', vault);
	});
</script>

<svelte:window on:mousemove={locked.touch} />

<div>
	{#if $locked}
		<h1 class="text-4xl">Locked</h1>
		<button class="btn btn-primary" on:click={locked.unlock}>Unlock</button>
	{:else}
		<slot />
	{/if}
</div>
