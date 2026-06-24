> Migrated from `docs/review/2026-04-05-magic-studio-remediation-plan.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 修复实施计划

日期：2026-04-05

## 目标

把 `magic-studio-v2` 的远端业务能力全部收敛到共享 SDK 标准路径，并完成“问题发现 -> 文档记录 -> 修复 -> 测试 -> 复盘 -> 下一轮”的完整闭环。

## 总原则

1. 远端业务统一通过 `client.xxx` 与服务端交互。
2. 业务包不直接暴露或依赖 generated SDK 类型作为公开契约。
3. 本地只定义最小能力接口，避免深索引 SDK 类型导致编译漂移。
4. 上传统一使用 S3 预签名 URL 直传链路。
5. 所有修复都必须补测试或更新测试。
6. 每轮验证后回写 `docs/review/` 文档。

## 第一轮计划

### 任务 A: 资产中心查询对接修复

输入：

- `assetCenter.queryAssets(params)`
- `assetCenter.getStats(params?)`
- `assetCenter.saveAsset(body)`
- `assetCenter.saveAssetsBatch(body)`
- `assetCenter.getAssetById(assetId)`
- `assetCenter.deleteAsset(assetId)`

输出：

- `PageUnifiedDigitalAssetVO`
- `AssetCenterStatsVO`
- `UnifiedDigitalAssetVO`
- `Void`

改造方式：

- 修改
- 不新增后端 API
- 只修复前端业务层与当前 app-sdk 契约的对接方式

### 任务 B: 封面提示词对接修复

输入：

- `generation.getCoverPromptSuggestions(body)`
- body:
  - `context: string`
  - `count?: number`
  - `styleHints?: string[]`
  - `language?: string`

输出：

- `PromptCoverSuggestionsResponse`
  - `prompts?: string[]`

改造方式：

- 修改
- 不新增后端 API
- 用本地最小接口代替深索引类型

### 任务 C: 预签名上传对接修复

输入：

- `upload.getPresignedUrl(body)`
- `upload.registerPresigned(body)`

输出：

- `PresignedUrlVO`
  - `url?: string`
  - `objectKey?: string`
  - `headers?: Record<string, string>`
- `FileVO`

改造方式：

- 修改
- 不新增后端 API
- 统一按 S3 预签名直传标准执行

## 第二轮计划

### 任务 D: filmAnalysis 结构桥接

输入：

- `filmAnalysis.analyzeScript`
- `filmAnalysis.extractCharacters`
- `filmAnalysis.extractProps`

输出：

- 影片分析结果结构

改造方式：

- 修改前端桥接
- 如 app-sdk 源契约缺失，再回到 `retired Spring app API authority` 闭环补齐

状态：

- 下一步立即处理

### 任务 E: 充值与视频

输入：

- `account.createRechargeCash`
- `generation.lipSyncVideo`

输出：

- 充值结果
- 视频生成任务结果

改造方式：

- 修改
- 先桥接类型，必要时再回到 app-api 补合同

状态：

- `account.createRechargeCash` 下一步处理
- `generation.lipSyncVideo` 在充值之后处理

## 第三轮计划

### 任务 F: voice-speaker 全链路

输入：

- `voiceSpeaker.cloneSpeaker`
- `voiceSpeaker.getCloneTaskResult`
- `voiceSpeaker.getListSpeakers`
- `voiceSpeaker.createGeneration`
- `voiceSpeaker.getTaskStatus`

输出：

- clone task
- clone result
- speaker page
- generation task
- task status

改造方式：

- 修改
- 以 `voice-speaker` 的 clone/generation 能力为唯一标准

## 每轮闭环步骤

1. 写失败测试或更新现有测试，先让问题可验证
2. 实施最小修复
3. 跑定向测试
4. 跑 `pnpm run build:git-sdk`
5. 更新 review 文档中的“已解决/剩余问题”
6. 进入下一轮

## 当前下一步

立即进入第一轮：

- `assetCenter.queryAssets`
- `generation.getCoverPromptSuggestions`
- `upload.getPresignedUrl/registerPresigned`

第一轮完成情况：

- 已完成
- 已通过 38 条定向测试
- 已将 `build:git-sdk` 错误面缩小到：
  - `filmAnalysis`
  - `account.createRechargeCash`
  - `generation.lipSyncVideo`
  - `voiceSpeaker.cloneSpeaker`
  - `voiceSpeaker.getCloneTaskResult`
  - `voiceSpeaker.getListSpeakers`
  - `voiceSpeaker.createGeneration`
  - `voiceSpeaker.getTaskStatus`

第二轮完成情况：

- 已完成：
  - `filmAnalysis` 结构桥接
  - `account.createRechargeCash` 桥接
  - `generation.lipSyncVideo` 桥接
  - `voiceSpeaker.cloneSpeaker/getCloneTaskResult/getListSpeakers/createGeneration/getTaskStatus/updatePreviewSettings/listMarketVoices` 桥接
- 已验证：
  - 相关服务定向测试全部通过
  - `build:git-sdk` 已通过

下一轮建议：

1. 处理 `@sdkwork/magic-studio-settings` 与 `@sdkwork/magic-studio-assets` 的 turbo typecheck 循环依赖
2. 给 `audit:services:policy:review-gate` 提供 `POLICY_BASE_FILE`
3. 评估根包 `package.json` 的 `type: "module"` 设置兼容性
4. 对 `feature-assets/feature-film/feature-magiccut` 做更细粒度拆包

