import { writable } from 'svelte/store';

interface NotificationState {
	message: string;
	type: 'error' | 'warning' | 'info' | 'success';
}

function createNotificationStore() {
	const { set, subscribe } = writable<NotificationState>({
		message: '',
		type: 'success'
	});

	function show(state: NotificationState) {
		set(state);
	}

	function hide() {
		set({
			message: '',
			type: 'success'
		});
	}

	return {
		subscribe,
		show,
		hide
	};
}

export const notification = createNotificationStore();
