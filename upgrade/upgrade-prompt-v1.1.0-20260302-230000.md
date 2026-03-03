# 升级需求 - Prompt 优化模块 - v1.1.0 - 20260302-230000

## 1. 背景

`packages/sdkwork-react-prompt` 已完成实际业务接入：

1. 页面“Optimize Prompt”会调用业务服务。
2. 业务服务优先使用 SDK HTTP 客户端访问后端。
3. 当接口未实现或返回 404 时，服务会降级为本地优化逻辑，保证流程可用。

当前缺口是 SDK 中缺少标准化的“提示词增强”接口定义与 facade 方法。

## 2. 升级目标

1. 新增标准 OpenAPI 路径 `POST /app/v3/api/generation/prompt/enhance`。
2. 通过 OpenAPI 生成 SDK facade，例如 `client.generation.enhancePrompt(...)`。
3. 支持文本与多模态提示词增强场景（文本输入 + 可选参考素材元数据）。

## 3. 具体需求

1. 请求模型至少包含：
   - `prompt`
   - `generationType`（IMAGE/VIDEO）
   - `mode`（text-to-prompt / image-to-prompt / video-to-prompt）
   - `style`（可选）
   - `additionalInstructions`（可选）
   - `reference`（可选，包含素材元信息）
2. 响应模型至少包含：
   - `optimizedPrompt`
   - `suggestions`（可选）
   - `tokensEstimated`（可选）
3. 错误响应需要明确：
   - `400/401/429/500`

## 4. 非目标

1. 不修改现有生成 SDK 代码。
2. 不在本任务内实现后端增强算法。

## 5. 交付物

1. OpenAPI 文档：`/upgrade/upgrade-prompt-v1.1.0-20260302-230000-openapi.yaml`
2. SDK 标准改造说明：`sdkwork-sdk-app/SDK_UPGRADE.md`
3. API 需求清单：`sdkwork-sdk-app/TYPESCRIPT_API_REQUIREMENTS.md`

## 6. 验收标准

1. OpenAPI 文档可直接作为后端实现契约与 SDK 生成输入。
2. 生成 SDK 后，业务层不再需要手写 `sdk.client.http.post('/app/v3/api/generation/prompt/enhance')`。
3. 接口返回字段可直接映射到 Prompt 优化结果对象。
