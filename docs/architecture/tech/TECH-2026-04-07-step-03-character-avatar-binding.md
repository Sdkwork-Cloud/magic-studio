> Migrated from `docs/review/2026-04-07-step-03-character-avatar-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 Character avatar binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十二轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在 voicespeaker 人设头像已经接入项目�?persisted reference 之后，继续向角色业务扩展。本轮选定目标�?
- `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`

目标是把角色创作面板中的 `Character Image` 输入从“可上传”收敛到“可治理、可审计、可保护”的项目�?persisted reference 主干�?
## 根因结论

本轮审计确认�?
1. `CharacterLeftGeneratorPanel.tsx`
   - 存在一个真�?`ChooseAsset` 消费入口�?     - `Character Image`
   - 当前只传入：
     - `value`
     - `onChange`
     - `accepts`
     - `domain`
   - 没有传入 `projectReference`
2. 角色侧主干语义已经稳定使用：
   - `avatarImage`
   - `toCharacterAvatarAssetFields(...)`
   - `toCharacterAvatarChooseAssetValue(...)`
   - `domain="character"`
3. 因此当前真实业务事实是：
   - 角色头像可以上传�?AI 生成
   - 但上传后的资产没有登记为当前项目�?persisted reference
   - 删除保护、资产审计、项目级引用治理仍然看不到这条角色头像关�?
## 设计约束

- 不在 `CharacterLeftGeneratorPanel` 中散�?asset-center 逻辑
- 必须继续复用 `ChooseAsset.projectReference`
- slot 命名必须与角色头像语义一致，并与其他头像场景区分�?  - `character-avatar`
- source metadata 必须稳定可审计：
  - `character-left-generator-panel`
- 本轮只关闭角色头像入口，不扩大到更多角色链路

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `CharacterLeftGeneratorPanel.tsx` 不包�?`projectReference={{`
  - 不包�?`slot: 'character-avatar'`
  - 不包�?`source: 'character-left-generator-panel'`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`

边界约束�?
- `Character Image` 输入必须声明 `projectReference`
- 必须使用稳定 slot�?  - `character-avatar`
- 必须带稳�?source metadata�?  - `character-left-generator-panel`

### 2. 为角色头像槽位补齐项目级 persisted reference

更新�?
- `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'character-avatar',
  metadata: {
    source: 'character-left-generator-panel',
  },
}}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
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
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果 B�?
- `6 files, 6 tests passed`

### 3. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx
```

结果�?
- `FAIL`
- 阻塞点：
  - `TS2307: Cannot find module '@sdkwork/magic-studio-generation-history'`
  - 同时链路上还牵出 `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx` 的同类依赖解析问�?
补充结论�?
- 阻塞来自当前 character / voicespeaker 的现有类型依赖解析链，而不是本轮新增的 `projectReference` 绑定逻辑本身�?
## 检查点评估

### CP03-23 `CharacterLeftGeneratorPanel` 是否已显式声明项目级 persisted reference 语义

- 结论：`PASS`
- 证据�?  - `CharacterLeftGeneratorPanel.tsx` 已传�?`projectReference`
  - `CharacterLeftGeneratorPanel.boundary.test.ts` 已通过

### CP03-24 角色头像槽位是否使用了稳定且可区分的 slot

- 结论：`PASS`
- 证据�?  - `slot: 'character-avatar'`
  - �?`persona-avatar` 等其他头像槽位保持清晰区�?
### CP03-25 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 只关闭了角色头像入口
  - `MusicLeftGeneratorPanel`
  - `VoiceLabModal`
  - 以及更广泛的 `ChooseAssetModal` 消费面仍未收�?
### CP03-26 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - 仓库�?`ChooseAsset` / `ChooseAssetModal` 消费面仍未全量收�?  - character / voicespeaker 现有类型依赖解析阻塞仍未解除
  - 未执行全�?`test / typecheck / build`

## 现存风险 / Blocker

- `@sdkwork/magic-studio-generation-history` 在当前定�?`tsc --ignoreConfig` 中仍无法解析，影�?character / voicespeaker 的局部类型验�?- 仓库中仍存在其他直接 `ChooseAsset` 消费点：
  - `packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`
- `ChooseAssetModal` 系列消费面仍未纳�?persisted reference 审计

## 下一轮建�?
1. 继续停留�?`Step 03`，优先处�?`MusicLeftGeneratorPanel` �?`sourceMusic` 入口�?2. 随后再处�?`VoiceLabModal`�?3. �?`@sdkwork/magic-studio-generation-history` 的类型解析问题单独登记为并行治理 lane，不阻塞 `projectReference` 主干收口�?
