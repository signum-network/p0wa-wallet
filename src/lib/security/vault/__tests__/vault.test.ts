// eslint-disable-next-line @typescript-eslint/no-var-requires
globalThis.crypto = require('node:crypto').webcrypto;
import {
	VaultDecryptionException,
	VaultException,
	VaultLockedException,
	Vault,
	VaultInitializationException
} from '../vault';
import { VaultDatabaseInMemory } from '../vaultDatabaseInMemory';

async function createVault() {
	const vault = new Vault(new VaultDatabaseInMemory());
	await vault.load();
	await vault.initialize('PASSWORD');
	return vault;
}

describe('Vault', () => {
	describe('lock/unlock', () => {
		test('all fine', async () => {
			const vault = await createVault();
			expect(vault.isLocked).toBeTruthy();
			await vault.unlock('PASSWORD');
			expect(vault.isLocked).toBeFalsy();
			vault.lock();
			expect(vault.isLocked).toBeTruthy();
		});

		test('try to unlock with wrong password', async () => {
			const vault = await createVault();
			expect(vault.isLocked).toBeTruthy();
			try {
				await vault.unlock('WRONG_PASSWORD');
				fail('Should not be able to decrypt/unlock');
			} catch (e) {
				expect(e instanceof VaultDecryptionException).toBeTruthy();
			}
		});
	});

	describe('addKeys/getKeys', () => {
		test('all fine', async () => {
			const vault = await createVault();
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
		test('try to add keys while locked', async () => {
			const vault = await createVault();
			try {
				await vault.addKeys({
					publicKey: 'publicKey',
					signPrivateKey: 'signPrivateKey',
					agreementPrivateKey: 'agreementPrivateKey'
				});
				fail('Should not be able to decrypt');
			} catch (e) {
				expect(e instanceof VaultLockedException).toBeTruthy();
			}
		});

		test('throws exception on locked vault', async () => {
			try {
				const vault = await createVault();
				await vault.getKeys('publicKey');
				fail('Expected error as vault is locked');
			} catch (e) {
				expect(e instanceof VaultLockedException).toBeTruthy();
			}
		});
	});

	describe('removeKeys', () => {
		test('all fine', async () => {
			const vault = await createVault();
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
				const vault = await createVault();
				await vault.removeKeys('publicKey');
				fail('Expected error as vault is locked');
			} catch (e) {
				expect(e instanceof VaultLockedException).toBeTruthy();
			}
		});
	});

	describe('nuke', () => {
		test('all fine', async () => {
			const vault = await createVault();
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
				fail('Should not be initialized');
			} catch (e) {
				expect(e instanceof VaultInitializationException).toBeTruthy();
			}

			try {
				await vault.load();
				await vault.initialize('PASSWORD');
				await vault.unlock('PASSWORD');
				await vault.getKeys('publicKey2');
				fail('Should not find keys');
			} catch (e) {
				expect(e instanceof VaultException).toBeTruthy();
			}
		});
	});
});
