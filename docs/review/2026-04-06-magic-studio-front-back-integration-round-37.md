# Magic Studio V2 前后端对接检查与修复 Round 37

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：在媒体模块测试与契约全绿的基础上，继续审查运行时边界，确认当前应用是否还存在绕�?`client.xxx -> @sdkwork/magic-studio-core -> @sdkwork/app-sdk -> spring-ai-plus-app-api` 的旁路实�? 
排除范围：`notes`

---

## 1. 本轮结论

在排�?`notes` 的前提下，本轮未发现 `magic-studio-v2` 当前前后端对接范围内存在新的业务后端旁路�?
结论分项如下�?
1. 当前运行时代码中，未发现新的硬编码业务后端路�?`/app/v3/api`�?2. 当前运行时代码中，未发现新的 `axios` 调用�?3. 当前运行时代码中，未发现新的手写业务鉴权头注入�?4. 当前运行时代码中，未发现 feature/package 层直接消�?`@sdkwork/app-sdk` 生成 SDK 的新问题；共�?SDK 入口仍集中在 `sdkwork-magic-studio-core`�?5. 扫描命中�?`fetch(...)` 均属于外部资源、blob、URL 资源内容下载、本地导出物 externalize，未发现直接请求业务后端接口的旁路�?6. SDK 合规脚本仍然只报告别的应�?`apps/sdkwork-chat-pc-react` �?7 个历史违规，未发�?`magic-studio-v2` 新违规�?
---

## 2. 审查结果

### 2.1 `fetch(...)` 命中点审�?
命中如下�?
1. `packages/sdkwork-magic-studio-assets/src/services/assetService.ts:586`
2. `packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts:900`
3. `packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts:229`
4. `packages/sdkwork-magic-studio-magiccut/src/services/subtitle/SubtitleService.ts:234`
5. `packages/sdkwork-magic-studio-magiccut/src/services/color/LUTService.ts:65`
6. `packages/sdkwork-magic-studio-magiccut/src/services/audio/audioResourceFetchService.ts:7`

判断�?
1. `assetService.ts:586`
   - 用途：�?`blob:` / `http` 形式的生成结果抓成字节后，再导入资产系统�?   - 性质：资源内容抓取，不是业务后端调用�?2. `assetSdkQueryService.ts:900`
   - 用途：`importAssetFromUrlBySdk()` 先下载源 URL 字节，再走统一导入链路�?   - 性质：资源内容抓取，不是业务后端调用�?3. `canvasExportService.ts:229`
   - 用途：导出时把远端 blob/url externalize 到本地目标目录�?   - 性质：导出资源抓取，不是业务后端调用�?4. `SubtitleService.ts:234`
   - 用途：拉取字幕文件内容并解�?`srt/vtt`�?   - 性质：资源文件抓取，不是业务后端调用�?5. `LUTService.ts:65`
   - 用途：加载 LUT 文件文本�?   - 性质：资源文件抓取，不是业务后端调用�?6. `audioResourceFetchService.ts:7`
   - 用途：音频资源拉取�?`ArrayBuffer`�?   - 性质：资源内容抓取，不是业务后端调用�?
结论�?
1. 上述 `fetch(...)` 命中均不构成前后端业�?API 旁路�?2. 其中与媒体前后端对接最相关的仍是：
   - `assetService.ts`
   - `assetSdkQueryService.ts`
3. 这两处已确认继续走统一资产导入链路，不会绕开 `client.upload / client.assetCenter` 标准�?
### 2.2 直接引入 `@sdkwork/app-sdk` 审查

命中如下�?
1. `packages/sdkwork-magic-studio-core/src/sdk/*`
2. `packages/sdkwork-magic-studio-assets/src/*.contract-typecheck.ts`
3. `prompt/execute.md`
4. `packages/sdkwork-magic-studio-notes/src/services/noteService.ts`

