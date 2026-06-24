> Migrated from `docs/review/2026-04-06-magic-studio-front-back-integration-round-34.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 前后端对接检查与修复 Round 34

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
关注模块：图片、视频、音频、音乐、音效、角色、配音克�? 
不纳入本轮：`notes`

---

## 1. 本轮结论

本轮完成了一个完整的前后端对接闭环，结论如下�?
1. `magic-studio-v2` 媒体能力链路继续遵循统一标准�?   `feature/service -> @sdkwork/magic-studio-core -> retired generic app SDK -> retired Spring app API authority`
2. 已修复两处导致回归测试失真的测试夹具问题�?   - `@sdkwork/magic-studio-core` 被完�?mock，间接打�?`LocalStorageService`
   - `imageService.test.ts` mock 了错误的 `@sdkwork/magic-studio-assets` 根入口，而真实实现走子路�?3. 已修�?workspace 层面的共�?SDK 声明问题�?   - `pnpm-workspace.yaml` 已纳入共�?`retired generic app SDK` 源路�?   - 已排除本�?vendored `packages/product-app-sdk` 参与 workspace 解析，避免同名包漂移
   - `node_modules/retired generic app SDK` 已重新链接到 `application-root product app SDK TypeScript family`
4. 本应用的 SDK 合规红灯已消除；当前剩余合规问题全部位于别的应用 `apps/sdkwork-chat-pc-react`

---

## 2. 问题列表与根�?
### P0. 媒体回归测试被测试夹具污�?
现象�?
1. `packages/sdkwork-magic-studio-image/src/services/imageService.test.ts`
2. `packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.test.ts`

运行时报错：

`No "LocalStorageService" export is defined on the "@sdkwork/magic-studio-core" mock`

根因�?
1. 两个测试文件�?`@sdkwork/magic-studio-core` 整个模块替换成了手写对象�?2. 业务服务本身虽然只显式使用了 `getAppSdkClientWithSession`、`hasSdkworkClient`、`inlineDataService` 等导出，但其间接依赖链还会触�?`LocalStorageService`�?3. 结果不是业务链路坏了，而是测试夹具和真实导出面漂移�?
修复�?
1. 改为 partial mock�?2. 使用 `vi.mock('@sdkwork/magic-studio-core', async (importOriginal) => ({ ...actual, overrides }))`
3. 保留真实导出面，仅覆盖测试所需方法�?
---

### P1. `imageService` 测试 mock 边界与真实导入面不一�?
现象�?
1. 修复 `magic-studio-core` mock 之后，`imageService.test.ts` 出现 2 个用例超时：
   - `resolveImageGenerationSource`
   - `editImage`

根因�?
1. `imageService.ts` 真实导入�?   - `@sdkwork/magic-studio-assets/services`
   - `@sdkwork/magic-studio-assets/asset-center`
2. 旧测试只 mock �?`@sdkwork/magic-studio-assets` 根入口�?3. 导致测试命中了真实子路径实现，进而发生超时�?
修复�?
1. 把测�?mock 改到真实子路径：
   - `@sdkwork/magic-studio-assets/services`
   - `@sdkwork/magic-studio-assets/asset-center`
2. 断言导入也同步切到相同子路径，确�?mock 和业务代码命中同一模块实例�?
---

### P2. workspace 未声明共�?app sdk 源路�?
现象�?
`node ../scripts/check-sdk-compliance.mjs --strict`

此前�?`magic-studio-v2` 的唯一违规项为�?
`apps/magic-studio-v2/pnpm-workspace.yaml:1:SHARED_SDK_SOURCE_MISSING_WORKSPACE`

根因�?
1. `pnpm-workspace.yaml` 未包含共�?app sdk 源路径�?2. workspace 里仍通过 `packages/*` 把本�?vendored `packages/product-app-sdk` 纳入了解析面�?3. 这与统一标准冲突，也会继续放大本�?vendored dist 与共享源码之间的漂移风险�?
修复�?
1. �?`pnpm-workspace.yaml` 中加入：
   - `../../application-root product app SDK TypeScript family`
   - `../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript`
2. 同时排除�?   - `!packages/product-app-sdk`
3. 执行�?   - `pnpm install --lockfile-only`
   - `pnpm install`
4. 验证结果�?   - `node_modules/retired generic app SDK` 已指向共�?app sdk
   - `node_modules/@sdkwork/sdk-common` 已指向共�?sdk-common

---

## 3. 本轮接口输入/输出矩阵

说明�?
1. 这里只列出本轮实际修复并重新验证的接口�?2. 音频、视频、音乐、音效、角色模块本轮未改接口定义，但其服务测试已回归通过，见验证章节�?3. `voice-speaker` 按用户要求继续以 `clone` 能力为主，远端主键使�?`speakerId`，不�?`speakerName`�?
### 3.1 图片模块

| 模块 | client 方法 | 输入参数 | 输出结果 | 本轮处理 |
| --- | --- | --- | --- | --- |
| image | `client.generation.createGenerationImage` | `prompt`、`negativePrompt`、`model`、`width`、`height`、`quality`、`style`、`steps`、`cfgScale`、`aspectRatio`、`seed`、`async`、`type='IMAGE'`、`bizScene='image-studio'`、`referenceAssetCount`、`referenceAssets[]` | `GenerationTaskVO` 风格结果：`taskId`、`model`、`channel`、`status`、`progress`、`outputResult.primaryUrl/resources[]` | 未改业务实现；已通过回归测试验证 |
| image | `client.generation.createVariation` | `prompt`、`model`、`width`、`height`、`seed`、`async`、`type='IMAGE'`、`bizScene='image-studio'`、`referenceAssetCount`、`referenceAssets[]` | `GenerationTaskVO` | 未改业务实现；已通过回归测试验证 |
| image | `client.generation.getTaskStatusImage` | `taskId` | `GenerationTaskVO` | 未改业务实现；已验证轮询链路与方法绑�?|
| image | `client.generation.enhanceGenerationPrompt` | `prompt`、`scene='image-generation'`、`maxWords` | `{ prompt }` | 未改业务实现；已通过回归测试验证 |
| image | `client.generation.editImage` | `prompt`、`negativePrompt`、`model`、`strength`、`format`、`n`、`async`、`type='IMAGE'`、`bizScene='image-studio'`、`referenceAssets[]`、`maskAssets[]` | `GenerationTaskVO` | 未改业务实现；修复测�?mock 后验证通过 |
| image | `client.generation.upscaleImage` | `prompt`、`model`、`scale`、`targetWidth`、`targetHeight`、`format`、`n`、`async`、`type='IMAGE'`、`bizScene='image-studio'`、`referenceAssets[]` | `GenerationTaskVO` | 未改业务实现；已通过回归测试验证 |

### 3.2 配音克隆模块

| 模块 | client 方法 | 输入参数 | 输出结果 | 本轮处理 |
| --- | --- | --- | --- | --- |
| voice-speaker | `client.voiceSpeaker.cloneSpeaker` | `sampleAudioUrl`、`speakerId`、`language`、`model?`、`idempotencyKey?` | `{ taskId }` �?`GenerationTaskVO` 最小任务信�?| 未改业务实现；验证主键为 `speakerId` |
| voice-speaker | `client.voiceSpeaker.getCloneTaskResult` | `taskId` | `taskId`、`status`、`speakerId`、`speakerName`、`previewAudioUrl`、`completedAt?`、`errorMessage?` | 未改业务实现；已通过回归测试验证 |
| voice-speaker | `client.voiceSpeaker.updatePreviewSettings` | 路径参数 `speakerId`，请求体 `previewText?`、`previewAudioUrl?` | `speakerId?`、`previewText?`、`previewAudioUrl?` | 未改业务实现；已通过回归测试验证 |
| voice-speaker | `client.voiceSpeaker.listMarketVoices` | `page?`、`size?` | `Page<MarketVoiceVO>` 风格：`content[]` | 未改业务实现；已通过回归测试验证 |
| voice-speaker | `client.voiceSpeaker.getListSpeakers` | `page?`、`size?` | `Page<VoiceSpeakerVO>` 风格：`content[]` | 未改业务实现；已通过回归测试验证 |

### 3.3 其它媒体模块

| 模块 | 验证对象 | 输入/输出结论 | 本轮处理 |
| --- | --- | --- | --- |
| audio | `audioService.test.ts` 覆盖的生�?状�?资产链路 | 当前契约与服务层一�?| 未改接口定义；回归通过 |
| video | `videoService.test.ts` 覆盖的生�?轮询/提示词增强链�?| 当前契约与服务层一�?| 未改接口定义；回归通过 |
| music | `musicService.test.ts` 覆盖的生成链�?| 当前契约与服务层一�?| 未改接口定义；回归通过 |
| sfx | `sfxService.test.ts` 覆盖的生成链�?| 当前契约与服务层一�?| 未改接口定义；回归通过 |
| character | `characterService.test.ts` 覆盖的生成链�?| 当前契约与服务层一�?| 未改接口定义；回归通过 |
| film | `filmService.test.ts`、`filmProjectService.test.ts` | 当前契约与服务层一�?| 未改接口定义；回归通过 |

---

## 4. 文件级改�?
本轮实际修改文件�?
1. `packages/sdkwork-magic-studio-image/src/services/imageService.test.ts`
   - `@sdkwork/magic-studio-core` 改为 partial mock
   - `@sdkwork/magic-studio-assets` mock 对齐真实子路�?2. `packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.test.ts`
   - `@sdkwork/magic-studio-core` 改为 partial mock
3. `pnpm-workspace.yaml`
   - 纳入共享 app sdk、sdk-common
   - 排除本地 vendored `packages/product-app-sdk`
4. `pnpm-lock.yaml`
   - 经过 `pnpm install` 后，`retired generic app SDK` 解析目标切换到共�?app sdk 源包

---

## 5. 验证命令与结�?
### 5.1 失败复现

命令�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-image/src/services/imageService.test.ts packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.test.ts
```

结果�?
1. 初次复现时失败�?2. 根因明确�?`@sdkwork/magic-studio-core` mock 缺少 `LocalStorageService`�?
### 5.2 修复后双模块回归

命令�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-image/src/services/imageService.test.ts packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.test.ts
```

结果�?
1. `2` 个测试文件通过
2. `32` 个测试通过
3. `0` 失败

### 5.3 媒体核心回归

命令�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-assets/tests/assetSdkQueryService.test.ts packages/sdkwork-magic-studio-assets/tests/coverGenerationService.test.ts packages/sdkwork-magic-studio-assets/tests/creationCapabilityService.test.ts packages/sdkwork-magic-studio-assets/tests/remoteAssetIndexRepository.test.ts packages/sdkwork-magic-studio-image/src/services/imageService.test.ts packages/sdkwork-magic-studio-audio/src/services/audioService.test.ts packages/sdkwork-magic-studio-video/src/services/videoService.test.ts packages/sdkwork-magic-studio-music/src/services/musicService.test.ts packages/sdkwork-magic-studio-sfx/src/services/sfxService.test.ts packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.test.ts packages/sdkwork-magic-studio-character/src/services/characterService.test.ts packages/sdkwork-magic-studio-film/src/services/filmService.test.ts packages/sdkwork-magic-studio-film/src/services/filmProjectService.test.ts
```

结果�?
1. `13` 个测试文件通过
2. `145` 个测试通过
3. `0` 失败

### 5.4 workspace �?SDK 解析验证

命令�?
```bash
pnpm install --lockfile-only
pnpm install
```

结果�?
1. 两个命令均成功�?2. `pnpm install` 输出确认�?   - `retired generic app SDK 1.0.53 <- ..\\..\\retired Spring app API authority\\retired generic app SDK output\\product-app-sdk-typescript`
3. `node_modules` 链接结果�?   - `node_modules/retired generic app SDK -> application-root product app SDK TypeScript family`
   - `node_modules/@sdkwork/sdk-common -> sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript`

### 5.5 合规扫描

命令�?
```bash
node ../scripts/check-sdk-compliance.mjs --strict --report=docs/review/sdk-compliance-report-latest.txt
```

结果�?
1. `magic-studio-v2` 已无违规项�?2. 剩余 `7` 个违规全部位于：
   - `apps/sdkwork-chat-pc-react/packages/sdkwork-openchat-pc-commons/src/services/file.service.ts`
3. 这些问题不属于本应用本轮修复范围�?
---

## 6. 当前剩余风险

1. `packages/product-app-sdk` 目录仍然保留在仓库里，但已不再参�?workspace 解析�?   - 这是可控状态�?   - 下一轮可以考虑把它标记为归档目录，或在确认没有外部依赖后移除�?2. 上传链路本轮没有改代码�?   - 既有标准仍应保持为：
     `client.upload.getPresignedUrl -> PUT presignedUrl -> client.upload.registerPresigned`
   - 本轮未重新做上传专项端到端回归�?3. 全局 SDK 合规扫描仍有跨应用遗留红灯�?   - 当前都在 `sdkwork-chat-pc-react`
   - 不影响本轮对 `magic-studio-v2` 的结�?
---

## 7. 下一步计�?
建议按以下顺序继续：

1. �?`magic-studio-v2` 补一轮上传链路专项回归，重点验证 S3 预签�?URL 上传和注册闭环�?2. 清理 `packages/product-app-sdk` 的遗留定位，避免后续协作者误把它重新纳入 workspace�?3. 如果继续做全局 SDK 标准化，再单开一轮处�?`apps/sdkwork-chat-pc-react` �?`file.service.ts` 手写鉴权头和 `fetch` 问题�?

