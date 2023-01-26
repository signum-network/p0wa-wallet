<script>
	import { fade } from 'svelte/transition';

	export let pathname = '';
</script>

{#key pathname}
	<div in:fade={{ delay: 200, duration: 100 }} out:fade={{ duration: 100 }}>
		<slot />
	</div>
{/key}
