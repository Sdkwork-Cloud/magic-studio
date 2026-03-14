# Video Studio 对口型产品设计（参考可灵等接口模式）

Date: 2026-03-06  
Status: Proposed（待实现）

## 1. 目标与范围

本方案用于在 `Video Studio` 中新增并打磨「对口型（Lip Sync）」能力，要求：

1. 与现有产品信息架构一致：  
   视频主入口保持 4 个核心模式（全能参考、主体参考、智能多帧、首尾帧），对口型放在 `More`。
2. 参考行业主流产品（可灵/Kling、HeyGen、D-ID）常见接口与任务流：  
   采用异步任务模型（提交 -> 排队/处理中 -> 结果回传/查询）。
3. 支持本地化优先：  
   借助 Tauri + Rust + ffmpeg + sqlite，实现素材预处理、缓存、断点恢复、任务记录等本地闭环能力。
4. 形成可复用框架能力：  
   抽象为统一 `LipSyncService + Provider Adapter + Local Toolkit`，可复用于视频生成与剪辑类应用。

非目标（本阶段不做）：

1. 不在本阶段实现完整人物数字人直播系统。
2. 不在本阶段实现复杂时序手动关键帧口型编辑器（先采用自动对齐 + 高级参数）。

## 2. 行业接口模式抽象

基于可灵等平台与行业 API 的共性，提炼出对口型的标准任务模型：

1. 输入资源
- `source_video`（目标视频）
- `audio` 或 `tts_text`（驱动音频或文本）
- 可选：语言、声线、口型强度、表情强度、保真策略

2. 调用模型
- `POST createTask`：创建任务，返回 `task_id`
- `GET queryTask`：轮询状态与进度
- `POST cancelTask`：取消任务
- `Webhook callback`：服务端异步回调（可选）

3. 状态机
- `created -> validating -> queued -> processing -> succeeded|failed|canceled`

4. 结果输出
- `video_url`
- 可选：`preview_url`、`duration`、`fps`、`watermark`、`usage/credits`

该模型可覆盖不同供应商差异，适合做平台级抽象。

## 3. 方案对比（2-3种）

### 方案 A：直连供应商接口（最少抽象）

做法：

1. 前端直接按供应商参数构造请求。
2. 每个供应商一套 UI 字段与状态逻辑。

优点：

1. 接入快。
2. 供应商能力可原样暴露。

缺点：

1. UI 和服务层耦合高，切换供应商成本高。
2. 无法形成框架级复用能力。
3. 错误码、状态和数据结构不统一，历史数据难治理。

### 方案 B：统一任务协议 + Provider Adapter（推荐）

做法：

1. 产品层只认识统一的 `LipSyncTaskRequest`。
2. 服务层通过 `Provider Adapter` 映射到 Kling/HeyGen/D-ID 等参数。
3. 存储、状态机、错误码统一，供应商作为可插拔实现。

优点：

1. 高内聚低耦合，符合当前 Tauri/Rust 框架演进目标。
2. 可复用到不同应用和未来能力（配音、数字人、翻译口播）。
3. 统一的监控、失败重试、历史记录、计费和权限控制。

缺点：

1. 首次抽象设计成本高于方案 A。
2. 需要维护 adapter 能力矩阵。

### 方案 C：本地优先（预处理）+ 云端对口型混合编排

做法：

1. 本地先进行音频规范化、采样率统一、静音裁剪、人脸区域检测（可选）。
2. 仅上传必要中间件，减少失败率与上传体积。
3. 云端执行口型生成，本地再做后处理（封装、压缩、封面提取）。

优点：

1. 成功率与稳定性更高，尤其面向剪辑软件。
2. 更符合“完美本地化操作”的产品定位。

缺点：

1. 端侧能力要求更高（ffmpeg、存储、任务调度）。
2. 需要更完整的跨平台兼容测试。

### 推荐结论

采用 **B + C 组合**：

1. 以 **统一协议 + Adapter** 作为框架主干。
2. 以 **本地优先预处理** 作为稳定性增强层。
3. UI 只面向统一语义字段，避免被单一供应商绑死。

## 4. 信息架构与入口设计

Video Studio 结构保持：

1. 核心 4 模式（默认可见）
- 全能参考生视频（`smart_reference`）
- 主体参考生视频（`subject_ref`）
- 智能多帧（`smart_multi`）
- 首尾帧生视频（`start_end`）

2. More（工具扩展）
- 对口型（`lip-sync`）
- 换脸（`face-swap`）
- 视频转视频（`video-to-video`）
- 图生视频（`image-to-video`）

对口型定位：  
是“后处理/增强类能力”，不与核心生成模式竞争首屏空间。

## 5. 对口型交互设计（产品与体验）

## 5.1 页面结构（Left Panel）

进入 `More > Lip Sync` 后，左侧参数区分 5 段：

