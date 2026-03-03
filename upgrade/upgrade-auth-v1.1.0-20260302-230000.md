# 升级需求 - Auth 模块 - v1.1.0 - 20260302-230000

## 1. 背景

Magic Studio 已在 `packages/sdkwork-react-auth/src/services/authService.ts` 中接入 TypeScript SDK。

当前存在以下问题：

1. 手机号登录 `POST /app/v3/api/auth/phone/login` 依赖业务层直连 HTTP，缺少 SDK Facade 方法。
2. 验证码发送与校验模型不统一，无法稳定支撑多端设备风控参数。
3. 忘记密码流程缺少 `POST /app/v3/api/auth/password/reset/request` 标准入口。

## 2. 升级目标

1. 在 OpenAPI 3.x 中补齐认证升级路径，支持 SDK 自动生成对应 facade。
2. 统一短信发送/校验请求参数与返回结构，避免布尔值返回造成语义缺失。
3. 不修改现有生成 SDK 源码，升级交由后续 agent 通过 OpenAPI 生成完成。

## 3. 具体升级需求

1. 新增 `POST /app/v3/api/auth/phone/login`
   - 请求：`phone/code/deviceId`
   - 返回：标准登录票据（含 `accessToken/refreshToken/userInfo`）
2. 新增或规范 `POST /app/v3/api/auth/sms/send`
   - 请求：`target/type/verifyType/deviceId`
   - 返回：发送凭据与过期时间
3. 新增或规范 `POST /app/v3/api/auth/sms/verify`
   - 请求：`target/code/verifyType/deviceId`
   - 返回：`valid/challengeToken/expireAt`
4. 新增 `POST /app/v3/api/auth/password/reset/request`
   - 请求：`account/channel/deviceId/locale/redirectUri`
   - 返回：受理结果（标准结果封装）

## 4. 非目标

1. 不在本次任务中实现后端逻辑。
2. 不手改 `sdkwork-app-sdk-typescript/src/*` 生成代码。

## 5. 交付物

1. OpenAPI 文档：`/upgrade/upgrade-auth-v1.1.0-20260302-230000-openapi.yaml`
2. 标准改造说明：`sdkwork-sdk-app/SDK_UPGRADE.md`
3. API 清单：`sdkwork-sdk-app/TYPESCRIPT_API_REQUIREMENTS.md`

## 6. 验收标准

1. OpenAPI 文档满足 3.x（建议 3.1.0）规范。
2. 认证升级路径具备清晰 `requestBody`、`responses` 与 `components.schemas`。
3. 后续 agent 可直接基于该文档实现后端与 SDK 自动生成，无需手工猜测字段语义。
