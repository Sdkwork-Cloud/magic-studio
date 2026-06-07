# Magic Studio V2 阶段评审

日期�?026-04-05
范围：`apps/magic-studio-v2`
目标：建立当前阶段基线，明确已完成项、阻塞项、跨应用残留项、修复优先级和验证闭环�?
## 1. 当前阶段结论

当前应用已经完成一�?`sdkwork-magic-studio-auth` 公开契约收口，但 `git sdk` 构建链路仍未打通，主要阻塞集中在以下两类问题：

1. 远端业务 SDK 对接类型漂移
   - 业务包直接用 `ReturnType<typeof getAppSdkClientWithSession>['xxx']` �?`AppSdkClient['xxx']` 深索引具体方法�?   - 当前编译面下，这些深索引�?vendored `retired generic app SDK` 实际导出存在不稳定或漂移，导致某些真实存在的方法在业务包编译时“看不见”�?   - 典型点：`assetCenter`、`generation.getCoverPromptSuggestions`、`generation.lipSyncVideo`、`voiceSpeaker.cloneSpeaker`、`voiceSpeaker.createGeneration`、`account.createRechargeCash`�?
2. 业务请求参数未按当前契约收敛
   - `QueryParams` 当前只能安全承载标量值，不应该直接塞数组�?   - 部分请求体沿用了旧字段或不稳定字段组合，导致与当�?SDK 表单契约不完全一致�?   - 典型点：`sort/types/origins/tags/status` 数组、视频能力请求体、语音生成请求体、预签名上传响应头读取�?
更新结论�?
- 当前 `pnpm run build:git-sdk` 已通过�?- 本轮业务代码阻塞已全部消除，当前剩余问题为工程级或跨应用级问题，不属于本�?`magic-studio-v2` 业务代码缺陷�?
## 2. 已完成事�?
### 2.1 auth 收口

已完成：

- 去掉 `packages/sdkwork-magic-studio-auth/src/index.ts` �?`retired generic app SDK` 的直接类�?re-export�?- 新增本地公开契约�?  - `packages/sdkwork-magic-studio-auth/src/contracts/authPublicTypes.ts`
- 新增 contract guard�?  - `packages/sdkwork-magic-studio-auth/src/authPublicTypes.contract-typecheck.ts`
- 修复 `auth` 包测试边界和 vite alias�?
已验证：

- `pnpm --filter @sdkwork/magic-studio-auth test`
- `pnpm --filter @sdkwork/magic-studio-auth run typecheck:contract`
- `node --test packages/sdkwork-magic-studio-auth/tests/appAuthService.node.test.mjs`
- `pnpm exec tsc --noEmit --pretty false`

### 2.2 当前回合已确认的事实

- `packages/product-app-sdk` 在当前应用内�?vendored `dist` 包，不是直接消费 `retired Spring app API authority` 源码�?- vendored SDK �?`dist` 可见以下真实能力�?  - `assetCenter`
  - `generation.getCoverPromptSuggestions`
  - `generation.lipSyncVideo`
  - `voiceSpeaker.cloneSpeaker`
  - `voiceSpeaker.getCloneTaskResult`
  - `voiceSpeaker.getListSpeakers`
  - `voiceSpeaker.createGeneration`
  - `voiceSpeaker.getTaskStatus`
  - `account.createRechargeCash`
- 但当前业务代码编译面与这些导出之间存在类型漂移，不能继续依赖深索引类型�?
## 3. 当前阻塞列表

### 3.1 当前应用内真实构建阻�?
来自 `pnpm run build:git-sdk`�?
- `packages/sdkwork-magic-studio-film/src/services/filmService.ts`
- `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`
- `packages/sdkwork-magic-studio-video/src/services/videoService.ts`
- `packages/sdkwork-magic-studio-voicespeaker/src/services/voiceService.ts`
- `packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.ts`

已在本轮消除的构建阻塞：

- `packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts`
- `packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts`
- `packages/sdkwork-magic-studio-assets/src/services/coverGenerationService.ts`
- `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts`
- `packages/sdkwork-magic-studio-core/src/sdk/uploadViaPresignedUrl.ts`

