# 2026-04-07 Step 03 嵌套资产引用解析收敛

## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续�?`docs/prompts/反复执行Step指令.md` 的执行要求推�?`Step 03`，本轮不扩散到三大引擎大面积重构，而是优先关闭一条真实的共享主干断点�?
1. `assetUrlResolver` 必须能够识别嵌套�?`resource / payload / primaryArtifact / delivery` 等包装对象里的资产主引用�?2. 当外层对象只保留临时 URL，而持久化 `assetId` 已被下沉到嵌套对象中时，统一解析入口仍然要优先命�?canonical asset url�?3. 对嵌套对象的收集必须保持克制，不能因为递归读取任意嵌套 `id` 而把非资�?id 误判�?`assetId`�?
这对�?Step 03 中“统一 `assetId` 主引用”“减少裸路径/临时 URL 主引用”“三大引擎共享解析主干收敛”的要求�?
## 实际变更

### 1. 统一入口支持收集嵌套资产载体

- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/assetUrlResolver.ts`
- 新增嵌套载体收集逻辑，统一遍历以下包装对象�?  - `resource`
  - `payload`
  - `primaryArtifact`
  - `delivery`
  - `preview / thumbnail / cover / poster`
  - 既有�?`image / video / audio / ...` slot
  - `assets[]`
- 解析逻辑从“只看顶�?source”收敛为“顶�?source + 受控嵌套载体集合�?
### 2. 保持顶层 `id` 语义不变，避免嵌套误�?
- 顶层对象仍保持原有优先级�?  - `metadata.assetId`
  - `assetId`
  - `id`
- 对嵌套对象则只读取：
  - `metadata.assetId`
  - `assetId`
- 这样既补上了嵌套资源对象�?canonical identity，又避免把嵌�?clip id、view id、流�?id 等任�?`id` 当成资产主键

### 3. 统一补齐嵌套 locator 读取

- `getDirectLocatorCandidates(...)` 现在会从嵌套载体中统一收集�?  - `url`
  - `path`
  - `src`
  - `uri`
  - `href`
- 因此即使 canonical `assetId` 查询失败，嵌套的 `assets://` 托管 locator 也能继续�?`assetCenterService.resolveLocatorUrl(...)`

### 4. 测试补齐

- 新增 `packages/sdkwork-magic-studio-assets/tests/assetUrlResolver.test.ts`
  - 验证 `resource.assetId` 场景会优先解�?canonical asset url，而不是返�?`null` 或临�?delivery url
  - 验证 `payload.image.metadata.assetId + assets://path` 场景会先�?canonical lookup，再回退到受�?locator 解析
- 更新 `packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx`
  - 补充一个回归保护，确认 `MagicCutStore` 在状态归一化后仍然能够保持 canonical asset 引用语义

## 检查点结果

### CP03-1 资产 identity 与目录协议冻�?
- 结果: `PARTIAL`
- 说明: 目录协议与删除安全边界已经在上一轮冻结；本轮将嵌套包装对象的主引用解析也收敛到共享入口，identity 协议进一步统一，但仍未完成全量链路闭环

### CP03-2 三大引擎主引用切换到 `assetId`

- 结果: `PARTIAL`
- 说明: 共享 resolver 已经能够读取包装对象内部�?`assetId`，Film / MagicCut / Canvas 经过共享解析入口时不再必须依赖顶层裸路径；但各引擎内部仍有若干直�?URL/局部解析路径待继续收敛

### CP03-3 资产测试与跨模式读取通过

- 结果: `PARTIAL`
- 说明: 本轮新增了嵌套主引用解析的红绿测试，并回归了默认 resolver �?MagicCut store identity 测试；但更大范围的工程快照、生成结果、跨引擎读写一致性仍需后续轮次推进

### CP03-4 允许进入引擎与插件相�?Step

- 结果: `PARTIAL`
- 说明: 共享 resolver 已更接近“标准主引用入口”，后续引擎接线时可减少局部兼容判断；�?Step 03 仍未整体完工，尚不允许宣称本 step 完成

## 运行命令与结�?
### Red

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetUrlResolver.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果: `FAIL`
  - 失败�?
    - 嵌套 `resource.assetId` 场景返回 `null`
    - 嵌套 `payload.image.path` 托管 locator 场景返回 `null`

### Green / Regression

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetUrlResolver.test.ts packages/sdkwork-magic-studio-assets/tests/useAssetUrlDefaultResolver.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果: `3 files, 8 tests passed`

### Typecheck Attempt

- `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/asset-center/application/assetUrlResolver.ts`
  - 结果: `FAIL`
  - blocker: 仓库当前缺少 `retired generic app SDK/*` 相关声明，阻塞在 `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`
  - 结论: 本轮生产代码的运行级验证已由 Vitest 证明，文件级 `tsc` 仍受全仓共享 SDK 类型缺口影响，未在本轮内清除

## 风险 / Blocker

- Step 03 的统一主引用收敛仍未完成，剩余风险包括�?  - Film / MagicCut / Canvas 内部仍存在若干直�?URL 路径
  - 生成结果、工程快照、导出链路中�?`assetId / primaryResourceId / resourceViewId` 仍需继续统一
  - 删除前反向引用追踪与用户态回收策略仍未闭�?- 全仓类型校验仍被共享 `retired generic app SDK/*` 声明缺失阻塞

## 是否达到门槛

- 是否达到解锁最�?bar: `YES`
  - 理由: 共享 resolver 已从“只认顶�?source”推进到“可识别受控嵌套资产载体”，这是真实的主干能力提�?
- 是否达到能力完工 bar: `NO`
  - 理由: Step 03 仍缺少全量主引用切换、跨引擎统一写回、反向引用追踪与类型主干清障

## 文档回写情况

- `docs/review`: `YES`
- `docs/架构`: `NO`
  - 理由: 本轮属于既定 Step 03 能力落地，不涉及架构标准本身修改
- `docs/release/CHANGELOG.md`: `YES`
- `docs/release/VERSION.md`: `YES`
- 本轮 release 记录: `YES`

## 是否允许进入下一�?
- 允许进入下一�? `YES`
- 允许进入下一 Step: `NO`
- 建议: 继续留在 `Step 03`，优先推进三条剩余链�?  - 引擎内部�?URL 主引用收�?  - `assetId / primaryResourceId / resourceViewId` 全量写回协议统一
  - 删除前反向引用检查与回收策略

## 并行 / 串行建议

### 可并�?
- Lane B1: Film / MagicCut / Canvas 直接 URL 主引用排查与替换
- Lane B2: 生成结果与工程快照的 identity 写回协议统一
- Lane B3: 删除前反向引用追踪、用户态回收与诊断面板

### 必须串行

- `packages/sdkwork-magic-studio-assets/src/asset-center/application/assetUrlResolver.ts`

该文件仍属于 Step 03 的共享解析主干，应继续保持单 owner，避免多 lane 并发改写引用优先级和 fallback 顺序�?
## 自我反证结论

- 本轮不是“给 resolver 多加几个 if”，而是把嵌套包装对象的 canonical asset identity 真正收敛到了共享入口
- 本轮也没有把 Step 03 夸大成完工，只完成了共享解析主干的第二个真实闭环
- 对商业化交付的直接价值是�?  - 减少临时 URL 和裸路径�?UI / 引擎中的主引用地�?  - 提高托管资源、生成结果、包装对象之间的统一可解析�?  - 为后续跨引擎资产接线与删除回收策略提供更可靠�?identity 主干
