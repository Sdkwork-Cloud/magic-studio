> Migrated from `docs/review/2026-04-07-step-03-voice-left-reference-audio-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 VoiceLeftGeneratorPanel reference audio binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十六轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在 `ChooseAssetModal` 主干已经具备 `projectReference` 透传与持久化能力之后，开始收口第一批核心消费方。本轮选定目标�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx`

目标是把声音左侧生成面板中的参考音频模态入口纳入项目级 persisted reference 主干，确保声音克隆链路中的关键输入资产能够被项目治理、删除保护和审计链路识别�?
## 根因结论

本轮审计确认�?
1. `VoiceLeftGeneratorPanel.tsx`
   - 已通过 `ChooseAssetModal` 让用户从资产库中选择参考音�?   - 但当前模态入口没有传�?`projectReference`
2. `ChooseAssetModal` 主干虽然已经在上一轮具�?persisted reference 能力
   - 但如果消费方不显式声明稳定的 `slot / source`
   - 资产主干无法区分该引用属于哪条业务输入链�?3. 因此当前真实业务事实是：
   - 用户可以�?`VoiceLeftGeneratorPanel` 中完成参考音频选择
   - 但项目级 persisted reference 无法把这条引用稳定登记到“声音左侧生成面板参考音频”这个业务槽�?
## 设计约束

- 不在 `VoiceLeftGeneratorPanel` 内新�?asset-center 直连逻辑
- 必须复用已经打通的 `ChooseAssetModal.projectReference`
- 槽位命名必须稳定、语义清晰、可审计�?  - `voice-left-reference-audio`
- source metadata 必须稳定�?  - `voice-left-generator-panel`
- 本轮只关闭参考音频模态入口，不扩大到其他 voicespeaker 输入链路

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `VoiceLeftGeneratorPanel.tsx` 不包�?`projectReference={{`
  - 不包�?`slot: 'voice-left-reference-audio'`
  - 不包�?`source: 'voice-left-generator-panel'`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts`

边界约束�?
- 参考音频模态入口必须显式声�?`projectReference`
- 必须使用稳定 slot�?  - `voice-left-reference-audio`
- 必须带稳�?source metadata�?  - `voice-left-generator-panel`

### 2. �?`VoiceLeftGeneratorPanel` 模态入口补齐项目级 persisted reference 元数�?
更新�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'voice-left-reference-audio',
  metadata: {
    source: 'voice-left-generator-panel',
  },
}}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
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
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `9 files, 9 tests passed`

### 4. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx
```

结果�?
- `FAIL`
- 阻塞点：
  - `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts(2,48): error TS2307: Cannot find module '@sdkwork/magic-studio-generation-history' or its corresponding type declarations.`

补充结论�?
- 阻塞来自 voicespeaker 现有类型依赖解析，不是本轮新增的 `projectReference` 绑定逻辑引入的回归�?
## 检查点评估

### CP03-40 `VoiceLeftGeneratorPanel` 是否已显式声明项目级 persisted reference 语义

- 结论：`PASS`
- 证据�?  - `VoiceLeftGeneratorPanel.tsx` 已为参考音�?`ChooseAssetModal` 入口传入 `projectReference`
  - `VoiceLeftGeneratorPanel.boundary.test.ts` 已通过

### CP03-41 `VoiceLeftGeneratorPanel` 槽位命名是否稳定且可审计

- 结论：`PASS`
- 证据�?  - `slot: 'voice-left-reference-audio'`
  - `source: 'voice-left-generator-panel'`

### CP03-42 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 本轮只关闭了 `VoiceLeftGeneratorPanel` 的参考音频模态入�?  - `VideoLeftGeneratorPanel`、`ImageLeftGeneratorPanel`、`AudioLeftGeneratorPanel` 等核心消费方仍未收口

### CP03-43 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - 第一批核�?`ChooseAssetModal` 消费方仍未全部收�?  - voicespeaker / character 的现有类型依赖解析阻塞仍未解�?  - 未执行全�?`test / typecheck / build`

## 现存风险 / Blocker

- `@sdkwork/magic-studio-generation-history` �?voicespeaker 定向 `tsc --ignoreConfig` 中仍无法解析
- 其余核心 `ChooseAssetModal` 消费方仍未收口：
  - `packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx`
- 更大范围环境噪音 `EPERM` / `indexedDB is not defined` 仍需要独立治理，但不属于本轮功能回归

## 下一轮建�?
1. 继续停留�?`Step 03`，优先处�?`VideoLeftGeneratorPanel`�?2. 直接为参考图片模态入口补齐稳定槽位：
   - `video-reference-images`
   - `video-left-generator-panel`
3. 保持同一节奏�?   - boundary RED
   - 最�?GREEN
   - 资产主干回归
   - 跨包 boundary 回归
   - 定向 typecheck

