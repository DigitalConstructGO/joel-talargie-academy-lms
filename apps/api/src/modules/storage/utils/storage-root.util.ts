import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { ALL_STORAGE_FOLDERS } from '../constants/storage.constants';

/**
 * The repo root is wherever the nearest ancestor package.json declares npm
 * workspaces. Resolving it this way keeps STORAGE_ROOT pinned at
 * `<repo>/storage` regardless of whether the process cwd is the repo root
 * (tests) or apps/api (npm workspace scripts / compiled dist).
 */
function findWorkspaceRoot(startDir: string): string | undefined {
  let current = resolve(startDir);
  for (let depth = 0; depth < 12; depth += 1) {
    const candidate = join(current, 'package.json');
    if (existsSync(candidate)) {
      try {
        const pkg = JSON.parse(readFileSync(candidate, 'utf8')) as {
          workspaces?: unknown;
        };
        if (Array.isArray(pkg.workspaces)) return current;
      } catch {
        // Not readable/parsable as JSON - keep walking up.
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return undefined;
}

export function resolveStorageRoot(configuredRoot: string): string {
  if (configuredRoot) return resolve(configuredRoot);
  const fromCwd = findWorkspaceRoot(process.cwd());
  if (fromCwd) return join(fromCwd, 'storage');
  const fromModule = findWorkspaceRoot(__dirname);
  if (fromModule) return join(fromModule, 'storage');
  return resolve(process.cwd(), '../../storage');
}

export function ensureStorageFolders(root: string): void {
  mkdirSync(root, { recursive: true });
  for (const folder of ALL_STORAGE_FOLDERS)
    mkdirSync(join(root, folder), { recursive: true });
}