### 3.2 工程级问�?
- `pnpm run typecheck` 当前卡在 turbo 任务图循环依赖：
  - `@sdkwork/magic-studio-settings#typecheck <-> @sdkwork/magic-studio-assets#typecheck`
- `pnpm run audit:services:policy:review-gate` 当前为跳过态：
  - `POLICY_BASE_FILE` 未提供，尚未形成真正 review-gate 差异检�?- `pnpm run build:git-sdk` 虽已通过，但仍有两类非阻塞告警：
  - 根目�?`package.json` 未声�?`type: "module"`，导�?`vite.config.ts` 被重复解�?  - 若干生产 chunk 体积偏大，尤�?`feature-assets`、`feature-film`、`feature-magiccut`

### 3.3 跨应用残留，不纳入本轮修�?
- `pnpm run check:sdk-standard:quick` 的失败点在：
  - `apps/sdkwork-chat-pc-react/packages/sdkwork-openchat-pc-auth/src/services/appAuthService.ts`
- 该问题不属于 `magic-studio-v2` 本轮修复范围，应记录但不在本轮直接改动�?
## 4. 当前技术决�?
### 4.1 统一对接标准

远端业务统一收敛到：

`feature/service -> @sdkwork/magic-studio-core/src/sdk/useAppSdkClient -> retired generic app SDK -> retired Spring app API authority`

禁止继续扩散以下模式�?
- 业务包内原生 `fetch`
- 手写业务 HTTP helper
- 手动 auth header
- 业务包直接依�?generated SDK 类型作为公开类型
- 修改 generated SDK 产物来“修类型�?
### 4.2 第一批修复策�?
对于真实存在但编译面不稳定的方法，不继续用深索引类型硬推断，而是改为�?
1. 在业务包本地定义最小能力接�?   - 例如 `AssetCenterApiLike`
   - `GenerationPromptApiLike`
   - `UploadPresignedApiLike`
2. 用运行时方法存在性校验兜�?3. 把数组查询参数序列化�?SDK 可接受的标量字符�?4. 保持前端交互标准不变，避免引入新的兼容层

### 4.3 上传链路标准

上传统一�?S3 标准预签�?URL 链路�?
1. `client.upload.getPresignedUrl`
2. 前端直传 `PUT presignedUrl`
3. 透传服务端要求的 `headers`
4. `client.upload.registerPresigned`

## 5. 下一阶段执行顺序

第一阶段�?
- 修复 `assetCenter.queryAssets`
- 修复 `generation.getCoverPromptSuggestions`
- 修复 `upload.getPresignedUrl/registerPresigned`
- 补齐对应测试
- 验证 `assets/core` 第一批闭�?
第一阶段当前结果�?
- 已完�?- 已验证：
  - `pnpm exec vitest run packages/sdkwork-magic-studio-assets/tests/assetSdkQueryService.test.ts packages/sdkwork-magic-studio-assets/tests/remoteAssetIndexRepository.test.ts packages/sdkwork-magic-studio-assets/tests/coverGenerationService.test.ts packages/sdkwork-magic-studio-core/src/ai/genAIService.test.ts packages/sdkwork-magic-studio-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts`
  - 结果：`5` 个测试文件通过，`38` 条测试通过
- `build:git-sdk` 错误面已�?`assets/core/film/trade/video/voicespeaker` 缩小�?`film/trade/video/voicespeaker`

第二阶段�?
- 修复 `filmAnalysis` 结构化桥�?- 修复 `account.createRechargeCash`
- 修复 `generation.lipSyncVideo`

第三阶段�?
- 修复 `voiceSpeaker.cloneSpeaker`
- 修复 `voiceSpeaker.createGeneration`
- 修复 `voiceSpeaker.getTaskStatus`
- 修复 `voiceSpeaker.getCloneTaskResult`
- 修复 `voiceSpeaker.getListSpeakers`

第四阶段�?
- 再跑 `build:git-sdk`
- 更新剩余问题列表
- 继续下一轮闭环直到构建通过

第四阶段结果�?
- 已完�?- `build:git-sdk` 已通过
- 当前剩余闭环方向�?  - 拆解 `magic-studio-settings` / `magic-studio-assets` �?turbo typecheck 循环
  - 打开 `review-gate` 的基线文件输�?  - 处理根包 `module type` 告警
  - 优化大体�?chunk 的切分策�?