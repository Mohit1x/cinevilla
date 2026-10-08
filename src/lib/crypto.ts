const RAW_KEY = process.env.CIPHER_KEY!

async function getKey(): Promise<CryptoKey> {
  const raw = Buffer.from(RAW_KEY, "hex")
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
}

export async function encrypt(payload: unknown): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(payload))
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  const out = new Uint8Array(12 + cipher.byteLength)
  out.set(iv, 0)
  out.set(new Uint8Array(cipher), 12)
  return Buffer.from(out).toString("base64")
}

export async function decrypt<T>(token: string): Promise<T> {
  const key = await getKey()
  const buf = Buffer.from(token, "base64")
  const iv = buf.subarray(0, 12)
  const data = buf.subarray(12)
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)
  return JSON.parse(new TextDecoder().decode(plain)) as T
}
