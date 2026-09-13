import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

for (const dir of ['src', 'public', 'tools']) {
  for (const file of await readdir(dir)) {
    if (!/\.(?:m?js)$/.test(file)) continue;
    const result = spawnSync(process.execPath, ['--check', join(dir, file)], { stdio: 'inherit', windowsHide: true });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}
