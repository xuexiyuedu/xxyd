# 部署检查清单 — 知识阅读平台

> 在正式部署前，按本清单逐项确认，避免上线后才发现问题。

---

## 一、环境变量配置

部署平台（Vercel / CloudBase / Docker）的环境变量面板中，配置以下变量：

### 必填（生产环境）

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥（仅服务端） | `eyJhbGciOi...` |
| `NEXT_PUBLIC_COS_REGION` | 腾讯云 COS 区域 | `ap-guangzhou` |
| `NEXT_PUBLIC_COS_BUCKET` | COS 存储桶名 | `my-bucket-1234567890` |
| `COS_SECRET_ID` | COS SecretId（仅服务端） | `AKID...` |
| `COS_SECRET_KEY` | COS SecretKey（仅服务端） | `xxxx` |
| `NEXT_PUBLIC_APP_URL` | 站点完整 URL（用于分享链接） | `https://yourdomain.com` |

### 关键开关

| 变量名 | 生产环境取值 | 说明 |
|--------|--------------|------|
| `NEXT_PUBLIC_MOCK_AUTH` | `false` | 必须关闭 Mock 模式，启用真实 Supabase |

### 可选（按需）

| 变量名 | 用途 |
|--------|------|
| `YOUDAO_APP_KEY` / `YOUDAO_APP_SECRET` | 词典翻译功能 |
| `WECHAT_PAY_*` 系列 | 微信支付（P1 阶段） |

- [ ] 所有必填环境变量已配置
- [ ] `NEXT_PUBLIC_MOCK_AUTH=false` 已确认
- [ ] 密钥未硬编码到代码或提交到 Git

---

## 二、Supabase 数据库

- [ ] 已执行所有迁移 SQL（`/supabase/migrations/` 下全部文件）
- [ ] 所有表启用了 RLS（Row Level Security）
- [ ] 创建了必要的索引
- [ ] 验证策略：用户只能读写自己的数据
- [ ] 在 Supabase 控制台 → Authentication → URL 配置中，添加了站点域名到 "Site URL" 和 "Redirect URLs"

---

## 三、腾讯云 COS

- [ ] 存储桶已创建，访问权限设为 "私有读写"
- [ ] CORS 配置允许站点域名访问（用于上传/下载）
- [ ] 防盗链配置允许站点 Referer
- [ ] 子账号 / API 密钥已创建，仅有 COS 读写权限（最小权限原则）
- [ ] 大文件分片上传限制已放开（CORS MaxAge、单文件大小限制）

---

## 四、构建与安全

- [ ] `npm run build` 本地通过
- [ ] `npm run lint` 无 error（warning 可接受）
- [ ] `next.config.js` 中 `productionBrowserSourceMaps: false`
- [ ] CSP / 安全响应头已配置（X-Content-Type-Options、X-Frame-Options 等，已在 `next.config.js` 和 `vercel.json` 中默认开启）
- [ ] HTTPS 已启用（Vercel 自动；CloudBase 需配置证书）
- [ ] `.env*.local` 未被提交到 Git（确认 `.gitignore` 包含）

---

## 五、域名与 CDN

- [ ] 自定义域名已绑定（Vercel 自动 HTTPS；CloudBase 需上传证书）
- [ ] DNS 解析已生效
- [ ] `NEXT_PUBLIC_APP_URL` 已更新为真实域名（影响分享链接生成）
- [ ] CDN 缓存策略：静态资源长缓存，HTML 短缓存

---

## 六、PWA / Service Worker

- [ ] `public/manifest.json` 中 `start_url`、`scope` 已改为生产域名
- [ ] PWA 图标尺寸齐全（192×192、512×512、maskable）
- [ ] Service Worker 在生产环境正常注册（DevTools → Application → Service Workers）
- [ ] iOS Safari 测试"添加到主屏幕"功能

---

## 七、性能与监控

- [ ] 首屏 LCP < 2.5s（Lighthouse 移动端测试）
- [ ] 大文件上传分片正常，断点续传可用
- [ ] 数据库连接池设置合理（Supabase 默认即可）
- [ ] 已接入错误监控（可选：Sentry / 腾讯云 CLS）

---

## 八、备份与容灾

- [ ] Supabase 数据库自动备份已开启（Pro 计划及以上）
- [ ] COS 跨区域复制 / 版本控制（按需）
- [ ] 关键数据定期导出脚本（可选）

---

## 九、上线后验证清单

部署完成后，依次访问以下页面验证：

1. [ ] 首页 `/` 正常加载
2. [ ] 注册 `/register` → 收到验证邮件
3. [ ] 登录 `/login` → 跳转到 dashboard
4. [ ] 上传文件 → 列表显示新文件
5. [ ] 在线预览图片/视频/音频/代码
6. [ ] PDF / EPUB / TXT 阅读器正常打开
7. [ ] 高亮、批注、书签可保存
8. [ ] 生词本、闪卡复习可用
9. [ ] 创建分享链接 → 隐身窗口访问 `/share/[token]`
10. [ ] 移动端响应式正常
11. [ ] PWA 可"添加到主屏幕"
12. [ ] `/api/health` 返回 200

---

## 十、回滚预案

- **Vercel**：在 Deployments 列表中点 "Instant Rollback" 回到上一版本
- **CloudBase**：保留上一个镜像 tag，回滚时切换
- **Docker**：保留旧镜像，`docker stop` + `docker run` 旧版本
- **数据库迁移回滚**：保留每个 migration 的 DOWN 脚本（如使用 Supabase CLI）

---

完成以上全部检查后，即可放心上线。如出现问题，参考「回滚预案」快速恢复。
