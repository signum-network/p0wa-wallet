// eslint-disable-next-line @typescript-eslint/no-var-requires
globalThis.crypto = require('node:crypto').webcrypto;
import {
	decrypt,
	deriveKey,
	encrypt,
	generateHash,
	generateKey,
	generateRandomBytes
} from '../cryptoFunctions';
describe('cryptoFunctions', () => {
	test.skip('generateSalt', async () => {
		const salt = generateRandomBytes();
		expect(salt.length).toBe(32);

		const salts = new Set();
		for (let i = 0; i < 500_000; ++i) {
			const s = generateRandomBytes();
			if (salts.has(s)) {
				throw new Error('Collision found');
			} else {
				salts.add(s);
			}
		}
	});
	test('generateHash - SHA256', async () => {
		const hash = await generateHash('SomeMessage');
		expect(hash).toBe('ccc06387a3999656ebd937402c5d80c710e0861f7e2b004c0d0ff8c85f321005');
	});

	test('generateHash - SHA512', async () => {
		const hash = await generateHash('SomeMessage', 'SHA-512');
		expect(hash).toBe(
			'09f940a8bde6c662867ad212d24000359ce9b2f8b0dba3528d13763d39c8d389f8d0ab1e2a52c1cdb5ad721c7685a862591aaa5d4697714649d9742f52bc8b05'
		);
	});

	test('generateKey', async () => {
		const key = await generateKey('PASSWORD');
		expect(key.algorithm.name).toBe('PBKDF2');
		expect(key.extractable).toBeFalsy();
		expect(key.usages).toEqual(['deriveBits', 'deriveKey']);
	});
	test('deriveKey', async () => {
		const key = await generateKey('PASSWORD');
		const salt = generateRandomBytes();
		const derivedKey = await deriveKey(key, salt);
		expect(derivedKey.usages).toEqual(['encrypt', 'decrypt']);
		expect(derivedKey.algorithm.name).toBe('AES-GCM');
	});
	test('encrypt/decrypt', async () => {
		const key = await generateKey('PASSWORD');
		const salt = generateRandomBytes();

		const encryptKey = await deriveKey(key, salt);
		const encrypted = await encrypt({ foo: 'bar' }, encryptKey);
		expect(encrypted.iv).toHaveLength(32);
		expect(encrypted.dt).not.toBeNull();

		const decryptKey = await deriveKey(key, salt);
		const result = await decrypt<{ foo: string }>(encrypted, decryptKey);
		expect(result).toEqual({ foo: 'bar' });
	});
});
