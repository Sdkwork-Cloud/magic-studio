# Magic Studio IAM Appbase Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Magic Studio's package-local auth and user implementations with thin compatibility adapters backed by `sdkwork-appbase` PC React IAM packages.

**Architecture:** Keep the application-facing `@sdkwork/magic-studio-auth` and `@sdkwork/magic-studio-user` contracts stable so the rest of Magic Studio does not need a broad import migration. Collapse those local packages into wrappers around `@sdkwork/auth-pc-react` and `@sdkwork/user-pc-react`, add only the minimal host-owned compatibility surface that the app still needs, and wire the router/build system to support the reusable auth routes.

**Tech Stack:** React 19, Vite, Vitest, TypeScript, React Router, sibling-workspace source aliases.

---

### Task 1: Lock the compatibility contract

**Files:**
- Create: `packages/sdkwork-magic-studio-auth/tests/authCompatibility.test.tsx`
- Create: `packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx`
- Inspect: `src/app/AppProvider.tsx`
- Inspect: `src/app/bootstrap.ts`
- Inspect: `src/layouts/MainLayout/MainSidebar.tsx`
- Inspect: `src/layouts/MainLayout/MainGlobalHeader.tsx`
- Inspect: `packages/sdkwork-magic-studio-trade/src/components/Layout/TradeLayout.tsx`
- Inspect: `packages/sdkwork-magic-studio-portal-video/src/components/PortalHeader.tsx`

- [ ] **Step 1: Write the failing auth compatibility test**

```tsx
render(
  <MemoryRouter initialEntries={['/login']}>
    <AuthStoreProvider>
      <LoginPage />
    </AuthStoreProvider>
  </MemoryRouter>
);

expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/sdkwork-magic-studio-auth/tests/authCompatibility.test.tsx`
Expected: FAIL because current local auth package does not yet use the appbase auth surface or shared compatibility controller.

- [ ] **Step 3: Write the failing user compatibility test**

```tsx
render(<ProfilePage />);
expect(screen.getByText(/account center/i)).toBeInTheDocument();
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test -- packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx`
Expected: FAIL because the current Magic Studio user page still renders the package-local profile center instead of the appbase user center.

- [ ] **Step 5: Commit**

```bash
git add packages/sdkwork-magic-studio-auth/tests/authCompatibility.test.tsx packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx
git commit -m "test: lock identity compatibility expectations"
```

### Task 2: Wire appbase IAM dependencies into Magic Studio

**Files:**
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Modify: `src/router/routes.ts`
- Modify: `src/router/registry.tsx`
- Modify: `src/router/packageRoutes.tsx`
- Modify: `src/router/packageRouteLoader.tsx`
- Create: `src/pages/AuthOAuthCallbackPage.tsx`

- [ ] **Step 1: Add the failing route-level test or targeted verification command**

```bash
pnpm typecheck
```

Expected failure: unresolved imports for `@sdkwork/auth-pc-react`, `@sdkwork/user-pc-react`, `@sdkwork/appbase-pc-react`, `@sdkwork/search-pc-react`, or `@sdkwork/ui-pc-react` once the wrappers start importing the shared packages.

- [ ] **Step 2: Add source aliases for the appbase identity/foundation/ui packages**

Add exact aliases in `vite.config.ts` and matching `paths` entries in `tsconfig.json` for:

```ts
'@sdkwork/auth-pc-react'
'@sdkwork/user-pc-react'
'@sdkwork/appbase-pc-react'
'@sdkwork/search-pc-react'
'@sdkwork/ui-pc-react'
'@sdkwork/ui-pc-react/theme'
'@sdkwork/ui-pc-react/components/ui/actions'
'@sdkwork/ui-pc-react/components/ui/data-entry'
'@sdkwork/ui-pc-react/components/ui/feedback'
'@sdkwork/ui-pc-react/components/patterns/settings'
```

- [ ] **Step 3: Add reusable auth subroutes**

Extend `src/router/routes.ts` and the three route registries so these paths resolve:

```ts
'/auth/login'
'/auth/register'
'/auth/forgot-password'
'/auth/oauth/callback/:provider'
```

Point `/auth/login`, `/auth/register`, and `/auth/forgot-password` at `src/pages/LoginPage.tsx`, and point the callback route at `src/pages/AuthOAuthCallbackPage.tsx`.

- [ ] **Step 4: Run typecheck again**

