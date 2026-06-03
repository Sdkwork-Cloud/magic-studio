import { resolveAppMode } from './app-mode.mjs';
import { extractMagicStudioCliEnvArgs } from './magic-studio-cli-env.mjs';
import { ensureSdkModeReady, resolveSdkMode } from './sdk-mode.mjs';
import { resolveViteConfigLoader, withViteRuntimeEnv } from './vite-path.mjs';
import { runWorkspaceNodeCli } from './run-workspace-node-cli.mjs';

const { env: cliEnv } = extractMagicStudioCliEnvArgs(process.argv.slice(2), process.env);
const sdkMode = resolveSdkMode(cliEnv);
const appMode = resolveAppMode({
  command: 'dev',
  requestedMode: cliEnv.MAGIC_STUDIO_VITE_MODE,
});
ensureSdkModeReady(sdkMode);

const env = withViteRuntimeEnv({
  ...cliEnv,
  MAGIC_STUDIO_SDK_MODE: sdkMode,
  MAGIC_STUDIO_VITE_MODE: appMode,
}, {
  cwd: process.cwd(),
  preferWorkspaceLocalCache: process.platform === 'win32',
});
const configLoader = resolveViteConfigLoader({ env });
const configLoaderArgs = `--configLoader ${configLoader}`.split(' ');

console.log(`[dev] Using SDK mode: ${sdkMode}`);
console.log(`[dev] Using app mode: ${appMode}`);
runWorkspaceNodeCli({
  packageName: 'vite',
  binName: 'vite',
  args: [...configLoaderArgs, '--mode', appMode],
  env,
});
