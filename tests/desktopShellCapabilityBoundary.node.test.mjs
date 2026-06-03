import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const capabilitySource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src-tauri/capabilities/default.json'),
  'utf8',
);
const tauriConfigSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src-tauri/tauri.conf.json'),
  'utf8',
);
const tauriMainSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src-tauri/src/main.rs'),
  'utf8',
);
const tauriShellSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src-tauri/src/shell/mod.rs'),
  'utf8',
);
const tauriShellCommandsSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src-tauri/src/shell/commands/mod.rs'),
  'utf8',
);
const tauriShellPtySource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src-tauri/src/shell/pty.rs'),
  'utf8',
);
const reactCorePackageJson = JSON.parse(
  fs.readFileSync(
    path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/package.json'),
    'utf8',
  ),
);
const desktopPlatformSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/desktop.ts'),
  'utf8',
);
const platformTypesSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/types.ts'),
  'utf8',
);
const platformRuntimeSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/runtime/createPlatformRuntime.ts'),
  'utf8',
);
const platformShellVocabularySource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/runtime/shellVocabulary.ts'),
  'utf8',
);
const desktopShellModulesSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/desktopShellModules.ts'),
  'utf8',
);
const desktopBridgeSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/desktopBridge.ts'),
  'utf8',
);
const desktopFileSystemSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/desktopFileSystem.ts'),
  'utf8',
);
const localServerFileSystemSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/localServerFileSystem.ts'),
  'utf8',
);
const desktopDragRegionHelperSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-commons/src/components/Desktop/WindowControls/dragRegion.ts'),
  'utf8',
);
const authLoginPageSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx'),
  'utf8',
);
const mainGlobalHeaderSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src/layouts/MainLayout/MainGlobalHeader.tsx'),
  'utf8',
);
const magicCutLayoutHeaderSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx'),
  'utf8',
);
const portalHeaderSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-portal-video/src/components/PortalHeader.tsx'),
  'utf8',
);
const tabsSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-commons/src/components/Tabs/Tabs.tsx'),
  'utf8',
);
const unifiedHostArchitectureSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'docs/magic-studio-unified-host-api-standard.md'),
  'utf8',
);
const tauriFrameworkArchitectureSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'docs/tauri-rust-framework-architecture.md'),
  'utf8',
);
const architectureModuleBoundariesSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'docs/架构/04-模块规划与边界设计.md'),
  'utf8',
);
const architectureDesktopRuntimeSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'docs/架构/07-桌面运行时与本地能力架构.md'),
  'utf8',
);
const industryDesktopBlueprintSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'docs/tauri-industry-desktop-capability-blueprint.md'),
  'utf8',
);

const dragRegionConsumerSources = [
  ['packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx', authLoginPageSource],
  ['src/layouts/MainLayout/MainGlobalHeader.tsx', mainGlobalHeaderSource],
  ['src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx', magicCutLayoutHeaderSource],
  ['packages/sdkwork-magic-studio-portal-video/src/components/PortalHeader.tsx', portalHeaderSource],
  ['packages/sdkwork-magic-studio-commons/src/components/Tabs/Tabs.tsx', tabsSource],
];

const allowedDirectDesktopShellImports = new Set([
  'packages/sdkwork-magic-studio-core/src/platform/desktopShellModules.ts',
  'packages/sdkwork-magic-studio-core/vite.config.ts',
]);
const retiredDesktopShellModulePaths = [
  'src-tauri/src/shell.rs',
  'src-tauri/src/commands/mod.rs',
  'src-tauri/src/commands/pty_commands.rs',
  'src-tauri/src/commands/system_commands.rs',
  'src-tauri/src/pty/mod.rs',
  'src-tauri/src/session/mod.rs',
  'src-tauri/src/fs',
  'src-tauri/src/platform',
];
const desktopShellArchitectureStandardSources = [
  ['docs/magic-studio-unified-host-api-standard.md', unifiedHostArchitectureSource],
  ['docs/tauri-rust-framework-architecture.md', tauriFrameworkArchitectureSource],
  ['docs/架构/04-模块规划与边界设计.md', architectureModuleBoundariesSource],
  ['docs/架构/07-桌面运行时与本地能力架构.md', architectureDesktopRuntimeSource],
];

