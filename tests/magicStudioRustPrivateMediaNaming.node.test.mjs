import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

test('private rust media naming stays in the canonical server kernel, not the desktop shell', () => {
  const retiredDesktopShellTargets = [
    'src-tauri/src/framework/services/media.rs',
    'src-tauri/src/framework/services/toolkit.rs',
    'src-tauri/src/commands/media_commands.rs',
  ];

  for (const relativePath of retiredDesktopShellTargets) {
    assert.equal(
      fs.existsSync(path.resolve(workspaceRoot, relativePath)),
      false,
      `Expected ${relativePath} to stay retired because media and toolkit logic belong to the canonical Rust server kernel.`,
    );
  }

  const serverTargets = [
    'packages/sdkwork-magic-studio-server/src-host/src/services/media.rs',
    'packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs',
    'packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs',
  ];

  const forbiddenPatterns = [
    /\bfn\s+ffmpeg_available\s*\(/,
    /\bfn\s+ffmpeg_exec\s*\(/,
    /\bfn\s+ffmpeg_exec_controlled\s*\(/,
    /\bfn\s+ffprobe_json\s*\(/,
    /\.ffmpeg_available\s*\(/,
    /\.ffmpeg_exec\s*\(/,
    /\.ffmpeg_exec_controlled\s*\(/,
    /\.ffprobe_json\s*\(/,
    /\basync\s+fn\s+media_ffprobe_route_is_not_publicly_served\s*\(/,
    /\basync\s+fn\s+media_ffmpeg_exec_route_is_not_publicly_served\s*\(/,
    /\basync\s+fn\s+media_ffmpeg_concat_route_is_not_publicly_served\s*\(/,
    /\bmedia_ffprobe\b/,
    /\bmedia_ffmpeg_exec\b/,
  ];

  const requiredPatternsByTarget = new Map([
    [
      'packages/sdkwork-magic-studio-server/src-host/src/services/media.rs',
      [
        /\bfn\s+media_command_available\s*\(/,
        /\bfn\s+media_command_execute\s*\(/,
        /\bfn\s+media_command_execute_controlled\s*\(/,
        /\bfn\s+media_probe\s*\(/,
      ],
    ],
    [
      'packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs',
      [
        /\.media_command_available\s*\(/,
        /\.media_command_execute_controlled\s*\(/,
        /\.media_probe\s*\(/,
        /\bwith_media_progress_args\s*\(/,
        /\bparse_media_progress_time_to_seconds\s*\(/,
        /\brun_media_command_with_progress\s*\(/,
        /\bmedia_probe_available:\s*bool/,
      ],
    ],
    [
      'packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs',
      [
        /&paths\.media_probe,\s*post\(media::media_probe\)/,
        /&paths\.media_video_concat,\s*post\(media::media_video_concat\)/,
      ],
    ],
  ]);

  for (const relativePath of serverTargets) {
    const source = readSource(relativePath);

    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `Expected ${relativePath} to remove legacy private media naming matching ${pattern}.`,
      );
    }

    for (const pattern of requiredPatternsByTarget.get(relativePath) ?? []) {
      assert.match(
        source,
        pattern,
        `Expected ${relativePath} to participate in the neutral media-command naming standard via ${pattern}.`,
      );
    }
  }
});
