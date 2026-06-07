# 升级需�?- Auth 模块 - v1.1.0 - 20260302-230000

## 1. 背景

Magic Studio 已在 `packages/sdkwork-magic-studio-auth/src/services/authService.ts` 中接�?TypeScript SDK�?

当前存在以下问题�?

1. 手机号登�?`POST /app/v3/api/auth/phone/login` 依赖业务层直�?HTTP，缺�?SDK Facade 方法�?
2. 验证码发送与校验模型不统一，无法稳定支撑多端设备风控参数�?
3. 忘记密码流程缺少 `POST /app/v3/api/auth/password/reset/request` 标准入口�?

## 2. 升级目标

1. �?OpenAPI 3.x 中补齐认证升级路径，支持 SDK 自动生成对应 facade�?
2. 统一短信发�?校验请求参数与返回结构，避免布尔值返回造成语义缺失�?
3. 不修改现有生�?SDK 源码，升级交由后�?agent 通过 OpenAPI 生成完成�?

## 3. 具体升级需�?

1. 新增 `POST /app/v3/api/auth/phone/login`
   - 请求：`phone/code/deviceId`
   - 返回：标准登录票据（�?`accessToken/refreshToken/userInfo`�?
2. 新增或规�?`POST /app/v3/api/auth/sms/send`
   - 请求：`target/type/verifyType/deviceId`
   - 返回：发送凭据与过期时间
3. 新增或规�?`POST /app/v3/api/auth/sms/verify`
   - 请求：`target/code/verifyType/deviceId`
   - 返回：`valid/challengeToken/expireAt`
4. 新增 `POST /app/v3/api/auth/password/reset/request`
   - 请求：`account/channel/deviceId/locale/redirectUri`
   - 返回：受理结果（标准结果封装�?

## 4. 非目�?

1. 不在本次任务中实现后端逻辑�?
2. 不手�?`product-app-sdk-typescript/src/*` 生成代码�?

## 5. 交付�?

1. OpenAPI 文档：`/upgrade/upgrade-auth-v1.1.0-20260302-230000-openapi.yaml`
2. 标准改造说明：`retired generic app SDK output/SDK_UPGRADE.md`
3. API 清单：`retired generic app SDK output/TYPESCRIPT_API_REQUIREMENTS.md`

## 6. 验收标准

1. OpenAPI 文档满足 3.x（建�?3.1.0）规范�?
2. 认证升级路径具备清晰 `requestBody`、`responses` �?`components.schemas`�?
3. 后续 agent 可直接基于该文档实现后端�?SDK 自动生成，无需手工猜测字段语义�?
