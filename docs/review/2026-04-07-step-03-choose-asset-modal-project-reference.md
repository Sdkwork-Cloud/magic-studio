# 2026-04-07 Step 03 ChooseAssetModal project reference

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十五轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在 `VoiceLabModal` 的直�?`ChooseAsset` 入口已经收口之后，继续向资产组件主干推进。本轮选定目标�?
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.types.ts`
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx`
- `packages/sdkwork-magic-studio-assets/src/store/assetStore.tsx`

目标是把 `ChooseAssetModal` 从“只会上�?/ 选择资产”的模态组件，升级为“能够把上传与库内确认都纳入项目�?persisted reference 主干”的共享基础设施�?
## 根因结论

本轮审计确认�?
1. `ChooseAsset.tsx`
   - 已具�?`projectReference` 主干能力
   - 但打开 `ChooseAssetModal` 时没有把 `projectReference` 继续透传给模�?2. `ChooseAssetModal.types.ts`
   - 当前不接�?`projectReference`
   - 说明模态主干从类型层面就无法承载项目级引用语义
3. `AssetStoreProvider.importAssets()`
   - 会在模态内执行本地上传
   - 但上传后只调�?`assetBusinessService.importAssetBySdk(...)`
   - 没有继续调用 `persistChooseAssetProjectReference(...)`
4. `ChooseAssetModalContent.handleConfirm()`
   - 会在库内选择后把资产回传给调用方
   - 但不会为这些已选资产补绑定项目�?persisted reference

因此当前真实业务事实是：

- `ChooseAsset` 的本地上传已经能进入 persisted reference 主干
- 但一旦用户走�?`ChooseAssetModal`�?  - 本地上传不会持久化项目级引用
  - 库内确认也不会补绑定项目级引�?- 这会导致多个依赖 `ChooseAssetModal` 的核心左侧面板仍然游离于项目级资产治理之�?
## 设计约束

- 不在各个消费方面板内散落资产治理逻辑
- 必须优先修复共享主干，而不是继续逐个消费方面板打补丁
- 复用现有 `persistChooseAssetProjectReference(...)`
- 不引入与 `ChooseAsset` 平行的第二套项目级引用实�?- 本轮只关�?`ChooseAssetModal` 主干透传与持久化能力，不扩大到各消费�?slot 命名落地

## RED

先补失败测试，证明主干缺口存在�?
命令 A�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果 A�?
- `1 test | 1 failed`
- 失败点：
  - `ChooseAssetModal.types.ts` 不包�?`projectReference?: ChooseAssetProjectReference`
  - `ChooseAsset.tsx` 没有�?`projectReference` 透传�?`ChooseAssetModal`
  - `ChooseAssetModalContent.tsx` 没有�?`projectReference` 透传�?`AssetStoreProvider`

命令 B�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果 B�?
- `0 test`
- 失败原因�?  - `Cannot find module '../src/components/chooseAssetModalProjectReference'`

命令 C�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果 C�?
- `1 test | 1 failed`
- 失败点：
  - `AssetStoreProvider.importAssets()` 没有在模态上传后调用 `persistChooseAssetProjectReference(...)`

## 实施

### 1. 固化主干边界

新增�?
- `packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts`

边界约束�?
- `ChooseAssetModal.types.ts` 必须暴露 `projectReference`
- `ChooseAsset.tsx` 必须�?`projectReference` 透传�?`ChooseAssetModal`
- `ChooseAssetModalContent.tsx` 必须�?`projectReference` 透传�?`AssetStoreProvider`
- `ChooseAssetModalContent.tsx` 必须显式调用模态选择持久化主�?
### 2. 增加模态确认持久化主干

新增�?
- `packages/sdkwork-magic-studio-assets/src/components/chooseAssetModalProjectReference.ts`
- `packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts`

落地方式�?
- 新增 `persistChooseAssetModalSelectionProjectReferences(...)`
- 为模态确认的每个已选资产调�?`persistChooseAssetProjectReference(...)`

### 3. 为模态上传链路补齐项目级 persisted reference

更新�?
- `packages/sdkwork-magic-studio-assets/src/store/assetStore.tsx`

