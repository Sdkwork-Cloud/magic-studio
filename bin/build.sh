#!/bin/bash

# =============================================================================
# SDKWork React Backend Web 打包脚本
# 用于构建项目并准备部署文件
#
# 用法: ./build.sh [options]
# 示例: ./build.sh
#       ./build.sh --env prod --domain backend.sdkwork.com
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEFAULT_ENV="prod"
DEFAULT_DOMAIN="backend.sdkwork.com"
DEFAULT_PROJECT="sdkwork"
DIST_DIR="$PROJECT_ROOT/dist"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 打印帮助信息
show_help() {
    cat << EOF
SDKWork React Backend Web 打包脚本

用法: $0 [options]

选项:
    -e, --env       构建环境 (默认: prod)
                    可选值: dev, test, beta, pre, prod
    -d, --domain    部署域名 (默认: backend.sdkwork.com)
    -p, --project   项目名称 (默认: sdkwork)
    -o, --output    输出目录 (默认: $DIST_DIR)
    -n, --no-deploy 仅构建，不部署
    -r, --reload    构建并部署后重载 Nginx
    -c, --clean     构建前清理输出目录
    -a, --analyze   构建后分析包大小
    -h, --help      显示帮助信息

示例:
    $0                              # 使用默认配置构建
    $0 --env dev                    # 构建开发环境版本
    $0 --env prod --domain api.sdkwork.com
    $0 -e test -d backend-dev.sdkwork.com -r

EOF
}

