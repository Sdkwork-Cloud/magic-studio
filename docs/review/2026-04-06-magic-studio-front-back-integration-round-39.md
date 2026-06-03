# Magic Studio V2 前后端对接检查与修复 Round 39

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：补齐剩余共�?SDK 消费包的 contract guard 闭环，并修复 `prompt` / `drive` 普通编译面暴露出的真实边界问题  
排除范围：`notes`

---

## 1. 本轮结论

本轮完成�?4 个共�?SDK 消费包的契约守卫闭环�?
1. `@sdkwork/magic-studio-workspace`
2. `@sdkwork/magic-studio-drive`
3. `@sdkwork/magic-studio-prompt`
4. `@sdkwork/magic-studio-settings`

同时完成了两个额外收敛动作：

1. �?`promptBusinessService` 从本地自定义超集请求体，收敛为真实生�?SDK `generation.enhanceGenerationPrompt` 契约兼容请求
2. 修复包导出边界缺口：
   - `@sdkwork/magic-studio-editor/file-icon`
   - `@sdkwork/magic-studio-assets/asset-service`
   - `@sdkwork/magic-studio-assets/style-selector`

当前结论�?
1. �?4 个包已经具备独立�?`typecheck:contract`
2. �?4 个包的测试、普�?`typecheck`、contract `typecheck` 均通过
3. `magic-studio-v2` 本轮没有引入新的共享 SDK 旁路
4. 仓级合规扫描仍只命中另一个应�?`sdkwork-chat-pc-react` �?7 个历史违规项，没有命�?`magic-studio-v2`
5. `build:git-sdk` 通过，说明当前应用在 git-sdk 模式下仍可完成完整生产构�?
---

## 2. 本轮问题列表

### 2.1 缺少 contract guard 的共�?SDK 消费�?
问题�?
1. `workspace / drive / prompt / settings` �?4 个包都在消费共享 app SDK
2. 但它们此前没有独立的 `tsconfig.contract.json`
3. 也没有对应的 `*.contract-typecheck.ts`
4. 因此无法把当前已经成立的前后端输入输出契约固化成自动化守�?
风险�?
1. 生成 SDK 一旦字段漂移，CI 不会第一时间报错
2. feature/service 层容易重新出现“看起来能跑，但已经偏离真实 app-api 契约”的情况

### 2.2 `promptBusinessService` 绕过真实 SDK 类型

问题�?
1. 原实现通过 `unknown as GenerationModuleV2` 自定义了一个本地请求体
2. 原请求体字段包含�?   - `generationType`
   - `mode`
   - `additionalInstructions`
   - `reference`
3. 但真实生�?SDK `enhanceGenerationPrompt` 对应�?app-api 契约�?`PromptEnhanceRequest`
4. 当前生成契约的主字段是：
   - `prompt`
   - `scene`
   - `style`
   - `language`
   - `maxWords`

风险�?
1. 运行时虽然可能“看起来可用”，但静态类型约束已经失�?2. 一旦后端或生成 SDK 收敛字段，前端不会在编译期及时失�?3. 这不符合当前应用统一�?`client.xxx` / 共享 SDK 契约的目�?
### 2.3 普通编译面存在子路径导出缺�?
问题�?
1. `@sdkwork/magic-studio-editor` 未暴�?`./file-icon`
2. `@sdkwork/magic-studio-assets` 未暴露：
   - `./asset-service`
   - `./style-selector`

影响�?
1. `@sdkwork/magic-studio-drive run typecheck` 失败
2. `@sdkwork/magic-studio-prompt run typecheck` 失败

---

## 3. 本轮实施方案

### 3.1 契约守卫补齐策略

做法�?
1. 先给 4 个包的现有测试补“文件存在性断言�?2. 先跑红灯，确认失败原因确实是 guard 文件�?contract tsconfig 缺失
3. 再补最小实现：
   - `package.json` 增加 `typecheck:contract`
   - 新增 `tsconfig.contract.json`
   - 新增 `*.contract-typecheck.ts`
