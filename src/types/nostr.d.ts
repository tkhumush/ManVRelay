// NIP-07 window.nostr interface
interface NostrEvent {
  id?: string;
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
  pubkey?: string;
  sig?: string;
}

interface NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: NostrEvent): Promise<NostrEvent>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

declare global {
  interface Window {
    nostr?: NostrSigner;
  }
}

export {};