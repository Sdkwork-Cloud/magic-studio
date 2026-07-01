import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const packageRoot = path.resolve(import.meta.dirname, '..');
const standardPath = path.join(packageRoot, 'src', 'authStandard.ts');
const indexPath = path.join(packageRoot, 'src', 'index.ts');

registerHooks({
  resolve(specifier, context, defaultResolve) {
    if (specifier === '@sdkwork/auth-pc-react') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            function normalizeBasePath(basePath) {
              const normalized = String(basePath ?? '/auth').trim().replace(/\\/+$/u, '');
              return normalized || '/auth';
            }

            function createAuthRouteCatalog(basePath = '/auth') {
              const resolvedBasePath = normalizeBasePath(basePath);
              return [
                { access: 'anonymous-only', id: 'login', path: resolvedBasePath + '/login' },
                { access: 'anonymous-only', id: 'register', path: resolvedBasePath + '/register' },
                { access: 'anonymous-only', id: 'forgot-password', path: resolvedBasePath + '/forgot-password' },
                { access: 'anonymous-only', id: 'oauth-callback', path: resolvedBasePath + '/oauth/callback/:provider' },
                { access: 'anonymous-only', id: 'qr-login', path: resolvedBasePath + '/qr-login' },
              ];
            }

            function createAuthWorkspaceManifest(options = {}) {
              return {
                capability: 'auth',
                forgotPasswordRoutePath: options.forgotPasswordRoutePath ?? '/auth/forgot-password',
                host: options.host,
                id: options.id ?? 'sdkwork-auth',
                loginRoutePath: options.loginRoutePath ?? '/auth/login',
                oauthCallbackRoutePattern: options.oauthCallbackRoutePattern ?? '/auth/oauth/callback/:provider',
                packageNames: options.packageNames ?? ['@sdkwork/auth-pc-react'],
                qrRoutePath: options.qrRoutePath ?? '/auth/qr-login',
                registerRoutePath: options.registerRoutePath ?? '/auth/register',
                title: options.title ?? 'Auth',
              };
            }

            function shouldKeepRedirect(redirectTo) {
              const normalized = String(redirectTo ?? '').trim();
              return normalized
                && normalized.startsWith('/')
                && normalized !== '/auth'
                && normalized !== '/auth/login'
                && normalized !== '/auth/register'
                && normalized !== '/auth/forgot-password'
                && normalized !== '/auth/qr-login';
            }

            function createAuthRouteIntent(routeId, options = {}) {
              const routes = options.routes ?? createAuthRouteCatalog('/auth');
              const route = routes.find((candidate) => candidate.id === routeId);
              if (!route) {
                throw new Error('Unknown auth route id: ' + routeId);
              }

              let resolvedRoute = route.path;
              if (routeId === 'oauth-callback') {
                const provider = String(options.provider ?? '').trim();
                if (!provider) {
                  throw new Error('OAuth callback route requires a provider.');
                }
                resolvedRoute = resolvedRoute.replace(':provider', provider);
              }

              const redirectTo = shouldKeepRedirect(options.redirectTo)
                ? String(options.redirectTo).trim()
                : '';
              if (redirectTo) {
                const query = new URLSearchParams();
                query.set('redirect', redirectTo);
                resolvedRoute += '?' + query.toString();
              }

              return {
                focusWindow: options.focusWindow !== false,
                ...(String(options.provider ?? '').trim()
                  ? { provider: String(options.provider).trim() }
                  : {}),
                ...(redirectTo ? { redirectTo } : {}),
                route: resolvedRoute,
                routeId,
                source: 'auth-workspace',
                type: 'auth-route-intent',
              };
            }

            export {
              createAuthRouteCatalog,
              createAuthRouteIntent,
              createAuthWorkspaceManifest,
            };
          `),
      };
    }

    return defaultResolve(specifier, context, defaultResolve);
  },
});

test('magic-studio auth package exposes a canonical auth workspace bridge built on sdkwork-appbase auth primitives', async () => {
  assert.equal(fs.existsSync(standardPath), true);

  const source = fs.readFileSync(standardPath, 'utf8');
  const indexSource = fs.readFileSync(indexPath, 'utf8');

  assert.match(source, /createAuthRouteCatalog/u);
  assert.match(source, /createAuthRouteIntent/u);
  assert.match(source, /createAuthWorkspaceManifest/u);
  assert.match(source, /from '@sdkwork\/auth-pc-react'/u);
  assert.match(
    source,
    /extends Omit<CreateAuthWorkspaceManifestOptions,\s*'packageNames'>/u,
    'Expected the local auth workspace manifest options to inherit the upstream contract while replacing packageNames with a readonly variant.',
  );
  assert.match(indexSource, /authStandard/u);

  const standard = await import(pathToFileURL(standardPath).href);
  const manifest = standard.createMagicStudioAuthWorkspaceManifest();
  assert.equal(manifest.capability, 'auth');
  assert.equal(manifest.id, 'sdkwork-magic-studio-auth');
  assert.equal(manifest.loginRoutePath, '/auth/login');
  assert.equal(manifest.registerRoutePath, '/auth/register');
  assert.equal(manifest.forgotPasswordRoutePath, '/auth/forgot-password');
  assert.equal(manifest.qrRoutePath, '/auth/qr-login');
  assert.deepEqual(manifest.packageNames, ['@sdkwork/magic-studio-auth']);

  const routes = standard.createMagicStudioAuthRouteCatalog();
  assert.deepEqual(
    routes.map((route) => route.id),
    ['login', 'register', 'forgot-password', 'oauth-callback', 'qr-login'],
  );

  const loginIntent = standard.createMagicStudioAuthRouteIntent('login', {
    redirectTo: '/workspace/home',
  });
  assert.equal(loginIntent.route, '/auth/login?redirect=%2Fworkspace%2Fhome');
  assert.equal(loginIntent.routeId, 'login');
  assert.equal(loginIntent.source, 'auth-workspace');
  assert.equal(loginIntent.type, 'auth-route-intent');

  const oauthIntent = standard.createMagicStudioAuthRouteIntent('oauth-callback', {
    provider: 'wechat',
    redirectTo: '/workspace/home',
  });
  assert.equal(
    oauthIntent.route,
    '/auth/oauth/callback/wechat?redirect=%2Fworkspace%2Fhome',
  );
  assert.equal(oauthIntent.provider, 'wechat');

  const safeRedirectIntent = standard.createMagicStudioAuthRouteIntent('register', {
    redirectTo: '/auth/login',
  });
  assert.equal(safeRedirectIntent.route, '/auth/register');

  assert.throws(
    () => standard.createMagicStudioAuthRouteIntent('oauth-callback'),
    /provider/u,
  );
});
