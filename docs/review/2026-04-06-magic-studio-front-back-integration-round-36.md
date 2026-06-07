# Magic Studio V2 前后端对接与工程闭环 Round 36

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
阶段：SDK 标准收口、workspace 修复、类型系统闭环、包导出面修�?
---

## 1. 本轮结论

本轮完成了一个完整的工程闭环，结论如下：

1. `magic-studio-v2` 已恢复到可执行的全量类型检查状态：
   - `pnpm typecheck` 通过
2. 与本轮变更直接相关的回归测试通过�?   - `6` 个测试文�?   - `33` 个测试用�?   - `0` 失败
3. SDK 标准检查通过�?   - `pnpm run check:sdk-standard` 通过
   - `sdk-compliance` 严格模式 `0` 违规
4. 本轮没有新增或修改任何后端业�?API 请求/响应结构�?5. 上传链路标准没有改变，仍然严格保持：
   - `client.upload.getPresignedUrl -> PUT presignedUrl -> client.upload.registerPresigned`

---

## 2. 本轮接口输入/输出说明

说明�?
1. 本轮没有修改 `retired Spring app API authority` 的业务接口定义�?2. 本轮没有改任何前后端业务 API 的请求参数和响应结构�?3. 本轮新增的是前端包内的工程适配边界，用来消除循环依赖和包导出缺口�?
### 2.1 未变更的前后端业务接�?
| 类型 | 方法/API | 输入 | 输出 | 本轮处理 |
| --- | --- | --- | --- | --- |
| 上传 | `client.upload.getPresignedUrl` | `PresignedUrlForm`：`objectKey`、`method`、`bucket?` | `PlusApiResultPresignedUrlVO` | 未改接口，继续使�?|
| 上传 | `client.upload.registerPresigned` | `PresignedUploadRegisterForm`：`objectKey`、`fileName`、`size`、`contentType`、`type`、`path`、`provider`、`folderId?`、`bucket?` | `PlusApiResultFileVO` | 未改接口，继续使�?|
| 资产中心 | `client.assetCenter.saveAsset` | `AssetCenterSaveForm` | `PlusApiResult<UnifiedDigitalAssetRecord>` 风格结果 | 未改接口，继续使�?|
| 图片生成 | `client.generation.createGenerationImage` 等图片能�?| 原有图片生成参数 | `GenerationTaskVO` 风格结果 | 未改接口，继续使�?|
| voice-speaker clone | `client.voiceSpeaker.cloneSpeaker` | 仍以 `speakerId` 为主键，配合样本音频等参�?| 任务结果 | 未改接口，继续使�?|

### 2.2 本轮新增的前端包内适配接口

这些不是后端 API，而是包内标准边界�?
| 类型 | 方法 | 输入 | 输出 | 目的 |
| --- | --- | --- | --- | --- |
| 前端适配 | `setAssetCoverGenerationAdapter` | `AssetCoverGenerationAdapter`，要求实�?`generateImage(input)` | `void` | 由应用启动层注入真实图片生成能力，消�?`magic-studio-assets -> magic-studio-image` 硬依�?|
| 前端适配 | `getAssetCoverGenerationAdapter` | �?| 当前 `AssetCoverGenerationAdapter` | 读取当前封面生成适配�?|
| 前端适配 | `resetAssetCoverGenerationAdapter` | �?| `void` | 重置到默认适配器，便于测试 |
| 上传工具 | `uploadViaPresignedUrl` | `client` + `UploadViaPresignedUrlInput` | `UploadViaPresignedUrlResult` | 输入/输出未变；仅把客户端类型改为结构化，消除 `src/dist` 名义类型冲突 |

---

## 3. 问题列表与根�?
### P0. workspace 重复注册 `@sdkwork/sdk-common`

现象�?
1. `pnpm typecheck` �?Turbo 构图前失败�?2. 错误指向两个同名 workspace 包：
   - `packages/sdkwork-sdk-common`
   - `../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript`

根因�?
1. 本地 vendored 副本和共享标准源同时暴露�?workspace 解析面�?2. 两者包名相同，导致 pnpm/turbo 直接拒绝构建图�?
修复�?
1. �?`pnpm-workspace.yaml` 中排除：
   - `!packages/sdkwork-sdk-common`
2. 保留共享标准源作为唯一 provider�?
### P1. `magic-studio-assets <-> magic-studio-image` 形成任务�?
现象�?
1. 修复 workspace 之后，`typecheck` 继续失败�?2. Turbo 提示 `@sdkwork/magic-studio-assets#typecheck` �?`@sdkwork/magic-studio-image#typecheck` 形成循环依赖�?
根因�?
1. `magic-studio-assets` 的封面生成服务直接依�?`magic-studio-image`�?2. `magic-studio-image` 同时依赖 `magic-studio-assets` 的能力与服务�?3. 这造成包级双向依赖�?
修复�?
1. 新增 `coverGenerationAdapter` 作为适配边界�?2. `magic-studio-assets` 不再直接导入 `magic-studio-image`�?3. 在应�?`bootstrap` 阶段注入真实 `imageService.generateImage`�?4. �?`packages/sdkwork-magic-studio-assets/package.json` 删除�?`@sdkwork/magic-studio-image` 的硬依赖�?
### P2. `sdkwork-magic-studio-generation-history` 编译目标落后

现象�?
1. 继续推进后，`magic-studio-core` 中的 `ErrorOptions` 写法�?`magic-studio-generation-history` 编译链下报错�?
根因�?
1. `sdkwork-magic-studio-generation-history/tsconfig.json` 仍是 `ES2020`�?2. workspace 其他共享包已经按 `ES2022` 能力在写代码�?
修复�?
1. �?`target/lib` �?`ES2020` 对齐�?`ES2022`�?
### P3. 多个业务包实现存在，�?package exports 缺失

