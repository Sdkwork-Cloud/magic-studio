# 2026-04-07 Step 03 Asset Center SDK root export convergence

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第十六轮局部闭环`

## 本轮目标

围绕已经被定�?`tsc --ignoreConfig` 稳定复现的共�?SDK blocker 继续收敛�?
1. 证明 `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts` �?`retired generic app SDK/*` subpath exports 的依赖，在当�?npm mode / node_modules Junction / `--ignoreConfig` 解析链下不可用�?2. 在不回退�?broad app client singleton、也不引�?package-local HTTP 的前提下，让 shared wrapper 继续只消费资产中心所需的精确能力�?3. 完成真实 RED -> GREEN -> typecheck -> 资产中心回归闭环，并把证据回写到 review / release�?
## 根因结论

本轮先后验证了两层事实：

1. `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts` 当前直接导入�?   - `retired generic app SDK/api/asset-center`
   - `retired generic app SDK/api/upload`
   - `retired generic app SDK/http/client`
   - `retired generic app SDK/types/common`
2. `pnpm-workspace.yaml` 明确排除了本�?`packages/product-app-sdk`，当�?`node_modules/retired generic app SDK` 实际是一�?Junction，指向外部共享源码：
   - `application-root product app SDK TypeScript family`
3. 该真实生效包当前只导�?`"."` 根入口，没有导出 `./api/*`、`./http/*`、`./types/*`�?4. 因为定向验证命令使用的是 `tsc --ignoreConfig`，不会吃仓库�?`tsconfig.paths`，所以解析直接落�?`node_modules/retired generic app SDK/package.json.exports`�?
结论�?
- 当前 Magic Studio 真正�?blocker 不是“方法不存在”，而是“共�?SDK 实际生效包没有开�?subpath exports”�?- 在当前工作区权限约束下，无法直接修复外部共享源码包本身�?- 但根入口 `retired generic app SDK` 已经 re-export�?  - `createAssetCenterApi`
  - `createUploadApi`
  - `createHttpClient`
  - `SdkworkAppConfig`
- 因此最优可落地方案不是继续�?subpath exports 会立即补齐，而是先把 `sdkwork-magic-studio-core` 这个 shared wrapper 收敛到根导出，消除当前应用对 unresolved subpath 的直接依赖�?
## 设计约束

- 不改 feature 包与业务调用方接口�?- 不引�?raw `fetch`、manual headers、mock fallback、package-local SDK fork�?- 不使�?`createClient(...)` 构造全�?generated client�?- 只调�?`sdkwork-magic-studio-core` 共享 wrapper �?SDK 入口选择�?- 明确记录：外部共�?SDK 契约源仍未补�?subpath exports，本轮只是解�?Magic Studio 当前主路�?blocker，不是宣布共享契约源已经完成治理�?
## RED

先把边界测试改到真实可交付目标：`assetCenterClient.ts` 必须消费 `retired generic app SDK` 根导出，并停止依�?unresolved subpath exports�?
命令�?
```bash
node tests/assetsFocusedSdkClientBoundary.node.test.mjs
```

RED 结果�?
- `7 tests | 1 failed`
- 失败点精确落在：
  - `Expected focused asset-center helper to consume the generated app SDK through the shared root export that actually ships in npm mode.`
- 同一时刻，定�?`tsc` 仍稳定失败：

```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx
```

失败点：

- `Cannot find module 'retired generic app SDK/api/asset-center'`
- `Cannot find module 'retired generic app SDK/api/upload'`
- `Cannot find module 'retired generic app SDK/http/client'`
- `Cannot find module 'retired generic app SDK/types/common'`

## 实施

### 1. 调整 shared wrapper SDK 入口

更新 `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`�?
- �?`retired generic app SDK` 根导出统一导入�?  - `createAssetCenterApi`
  - `createUploadApi`
  - `createHttpClient`
  - `AssetCenterApi`
  - `UploadApi`
  - `SdkworkAppConfig`
- 保持 `createAssetCenterSdkClient(...)` 仍然只组合资产中心与上传两类能力�?- 保持 `createClient(...)` 仍不进入�?focused wrapper�?
### 2. 调整边界测试

更新 `tests/assetsFocusedSdkClientBoundary.node.test.mjs`�?
- 正向断言 `assetCenterClient.ts` 已切�?`retired generic app SDK` 根导出�?- 负向断言不再依赖�?  - `retired generic app SDK/api/*`
  - `retired generic app SDK/http/*`
  - `retired generic app SDK/types/*`
- 继续保留�?  - 不得回退�?`createClient(...)`
  - feature 包仍只能�?focused asset-center helper

## GREEN / 验证结果

### 1. 边界测试 GREEN

命令�?
```bash
node tests/assetsFocusedSdkClientBoundary.node.test.mjs
```

结果�?
- `7 tests passed`

### 2. 定向 TypeScript blocker 解除

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx
```

结果�?
- `PASS`

### 3. 运行时根导出可用性验�?
命令�?
```bash
node --input-type=module -e "const sdk = await import('retired generic app SDK'); console.log(typeof sdk.createAssetCenterApi, typeof sdk.createUploadApi, typeof sdk.createHttpClient);"
```

结果�?
- 输出：`function function function`

### 4. Step 03 资产中心回归

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `assetCenterProjectManagedImport.test.ts`: `7 tests passed`
- `assetCenterDeleteSafety.test.ts`: `3 tests passed`

## 检查点评估

### CP03-1 Magic Studio 当前主路径是否仍被共�?SDK subpath exports 阻塞

- 结论：`PASS`
- 证据：Canvas 定向 `tsc --ignoreConfig` 已通过�?
### CP03-2 shared wrapper 是否仍保�?focused 组合而非 broad client singleton

- 结论：`PASS`
- 证据�?  - `assetCenterClient.ts` 仍只组合 `createAssetCenterApi` / `createUploadApi` / `createHttpClient`
  - `tests/assetsFocusedSdkClientBoundary.node.test.mjs` 全绿
  - `createClient(...)` 仍未进入该路�?
### CP03-3 本轮是否错误宣称共享 SDK 契约源已完全治理

- 结论：`NO`
- 说明�?  - 外部共享 SDK 实际生效包仍未补�?subpath exports
  - 本轮只完成了 Magic Studio shared wrapper 的应用侧收敛

### CP03-4 Step 03 是否可宣告完�?
- 结论：`NO`
- 原因�?  - `ChooseAsset` node/web �?persisted reference 收口仍未闭环
  - 共享 SDK 契约源级别的 subpath exports 缺口仍未在源头消除，未来若新�?`retired generic app SDK/*` 直接导入，问题可能复�?
## 现存风险 / Blocker

- 外部共享 `retired generic app SDK` 契约源当前仍只开放根导出，未开�?`./api/*`、`./http/*`、`./types/*`�?- 当前问题�?Magic Studio 主路径已�?shared wrapper 收敛，但若后续新代码再次直接导入 `retired generic app SDK/*`，仍会复发�?- `ChooseAsset` node/web �?project-level persisted reference 收口仍需继续审计并做下一�?RED/GREEN�?- 本轮没有运行全仓 `pnpm test`、`pnpm typecheck`、`pnpm build`，因此不能宣称仓库整体完成�?
## 下一轮建�?
1. 继续留在 `Step 03`，优先审�?`ChooseAsset` node/web 真实入口是否完成 `project-level persisted reference` 回写�?2. 在应用层继续保持“feature -> focused wrapper -> shared app sdk”路径，不要再新增对 `retired generic app SDK/*` subpath exports 的直接依赖�?3. 将“共�?SDK 契约源补�?subpath exports”登记为跨仓共享治理项，在具备外部源码可写权限后再做源头闭环�?