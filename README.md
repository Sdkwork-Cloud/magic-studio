# Magic Studio V2

## Development

Prerequisites:

- Node.js
- pnpm
- Rust toolchain
- Tauri desktop prerequisites for your operating system

Install dependencies:

```bash
pnpm install
```

Run the web app:

```bash
pnpm dev
```

Run the desktop app in Tauri development mode:

```bash
pnpm tauri:dev
```

## Build

Build the web app:

```bash
pnpm build
```

Build the desktop app without generating installers:

```bash
pnpm tauri:build
```

Build the desktop installer bundle:

```bash
pnpm tauri:bundle
```

Windows installer output:

```text
src-tauri/target/release/bundle/nsis/
```

## Release

This repository includes a GitHub Actions release workflow at `.github/workflows/release.yml`.

Release behavior:

- Pushing a tag like `v0.1.0` builds and publishes GitHub Release assets automatically.
- Running the workflow manually from the Actions tab publishes the current app version as `v__VERSION__`.
- The workflow builds Windows NSIS installers, Ubuntu AppImage and DEB packages, and macOS app and DMG bundles.

Recommended release flow:

```bash
git push origin main
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

Notes:

- Keep the app version aligned in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` before tagging.
- The GitHub Release workflow only publishes installer assets. Runtime updater metadata continues to use `https://api.sdkwork.com/app/v3/api/app/update/latest?app=magic-studio`.
