import fs from 'node:fs';
import path from 'node:path';

function parseEnvContent(content: string): Array<[string, string]> {
  const entries: Array<[string, string]> = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries.push([key, value]);
  }

  return entries;
}

function applyEnvFile(filename: string, override: boolean): void {
  const envPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const [key, value] of parseEnvContent(content)) {
    if (override || !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/** 加载 .env；.env.local 覆盖同名变量（本地开发优先） */
export function loadEnvFile(): void {
  applyEnvFile('.env', false);
  applyEnvFile('.env.local', true);
}
