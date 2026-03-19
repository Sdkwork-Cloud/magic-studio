# App Internationalization Design

**Goal:** deliver end-to-end internationalization coverage for the Magic Studio app and workspace packages so runtime locale selection is deterministic, user-configurable, and free of hardcoded Chinese in source code outside locale resources.

## Current state

- The app already uses `@sdkwork/react-i18n` as the shared translation runtime.
- Locale resolution currently supports URL query override, stored locale, and browser language fallback.
- The settings store already persists a language preference and synchronizes `i18nService`.
- A large number of components, pages, constants, comments, and helper strings still contain hardcoded Chinese or mixed-language UI copy.
- Some packages rely on global translation namespaces instead of package-local i18n modules, which is acceptable, but the actual key coverage is incomplete.

## Design decisions

1. Keep `@sdkwork/react-i18n` as the single runtime authority.
2. Treat locale resources as the only permitted place for Chinese UI strings.
3. Add a repository-level regression test that fails when source files outside locale resources contain Han characters.
4. Normalize remaining hardcoded UI strings into translation keys under existing global namespaces:
   - `settings`
   - `vip`
   - `portalVideo`
   - `film`
   - `magicCut`
   - `market`
   - `common`
5. Convert non-UI Chinese comments and internal literals to English or non-Han-safe forms.
6. Preserve the locale priority order:
   - request override from URL
   - user stored preference
   - browser/system language
   - default locale

## Scope

- App shell layouts and shared loading states
- Settings and sidebar flows
- VIP, portal-video, film, magiccut, trade, notes, user, and commons package source files that still contain Chinese
- Locale resources needed by those modules
- Automated regression coverage for future audits

## Acceptance criteria

- No hardcoded Chinese remains in source files outside locale resource directories.
- All visible text in touched files resolves through the i18n runtime.
- Default language settings continue to persist and apply correctly.
- URL request overrides still win over persisted state.
- Audit tests pass and targeted runtime tests remain green.