4. 最后跑�?   - 目标测试
   - 普�?`typecheck`
   - `typecheck:contract`

### 3.2 Prompt 收敛策略

做法�?
1. 先补一个失败测试，明确 `promptBusinessService` 必须通过真实生成 SDK 契约发送请�?2. 再把本地自定义超集请求收敛为 SDK 兼容请求�?   - `prompt`
   - `scene`
   - `style`
   - `maxWords`
3. 对于原本 UI 中的 `mode / reference / additionalInstructions` 等上下文，不再作为后端未知字段裸传，而是整合�?`prompt` 文本上下文中

这样做的原因�?
1. 保留了现�?prompt 优化产品语义
2. 删除了对后端未知字段的静态绕�?3. 让业务层重新回到真实 app-api 契约边界�?
### 3.3 主编译面�?contract 编译面隔�?
做法�?
1. 4 个包的常�?`tsconfig.json` 统一排除 `src/**/*.contract-typecheck.ts`
2. contract 文件只进�?`tsconfig.contract.json`

作用�?
1. 普通业务编译不再被 contract-only 外部类型导入干扰
2. contract 编译专门负责�?`spring-ai-plus-app-api` 做静态对�?
---

## 4. 本轮接口输入输出定义

以下为本轮明确落地并�?contract guard 固化的接口输入输出�?
### 4.1 Workspace 模块

#### `client.workspaces.createWorkspace`

输入：`WorkspaceCreateForm`

```ts
{
  workspaceName?: string
  workspaceDescription?: string
  workspaceIcon?: string
  workspaceColor?: string
  workspaceType?: string
  members?: WorkspaceMember[]
  settings?: WorkspaceSettings
}
```

输出：`PlusApiResultWorkspaceVO`

```ts
{
  code: string
  msg: string
  requestId: string
  errorName: string
  data: WorkspaceVO
}
```

#### `client.workspaces.updateWorkspace`

输入：`WorkspaceUpdateForm`

```ts
{
  workspaceId?: string
  workspaceName?: string
  workspaceDescription?: string
  workspaceIcon?: string
  workspaceColor?: string
  settings?: WorkspaceSettings
}
```

输出：`PlusApiResultWorkspaceVO`

#### `client.workspaces.listWorkspaces`

输入：无

输出：`PlusApiResultListWorkspaceVO`

```ts
{
  code: string
  msg: string
  requestId: string
  errorName: string
  data: WorkspaceVO[]
}
```

#### `client.workspaces.listProjects`

输入：`workspaceId + QueryParams`

输出：`PlusApiResultPageProjectVO`

```ts
{
  code: string
  msg: string
  requestId: string
  errorName: string
  data: {
    content?: ProjectVO[]
    number?: number
    size?: number
    totalElements?: number
    totalPages?: number
  }
}
```

#### `client.workspaces.createProject`

输入：`ProjectCreateForm`

```ts
{
  workspaceId?: string
  projectName?: string
  projectDescription?: string
  projectType?: string
  projectIcon?: string
  projectColor?: string
  projectTags?: string[]
  members?: ProjectMember[]
  settings?: ProjectSettings
}
```

输出：`PlusApiResultProjectVO`

#### `client.workspaces.deleteWorkspace / deleteProject`

输入�?
1. `workspaceId`
2. `workspaceId + projectId`

输出：`PlusApiResultVoid`

### 4.2 Drive 模块

#### `client.drive.createFolder`

输入：`DriveFolderCreateForm`

```ts
{
  name: string
  parentId?: string
  diskId?: string
}
```

输出：`PlusApiResultDriveItemVO`

#### `client.drive.listItems`

输入：`QueryParams`

输出：`PlusApiResultPageDriveItemVO`

#### `client.drive.getItemDetail`

输入：`itemId`

输出：`PlusApiResultDriveItemDetailVO`

#### `client.drive.getItemContent`