Run: `pnpm typecheck`
Expected: route typing and external package resolution pass, or fail only on the upcoming compatibility-wrapper work.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts tsconfig.json src/router/routes.ts src/router/registry.tsx src/router/packageRoutes.tsx src/router/packageRouteLoader.tsx src/pages/AuthOAuthCallbackPage.tsx
git commit -m "feat: wire appbase IAM dependencies and auth routes"
```

### Task 3: Collapse local auth into a compatibility adapter

**Files:**
- Modify: `packages/sdkwork-magic-studio-auth/src/index.ts`
- Create: `packages/sdkwork-magic-studio-auth/src/store/authStore.tsx`
- Create: `packages/sdkwork-magic-studio-auth/src/store/index.ts`
- Create: `packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx`
- Create: `packages/sdkwork-magic-studio-auth/src/pages/AuthOAuthCallbackPage.tsx`
- Create: `packages/sdkwork-magic-studio-auth/src/pages/index.ts`
- Modify or keep: `packages/sdkwork-magic-studio-auth/src/i18n/index.ts`
- Delete: `packages/sdkwork-magic-studio-auth/src/components/*`
- Delete: `packages/sdkwork-magic-studio-auth/src/entities/*`
- Delete: `packages/sdkwork-magic-studio-auth/src/services/*`
- Delete: obsolete local auth tests that only cover removed internals

- [ ] **Step 1: Run the auth compatibility test and capture the failing output**

Run: `pnpm test -- packages/sdkwork-magic-studio-auth/tests/authCompatibility.test.tsx`
Expected: FAIL because the existing local auth store/page do not yet wrap the shared appbase controller and page.

- [ ] **Step 2: Implement the shared-controller auth store**

Create an `AuthStoreProvider` that owns one `createSdkworkAuthController()` instance and maps appbase auth state to the legacy shape:

```tsx
{
  user: mappedUser,
  isAuthenticated,
  authToken,
  accessToken,
  refreshToken,
  login,
  loginWithEmail,
  loginWithPhone,
  logout,
  register,
  refreshAuthToken,
  refreshAccessToken,
  syncCurrentSession,
}
```

- [ ] **Step 3: Implement the auth page wrappers**

Wrap the appbase pages with `SdkworkThemeProvider` and the shared controller:

```tsx
<SdkworkThemeProvider defaultTheme="system">
  <SdkworkAuthPage controller={controller} homePath={ROUTES.HOME} />
</SdkworkThemeProvider>
```

and

```tsx
<SdkworkThemeProvider defaultTheme="system">
  <SdkworkAuthOAuthCallbackPage controller={controller} homePath={ROUTES.HOME} />
</SdkworkThemeProvider>
```

- [ ] **Step 4: Re-export the appbase helpers plus the local compatibility API**

`packages/sdkwork-magic-studio-auth/src/index.ts` should re-export:

```ts
export { AuthStoreProvider, useAuthStore } from './store';
export { LoginPage, AuthOAuthCallbackPage } from './pages';
export { defaultI18nConfig } from './i18n';
export * from '@sdkwork/auth-pc-react';
```

- [ ] **Step 5: Remove the superseded local auth implementation files**

Delete the old component/service/entity implementation tree so Magic Studio only owns compatibility glue and host-specific i18n.

- [ ] **Step 6: Run the auth compatibility test**

Run: `pnpm test -- packages/sdkwork-magic-studio-auth/tests/authCompatibility.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/sdkwork-magic-studio-auth
git commit -m "refactor: adapt magic studio auth to appbase identity"
```

### Task 4: Collapse local user into a compatibility adapter

**Files:**
- Modify: `packages/sdkwork-magic-studio-user/src/index.ts`
- Create: `packages/sdkwork-magic-studio-user/src/pages/ProfilePage.tsx`
- Delete: `packages/sdkwork-magic-studio-user/src/services/*`
- Delete: `packages/sdkwork-magic-studio-user/src/pages/profilePageState.ts`
- Delete: obsolete local user tests that only cover removed internals

- [ ] **Step 1: Run the user compatibility test and capture the failing output**

Run: `pnpm test -- packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx`
Expected: FAIL because the current package still renders the Magic Studio-local profile center.

- [ ] **Step 2: Implement the profile page wrapper**

Render the appbase user center through the shared theme provider:

```tsx
<SdkworkThemeProvider defaultTheme="system">
  <SdkworkUserCenterPage />
</SdkworkThemeProvider>
```

- [ ] **Step 3: Re-export the shared user-center helpers**

`packages/sdkwork-magic-studio-user/src/index.ts` should expose the compatibility page and the appbase user package:

```ts
export { ProfilePage } from './pages/ProfilePage';
export { ProfilePage as default } from './pages/ProfilePage';
export * from '@sdkwork/user-pc-react';
```

- [ ] **Step 4: Remove the superseded local user implementation**

Delete the old page state and service layer now replaced by the appbase user controller/service.

- [ ] **Step 5: Run the user compatibility test**

Run: `pnpm test -- packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/sdkwork-magic-studio-user
git commit -m "refactor: adapt magic studio user center to appbase identity"
```

### Task 5: Update app entrypoints and verify end to end

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/app/AppProvider.tsx` only if auth provider typing or wrapper composition needs cleanup
- Modify: `src/app/bootstrap.ts` only if auth i18n registration changes

- [ ] **Step 1: Simplify the application wrappers**

Keep app pages thin:

```tsx
return <AuthLoginPage homePath={ROUTES.HOME} />;
```

and

```tsx
return <UserProfilePage />;
```

- [ ] **Step 2: Run focused validation**

Run:

```bash
pnpm test -- packages/sdkwork-magic-studio-auth/tests/authCompatibility.test.tsx packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx
pnpm typecheck
pnpm build:git-sdk
```

Expected:
- compatibility tests pass
- typecheck passes
- build succeeds with appbase IAM packages resolved through aliases

- [ ] **Step 3: Fix any regression surfaced by headers, sidebars, or trade/portal consumers**

Re-run the smallest failing command after each fix until green.

- [ ] **Step 4: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/ProfilePage.tsx src/app/AppProvider.tsx src/app/bootstrap.ts
git commit -m "feat: complete magic studio identity appbase integration"
```
