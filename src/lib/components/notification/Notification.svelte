<script>
	import { fade } from 'svelte/transition';
	import { notification } from './notificationStore';
	import NotificationItem from './NotificationItem.svelte';
</script>

{#if $notification.message.length > 0}
	<div
		transition:fade={{ duration: 150 }}
		class="fixed top-[48px] flex w-full justify-center items-center"
	>
		<div>
			<NotificationItem
				message={$notification.message}
				type={$notification.type}
				on:click={notification.hide}
			/>
		</div>
	</div>
{/if}
