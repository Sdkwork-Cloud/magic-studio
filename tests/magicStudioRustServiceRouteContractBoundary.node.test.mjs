import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const rustServicesRoot = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'services',
);

const readServiceSource = (fileName) => fs.readFileSync(path.join(rustServicesRoot, fileName), 'utf8');

test('rust host service metadata derives concrete API paths from canonical route ids', () => {
  const voicesSource = readServiceSource('voices.rs');
  const workspacesSource = readServiceSource('workspaces.rs');

  assert.doesNotMatch(
    voicesSource,
    /"\/api\/app\/v1\/voices\/speech\/tasks\/:taskId"/,
    'Expected voice service metadata to derive the speech task route from appVoicesReadSpeechTask instead of hardcoding the path.',
  );
  assert.match(
    voicesSource,
    /appVoicesReadSpeechTask[\s\S]*require_route_path_by_id/,
    'Expected voice service metadata to read the speech task route from the canonical contract.',
  );

  assert.doesNotMatch(
    workspacesSource,
    /"\/api\/app\/v1\/workspaces\/\{workspace_id\}\/projects\/\{project_id\}\/releases\/\{release_id\}\/artifact"/,
    'Expected workspace release artifact paths to be materialized from appWorkspaceProjectsReadReleaseArtifact instead of hardcoding the path template.',
  );
  assert.match(
    workspacesSource,
    /appWorkspaceProjectsReadReleaseArtifact[\s\S]*materialize_route_path/,
    'Expected workspace release artifact paths to materialize the canonical contract route.',
  );
});