1. 输入素材
- 主视频（必填，时长上限按模型能力）
- 驱动方式二选一：
  - 上传音频（推荐）
  - 文本转语音 TTS（高级）

2. 同步策略
- `sync_mode`: `standard | pro`
- `lip_strength`: 0-100
- `expression_strength`: 0-100
- `preserve_head_motion`: boolean

3. 音频策略
- `audio_denoise`: 开关
- `trim_silence`: 开关
- `normalize_loudness`: LUFS 目标

4. 输出设置
- 分辨率跟随原视频（默认）
- 输出 fps（默认跟随）
- 是否保留原背景音轨

5. 提交区
- 主 CTA：`生成对口型视频`
- 次 CTA：`保存草稿`
- 提示：预计耗时、积分消耗、可取消说明

## 5.2 CTA 状态规则

1. `disabled`：
- 未选择视频
- 未提供音频/TTS
- 当前存在进行中的提交动作

2. `submitting`：
- 显示 `Validating assets...`

3. `queued/processing`：
- 按任务阶段显示进度条和阶段标签

4. `failed`：
- 红色错误反馈（与全局错误语义统一）
- 提供“重试”“修改参数后重试”

## 5.3 关键体验细节

1. 表单即时校验
- 视频时长/分辨率/编码不符合时，给出明确修复建议（例如“建议先转 H.264 + AAC”）。

2. 智能预设
- 提供 `自然对话 / 演讲播报 / 情绪表达` 三个快速预设。

3. 结果对比
- 支持“原视频 vs 对口型结果”左右对比滑杆。

4. 历史任务可追踪
- 每个任务显示输入摘要、参数快照、供应商、耗时、失败原因。

## 6. 统一接口契约（框架级）

## 6.1 Frontend -> App Backend（统一 API）

1. 创建任务

`POST /app/v3/api/video/lip-sync/tasks`

```json
{
  "workspaceId": "ws_xxx",
  "requestId": "req_xxx_idempotent",
  "provider": "kling",
  "profile": "standard",
  "source": {
    "videoAssetId": "asset_video_001"
  },
  "driver": {
    "type": "audio",
    "audioAssetId": "asset_audio_001",
    "tts": null
  },
  "syncOptions": {
    "lipStrength": 70,
    "expressionStrength": 50,
    "preserveHeadMotion": true
  },
  "audioOptions": {
    "denoise": true,
    "trimSilence": true,
    "targetLufs": -16
  },
  "outputOptions": {
    "keepOriginalBgm": false
  },
  "callbackUrl": "https://your-app/callback/lip-sync"
}
```

2. 查询任务

`GET /app/v3/api/video/lip-sync/tasks/{taskId}`

3. 取消任务

`POST /app/v3/api/video/lip-sync/tasks/{taskId}/cancel`

4. 回调（服务端）

`POST /internal/video/lip-sync/callback/{provider}`

## 6.2 统一返回结构

```json
{
  "taskId": "ls_20260306_xxx",
  "status": "queued",
  "progress": 0,
  "stage": "queued",
  "result": null,
  "error": null,
  "providerMeta": {
    "providerTaskId": "kling_task_xxx"
  }
}
```

成功 `result` 示例：

```json
{
  "videoUrl": "https://cdn/result.mp4",
  "posterUrl": "https://cdn/poster.jpg",
  "durationMs": 8400,
  "width": 1080,
  "height": 1920
}
```

## 6.3 Adapter 抽象接口（服务层）

```ts
export interface LipSyncProviderAdapter {
  provider: 'kling' | 'heygen' | 'did' | 'custom';
  createTask(req: UnifiedLipSyncRequest): Promise<ProviderCreateTaskResult>;
  queryTask(providerTaskId: string): Promise<ProviderTaskState>;
  cancelTask(providerTaskId: string): Promise<void>;
  mapError(error: unknown): UnifiedLipSyncError;
}
```

要点：

1. Provider 差异只存在 Adapter 内部。
2. 外部全量使用统一 DTO。
3. 状态与错误码由平台统一收敛。

## 7. 任务状态机与容错

状态定义：

1. `draft`：草稿未提交
2. `validating`：参数与素材检查
3. `queued`：已提交云端，等待调度
4. `processing`：生成中
5. `succeeded`：成功
6. `failed`：失败
7. `canceled`：已取消

失败重试策略：

1. `NETWORK_TIMEOUT`、`PROVIDER_RATE_LIMIT`：指数退避自动重试 2 次。
2. `INPUT_INVALID`：不自动重试，直接提示用户修改。
3. `PROVIDER_INTERNAL`：允许用户一键“复制参数重试”。

幂等策略：

1. 前端每次提交带 `requestId`。
2. 后端按 `workspaceId + requestId` 去重，防重复扣费与重复任务。

## 8. 错误码与提示规范

统一错误码建议：

