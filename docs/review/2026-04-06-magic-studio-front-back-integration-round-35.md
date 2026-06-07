# Magic Studio V2 前后端对接与构建闭环 Round 35

日期：2026-04-06  
范围：`apps/magic-studio-v2`  
阶段：workspace 收口与 SDK 标准稳定性修复

---

## 1. 本轮结论

本轮未新增或修改任何业务 API，也没有变更任何前后端接口输入/输出定义。

本轮处理的是一个阻断全局验证链路的工程级问题：

1. `pnpm typecheck` 失败的直接原因不是 TypeScript 代码错误。
2. 真正根因是 workspace 同时暴露了两个同名包 `@sdkwork/sdk-common`：
   - 本地 vendored 包：`packages/sdkwork-sdk-common`
   - 共享标准源：`../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript`
3. 这与 Magic Studio 当前已经收口到共享 SDK 源的标准相冲突，也会让后续前后端对接验证失真。
4. 修复方式是继续以共享标准源为唯一 provider，并将本地 vendored 副本从 workspace 解析面排除。

---

## 2. 本轮接口输入/输出说明

本轮没有处理业务方法签名，所以接口输入/输出如下：

| 类型 | 方法/API | 输入 | 输出 | 处理方式 |
| --- | --- | --- | --- | --- |
| workspace 工程配置 | `pnpm typecheck` | workspace 包清单、`pnpm-workspace.yaml` | Turbo workspace 解析结果、TypeScript 类型检查结果 | 修改 workspace 解析边界，不改业务 API |

结论：

1. 本轮没有新增 API。
2. 本轮没有修改 API 请求参数。
3. 本轮没有修改 API 响应结构。
4. 本轮没有修改上传协议；上传仍应保持既定标准：`client.upload.getPresignedUrl -> PUT presignedUrl -> client.upload.registerPresigned`。

---

## 3. 问题列表与根因

### P0. `pnpm typecheck` 被重复 workspace 包名阻断

复现命令：

```bash
pnpm typecheck
```

报错摘要：

```text
Failed to add workspace "@sdkwork/sdk-common" from "packages\\sdkwork-sdk-common\\package.json",
it already exists at "..\\..\\sdk\\sdkwork-sdk-commons\\sdkwork-sdk-common-typescript\\package.json"
```

根因：

1. `pnpm-workspace.yaml` 使用了 `packages/*`，会把 `packages/sdkwork-sdk-common` 纳入 workspace。
2. 同一个文件中又显式纳入了共享标准源 `../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript`。
3. 两者包名都叫 `@sdkwork/sdk-common`，导致 Turbo/Pnpm 在构建 workspace 图时直接失败。
4. 本地 `packages/sdkwork-sdk-common` 本质上是 vendored dist 副本，不应该再作为标准 provider 参与当前应用的 workspace 解析。

---

## 4. 实施方案

### 4.1 修改项

修改文件：

1. `pnpm-workspace.yaml`

处理动作：

1. 保留共享标准源：
   - `../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript`
2. 新增排除规则：
   - `!packages/sdkwork-sdk-common`

### 4.2 方案判定

是否新增接口：否  
是否修改接口：否  
是否修改前端调用方式：否  
是否修改后端定义：否  
是否影响现有 `client.xxx` 对接标准：否，属于标准收口修复

---

## 5. 验证计划

本轮修复后按以下顺序验证：

1. `pnpm typecheck`
2. 与已调整的共享 SDK 对接模块相关的回归测试
3. `pnpm run check:sdk-standard`

通过标准：

1. workspace 不再出现重复包名冲突。
2. 类型检查可以进入真实 TypeScript 阶段并尽量通过。
3. `client.xxx -> retired generic app SDK -> retired Spring app API authority` 标准链路不出现回退。

---

## 6. 下一步

如果本轮 workspace 问题修复后仍出现类型或测试失败，下一轮继续按以下闭环推进：

1. 记录新的真实失败点，不做猜测性修复。
2. 优先修复破坏共享 SDK 标准或前后端契约一致性的高优问题。
3. 每一轮继续在 `docs/review/` 下新增文档，记录问题、方案、接口影响、验证和下一步计划。
