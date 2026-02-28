#!/bin/bash

# =============================================================================
# Nginx 部署脚本
# 用于自动生成和部署 Nginx 配置文件
# 
# 用法: ./nginx-deploy.sh <domain> [options]
# 示例: ./nginx-deploy.sh backend.sdkwork.com
#       ./nginx-deploy.sh backend.sdkwork.com --env prod --project sdkwork
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
NGINX_CONF_DIR="$PROJECT_ROOT/etc/nginx/nginx.conf"
SITES_ENABLED_DIR="$NGINX_CONF_DIR/sites-enabled"
CERTS_DIR="/opt/certs/letsencrypt/live"
DEFAULT_ENV="prod"
DEFAULT_PROJECT="sdkwork"

# 打印帮助信息
show_help() {
    cat << EOF
Nginx 部署脚本

用法: $0 <domain> [options]

参数:
    domain          要部署的域名 (例如: backend.sdkwork.com)

选项:
    -e, --env       环境名称 (默认: prod)
                    可选值: dev, test, beta, pre, prod
    -p, --project   项目名称 (默认: sdkwork)
                    用于确定配置目录和证书路径
    -d, --dist      构建输出目录 (默认: $PROJECT_ROOT/dist)
    -n, --dry-run   仅生成配置，不部署到系统
    -f, --force     强制覆盖现有配置
    -r, --reload    部署后自动重载 Nginx
    -h, --help      显示帮助信息

示例:
    $0 backend.sdkwork.com
    $0 backend.sdkwork.com --env dev --project sdkwork
    $0 api.sdkwork.com -e test -p sdkwork -r

EOF
}

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

# 解析域名
parse_domain() {
    local domain="$1"
    
    # 提取子域名、主域名和顶级域名
    if [[ "$domain" =~ ^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z]+)$ ]]; then
        SUBDOMAIN="${BASH_REMATCH[1]}"
        DOMAIN_NAME="${BASH_REMATCH[2]}"
        TLD="${BASH_REMATCH[3]}"
        FULL_DOMAIN="$domain"
        WILDCARD_PATTERN="~^(${SUBDOMAIN}[a-zA-Z0-9_-]+).${DOMAIN_NAME}.${TLD}$"
    elif [[ "$domain" =~ ^([a-zA-Z0-9_-]+)\.([a-zA-Z]+)$ ]]; then
        SUBDOMAIN="www"
        DOMAIN_NAME="${BASH_REMATCH[1]}"
        TLD="${BASH_REMATCH[2]}"
        FULL_DOMAIN="$domain"
        WILDCARD_PATTERN="~^(www[a-zA-Z0-9_-]+).${DOMAIN_NAME}.${TLD}$"
    else
        log_error "无法解析域名格式: $domain"
        exit 1
    fi
    
    log_info "解析域名:"
    log_info "  - 子域名: $SUBDOMAIN"
    log_info "  - 域名: $DOMAIN_NAME"
    log_info "  - 顶级域: $TLD"
    log_info "  - 完整域名: $FULL_DOMAIN"
}

