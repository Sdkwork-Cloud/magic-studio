# Magic Studio Verification

Run the narrowest useful set first, then broaden before completion:

```bash
pnpm install
pnpm audit:services:policy
pnpm audit:services
pnpm check:sdk-standard
pnpm build:packages
pnpm typecheck
pnpm build
pnpm tauri:build
```

Use `pnpm tauri:build` when desktop host code, Tauri bridges, or packaging changes were touched. For package-only web work, the audits plus `pnpm build` are the minimum bar.
