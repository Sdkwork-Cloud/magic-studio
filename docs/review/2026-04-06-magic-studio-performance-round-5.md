# Magic Studio V2 性能复盘与执行方�?Round 5

日期�?026-04-06
范围：`apps/magic-studio-v2`
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 本轮目标

�?Round 4 已经切掉应用�?`router / preload / bootstrap` 对媒体包根入口依赖之后，继续向下一层收缩：

1. 找出其他业务包对媒体包根入口的跨包消费�?2. 为这些消费补齐聚�?public entry�?3. 逐文件迁移到子路径�?4. 重新验证构建体积�?chunk 归属�?
---

## 2. 本轮发现的问�?
Round 4 之后虽然应用层边界已经收干净，但构建仍显示：

1. `feature-assets-center` 仍在 `2074.43 kB` 左右�?2. `feature-image / feature-music / feature-sfx / feature-voice-speaker` 仍接近空壳�?3. 产物分析说明并不只是路由层在拖大 chunk，其他业务包也在直接吃媒体包根入口�?
本轮扫描确认的跨包根入口 consumers 包括�?
1. `sdkwork-magic-studio-canvas`
2. `sdkwork-magic-studio-character`
3. `sdkwork-magic-studio-film`
4. `sdkwork-magic-studio-magiccut`
5. `sdkwork-magic-studio-portal-video`
6. `sdkwork-magic-studio-assets`
7. `sdkwork-magic-studio-voicespeaker`

这些包通过 `@sdkwork/magic-studio-image`、`@sdkwork/magic-studio-video`、`@sdkwork/magic-studio-audio`、`@sdkwork/magic-studio-music`、`@sdkwork/magic-studio-sfx`、`@sdkwork/magic-studio-voicespeaker` 根入口拿�?
1. modal
2. selector
3. panel
4. store
5. service
6. entity
7. constants
8. recorder
9. picker

这类跨包根入口消费会继续把页面、面板和旁路依赖一起卷入错误共享块�?
---

## 3. 本轮新增 public entry 输入/输出定义

这里的输�?输出仍然是前端包边界，不是后�?API�?
### 3.1 图片能力

`@sdkwork/magic-studio-image/entities`

1. 输入：其他业务包需要图片实体工厂或类型�?2. 输出：`createImageInputResourceRef`、`ImageAspectRatio` 等图片实体层能力�?
`@sdkwork/magic-studio-image/services`

1. 输入：其他业务包需要调用图片生成或提示词增强服务�?2. 输出：`imageService` 及图片服务层能力�?
`@sdkwork/magic-studio-image/constants`

1. 输入：其他业务包需要读取图片模�?provider 常量�?2. 输出：`IMAGE_PROVIDERS`、`IMAGE_STYLES` 等常量�?
`@sdkwork/magic-studio-image/modals`

1. 输入：film / character / voicespeaker / magiccut 等包需要拉起图片生�?modal�?2. 输出：`AIImageGeneratorModal`、`ImageGeneratorModal`�?
`@sdkwork/magic-studio-image/selectors`

1. 输入：canvas / character 等包需要图片模型选择器�?2. 输出：`ImageModelSelector`�?
### 3.2 视频能力

`@sdkwork/magic-studio-video/entities`

1. 输入：其他业务包需要视频输入资源实体工厂和类型�?2. 输出：`createVideoInputResourceRef`、`VideoGenerationMode` 等视频实体层能力�?
`@sdkwork/magic-studio-video/services`

1. 输入：其他业务包需要统一视频生成请求构建或视频服务�?2. 输出：`buildUnifiedVideoGenerationRequest`、`videoService`�?
`@sdkwork/magic-studio-video/modals`

1. 输入：magiccut 等包需要视频生�?modal�?2. 输出：`VideoGeneratorModal`�?
`@sdkwork/magic-studio-video/selectors`

1. 输入：canvas 等包需要视频模型选择器�?2. 输出：`VideoModelSelector`�?
### 3.3 音频能力

`@sdkwork/magic-studio-audio/services`

1. 输入：film 等包需要音频生成服务�?2. 输出：`audioService`�?
`@sdkwork/magic-studio-audio/modals`

