> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-4.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方�?Round 4

日期�?026-04-06
范围：`apps/magic-studio-v2`
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段

Round 3 已经完成两件关键工作�?
1. `@sdkwork/magic-studio-assets` 已拆�?`pages / store / generation / creation-chat / choose-asset / hooks / entities / services / asset-center` 等聚�?public entry�?2. 图片、视频、音频、音乐、音效、声音克隆六个媒体包内部，已大幅�?`@sdkwork/magic-studio-assets` 根入口迁移到聚焦子路径�?
最新构建结果仍显示�?
1. `feature-assets-center` 仍维持在�?`2.07 MB`�?2. `feature-audio` 已被拆出，说�?`manualChunks` 生效，但不能解决根入口耦合问题�?3. 根因已经进一步收敛到应用层仍通过媒体包根入口加载 page、provider、left pane �?i18n�?
---

## 2. 本轮问题列表

### 问题 1：路由注册层仍通过媒体包根入口加载页面�?Provider

涉及文件�?
1. `src/router/registry.tsx`
2. `src/router/packageRouteLoader.tsx`
3. `src/router/packageRoutes.tsx`

现象�?
1. `ImagePage / ImageChatPage / ImageStoreProvider / ImageLeftGeneratorPanel` 等仍�?`@sdkwork/magic-studio-image` 根入口消费�?2. 其他五个媒体包存在同样问题�?
风险�?
1. 根入口的全量 re-export 会把不需要的运行时代码卷入同一依赖图�?2. 路由入口本应只装配页面与 Provider，却被迫吸收 services、entities、constants、i18n 等旁路依赖�?
### 问题 2：路由预加载仍直�?preload 媒体包根入口

涉及文件�?
1. `src/router/routePreload.ts`

现象�?
1. `image / video / music / sfx / voice / audio` 仍分别执�?`import('@sdkwork/magic-studio-xxx')`�?
风险�?
1. 预加载会提前触发整包根入口求值�?2. 根入�?re-export 图会继续把页面之外的模块拉入共享块�?
### 问题 3：启动阶�?i18n 延迟注册仍通过媒体包根入口�?`defaultI18nConfig`

涉及文件�?
1. `src/app/bootstrap.ts`

现象�?
1. 六个媒体包的 `defaultI18nConfig` 仍由 `@sdkwork/magic-studio-xxx` 根入口提供�?
风险�?
1. 启动层本应只依赖 i18n 配置，却会触发页面、Store、服务等旁路模块进入图谱�?
---

## 3. 根因结论

本轮不再继续�?`manualChunks`，因为问题已经不�?chunk 规则粗粒度，而是应用层导入边界不合理�?
明确根因�?
1. 六个媒体�?`src/index.ts` 都是高扇出的聚合入口�?2. `registry / packageRouteLoader / packageRoutes / routePreload / bootstrap` 是根入口高频消费方�?3. 只要这些文件继续依赖根入口，`feature-assets-center` 与相关媒体代码就会继续在共享图中耦合�?
---

## 4. 本轮目标

把应用层对六个媒体包的消费全部收敛到聚焦子路径：

1. `@sdkwork/magic-studio-image/pages`
2. `@sdkwork/magic-studio-image/store`
3. `@sdkwork/magic-studio-image/panels`
4. `@sdkwork/magic-studio-image/i18n`
5. `@sdkwork/magic-studio-video/pages`
6. `@sdkwork/magic-studio-video/store`
7. `@sdkwork/magic-studio-video/panels`
8. `@sdkwork/magic-studio-video/i18n`
9. `@sdkwork/magic-studio-audio/pages`
10. `@sdkwork/magic-studio-audio/store`
11. `@sdkwork/magic-studio-audio/panels`
12. `@sdkwork/magic-studio-audio/i18n`
13. `@sdkwork/magic-studio-music/pages`
14. `@sdkwork/magic-studio-music/store`
15. `@sdkwork/magic-studio-music/panels`
16. `@sdkwork/magic-studio-music/i18n`
17. `@sdkwork/magic-studio-sfx/pages`
18. `@sdkwork/magic-studio-sfx/store`
19. `@sdkwork/magic-studio-sfx/panels`
20. `@sdkwork/magic-studio-sfx/i18n`
21. `@sdkwork/magic-studio-voicespeaker/pages`
22. `@sdkwork/magic-studio-voicespeaker/store`
23. `@sdkwork/magic-studio-voicespeaker/panels`
24. `@sdkwork/magic-studio-voicespeaker/i18n`

约束目标�?
1. 上述五个应用层文件不再从六个媒体包根入口消费 page、provider、left pane、i18n�?2. 不修�?`notes`�?3. 不修�?generated SDK、schema、migration、DB�?
---

## 5. 本轮 public entry 输入/输出定义

这里的“输�?输出”不是后�?API，而是应用层与媒体包的对接边界�?
### 5.1 图片能力

`@sdkwork/magic-studio-image/pages`

1. 输入：路由层对图片页面懒加载请求�?2. 输出：`ImagePage`、`ImageChatPage`�?
`@sdkwork/magic-studio-image/store`

1. 输入：路由层对图�?Provider 的装配请求�?2. 输出：`ImageStoreProvider`、`useImageStore`�?
`@sdkwork/magic-studio-image/panels`

