# 升级需求 - Auth 模块 - v1.3.0 - 20260303-223000

## 1. 背景

Magic Studio 已切换到 `sdkwork-sdk-app/sdkwork-app-sdk-typescript` 最新 SDK，但在接入登录、注册、验证码、忘记密码、二维码登录时，仍存在需要业务层手动兼容的问题：

1. Auth 能力分散在 `login/register/logout/refresh/phone/sms/auth/qr/password` 多个模块，业务侧需要自行拼接统一鉴权流程。
2. 返回结构以 `PlusApiResult<T>` 为主，业务侧需手动解包 `data`。
3. 旧版业务常用类型别名 (`LoginRequest` / `RegisterRequest` / `UserInfo` / `QrCodeStatusResponse`) 在新版 SDK 无直接兼容导出。
4. SDK 依赖 `@sdkwork/sdk-common`，需要明确发布与可解析标准，避免集成侧出现依赖缺失。

## 2. 升级目标

1. 在 SDK 层提供统一 `authFacade`（或等价命名）以覆盖完整认证业务流程。
2. 对外提供稳定兼容类型别名，减少业务层迁移成本。
3. 约束 OpenAPI 生成产物与 TypeScript `src/dist` 类型声明一致。
4. 明确 `@sdkwork/sdk-common` 依赖发布策略，保证可安装、可解析。

## 3. 需要补齐的 SDK 能力

1. `authFacade.login(LoginRequest): Promise<LoginVO>`
2. `authFacade.register(RegisterRequest): Promise<UserInfoVO>`
3. `authFacade.logout(): Promise<void>`
4. `authFacade.refreshToken(TokenRefreshForm): Promise<LoginVO>`
5. `authFacade.phoneLogin(PhoneLoginForm): Promise<LoginVO>`
6. `authFacade.sendSmsCode(VerifyCodeSendForm): Promise<void>`
7. `authFacade.verifySmsCode(VerifyCodeCheckForm): Promise<VerifyResultVO>`
8. `authFacade.requestPasswordResetChallenge(PasswordResetRequestForm): Promise<void>`
9. `authFacade.confirmPasswordReset(PasswordResetForm): Promise<void>`
10. `authFacade.generateQrCode(): Promise<QrCodeVO>`
11. `authFacade.checkQrCodeStatus(qrKey): Promise<QrCodeStatusVO>`

## 4. 类型兼容要求

SDK 需额外导出以下兼容别名（不破坏现有类型）：

1. `LoginRequest -> LoginForm`
2. `RegisterRequest -> RegisterForm`
3. `UserInfo -> UserInfoVO`
4. `QrCodeStatusResponse -> QrCodeStatusVO`

## 5. 生成与发布标准

1. OpenAPI 版本固定为 `3.1.0`。
2. 每次 SDK 生成后，`src` 与 `dist` 类型声明必须一致。
3. `@sdkwork/sdk-common` 必须可通过 npm 正常安装，或提供同版本 workspace 源并在文档中明确。
4. CI 增加校验项：缺少上述 facade 方法或兼容类型别名时构建失败。

## 6. 交付件

1. 本文档：`/upgrade/upgrade-auth-v1.3.0-20260303-223000.md`
2. OpenAPI 更新：`/upgrade/upgrade-auth-v1.3.0-20260303-223000-openapi.yaml`
3. SDK 规范补充：`/sdkwork-sdk-app/SDK_UPGRADE.md`
4. TypeScript API 需求补充：`/sdkwork-sdk-app/TYPESCRIPT_API_REQUIREMENTS.md`
