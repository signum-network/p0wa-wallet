import {
	deriveKey,
	decrypt,
	encrypt,
	type EncryptedPayload,
	generateKey,
	generateSalt,
	generateHash
} from '../cryptoFunctions';
import type { Keys } from '@signumjs/crypto';
import type { VaultDatabaseAdapter } from './vaultDatabaseAdapter';
import { VaultDatabaseIndexedDb } from './vaultDatabaseIndexedDb';
import { VaultDatabaseInMemory } from './vaultDatabaseInMemory';
import { browser } from '$app/environment';

interface VaultState {
	secret: string;
}

export class VaultException extends Error {
	constructor(msg: string) {
		super(msg);
	}
}

export class VaultLockedException extends Error {}

export class VaultDecryptionException extends Error {}

export class Vault {
	private secret = '';

	constructor(private database: VaultDatabaseAdapter) {}

	public lock() {
		this.secret = '';
	}

	public get locked() {
		return this.secret === '';
	}

	public async unlock(secret: string): Promise<void> {
		// TODO: make a test decryption of a control message
		this.secret = secret;
		return Promise.resolve();
	}

	private withUnlocked<T>(fn: (secret: string) => Promise<T>) {
		if (!this.locked) {
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
				const salt = generateSalt();
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
