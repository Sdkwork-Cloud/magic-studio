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

function loadUserZhCNLocale() {
  const source = read('packages/sdkwork-magic-studio-user/src/i18n/locales/zh-CN/index.ts');
  const executableSource = source
    .replace(/^import type .*?;\s*/m, '')
    .replace(/export const userZhCN:\s*I18nNamespaceResource\s*=/, 'const userZhCN =');

  return Function(`${executableSource}\nreturn userZhCN;`)();
}

test('user zh-CN locale keeps readable Chinese copy for account center flows', () => {
  const source = read('packages/sdkwork-magic-studio-user/src/i18n/locales/zh-CN/index.ts');
  const locale = loadUserZhCNLocale();

  assert.equal(locale.accountCenterTitle, 'Magic Studio 账户中心');
  assert.equal(locale.loading, '正在加载账户中心...');
  assert.equal(locale.profile.title, '身份资料');
  assert.equal(locale.notifications.items.newMessages, '新消息');
  assert.equal(locale.actions.updatePassword, '更新密码');
  assert.doesNotMatch(source, MOJIBAKE_PATTERN, 'Expected zh-CN user locale source to avoid mojibake.');
});
