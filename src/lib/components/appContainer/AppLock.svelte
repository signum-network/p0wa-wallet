<script>
	import { app } from './appStore';
	import { VaultState } from '$lib/security/vault';
	import { notification } from '$lib/components/notification/notificationStore';
	let value, error;
	async function onSubmit() {
		try {
			await app.unlock(value);
			value = '';
		} catch (e) {
			notification.show({
				type: 'error',
				message: 'Unlocking Failed'
			});
		}
	}
</script>

<div class="relative">
	{#if $app.vaultState === VaultState.Locked}
		<div class="hero min-h-screen bg-base-200" on:submit|preventDefault={onSubmit}>
			<div class="hero-content text-center">
				<div class="max-w-md">
					<h1 class="text-5xl font-bold">Wallet Locked</h1>
					<input
						type="text"
						placeholder="Type here"
						class="input input-bordered input-lg w-full max-w-xs mb-6"
						bind:value
					/>
					<button class="btn btn-primary" on:click={onSubmit}>Unlock</button>
				</div>
			</div>
		</div>
	{:else}
		<slot />
	{/if}
</div>
