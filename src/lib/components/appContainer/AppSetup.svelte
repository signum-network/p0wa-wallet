<script>
	import { app } from './appStore';
	import { vault } from '$lib/security/vault';
	let value;
	async function onSubmit() {
		await vault.initialize(value);
		await app.unlock(value);
	}
</script>

<div class="hero min-h-screen bg-base-200" on:submit|preventDefault={onSubmit}>
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-5xl font-bold">Setup Wallet</h1>
			<p class="py-6">
				Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
				quasi. In deleniti eaque aut repudiandae et a id nisi.
			</p>
			<input
				type="text"
				placeholder="Type here"
				class="input input-bordered input-lg w-full max-w-xs mb-6"
				bind:value
			/>
			<button class="btn btn-primary" on:click={onSubmit}>Get Started</button>
		</div>
	</div>
</div>
