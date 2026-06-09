// shared helpers for the ingest scripts
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DATA = join(ROOT, "data");

export function writeData(rel: string, obj: unknown): void {
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
  console.log("  wrote", rel);
}

export function readJSON<T = unknown>(rel: string): T | null {
  const p = join(ROOT, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as T;
}

export function readAll<T = unknown>(dir: string): T[] {
  const p = join(ROOT, dir);
  if (!existsSync(p)) return [];
  return readdirSync(p)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(p, f), "utf8")) as T);
}

export function todayISO(): string {
  return new Date().toISOString();
}

export async function fetchJSON<T = unknown>(
  url: string,
  opts: { retries?: number; headers?: Record<string, string>; body?: string; method?: string } = {}
): Promise<T> {
  const { retries = 3, headers, body, method } = opts;
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        method: method ?? (body ? "POST" : "GET"),
        headers: { accept: "application/json", ...(body ? { "content-type": "application/json" } : {}), ...headers },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function fetchText(url: string, retries = 3): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

export interface ProtocolFile {
  key: string;
  name: string;
  metric: "tvl" | "volume";
  defillama: { slugs: string[]; dimension?: string };
}

export function loadProtocols(): ProtocolFile[] {
  return readAll<ProtocolFile>("data/protocols");
}
