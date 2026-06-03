# 2026-04-07 Step 03 Music source binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十三轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在角色头像入口已经接入项目�?persisted reference 之后，继续向音乐业务扩展。本轮选定目标�?
- `packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx`

目标是把音乐创作面板中的 `Source Music` 输入从“可上传 / 可选择”收敛到“可治理、可审计、可保护”的项目�?persisted reference 主干�?
## 根因结论

本轮审计确认�?
1. `MusicLeftGeneratorPanel.tsx`
   - 存在一个真�?`ChooseAsset` 消费入口�?     - `Source Music`
   - 当前只传入：
     - `value`
     - `onChange`
     - `accepts`
     - `domain`
     - `label`
     - `aspectRatio`
   - 没有传入 `projectReference`
2. 音乐侧真实业务语义已经稳定使用：
   - `config.sourceMusic`
   - `handleSourceMusicChange(...)`
   - `toGeneratedMusicResultFromAsset(...)`
   - `domain="music"`
3. 因此当前真实业务事实是：
   - 音乐来源素材可以被上传或选择
   - 但上传后的资产没有登记为当前项目�?persisted reference
   - 删除保护、资产审计、项目级引用治理仍然看不到这条音乐来源关�?
## 设计约束

- 不在 `MusicLeftGeneratorPanel` 中散�?asset-center 逻辑
- 必须继续复用 `ChooseAsset.projectReference`
- slot 命名必须与音乐来源语义一致，并与视频音轨等场景区分：
  - `source-music`
- source metadata 必须稳定可审计：
  - `music-left-generator-panel`
- 本轮只关闭音乐来源入口，不扩大到 `VoiceLabModal` 或更广泛的模态入�?
## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `MusicLeftGeneratorPanel.tsx` 不包�?`projectReference={{`
  - 不包�?`slot: 'source-music'`
  - 不包�?`source: 'music-left-generator-panel'`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts`

边界约束�?
- `Source Music` 输入必须声明 `projectReference`
- 必须使用稳定 slot�?  - `source-music`
- 必须带稳�?source metadata�?  - `music-left-generator-panel`

### 2. 为音乐来源槽位补齐项目级 persisted reference

更新�?
- `packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'source-music',
  metadata: {
    source: 'music-left-generator-panel',
  },
}}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
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
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果 B�?
- `7 files, 7 tests passed`

### 3. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx
```

结果�?
- `PASS`

补充结论�?
- `MusicLeftGeneratorPanel` 本轮新增�?`projectReference` 绑定没有引入新的类型阻塞�?
## 检查点评估

### CP03-27 `MusicLeftGeneratorPanel` 是否已显式声明项目级 persisted reference 语义

- 结论：`PASS`
- 证据�?  - `MusicLeftGeneratorPanel.tsx` 已传�?`projectReference`
  - `MusicLeftGeneratorPanel.boundary.test.ts` 已通过

### CP03-28 音乐来源槽位是否使用了稳定且可区分的 slot

- 结论：`PASS`
- 证据�?  - `slot: 'source-music'`
  - 与视频的 `audio-track`、头像槽位等保持清晰区分

### CP03-29 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 只关闭了音乐来源入口
  - `VoiceLabModal`
  - 以及更广泛的 `ChooseAssetModal` 消费面仍未收�?
### CP03-30 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - `VoiceLabModal` �?`ChooseAssetModal` 仍未全量收口
  - character / voicespeaker 现有类型依赖解析阻塞仍未解除
  - 未执行全�?`test / typecheck / build`

## 现存风险 / Blocker

- `VoiceLabModal` 仍包含未收口�?`ChooseAsset` 入口，是 `Step 03` 的下一高价值缺�?- `ChooseAssetModal` 系列消费面仍未纳�?persisted reference 审计
- `@sdkwork/magic-studio-generation-history` �?character / voicespeaker 的定�?`tsc --ignoreConfig` 中仍无法解析，但本轮音乐面板未受该问题影�?
## 下一轮建�?
1. 继续停留�?`Step 03`，优先处�?`VoiceLabModal` 的多�?`ChooseAsset` 入口�?2. 先做 `VoiceLabModal` 的槽位语义审计，再按 TDD 分拆成最小闭环�?3. �?`ChooseAssetModal` 审计�?`@sdkwork/magic-studio-generation-history` 类型阻塞继续作为并行治理 lane 记录，不误报为本轮完成�?