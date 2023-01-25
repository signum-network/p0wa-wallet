import Dexie, { type Table } from 'dexie';
import type { EncryptedPayload } from '../cryptoFunctions';

interface VaultData {
	id: string;
	salt: string;
	data: string;
}
export interface VaultDatabaseAdapter {
	setSalt(salt: string): Promise<void>;
	getSalt(): Promise<string | null>;
	getData(id: string): Promise<string | null>;
	addData(id: string, data: string): Promise<void>;
	removeData(id: string): Promise<void>;

	drop(): Promise<void>;
}
