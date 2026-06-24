> Migrated from `docs/review/2026-04-07-step-03-audio-left-source-audio-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 AudioLeftGeneratorPanel source audio binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十九轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在图像左侧生成面板已经完成双路径收口之后，继续处理音频左侧生成面板。本轮选定目标�?
- `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx`

目标是把音频左侧生成面板中的两条真实源音频输入路径一起纳入项目级 persisted reference 主干�?
- 资产库源音频选择
- 本地源音频上�?
## 根因结论

本轮审计确认�?
1. `AudioLeftGeneratorPanel.tsx`
   - 存在一�?`ChooseAssetModal` 入口用于源音频资产选择
   - 该入口当前未声明 `projectReference`
2. 同一组件还存在本地上传链路：
   - `handleSourceAudioUpload(...)` 直接调用 `importAssetBySdk(...)`
   - 上传完成后只执行 `bindSourceAudio(...)`
   - 没有进入项目�?persisted reference 主干
3. 因此当前真实业务事实是：
   - 用户可以用库内音频或本地文件驱动 transcription / translation
   - 但项目级资产治理无法稳定识别这两条路径都属于“音频左侧生成面板源音频”业务槽�?
## 设计约束

- 不在 `AudioLeftGeneratorPanel` 中散�?asset-center 直连实现
- 必须复用共享 helper `persistChooseAssetProjectReference(...)`
- 模态选择和本地上传必须复用同一份稳定的项目引用契约
- 槽位命名必须稳定、语义清晰、可审计�?  - `audio-source-audio`
- source metadata 必须稳定�?  - `audio-left-generator-panel`

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `AudioLeftGeneratorPanel.tsx` 不包�?`AUDIO_SOURCE_PROJECT_REFERENCE`
  - 不包�?`slot: 'audio-source-audio'`
  - 不包�?`source: 'audio-left-generator-panel'`
  - 不包�?`projectReference={AUDIO_SOURCE_PROJECT_REFERENCE}`
  - 不包�?`persistChooseAssetProjectReference({`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.boundary.test.ts`

边界约束�?
- 必须定义统一项目引用契约 `AUDIO_SOURCE_PROJECT_REFERENCE`
- 模态选择必须复用该契�?- 本地上传必须复用该契约并回写 persisted reference

### 2. �?`AudioLeftGeneratorPanel` 两条源音频路径补齐项目级 persisted reference

更新�?
- `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx`

落地方式�?
- 定义�?
```ts
const AUDIO_SOURCE_PROJECT_REFERENCE = {
  slot: 'audio-source-audio',
  metadata: {
    source: 'audio-left-generator-panel',
  },
} satisfies ChooseAssetProjectReference;
```

- 本地上传完成后执行：

```ts
await persistChooseAssetProjectReference({
  uploaded: imported,
  resolvedUrl,
  fallbackType: 'audio',
  domain: 'audio-studio',
  projectReference: AUDIO_SOURCE_PROJECT_REFERENCE,
});
```

- `ChooseAssetModal` 入口显式传入�?
```tsx
projectReference={AUDIO_SOURCE_PROJECT_REFERENCE}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
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
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `12 files, 12 tests passed`

### 4. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx packages/sdkwork-magic-studio-assets/src/choose-asset/index.ts
```

结果�?
- `PASS`

## 检查点评估

### CP03-52 `AudioLeftGeneratorPanel` 是否已显式声明统一项目引用契约

- 结论：`PASS`
- 证据�?  - `AUDIO_SOURCE_PROJECT_REFERENCE` 已落�?  - `slot: 'audio-source-audio'`
  - `source: 'audio-left-generator-panel'`

### CP03-53 模态选择和本地上传是否复用同一�?persisted reference 契约

- 结论：`PASS`
- 证据�?  - `ChooseAssetModal` 使用 `projectReference={AUDIO_SOURCE_PROJECT_REFERENCE}`
  - 本地上传调用 `persistChooseAssetProjectReference(...)`
  - `projectReference: AUDIO_SOURCE_PROJECT_REFERENCE`

### CP03-54 第一批核�?`ChooseAssetModal` 消费方是否已全部完成收口

- 结论：`PASS`
- 证据�?  - `VoiceLeftGeneratorPanel`
  - `VideoLeftGeneratorPanel`
  - `ImageLeftGeneratorPanel`
  - `AudioLeftGeneratorPanel`
  - 上述入口均已具备稳定项目�?persisted reference 语义

### CP03-55 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - voicespeaker / character 的现有类型依赖解析阻塞仍未解�?  - 未执行全�?`test / typecheck / build`
  - 更大范围环境噪音治理尚未完成

## 现存风险 / Blocker

- voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 现有解析阻塞仍未解除
- 更大范围环境噪音 `EPERM` / `indexedDB is not defined` 仍需要独立治�?- 仍需把“第一批消费方完成收口”的结果体现在下一阶段更大范围验证�?stage gate 审计�?
## 下一轮建�?
1. 继续停留�?`Step 03`，优先转向阻塞项与更大范围验证�?2. 建议按顺序推进：
   - `@sdkwork/magic-studio-generation-history` 解析阻塞治理
   - 更大范围 `test / typecheck / build` 审计
   - 环境噪音 `EPERM` / `indexedDB` 治理
3. 保持相同闭环�?   - RED
   - GREEN
   - 回归
   - typecheck
   - review / release / changelog

