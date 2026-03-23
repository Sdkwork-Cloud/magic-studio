# Magic Studio Cleanup Verification

Run the narrowest useful set first, then broaden before completion:

```bash
pnpm install
pnpm audit:services:policy
pnpm audit:services
node ../scripts/check-sdk-compliance.mjs --strict
pnpm build:packages
pnpm typecheck
pnpm build
pnpm tauri
```

Use `pnpm tauri` as a host smoke check only when Tauri entry points or desktop bridges changed. For package-only cleanup work, the audits plus `pnpm build` are the minimum bar.
