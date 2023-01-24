// eslint-disable-next-line @typescript-eslint/no-var-requires
globalThis.crypto = require('node:crypto').webcrypto;
import { VaultException, VaultLockedException, vaultStore } from '../vaultStore';
import { VaultDatabaseInMemory } from '../vaultDatabaseInMemory';

describe('vaultStore', () => {
	test('unlock - time lock', () => {
		return new Promise((resolve) => {
			let firstRun = true;
			const vault = vaultStore({
				database: new VaultDatabaseInMemory(),
				lockTimeout: 1_000
			});

			vault.subscribe((data) => {
				if (data.isLocked) {
					expect(data.secret).toBe('');
					expect(data.timer).toBeNull();
					if (!firstRun) {
						resolve(true);
					} else {
						firstRun = false;
					}
				} else {
					expect(data.secret).toBe('PASSWORD');
					expect(data.timer).not.toBeNull();
				}
			});
			vault.unlock('PASSWORD');
		});
	});

	test('lock', async () => {
		return new Promise((resolve) => {
			const vault = vaultStore({
				database: new VaultDatabaseInMemory(),
				lockTimeout: 10_000
			});
			vault.unlock('PASSWORD');
			vault.subscribe((data) => {
				if (data.isLocked) {
					expect(data.secret).toBe('');
					expect(data.timer).toBeNull();
					resolve(true);
				}
			});
			vault.lock();
		});
	});

	describe('addKeys/getKeys', () => {
		test('all fine', async () => {
			const vault = vaultStore({
				database: new VaultDatabaseInMemory(),
				lockTimeout: 2_000
			});
			await vault.unlock('PASSWORD');
			await vault.addKeys({
				publicKey: 'publicKey',
				signPrivateKey: 'signPrivateKey',
				agreementPrivateKey: 'agreementPrivateKey'
			});
			await vault.addKeys({
				publicKey: 'publicKey2',
				signPrivateKey: 'signPrivateKey2',
				agreementPrivateKey: 'agreementPrivateKey2'
			});

			let keys = await vault.getKeys('publicKey');
			expect(keys).toEqual({
				publicKey: 'publicKey',
				signPrivateKey: 'signPrivateKey',
				agreementPrivateKey: 'agreementPrivateKey'
			});
			keys = await vault.getKeys('publicKey2');
			expect(keys).toEqual({
				publicKey: 'publicKey2',
				signPrivateKey: 'signPrivateKey2',
				agreementPrivateKey: 'agreementPrivateKey2'
			});
		});

		test('throws exception on locked vault', async () => {
			const vault = vaultStore({
				database: new VaultDatabaseInMemory(),
				lockTimeout: 1_000
			});
			try {
				await vault.getKeys('publicKey');
				fail('Expected error as vault is locked');
			} catch (e) {
				expect(e instanceof VaultLockedException).toBeTruthy();
			}
		});
	});

	describe('removeKeys', () => {
		test('all fine', async () => {
			const vault = vaultStore({
				database: new VaultDatabaseInMemory(),
				lockTimeout: 2_000
			});
			await vault.unlock('PASSWORD');
			await vault.addKeys({
				publicKey: 'publicKey',
				signPrivateKey: 'signPrivateKey',
				agreementPrivateKey: 'agreementPrivateKey'
			});
			await vault.removeKeys('publicKey');

			try {
				await vault.getKeys('publicKey');
				fail('Should not find keys');
			} catch (e) {
				expect(e instanceof VaultException);
			}
		});

		test('throws exception on locked vault', async () => {
			const vault = vaultStore({
				database: new VaultDatabaseInMemory(),
				lockTimeout: 1_000
			});
			try {
				await vault.removeKeys('publicKey');
				fail('Expected error as vault is locked');
			} catch (e) {
				expect(e instanceof VaultLockedException).toBeTruthy();
			}
		});
	});

	describe('nuke', () => {
		test('all fine', async () => {
			const vault = vaultStore({
				database: new VaultDatabaseInMemory(),
				lockTimeout: 1_000
			});
			await vault.unlock('PASSWORD');
			await vault.addKeys({
				publicKey: 'publicKey',
				signPrivateKey: 'signPrivateKey',
				agreementPrivateKey: 'agreementPrivateKey'
			});
			await vault.addKeys({
				publicKey: 'publicKey2',
				signPrivateKey: 'signPrivateKey2',
				agreementPrivateKey: 'agreementPrivateKey2'
			});

			await vault.nuke();
			try {
				await vault.getKeys('publicKey2');
				fail('Should not find keys');
			} catch (e) {
				expect(e instanceof VaultException);
			}
		});
	});
});