输入：`itemId`

输出：`PlusApiResultDriveContentVO`

#### `client.drive.updateItemContent`

输入：`DriveContentUpdateForm`

```ts
{
  text?: string
  contents?: Record<string, string>
  prompt?: string
  thinkingContent?: string
  encoding?: string
}
```

输出：`PlusApiResultDriveContentVO`

#### `client.drive.renameItem`

输入：`DriveRenameForm`

```ts
{
  name: string
}
```

输出：`PlusApiResultDriveItemVO`

#### `client.drive.moveItem`

输入：`DriveMoveForm`

```ts
{
  targetFolderId?: string
}
```

输出：`PlusApiResultDriveItemVO`

#### `client.drive.batchDeleteItems`

输入：`DriveBatchDeleteForm`

```ts
{
  itemIds: string[]
}
```

输出：`PlusApiResultVoid`

#### `client.upload.getStorageUsage`

输入：无

输出：`PlusApiResultStorageUsageVO`

#### `client.filesystem.getPrimaryDisk`

输入：无

输出：`PlusApiResultFileSystemDiskVO`

### 4.3 Prompt 模块

#### `client.generation.enhanceGenerationPrompt`

前端服务入参：`PromptOptimizationConfig`

```ts
{
  type: 'image' | 'video'
  mode: 'text-to-prompt' | 'image-to-prompt' | 'video-to-prompt'
  inputText?: string
  inputImage?: File | string
  inputVideo?: File | string
  targetStyle?: string
  additionalInstructions?: string
}
```

收敛后的后端请求：`PromptEnhanceRequest`

```ts
{
  prompt: string
  scene?: string
  style?: string
  language?: string
  maxWords?: number
}
```

本轮明确的映射规则：

1. `prompt`�?   - 基础文本来自 `inputText`
   - `mode / reference / additionalInstructions` 被整合进 prompt 上下�?2. `scene`�?   - 统一映射�?`prompt-optimization-${type}-${mode}`
3. `style`�?   - 映射�?`targetStyle`
4. `maxWords`�?   - `image` 默认 `180`
   - `video` 默认 `220`

输出：`PlusApiResultPromptEnhanceResponse`

```ts
{
  code: number
  msg: string
  message: string
  requestId: string
  errorName: string
  data: {
    prompt: string
    tokensEstimated?: number
  }
}
```

### 4.4 Settings Prompt 模块

#### `client.generation.enhanceGenerationPrompt`

服务方法：`enhanceAgentSystemPrompt(systemPrompt: string)`

后端请求：`PromptEnhanceRequest`

```ts
{
  prompt: systemPrompt
  scene: 'agent-system-prompt'
  maxWords: 400
}
```

输出：`PlusApiResultPromptEnhanceResponse`

---

## 5. 本轮修改�?
### 5.1 新增

1. `packages/sdkwork-magic-studio-workspace/tsconfig.contract.json`
2. `packages/sdkwork-magic-studio-drive/tsconfig.contract.json`
3. `packages/sdkwork-magic-studio-prompt/tsconfig.contract.json`
4. `packages/sdkwork-magic-studio-settings/tsconfig.contract.json`
5. `packages/sdkwork-magic-studio-workspace/src/services/workspaceService.contract-typecheck.ts`
6. `packages/sdkwork-magic-studio-drive/src/services/driveBusinessService.contract-typecheck.ts`
7. `packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.contract-typecheck.ts`
8. `packages/sdkwork-magic-studio-settings/src/services/settingsPromptService.contract-typecheck.ts`

### 5.2 修改

1. 4 个包�?`package.json`
   - 增加 `typecheck:contract`
2. 4 个包�?`tsconfig.json`
   - 排除 `src/**/*.contract-typecheck.ts`
3. `packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.ts`
   - 删除本地自定义超集请求绕�?   - 收敛到真实生�?SDK `PromptEnhanceRequest` 兼容形状
