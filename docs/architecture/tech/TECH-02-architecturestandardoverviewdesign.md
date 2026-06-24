> Migrated from `docs/架构/02-架构标准与总体设计.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 02. 架构标准与总体设计

## 1. 架构目标

Magic Studio V2 的总体架构必须同时服务三类复杂性：

- 多模态生成复杂性：图片、视频、音频、语音、音乐、角色、脚本等能力并存
- 多创作引擎复杂性：门户式生成、节点式创作、剧本式创作、时间线式创作并存
- 多运行环境复杂性：Web 与桌面共享业务层，但桌面具备更强本地能力

因此总体设计必须坚持：

- 业务领域优先，而不是页面优先
- 能力抽象优先，而不是平台调用散落
- SDK / Runtime 优先，而不是直接拼 HTTP / Tauri 调用
- 资产与项目优先，而不是生成结果孤岛化
- 本地优先与远端协同并存，而不是完全云依赖

## 2. 当前总体架构

### 2.1 逻辑分层

```text
Presentation
  App / Layout / Router / Pages / Panels / Editors

Business Domains
  workspace / assets / video / image / film / magiccut / canvas / prompt / chat / settings / plugins / skills

Shared Platform
  @sdkwork/magic-studio-core
  @sdkwork/core-pc-react
  retired generic app SDK
  runtime / toolkit / storage / upload / session

Desktop Runtime
  Tauri 2 commands
  Rust framework services
  ffmpeg / filesystem / sqlite / jobs / terminal / browser / policy

Remote Services
  App backend SDK endpoints
  object storage / update service / AI provider integrations
```

### 2.2 运行时特点

- 应用壳通过 `bootstrap` 统一初始化 i18n、SDK runtime、资产中心、桌面更新检查等能力。
- 路由采用按包注册和懒加载策略，不同页面可绑定不同布局和 Provider。
- 业务访问优先通过生成的 `retired generic app SDK` 和 PC React runtime 包装层进入远端服务。
- 本地文件、媒体处理、SQLite、任务等重能力通过 `getPlatformRuntime()` / `getPlatformToolKit()` 统一抽象。

## 3. 目标总体架构

### 3.1 目标拓扑

```text
User Intent
  -> Portal / Chat / Canvas / Film / MagicCut

Creation Orchestration Layer
  -> Project Graph
  -> Asset Center
  -> Generation Execution
  -> Editing Session
  -> Publish Pipeline

Capability Layer
  -> AI Gateway
  -> Media Toolkit
  -> Workspace Service
  -> Storage Service
  -> Plugin Runtime
  -> Observability & Policy

Runtime Layer
  -> Web Runtime
  -> Desktop Runtime (Tauri + Rust)

Infrastructure Layer
  -> Backend APIs
  -> Object Storage
  -> Update Service
  -> Model Providers
```

### 3.2 核心设计原则

| 原则 | 解释 |
| --- | --- |
| 统一项目图谱 | 所有创作模式最终都落到统一的工程上下文、资产引用和执行历史 |
| 统一资产协议 | 所有导入、生成、剪辑结果都通过资产中心管理 |
| SDK 优先 | 前端访问后端能力必须通过生成 SDK 或统一 facade |
| Runtime 抽象 | 业务代码不直接散落 `window` / `tauri invoke` / 原生插件调用 |
| 能力可替换 | 模型供应商、存储后端、桌面能力、插件实现都应可替换 |
| 最小耦合 | 页面只组合能力，不承载底层协议与存储细节 |
| 安全内建 | 路径、命令、密钥、插件、模型调用从架构层可治理 |

## 4. 当前架构优点与风险

### 4.1 优点

- 包级划分已接近领域边界，具备扩展基础。
- 桌面端能力已经被 Rust service 层吸收，而非堆在前端页面里。
- 路由、布局、业务页面之间具备明显层次。
- 已有统一资产中心与工作区服务，说明平台化方向明确。

### 4.2 风险

| 风险 | 描述 | 影响 |
| --- | --- | --- |
| 双 AI 路径漂移 | 后端 SDK 与直连模型都在业务层存在 | 能力不一致、审计困难、成本不可控 |
| 模式孤岛化风险 | `canvas`、`film`、`magic-cut` 各自成长过快 | 长期会形成多个半独立产品 |
| 权限收敛不足 | 桌面能力默认权限范围较大 | 安全边界薄弱 |
| 插件边界不稳定 | 插件市场先行，但运行时协议未成型 | 平台扩展会反向侵蚀主架构 |
| 发布链路不完整 | 工程同步与发布未闭环 | 无法形成真正的生产工作流 |

## 5. 行业领先架构标准

要达到行业领先水平，本系统应满足以下架构特征：

1. 从任意入口进入的创作任务，都可映射为统一的项目图谱和执行上下文。
2. AI、插件、本地工具链均通过可审计、可授权、可回放的能力层接入。
3. 所有大型资源操作都走异步任务系统，具备进度、取消、恢复、错误分类能力。
4. Web 与桌面共享业务模型，但桌面能力增强不污染业务层。
5. 任何新增功能都能找到稳定归属，不以“新页面 + 新 service 文件”方式野生生长。

## 6. 关键架构决策

| 决策 | 当前状态 | 目标要求 |
| --- | --- | --- |
| Monorepo + package 按领域拆分 | 已采用 | 继续强化边界和依赖规则 |
| Desktop-first local-first | 已形成方向 | 补强恢复、同步、权限治理 |
| Generated SDK as primary backend access | 已采用 | 禁止页面直连业务 API |
| Unified asset center | 已形成 | 扩展到所有创作模式和发布流程 |
| Unified runtime abstraction | 已形成 | 所有重能力统一经 runtime / toolkit 进入 |
| Plugin ecosystem | 起步阶段 | 升级为沙箱化平台级扩展体系 |

## 7. 本章评估标准

| 评估项 | 行业领先标准 | 当前判断 | 达标动作 |
| --- | --- | --- | --- |
| 分层清晰度 | 页面、业务、能力、运行时、基础设施分层稳定 | `L4` | 继续限制跨层直接依赖 |
| 领域边界稳定性 | 主要业务包职责明确，不交叉污染 | `L4` | 对引擎类模块建立统一协议层 |
| 可替换性 | 模型、存储、平台能力可替换 | `L3-L4` | 统一 AI 和插件能力入口 |
| 一致性 | Web / Desktop / Backend 接入方式一致 | `L4` | 禁止旁路实现继续扩散 |
| 安全可治理性 | 权限、路径、命令、插件能力皆受控 | `L2-L3` | 收敛 Tauri 权限和插件能力 |

## 8. 结论

Magic Studio V2 当前总体架构基础是好的，尤其适合继续向“桌面优先的多模态创作平台”演进。真正决定系统能否达到行业领先水平的，不是再扩页面数量，而是能否把创作引擎、AI 接入、插件体系、资产与项目图谱收敛为统一且可治理的主干架构。

