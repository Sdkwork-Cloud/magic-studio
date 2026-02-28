# Nginx 配置管理文档

## 目录结构

```
etc/nginx/nginx.conf/
├── README.md                          # 本文档
├── sites-enabled/                     # 站点配置文件目录
│   ├── sdkwork/                       # sdkwork 项目配置
│   │   ├── www.sdkwork.com.conf
│   │   ├── console.sdkwork.com.conf
│   │   ├── admin.sdkwork.com.conf
│   │   ├── api.sdkwork.com.conf
│   │   ├── chat.sdkwork.com.conf
│   │   ├── agents.sdkwork.com.conf
│   │   ├── studio.sdkwork.com.conf
│   │   ├── manager.sdkwork.com.conf
│   │   ├── openchat.sdkwork.com.conf
│   │   ├── notary.sdkwork.com.conf
│   │   ├── iot.sdkwork.com.conf
│   │   ├── game.sdkwork.com.conf
│   │   └── chess.sdkwork.com.conf
│   └── noaper/                        # noaper 项目配置
│       ├── www.noaper.com.conf
│       ├── admin.noaper.com.conf
│       ├── api.noaper.com.conf
│       ├── console.noaper.com.conf
│       ├── chat.noaper.com.conf
│       ├── clip.noaper.com.conf
│       ├── mp.noaper.com.conf
│       ├── lanshan.noaper.com.conf
│       ├── llm.noaper.com.conf
│       ├── nacos.noaper.com.conf
│       ├── open.noaper.com.conf
│       ├── proxy.noaper.com.conf
│       ├── res.noaper.com.conf
│       └── apff.noaper.com.conf
```

## 快速开始

### 1. 使用部署脚本

```bash
# 部署 backend.sdkwork.com
./bin/nginx-deploy.sh backend.sdkwork.com

# 部署到指定环境
./bin/nginx-deploy.sh backend.sdkwork.com --env dev

# 部署并自动重载 Nginx
./bin/nginx-deploy.sh backend.sdkwork.com --reload

# 仅生成配置，不部署
./bin/nginx-deploy.sh backend.sdkwork.com --dry-run
```

### 2. 使用构建脚本

```bash
# 完整构建并部署
./bin/build.sh

# 构建开发环境
./bin/build.sh --env dev

# 构建并指定域名
./bin/build.sh --env prod --domain api.sdkwork.com

# 构建、部署并重载
./bin/build.sh --env prod --domain backend.sdkwork.com --reload

# 仅构建，不部署
./bin/build.sh --no-deploy

# 构建并分析包大小
./bin/build.sh --analyze
```

## 配置文件说明

### 域名命名规则

配置文件按照以下规则组织：

```
sites-enabled/{project}/{subdomain}.{domain}.{tld}.conf
```

例如：
- `sites-enabled/sdkwork/backend.sdkwork.com.conf`
- `sites-enabled/noaper/api.noaper.com.conf`

### 环境支持

支持以下环境：
- `dev` - 开发环境
- `test` - 测试环境
- `beta` - 预发布环境
- `pre` - 预生产环境
- `prod` - 生产环境（默认）

通过子域名前缀区分环境：
- `backend-dev.sdkwork.com` → dev 环境
- `backend-test.sdkwork.com` → test 环境
- `backend.sdkwork.com` → prod 环境

### 配置模板

生成的 Nginx 配置包含以下特性：

1. **HTTPS 支持** - 自动配置 SSL 证书
2. **HTTP 跳转** - 80 端口自动跳转到 443
3. **Gzip 压缩** - 静态资源自动压缩
4. **CORS 支持** - `/libs/` 路径跨域支持
5. **SPA 路由** - 单页应用路由支持
6. **静态缓存** - 30天静态资源缓存
7. **DNS 验证** - `.txt` 文件验证支持
8. **移动端适配** - User-Agent 检测

## 脚本详细说明

### nginx-deploy.sh

用于生成和部署 Nginx 配置文件。

**用法：**
```bash
./nginx-deploy.sh <domain> [options]
```

**参数：**
- `domain` - 要部署的域名（必需）