判断�?
1. `sdkwork-magic-studio-core` 中的 `@sdkwork/app-sdk` 引入属于共享 SDK 包装层，符合标准�?2. `*.contract-typecheck.ts` 中的引入属于契约守卫文件，符合标准�?3. `prompt/execute.md` 为文档，不属于运行时代码�?4. `packages/sdkwork-magic-studio-notes/src/services/noteService.ts`
   - 仍存在直�?type import `@sdkwork/app-sdk`，并�?raw HTTP fallback�?   - 但该模块已被用户明确排除，不在本轮修复范围内�?
结论�?
1. 排除 `notes` 后，当前运行时代码未发现新的 feature/package 直连 `@sdkwork/app-sdk` 问题�?
### 2.3 手写业务路径与原�?HTTP 回退审查

结果�?
1. 排除 `notes` 后，未扫到硬编码 `/app/v3/api` 路径�?2. 排除 `notes` 后，未扫到运行时代码中的 `client.http.request` / `getRawHttpRequest` 之类业务回退实现�?3. 扫到�?`request(...)` 仅为�?   - `packages/sdkwork-magic-studio-core/src/platform/runtime/types.ts`
   - 属于平台运行时抽象类型，不是业务 HTTP 回退�?
---

## 3. 验证结果

### 3.1 SDK 合规脚本

命令�?
```bash
node ../scripts/check-sdk-compliance.mjs --strict --report=docs/review/sdk-compliance-report-latest.txt
```

结果�?
1. 扫描 `1882` 个目标文件�?2. 仍报�?`7` 个违规�?3. �?`7` 个违规全部位于：
   - `apps/sdkwork-chat-pc-react/packages/sdkwork-openchat-pc-commons/src/services/file.service.ts`
4. `magic-studio-v2` 当前未新增违规�?
### 3.2 当前应用构建验证

命令�?
```bash
pnpm run build:git-sdk
```

结果�?
1. `preflight:deps` 通过�?2. `MAGIC_STUDIO_SDK_MODE=git` 生产构建通过�?3. Vite 生产构建通过，`shared-app-sdk` chunk 正常产出�?
---

## 4. 当前对接状态判�?
### 4.1 媒体能力远端业务链路

当前维持�?
1. feature/store/service
2. `@sdkwork/magic-studio-core` 共享 SDK wrapper
3. `@sdkwork/app-sdk`
4. `spring-ai-plus-app-api`

判断�?
1. 图片、音频、视频、SFX、voice-speaker 当前远端业务能力仍对齐共�?SDK 标准�?
### 4.2 上传链路

当前维持�?
1. `client.upload.getPresignedUrl`
2. 浏览器对预签�?URL 执行 `PUT`
3. `client.upload.registerPresigned`
4. `client.assetCenter.saveAsset`

判断�?
1. 仍是 S3 标准预签名上传链路�?2. 扫描中没有发现回退�?multipart 直传后端或手写上传鉴权头的实现�?
### 4.3 Voice Speaker Clone 链路

当前维持�?
1. 上传参考音�?2. `client.voiceSpeaker.cloneSpeaker`
3. `client.voiceSpeaker.getCloneTaskResult`
4. `client.voiceSpeaker.updatePreviewSettings`

判断�?
1. 仍然�?`speakerId` �?clone 和结果回填的主身份字段�?2. 没有发现重新�?`speakerName` 当成主键的代码回退�?
---

## 5. 剩余问题与下一�?
### 5.1 剩余问题

1. `notes` 仍有直接 `@sdkwork/app-sdk` type import �?raw HTTP fallback，但这是用户已明确排除的范围�?2. 全仓 SDK 合规脚本仍有 `sdkwork-chat-pc-react` 的历史违规，不属于当前应用�?
### 5.2 下一步建�?
1. 若继续扩展本应用范围，可以把 `notes` 纳入下一轮，按同样标准清理到 `client.xxx` 共享 SDK 路径�?2. 若继续做全仓合规闭环，下一轮应切到 `sdkwork-chat-pc-react` 处理 `file.service.ts` �?`FETCH_BACKEND` 和手写鉴权头问题�?
