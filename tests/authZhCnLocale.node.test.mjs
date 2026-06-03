import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const read = (relativePath) => fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

const MOJIBAKE_PATTERN = /[ÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîï�]/;

function loadAuthZhCNLocale() {
  const source = read('packages/sdkwork-magic-studio-auth/src/i18n/locales/zh-CN/index.ts');
  const executableSource = source
    .replace(/^import type .*?;\s*/m, '')
    .replace(/export const authZhCN:\s*I18nNamespaceResource\s*=/, 'const authZhCN =');

  return Function(`${executableSource}\nreturn authZhCN;`)();
}

test('auth zh-CN locale keeps readable Chinese copy for core login flows', () => {
  const source = read('packages/sdkwork-magic-studio-auth/src/i18n/locales/zh-CN/index.ts');
  const locale = loadAuthZhCNLocale();

  assert.equal(locale.welcomeBack, '欢迎回来');
  assert.equal(locale.createAccount, '创建账户');
  assert.equal(locale.resetPassword, '重置密码');
  assert.equal(locale.oauth.processingTitle, '正在完成 OAuth 登录');
  assert.equal(locale.qrStatus.loading, '正在准备二维码登录');
  assert.doesNotMatch(source, MOJIBAKE_PATTERN, 'Expected zh-CN auth locale source to avoid mojibake.');
});
