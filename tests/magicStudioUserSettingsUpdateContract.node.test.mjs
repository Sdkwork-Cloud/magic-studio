import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('user settings update contract keeps 2FA read-only and owned by the auth plugin', () => {
  const hostTypeSource = read('packages/sdkwork-magic-studio-host-types/src/server-user.ts');
  const userCenterServiceSource = read(
    'packages/sdkwork-magic-studio-user/src/services/userCenterService.ts',
  );
  const identitySource = read(
    'packages/sdkwork-magic-studio-server/src-host/src/services/identity.rs',
  );
  const openApi = JSON.parse(
    read('packages/sdkwork-magic-studio-server/contracts/magic-studio-server.openapi-components.json'),
  );

  const requestSchema = openApi.schemas.MagicStudioUserSettingsUpdateRequest;
  const requestSecuritySchema = openApi.schemas.MagicStudioUserSettingsSecurityUpdateRequest;
  const readSecuritySchema = openApi.schemas.UserSettingsSecurity;

  assert.ok(requestSchema, 'Expected MagicStudioUserSettingsUpdateRequest schema to exist.');
  assert.equal(
    requestSchema.$ref,
    undefined,
    'Expected the update request schema to be owned independently instead of aliasing UserSettings.',
  );
  assert.equal(requestSchema.type, 'object');
  assert.equal(requestSchema.additionalProperties, false);
  assert.equal(
    requestSchema.properties.security.$ref,
    '#/components/schemas/MagicStudioUserSettingsSecurityUpdateRequest',
  );

  assert.ok(
    requestSecuritySchema,
    'Expected a dedicated security update schema for writable user settings fields.',
  );
  assert.equal(requestSecuritySchema.type, 'object');
  assert.equal(requestSecuritySchema.additionalProperties, false);
  assert.deepEqual(Object.keys(requestSecuritySchema.properties), ['loginAlerts']);
  assert.equal(requestSecuritySchema.properties.loginAlerts.type, 'boolean');
  assert.equal(
    requestSecuritySchema.properties.twoFactorAuth,
    undefined,
    'Expected the update schema to reject twoFactorAuth mutations.',
  );

  assert.ok(
    readSecuritySchema.properties.twoFactorAuth,
    'Expected the read model to continue exposing twoFactorAuth status.',
  );

  assert.doesNotMatch(
    hostTypeSource,
    /export interface MagicStudioUserSettingsUpdateRequest extends UserSettings \{\}/,
    'Expected the shared host DTO to stop aliasing the read model.',
  );
  assert.match(
    hostTypeSource,
    /export interface MagicStudioUserSettingsSecurityUpdateRequest \{\s*loginAlerts\?: boolean;\s*\}/,
    'Expected the shared host DTO to declare a dedicated writable security patch shape.',
  );
  assert.match(
    hostTypeSource,
    /export interface MagicStudioUserSettingsUpdateRequest extends Omit<UserSettings, 'security'> \{/,
    'Expected the shared host DTO to inherit from UserSettings minus the read-only security block.',
  );
  assert.match(
    hostTypeSource,
    /security\?: MagicStudioUserSettingsSecurityUpdateRequest;/,
    'Expected the shared host DTO to own a writable security patch field.',
  );

  assert.match(
    userCenterServiceSource,
    /twoFactorAuth:\s*undefined/,
    'Expected the UI bridge to continue stripping twoFactorAuth before writing settings.',
  );

  assert.match(
    identitySource,
    /#\[serde\(deny_unknown_fields,\s*rename_all = "camelCase"\)\]\s*pub struct UserSettingsSecurityPatch \{/,
    'Expected the Rust request DTO to reject unknown security update fields.',
  );
  assert.match(
    identitySource,
    /pub login_alerts:\s*Option<bool>/,
    'Expected the Rust request DTO to allow loginAlerts updates.',
  );
  assert.doesNotMatch(
    identitySource,
    /pub two_factor_auth:\s*Option<bool>/,
    'Expected the Rust request DTO to remove writable two_factor_auth.',
  );
});
