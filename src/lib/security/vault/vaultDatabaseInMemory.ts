import type { VaultDatabaseAdapter } from './vaultDatabaseAdapter';

export class VaultDatabaseInMemory implements VaultDatabaseAdapter {
	private mem: any = {};

	addData(id: string, data: string): Promise<void> {
		this.mem[id] = data;
		return Promise.resolve();
	}

	getData(id: string): Promise<string | null> {
		return Promise.resolve(this.mem[id] || null);
	}

	removeData(id: string): Promise<void> {
		delete this.mem[id];
		return Promise.resolve();
	}

	setSalt(salt: string): Promise<void> {
		this.mem['salt'] = salt;
		return Promise.resolve();
	}

	getSalt(): Promise<string | null> {
		return Promise.resolve(this.mem['salt'] || null);
	}

	drop(): Promise<void> {
		this.mem = {};
		return Promise.resolve();
	}
}
