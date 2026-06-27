/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 生产部署用 standalone 输出（配合 Dockerfile）
  output: "standalone",
  // 生产环境关闭 Source Map
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    // pdfjs-dist worker 配置
    config.resolve.alias.canvas = false;
    return config;
  },
  // 图片域名配置（用于文件预览缩略图等）
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // 环境变量前缀
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  // 异步 Header（CSP 策略）
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
