import { get, writable } from 'svelte/store';
import { deriveKey, encrypt, type EncryptedPayload, generateSalt } from '../cryptoFunctions';
import type { Keys } from '@signumjs/crypto';
import type { VaultDatabaseAdapter } from './vaultDatabaseAdapter';
import { decrypt, generateHash, generateKey } from '../cryptoFunctions';

interface Vault {
	isLocked: boolean;
	timer: NodeJS.Timeout | null;
	secret: string;
}

export class VaultException extends Error {
	constructor(msg: string) {
		super(msg);
	}
}

export class VaultLockedException extends Error {}
export class VaultDecryptionException extends Error {}

interface Props {
	database: VaultDatabaseAdapter;
	lockTimeout: number;
}

const InitialState: Vault = {
	timer: null,
	secret: '',
	isLocked: true
};

// TODO: refactor to class and remove svelte store
export function vaultStore({ database, lockTimeout }: Props) {
	const v = writable<Vault>(InitialState);

	function lock() {
		v.update((state) => {
			if (state.isLocked) return state;
			state.timer && clearTimeout(state.timer);
			return InitialState;
		});
	}

	function unlock(secret: string) {
		v.update((state) => {
			if (!state.isLocked) return state;
			const timer = setTimeout(lock, lockTimeout);
			return {
				isLocked: false,
				secret,
				timer
			};
		});
	}

	function withUnlocked<T>(fn: (secret: string) => Promise<T>) {
		const { isLocked, secret } = get(v);
		if (!isLocked) {
			return fn(secret);
		}
		throw new VaultLockedException();
	}

	async function getKeys(publicKey: string) {
		return withUnlocked<Keys>(async (secret) => {
			const id = await generateHash(publicKey);
			const entry = await database.getData(id);
			if (!entry) {
				throw new VaultException('No Vault Data Found');
			}
			const saltStr = await database.getSalt();
			if (!saltStr) {
				throw new VaultException('No Vault Salt Found');
			}
			try {
				const encrypted = JSON.parse(entry) as EncryptedPayload;
				const key = await generateKey(secret);
				const decryptionKey = await deriveKey(key, Buffer.from(saltStr, 'hex'));
				return await decrypt<Keys>(encrypted, decryptionKey);
			} catch (e) {
				throw new VaultDecryptionException();
			}
		});
	}

	async function addKeys(accountKeys: Keys) {
		return withUnlocked<void>(async (secret) => {
			const id = await generateHash(accountKeys.publicKey);
			let saltStr = await database.getSalt();
			if (!saltStr) {
				const salt = await generateSalt();
				saltStr = Buffer.from(salt).toString('hex');
				await database.setSalt(saltStr);
			}
			const key = await generateKey(secret);
			const encryptionKey = await deriveKey(key, Buffer.from(saltStr, 'hex'));
			const encrypted = await encrypt(accountKeys, encryptionKey);
			await database.addData(id, JSON.stringify(encrypted));
		});
	}

	async function removeKeys(publicKey: string) {
		return withUnlocked<void>(async () => {
			const id = await generateHash(publicKey);
			await database.removeData(id);
		});
	}

	async function nuke() {
		await database.drop();
		lock();
	}

	return {
		subscribe: v.subscribe,
		lock,
		unlock,
		getKeys,
		addKeys,
		removeKeys,
		nuke
	};
}
