// eslint-disable-next-line @typescript-eslint/no-var-requires
globalThis.crypto = require('node:crypto').webcrypto;
import { VaultDecryptionException, VaultException, VaultLockedException, Vault } from '../vault';
import { VaultDatabaseInMemory } from '../vaultDatabaseInMemory';

describe('Vault', () => {
	test('lock', () => {
		const vault = new Vault(new VaultDatabaseInMemory());
		expect(vault.locked).toBeTruthy();
		vault.unlock('PASSWORD');
		expect(vault.locked).toBeFalsy();
		vault.lock();
		expect(vault.locked).toBeTruthy();
	});

	describe('addKeys/getKeys', () => {
		test('all fine', async () => {
			const vault = new Vault(new VaultDatabaseInMemory());
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
		test('getKeys with wrong password', async () => {
			const vault = new Vault(new VaultDatabaseInMemory());
			await vault.unlock('PASSWORD');
			await vault.addKeys({
				publicKey: 'publicKey',
				signPrivateKey: 'signPrivateKey',
				agreementPrivateKey: 'agreementPrivateKey'
			});
			vault.lock();
			await vault.unlock('WRONG_PASSWORD');
			try {
				await vault.getKeys('publicKey');
				fail('Should not be able to decrypt');
			} catch (e) {
				expect(e instanceof VaultDecryptionException).toBeTruthy();
			}
		});

		test('throws exception on locked vault', async () => {
			try {
				const vault = new Vault(new VaultDatabaseInMemory());
				await vault.getKeys('publicKey');
				fail('Expected error as vault is locked');
			} catch (e) {
				expect(e instanceof VaultLockedException).toBeTruthy();
			}
		});
	});

	describe('removeKeys', () => {
		test('all fine', async () => {
			const vault = new Vault(new VaultDatabaseInMemory());
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
				expect(e instanceof VaultException).toBeTruthy();
			}
		});

		test('throws exception on locked vault', async () => {
			try {
				const vault = new Vault(new VaultDatabaseInMemory());
				await vault.removeKeys('publicKey');
				fail('Expected error as vault is locked');
			} catch (e) {
				expect(e instanceof VaultLockedException).toBeTruthy();
			}
		});
	});

	describe('nuke', () => {
		test('all fine', async () => {
			const vault = new Vault(new VaultDatabaseInMemory());
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
				fail('Should not be unlocked');
			} catch (e) {
				expect(e instanceof VaultLockedException).toBeTruthy();
			}

			try {
				await vault.unlock('PASSWORD');
				await vault.getKeys('publicKey2');
				fail('Should not find keys');
			} catch (e) {
				expect(e instanceof VaultException).toBeTruthy();
			}
		});
	});
});