1. 输入：magiccut 等包需要音频生�?modal�?2. 输出：`AudioGeneratorModal`�?
`@sdkwork/magic-studio-audio/recorder`

1. 输入：voicespeaker 等包需要录音组件�?2. 输出：`AudioRecorder`�?
### 3.4 音乐能力

`@sdkwork/magic-studio-music/modals`

1. 输入：magiccut 等包需要音乐生�?modal�?2. 输出：`MusicGeneratorModal`�?
### 3.5 音效能力

`@sdkwork/magic-studio-sfx/modals`

1. 输入：magiccut 等包需要音效生�?modal�?2. 输出：`SfxGeneratorModal`�?
### 3.6 声音克隆能力

`@sdkwork/magic-studio-voicespeaker/entities`

1. 输入：magiccut 领域层需要声音生成结果实体与配置类型�?2. 输出：`resolveGeneratedVoiceResultUrl`、`GeneratedVoiceResult`、`VoiceConfig`�?
`@sdkwork/magic-studio-voicespeaker/services`

1. 输入：magiccut / 其他业务包需要声音业务服务或结果映射�?2. 输出：`voiceBusinessService`、`toGeneratedVoiceResult` 等服务能力�?
`@sdkwork/magic-studio-voicespeaker/constants`

1. 输入：character / film / magiccut 等包需要预置音色列表或声音模型常量�?2. 输出：`PRESET_VOICES`、`VOICE_MODELS` 等常量�?
`@sdkwork/magic-studio-voicespeaker/picker`

1. 输入：character / film 等包需要声音选择�?UI�?2. 输出：`ChooseVoiceSpeaker`�?
---

## 4. 本轮实施清单

### 4.1 新增 public entry

新增文件�?
1. `packages/sdkwork-magic-studio-image/src/modals/index.ts`
2. `packages/sdkwork-magic-studio-image/src/selectors/index.ts`
3. `packages/sdkwork-magic-studio-video/src/modals/index.ts`
4. `packages/sdkwork-magic-studio-video/src/selectors/index.ts`
5. `packages/sdkwork-magic-studio-audio/src/modals/index.ts`
6. `packages/sdkwork-magic-studio-audio/src/recorder/index.ts`
7. `packages/sdkwork-magic-studio-music/src/modals/index.ts`
8. `packages/sdkwork-magic-studio-sfx/src/modals/index.ts`
9. `packages/sdkwork-magic-studio-voicespeaker/src/picker/index.ts`

### 4.2 新增 alias

已在 `tsconfig.json` �?`vite.config.ts` 增加�?
1. `@sdkwork/magic-studio-image/entities`
2. `@sdkwork/magic-studio-image/services`
3. `@sdkwork/magic-studio-image/constants`
4. `@sdkwork/magic-studio-image/modals`
5. `@sdkwork/magic-studio-image/selectors`
6. `@sdkwork/magic-studio-video/entities`
7. `@sdkwork/magic-studio-video/services`
8. `@sdkwork/magic-studio-video/modals`
9. `@sdkwork/magic-studio-video/selectors`
10. `@sdkwork/magic-studio-audio/services`
11. `@sdkwork/magic-studio-audio/modals`
12. `@sdkwork/magic-studio-audio/recorder`
13. `@sdkwork/magic-studio-music/modals`
14. `@sdkwork/magic-studio-sfx/modals`
15. `@sdkwork/magic-studio-voicespeaker/entities`
16. `@sdkwork/magic-studio-voicespeaker/services`
17. `@sdkwork/magic-studio-voicespeaker/constants`
18. `@sdkwork/magic-studio-voicespeaker/picker`

### 4.3 已迁移的跨包 consumer

已处理：

1. `sdkwork-magic-studio-canvas`
2. `sdkwork-magic-studio-character`
3. `sdkwork-magic-studio-film`
4. `sdkwork-magic-studio-magiccut`
5. `sdkwork-magic-studio-portal-video`
6. `sdkwork-magic-studio-assets`
7. `sdkwork-magic-studio-voicespeaker`

