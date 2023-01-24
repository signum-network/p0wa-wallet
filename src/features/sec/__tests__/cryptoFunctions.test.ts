// eslint-disable-next-line @typescript-eslint/no-var-requires
globalThis.crypto = require('node:crypto').webcrypto;
import { decrypt, deriveKey, encrypt, generateKey, generateSalt } from "../cryptoFunctions";
describe("cryptoFunctions", () => {
  test("generateSalt", async () => {
    const salt = generateSalt();
    expect(salt.length).toBe(32);

    const salts = new Set()
    for(let i=0; i< 500_000; ++i){
      const s = generateSalt();
      if(salts.has(s)){
        throw new Error('Collision found')
      }
      else{
        salts.add(s)
      }
    }

  });
  test("generateKey", async () => {
    const key = await generateKey("PASSWORD");
    expect(key.algorithm.name).toBe("PBKDF2");
    expect(key.extractable).toBeFalsy();
    expect(key.usages).toEqual(['deriveBits', 'deriveKey']);
  });
  test("deriveKey", async () => {
    const key= await generateKey("PASSWORD");
    const salt = generateSalt();
    const derivedKey = await deriveKey(key, salt);
    expect(derivedKey.usages).toEqual(['encrypt', 'decrypt'])
    expect(derivedKey.algorithm.name).toBe('AES-GCM')
  });
  test("encrypt/decrypt", async () => {
    const key= await generateKey("PASSWORD");
    const salt = generateSalt();

    const encryptKey = await deriveKey(key, salt);
    const encrypted = await encrypt({foo:'bar'}, encryptKey)
    expect(encrypted.iv).toHaveLength(32)
    expect(encrypted.dt).not.toBeNull()

    const decryptKey = await deriveKey(key, salt);
    const result = await decrypt<{foo:string}>(encrypted,decryptKey)
    expect(result).toEqual({foo:'bar'})
  });
});

