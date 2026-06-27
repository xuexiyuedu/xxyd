#!/bin/bash
# 在本地运行：构建并打包腾讯云服务器部署包
# 用法：bash scripts/build-server-package.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
BUILD_DIR="$DIST_DIR/xxyd-server"
PACKAGE="$DIST_DIR/xxyd-server.tar.gz"

echo "🚀 开始构建服务器部署包..."

cd "$PROJECT_DIR"

# 1. 安装依赖（如未安装）
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
fi

# 2. 构建
echo "🔨 构建 Next.js standalone..."
npm run build

# 3. 清理旧目录
rm -rf "$BUILD_DIR" "$PACKAGE"
mkdir -p "$BUILD_DIR"

# 4. 复制 standalone 输出
echo "📂 复制 standalone 文件..."
cp -r "$PROJECT_DIR/.next/standalone/"* "$BUILD_DIR/"

# 5. 复制静态资源
cp -r "$PROJECT_DIR/public" "$BUILD_DIR/public" 2>/dev/null || true
mkdir -p "$BUILD_DIR/.next/static"
cp -r "$PROJECT_DIR/.next/static/"* "$BUILD_DIR/.next/static/" 2>/dev/null || true

# 6. 复制部署脚本
cp "$PROJECT_DIR/scripts/deploy-server.sh" "$BUILD_DIR/"
cp "$PROJECT_DIR/scripts/nginx-xxyd.conf" "$BUILD_DIR/"

# 7. 生成 .env 生产环境文件（从 .env.local 读取并替换域名）
echo "📝 生成 .env 生产环境文件..."
ENV_LOCAL="$PROJECT_DIR/.env.local"
if [ -f "$ENV_LOCAL" ]; then
  sed -e 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://xxyd.work|' \
      -e 's|^PORT=.*|PORT=3000|' \
      "$ENV_LOCAL" > "$BUILD_DIR/.env"
  echo "   ✅ 已从 .env.local 生成 .env"
else
  echo "   ⚠️  未找到 .env.local，生成 .env.example"
fi

# 8. 同时保留一份示例配置（不含真实密钥）
cat > "$BUILD_DIR/.env.example" <<'EOF'
# 生产环境配置
NEXT_PUBLIC_MOCK_AUTH=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 站点域名（替换为你的真实域名）
NEXT_PUBLIC_APP_URL=https://xxyd.work

# 腾讯云 COS（可选）
NEXT_PUBLIC_COS_REGION=ap-guangzhou
NEXT_PUBLIC_COS_BUCKET=your-bucket
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key

# 有道翻译（可选）
YOUDAO_APP_KEY=your-youdao-app-key
YOUDAO_APP_SECRET=your-youdao-app-secret

# 服务端口号（默认 3000）
PORT=3000
EOF

# 8. 打包
echo "📦 打包..."
tar -czf "$PACKAGE" -C "$DIST_DIR" xxyd-server

echo ""
echo "✅ 部署包已生成: $PACKAGE"
echo ""
echo "下一步："
echo "1. 将 $PACKAGE 上传到腾讯云轻量服务器（例如 /root/）"
echo "2. 在服务器上执行："
echo "   cd /root && tar -xzf xxyd-server.tar.gz && cd xxyd-server && sudo bash deploy-server.sh"
echo ""
