> Migrated from `docs/review/2026-04-07-step-03-choose-asset-subject-reference-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 ChooseAsset subject reference binding

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第十七轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，保持停留在 `Step 03`，关�?`ChooseAsset` 在真实视频入口上“本地上传完�?SDK 导入、但没有登记 project-level persisted reference”的收敛缺口�?
本轮只做一个最小真实入口：

1. 选定 `packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx` 作为首个 `ChooseAsset` 消费方�?2. 证明 `ChooseAsset` 在本地上传后没有进入 asset-center persisted reference 主干�?3. 以最小契约让该真实入口完�?project-level persisted reference 注册/绑定�?4. 保持 `Step 03` 未完成结论，明确下一轮继续补 `StartEndFramesSection / LipSyncSection / 其他 ChooseAsset` 入口�?
## 根因结论

本轮审计后确认：

1. `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`
   - 本地上传路径只会执行�?     - `uploadHelper.pickFiles(...)`
     - `assetBusinessService.importAssetBySdk(...)`
     - `onChange(imported)`
   - 不会执行�?     - `assetCenterService.initialize()`
     - `assetCenterService.findById(...)`
     - `assetCenterService.bindReference(...)`
     - `assetCenterService.registerExistingAsset(...)`
2. `packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx`
   - 只把 `domain="video-studio"` 传给 `ChooseAsset`
   - 没有任何 project-level persisted reference 上下�?3. 因此当前真实业务表现是：
   - `SubjectReferenceSection` 的本地上传能落到 asset-center / 远端资产存储
   - 但资产没有登记为当前项目�?persisted reference
   - 删除前引用阻断与项目资产审计对这条业务路径仍然失�?
## 设计约束

- 不回退�?raw HTTP / package-local HTTP / broad app client
- 不在 `SubjectReferenceSection` 内散�?asset-center 写逻辑
- 不泛化成不受控的大接口，只补最�?`projectReference` 契约
- `ChooseAsset` 只有在显式传�?`projectReference` 时才进入 persisted reference 主干
- 本轮只关�?`SubjectReferenceSection` 一个真实入口，不虚�?`ChooseAsset` 全覆�?
## RED

先补失败测试，证明真实缺口存在�?
命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

RED 结果�?
- `packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx`
  - `2 tests | 2 failed`
  - 失败点：
    - `initialize` 没有被调�?    - `bindReference(...)` 没有被调�?- 同轮验证还暴露了一个测试基础设施事实�?  - `packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.test.tsx` 在当前定向配置下会触�?TSX import-analysis parse blocker
  - 因此消费方改�?source boundary 断言保存证据，运行时主行为仍�?`ChooseAsset` jsdom 测试承担

这说明缺口是真实存在的，不是文档猜测�?
## 实施

### 1. �?`ChooseAsset` 增加最�?`projectReference` 契约

新增�?
- `packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts`

设计收敛点：

- 契约只描�?project-level reference�?  - `projectId?`
  - `relation?`
  - `slot`
  - `metadata?`
- 作用域仍沿用现有 `domain`
- `projectId` 默认�?`readWorkspaceScope()` 读取
- `ChooseAsset` 本地上传后：
  - 先解�?`resolvedUrl`
  - �?asset 已在 asset-center 中存在，则执�?`bindReference(...)`
  - �?asset 尚未入索引，则执�?`registerExistingAsset(...)`

### 2. �?UI 组件只负责声明语义，不直接落资产中心逻辑

更新�?
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`

实现方式�?
- 新增可�?prop：`projectReference?: ChooseAssetProjectReference`
- 本地上传成功后调�?`persistChooseAssetProjectReference(...)`
- UI 组件仍只负责上传交互；persisted reference 写回逻辑收敛到私�?helper

### 3. 选定一个真实消费方完成闭环

更新�?
- `packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx`

落地方式�?
```ts
projectReference={{
  slot: 'subject-reference',
  metadata: {
    source: 'subject-reference-section',
  },
}}
```

这让视频主体参考图首次具备明确�?project-level reference 语义�?
### 4. 加固测试基座

更新�?
- `packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx`
- `packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx`
- `packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts`

说明�?
- `chooseAssetProjectReference.test.tsx` 覆盖 register / bind 两条真实路径
- `chooseAssetIdentity.test.tsx` 改为 mock 真实导入路径，消�?`indexedDB is not defined` 假阳�?- `SubjectReferenceSection.boundary.test.ts` 作为消费�?source boundary 证据，明确该入口已声�?`projectReference`

## GREEN / 验证结果

### 1. ChooseAsset 定向 RED -> GREEN

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `2 files, 3 tests passed`

### 2. 资产中心�?ChooseAsset 回归

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `5 files, 14 tests passed`

### 3. 定向 TypeScript 编译

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx
```

结果�?
- `PASS`

## 检查点评估

### CP03-1 真实消费方是否已经显式声�?project-level persisted reference 语义

- 结论：`PASS`
- 证据�?  - `SubjectReferenceSection.tsx` 已传�?`projectReference`
  - `SubjectReferenceSection.boundary.test.ts` 通过

### CP03-2 `ChooseAsset` 本地上传后，未入索引资产是否会注�?project-level persisted reference

- 结论：`PASS`
- 证据�?  - `chooseAssetProjectReference.test.tsx` �?register 路径通过

### CP03-3 `ChooseAsset` 本地上传后，已入索引资产是否会补 bindReference 而不是重复注�?
- 结论：`PASS`
- 证据�?  - `chooseAssetProjectReference.test.tsx` �?bind 路径通过

### CP03-4 本轮是否错误宣称 `ChooseAsset` 全量闭环

- 结论：`NO`
- 说明�?  - 本轮只打�?`SubjectReferenceSection`
  - `StartEndFramesSection`
  - `LipSyncSection`
  - 以及其他 `ChooseAsset` 消费方仍未完成同�?project-level persisted reference 审计与落�?
### CP03-5 Step 03 是否可以宣告完成

- 结论：`NO`
- 原因�?  - `ChooseAsset` 仍有多个真实入口未纳�?persisted reference 主干
  - `node/web` 更大范围测试隔离问题仍是并行 blocker

## 现存风险 / Blocker

- `ChooseAsset` 目前只是具备了可�?`projectReference` 能力，不代表全部消费方已经接�?- `SubjectReferenceSection.boundary.test.ts` 采用的是 source boundary 证据，而不是完整消费方运行时渲染；这是由当�?video 包定向测试的 TSX import-analysis blocker 决定�?- `StartEndFramesSection / LipSyncSection / VoicePersonaSection / CharacterLeftGeneratorPanel` 仍可能存在同类引用盲�?- 本轮没有运行全仓 `pnpm test / pnpm typecheck / pnpm build`，不能外推为仓库级完�?
## 下一轮建�?
1. 继续停留�?`Step 03`，优先审�?`StartEndFramesSection` 两个 frame 槽位�?project-level persisted reference�?2. 随后处理 `LipSyncSection` �?`targetVideo / targetImage / driverAudio` 三个槽位，并为每个槽位分配稳�?`slot`�?3. 若继续遇�?video �?TSX import-analysis blocker，可把消费方运行时验证拆�?node boundary / source boundary �?`ChooseAsset` jsdom 主行为组合验证，不要把问题重新混成假 GREEN�?
