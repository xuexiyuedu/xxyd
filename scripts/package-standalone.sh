#!/bin/bash
# 正确打包 Next.js standalone 部署包
# 解决：.next/static 丢失、server.js 找不到 等问题

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$PROJECT_DIR/dist/xxyd-server"
PKG_FILE="$PROJECT_DIR/dist/xxyd-server.tar.gz"

echo "========================================="
echo "  Next.js Standalone 部署包打包"
echo "========================================="
echo ""

# 1. 重新构建（确保最新代码）
echo "📦 [1/6] 重新生产构建..."
cd "$PROJECT_DIR"
npm run build

# 2. 清理并创建构建目录
echo "📂 [2/6] 准备部署目录..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 3. 复制 standalone 输出（包含 server.js + 最小 node_modules）
echo "📦 [3/6] 复制 standalone 输出..."
cp -r "$PROJECT_DIR/.next/standalone/"* "$BUILD_DIR/"

# 4. 复制 .next/static（浏览器所需 CSS/JS）
# standalone 服务器会从 process.cwd()/.next/static 读取
echo "📦 [4/6] 复制静态文件..."
mkdir -p "$BUILD_DIR/.next"
cp -r "$PROJECT_DIR/.next/static" "$BUILD_DIR/.next/static"
cp -r "$PROJECT_DIR/.next/build-manifest.json" "$BUILD_DIR/.next/" 2>/dev/null || true
cp -r "$PROJECT_DIR/.next/BUILD_ID" "$BUILD_DIR/.next/" 2>/dev/null || true

# 5. 复制 public 目录
echo "📂 [5/6] 复制 public 目录..."
if [ -d "$PROJECT_DIR/public" ]; then
  cp -r "$PROJECT_DIR/public" "$BUILD_DIR/public"
fi

# 6. 生成生产 .env
# 优先从本地 .env.local 读取真实密钥，不会把密钥硬编码到脚本里
ENV_SOURCE="$PROJECT_DIR/.env.local"
echo "📝 [6/6] 生成 .env 配置..."
if [ -f "$ENV_SOURCE" ]; then
  cp "$ENV_SOURCE" "$BUILD_DIR/.env"
  # 强制把域名和 MOCK 模式设为生产环境
  sed -i 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://xxyd.work|' "$BUILD_DIR/.env"
  sed -i 's|^NEXT_PUBLIC_MOCK_AUTH=.*|NEXT_PUBLIC_MOCK_AUTH=false|' "$BUILD_DIR/.env"
else
  # 本地没有 .env.local 时，生成模板文件（服务器上需手动替换）
  cat > "$BUILD_DIR/.env" <<'EOF'
# ==========================================
#  学习阅读平台 - 生产环境配置
#  注意：请把下面的占位符替换为真实密钥
# ==========================================

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=https://xxyd.work
NEXT_PUBLIC_MOCK_AUTH=false

# 有道翻译（选填）
NEXT_PUBLIC_YOUDAO_APP_ID=
NEXT_PUBLIC_YOUDAO_SECRET=

PORT=3000
EOF
  echo "⚠️  未找到 .env.local，已生成 .env 模板，请手动填写真实密钥！"
fi

# 7. 复制部署脚本和 Nginx 配置
cp "$PROJECT_DIR/scripts/deploy-server.sh" "$BUILD_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR/scripts/nginx-xxyd.conf" "$BUILD_DIR/" 2>/dev/null || true

# 8. 打包
echo "📦 打包中..."
rm -f "$PKG_FILE"
cd "$PROJECT_DIR/dist"
tar -czf "xxyd-server.tar.gz" "xxyd-server"

# 完成
PKG_SIZE=$(du -sh "$PKG_FILE" | cut -f1)
echo ""
echo "========================================="
echo "  ✅ 打包完成！"
echo "========================================="
echo "  文件: $PKG_FILE"
echo "  大小: $PKG_SIZE"
echo "  目录结构:"
tar -tzf "$PKG_FILE" | head -20
echo "..."
echo ""
echo "📋 服务器部署步骤："
echo "  1. 上传 xxyd-server.tar.gz 到服务器 /root/"
echo "  2. ssh root@服务器IP"
echo "  3. cd /root && tar -xzf xxyd-server.tar.gz"
echo "  4. cd xxyd-server && bash deploy-server.sh"
echo "========================================="
echo ""
