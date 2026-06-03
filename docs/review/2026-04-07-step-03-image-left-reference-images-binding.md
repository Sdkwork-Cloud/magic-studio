# 2026-04-07 Step 03 ImageLeftGeneratorPanel reference images binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十八轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在视频左侧生成面板已经完成模态入口收口之后，继续处理图像左侧生成面板。本轮选定目标�?
- `packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx`

目标不只是补 `ChooseAssetModal`，而是把图像左侧生成面板中的两条真实资产输入路径一起纳入项目级 persisted reference 主干�?
- 资产库参考图选择
- 本地参考图上传

## 根因结论

本轮审计确认�?
1. `ImageLeftGeneratorPanel.tsx`
   - 存在一�?`ChooseAssetModal` 入口用于参考图片资产选择
   - 该入口当前未声明 `projectReference`
2. 同一组件还存在本地上传链路：
   - `handleLocalReferenceUpload(...)` 直接调用 `importAssetBySdk(...)`
   - 上传完成后只转换�?`ImageInputResourceRef`
   - 没有进入项目�?persisted reference 主干
3. 因此当前真实业务事实是：
   - 用户无论从资产库选择还是本地上传，都可以把参考图带入图像生成
   - 但项目级资产治理无法稳定识别这两条路径对应的是同一个业务槽�?
## 设计约束

- 不在 `ImageLeftGeneratorPanel` 中散�?asset-center 直连实现
- 必须复用共享 helper `persistChooseAssetProjectReference(...)`
- 模态选择和本地上传必须复用同一份稳定的项目引用契约
- 槽位命名必须稳定、语义清晰、可审计�?  - `image-reference-images`
- source metadata 必须稳定�?  - `image-left-generator-panel`

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `ImageLeftGeneratorPanel.tsx` 不包�?`IMAGE_REFERENCE_PROJECT_REFERENCE`
  - 不包�?`slot: 'image-reference-images'`
  - 不包�?`source: 'image-left-generator-panel'`
  - 不包�?`projectReference={IMAGE_REFERENCE_PROJECT_REFERENCE}`
  - 不包�?`persistChooseAssetProjectReference({`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts`

边界约束�?
- 必须定义统一项目引用契约 `IMAGE_REFERENCE_PROJECT_REFERENCE`
- 模态选择必须复用该契�?- 本地上传必须复用该契约并回写 persisted reference

### 2. 为共�?helper 增加稳定导出

更新�?
- `packages/sdkwork-magic-studio-assets/src/choose-asset/index.ts`

落地方式�?
- 导出 `persistChooseAssetProjectReference(...)`
- 供真实业务消费方在本地上传路径中复用共享主干，而不是重新发明资产治理逻辑

### 3. �?`ImageLeftGeneratorPanel` 两条资产路径补齐项目�?persisted reference

更新�?
- `packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx`

落地方式�?
- 定义�?
```ts
const IMAGE_REFERENCE_PROJECT_REFERENCE = {
  slot: 'image-reference-images',
  metadata: {
    source: 'image-left-generator-panel',
  },
} satisfies ChooseAssetProjectReference;
```

- 本地上传完成后执行：

```ts
await persistChooseAssetProjectReference({
  uploaded,
  resolvedUrl,
  fallbackType: 'image',
  domain: 'image-studio',
  projectReference: IMAGE_REFERENCE_PROJECT_REFERENCE,
});
```

- `ChooseAssetModal` 入口显式传入�?
```tsx
projectReference={IMAGE_REFERENCE_PROJECT_REFERENCE}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
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
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `11 files, 11 tests passed`

### 4. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx packages/sdkwork-magic-studio-assets/src/choose-asset/index.ts
```

结果�?
- `PASS`

## 检查点评估

### CP03-48 `ImageLeftGeneratorPanel` 是否已显式声明统一项目引用契约

- 结论：`PASS`
- 证据�?  - `IMAGE_REFERENCE_PROJECT_REFERENCE` 已落�?  - `slot: 'image-reference-images'`
  - `source: 'image-left-generator-panel'`

### CP03-49 模态选择和本地上传是否复用同一�?persisted reference 契约

- 结论：`PASS`
- 证据�?  - `ChooseAssetModal` 使用 `projectReference={IMAGE_REFERENCE_PROJECT_REFERENCE}`
  - 本地上传调用 `persistChooseAssetProjectReference(...)`
  - `projectReference: IMAGE_REFERENCE_PROJECT_REFERENCE`

### CP03-50 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 图像面板已收口，�?`AudioLeftGeneratorPanel` 等剩余消费方仍未完成

### CP03-51 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - `AudioLeftGeneratorPanel` 仍未完成项目级引用收�?  - voicespeaker / character 的现有类型依赖解析阻塞仍未解�?  - 未执行全�?`test / typecheck / build`

## 现存风险 / Blocker

- `AudioLeftGeneratorPanel` 仍未完成模态与本地上传双路径收�?- voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 现有解析阻塞仍未解除
- 更大范围环境噪音 `EPERM` / `indexedDB is not defined` 仍需要独立治�?
## 下一轮建�?
1. 继续停留�?`Step 03`，优先处�?`AudioLeftGeneratorPanel`�?2. 为音频源输入补齐统一契约�?   - `audio-source-audio`
   - `audio-left-generator-panel`
3. 保持同样闭环�?   - boundary RED
   - 最�?GREEN
   - 资产主干回归
   - 跨包 boundary 回归
   - 定向 typecheck
