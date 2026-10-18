const SECRET = process.env.NEXT_PUBLIC_CRYPTO_SECRET ?? "cv-default-secret-32-bytes-padded"

async function getKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret.padEnd(32, "0").slice(0, 32))
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"])
}

export async function encrypt(data: unknown): Promise<string> {
  const key = await getKey(SECRET)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipher), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

export async function decrypt<T>(token: string): Promise<T> {
  const key = await getKey(SECRET)
  const combined = Uint8Array.from(atob(token), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const cipher = combined.slice(12)
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher)
  return JSON.parse(new TextDecoder().decode(plain)) as T
}