# 生成 Nginx 配置
generate_nginx_config() {
    local domain="$1"
    local env="$2"
    local project="$3"
    local dist_dir="$4"
    
    local config_file="$SITES_ENABLED_DIR/$project/${domain}.conf"
    local cert_domain="${DOMAIN_NAME}.${TLD}"
    
    # 确保目录存在
    mkdir -p "$SITES_ENABLED_DIR/$project"
    
    log_info "生成 Nginx 配置文件: $config_file"
    
    cat > "$config_file" << EOF
# =============================================================================
# Nginx 配置文件
# 域名: $domain
# 环境: $env
# 项目: $project
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
# =============================================================================

# HTTPS 配置
server {
    listen       443 ssl;
    server_name  $domain $WILDCARD_PATTERN;

    ssl_certificate $CERTS_DIR/$cert_domain/fullchain.pem;
    ssl_certificate_key $CERTS_DIR/$cert_domain/privkey.pem;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1.2 TLSv1.1 TLSv1;
    ssl_ciphers ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP;
    ssl_prefer_server_ciphers on;
    
    gzip on;
    gzip_min_length 1k;
    gzip_buffers 4 16k;
    gzip_comp_level 2;
    gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript application/x-httpd-php image/jpeg image/gif image/png application/wasm;
    gzip_vary off;
    gzip_disable "MSIE [1-6].";

    # 设置默认的环境变量
    set \$is_mobile 0;
    set \$env $env;
    
    # 匹配不同的域名格式 (例如: backend-dev.sdkwork.com)
    if (\$host ~* "^([a-zA-Z0-9_-]+)-(dev|test|beta|pre|prod)([0-9]*).([a-zA-Z0-9.-]+)$") {
        set \$env \$2;
        set \$domain \$4;
    }   

    # 根据 User-Agent 判断是否为移动端
    if (\$http_user_agent ~ "(MIDP)|(WAP)|(UP.Browser)|(Smartphone)|(Obigo)|(Mobile)|(AU.Browser)|(wxd.Mms)|(WxdB.Browser)|(CLDC)|(UP.Link)|(KM.Browser)|(UCWEB)|(SEMC-Browser)|(Mini)|(Symbian)|(Palm)|(Nokia)|(Panasonic)|(MOT-)|(SonyEricsson)|(NEC-)|(Alcatel)|(Ericsson)|(BENQ)|(BenQ)|(Amoisonic)|(Amoi-)|(Capitel)|(PHILIPS)|(SAMSUNG)|(Lenovo)|(Mitsu)|(Motorola)|(SHARP)|(WAPPER)|(LG-)|(LG/)|(EG900)|(CECT)|(Compal)|(kejian)|(Bird)|(BIRD)|(G900/V1.0)|(Arima)|(CTL)|(TDG)|(Daxian)|(DAXIAN)|(DBTEL)|(Eastcom)|(EASTCOM)|(PANTECH)|(Dopod)|(Haier)|(HAIER)|(KONKA)|(KEJIAN)|(LENOVO)|(Soutec)|(SOUTEC)|(SAGEM)|(SEC-)|(SED-)|(EMOL-)|(INNO55)|(ZTE)|(iPhone)|(Android)|(Windows CE)|(Wget)|(Java)|(curl)|(Opera)"){
      set \$is_mobile 1;
    }
    
    # 设置项目路径
    set \$project_path $dist_dir;
    set \$mobile_path \$project_path/dist;
    set \$pc_path \$project_path/dist;
    set \$root_path \$pc_path/\$env;
    
    error_page  505 500 502 503 504 404 /index.html; 

    location = /index.html {
        add_header Cache-Control "no-cache, no-store";
        root \$root_path;
    }

    # 处理 .txt 文件请求 (DNS 验证)
    location ~ ^/([a-zA-Z0-9_-]+).txt$ {
        set \$filename \$1.txt;
        set \$host_name \$host;
        set \$proxy_url http://api_servers_\${env}/dns_verify_record/verify?filename=\$filename&host=\$host_name;

        proxy_pass \$proxy_url;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    } 

    # 为静态资源添加CORS支持
    location ^~ /libs/ {    
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        root \$project_path;
        try_files \$uri \$uri/ =404;
    }
    
    # 静态资源缓存
    location ~* ^.+.(html|avi|mp3|css|js|txt|xml|swf|wav|png|gif|jpg|jpeg|eot|otf|ttf|woff|woff2|eot|svg)$ {
        root \$root_path;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA 应用路由
    location / {
        root \$root_path;
        try_files \$uri \$uri/ /index.html =404;
    }
}

# HTTP 配置 (自动跳转到 HTTPS)
server {
    listen       80;
    server_name  $domain $WILDCARD_PATTERN;

    # 设置默认的环境变量
    set \$is_mobile 0;
    set \$env $env;
    
    # 匹配不同的域名格式
    if (\$host ~* "^([a-zA-Z0-9_-]+)-(dev|test|beta|pre|prod)([0-9]*).([a-zA-Z0-9.-]+)$") {
        set \$env \$2;
        set \$domain \$4;
    }   

    # 根据 User-Agent 判断是否为移动端
    if (\$http_user_agent ~ "(MIDP)|(WAP)|(UP.Browser)|(Smartphone)|(Obigo)|(Mobile)|(AU.Browser)|(wxd.Mms)|(WxdB.Browser)|(CLDC)|(UP.Link)|(KM.Browser)|(UCWEB)|(SEMC-Browser)|(Mini)|(Symbian)|(Palm)|(Nokia)|(Panasonic)|(MOT-)|(SonyEricsson)|(NEC-)|(Alcatel)|(Ericsson)|(BENQ)|(BenQ)|(Amoisonic)|(Amoi-)|(Capitel)|(PHILIPS)|(SAMSUNG)|(Lenovo)|(Mitsu)|(Motorola)|(SHARP)|(WAPPER)|(LG-)|(LG/)|(EG900)|(CECT)|(Compal)|(kejian)|(Bird)|(BIRD)|(G900/V1.0)|(Arima)|(CTL)|(TDG)|(Daxian)|(DAXIAN)|(DBTEL)|(Eastcom)|(EASTCOM)|(PANTECH)|(Dopod)|(Haier)|(HAIER)|(KONKA)|(KEJIAN)|(LENOVO)|(Soutec)|(SOUTEC)|(SAGEM)|(SEC-)|(SED-)|(EMOL-)|(INNO55)|(ZTE)|(iPhone)|(Android)|(Windows CE)|(Wget)|(Java)|(curl)|(Opera)") {
       set \$is_mobile 1;
    }
    
    set \$project_path $dist_dir;
    set \$mobile_path \$project_path/dist;
    set \$pc_path \$project_path/dist;
    set \$root_path \$pc_path/\$env;

    error_page  505 500 502 503 504 404 /index.html;

    location = /index.html {
        add_header Cache-Control "no-cache, no-store";
        root \$root_path;
    }

    # 处理 .txt 文件请求
    location ~ ^/([a-zA-Z0-9_-]+).txt$ {
        set \$filename \$1.txt;
        set \$host_name \$host;
        set \$proxy_url http://api_servers_\${env}/dns_verify_record/verify?filename=\$filename&host=\$host_name;

        proxy_pass \$proxy_url;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # 静态资源
    location ^~ /libs/ {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        root \$project_path;
        try_files \$uri \$uri/ =404;
    }
    
    location ~* ^.+.(html|avi|mp3|css|js|txt|xml|swf|wav|png|gif|jpg|jpeg|eot|otf|ttf|woff|woff2|eot|svg)$ {
        root \$root_path;
    }

    location / {
        root \$root_path;
        try_files \$uri \$uri/ /index.html =404;
    }
}
EOF

    log_success "配置文件生成成功: $config_file"
}

# 部署配置到系统
deploy_config() {
    local domain="$1"
    local project="$2"
    local dry_run="$3"
    local reload="$4"
    
    local config_file="$SITES_ENABLED_DIR/$project/${domain}.conf"
    local system_nginx_dir="/etc/nginx/sites-enabled"
    
    if [ "$dry_run" = true ]; then
        log_info "[DRY RUN] 跳过实际部署"
        log_info "[DRY RUN] 将部署: $config_file -> $system_nginx_dir/"
        return 0
    fi
    
    # 检查是否以 root 运行
    if [ "$EUID" -ne 0 ]; then
        log_warn "需要 root 权限进行部署，尝试使用 sudo"
        SUDO="sudo"
    else
        SUDO=""
    fi
    
    # 检查 Nginx 配置目录是否存在
    if [ ! -d "$system_nginx_dir" ]; then
        log_warn "系统 Nginx 目录不存在: $system_nginx_dir"
        log_info "尝试创建目录..."
        $SUDO mkdir -p "$system_nginx_dir"
    fi
    
    # 复制配置文件
    log_info "部署配置到: $system_nginx_dir/"
    $SUDO cp "$config_file" "$system_nginx_dir/"
    
    # 测试 Nginx 配置
    log_info "测试 Nginx 配置..."
    if $SUDO nginx -t; then
        log_success "Nginx 配置测试通过"
        
        if [ "$reload" = true ]; then
            log_info "重载 Nginx..."
            $SUDO nginx -s reload
            log_success "Nginx 重载成功"
        fi
    else
        log_error "Nginx 配置测试失败"
        exit 1
    fi
}

# 主函数
main() {
    # 检查参数
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    # 解析参数
    DOMAIN=""
    ENV="$DEFAULT_ENV"
    PROJECT="$DEFAULT_PROJECT"
    DIST_DIR="$PROJECT_ROOT/dist"
    DRY_RUN=false
    FORCE=false
    RELOAD=false
    
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
            -p|--project)
                PROJECT="$2"
                shift 2
                ;;
            -d|--dist)
                DIST_DIR="$2"
                shift 2
                ;;
            -n|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -r|--reload)
                RELOAD=true
                shift
                ;;
            -*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                if [ -z "$DOMAIN" ]; then
                    DOMAIN="$1"
                else
                    log_error "多余的参数: $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 验证必需参数
    if [ -z "$DOMAIN" ]; then
        log_error "请提供域名参数"
        show_help
        exit 1
    fi
    
    log_info "======================================"
    log_info "Nginx 部署脚本"
    log_info "======================================"
    log_info "域名: $DOMAIN"
    log_info "环境: $ENV"
    log_info "项目: $PROJECT"
    log_info "构建目录: $DIST_DIR"
    log_info "======================================"
    
    # 解析域名
    parse_domain "$DOMAIN"
    
    # 检查配置文件是否已存在
    local config_file="$SITES_ENABLED_DIR/$PROJECT/${DOMAIN}.conf"
    if [ -f "$config_file" ] && [ "$FORCE" = false ]; then
        log_warn "配置文件已存在: $config_file"
        log_warn "使用 --force 选项覆盖现有配置"
        read -p "是否覆盖? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "取消部署"
            exit 0
        fi
    fi
    
    # 生成配置
    generate_nginx_config "$DOMAIN" "$ENV" "$PROJECT" "$DIST_DIR"
    
    # 部署配置
    deploy_config "$DOMAIN" "$PROJECT" "$DRY_RUN" "$RELOAD"
    
    log_success "======================================"
    log_success "部署完成!"
    log_success "======================================"
    log_info "配置文件: $config_file"
    log_info "访问地址: https://$DOMAIN"
    
    if [ "$RELOAD" = false ]; then
        log_info ""
        log_info "提示: 使用 --reload 选项自动重载 Nginx"
        log_info "      或手动运行: sudo nginx -s reload"
    fi
}

# 运行主函数
main "$@"
