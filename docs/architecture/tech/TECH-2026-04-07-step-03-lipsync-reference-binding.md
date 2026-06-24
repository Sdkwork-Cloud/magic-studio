> Migrated from `docs/review/2026-04-07-step-03-lipsync-reference-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 LipSync reference binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第十九轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在 `SubjectReferenceSection` �?`StartEndFramesSection` 已完�?project-level persisted reference 绑定之后，关�?`LipSyncSection` 的三个真实媒体输入槽位：

1. `source video`
2. `source image`
3. `driver audio`

本轮目标是证明这些输入入口此前仍然只是“可上传”，还没有进入项目级 persisted reference 主干，并以最小实现把它们收敛到统一 `ChooseAsset.projectReference` 协议�?
## 根因结论

本轮审计确认�?
1. `packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.tsx`
   - 包含三个真实 `ChooseAsset` 消费入口�?     - `Upload Source Video`
     - `Upload Portrait Image`
     - `Upload Audio Driver`
   - 三个入口都没有传�?`projectReference`
2. `packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`
   - 已稳定使用：
     - `source_video`
     - `source_image`
     - `driver_audio`
3. `packages/sdkwork-magic-studio-video/src/services/videoService.ts`
   - 已稳定映射：
     - `source-video`
     - `source-image`
     - `driver-audio`
4. 因此当前真实业务事实是：
   - Lip Sync 所需源视频、源人像、驱动音频可以上�?   - 但上传后没有被登记为项目�?persisted reference
   - 删除保护、资产审计、引用治理对这三条真实业务关系仍然失�?
## 设计约束

- 不在 `LipSyncSection` 中散�?asset-center 写逻辑
- 必须继续复用 `ChooseAsset.projectReference`
- slot 命名必须与现有视频主干语义对齐：
  - `source-video`
  - `source-image`
  - `driver-audio`
- source metadata 必须稳定可审计：
  - `lip-sync-section`
- 本轮只关�?`LipSyncSection`，不把范围扩散到其他视频面板

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `LipSyncSection.tsx` 不包�?`projectReference={{`
  - 也不存在 `slot: 'source-video'`
  - 也不存在 `slot: 'source-image'`
  - 也不存在 `slot: 'driver-audio'`

## 实施

### 1. 固化 `LipSyncSection` 消费方边�?
新增�?
- `packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts`

边界约束�?
- 源视频必须声�?`slot: 'source-video'`
- 源人像必须声�?`slot: 'source-image'`
- 驱动音频必须声明 `slot: 'driver-audio'`
- 三者都必须携带 `source: 'lip-sync-section'`

### 2. 为三个真实媒体槽位补齐项目级 persisted reference

更新�?
- `packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.tsx`

落地方式�?
- `Upload Source Video`
  - `projectReference.slot = 'source-video'`
- `Upload Portrait Image`
  - `projectReference.slot = 'source-image'`
- `Upload Audio Driver`
  - `projectReference.slot = 'driver-audio'`
- 三者统一�?  - `metadata.source = 'lip-sync-section'`

## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `1 file, 1 test passed`

### 2. 回归验证

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `7 files, 16 tests passed`

### 3. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.tsx
```

结果�?
- `PASS`

## 检查点评估

### CP03-11 `LipSyncSection` 是否已显式声明项目级 persisted reference 语义

- 结论：`PASS`
- 证据�?  - `LipSyncSection.tsx` 已向三个 `ChooseAsset` 传入 `projectReference`
  - `LipSyncSection.boundary.test.ts` 已通过

### CP03-12 三个媒体槽位是否与主干术语一�?
- 结论：`PASS`
- 证据�?  - `source-video`
  - `source-image`
  - `driver-audio`
  - 均与 `videoRequestBuilder.ts` / `videoService.ts` 语义对齐

### CP03-13 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 本轮只关闭了 `LipSyncSection`
  - 视频包里仍存�?`VideoPromptStyleSection` 的音�?`ChooseAsset`
  - 更广泛的 `ChooseAsset` 消费面仍未全量审�?
### CP03-14 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - 仍有真实 `ChooseAsset` 入口未纳�?persisted reference 主干
  - 未执行全�?`test / typecheck / build`
  - `Step 03` 仍处于持续收敛阶�?
## 现存风险 / Blocker

- `packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.tsx` 中的 `Optional Soundtrack` 仍未接入 persisted reference 主干
- 视频包之外的其他 `ChooseAsset` 消费面仍未做全量收口审计
- 本轮没有推进全仓验证，不能外推为仓库级完�?
## 下一轮建�?
1. 继续停留�?`Step 03`，优先处�?`VideoPromptStyleSection` 的音轨槽位�?2. 为音�?`ChooseAsset` 分配稳定 slot，并继续沿用共享 `projectReference` 协议�?3. 完成视频包内最后一个真�?`ChooseAsset` 消费点后，再决定是扩展到其他包还是重新评�?`Step 03` 状态�?
