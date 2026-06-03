import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DEFAULT_VITEST_CONFIG_PATH = null;

const SAFE_VITEST_ARGS = Object.freeze([
  'run',
  '--configLoader',
  'native',
  '--pool',
  'threads',
  '--maxWorkers',
  '1',
  '--exclude',
  '.worktrees/**',
]);

export const normalizeForwardedArgs = (args = []) =>
  args[0] === '--' ? args.slice(1) : args;

export const buildSafeVitestArgs = (args = []) => [
  ...SAFE_VITEST_ARGS,
  ...normalizeForwardedArgs(args),
];

export const resolveVitestEntrypoint = (workspaceRoot) =>
  path.join(workspaceRoot, 'node_modules', 'vitest', 'vitest.mjs');

export const runSafeVitest = ({
  workspaceRoot = path.resolve(__dirname, '..'),
  forwardedArgs = process.argv.slice(2),
} = {}) => {
  const vitestEntrypoint = resolveVitestEntrypoint(workspaceRoot);
  const result = spawnSync(process.execPath, [vitestEntrypoint, ...buildSafeVitestArgs(forwardedArgs)], {
    cwd: workspaceRoot,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
};

const runCli = () => {
  process.exit(runSafeVitest());
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runCli();
}
