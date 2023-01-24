import Dexie, { type Table } from 'dexie';
import type { VaultDatabaseAdapter } from './vaultDatabaseAdapter';

interface VaultData {
	id: string;
	data: string;
}

class _VaultDatabaseIndexedDb extends Dexie {
	vault!: Table<VaultData>;

	constructor() {
		super('p0wa-wallet-vault');
		this.version(1).stores({ vault: 'id' });
	}
}

export class VaultDatabaseIndexedDb implements VaultDatabaseAdapter {
	private _db: _VaultDatabaseIndexedDb;

	constructor() {
		this._db = new _VaultDatabaseIndexedDb();
	}

	async addData(id: string, data: string): Promise<void> {
		await this._db.vault.add({
			id,
			data
		});
	}

	async getData(id: string): Promise<string | null> {
		try {
			const entry = await this._db.vault.get(id);
			return entry ? entry.data : null;
		} catch (e) {
			return null;
		}
	}

	async removeData(id: string): Promise<void> {
		return this._db.vault.delete(id);
	}

	setSalt(salt: string): Promise<void> {
		return this.addData('_salt', salt);
	}

	getSalt(): Promise<string | null> {
		return this.getData('_salt');
	}

	drop(): Promise<void> {
		return this._db.delete();
	}
}
