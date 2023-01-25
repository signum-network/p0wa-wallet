import { browser } from '$app/environment';
import type { DatabaseIndexedDb } from './databaseIndexedDb';
import { database } from './databaseIndexedDb';

export class SettingsStorage {
	constructor(private storage: DatabaseIndexedDb | null) {}

	async delete(key: string): Promise<void> {
		if (!this.storage) {
			return Promise.resolve();
		}
		await this.storage.settings.delete(key);
		return Promise.resolve(undefined);
	}

	async get<T>(key: string): Promise<T | null> {
		if (!this.storage) {
			return Promise.resolve(null);
		}
		const settings = await this.storage.settings.get(key);
		if (!settings) {
			return Promise.resolve(null);
		}
		return Promise.resolve(<T>settings.value);
	}

	async set(key: string, value: unknown): Promise<void> {
		if (!this.storage) {
			return Promise.resolve();
		}
		await this.storage.settings.put({ value, key });
		return Promise.resolve(undefined);
	}
}

export const settingsStorage = browser ? new SettingsStorage(database) : new SettingsStorage(null);
