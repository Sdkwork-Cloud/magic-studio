# 升级需求 - Auth 模块 - v1.2.0 - 20260302-235900

## 1. 背景

`packages/sdkwork-react-auth` 已完成登录、注册、验证码验证、忘记密码的业务接入，但当前 SDK 仍存在能力与声明不一致的问题：

1. `@sdkwork/app-sdk` 对外发布的 `dist` 类型未包含 `phoneLogin`、`requestPasswordResetChallenge` 等新能力。
2. `verifySmsCode` 在 SDK facade 中仅覆盖登录场景，无法明确支持 `register` 与 `reset_password`。
3. 忘记密码流程缺少“发起挑战”与“提交验证码重置”的清晰接口分层，导致业务侧必须额外做 HTTP 兼容分支。

## 2. 升级目标

1. 保证 OpenAPI 3.x 定义、SDK 生成代码、`dist` 声明三者一致。
2. 为认证流程提供完整且稳定的标准接口：登录、注册、验证码发送/校验、密码重置挑战、密码重置提交。
3. 业务侧不再依赖手写 HTTP 回退逻辑，可直接调用 SDK facade。

## 3. 具体升级需求

1. SDK 类型升级
   - `AuthModule` 增加 `phoneLogin(...)`。
   - `AuthModule` 增加 `requestPasswordResetChallenge(...)`。
   - `AuthModule.verifySmsCode(...)` 支持可选 `verifyType`（`login | register | reset_password`）。
2. 密码重置接口分层
   - 保留 `POST /app/v3/api/auth/password/reset/request`（发起挑战）。
   - 新增 `POST /app/v3/api/auth/password/reset/confirm`（验证码+新密码提交）。
3. 验证码场景统一
   - `POST /app/v3/api/auth/sms/send` 与 `POST /app/v3/api/auth/sms/verify` 的 `verifyType` 统一为：
     - `login`
     - `register`
     - `reset_password`
4. 生成产物一致性
   - 每次 SDK 生成后，`src/types/*` 与 `dist/types/*` 必须同步更新并通过校验脚本。

## 4. 非目标

1. 不在本次任务中修改 `sdkwork-app-sdk-typescript/src/*` 手写逻辑。
2. 不在本次任务中实现后端业务，仅输出 API 协议与 SDK 升级要求。

## 5. 交付物

1. 升级说明：`/upgrade/upgrade-auth-v1.2.0-20260302-235900.md`
2. OpenAPI 文档：`/upgrade/upgrade-auth-v1.2.0-20260302-235900-openapi.yaml`
3. SDK 标准说明：`sdkwork-sdk-app/SDK_UPGRADE.md`
4. TypeScript API 清单：`sdkwork-sdk-app/TYPESCRIPT_API_REQUIREMENTS.md`

## 6. 验收标准

1. OpenAPI 文档符合 `OpenAPI 3.1.0`。
2. 升级后的 TypeScript SDK `dist` 与 `src` 类型声明一致。
3. 业务层可仅调用 SDK 完成登录、注册、验证、忘记密码流程，无需额外 HTTP 分支。