# 检查依赖
check_dependencies() {
    log_step "检查依赖"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "未找到 Node.js，请先安装"
        exit 1
    fi
    
    local node_version=$(node --version)
    log_info "Node.js 版本: $node_version"
    
    # 检查 pnpm/npm
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
        log_info "使用包管理器: pnpm"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
        log_info "使用包管理器: npm"
    else
        log_error "未找到 pnpm 或 npm"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 安装依赖
install_dependencies() {
    log_step "安装依赖"
    
    cd "$PROJECT_ROOT"
    
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi
    
    log_success "依赖安装完成"
}

# 清理输出目录
clean_output() {
    log_step "清理输出目录"
    
    if [ -d "$DIST_DIR" ]; then
        rm -rf "$DIST_DIR"/*
        log_info "已清理: $DIST_DIR"
    else
        mkdir -p "$DIST_DIR"
        log_info "创建目录: $DIST_DIR"
    fi
    
    log_success "清理完成"
}

# 构建项目
build_project() {
    local env="$1"
    
    log_step "构建项目 (环境: $env)"
    
    cd "$PROJECT_ROOT"
    
    # 设置环境变量
    export NODE_ENV="$env"
    
    # 执行构建
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm run build
    else
        npm run build
    fi
    
    log_success "构建完成"
}

# 复制构建产物到环境目录
prepare_deploy() {
    local env="$1"
    local project="$2"
    
    log_step "准备部署文件"
    
    # 创建环境目录
    local env_dir="$DIST_DIR/$env"
    mkdir -p "$env_dir"
    
    # 查找构建输出目录
    local build_output=""
    
    # 检查常见的构建输出目录
    if [ -d "$PROJECT_ROOT/dist" ] && [ "$(ls -A "$PROJECT_ROOT/dist" 2>/dev/null)" ]; then
        build_output="$PROJECT_ROOT/dist"
    elif [ -d "$PROJECT_ROOT/build" ]; then
        build_output="$PROJECT_ROOT/build"
    elif [ -d "$PROJECT_ROOT/packages/sdkwork-react-backend-ui/dist" ]; then
        build_output="$PROJECT_ROOT/packages/sdkwork-react-backend-ui/dist"
    fi
    
    if [ -z "$build_output" ]; then
        log_error "未找到构建输出目录"
        exit 1
    fi
    
    log_info "构建输出目录: $build_output"
    
    # 复制文件到环境目录
    cp -r "$build_output"/* "$env_dir/"
    
    # 创建版本信息文件
    cat > "$env_dir/version.json" << EOF
{
  "project": "$project",
  "environment": "$env",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildDate": "$(date +"%Y-%m-%d %H:%M:%S")",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF
    
    log_success "部署文件准备完成: $env_dir"
}

# 分析包大小
analyze_bundle() {
    log_step "分析包大小"
    
    local env_dir="$DIST_DIR/$1"
    
    if [ ! -d "$env_dir" ]; then
        log_warn "未找到构建目录: $env_dir"
        return
    fi
    
    log_info "目录大小:"
    du -sh "$env_dir" 2>/dev/null || log_warn "无法计算目录大小"
    
    log_info "主要文件大小:"
    find "$env_dir" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec ls -lh {} \; 2>/dev/null | awk '{ print $9 ": " $5 }' || log_warn "无法列出文件"
    
    log_success "分析完成"
}

# 部署到 Nginx
deploy_nginx() {
    local domain="$1"
    local env="$2"
    local project="$3"
    local reload="$4"
    
    log_step "部署到 Nginx"
    
    local deploy_script="$SCRIPT_DIR/nginx-deploy.sh"
    
    if [ ! -f "$deploy_script" ]; then
        log_error "部署脚本不存在: $deploy_script"
        exit 1
    fi
    
    # 执行部署脚本
    local reload_flag=""
    if [ "$reload" = true ]; then
        reload_flag="--reload"
    fi
    
    bash "$deploy_script" "$domain" \
        --env "$env" \
        --project "$project" \
        --dist "$DIST_DIR" \
        $reload_flag
    
    log_success "Nginx 部署完成"
}

# 主函数
main() {
    # 默认参数
    ENV="$DEFAULT_ENV"
    DOMAIN="$DEFAULT_DOMAIN"
    PROJECT="$DEFAULT_PROJECT"
    NO_DEPLOY=false
    RELOAD=false
    CLEAN=false
    ANALYZE=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -e|--env)
                ENV="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -p|--project)
                PROJECT="$2"
                shift 2
                ;;
            -o|--output)
                DIST_DIR="$2"
                shift 2
                ;;
            -n|--no-deploy)
                NO_DEPLOY=true
                shift
                ;;
            -r|--reload)
                RELOAD=true
                shift
                ;;
            -c|--clean)
                CLEAN=true
                shift
                ;;
            -a|--analyze)
                ANALYZE=true
                shift
                ;;
            -*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                log_error "多余的参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 打印配置信息
    log_info "======================================"
    log_info "SDKWork React Backend Web 打包脚本"
    log_info "======================================"
    log_info "环境: $ENV"
    log_info "域名: $DOMAIN"
    log_info "项目: $PROJECT"
    log_info "输出目录: $DIST_DIR"
    log_info "自动部署: $([ "$NO_DEPLOY" = false ] && echo '是' || echo '否')"
    log_info "自动重载: $([ "$RELOAD" = true ] && echo '是' || echo '否')"
    log_info "======================================"
    
    # 检查依赖
    check_dependencies
    
    # 清理（如果需要）
    if [ "$CLEAN" = true ]; then
        clean_output
    fi
    
    # 安装依赖
    install_dependencies
    
    # 构建项目
    build_project "$ENV"
    
    # 准备部署文件
    prepare_deploy "$ENV" "$PROJECT"
    
    # 分析包大小（如果需要）
    if [ "$ANALYZE" = true ]; then
        analyze_bundle "$ENV"
    fi
    
    # 部署到 Nginx（如果需要）
    if [ "$NO_DEPLOY" = false ]; then
        deploy_nginx "$DOMAIN" "$ENV" "$PROJECT" "$RELOAD"
    fi
    
    log_success "======================================"
    log_success "构建完成!"
    log_success "======================================"
    log_info "输出目录: $DIST_DIR/$ENV"
    log_info "访问地址: https://$DOMAIN"
    
    if [ "$NO_DEPLOY" = true ]; then
        log_info ""
        log_info "提示: 使用以下命令部署到 Nginx:"
        log_info "  ./bin/nginx-deploy.sh $DOMAIN --env $ENV --project $PROJECT"
    fi
}

# 运行主函数
main "$@"