1. `LIPSYNC_INPUT_INVALID`
2. `LIPSYNC_VIDEO_UNSUPPORTED_CODEC`
3. `LIPSYNC_AUDIO_UNSUPPORTED_FORMAT`
4. `LIPSYNC_DURATION_EXCEEDED`
5. `LIPSYNC_PROVIDER_RATE_LIMIT`
6. `LIPSYNC_PROVIDER_UNAVAILABLE`
7. `LIPSYNC_TASK_NOT_FOUND`
8. `LIPSYNC_PERMISSION_DENIED`
9. `LIPSYNC_UNKNOWN`

提示颜色规则：

1. 权限、鉴权、失败类提示使用红色语义色（error tone）。
2. 参数提醒使用橙色（warning tone）。
3. 处理中状态使用蓝色（info tone）。

## 9. 本地化优先能力（Tauri + Rust）

对口型链路建议接入本地能力框架（已在项目中推进的 toolkit/runtime 抽象）：

1. 本地预处理
- `toolKit.ffmpeg.normalizeAudio(...)`
- `toolKit.ffmpeg.trimSilence(...)`
- `toolKit.video.probe(...)`
- `toolKit.video.extractPoster(...)`

2. 本地文件管理
- `toolKit.workspace.ensureLocalDirs()`
- `toolKit.fileSystem.writeBytes/readBytes/exists`
- 为每次任务创建 `workspace/lipsync/{taskId}` 临时目录

3. 本地任务队列
- `job_submit_toolkit` / `job_get` / `job_cancel`
- 与云端 task 双轨同步（local job 负责预处理，cloud job 负责生成）

4. 数据持久化（sqlite）
- 保存任务、素材、参数快照、错误日志，支持崩溃恢复。

## 10. sqlite 表设计（建议）

1. `lip_sync_tasks`
- `id`, `workspace_id`, `request_id`, `provider`, `provider_task_id`
- `status`, `stage`, `progress`, `error_code`, `error_message`
- `config_json`, `result_json`
- `created_at`, `updated_at`

2. `lip_sync_assets`
- `id`, `task_id`, `role` (`source_video`/`driver_audio`/`output_video`)
- `asset_id`, `local_path`, `mime`, `meta_json`

3. `lip_sync_events`
- `id`, `task_id`, `event_type`, `payload_json`, `created_at`

## 11. 与当前代码集成点

前端（`@sdkwork/react-video`）：

1. `VideoLeftGeneratorPanel.tsx`
- `mode === 'lip-sync'` 时渲染独立表单区（不复用核心四模式字段）。

2. `videoStore.tsx`
- 新增 `submitLipSyncTask`、`pollLipSyncTask`、`cancelLipSyncTask`。
- `generate()` 对 `lip-sync` 分支走任务模型，而非通用 mock 生成分支。

3. `videoService.ts`
- 新增统一 `createLipSyncTask/queryLipSyncTask/cancelLipSyncTask` API。

4. `VideoHistory`
- 增加 `taskType = generation | lip_sync` 标识和展示差异。

Rust/Tauri（`src-tauri`）：

1. 复用 `framework/services/media.rs`, `toolkit.rs`, `database.rs`, `jobs.rs`。
2. 增加 lipsync 任务编排 command（若前端需要直接驱动本地预处理）。

## 12. 交付阶段建议

Phase 1（MVP）：

1. 完成 `More > Lip Sync` 专用表单与任务状态展示。
2. 接入统一任务 API + 轮询 + 取消。
3. 实现失败红色提示与错误码映射。

Phase 2（稳定性）：

1. 接入本地音频/视频预处理（ffmpeg）。
2. sqlite 落表与任务恢复。
3. 任务历史筛选、重试模板。

Phase 3（增强）：

1. provider 自动路由（按成本/时延/质量策略）。
2. 结果 A/B 对比、质量评分。
3. 多语言 TTS + 音色管理。

## 13. 验收标准

1. IA 合规：对口型仅在 `More`，核心四模式不被挤占。
2. 可用性：新用户 3 分钟内可完成一次对口型生成。
3. 稳定性：任务成功率达到目标阈值（建议 >= 92%）。
4. 可维护性：新增 provider 仅需实现 adapter，不改 UI 语义层。
5. 本地化：断网情况下仍可完成素材预处理、草稿保存和历史浏览。

## 14. 参考（接口设计模式）

1. Kling（第三方公开文档/封装示例）  
   https://www.klingapi.com/documents/video/lip-sync/  
   https://www.klingapi.com/documents/video/lip-sync/pro/
2. Replicate 上的 Kling lipsync 封装示例  
   https://replicate.com/zhengchong/kling-lipsync
3. HeyGen API 文档  
   https://docs.heygen.com/reference/create-an-avatar-video-v2
4. D-ID API 文档  
   https://docs.d-id.com/reference/get-started-with-your-api

说明：  
以上用于抽取“异步任务接口模式”，具体供应商字段以正式接入时的官方文档版本为准。
