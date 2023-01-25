import { writable } from 'svelte/store';
import { timelock, vault } from '$lib/security/vault';
import debounce from 'lodash.debounce';
import { TimeLockEvent, VaultDecryptionException } from '../../security/vault';
function createLockedStore() {
	const { set, subscribe } = writable(false);

	timelock.listen((e) => {
		if (e === TimeLockEvent.IsLocked) {
			vault.lock();
		}
		if (e === TimeLockEvent.MaxTrialsExceeded) {
			vault.nuke();
		}
		set(vault.locked);
	});

	async function touch() {
		await timelock.touch();
	}

	async function unlock(secret: string) {
		try {
			await vault.unlock(secret);
			await timelock.reset();
			set(false);
		} catch (e) {
			if (e instanceof VaultDecryptionException) {
				await timelock.incrementUnlockFailure();
			}
		}
	}
	function lock() {
		vault.lock();
		set(false);
	}

	return {
		subscribe,
		touch: debounce(touch, 500),
		unlock,
		lock
	};
}

export const locked = createLockedStore();
