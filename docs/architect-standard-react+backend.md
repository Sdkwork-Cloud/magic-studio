# 后端服务架构标准 v1.0

## 目录

1. [架构概述](#一架构概述)
2. [核心设计原则](#二核心设计原则)
3. [技术栈规范](#三技术栈规范)
4. [分层架构设计](#四分层架构设计)
5. [包结构规范](#五包结构规范)
6. [API 设计规范](#六api-设计规范)
7. [数据访问层设计](#七数据访问层设计)
8. [中间件设计](#八中间件设计)
9. [错误处理规范](#九错误处理规范)
10. [日志规范](#十日志规范)
11. [安全规范](#十一安全规范)
12. [测试规范](#十二测试规范)
13. [构建与部署](#十三构建与部署)
14. [附录](#十四附录)

---

## 一、架构概述

### 1.1 目标

本架构标准旨在提供一套**可复用、可扩展、标准化**的后端服务架构规范，使开发团队能够快速创建高质量的后端服务。适用于：

- ✅ RESTful API 服务
- ✅ GraphQL API 服务
- ✅ 微服务架构
- ✅ Serverless 函数
- ✅ 后台任务处理服务
- ✅ 实时通信服务 (WebSocket)

### 1.2 架构特点

| 特点 | 描述 | 价值 |
|------|------|------|
| **分层架构** | Controller → Service → Repository → Entity | 职责清晰，易于维护 |
| **模块化设计** | 按业务领域划分模块 | 高内聚低耦合 |
| **类型安全** | TypeScript 严格模式 | 编译期错误检测 |
| **可测试性** | 依赖注入，接口抽象 | 易于单元测试 |
| **可扩展性** | 水平扩展友好 | 支持高并发 |

### 1.3 服务类型

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              服务类型                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  类型一：独立微服务                                                              │
│  ├── 场景：业务独立、团队自治、独立部署                                          │
│  ├── 部署：Docker、Kubernetes、Serverless                                       │
│  └── 示例：用户服务、订单服务、支付服务                                          │
│                                                                                  │
│  类型二：API 网关服务                                                            │
│  ├── 场景：统一入口、路由转发、认证鉴权                                          │
│  ├── 部署：Docker、Kubernetes                                                   │
│  └── 示例：BFF 层、API Gateway                                                  │
│                                                                                  │
│  类型三：后台任务服务                                                            │
│  ├── 场景：定时任务、消息消费、数据处理                                          │
│  ├── 部署：Docker、Kubernetes、PM2                                              │
│  └── 示例：数据同步、报表生成、消息推送                                          │
│                                                                                  │
│  类型四：共享库包                                                                │
│  ├── 场景：公共逻辑复用、工具函数                                                │
│  ├── 部署：npm publish、私有仓库                                                │
│  └── 示例：工具库、SDK、中间件                                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心设计原则

### 2.1 SOLID 原则

| 原则 | 描述 | 实践方式 |
|------|------|----------|
| **单一职责 (SRP)** | 每个模块只负责一个功能域 | Controller 只处理请求响应，Service 处理业务逻辑 |
| **开闭原则 (OCP)** | 对扩展开放，对修改关闭 | 策略模式、插件机制 |
| **里氏替换 (LSP)** | 子类可替换父类 | 接口编程、依赖抽象 |
| **接口隔离 (ISP)** | 使用多个专用接口 | 细粒度接口设计 |
| **依赖倒置 (DIP)** | 依赖抽象而非具体实现 | 依赖注入、控制反转 |

### 2.2 分层架构原则

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              后端分层架构                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           表现层 (Presentation Layer)                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Controllers / Routes / GraphQL Resolvers                       │   │   │
│  │  │  - 请求验证                                                      │   │   │
│  │  │  - 响应格式化                                                    │   │   │
│  │  │  - 认证授权检查                                                  │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           业务层 (Business Layer)                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Services / Use Cases / Domain Logic                            │   │   │
│  │  │  - 业务规则验证                                                  │   │   │
│  │  │  - 事务管理                                                      │   │   │
│  │  │  - 领域事件发布                                                  │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           数据访问层 (Data Access Layer)                  │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Repositories / Data Mappers / ORM Models                       │   │   │
│  │  │  - 数据持久化                                                    │   │   │
│  │  │  - 查询构建                                                      │   │   │
│  │  │  - 缓存管理                                                      │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           基础设施层 (Infrastructure Layer)              │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Database / Cache / Message Queue / External APIs               │   │   │
│  │  │  - 数据库连接                                                    │   │   │
│  │  │  - 缓存服务                                                      │   │   │
│  │  │  - 消息队列                                                      │   │   │
│  │  │  - 外部 API 调用                                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  依赖方向：自顶向下，禁止反向依赖                                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 模块划分原则

| 原则 | 描述 | 检查清单 |
|------|------|----------|
| **按领域划分** | 按业务领域组织模块 | 每个模块对应一个业务领域 |
| **高内聚** | 相关功能聚集在同一模块 | 模块内部调用频繁 |
| **低耦合** | 模块间依赖最小化 | 通过接口通信 |
| **独立部署** | 模块可独立部署 | 无循环依赖 |

---

## 三、技术栈规范

### 3.1 包管理与构建工具（必选）

| 技术 | 版本范围 | 用途 | 说明 |
|------|----------|------|------|
| **pnpm** | ^9.0.0 | 包管理器 | 高效磁盘利用，严格依赖管理，Monorepo 原生支持 |
| **TypeScript** | ^5.9.0 | 类型系统 | 严格模式，完整类型支持 |
| **tsup** | ^8.0.0 | 构建工具 | 零配置 TypeScript 构建工具 |

#### pnpm 包管理器

本项目使用 **pnpm** 作为包管理器：

```bash
# 安装 pnpm
npm install -g pnpm

# 安装依赖
pnpm install

# 添加依赖
pnpm add <package>

# 添加开发依赖
pnpm add -D <package>

# 按包安装依赖
pnpm --filter sdkwork-react-backend-xxx add <dependency>

# 运行脚本
pnpm --filter sdkwork-react-backend-xxx dev

# 发布包
pnpm publish
```

### 3.2 运行时环境（必选）

| 技术 | 版本范围 | 用途 | 说明 |
|------|----------|------|------|
| **Node.js** | >=20.0.0 | 运行时 | LTS 版本，支持最新 ES 特性 |

### 3.3 Web 框架（必选其一）

| 框架 | 版本 | 适用场景 | 说明 |
|------|------|----------|------|
| **Fastify** | ^5.0.0 | 推荐，高性能 | 插件生态，Schema 验证 |
| **Express** | ^4.21.0 | 传统项目 | 成熟稳定，生态丰富 |
| **NestJS** | ^11.0.0 | 企业级应用 | 完整框架，依赖注入 |
| **Koa** | ^2.15.0 | 轻量级 | 中间件机制灵活 |

### 3.4 数据库（按需选择）

| 数据库 | 版本 | 适用场景 | ORM/驱动 |
|--------|------|----------|----------|
| **PostgreSQL** | >=16 | 关系型数据 | Prisma / TypeORM / Drizzle |
| **MySQL** | >=8.0 | 关系型数据 | Prisma / TypeORM |
| **MongoDB** | >=7.0 | 文档型数据 | Mongoose |
| **Redis** | >=7.0 | 缓存/会话 | ioredis |

### 3.5 消息队列（按需选择）

| 队列 | 版本 | 适用场景 | 说明 |
|------|------|----------|------|
| **RabbitMQ** | >=3.12 | 可靠消息传递 | AMQP 协议 |
| **Redis** | >=7.0 | 简单队列 | BullMQ |
| **Kafka** | >=3.6 | 高吞吐量 | kafka.js |

### 3.6 工具库（推荐）

```json
{
  "dependencies": {
    "zod": "^3.24.0",
    "date-fns": "^4.0.0",
    "uuid": "^11.0.0",
    "lodash-es": "^4.17.21",
    "pino": "^9.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vitest": "^2.0.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 四、分层架构设计

### 4.1 分层职责定义

| 层级 | 职责 | 依赖方向 | 示例 |
|------|------|----------|------|
| **表现层** | 请求处理、响应格式化 | 依赖业务层 | Controllers, Routes |
| **业务层** | 业务逻辑、事务管理 | 依赖数据访问层 | Services, Use Cases |
| **数据访问层** | 数据持久化、查询 | 依赖基础设施层 | Repositories, Mappers |
| **基础设施层** | 外部服务集成 | 无依赖 | Database, Cache, Queue |

### 4.2 依赖注入

```typescript
// src/container/index.ts
import { Container, injectable, inject } from 'inversify';

export const TYPES = {
  UserService: Symbol.for('UserService'),
  UserRepository: Symbol.for('UserRepository'),
  Database: Symbol.for('Database'),
  Cache: Symbol.for('Cache'),
  Logger: Symbol.for('Logger'),
};

export const container = new Container();

// 绑定依赖
container.bind(TYPES.Database).to(Database).inSingletonScope();
container.bind(TYPES.Cache).to(RedisCache).inSingletonScope();
container.bind(TYPES.Logger).to(PinoLogger).inSingletonScope();
container.bind(TYPES.UserRepository).to(UserRepositoryImpl);
container.bind(TYPES.UserService).to(UserServiceImpl);
```

### 4.3 跨层通信模式

```typescript
// 表现层 - Controller
@injectable()
export class UserController {
  constructor(
    @inject(TYPES.UserService) private userService: UserService
  ) {}

  async getUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const user = await this.userService.getUserById(id);
    return reply.send({ success: true, data: user });
  }
}

// 业务层 - Service
export interface UserService {
  getUserById(id: string): Promise<User | null>;
  createUser(data: CreateUserDTO): Promise<User>;
}

@injectable()
export class UserServiceImpl implements UserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async getUserById(id: string): Promise<User | null> {
    this.logger.info('Getting user by id', { id });
    return this.userRepo.findById(id);
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const user = await this.userRepo.create(data);
    this.logger.info('User created', { userId: user.id });
    return user;
  }
}

// 数据访问层 - Repository
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<void>;
}

@injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @inject(TYPES.Database) private db: Database
  ) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const result = await this.db.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [data.email, data.name, data.passwordHash]
    );
    return result.rows[0];
  }
}
```

---

## 五、包结构规范

### 5.1 包命名规范

**包命名规范**：后端项目统一使用 `sdkwork-react-backend-` 前缀

| 层级 | 包名格式 | 示例 |
|------|----------|------|
| Layer 0 | `sdkwork-react-backend-{name}` | `sdkwork-react-backend-core` |
| Layer 1 | `sdkwork-react-backend-{name}` | `sdkwork-react-backend-commons` |
| Layer 2 | `sdkwork-react-backend-{name}` | `sdkwork-react-backend-auth` |
| Layer 3 | `sdkwork-react-backend-{name}` | `sdkwork-react-backend-user` |

### 5.2 单包结构

```
sdkwork-react-backend-xxx/
├── src/
│   ├── index.ts                  # 公共 API 导出
│   ├── controllers/              # 控制器层
│   │   ├── index.ts
│   │   └── XxxController.ts
│   ├── services/                 # 服务层
│   │   ├── index.ts
│   │   ├── XxxService.ts
│   │   └── interfaces/
│   │       └── IXxxService.ts
│   ├── repositories/             # 数据访问层
│   │   ├── index.ts
│   │   ├── XxxRepository.ts
│   │   └── interfaces/
│   │       └── IXxxRepository.ts
│   ├── entities/                 # 实体定义
│   │   ├── index.ts
│   │   └── XxxEntity.ts
│   ├── dto/                      # 数据传输对象
│   │   ├── index.ts
│   │   ├── CreateXxxDTO.ts
│   │   ├── UpdateXxxDTO.ts
│   │   └── XxxResponseDTO.ts
│   ├── routes/                   # 路由定义
│   │   ├── index.ts
│   │   └── xxxRoutes.ts
│   ├── middlewares/              # 中间件
│   │   ├── index.ts
│   │   └── xxxMiddleware.ts
│   ├── validators/               # 验证器
│   │   ├── index.ts
│   │   └── xxxValidator.ts
│   ├── types/                    # 类型定义
│   │   └── index.ts
│   ├── constants/                # 常量定义
│   │   └── index.ts
│   ├── utils/                    # 工具函数
│   │   └── index.ts
│   └── container/                # 依赖注入容器
│       ├── index.ts
│       └── types.ts
│
├── tests/                        # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/                       # Prisma Schema (可选)
│   └── schema.prisma
│
├── dist/                         # 构建产物
├── package.json
├── tsconfig.json
├── tsup.config.ts                # 构建配置
├── .env.example                  # 环境变量示例
├── .env                          # 环境变量 (gitignore)
└── README.md
```

### 5.3 示例项目目录结构

```
sdkwork-backend-monorepo/
├── packages/                         # 所有包目录
│   │
│   ├── sdkwork-react-backend-core/   # 核心包 (Layer 0)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── container/            # 依赖注入核心
│   │   │   │   ├── index.ts
│   │   │   │   └── types.ts
│   │   │   ├── logger/               # 日志服务
│   │   │   │   ├── index.ts
│   │   │   │   ├── Logger.ts
│   │   │   │   └── PinoLogger.ts
│   │   │   ├── config/               # 配置管理
│   │   │   │   ├── index.ts
│   │   │   │   └── ConfigService.ts
│   │   │   ├── database/             # 数据库核心
│   │   │   │   ├── index.ts
│   │   │   │   ├── Database.ts
│   │   │   │   └── PostgresDatabase.ts
│   │   │   ├── cache/                # 缓存核心
│   │   │   │   ├── index.ts
│   │   │   │   ├── Cache.ts
│   │   │   │   └── RedisCache.ts
│   │   │   └── errors/               # 错误定义
│   │   │       ├── index.ts
│   │   │       ├── AppError.ts
│   │   │       ├── ValidationError.ts
│   │   │       └── NotFoundError.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sdkwork-react-backend-commons/ # 通用包 (Layer 1)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── middlewares/          # 通用中间件
│   │   │   │   ├── index.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── requestLogger.ts
│   │   │   │   ├── rateLimiter.ts
│   │   │   │   └── cors.ts
│   │   │   ├── validators/           # 通用验证器
│   │   │   │   ├── index.ts
│   │   │   │   ├── common.ts
│   │   │   │   └── pagination.ts
│   │   │   ├── utils/                # 工具函数
│   │   │   │   ├── index.ts
│   │   │   │   ├── hash.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   └── pagination.ts
│   │   │   └── types/                # 通用类型
│   │   │       ├── index.ts
│   │   │       ├── ApiResponse.ts
│   │   │       └── Pagination.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sdkwork-react-backend-auth/   # 认证包 (Layer 2)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── controllers/
│   │   │   │   ├── index.ts
│   │   │   │   ├── AuthController.ts
│   │   │   │   └── TokenController.ts
│   │   │   ├── services/
│   │   │   │   ├── index.ts
│   │   │   │   ├── AuthService.ts
│   │   │   │   ├── TokenService.ts
│   │   │   │   └── interfaces/
│   │   │   ├── repositories/
│   │   │   │   ├── index.ts
│   │   │   │   ├── TokenRepository.ts
│   │   │   │   └── interfaces/
│   │   │   ├── entities/
│   │   │   │   ├── index.ts
│   │   │   │   ├── Token.ts
│   │   │   │   └── Session.ts
│   │   │   ├── dto/
│   │   │   │   ├── index.ts
│   │   │   │   ├── LoginDTO.ts
│   │   │   │   ├── RegisterDTO.ts
│   │   │   │   └── TokenResponseDTO.ts
│   │   │   ├── routes/
│   │   │   │   ├── index.ts
│   │   │   │   └── authRoutes.ts
│   │   │   └── middlewares/
│   │   │       ├── index.ts
│   │   │       └── authMiddleware.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sdkwork-react-backend-user/   # 用户包 (Layer 3)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── controllers/
│   │   │   │   ├── index.ts
│   │   │   │   ├── UserController.ts
│   │   │   │   └── ProfileController.ts
│   │   │   ├── services/
│   │   │   │   ├── index.ts
│   │   │   │   ├── UserService.ts
│   │   │   │   ├── ProfileService.ts
│   │   │   │   └── interfaces/
│   │   │   ├── repositories/
│   │   │   │   ├── index.ts
│   │   │   │   ├── UserRepository.ts
│   │   │   │   └── interfaces/
│   │   │   ├── entities/
│   │   │   │   ├── index.ts
│   │   │   │   ├── User.ts
│   │   │   │   └── Profile.ts
│   │   │   ├── dto/
│   │   │   │   ├── index.ts
│   │   │   │   ├── CreateUserDTO.ts
│   │   │   │   ├── UpdateUserDTO.ts
│   │   │   │   └── UserResponseDTO.ts
│   │   │   ├── routes/
│   │   │   │   ├── index.ts
│   │   │   │   └── userRoutes.ts
│   │   │   └── validators/
│   │   │       ├── index.ts
│   │   │       └── userValidator.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ...                           # 其他业务包
│
├── apps/                             # 独立应用目录
│   ├── api-gateway/                  # API 网关
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── app.ts
│   │   │   └── routes/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── worker/                       # 后台任务
│       ├── src/
│       │   ├── index.ts
│       │   └── jobs/
│       ├── package.json
│       └── tsconfig.json
│
├── prisma/                           # Prisma 全局 Schema
│   └── schema.prisma
│
├── pnpm-workspace.yaml               # pnpm 工作区配置
├── package.json                      # 根 package.json
├── tsconfig.json                     # 根 TypeScript 配置
├── .npmrc                            # npm 配置
├── docker-compose.yml                # Docker 编排
└── README.md                         # 项目文档
```

### 5.4 pnpm-workspace.yaml 配置

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### 5.5 根 package.json 配置

```json
{
  "name": "sdkwork-backend-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter sdkwork-react-backend-user dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "clean": "pnpm -r clean",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "tsup": "^8.0.0",
    "prisma": "^6.0.0",
    "vitest": "^2.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

---

## 六、API 设计规范

### 6.1 RESTful API 规范

| 方法 | 路径 | 描述 | 示例 |
|------|------|------|------|
| GET | /users | 获取用户列表 | 列表查询 |
| GET | /users/:id | 获取单个用户 | 详情查询 |
| POST | /users | 创建用户 | 新增资源 |
| PUT | /users/:id | 更新用户（全量） | 全量更新 |
| PATCH | /users/:id | 更新用户（部分） | 部分更新 |
| DELETE | /users/:id | 删除用户 | 删除资源 |

### 6.2 路由定义

```typescript
// src/routes/userRoutes.ts
import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middlewares/authMiddleware';
import { createUserSchema, updateUserSchema } from '../validators/userValidator';

export async function userRoutes(
  fastify: FastifyInstance,
  options: { controller: UserController }
) {
  const { controller } = options;

  fastify.get('/users', {
    preHandler: [authenticate],
    handler: controller.list.bind(controller),
  });

  fastify.get('/users/:id', {
    preHandler: [authenticate],
    handler: controller.getById.bind(controller),
  });

  fastify.post('/users', {
    schema: createUserSchema,
    handler: controller.create.bind(controller),
  });

  fastify.put('/users/:id', {
    preHandler: [authenticate],
    schema: updateUserSchema,
    handler: controller.update.bind(controller),
  });

  fastify.delete('/users/:id', {
    preHandler: [authenticate],
    handler: controller.delete.bind(controller),
  });
}
```

### 6.3 请求验证

```typescript
// src/validators/userValidator.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const createUserSchema = {
  body: zodToJsonSchema(
    z.object({
      email: z.string().email('Invalid email format'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    })
  ),
};

export const updateUserSchema = {
  body: zodToJsonSchema(
    z.object({
      name: z.string().min(2).optional(),
      avatar: z.string().url().optional(),
    })
  ),
};

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### 6.4 响应格式

```typescript
// src/types/ApiResponse.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 使用示例
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return { success: false, error: { code, message, details } };
}

export function paginatedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data: items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

---

## 七、数据访问层设计

### 7.1 Repository 接口

```typescript
// src/repositories/interfaces/IUserRepository.ts
import { User } from '../../entities/User';
import { CreateUserDTO, UpdateUserDTO } from '../../dto';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options: FindAllOptions): Promise<PaginatedResult<User>>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export interface FindAllOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 7.2 Repository 实现

```typescript
// src/repositories/UserRepository.ts
import { injectable, inject } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { IUserRepository, FindAllOptions, PaginatedResult } from './interfaces/IUserRepository';
import { User } from '../entities/User';
import { CreateUserDTO, UpdateUserDTO } from '../dto';
import { TYPES } from '../container/types';

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.toEntity(user) : null;
  }

  async findAll(options: FindAllOptions): Promise<PaginatedResult<User>> {
    const { page, pageSize, sortBy = 'createdAt', sortOrder = 'desc', filter } = options;
    
    const where = filter ? this.buildWhere(filter) : {};
    
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(this.toEntity),
      total,
      page,
      pageSize,
    };
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
      },
    });
    return this.toEntity(user);
  }

  async update(id: string, data: UpdateUserDTO): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.toEntity(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  private toEntity(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      avatar: prismaUser.avatar,
      role: prismaUser.role,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }

  private buildWhere(filter: Record<string, unknown>) {
    return Object.entries(filter).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
  }
}
```

### 7.3 Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  avatar       String?
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  sessions Session[]
  tokens   Token[]

  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  token        String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Token {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  type      TokenType
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("tokens")
}

enum Role {
  ADMIN
  USER
  GUEST
}

enum TokenType {
  VERIFICATION
  PASSWORD_RESET
  REFRESH
}
```

---

## 八、中间件设计

### 8.1 错误处理中间件

```typescript
// src/middlewares/errorHandler.ts
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/AppError';
import { ValidationError } from '../errors/ValidationError';
import { NotFoundError } from '../errors/NotFoundError';
import { Logger } from '../logger';

export function errorHandler(logger: Logger) {
  return async (
    error: FastifyError | Error,
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    });

    if (error instanceof ValidationError) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details,
        },
      });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    if ('validation' in error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation,
        },
      });
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  };
}
```

### 8.2 请求日志中间件

```typescript
// src/middlewares/requestLogger.ts
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { Logger } from '../logger';

export function requestLogger(logger: Logger) {
  return (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    const startTime = Date.now();

    reply.raw.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });
    });

    done();
  };
}
```

### 8.3 认证中间件

```typescript
// src/middlewares/authMiddleware.ts
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../errors/AppError';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    request.user = payload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(request.user.role)) {
      throw new UnauthorizedError('Insufficient permissions');
    }
  };
}
```

### 8.4 限流中间件

```typescript
// src/middlewares/rateLimiter.ts
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

export async function setupRateLimiter(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : undefined,
    keyGenerator: (request) => {
      return request.user?.id || request.ip;
    },
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    }),
  });
}
```

---

## 九、错误处理规范

### 9.1 错误类型定义

```typescript
// src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// src/errors/ValidationError.ts
export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

// src/errors/NotFoundError.ts
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

// src/errors/UnauthorizedError.ts
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

// src/errors/ForbiddenError.ts
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

// src/errors/ConflictError.ts
export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
  }
}
```

### 9.2 错误码规范

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| RATE_LIMIT_EXCEEDED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

---

## 十、日志规范

### 10.1 日志配置

```typescript
// src/logger/PinoLogger.ts
import pino, { Logger } from 'pino';
import { injectable } from 'inversify';

export interface ILogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

@injectable()
export class PinoLogger implements ILogger {
  private logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: process.env.SERVICE_NAME || 'backend',
        env: process.env.NODE_ENV,
      },
    });
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(data || {}, message);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(data || {}, message);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(data || {}, message);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.logger.error(data || {}, message);
  }
}
```

### 10.2 日志级别使用

| 级别 | 使用场景 |
|------|----------|
| debug | 开发调试信息 |
| info | 正常业务流程日志 |
| warn | 警告信息，不影响业务 |
| error | 错误信息，需要关注 |
| fatal | 严重错误，服务不可用 |

### 10.3 敏感信息脱敏

```typescript
// src/utils/sanitize.ts
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'secret', 'apiKey'];

export function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    )) {
      result[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitize(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}
```

---

## 十一、安全规范

### 11.1 密码处理

```typescript
// src/utils/hash.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 11.2 JWT 处理

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
```

### 11.3 输入验证

```typescript
// src/validators/common.ts
import { z } from 'zod';

export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().min(2).max(100);
export const idSchema = z.string().cuid();

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<[^>]*>/g, '');
};
```

### 11.4 安全头配置

```typescript
// src/middlewares/securityHeaders.ts
import helmet from '@fastify/helmet';
import { FastifyInstance } from 'fastify';

export async function setupSecurityHeaders(app: FastifyInstance) {
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });
}
```

---

## 十二、测试规范

### 12.1 测试结构

```
tests/
├── unit/                    # 单元测试
│   ├── services/
│   │   └── UserService.test.ts
│   ├── repositories/
│   │   └── UserRepository.test.ts
│   └── utils/
│       └── hash.test.ts
│
├── integration/             # 集成测试
│   ├── controllers/
│   │   └── UserController.test.ts
│   └── repositories/
│       └── UserRepository.integration.test.ts
│
└── e2e/                     # 端到端测试
    └── api/
        └── users.test.ts
```

### 12.2 单元测试示例

```typescript
// tests/unit/services/UserService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserServiceImpl } from '../../../src/services/UserServiceImpl';
import { IUserRepository } from '../../../src/repositories/interfaces/IUserRepository';
import { Logger } from '../../../src/logger';

describe('UserService', () => {
  let userService: UserServiceImpl;
  let mockRepo: IUserRepository;
  let mockLogger: Logger;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    userService = new UserServiceImpl(mockRepo, mockLogger);
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
      vi.mocked(mockRepo.findById).mockResolvedValue(mockUser);

      const result = await userService.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockRepo.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      const result = await userService.getUserById('999');

      expect(result).toBeNull();
    });
  });
});
```

### 12.3 集成测试示例

```typescript
// tests/integration/controllers/UserController.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../src/app';
import { FastifyInstance } from 'fastify';

describe('UserController (integration)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return list of users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          email: 'new@example.com',
          name: 'New User',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.email).toBe('new@example.com');
    });
  });
});
```

---

## 十三、构建与部署

### 13.1 构建配置

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ['pg', 'redis', 'bull'],
});
```

### 13.2 Docker 配置

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build
RUN pnpm prisma generate

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 13.3 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

### 13.4 CI/CD 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm prisma generate

      - run: pnpm typecheck

      - run: pnpm lint

      - run: pnpm build

      - run: pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
```