1. 输入：路由层对图片左侧生成面板的装配请求�?2. 输出：`ImageLeftGeneratorPanel`�?
`@sdkwork/magic-studio-image/i18n`

1. 输入：启动层延迟注册图片国际化资源�?2. 输出：`defaultI18nConfig`、`NAMESPACE`、`getI18nKey`�?
### 5.2 视频能力

`@sdkwork/magic-studio-video/pages`

1. 输入：路由层对视频页面懒加载请求�?2. 输出：`VideoPage`、`VideoChatPage`�?
`@sdkwork/magic-studio-video/store`

1. 输入：路由层对视�?Provider 的装配请求�?2. 输出：`VideoStoreProvider`、`useVideoStore`�?
`@sdkwork/magic-studio-video/panels`

1. 输入：路由层对视频左侧生成面板的装配请求�?2. 输出：`VideoLeftGeneratorPanel`�?
`@sdkwork/magic-studio-video/i18n`

1. 输入：启动层延迟注册视频国际化资源�?2. 输出：`defaultI18nConfig`、`NAMESPACE`、`getI18nKey`�?
### 5.3 音频能力

`@sdkwork/magic-studio-audio/pages`

1. 输入：路由层对音频页面懒加载请求�?2. 输出：`AudioPage`、`AudioChatPage`�?
`@sdkwork/magic-studio-audio/store`

1. 输入：路由层对音�?Provider 的装配请求�?2. 输出：`AudioStoreProvider`、`useAudioStore`�?
`@sdkwork/magic-studio-audio/panels`

1. 输入：路由层对音频左侧生成面板的装配请求�?2. 输出：`AudioLeftGeneratorPanel`�?
`@sdkwork/magic-studio-audio/i18n`

1. 输入：启动层延迟注册音频国际化资源�?2. 输出：`defaultI18nConfig`、`NAMESPACE`、`getI18nKey`�?
### 5.4 音乐能力

`@sdkwork/magic-studio-music/pages`

1. 输入：路由层对音乐页面懒加载请求�?2. 输出：`MusicPage`、`MusicChatPage`�?
`@sdkwork/magic-studio-music/store`

1. 输入：路由层对音�?Provider 的装配请求�?2. 输出：`MusicStoreProvider`、`useMusicStore`�?
`@sdkwork/magic-studio-music/panels`

1. 输入：路由层对音乐左侧生成面板的装配请求�?2. 输出：`MusicLeftGeneratorPanel`�?
`@sdkwork/magic-studio-music/i18n`

1. 输入：启动层延迟注册音乐国际化资源�?2. 输出：`defaultI18nConfig`、`NAMESPACE`、`getI18nKey`�?
### 5.5 音效能力

`@sdkwork/magic-studio-sfx/pages`

1. 输入：路由层对音效页面懒加载请求�?2. 输出：`SfxPage`、`SfxChatPage`�?
`@sdkwork/magic-studio-sfx/store`

1. 输入：路由层对音�?Provider 的装配请求�?2. 输出：`SfxStoreProvider`、`useSfxStore`�?
`@sdkwork/magic-studio-sfx/panels`

1. 输入：路由层对音效左侧生成面板的装配请求�?2. 输出：`SfxLeftGeneratorPanel`�?
`@sdkwork/magic-studio-sfx/i18n`

1. 输入：启动层延迟注册音效国际化资源�?2. 输出：`defaultI18nConfig`、`NAMESPACE`、`getI18nKey`�?
### 5.6 声音克隆能力

`@sdkwork/magic-studio-voicespeaker/pages`

1. 输入：路由层对声音克隆页面懒加载请求�?2. 输出：`VoicePage`、`VoiceChatPage`�?
`@sdkwork/magic-studio-voicespeaker/store`

1. 输入：路由层对声音克�?Provider 的装配请求�?2. 输出：`VoiceStoreProvider`、`useVoiceStore`�?
`@sdkwork/magic-studio-voicespeaker/panels`

1. 输入：路由层对声音克隆左侧生成面板的装配请求�?2. 输出：`VoiceLeftGeneratorPanel`�?
`@sdkwork/magic-studio-voicespeaker/i18n`

1. 输入：启动层延迟注册声音克隆国际化资源�?2. 输出：`defaultI18nConfig`、`NAMESPACE`、`getI18nKey`�?
---

## 6. 实施步骤

1. 先写边界失败测试，锁定五个应用层文件对六个媒体包根入口的违规依赖�?2. 为六个媒体包补齐或确�?`pages / store / panels / i18n` public entry�?3. �?`tsconfig.json` �?`vite.config.ts` 中增加对�?alias�?4. 迁移 `registry / packageRouteLoader / packageRoutes / routePreload / bootstrap`�?5. 跑定�?node 测试，确认边界测试由失败转为通过�?6. �?`pnpm run test:node`�?7. �?`pnpm run build:test`�?8. 对比新的 chunk 输出，回写剩余问题与下一轮计划�?
---

## 7. 验收标准

1. 新边界测试先失败后通过�?2. `pnpm run test:node` 通过�?3. `pnpm run build:test` 通过�?4. 五个应用层文件不再对六个媒体包使用根入口导入 page、provider、left pane、i18n�?5. `feature-assets-center` 相比上一轮继续下降，或至少明确进一步下降受阻的下一段根因�?
