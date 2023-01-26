import { writable } from 'svelte/store';
import { vault, timelock } from '$lib/security/vault';

import { TimeLockEvent, VaultDecryptionException, VaultState } from '../../security/vault';
import debounce from 'lodash.debounce';

interface AppState {
	isReady: boolean;
	vaultState: VaultState;
}

function createAppStore() {
	const { set, update, subscribe } = writable<AppState>({
		vaultState: vault.state,
		isReady: false
	});

	vault.load().then((state) => {
		set({
			vaultState: vault.state,
			isReady: state !== VaultState.NotReady
		});
	});

	timelock.listen((e) => {
		if (!vault.isInitialized) return;

		if (e === TimeLockEvent.IsLocked) {
			vault.lock();
		}
		if (e === TimeLockEvent.MaxTrialsExceeded) {
			vault.nuke();
		}
		update((s) => ({ ...s, vaultState: vault.state }));
	});

	async function touch() {
		await timelock.touch();
	}

	async function unlock(secret: string) {
		try {
			await vault.unlock(secret);
			await timelock.reset();
			update((s) => ({ ...s, vaultState: vault.state }));
		} catch (e) {
			if (e instanceof VaultDecryptionException) {
				await timelock.incrementUnlockFailure();
			}
			throw e;
		}
	}
	function lock() {
		vault.lock();
		update((s) => ({ ...s, vaultState: vault.state }));
	}

	return {
		subscribe,
		touch: debounce(touch, 500),
		unlock,
		lock
	};
}

export const app = createAppStore();
