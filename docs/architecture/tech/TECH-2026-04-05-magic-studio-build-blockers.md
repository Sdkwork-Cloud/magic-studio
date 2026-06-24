> Migrated from `docs/review/2026-04-05-magic-studio-build-blockers.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 构建阻塞清单

日期�?026-04-05
命令：`pnpm run build:git-sdk`

## 1. 失败摘要

当前 `git sdk` 构建失败，失败集中在“远�?SDK 能力类型不稳�?+ 参数契约未收敛”�?
更新�?
- 当前 `git sdk` 构建已通过�?- 下方内容保留为本轮修复历史记录与已关闭阻塞说明�?
## 2. 阻塞项明�?
### 2.1 资产中心

文件�?
- `packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts`
- `packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts`

问题�?
- `client.assetCenter` 在当前编译面不可安全深索引�?- `QueryParams` 不接受数组，`sort/types/origins/tags/status` 需要序列化�?- `getClient` 默认值类型过宽，不能直接当成 `() => AssetCenterClientLike` 使用�?
修复策略�?
- 改为本地 `AssetCenterClientLike` / `AssetCenterApiLike` 最小接口�?- `toQueryParams` 序列化数组为逗号分隔字符串�?- 默认 client getter 用适配函数包一层，避免函数签名不兼容�?
状态：

- 已完�?- 已验证通过�?  - `packages/sdkwork-magic-studio-assets/tests/remoteAssetIndexRepository.test.ts`
  - `packages/sdkwork-magic-studio-assets/tests/assetSdkQueryService.test.ts`

### 2.2 封面提示�?
文件�?
- `packages/sdkwork-magic-studio-assets/src/services/coverGenerationService.ts`
- `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts`

问题�?
- `generation.getCoverPromptSuggestions` 真实存在，但当前业务深索引类型看不见�?- 导致参数类型与返回类型都不能安全�?`GenerationApi['getCoverPromptSuggestions']` 推出�?
修复策略�?
- 在业务层定义本地 `CoverPromptSuggestionsApiLike`�?- 保持运行�?`typeof api.getCoverPromptSuggestions === 'function'` 校验�?- 请求和返回体采用本地窄接口，避免直接深索�?SDK 方法�?
状态：

- 已完�?- 已验证通过�?  - `packages/sdkwork-magic-studio-assets/tests/coverGenerationService.test.ts`
  - `packages/sdkwork-magic-studio-core/src/ai/genAIService.test.ts`

### 2.3 预签名上�?
文件�?
- `packages/sdkwork-magic-studio-core/src/sdk/uploadViaPresignedUrl.ts`

问题�?
- 当前代码读取 `PresignedUrlVO.headers`，但编译面未稳定识别�?
修复策略�?
- 定义本地 `PresignedUrlDataLike` 窄接口�?- 读取 `url/objectKey/headers/previewUrl` 时统一先走本地 normalize�?
状态：

- 已完�?- 已验证通过�?  - `packages/sdkwork-magic-studio-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts`

### 2.4 Film 分析

文件�?
- `packages/sdkwork-magic-studio-film/src/services/filmService.ts`

问题�?
- `client.filmAnalysis` 不存在于当前 `AppSdkClient` 编译面�?
修复策略�?
- 本地定义 `FilmAnalysisApiLike` 结构接口�?- 通过窄化 client 结构桥接 `analyzeScript/extractCharacters/extractProps`�?- 不改 generated SDK�?
### 2.5 充�?
文件�?
- `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`

问题�?
- `client.account.createRechargeCash` 真实存在，但当前编译面不稳定�?
修复策略�?
- 本地定义 `AccountRechargeApiLike`�?- 运行时校验方法存在性，业务层不直接深索引类型�?
### 2.6 视频

文件�?
- `packages/sdkwork-magic-studio-video/src/services/videoService.ts`

问题�?
- `generation.lipSyncVideo` 编译面不可见�?- `VideoBaseApiRequest` 直接从深索引导出，导致字段约束漂移�?
修复策略�?
- 定义本地 `VideoGenerationApiLike` / `VideoLipSyncApiLike`�?- 将基础请求体收敛到本地显式接口�?- �?`options/referenceAssets` 做显式最小建模�?
### 2.7 语音�?Voice Speaker

文件�?
- `packages/sdkwork-magic-studio-voicespeaker/src/services/voiceService.ts`
- `packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.ts`

问题�?
- `voiceSpeaker.createGeneration/getTaskStatus/cloneSpeaker/getCloneTaskResult/getListSpeakers` 在当前编译面不稳定�?- 部分隐式 `any` 源自返回结构缺少本地约束�?
修复策略�?
- 定义 `VoiceSpeakerGenerationApiLike`
- 定义 `VoiceSpeakerCloneApiLike`
- 定义 `VoiceSpeakerMarketApiLike`
- 逐个方法做最小输入输出建模和运行时校�?
## 3. 本轮不处理项

- `notes` 相关能力，不在本轮范�?- DB / migration / schema 变更
- 手改 generated SDK

## 4. 验证目标

第一批目标：

- `vitest` 通过 `assets/core` 相关测试
- `build:git-sdk` 错误面缩小，至少移除 `assetCenter/cover/presigned` 三类阻塞

最终验证结果：

- 已通过的定向测试：
  - `packages/sdkwork-magic-studio-assets/tests/assetSdkQueryService.test.ts`
  - `packages/sdkwork-magic-studio-assets/tests/remoteAssetIndexRepository.test.ts`
  - `packages/sdkwork-magic-studio-assets/tests/coverGenerationService.test.ts`
  - `packages/sdkwork-magic-studio-core/src/ai/genAIService.test.ts`
  - `packages/sdkwork-magic-studio-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts`
  - `packages/sdkwork-magic-studio-film/src/services/filmService.test.ts`
  - `packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts`
  - `packages/sdkwork-magic-studio-video/src/services/videoService.test.ts`
  - `packages/sdkwork-magic-studio-voicespeaker/src/services/voiceService.test.ts`
  - `packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.test.ts`
- `build:git-sdk`：通过

剩余非构建阻塞项�?
- `pnpm run typecheck` 仍受 turbo 循环依赖阻塞
- `pnpm run audit:services:policy:review-gate` 仍为跳过�?- `pnpm run check:sdk-standard:quick` 仍因 `apps/sdkwork-chat-pc-react` 跨应用问题失�?