**选项：**
- `-e, --env` - 环境名称（默认: prod）
- `-p, --project` - 项目名称（默认: sdkwork）
- `-d, --dist` - 构建输出目录（默认: ./dist）
- `-n, --dry-run` - 仅生成配置，不部署
- `-f, --force` - 强制覆盖现有配置
- `-r, --reload` - 部署后自动重载 Nginx
- `-h, --help` - 显示帮助信息

**示例：**
```bash
# 基本部署
./nginx-deploy.sh backend.sdkwork.com

# 指定项目和环境
./nginx-deploy.sh api.sdkwork.com --env test --project sdkwork

# 完整部署流程
./nginx-deploy.sh console.sdkwork.com --env prod --project sdkwork --reload
```

### build.sh

用于构建项目并准备部署。

**用法：**
```bash
./build.sh [options]
```

**选项：**
- `-e, --env` - 构建环境（默认: prod）
- `-d, --domain` - 部署域名（默认: backend.sdkwork.com）
- `-p, --project` - 项目名称（默认: sdkwork）
- `-o, --output` - 输出目录（默认: ./dist）
- `-n, --no-deploy` - 仅构建，不部署
- `-r, --reload` - 构建并部署后重载 Nginx
- `-c, --clean` - 构建前清理输出目录
- `-a, --analyze` - 构建后分析包大小
- `-h, --help` - 显示帮助信息

**示例：**
```bash
# 标准构建流程
./build.sh

# 开发环境构建
./build.sh --env dev

# 生产环境完整部署
./build.sh --env prod --domain backend.sdkwork.com --reload

# 仅构建分析
./build.sh --no-deploy --analyze
```

## 手动配置

### 1. 创建配置文件

```bash
# 创建项目目录
mkdir -p sites-enabled/myproject

# 复制模板
cp sites-enabled/sdkwork/www.sdkwork.com.conf sites-enabled/myproject/backend.myproject.com.conf

# 编辑配置
vim sites-enabled/myproject/backend.myproject.com.conf
```

### 2. 部署到系统

```bash
# 复制到 Nginx 配置目录
sudo cp sites-enabled/myproject/backend.myproject.com.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo nginx -s reload
```

## 证书配置

SSL 证书路径：
```
/opt/certs/letsencrypt/live/{domain}/
├── fullchain.pem    # 证书链
└── privkey.pem      # 私钥
```

确保证书文件存在且权限正确：
```bash
# 检查证书
ls -la /opt/certs/letsencrypt/live/sdkwork.com/

# 修复权限
sudo chmod 644 /opt/certs/letsencrypt/live/sdkwork.com/fullchain.pem
sudo chmod 600 /opt/certs/letsencrypt/live/sdkwork.com/privkey.pem
```

## 故障排查

### 1. 配置测试失败

```bash
# 检查语法错误
sudo nginx -t

# 查看详细错误信息
sudo nginx -t 2>&1
```

### 2. 证书错误

```bash
# 检查证书是否存在
ls -la /opt/certs/letsencrypt/live/{domain}/

# 重新申请证书
certbot certonly -d {domain}
```

### 3. 权限问题

```bash
# 检查 Nginx 用户
ps aux | grep nginx

# 修复文件权限
sudo chown -R www-data:www-data /opt/aisource/
sudo chmod -R 755 /opt/aisource/
```

### 4. 路径问题

```bash
# 检查构建输出目录
ls -la ./dist/{env}/

# 检查 Nginx 根路径
ls -la /opt/aisource/{project}/dist/{env}/
```

## 最佳实践

1. **使用脚本部署** - 优先使用 `nginx-deploy.sh` 和 `build.sh` 脚本
2. **版本控制** - 所有配置文件纳入版本控制
3. **环境隔离** - 不同环境使用不同的域名前缀
4. **备份配置** - 修改前备份现有配置
5. **测试验证** - 部署前使用 `--dry-run` 测试
6. **监控日志** - 定期检查 Nginx 错误日志

## 相关链接

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Let's Encrypt 证书管理](https://certbot.eff.org/)
- [项目主页](https://github.com/sdkwork/sdkwork-backend-react-web)

## 更新日志

### 2024-01-20
- 初始版本
- 添加 nginx-deploy.sh 部署脚本
- 添加 build.sh 构建脚本
- 添加 README.md 文档
