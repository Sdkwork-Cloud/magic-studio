> Migrated from `docs/review/2026-04-07-step-03-video-prompt-style-soundtrack-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 VideoPromptStyle soundtrack binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第二十轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在视频模式中已经完成：

1. `SubjectReferenceSection`
2. `StartEndFramesSection`
3. `LipSyncSection`

这三类真�?`ChooseAsset` 入口收敛之后，继续关闭视频包里剩余的直接 `ChooseAsset` 消费点：

- `packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.tsx`
  - `Optional Soundtrack`

目标是证明这个音轨槽位此前仍然只是“可上传”，还没有进入项目级 persisted reference 主干，并以最小实现把它纳入统一 `ChooseAsset.projectReference` 协议�?
## 根因结论

本轮审计确认�?
1. `packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.tsx`
   - �?`Advanced Settings` 中包含一个真实音�?`ChooseAsset`
   - 当前只传入：
     - `value`
     - `onChange`
     - `accepts`
     - `domain`
   - 没有传入 `projectReference`
2. `packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`
   - 已稳定使�?`audio_track`
3. 因此当前真实业务事实是：
   - 可选音轨素材可以上�?   - 但上传后没有登记为当前项目的 persisted reference
   - 音轨素材仍然在项目级资产治理、删除保护、引用审计之�?
## 设计约束

- 不在 `VideoPromptStyleSection` 中散�?asset-center 逻辑
- 继续复用 `ChooseAsset.projectReference`
- slot 命名与视频请求主干对齐：
  - `audio-track`
- source metadata 保持稳定可审计：
  - `video-prompt-style-section`
- 本轮目标是关闭视频包里最后一个直�?`ChooseAsset` 消费点，不扩大到 `ChooseAssetModal`

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `VideoPromptStyleSection.tsx` 不包�?`projectReference={{`
  - 不包�?`slot: 'audio-track'`
  - 不包�?`source: 'video-prompt-style-section'`

## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts`

边界约束�?
- `Optional Soundtrack` 必须声明 `projectReference`
- 必须使用稳定 slot�?  - `audio-track`
- 必须带稳�?source metadata�?  - `video-prompt-style-section`

### 2. 为音轨槽位补齐项目级 persisted reference

更新�?
- `packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'audio-track',
  metadata: {
    source: 'video-prompt-style-section',
  },
}}
```

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `1 file, 1 test passed`

### 2. 回归验证

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `8 files, 17 tests passed`

### 3. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.tsx packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.tsx
```

结果�?
- `PASS`

## 检查点评估

### CP03-15 `VideoPromptStyleSection` 的音轨输入是否已显式声明项目�?persisted reference 语义

- 结论：`PASS`
- 证据�?  - `VideoPromptStyleSection.tsx` 已传�?`projectReference`
  - `VideoPromptStyleSection.boundary.test.ts` 已通过

### CP03-16 视频包内直接 `ChooseAsset` 消费面是否已经完成本轮收�?
- 结论：`PASS`
- 证据�?  - 当前 `sdkwork-magic-studio-video` 内直�?`ChooseAsset` 导入点已覆盖�?    - `SubjectReferenceSection`
    - `StartEndFramesSection`
    - `LipSyncSection`
    - `VideoPromptStyleSection`

### CP03-17 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 视频包内直接 `ChooseAsset` 入口虽然已经闭环
  - 但仓库中仍存在其他直�?`ChooseAsset` 消费点：
    - `sdkwork-magic-studio-music`
    - `sdkwork-magic-studio-character`
    - `sdkwork-magic-studio-voicespeaker`
  - `ChooseAssetModal` 相关路径也尚未纳入本轮收�?
### CP03-18 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - 仓库�?`ChooseAsset` 消费面仍未全量收�?  - 未执行全�?`test / typecheck / build`
  - `Step 03` 仍处于持续收敛阶�?
## 现存风险 / Blocker

- 仓库中仍存在其他直接 `ChooseAsset` 消费点：
  - `packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`
  - `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.tsx`
  - `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`
- `ChooseAssetModal` 系列消费面仍未按 persisted reference 语义审计
- 本轮仍未推进全仓验证，不能外推为仓库级完�?
## 下一轮建�?
1. 继续停留�?`Step 03`，开始扩展到视频包外的直�?`ChooseAsset` 消费点�?2. 优先级建议：
   - `VoicePersonaSection`
   - `CharacterLeftGeneratorPanel`
   - `MusicLeftGeneratorPanel`
3. �?`ChooseAssetModal` 作为单独 lane 处理，避免把“直�?`ChooseAsset` 消费面收口”和“模态资源选择器治理”混成一个假完成结论�?
