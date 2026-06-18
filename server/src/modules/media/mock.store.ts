import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const STORAGE_ROOT = join(process.cwd(), '.mock-media');

function resolvePath(objectKey: string): string {
  if (!objectKey || objectKey.includes('..') || objectKey.startsWith('/')) {
    throw new Error('invalid objectKey');
  }

  return join(STORAGE_ROOT, ...objectKey.split('/'));
}

export async function saveObject(objectKey: string, data: Buffer): Promise<void> {
  const path = resolvePath(objectKey);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
}

export async function readObject(objectKey: string): Promise<Buffer | null> {
  try {
    return await readFile(resolvePath(objectKey));
  } catch {
    return null;
  }
}

export async function objectExists(objectKey: string): Promise<{ size: number } | null> {
  try {
    const info = await stat(resolvePath(objectKey));
    return { size: info.size };
  } catch {
    return null;
  }
}

export async function ensureStorageRoot(): Promise<void> {
  await mkdir(STORAGE_ROOT, { recursive: true });
  await access(STORAGE_ROOT);
}