4. `packages/sdkwork-magic-studio-editor/package.json`
   - 新增 `./file-icon` 导出
5. `packages/sdkwork-magic-studio-assets/package.json`
   - 新增 `./asset-service`
   - 新增 `./style-selector`
6. 4 个包的现有测试文�?   - 增加 contract guard �?contract tsconfig 存在性断言
7. `packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.test.ts`
   - 增加真实生成 SDK 请求形状回归测试

---

## 6. 上传链路说明

本轮没有改变上传标准，继续保持已有的 S3 预签�?URL 流程�?
1. `client.upload.getPresignedUrl`
2. 直传预签�?URL
3. `client.upload.registerPresigned`
4. 需要纳入资产中心时再走 `client.assetCenter.saveAsset`

当前已确认仍成立的场景：

1. `workspaceService.createProject` 的封面上�?2. `driveBusinessService.uploadFile`

结论�?
1. 上传仍然使用 S3 标准预签�?URL 方式，没有回退为后端直�?
---

## 7. 验证结果

### 7.1 目标测试

命令�?
```bash
pnpm exec vitest run \
  packages/sdkwork-magic-studio-workspace/src/services/__tests__/workspaceService.test.ts \
  packages/sdkwork-magic-studio-drive/tests/driveBusinessService.download.test.ts \
  packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.test.ts \
  packages/sdkwork-magic-studio-settings/tests/settingsPromptService.test.ts
```

结果�?
1. `4` 个测试文件通过
2. `16` 个测试通过
3. `0` 失败

### 7.2 普通类型检�?
命令�?
```bash
pnpm --filter @sdkwork/magic-studio-workspace run typecheck
pnpm --filter @sdkwork/magic-studio-drive run typecheck
pnpm --filter @sdkwork/magic-studio-prompt run typecheck
pnpm --filter @sdkwork/magic-studio-settings run typecheck
```

结果�?
1. 全部通过

### 7.3 契约类型检�?
命令�?
```bash
pnpm --filter @sdkwork/magic-studio-workspace run typecheck:contract
pnpm --filter @sdkwork/magic-studio-drive run typecheck:contract
pnpm --filter @sdkwork/magic-studio-prompt run typecheck:contract
pnpm --filter @sdkwork/magic-studio-settings run typecheck:contract
```

结果�?
1. 全部通过

### 7.4 构建验证

命令�?
```bash
pnpm run build:git-sdk
```

结果�?
1. 构建通过

### 7.5 SDK 合规扫描

命令�?
```bash
node ../scripts/check-sdk-compliance.mjs --strict --report=docs/review/sdk-compliance-report-latest.txt
```

结果�?
1. 仍然只报�?`sdkwork-chat-pc-react` �?7 个历史违规项
2. `docs/review/sdk-compliance-report-latest.txt` 未出�?`magic-studio-v2` 或本�?4 个包的新违规记录

---

## 8. 剩余问题与下一�?
### 8.1 本应用内

当前 `magic-studio-v2` 在排�?`notes` 后，本轮已没有新的共�?SDK 对接缺口暴露出来�?
仍需持续关注的只有两类：

1. `notes`
   - 用户已明确要求本应用不处�?2. 更深层的 feature 级集成回�?   - 可以在后续继续补更多跨模块集成测�?
### 8.2 仓级剩余问题

仓级合规扫描仍剩�?
1. `apps/sdkwork-chat-pc-react/packages/sdkwork-openchat-pc-commons/src/services/file.service.ts`

这不属于本应用，但如果目标是仓级“全部完美”，下一轮应切换到该应用继续处理�?
---

## 9. 本轮闭环状�?
闭环已完成：

1. 红灯测试建立
2. 最小实现补�?3. prompt 契约绕过点收�?4. 编译边界问题修复
5. 测试通过
6. 普通类型检查通过
7. contract 类型检查通过
8. 生产构建通过
9. review 文档落盘

本轮可作�?`magic-studio-v2` 当前阶段的最新前后端对接基线�?