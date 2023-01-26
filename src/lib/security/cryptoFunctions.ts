export type EncryptedPayload = { dt: string; iv: string };

const DefaultEncoding = 'hex';

export function getRandomBytes(length: number): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(length));
}

export async function encrypt(data: object, key: CryptoKey): Promise<EncryptedPayload> {
	const stuffStr = JSON.stringify(data);
	const iv = getRandomBytes(16);
	const encryptedStuff = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv
		},
		key,
		Buffer.from(stuffStr)
	);

	return {
		dt: Buffer.from(encryptedStuff).toString(DefaultEncoding),
		iv: Buffer.from(iv).toString(DefaultEncoding)
	};
}

export async function decrypt<T = any>(
	{ dt: encryptedStuffHex, iv: ivHex }: EncryptedPayload,
	key: CryptoKey
): Promise<T> {
	const stuffBuf = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: Buffer.from(ivHex, DefaultEncoding) },
		key,
		Buffer.from(encryptedStuffHex, DefaultEncoding)
	);
	const stuffStr = Buffer.from(stuffBuf).toString();
	return JSON.parse(stuffStr);
}

export async function generateKey(password: string) {
	const hash = await crypto.subtle.digest('SHA-512', Buffer.from(password, 'utf-8'));
	return crypto.subtle.importKey('raw', hash, 'PBKDF2', false, ['deriveBits', 'deriveKey']);
}

export function deriveKey(key: CryptoKey, salt: Uint8Array, iterations = 500_000) {
	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations,
			hash: 'SHA-512'
		},
		key,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

export async function generateHash(
	message: string,
	alg: AlgorithmIdentifier = 'SHA-256'
): Promise<string> {
	const bytes = await crypto.subtle.digest(alg, Buffer.from(message, 'utf-8'));
	return Buffer.from(bytes).toString(DefaultEncoding);
}

export function generateRandomBytes(byteCount = 32) {
	const bytes = new Uint8Array(byteCount);
	crypto.getRandomValues(bytes);
	return bytes;
}
