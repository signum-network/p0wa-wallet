<script>
	import { app } from './appStore';
	import AppLock from './AppLock.svelte';
	import AppSetup from './AppSetup.svelte';
	import { VaultState } from '$lib/security/vault';
</script>

<svelte:window on:mousemove={app.touch} />

<div>
	{#if $app.isReady}
		{#if $app.vaultState === VaultState.NotInitialized}
			<AppSetup />
		{/if}
		{#if $app.vaultState !== VaultState.NotInitialized}
			<AppLock>
				<slot />
			</AppLock>
		{/if}
	{:else}
		<h1>Loading...</h1>
	{/if}
</div>
