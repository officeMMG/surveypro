// APIキーをAES-256-GCMで暗号化・復号するサーバーサイド専用ユーティリティ

const ALGORITHM = "AES-GCM"
const IV_LENGTH = 12 // 96-bit IV for GCM

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (openssl rand -hex 32)")
  }
  return key
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  const keyBuffer = hexToBuffer(hexKey)
  return crypto.subtle.importKey("raw", keyBuffer.buffer as ArrayBuffer, ALGORITHM, false, ["encrypt", "decrypt"])
}

export async function encryptApiKey(plaintext: string): Promise<string> {
  const keyHex = getEncryptionKey()
  const cryptoKey = await importKey(keyHex)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    cryptoKey,
    encoded
  )

  // iv:ciphertext を hex で連結して保存
  return `${bufferToHex(iv.buffer as ArrayBuffer)}:${bufferToHex(ciphertext)}`
}

export async function decryptApiKey(encrypted: string): Promise<string> {
  const keyHex = getEncryptionKey()
  const cryptoKey = await importKey(keyHex)

  const [ivHex, ciphertextHex] = encrypted.split(":")
  if (!ivHex || !ciphertextHex) throw new Error("Invalid encrypted format")

  const iv = hexToBuffer(ivHex)
  const ciphertext = hexToBuffer(ciphertextHex)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    ciphertext.buffer as ArrayBuffer
  )

  return new TextDecoder().decode(decrypted)
}

export function maskApiKey(key: string): string {
  if (key.length <= 12) return "****"
  const prefix = key.slice(0, 10)
  const suffix = key.slice(-4)
  return `${prefix}...${suffix}`
}