---

## 5. 验证结果

### 5.1 TDD 结果

新增测试�?
1. `tests/mediaCrossPackageRootEntryBoundary.node.test.mjs`

执行过程�?
1. 先失败，确认跨包根入口消费者清单成立�?2. 改造后转绿�?
### 5.2 通过的验�?
已通过�?
1. 定向 `eslint`
2. `node --test tests/mediaPackageRootEntryBoundary.node.test.mjs`
3. `node --test tests/mediaCrossPackageRootEntryBoundary.node.test.mjs`
4. `pnpm run test:node`
5. `pnpm run build:test`

### 5.3 构建结果变化

Round 4 构建结果�?
1. `feature-assets-center` �?`2074.43 kB`
2. `feature-image` 近似空壳
3. `feature-music` 近似空壳
4. `feature-sfx` 近似空壳
5. `feature-voice-speaker` 近似空壳

本轮构建结果�?
1. `feature-assets-center` `1410.53 kB`
2. `feature-assets-generation` `607.64 kB`
3. `feature-film-core` `384.64 kB`
4. `feature-image` `4.86 kB`
5. `feature-music` `4.83 kB`
6. `feature-sfx` `2.89 kB`
7. `feature-voice-speaker` `30.82 kB`
8. `feature-audio` `40.67 kB`

结论�?
1. `feature-assets-center` 相比上一轮下降约 `663.9 kB`，说明跨包根入口清理是有效路径�?2. 图片、音乐、音效、声音克隆开始承接真实运行时代码，不再只是空壳�?3. `feature-assets-generation` 变大，说明一部分生成相关能力被正确地�?`feature-assets-center` 迁出�?
---

## 6. 产物级新根因

本轮继续定位 dist 后，得到的新结论如下�?
1. `ImagePage / ImageChatPage` 已经�?`feature-image` 导出�?2. `MusicPage / MusicChatPage` 已经�?`feature-music` 导出�?3. `SfxPage / SfxChatPage` 已经�?`feature-sfx` 导出�?4. `VoicePage / VoiceChatPage` 已经�?`feature-voice-speaker` 导出�?5. `AudioPage / AudioChatPage` 已经�?`feature-audio` 导出�?
仍未完全理顺的点�?
1. `ImageLeftGeneratorPanel` 仍从 `feature-film-core` 导出�?2. `VideoPage / VideoChatPage` 当前仍从 `feature-notes` 相关 chunk 导出，而不是稳定落�?`feature-video`�?
解释�?
1. `ImageLeftGeneratorPanel` �?`AIImageGeneratorModal / ImageGeneratorModal` 静态依赖，�?film 侧大量消费这�?modal，所以仍存在 film-core 方向的耦合�?2. `VideoPage` 落入 `feature-notes` 说明还有 notes 方向的跨包耦合链路，但 notes 已被用户明确排除在当前处理范围之外�?
---

## 7. 本轮结论

本轮已经完成一个完整闭环：

1. 发现跨包媒体根入口残留�?2. 写失败测试锁边界�?3. 新增 public entry�?4. 迁移 consumers�?5. 跑全�?node tests�?6. �?build�?7. 回写新的产物级根因�?
这是当前阶段最有效、且风险最低的一轮优化�?
---

## 8. 下一步计�?
下一轮建议继续按以下顺序推进�?
1. 在不处理 `notes` 业务逻辑的前提下，先�?`feature-video` �?`notes` 吸走的依赖链追出来，明确是否只能记录为排除项�?2. 针对 `AIImageGeneratorModal / ImageGeneratorModal -> ImageLeftGeneratorPanel` 这条链再做一次边界收缩，目标是把 `ImageLeftGeneratorPanel` �?`feature-film-core` 中剥离出来�?3. 继续复核 `feature-assets-generation` �?`feature-assets-center` 的职责边界，判断是否需要把 `GenerationHistoryListPane / PromptTextInput / ChooseAsset` 再拆成更细粒度入口�?4. 每一轮都维持“失败测�?-> 修复 -> 全量 node tests -> build -> dist 复核 -> 文档回写”的闭环�?