function collectPackageAndAppSourceFiles(relativeRoot) {
  const files = [];
  const absoluteRoot = path.resolve(workspaceRoot, relativeRoot);

  const walk = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist'].includes(entry.name)) {
          walk(path.join(currentDir, entry.name));
        }
        continue;
      }

      if (/\.(ts|tsx|js|jsx|mjs|cjs|mts|cts)$/.test(entry.name)) {
        files.push(path.relative(workspaceRoot, path.join(currentDir, entry.name)).replace(/\\/g, '/'));
      }
    }
  };

  if (fs.existsSync(absoluteRoot)) {
    walk(absoluteRoot);
  }

  return files;
}

test('desktop shell capability stays on an explicit minimal native surface', () => {
  assert.doesNotMatch(
    capabilitySource,
    /"windows":\s*\[\s*"\*"\s*\]/,
    'Expected the desktop capability to target the main window explicitly.',
  );
  assert.doesNotMatch(
    capabilitySource,
    /fs:scope|fs:allow-|shell:|http:default|core:default|core:webview:allow-create-webview/,
    'Expected the desktop capability to drop broad fs, shell, http, and general webview permissions.',
  );
  assert.match(
    capabilitySource,
    /core:path:default/,
    'Expected the desktop capability to keep explicit path access.',
  );
  assert.match(
    capabilitySource,
    /core:event:default/,
    'Expected the desktop capability to keep explicit event access.',
  );
  assert.match(
    capabilitySource,
    /opener:allow-open-url/,
    'Expected the desktop capability to expose URL opening through opener only.',
  );
  assert.match(
    capabilitySource,
    /updater:allow-download-and-install/,
    'Expected the desktop capability to keep the updater install workflow explicit.',
  );
  assert.doesNotMatch(
    capabilitySource,
    /https:\/\/\*|http:\/\/\*"/,
    'Expected remote capability URLs to stop granting arbitrary remote origins.',
  );
});

test('desktop configuration and platform code do not reintroduce broad native plugin surfaces', () => {
  assert.doesNotMatch(
    tauriConfigSource,
    /"shell"\s*:/,
    'Expected tauri.conf.json to stop configuring the shell plugin.',
  );
  assert.doesNotMatch(
    `${desktopPlatformSource}\n${desktopFileSystemSource}`,
    /@tauri-apps\/plugin-fs|@tauri-apps\/plugin-http|@tauri-apps\/plugin-shell/,
    'Expected desktop platform code to stop importing broad fs, http, or shell plugins directly.',
  );
  assert.match(
    localServerFileSystemSource,
    /createMagicStudioServerClient[\s\S]*resolveMagicStudioServerHostDescriptor/,
    'Expected shared local server file-system access to use the canonical Rust server client and host descriptor.',
  );
  assert.match(
    desktopFileSystemSource,
    /createLocalServerFileSystemApi/,
    'Expected desktop file-system access to delegate through the shared local Rust server file-system adapter.',
  );
  assert.match(
    desktopFileSystemSource,
    /runtimeMode:\s*'desktop'/,
    'Expected desktop file-system access to resolve the canonical desktop-local server runtime.',
  );
  assert.doesNotMatch(
    desktopFileSystemSource,
    /fs_read_dir|fs_stat|fs_remove|fs_rename|fs_copy_file|DesktopShellBridge/,
    'Expected desktop file-system access to stop depending on shell bridge filesystem commands.',
  );
});

