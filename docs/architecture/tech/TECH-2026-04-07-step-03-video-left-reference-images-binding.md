> Migrated from `docs/review/2026-04-07-step-03-video-left-reference-images-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 VideoLeftGeneratorPanel reference images binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十七轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在 `VoiceLeftGeneratorPanel` 已经完成消费方收口之后，继续处理视频左侧生成面板。本轮选定目标�?
- `packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx`

目标是把视频左侧生成面板中的参考图片模态入口纳入项目级 persisted reference 主干，确保视频生成链路中的关键参考素材能够被项目治理、删除保护和审计链路稳定识别�?
## 根因结论

本轮审计确认�?
1. `VideoLeftGeneratorPanel.tsx`
   - 存在一个真�?`ChooseAssetModal` 消费入口
   - 该入口承�?`referenceImages` 的资产库选择
   - 当前没有声明 `projectReference`
2. 视频场景中的参考图片属于高价值输入资�?   - 会直接影响生成质量与复现�?   - 但如果缺少稳�?`slot / source`，共享主干无法识别其业务语义
3. 因此当前真实业务事实是：
   - 用户可以从资产库选择视频参考图�?   - 但项目级 persisted reference 无法把这些引用稳定登记为“视频左侧生成面板参考图片�?
## 设计约束

- 不在 `VideoLeftGeneratorPanel` 中新�?asset-center 直连逻辑
- 必须继续复用 `ChooseAssetModal.projectReference`
- 槽位命名必须稳定、语义清晰、可审计�?  - `video-reference-images`
- source metadata 必须稳定�?  - `video-left-generator-panel`
- 本轮只关闭参考图片模态入口，不扩大到其他视频输入槽位

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `VideoLeftGeneratorPanel.tsx` 不包�?`projectReference={{`
  - 不包�?`slot: 'video-reference-images'`
  - 不包�?`source: 'video-left-generator-panel'`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts`

边界约束�?
- 参考图片模态入口必须显式声�?`projectReference`
- 必须使用稳定 slot�?  - `video-reference-images`
- 必须带稳�?source metadata�?  - `video-left-generator-panel`

### 2. �?`VideoLeftGeneratorPanel` 模态入口补齐项目级 persisted reference 元数�?
更新�?
- `packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'video-reference-images',
  metadata: {
    source: 'video-left-generator-panel',
  },
}}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
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
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `10 files, 10 tests passed`

### 4. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx
```

结果�?
- `PASS`

## 检查点评估

### CP03-44 `VideoLeftGeneratorPanel` 是否已显式声明项目级 persisted reference 语义

- 结论：`PASS`
- 证据�?  - `VideoLeftGeneratorPanel.tsx` 已为参考图�?`ChooseAssetModal` 入口传入 `projectReference`
  - `VideoLeftGeneratorPanel.boundary.test.ts` 已通过

### CP03-45 `VideoLeftGeneratorPanel` 槽位命名是否稳定且可审计

- 结论：`PASS`
- 证据�?  - `slot: 'video-reference-images'`
  - `source: 'video-left-generator-panel'`

### CP03-46 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 本轮只关闭了 `VideoLeftGeneratorPanel` 的参考图片模态入�?  - `ImageLeftGeneratorPanel`、`AudioLeftGeneratorPanel` 等核心消费方仍未收口

### CP03-47 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - 第一批核�?`ChooseAssetModal` 消费方仍未全部收�?  - voicespeaker / character 的现有类型依赖解析阻塞仍未解�?  - 未执行全�?`test / typecheck / build`

## 现存风险 / Blocker

- `ImageLeftGeneratorPanel` �?`AudioLeftGeneratorPanel` 仍未完成项目级引用收�?- voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 现有解析阻塞仍未解除
- 更大范围环境噪音 `EPERM` / `indexedDB is not defined` 仍需要独立治�?
## 下一轮建�?
1. 继续停留�?`Step 03`，优先处�?`ImageLeftGeneratorPanel`�?2. 为参考图片模态入口补齐稳定槽位：
   - `image-reference-images`
   - `image-left-generator-panel`
3. 保持相同闭环�?   - boundary RED
   - 最�?GREEN
   - 资产主干回归
   - 跨包 boundary 回归
   - 定向 typecheck