现象�?
1. `magic-studio-chat` 缺失 `embedded-pane/pages/store/i18n` 等导出�?2. `magic-studio-voicespeaker` 缺失 `picker/constants` 等导出�?3. `magic-studio-video/magic-studio-audio/magic-studio-sfx/magic-studio-music/magic-studio-vip` 缺失各自被消费的子路径导出�?
根因�?
1. 包内部目录和入口已经存在�?2. �?`package.json.exports` 只导出了 `"."` 或者导出面不完整�?
修复�?
1. 按真实目录补齐子路径导出，不改调用方业务代码�?
### P4. `uploadViaPresignedUrl` 客户端类型过于名义化

现象�?
1. `assetSdkQueryService` 在调�?`uploadViaPresignedUrl` 时出�?`dist/api/upload` �?`src/api/upload` 的私有字段冲突�?
根因�?
1. `uploadViaPresignedUrl` 使用�?`Pick<AppSdkClient, 'upload'>`�?2. 由于 `UploadApi` 类中存在私有字段 `client`，不同构建入口导出的类型不能互相赋值�?
修复�?
1. �?`uploadViaPresignedUrl` 的客户端约束改为结构化接口：
   - 只要�?`getPresignedUrl`
   - `registerPresigned`
2. 业务输入/输出保持不变�?
---

## 4. 本轮修改文件

### 4.1 工程与文�?
1. `pnpm-workspace.yaml`
2. `docs/review/2026-04-06-magic-studio-front-back-integration-round-35.md`
3. `docs/review/2026-04-06-magic-studio-front-back-integration-round-36.md`

### 4.2 适配边界与上传工�?
1. `packages/sdkwork-magic-studio-assets/src/services/coverGenerationAdapter.ts`
2. `packages/sdkwork-magic-studio-assets/src/services/coverGenerationService.ts`
3. `packages/sdkwork-magic-studio-assets/src/services/index.ts`
4. `packages/sdkwork-magic-studio-assets/src/index.ts`
5. `packages/sdkwork-magic-studio-assets/package.json`
6. `packages/sdkwork-magic-studio-assets/tests/coverGenerationService.test.ts`
7. `packages/sdkwork-magic-studio-core/src/sdk/uploadViaPresignedUrl.ts`
8. `src/app/bootstrap.ts`

### 4.3 tsconfig 对齐

1. `packages/sdkwork-magic-studio-generation-history/tsconfig.json`

### 4.4 package exports 补齐

1. `packages/sdkwork-magic-studio-chat/package.json`
2. `packages/sdkwork-magic-studio-voicespeaker/package.json`
3. `packages/sdkwork-magic-studio-video/package.json`
4. `packages/sdkwork-magic-studio-audio/package.json`
5. `packages/sdkwork-magic-studio-sfx/package.json`
6. `packages/sdkwork-magic-studio-music/package.json`
7. `packages/sdkwork-magic-studio-vip/package.json`

---

## 5. 验证结果

### 5.1 全量类型检�?
命令�?
```bash
pnpm typecheck
```

结果�?
1. 通过
2. 42 �?workspace package 参与检�?
### 5.2 直接相关回归测试

命令�?
```bash
pnpm exec vitest run \
  packages/sdkwork-magic-studio-assets/tests/coverGenerationService.test.ts \
  packages/sdkwork-magic-studio-assets/tests/assetSdkQueryService.test.ts \
  packages/sdkwork-magic-studio-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts \
  packages/sdkwork-magic-studio-character/tests/characterLeftGeneratorPanel.test.tsx \
  packages/sdkwork-magic-studio-portal-video/src/components/PortalHeader.test.tsx \
  packages/sdkwork-magic-studio-portal-video/src/components/PortalSidebar.test.tsx
```

结果�?
1. `6` 个测试文件通过
2. `33` 个测试通过
3. `0` 失败

### 5.3 SDK 标准检�?
命令�?
```bash
pnpm run check:sdk-standard
```

结果�?
1. 通过
2. `sdk-compliance --strict`：`0` 违规
3. `auth/user-center/vip/contacts/product/drive/notification/trade` 标准检查全部通过

---

## 6. 当前状态判�?
本轮之后，`magic-studio-v2` 当前状态如下：

1. 共享 SDK 入口仍然保持统一标准�?   - `feature/service -> @sdkwork/magic-studio-core -> retired generic app SDK -> retired Spring app API authority`
2. 上传链路仍然保持 S3 预签�?URL 标准�?3. 图片、音频、视频、音乐、音效、角色、voice-speaker 等媒体能力所在的主要工程阻塞已清理�?4. `notes` 仍未纳入本应用当前处理范围，符合既定边界�?
---

## 7. 下一步计�?
建议下一轮按以下顺序继续�?
1. �?`magic-studio-v2` 做一轮更细的包导出面扫描，主动找出仍然只导出 `"."` 的业务包，避免后续再被动暴露�?2. 对媒体模块补一轮端到端行为回归，重点关注：
   - 图片生成
   - 视频生成
   - 音频生成
   - voice-speaker clone
3. 对上传链路补一轮更完整的集成验证，继续确认�?   - `getPresignedUrl`
   - `PUT`
   - `registerPresigned`
   - `assetCenter.saveAsset`
4. 如继续扩展后端对接能力，再按模块维度�?API 输入/输出矩阵文档，保持每个能力点可追踪�?