test('desktop shell rust bootstrap centralizes invoke registration behind one shell registry', () => {
  assert.match(
    tauriMainSource,
    /mod shell;/,
    'Expected main.rs to declare the dedicated desktop shell registry module.',
  );
  assert.match(
    tauriMainSource,
    /\.invoke_handler\(shell::invoke_handler!\(\)\)/,
    'Expected main.rs to register invoke commands through the shared shell registry.',
  );
  assert.doesNotMatch(
    tauriMainSource,
    /tauri::generate_handler!\[/,
    'Expected main.rs to stop inlining the desktop invoke allowlist.',
  );
  assert.doesNotMatch(
    tauriMainSource,
    /mod commands;|mod pty;|mod session;/,
    'Expected main.rs to stop declaring sibling top-level shell implementation modules.',
  );

  for (const relativePath of retiredDesktopShellModulePaths) {
    assert.equal(
      fs.existsSync(path.resolve(workspaceRoot, relativePath)),
      false,
      `Expected ${relativePath} to be retired once shell ownership moves under src-tauri/src/shell/.`,
    );
  }

  assert.match(
    tauriShellSource,
    /pub\(crate\)\s+mod commands;[\s\S]*mod pty;[\s\S]*mod session;/,
    'Expected the shell registry module to own the full native shell namespace.',
  );
  assert.match(
    tauriShellCommandsSource,
    /pub mod pty;[\s\S]*pub mod system;/,
    'Expected shell command adapters to live under the dedicated shell namespace.',
  );
  assert.doesNotMatch(
    tauriShellCommandsSource,
    /filesystem_commands|media_commands|compression_commands|database_commands|job_commands|migration_commands|policy_commands|toolkit_commands/,
    'Expected the shell command namespace to remain limited to PTY and system adapters.',
  );

  assert.match(
    tauriShellSource,
    /pub const SHELL_COMMAND_MODULES:\s*&\[\s*&str\s*\]\s*=\s*&\[\s*"commands::pty",\s*"commands::system"\s*\]/,
    'Expected the shell registry to declare the closed shell command module set explicitly.',
  );
  assert.match(
    tauriShellSource,
    /pub const SHELL_COMMAND_NAMES:[\s\S]*"create_pty"[\s\S]*"start_pty"[\s\S]*"write_pty"[\s\S]*"resize_pty"[\s\S]*"kill_pty"[\s\S]*"sync_pty_sessions"[\s\S]*"system_command_exists"/,
    'Expected the shell registry to own the full native command allowlist explicitly.',
  );
  assert.match(
    tauriShellSource,
    /macro_rules!\s*invoke_handler[\s\S]*crate::shell::commands::pty::create_pty[\s\S]*crate::shell::commands::system::system_command_exists[\s\S]*pub\(crate\)\s*use invoke_handler;/,
    'Expected the shell registry to be the sole owner of Tauri invoke command registration.',
  );
  assert.doesNotMatch(
    tauriShellSource,
    /fs_ensure_dir|fs_exists|fs_read_dir|fs_read_string|fs_read_bytes|fs_write_bytes|fs_remove|fs_rename|fs_copy_file|fs_stat|media_probe_available|media_command_execute|media_probe|compression_unzip|compression_zip_bytes|database_execute|database_query|database_execute_batch|migration_status|migration_apply|policy_validate_path|policy_validate_command|job_get|job_list|job_cancel|toolkit_execute|system_runtime_info/,
    'Expected the shell registry to reject all business command registrations.',
  );
  assert.match(
    tauriShellPtySource,
    /use super::\{pty_output_event, session::Session\};/,
    'Expected PTY state to stay private to the shell namespace and consume the shared shell event helper.',
  );
  assert.doesNotMatch(
    tauriShellPtySource,
    /use crate::events::pty_output_event;|format!\("pty-output:/,
    'Expected PTY state to avoid legacy event modules and handwritten shell event strings.',
  );
});

test('desktop shell live architecture docs keep shell-only ownership explicit', () => {
  for (const [relativePath, source] of desktopShellArchitectureStandardSources) {
    assert.match(
      source,
      /packages\/sdkwork-magic-studio-server\/src-host/,
      `Expected ${relativePath} to keep naming the canonical Rust business kernel.`,
    );
    assert.match(
      source,
      /shell-only|thin desktop shell|desktop shell host|desktop is a thin shell/,
      `Expected ${relativePath} to describe src-tauri as a shell-only desktop host.`,
    );
    assert.doesNotMatch(
      source,
      /FileSystemService|MediaService|CompressionService|DatabaseService|MigrationService|ToolkitService|JobService/,
      `Expected ${relativePath} to avoid legacy business-service shell ownership vocabulary.`,
    );
  }

  assert.match(
    architectureModuleBoundariesSource,
    /src-tauri\/src\/shell\/\*\*|src-tauri\/src\/shell\//,
    'Expected the module-boundary architecture doc to reflect the current src-tauri/src/shell/** ownership.',
  );
  assert.match(
    `${architectureDesktopRuntimeSource}\n${tauriFrameworkArchitectureSource}`,
    /AppContext::default\(\)[\s\S]*SystemService[\s\S]*PtyService/,
    'Expected the desktop architecture docs to document the shell-only AppContext composition.',
  );
  assert.doesNotMatch(
    industryDesktopBlueprintSource,
    /src-tauri\/src\/framework\/services|FileSystemService\s+\(already present\)|DatabaseService\s+\(already present\)|JobService\s+\(already present\)|MediaService\s+\(already present\)|ToolkitService\s+\(already present\)|MigrationService baseline is now implemented/,
    'Expected the industry desktop blueprint to stop treating src-tauri as the business service host.',
  );
  assert.match(
    industryDesktopBlueprintSource,
    /shared business capability[\s\S]*packages\/sdkwork-magic-studio-server\/src-host|must exist in both standalone server deployment and desktop mode[\s\S]*packages\/sdkwork-magic-studio-server\/src-host/,
    'Expected the industry desktop blueprint to place cross-host business capabilities in the canonical Rust kernel.',
  );
  assert.match(
    industryDesktopBlueprintSource,
    /src-tauri\/src\/shell\/|shell-only|thin desktop shell/,
    'Expected the industry desktop blueprint to align with the current shell-only host shape.',
  );
});

test('desktop shell javascript dependencies stay isolated behind magic-studio-core platform boundaries', () => {
  const directDesktopShellImportOffenders = [];

  for (const relativePath of [
    ...collectPackageAndAppSourceFiles('src'),
    ...collectPackageAndAppSourceFiles('packages'),
  ]) {
    if (allowedDirectDesktopShellImports.has(relativePath)) {
      continue;
    }

    const source = fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
    if (/@tauri-apps\//.test(source)) {
      directDesktopShellImportOffenders.push(relativePath);
    }
  }

  assert.deepEqual(
    directDesktopShellImportOffenders,
    [],
    `Expected direct @tauri-apps imports to stay isolated behind magic-studio-core desktop shell boundaries.\n${directDesktopShellImportOffenders.join('\n')}`,
  );

  for (const packageName of [
    'zustand',
    '@tauri-apps/api',
    '@tauri-apps/plugin-clipboard-manager',
    '@tauri-apps/plugin-dialog',
    '@tauri-apps/plugin-notification',
    '@tauri-apps/plugin-opener',
    '@tauri-apps/plugin-os',
    '@tauri-apps/plugin-process',
    '@tauri-apps/plugin-store',
    '@tauri-apps/plugin-updater',
  ]) {
    assert.ok(
      reactCorePackageJson.peerDependencies?.[packageName],
      `Expected @sdkwork/magic-studio-core to declare ${packageName} as an explicit peer dependency.`,
    );
    assert.equal(
      reactCorePackageJson.peerDependenciesMeta?.[packageName]?.optional,
      true,
      `Expected @sdkwork/magic-studio-core to mark ${packageName} as an optional peer dependency.`,
    );
    assert.equal(
      reactCorePackageJson.dependencies?.[packageName],
      undefined,
      `Expected @sdkwork/magic-studio-core not to hide ${packageName} inside package runtime dependencies.`,
    );
  }
});

test('desktop platform metadata and private module loaders keep desktop-shell naming neutral', () => {
  assert.match(
    platformTypesSource,
    /desktopShellVersion\?: string/,
    'Expected public platform metadata to expose a desktop-shell-neutral version field.',
  );
  assert.doesNotMatch(
    platformTypesSource,
    /tauriVersion\?: string/,
    'Expected public platform metadata to stop exposing a Tauri-specific version field.',
  );
  assert.match(
    desktopPlatformSource,
    /desktopShellVersion:\s*await modules\.getDesktopShellVersion\(\)/,
    'Expected desktop platform metadata to map the private shell runtime version into desktopShellVersion.',
  );
  assert.doesNotMatch(
    desktopPlatformSource,
    /tauriVersion|modules\.tauriInvoke/,
    'Expected desktop platform implementation to stop leaking Tauri-specific metadata or bridge naming.',
  );
  assert.match(
    desktopShellModulesSource,
    /export interface DesktopShellModules[\s\S]*getDesktopShellVersion\(\): Promise<string>[\s\S]*toggleDesktopDevTools\(\): Promise<void>[\s\S]*shellInvoke<[\s\S]*PlatformShellCommandName[\s\S]*shellListen<[\s\S]*PlatformShellEventName/,
    'Expected the private desktop module loader surface to use desktop-shell naming instead of Tauri naming.',
  );
  assert.doesNotMatch(
    desktopShellModulesSource,
    /DesktopTauriModules|getLoadedDesktopTauriModules|loadDesktopTauriModules|tauriInvoke\s*<|tauriListen\s*</,
    'Expected the private desktop module loader surface to retire legacy Tauri-oriented identifiers.',
  );
});

test('public platform types do not expose a generic raw bridge surface', () => {
  assert.doesNotMatch(
    platformTypesSource,
    /invoke\?<T = unknown>\(command: string, payload\?: Record<string, unknown>\): Promise<T>;/,
    'Expected PlatformAPI to stop exposing a generic invoke bridge on the public type surface.',
  );
  assert.doesNotMatch(
    platformTypesSource,
    /listen\?<T = unknown>\([\s\S]*event: string,[\s\S]*callback: \(payload: T\) => void[\s\S]*Promise<\(\) => void>;/,
    'Expected PlatformAPI to stop exposing a generic listen bridge on the public type surface.',
  );
  assert.match(
    platformRuntimeSource,
    /type PlatformBridgeAdapter = \{[\s\S]*invoke\?<T = unknown>\([\s\S]*PlatformShellCommandName[\s\S]*listen\?<T = unknown>\([\s\S]*PlatformShellEventName/,
    'Expected createPlatformRuntime to keep raw bridge adaptation behind a private shell-typed adapter.',
  );
  assert.match(
    platformShellVocabularySource,
    /PLATFORM_SHELL_COMMAND_NAMES[\s\S]*PLATFORM_SHELL_COMMAND[\s\S]*isPlatformShellCommandName[\s\S]*PTY_OUTPUT_SHELL_EVENT_PREFIX[\s\S]*createPtyOutputShellEventName[\s\S]*isPlatformShellEventName/,
    'Expected runtime shell vocabulary to centralize shell command names, event prefixes, and typed helpers.',
  );
  assert.match(
    desktopBridgeSource,
    /isPlatformShellCommandName[\s\S]*isPlatformShellEventName/,
    'Expected desktop bridge normalization to reuse the shared shell vocabulary guards.',
  );
  assert.doesNotMatch(
    desktopBridgeSource,
    /new Set<PlatformShellCommandName>|startsWith\('pty-output:'\)/,
    'Expected desktop bridge to stop re-implementing shell command or event vocabulary locally.',
  );
  assert.match(
    desktopPlatformSource,
    /createPtyOutputShellEventName\(pid\)/,
    'Expected desktop PTY subscriptions to materialize shell event names through the shared helper.',
  );
  assert.doesNotMatch(
    desktopPlatformSource,
    /plugin:webview\|internal_toggle_devtools|modules\.shellInvoke\(/,
    'Expected desktop platform code to keep raw internal plugin invoke details behind private shell module helpers.',
  );
  assert.doesNotMatch(
    desktopPlatformSource,
    /'create_pty'|'kill_pty'|'resize_pty'|'start_pty'|'sync_pty_sessions'|'system_command_exists'|'write_pty'/,
    'Expected desktop platform code to stop hand-writing shell command identifiers.',
  );
  assert.doesNotMatch(
    desktopPlatformSource,
    /`pty-output:\$\{pid\}`/,
    'Expected desktop PTY subscriptions to stop hand-writing shell event names.',
  );
});

test('desktop shell draggable regions stay behind the shared helper abstraction', () => {
  assert.match(
    desktopDragRegionHelperSource,
    /getDesktopShellDragRegionProps/,
    'Expected the shared desktop drag-region helper to expose a named API.',
  );
  assert.match(
    desktopDragRegionHelperSource,
    /data-tauri-drag-region/,
    'Expected the shared helper to contain the implementation-specific desktop drag-region attribute.',
  );

  for (const [relativePath, source] of dragRegionConsumerSources) {
    assert.match(
      source,
      /getDesktopShellDragRegionProps/,
      `Expected ${relativePath} to consume the shared desktop drag-region helper.`,
    );
    assert.doesNotMatch(
      source,
      /data-tauri-drag-region/,
      `Expected ${relativePath} to avoid handwritten desktop drag-region attributes.`,
    );
  }
});
