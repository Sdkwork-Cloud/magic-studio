import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EXTERNAL_APP_SDK_ENTRY,
  EXTERNAL_APPBASE_PC_REACT_ENTRY,
  EXTERNAL_AUTH_PC_REACT_ENTRY,
  EXTERNAL_CORE_PC_REACT_ENTRY,
  EXTERNAL_SDK_COMMON_ENTRY,
  EXTERNAL_SEARCH_PC_REACT_ENTRY,
  EXTERNAL_UI_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_CORE_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
  EXTERNAL_USER_PC_REACT_ENTRY,
  GIT_APP_SDK_ENTRY,
  GIT_APPBASE_PC_REACT_ENTRY,
  GIT_AUTH_PC_REACT_ENTRY,
  GIT_CORE_PC_REACT_ENTRY,
  GIT_SDK_COMMON_ENTRY,
  GIT_SEARCH_PC_REACT_ENTRY,
  GIT_UI_PC_REACT_ENTRY,
  GIT_USER_CENTER_CORE_PC_REACT_ENTRY,
  GIT_USER_CENTER_PC_REACT_ENTRY,
  GIT_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
  GIT_USER_PC_REACT_ENTRY,
  getSdkEntries,
  resolveSdkMode,
} from '../scripts/sdk-mode.mjs';

test('sdk mode defaults to source and accepts the canonical source/git/npm modes', () => {
  const previousMode = process.env.MAGIC_STUDIO_SDK_MODE;

  try {
    delete process.env.MAGIC_STUDIO_SDK_MODE;
    assert.equal(resolveSdkMode(), 'source');

    process.env.MAGIC_STUDIO_SDK_MODE = 'source';
    assert.equal(resolveSdkMode(), 'source');

    process.env.MAGIC_STUDIO_SDK_MODE = 'git';
    assert.equal(resolveSdkMode(), 'git');

    process.env.MAGIC_STUDIO_SDK_MODE = 'npm';
    assert.equal(resolveSdkMode(), 'npm');
  } finally {
    if (previousMode === undefined) {
      delete process.env.MAGIC_STUDIO_SDK_MODE;
    } else {
      process.env.MAGIC_STUDIO_SDK_MODE = previousMode;
    }
  }
});

test('source mode uses sibling workspace sources while git mode uses materialized git checkouts for every external release dependency', () => {
  assert.deepEqual(getSdkEntries('source'), [
    EXTERNAL_APP_SDK_ENTRY,
    EXTERNAL_SDK_COMMON_ENTRY,
    EXTERNAL_CORE_PC_REACT_ENTRY,
    EXTERNAL_UI_PC_REACT_ENTRY,
    EXTERNAL_APPBASE_PC_REACT_ENTRY,
    EXTERNAL_SEARCH_PC_REACT_ENTRY,
    EXTERNAL_AUTH_PC_REACT_ENTRY,
    EXTERNAL_USER_PC_REACT_ENTRY,
    EXTERNAL_USER_CENTER_CORE_PC_REACT_ENTRY,
    EXTERNAL_USER_CENTER_PC_REACT_ENTRY,
    EXTERNAL_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
  ]);
  assert.deepEqual(getSdkEntries('git'), [
    GIT_APP_SDK_ENTRY,
    GIT_SDK_COMMON_ENTRY,
    GIT_CORE_PC_REACT_ENTRY,
    GIT_UI_PC_REACT_ENTRY,
    GIT_APPBASE_PC_REACT_ENTRY,
    GIT_SEARCH_PC_REACT_ENTRY,
    GIT_AUTH_PC_REACT_ENTRY,
    GIT_USER_PC_REACT_ENTRY,
    GIT_USER_CENTER_CORE_PC_REACT_ENTRY,
    GIT_USER_CENTER_PC_REACT_ENTRY,
    GIT_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
  ]);
  assert.deepEqual(getSdkEntries('npm'), []);
});
