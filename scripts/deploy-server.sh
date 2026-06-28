#!/bin/bash
# 在腾讯云轻量服务器上运行，自动安装环境并部署
# 用法：sudo bash deploy-server.sh

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="xxyd"
DOMAIN="xxyd.work"

# 颜色输出
red() { echo -e "\033[31m$1\033[0m"; }
green() { echo -e "\033[32m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
  red "请用 sudo 运行此脚本"
  exit 1
fi

# 检查 .env 文件
if [ ! -f "$APP_DIR/.env" ]; then
  yellow "未找到 .env 文件，请先创建："
  yellow "  cp $APP_DIR/.env.example $APP_DIR/.env"
  yellow "  nano $APP_DIR/.env"
  exit 1
fi

echo "🚀 开始部署 $APP_NAME 到 $DOMAIN..."

# 1. 安装基础工具
echo "📦 安装基础工具..."
apt-get update -y
apt-get install -y curl wget git nginx software-properties-common gnupg2 ca-certificates lsb-release

# 2. 安装 Node.js 22 LTS
echo "📦 安装 Node.js 22..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "22" ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# 3. 安装 PM2
echo "📦 安装 PM2..."
npm install -g pm2

# 4. 安装 Certbot
echo "📦 安装 Certbot..."
if ! command -v certbot &> /dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi

# 5. 配置 Nginx（先 HTTP，Certbot 会自动加 HTTPS）
echo "🔧 配置 Nginx（HTTP）..."
cp "$APP_DIR/nginx-xxyd.conf" /etc/nginx/sites-available/xxyd

# 启用站点
if [ ! -L /etc/nginx/sites-enabled/xxyd ]; then
  ln -s /etc/nginx/sites-available/xxyd /etc/nginx/sites-enabled/xxyd
fi
# 禁用默认站点（避免冲突）
rm -f /etc/nginx/sites-enabled/default

# 检查 Nginx 配置
nginx -t && systemctl reload nginx
systemctl enable nginx

# 6. 启动/重启应用
echo "🔧 启动应用..."
cd "$APP_DIR"
# 安装生产依赖（standalone 通常不需要，但保险起见）
if [ -f package.json ]; then
  npm install --production 2>/dev/null || true
fi

pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start server.js --name "$APP_NAME" --cwd "$APP_DIR"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 7. 申请 SSL 证书
echo "🔒 申请 SSL 证书..."
if command -v certbot &> /dev/null; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN || {
    yellow "SSL 申请失败，请确认域名已解析到本服务器后再手动运行："
    yellow "  certbot --nginx -d $DOMAIN"
  }
fi

# 8. 开放防火墙（腾讯云轻量服务器默认可能已开放）
echo "🔥 配置防火墙..."
ufw allow 'Nginx Full' 2>/dev/null || true
ufw allow OpenSSH 2>/dev/null || true
ufw --force enable 2>/dev/null || true

echo ""
green "✅ 部署完成！"
echo ""
echo "应用状态:"
pm2 status "$APP_NAME"
echo ""
echo "请访问: https://$DOMAIN"
echo ""
echo "常用命令："
echo "  查看日志: pm2 logs $APP_NAME"
echo "  重启: pm2 restart $APP_NAME"
echo "  停止: pm2 stop $APP_NAME"
