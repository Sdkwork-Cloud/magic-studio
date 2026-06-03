# 2026-04-07 Step 03 VoiceLabModal binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十四轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在音乐来源入口已经接入项目�?persisted reference 之后，继续向声音实验室扩展。本轮选定目标�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`

目标是把 `VoiceLabModal` 中两个真�?`ChooseAsset` 入口收敛到项目级 persisted reference 主干�?
- `Voice Avatar`
- `Clone Reference Audio` 的库内选择入口

## 根因结论

本轮审计确认�?
1. `VoiceLabModal.tsx`
   - 存在两个真实 `ChooseAsset` 消费入口�?     - 头像上传 / 资产选择
     - 克隆参考音频的库内选择
   - 两者当前只传入业务展示与选择参数，没有传�?`projectReference`
2. 这两个入口分别承载：
   - 声音人格封面资产
   - 克隆任务使用的参考音频资�?3. 因此当前真实业务事实是：
   - 这两条资产链路都可以被用户选择或上�?   - 但上传或选择后的资产没有登记为当前项目的 persisted reference
   - 删除保护、资产审计、项目级引用治理仍然看不�?`VoiceLab` 里的关键输入关系

## 设计约束

- 不在 `VoiceLabModal` 中散�?asset-center 逻辑
- 必须继续复用 `ChooseAsset.projectReference`
- 头像槽位要与其他头像场景区分�?  - `voice-lab-avatar`
- 参考音频槽位要与其他音频场景区分：
  - `voice-lab-reference-audio`
- source metadata 必须稳定可审计：
  - `voice-lab-modal`
- 本轮只关�?`VoiceLabModal` 的直�?`ChooseAsset` 入口，不扩大�?`ChooseAssetModal` 主干透传改�?
## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `VoiceLabModal.tsx` 不包�?`projectReference={{`
  - 不包�?`slot: 'voice-lab-avatar'`
  - 不包�?`slot: 'voice-lab-reference-audio'`
  - 不包�?`source: 'voice-lab-modal'`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts`

边界约束�?
- 头像资产入口必须声明 `projectReference`
- 参考音频资产入口必须声�?`projectReference`
- 必须使用稳定 slot�?  - `voice-lab-avatar`
  - `voice-lab-reference-audio`
- 必须带稳�?source metadata�?  - `voice-lab-modal`

### 2. �?`VoiceLabModal` 两个资产槽位补齐项目�?persisted reference

更新�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'voice-lab-avatar',
  metadata: {
    source: 'voice-lab-modal',
  },
}}
```

```ts
projectReference={{
  slot: 'voice-lab-reference-audio',
  metadata: {
    source: 'voice-lab-modal',
  },
}}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `1 file, 1 test passed`

### 2. 回归验证

命令 A�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果 A�?
- `4 files, 13 tests passed`

命令 B�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果 B�?
- `8 files, 8 tests passed`

### 3. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx
```

结果�?
- `FAIL`
- 阻塞点：
  - `TS2307: Cannot find module '@sdkwork/magic-studio-generation-history' or its corresponding type declarations.`

补充结论�?
- 阻塞来自 `VoiceLabModal.tsx` 现有类型依赖，而不是本轮新增的 `projectReference` 绑定逻辑�?
## 检查点评估

### CP03-31 `VoiceLabModal` 是否已显式声明项目级 persisted reference 语义

- 结论：`PASS`
- 证据�?  - `VoiceLabModal.tsx` 已为头像和参考音频入口传�?`projectReference`
  - `VoiceLabModal.boundary.test.ts` 已通过

### CP03-32 `VoiceLabModal` 槽位命名是否稳定且可区分

- 结论：`PASS`
- 证据�?  - `slot: 'voice-lab-avatar'`
  - `slot: 'voice-lab-reference-audio'`
  - �?`persona-avatar`、`character-avatar`、`source-music` 等场景保持清晰区�?
### CP03-33 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 只关闭了 `VoiceLabModal` 的直�?`ChooseAsset` 入口
  - `ChooseAssetModal` 主干透传与核心消费方仍未收口
  - 仓库中仍有多�?`ChooseAssetModal` 消费面未治理

### CP03-34 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - `ChooseAssetModal` 主干尚未纳入 persisted reference 透传
  - 多个核心消费方仍依赖 `ChooseAssetModal`
  - voicespeaker / character 的现有类型依赖解析阻塞仍未解�?  - 未执行全�?`test / typecheck / build`

## 现存风险 / Blocker

- `@sdkwork/magic-studio-generation-history` �?`VoiceLabModal.tsx` 的定�?`tsc --ignoreConfig` 中仍无法解析
- 仓库盘点显示多个 `ChooseAssetModal` 消费面仍未收口：
  - `packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx`
  - 以及 film / portal 等业务场�?- `ChooseAssetModal.types.ts` 当前未暴�?`projectReference`，说明下一阶段需要先补组件主干透传能力

## 下一轮建�?
1. 继续停留�?`Step 03`，优先处�?`ChooseAssetModal` 主干透传能力�?2. 先从 `ChooseAssetModal.types.ts` / `ChooseAsset.tsx` / `ChooseAssetModalContent.tsx` 补齐 `projectReference` 透传与持久化落点�?3. 然后优先收口核心左侧面板消费方：
   - `VoiceLeftGeneratorPanel`
   - `VideoLeftGeneratorPanel`
   - `ImageLeftGeneratorPanel`
   - `AudioLeftGeneratorPanel`