---

## 十四、附录

### 14.1 检查清单

#### 新包创建检查清单

- [ ] 目录结构完整
- [ ] package.json 配置正确
- [ ] TypeScript 配置完成
- [ ] 入口文件导出完整
- [ ] Repository 接口定义
- [ ] Service 接口定义
- [ ] DTO 类型定义
- [ ] 错误处理完善
- [ ] 单元测试编写
- [ ] README 文档编写

#### 发布前检查清单

- [ ] 类型检查通过
- [ ] 代码检查通过
- [ ] 测试全部通过
- [ ] 构建成功
- [ ] 版本号已更新
- [ ] 环境变量检查
- [ ] 安全审计通过

### 14.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 数据库连接失败 | 环境变量未配置 | 检查 DATABASE_URL |
| 依赖注入失败 | 容器未初始化 | 检查 container.bind |
| 类型错误 | 类型未导出 | 检查 index.ts 导出 |
| 测试失败 | 数据库未连接 | 配置测试数据库 |

### 14.3 参考资源

- [Node.js 官方文档](https://nodejs.org/)
- [Fastify 官方文档](https://fastify.dev/)
- [Prisma 官方文档](https://www.prisma.io/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vitest 官方文档](https://vitest.dev/)

---

**文档版本**: v1.0  
**最后更新**: 2026 年 2 月 21 日  
**维护者**: SDKWork Team
