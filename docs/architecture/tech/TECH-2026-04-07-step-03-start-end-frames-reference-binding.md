> Migrated from `docs/review/2026-04-07-step-03-start-end-frames-reference-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 StartEndFrames reference binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第十八轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在 `ChooseAsset` 已具备可�?`projectReference` 能力、且 `SubjectReferenceSection` 已经接入 project-level persisted reference 的基础上，关闭第二个真实视频入口：

1. 审计 `packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx` 的两个图片槽位�?2. 证明 `Start Frame / End Frame` 仍然只是“上传成功”，还没有显式进入项目级 persisted reference 主干�?3. 使用已经收敛好的 `projectReference` 协议，为两个槽位补齐稳定 slot �?source metadata�?4. 保持 `Step 03` 未结束结论，明确 `LipSyncSection` 仍是下一轮优先目标�?
## 根因结论

本轮审计确认�?
1. `packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx`
   - 包含两个真实 `ChooseAsset` 消费入口�?     - `Start Image`
     - `End Image`
   - 两个入口都只传入�?     - `value`
     - `onChange`
     - `accepts`
     - `domain`
   - 两个入口都没有传�?`projectReference`
2. `packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`
   - 已稳定使�?`start_frame` / `end_frame` 语义
3. `packages/sdkwork-magic-studio-video/src/services/videoService.ts`
   - 已稳定映�?`start-frame` / `end-frame` 输入角色
4. 因此当前真实业务事实是：
   - 起始帧、结束帧素材可以上传
   - 但上传后的资产没有被登记为当前项目的 persisted reference
   - 删除保护、资产审计、项目级引用治理仍然看不到这两条真实视频业务关系

## 设计约束

- 不在 `StartEndFramesSection` 中散�?asset-center 逻辑
- 不重复发明新�?persisted reference 协议，必须复�?`ChooseAsset.projectReference`
- 槽位命名必须与视频请求主干语义对齐：
  - `start-frame`
  - `end-frame`
- source metadata 需要稳定、可审计�?  - `start-end-frames-section`
- 本轮只关�?`StartEndFramesSection`，不顺手扩大�?`LipSyncSection`

## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `1 test | 1 failed`
- 失败点：
  - `StartEndFramesSection.tsx` 不包�?`projectReference={{`
  - 也不存在 `slot: 'start-frame'`
  - 也不存在 `slot: 'end-frame'`

这说明缺口是真实存在的，而不是沿用上一轮实现的想当然外推�?
## 实施

### 1. 固化消费方边�?
新增�?
- `packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts`

约束内容�?
- `StartEndFramesSection` 必须声明 `projectReference`
- 起始帧必须绑�?`slot: 'start-frame'`
- 结束帧必须绑�?`slot: 'end-frame'`
- 两者都必须�?`source: 'start-end-frames-section'`

### 2. 为两个真实槽位补�?project-level persisted reference

更新�?
- `packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'start-frame',
  metadata: {
    source: 'start-end-frames-section',
  },
}}
```

以及�?
```ts
projectReference={{
  slot: 'end-frame',
  metadata: {
    source: 'start-end-frames-section',
  },
}}
```

实现效果�?
- `Start Image` 上传后的素材进入 `start-frame` persisted reference 语义
- `End Image` 上传后的素材进入 `end-frame` persisted reference 语义
- 语义与现有视频请求构建链保持一�?
## GREEN / 验证结果

### 1. 新增边界测试 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `1 file, 1 test passed`

### 2. 回归验证

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `6 files, 15 tests passed`

### 3. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx
```

结果�?
- `PASS`

## 检查点评估

### CP03-6 `StartEndFramesSection` 是否已显式声明项目级 persisted reference 语义

- 结论：`PASS`
- 证据�?  - `StartEndFramesSection.tsx` 已向两个 `ChooseAsset` 传入 `projectReference`
  - `StartEndFramesSection.boundary.test.ts` 已通过

### CP03-7 起始帧槽位是否使用与主干一致的稳定 slot

- 结论：`PASS`
- 证据�?  - `slot: 'start-frame'`
  - `videoRequestBuilder.ts` / `videoService.ts` 已存在对应语义映�?
### CP03-8 结束帧槽位是否使用与主干一致的稳定 slot

- 结论：`PASS`
- 证据�?  - `slot: 'end-frame'`
  - `videoRequestBuilder.ts` / `videoService.ts` 已存在对应语义映�?
### CP03-9 本轮是否错误宣称 `Step 03` 已完�?
- 结论：`NO`
- 说明�?  - 本轮只关闭了 `StartEndFramesSection`
  - `LipSyncSection` 仍然是最优先的下一个真实入�?  - 其他 `ChooseAsset` 消费方仍可能存在相同盲区

### CP03-10 本轮是否具备升级�?`alpha` 的条�?
- 结论：`NO`
- 原因�?  - `ChooseAsset` 全量消费面仍未收�?  - 本轮未执行全�?`test / typecheck / build`
  - `Step 03` 仍处于持续收敛阶�?
## 现存风险 / Blocker

- `LipSyncSection` 仍存在多个真实媒体槽位未接入 persisted reference 主干�?  - `source video`
  - `source image`
  - `driver audio`
- 本轮�?`StartEndFramesSection` 采用的是 source boundary 证据，而不是完整消费方运行时渲染验�?- 本轮没有推进全仓验证，不能外推为仓库级通过

## 下一轮建�?
1. 继续停留�?`Step 03`，优先审计并打�?`LipSyncSection`�?2. �?`LipSyncSection` 中的三个真实媒体槽位分配稳定 slot�?   - `source-video`
   - `source-image`
   - `driver-audio`
3. 保持 `ChooseAsset` �?persisted reference 逻辑继续收敛在共�?helper，不要把资产中心逻辑散落回视�?UI 消费层�?
