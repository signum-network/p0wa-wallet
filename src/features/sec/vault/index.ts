import { writable } from "svelte/store";
import type { EncryptedPayload } from "../cryptoFunctions";

interface SecuredKeys {
  publicKey: string;
  secPrivateKeys: EncryptedPayload
}

function vault() {
  const {} = writable()
}
