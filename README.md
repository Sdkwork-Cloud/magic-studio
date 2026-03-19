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
