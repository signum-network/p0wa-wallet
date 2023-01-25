import Dexie, { type Table } from 'dexie';

export interface Settings {
	key: string;
	value: unknown;
}

export class DatabaseIndexedDb extends Dexie {
	settings!: Table<Settings>;

	constructor() {
		super('p0wa-wallet');
		this.version(1).stores({
			settings: 'key'
		});
	}
}

export const database = new DatabaseIndexedDb();
