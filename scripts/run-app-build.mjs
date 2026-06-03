import { resolveAppMode } from './app-mode.mjs';
import { extractMagicStudioCliEnvArgs } from './magic-studio-cli-env.mjs';
import { ensureSdkModeReady, resolveSdkMode } from './sdk-mode.mjs';
import { resolveViteConfigLoader, withViteRuntimeEnv } from './vite-path.mjs';
import { runWorkspaceNodeCli } from './run-workspace-node-cli.mjs';

const { env: cliEnv } = extractMagicStudioCliEnvArgs(process.argv.slice(2), process.env);
const sdkMode = resolveSdkMode(cliEnv);
const appMode = resolveAppMode({
  command: 'build',
  requestedMode: cliEnv.MAGIC_STUDIO_VITE_MODE,
});
ensureSdkModeReady(sdkMode);

const env = withViteRuntimeEnv({
  ...cliEnv,
  MAGIC_STUDIO_SDK_MODE: sdkMode,
  MAGIC_STUDIO_VITE_MODE: appMode,
});
const configLoader = resolveViteConfigLoader({ env });
const configLoaderArgs = `--configLoader ${configLoader}`.split(' ');
const tsconfig =
  sdkMode === 'git'
    ? 'tsconfig.git-sdk.json'
    : sdkMode === 'npm'
      ? 'tsconfig.npm-sdk.json'
      : 'tsconfig.json';

console.log(`[build] Using SDK mode: ${sdkMode}`);
console.log(`[build] Using app mode: ${appMode}`);
runWorkspaceNodeCli({
  packageName: 'typescript',
  args: ['-p', tsconfig],
  env,
});
runWorkspaceNodeCli({
  packageName: 'vite',
  binName: 'vite',
  args: ['build', ...configLoaderArgs, '--mode', appMode],
  env,
});
