# Magic Studio V2 前后端对接检查与修复 Round 38

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：在媒体模块与运行时边界检查基础上，把非媒体远端业务包一并纳入前后端对接审查，确认当前应用在排除 `notes` 后是否已经整体收敛到共享 SDK 标准  
排除范围：`notes`

---

## 1. 本轮结论

排除 `notes` 后，当前 `magic-studio-v2` 应用内已检查到的远端业务模块没有发现新的对接偏航�?
当前结论�?
1. 没有发现 feature/package 运行时代码直接绕�?`@sdkwork/magic-studio-core` 去消�?`retired generic app SDK`�?2. 没有发现新的业务后端硬编码路径或手写鉴权头�?3. 非媒体远端业务包 `auth / skills / user / vip` �?contract typecheck 全部通过�?4. 这些非媒体远端业务包的现�?service 级测试也全部通过�?5. 配合上一轮媒体模块的全量测试、构建、SDK 合规扫描，可以认定：
   - 当前应用在排�?`notes` 后，前后端对接主链路处于稳定状态�?
---

## 2. 远端业务入口审查

### 2.1 声明�?`typecheck:contract` 的包

本轮盘点结果�?
1. `sdkwork-magic-studio-assets`
2. `sdkwork-magic-studio-audio`
3. `sdkwork-magic-studio-auth`
4. `sdkwork-magic-studio-character`
5. `sdkwork-magic-studio-film`
6. `sdkwork-magic-studio-image`
7. `sdkwork-magic-studio-music`
8. `sdkwork-magic-studio-portal-video`
9. `sdkwork-magic-studio-sfx`
10. `sdkwork-magic-studio-skills`
11. `sdkwork-magic-studio-user`
12. `sdkwork-magic-studio-video`
13. `sdkwork-magic-studio-vip`
14. `sdkwork-magic-studio-voicespeaker`

判断�?
1. 这些包已经明确建立了“共�?SDK 契约守卫”机制�?2. 当前应用的远端业务边界治理不是只覆盖媒体模块，而是已经扩展到多个远端业务域�?
### 2.2 直接引入 `retired generic app SDK` 审查

排除项：

1. `sdkwork-magic-studio-core`
2. `product-app-sdk`
3. `notes`
4. `*.contract-typecheck.ts`

扫描结果�?
1. 运行时代码中没有发现新的 `from 'retired generic app SDK'`
2. 没有发现新的 `retired generic app SDK/api`
3. 没有发现新的 `createAppSdkClient` / `SdkworkAppClient` 直接使用

剩余命中�?
1. `prompt/execute.md`
   - 文档文件，不是运行时代码

结论�?
1. 当前应用 feature/package 运行时代码仍然把共享 SDK 入口集中�?`sdkwork-magic-studio-core`�?
### 2.3 `fetch(...)` / 原始请求审查

本轮补扫结果显示�?
1. `sdkwork-magic-studio-core` 中的 `fetch(...)`
   - 主要分布在：
     - `uploadViaPresignedUrl.ts`
     - `storage/providers/ServerProvider.ts`
     - `inlineDataService.ts`
     - 平台 runtime `httpRequest`
   - 性质：共享基础设施能力，不属于 feature 直接打业务后端�?2. feature 层剩�?`fetch(...)`
   - `assetService.ts`
   - `assetSdkQueryService.ts`
   - `canvasExportService.ts`
   - `SubtitleService.ts`
   - `LUTService.ts`
   - `audioResourceFetchService.ts`
   - 均已确认是资源内容抓取或导出 externalize，不是业�?API 旁路�?3. 未发现新�?`axios`�?4. 未发现新的运行时代码 `client.http.request` / `getRawHttpRequest` 业务回退�?5. 未发现新的硬编码 `/app/v3/api` 业务后端路径�?
结论�?
1. 当前扫描范围内没有发现新的后�?API 旁路�?
---

## 3. 非媒体远端包验证

### 3.1 contract typecheck

命令�?
```bash
pnpm --filter @sdkwork/magic-studio-auth run typecheck:contract
pnpm --filter @sdkwork/magic-studio-skills run typecheck:contract
pnpm --filter @sdkwork/magic-studio-user run typecheck:contract
pnpm --filter @sdkwork/magic-studio-vip run typecheck:contract
```

结果�?
1. `magic-studio-auth` 通过
2. `magic-studio-skills` 通过
3. `magic-studio-user` 通过
4. `magic-studio-vip` 通过

### 3.2 service 级测�?
命令�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-auth/tests packages/sdkwork-magic-studio-skills/src/services/skillsService.test.ts packages/sdkwork-magic-studio-user/tests packages/sdkwork-magic-studio-vip/src/services/vipService.test.ts
```

结果�?
1. `7` 个测试文件通过
2. `45` 个测试通过
3. `0` 失败

结论�?
1. 非媒体远端包的共�?SDK 包装层当前也处于可用状态，不是只有媒体能力在健康�?
---

## 4. 与前几轮结果汇总后的当前状�?
### 4.1 已有新鲜验证证据

1. 媒体模块全量回归�?   - `102` 个测试文�?   - `368` 个测试通过
   - `0` 失败
2. 媒体远端�?contract typecheck�?   - `10` 个包全部通过
3. 非媒体远端包 contract typecheck�?   - `auth / skills / user / vip` 全部通过
4. 非媒体远端包 service 测试�?   - `7` 个测试文件、`45` 个测试全部通过
5. `pnpm run build:git-sdk` 生产构建通过
6. `check-sdk-compliance.mjs` 结果仍显示当前应用无新违�?
### 4.2 当前整体判断

排除 `notes` 后：

1. 当前应用前后端对接已基本收敛到统一标准�?2. 远端业务能力没有发现新的 feature 层原�?HTTP 旁路�?3. 图片、音频、视频、SFX、voice-speaker 以及 auth/user/skills/vip 等远端业务包都已具备新鲜验证证据�?
---

## 5. 剩余范围外问�?
### 5.1 `notes`

现状�?
1. `notes` 仍有直接 type import `retired generic app SDK`
2. `notes` 仍保�?raw HTTP fallback 逻辑

说明�?
1. 这是明确的范围外项，不计入本轮“当前应用已闭环”的判断�?
### 5.2 全仓其它应用

现状�?
1. `check-sdk-compliance.mjs` 仍报�?`sdkwork-chat-pc-react` �?7 个违�?
说明�?
1. 这些违规不属�?`magic-studio-v2`
2. 若要做全仓级“完美”，下一轮需要切到对应应用处�?
---

## 6. 下一步建�?
1. 若继续推进当前应用，唯一明确未纳入的远端对接整改重点就是 `notes`�?2. 若继续推进全�?SDK 统一标准，下一步应处理�?   - `apps/sdkwork-chat-pc-react/packages/sdkwork-openchat-pc-commons/src/services/file.service.ts`
3. 若继续强调运行时稳定性，可以在当前基础上继续扩展更�?feature 级集成测试，但当前对接证据已经足够支持“排�?notes 后应用主链路稳定”这个结论�?