落地方式�?
- �?`importAssets()` 中导�?`persistChooseAssetProjectReference`
- 上传完成后解�?`resolvedUrl`
- 调用�?
```ts
await persistChooseAssetProjectReference({
  uploaded: imported,
  resolvedUrl,
  fallbackType: detected,
  domain,
  projectReference,
});
```

### 4. 为模态与桥接组件补齐透传能力

更新�?
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.types.ts`
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx`

落地方式�?
- �?`ChooseAssetModal` 类型契约中增�?`projectReference`
- `ChooseAsset.tsx` �?`ChooseAssetModal` 透传 `projectReference`
- `ChooseAssetModalContent.tsx` �?`AssetStoreProvider` 透传 `projectReference`
- `ChooseAssetModalContent.handleConfirm()` 在库内确认前先执行项目级引用持久�?
## GREEN / 验证结果

### 1. 新增主干测试 RED -> GREEN

命令 A�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果 A�?
- `1 file, 1 test passed`

命令 B�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果 B�?
- `1 file, 2 tests passed`

命令 C�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果 C�?
- `1 file, 1 test passed`

### 2. 资产主干回归

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `7 files, 17 tests passed`

### 3. 跨包 boundary 回归

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `8 files, 8 tests passed`

### 4. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.types.ts packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetModalProjectReference.ts packages/sdkwork-magic-studio-assets/src/store/assetStore.tsx
```

结果�?
- `PASS`

### 5. 额外验证说明

尝试执行更大的资产回归命令时，`packages/sdkwork-magic-studio-assets/tests/assetStoreIdentity.test.tsx` 暴露了现有环境噪音：

- `EPERM: operation not permitted, open ...\\retry\\index.js`
- `ReferenceError: indexedDB is not defined`

补充结论�?
- 该失败来自现有测试环境与 `packages/sdkwork-magic-studio-core/src/platform/web.ts` 的运行时前提
- 不是本轮 `ChooseAssetModal` 主干透传改造引入的功能回归
- 已通过拆分受影响范围重新回归，证明本轮变更范围内能力仍然通过

## 检查点评估

### CP03-35 `ChooseAssetModal` 是否具备 `projectReference` 主干透传能力

- 结论：`PASS`
- 证据�?  - `ChooseAssetModal.types.ts` 已暴�?`projectReference`
  - `ChooseAsset.tsx` 已透传 `projectReference`
  - `ChooseAssetModalContent.tsx` 已透传 `projectReference`

### CP03-36 模态上传是否会持久化项目级 persisted reference

- 结论：`PASS`
- 证据�?  - `AssetStoreProvider.importAssets()` 已调�?`persistChooseAssetProjectReference(...)`
  - `assetStoreProjectReference.test.tsx` 已通过

### CP03-37 模态库内确认是否会补绑定项目级 persisted reference

- 结论：`PASS`
- 证据�?  - `chooseAssetModalProjectReference.ts` 已落�?  - `chooseAssetModalSelectionProjectReference.test.ts` 已通过

### CP03-38 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 本轮只完成了 `ChooseAssetModal` 主干透传与持久化能力
  - 仍有多个消费方尚未补齐明�?slot / source 命名

### CP03-39 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - `VoiceLeftGeneratorPanel`、`VideoLeftGeneratorPanel`、`ImageLeftGeneratorPanel`、`AudioLeftGeneratorPanel` 等核心消费方仍未收口
  - voicespeaker / character 的现有类型依赖解析阻塞仍未解�?  - 未执行全�?`test / typecheck / build`

## 现存风险 / Blocker

- 多个核心面板虽已具备主干能力可接入，但尚未显式声明各自业�?slot / source�?  - `packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx`
- voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 现有依赖解析阻塞仍未解除
- 更大范围资产测试命令存在现有环境噪音，需要后续单独治�?`indexedDB` 与文件访问环�?
## 下一轮建�?
1. 继续停留�?`Step 03`，优先收口第一批核�?`ChooseAssetModal` 消费方�?2. 建议按用户价值和依赖顺序推进�?   - `VoiceLeftGeneratorPanel`
   - `VideoLeftGeneratorPanel`
   - `ImageLeftGeneratorPanel`
   - `AudioLeftGeneratorPanel`
3. 每个消费方继续坚持同样节奏：
   - �?boundary RED
   - 再最�?GREEN
   - 再资产主干回归与跨包回归
