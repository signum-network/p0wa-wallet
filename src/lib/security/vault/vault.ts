import {
	deriveKey,
	decrypt,
	encrypt,
	type EncryptedPayload,
	generateKey,
	generateRandomBytes,
	generateHash
} from '../cryptoFunctions';
import type { Keys } from '@signumjs/crypto';
import type { VaultDatabaseAdapter } from './vaultDatabaseAdapter';
import { VaultDatabaseIndexedDb } from './vaultDatabaseIndexedDb';
import { VaultDatabaseInMemory } from './vaultDatabaseInMemory';
import { browser } from '$app/environment';
import { Buffer } from 'buffer';

const UnlockControlId = 'UnlockControl';

export class VaultException extends Error {
	constructor(msg: string) {
		super(msg);
	}
}

export enum VaultState {
	NotReady,
	NotInitialized,
	Locked,
	Unlocked
}

export class VaultLockedException extends Error {}

export class VaultDecryptionException extends Error {}

export class VaultInitializationException extends Error {}

export class Vault {
	private secret = '';
	private _state = VaultState.NotReady;

	constructor(private database: VaultDatabaseAdapter) {}

	public async load(): Promise<VaultState> {
		if (this.state === VaultState.NotReady) {
			// console.log('Loading...', this.state)
			const salt = await this.database.getSalt();
			this._state = salt ? VaultState.Locked : VaultState.NotInitialized;
			// console.log('Loading...', this.state)
		}
		return this.state;
	}

	public lock() {
		this.secret = '';
		this._state = VaultState.Locked;
	}

	public get state() {
		return this._state;
	}

	public get isInitialized() {
		return this._state !== VaultState.NotInitialized;
	}

	public get isLocked() {
		return this._state === VaultState.Locked;
	}

	private async maskSecret(secret: string): Promise<string> {
		return generateHash(secret, 'SHA-512');
	}
	public async initialize(secret: string) {
		try {
			let saltStr = await this.database.getSalt();
			if (saltStr) {
				console.warn('Vault already initialized...skipping');
				return;
			}
			const salt = generateRandomBytes();
			saltStr = Buffer.from(salt).toString('hex');
			await this.database.setSalt(saltStr);
			const maskedSecret = await this.maskSecret(secret);
			const key = await generateKey(maskedSecret);
			const encryptionKey = await deriveKey(key, Buffer.from(saltStr, 'hex'));
			const encrypted = await encrypt(generateRandomBytes(), encryptionKey);
			await this.database.addData(UnlockControlId, JSON.stringify(encrypted));
			this._state = VaultState.Locked;
		} catch (e: any) {
			throw new VaultInitializationException(e.message);
		}
	}

	public async unlock(secret: string): Promise<void> {
		if (!this.isInitialized) {
			throw new VaultException('Vault Not Initialized');
		}
		const entry = await this.database.getData(UnlockControlId);
		if (!entry) {
			throw new VaultException('No Vault Unlock Control Entry Found');
		}
		const saltStr = await this.database.getSalt();
		if (!saltStr) {
			throw new VaultException('No Vault Salt Found');
		}
		try {
			const encrypted = JSON.parse(entry) as EncryptedPayload;
			const maskedSecret = await this.maskSecret(secret);
			const key = await generateKey(maskedSecret);
			const decryptionKey = await deriveKey(key, Buffer.from(saltStr, 'hex'));
			await decrypt(encrypted, decryptionKey);
			this.secret = maskedSecret;
			this._state = VaultState.Unlocked;
		} catch (e) {
			throw new VaultDecryptionException();
		}
	}

	private async withUnlocked<T>(fn: (secret: string) => Promise<T>) {
		if (!this.isLocked) {
			return fn(this.secret);
		}
		throw new VaultLockedException();
	}

	async getKeys(publicKey: string) {
		return this.withUnlocked<Keys>(async (secret) => {
			const id = await generateHash(publicKey);
			const entry = await this.database.getData(id);
			if (!entry) {
				throw new VaultException('No Vault Data Found');
			}
			const saltStr = await this.database.getSalt();
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

	async addKeys(accountKeys: Keys) {
		return this.withUnlocked<void>(async (secret) => {
			const id = await generateHash(accountKeys.publicKey);
			let saltStr = await this.database.getSalt();
			if (!saltStr) {
				const salt = generateRandomBytes();
				saltStr = Buffer.from(salt).toString('hex');
				await this.database.setSalt(saltStr);
			}
			const key = await generateKey(secret);
			const encryptionKey = await deriveKey(key, Buffer.from(saltStr, 'hex'));
			const encrypted = await encrypt(accountKeys, encryptionKey);
			await this.database.addData(id, JSON.stringify(encrypted));
		});
	}

	async removeKeys(publicKey: string) {
		return this.withUnlocked<void>(async () => {
			const id = await generateHash(publicKey);
			await this.database.removeData(id);
		});
	}

	async nuke() {
		await this.database.drop();
		return this.lock();
	}
}

export const vault = new Vault(
	browser ? new VaultDatabaseIndexedDb() : new VaultDatabaseInMemory()
);
