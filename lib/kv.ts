// KV Store wrapper with in-memory fallback for local development
// When Vercel KV env vars are not set, uses an in-memory Map

const memoryStore = new Map<string, string>()

function isMemoryMode(): boolean {
  return !process.env.KV_REST_API_URL || process.env.KV_REST_API_URL === ''
}

let kvModule: typeof import('@vercel/kv') | null = null

async function getKV() {
  if (!kvModule) {
    kvModule = await import('@vercel/kv')
  }
  return kvModule.kv
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (isMemoryMode()) {
    const val = memoryStore.get(key)
    return val ? JSON.parse(val) as T : null
  }
  const kv = await getKV()
  return kv.get<T>(key)
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (isMemoryMode()) {
    memoryStore.set(key, JSON.stringify(value))
    return
  }
  const kv = await getKV()
  await kv.set(key, value)
}

export async function kvDel(key: string): Promise<void> {
  if (isMemoryMode()) {
    memoryStore.delete(key)
    return
  }
  const kv = await getKV()
  await kv.del(key)
}

export async function kvKeys(pattern: string): Promise<string[]> {
  if (isMemoryMode()) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return Array.from(memoryStore.keys()).filter((k) => regex.test(k))
  }
  const kv = await getKV()
  return kv.keys(pattern)
}
