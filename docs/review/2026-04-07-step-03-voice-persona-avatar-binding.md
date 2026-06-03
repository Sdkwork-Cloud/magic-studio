# 2026-04-07 Step 03 VoicePersona avatar binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十一轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在视频包内直接 `ChooseAsset` 消费面阶段性收口之后，开始扩展到视频包外的真�?`ChooseAsset` 消费点。本轮选定的目标是�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.tsx`

目标是把 `VoicePersonaSection` 的人设头像输入从“可上传”收敛到“可治理、可审计、可保护”的项目�?persisted reference 主干�?
## 根因结论

本轮审计确认�?
1. `VoicePersonaSection.tsx`
   - 只有一个真�?`ChooseAsset` 消费入口
   - 语义明确�?     - `Avatar`
     - `domain="voice-speaker"`
   - 只传入：
     - `value`
     - `onChange`
     - `accepts`
     - `domain`
   - 没有传入 `projectReference`
2. voicespeaker 侧主干语义已经稳定使用：
   - `avatarUrl`
   - `persona`
   - `voice-speaker`
3. 因此当前真实业务事实是：
   - 声音人格头像可以上传
   - 但上传后没有登记为当前项目的 persisted reference
   - 项目级资产治理、删除保护、引用审计仍然看不到这条头像输入关系

## 设计约束

- 不在 `VoicePersonaSection` 中散�?asset-center 逻辑
- 必须继续复用 `ChooseAsset.projectReference`
- slot 语义必须和当前面板含义一致，并与其它包的头像槽位区分�?  - `persona-avatar`
- source metadata 必须稳定可审计：
  - `voice-persona-section`
- 本轮只关�?`VoicePersonaSection`，不扩大�?`VoiceLabModal`

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `VoicePersonaSection.tsx` 不包�?`projectReference={{`
  - 不包�?`slot: 'persona-avatar'`
  - 不包�?`source: 'voice-persona-section'`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts`

边界约束�?
- 头像输入必须声明 `projectReference`
- 必须使用稳定 slot�?  - `persona-avatar`
- 必须带稳�?source metadata�?  - `voice-persona-section`

### 2. 为头像槽位补齐项目级 persisted reference

更新�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'persona-avatar',
  metadata: {
    source: 'voice-persona-section',
  },
}}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
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
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果 B�?
- `5 files, 5 tests passed`

补充说明�?
- 原本尝试把上述测试并成一�?vitest 命令时，出现过一次沙箱路径解析波动，误报 `chooseAssetProjectReference.test.tsx` 找不到模块�?- 单独重跑 `chooseAssetProjectReference.test.tsx` 结果为：
  - `1 file, 2 tests passed`
- 因此本轮按分组回归方式保留稳定证据，不把沙箱路径波动误判成功能回归�?
### 3. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.tsx
```

结果�?
- `FAIL`
- 阻塞点：
  - `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts`
  - `TS2307: Cannot find module '@sdkwork/magic-studio-generation-history'`

补充确认�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts
```

结果同样失败，说明阻塞来�?voicespeaker 现有依赖解析链，而不是本轮新�?`projectReference` 绑定本身�?
## 检查点评估

### CP03-19 `VoicePersonaSection` 是否已显式声明项目级 persisted reference 语义

- 结论：`PASS`
- 证据�?  - `VoicePersonaSection.tsx` 已传�?`projectReference`
  - `VoicePersonaSection.boundary.test.ts` 已通过

### CP03-20 人设头像槽位是否使用了稳定且可区分的 slot

- 结论：`PASS`
- 证据�?  - `slot: 'persona-avatar'`
  - 与视频、角色、音乐等其他潜在头像/素材槽位不混�?
### CP03-21 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 只关闭了 voicespeaker 的一个真实入�?  - `CharacterLeftGeneratorPanel`
  - `MusicLeftGeneratorPanel`
  - `VoiceLabModal`
  - 以及更广泛的 `ChooseAssetModal` 消费面仍未收�?
### CP03-22 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - 仓库�?`ChooseAsset` 消费面仍未全量收�?  - voicespeaker 包存在现有类型依赖解析阻�?  - 未执行全�?`test / typecheck / build`

## 现存风险 / Blocker

- `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts` 当前存在现有依赖解析阻塞�?  - `@sdkwork/magic-studio-generation-history` 无法在当前定�?`tsc --ignoreConfig` 验证中解�?- 仓库中仍存在其他直接 `ChooseAsset` 消费点：
  - `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`
- `ChooseAssetModal` 系列消费面仍未纳�?persisted reference 审计

## 下一轮建�?
1. 继续停留�?`Step 03`，优先处�?`CharacterLeftGeneratorPanel`�?2. 随后处理 `MusicLeftGeneratorPanel` �?`sourceMusic` 入口�?3. �?voicespeaker 的类型依赖解析阻塞单独登记为并行 lane，不要把它和 `projectReference` 收口任务混成一个假 blocker�?