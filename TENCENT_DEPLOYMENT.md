# 腾讯云轻量服务器部署指南

> 项目：knowledge-reader（知识阅读平台）
> 服务器：腾讯云轻量服务器（推荐 Ubuntu 22.04 LTS）
> 域名：xxyd.work

## 一、准备工作

### 1.1 服务器要求
- 系统：Ubuntu 22.04 LTS（64位）
- 内存：≥ 2GB
- 带宽：≥ 1Mbps
- 防火墙放行：22(SSH)、80(HTTP)、443(HTTPS)

### 1.2 域名解析
在腾讯云域名管理后台，添加以下解析记录：

| 主机记录 | 记录类型 | 记录值 | 说明 |
|---|---|---|---|
| @ | A | 你的服务器公网 IP | 主域名 xxyd.work |
| www | A | 你的服务器公网 IP | www.xxyd.work |

> 解析生效需要 5~30 分钟，可用 `ping xxyd.work` 测试。

---

## 二、上传部署包

### 2.1 获取部署包
部署包位于本地：
```
knowledge-reader/dist/xxyd-server.tar.gz
```

### 2.2 上传到服务器
使用任意 SSH/SFTP 工具上传到服务器 `/root/` 目录：

```bash
# 方式一：命令行（替换为你的服务器 IP）
scp knowledge-reader/dist/xxyd-server.tar.gz root@<服务器IP>:/root/

# 方式二：使用 FinalShell / Termius / WinSCP 等工具上传
```

---

## 三、服务器部署

### 3.1 登录服务器
```bash
ssh root@<服务器IP>
```

### 3.2 解压并运行部署脚本

```bash
cd /root
rm -rf xxyd-server
tar -xzf xxyd-server.tar.gz
cd xxyd-server
sudo bash deploy-server.sh
```

> 注意：脚本里域名已写死为 `xxyd.work`，邮箱使用 `admin@xxyd.work` 用于 SSL 证书。如果你需要换成其他域名，请先修改 `scripts/deploy-server.sh` 里的 `DOMAIN` 变量。

### 3.3 脚本自动完成

- 安装 Node.js 22 LTS
- 安装 PM2 进程管理器
- 安装 Nginx
- 安装 SSL 证书（Let's Encrypt）
- 配置反向代理
- 启动应用并持久化

如果 SSL 证书申请失败（通常是域名还没解析），可以先等域名解析生效后再手动运行：

```bash
sudo certbot --nginx -d xxyd.work
```

---

## 四、部署后验证

### 4.1 检查应用状态
```bash
pm2 status
pm2 logs xxyd
```

### 4.2 检查 Nginx 状态
```bash
sudo systemctl status nginx
sudo nginx -t
```

### 4.3 浏览器访问
```
https://xxyd.work
```

---

## 五、更新 Supabase Auth 回调地址

部署成功后，必须去 Supabase 后台更新认证回调地址：

访问：
```
https://supabase.com/dashboard/project/nbgsygqkskqfoqlilzdz/settings/api
```

在 **Authentication → URL Configuration** 中设置：
- **Site URL**: `https://xxyd.work`
- **Redirect URLs**: `https://xxyd.work/**`

> 如果之前配置了 Vercel 域名，可以删除或保留，建议只保留生产域名。

---

## 六、后续维护

### 6.1 更新部署
本地修改代码后，重新打包上传：
```bash
# 本地运行
bash scripts/build-server-package.sh

# 上传并重启
scp knowledge-reader/dist/xxyd-server.tar.gz root@<服务器IP>:/root/
ssh root@<服务器IP> "cd /root && tar -xzf xxyd-server.tar.gz && cd xxyd-server && pm2 restart xxyd"
```

### 6.2 常用命令
```bash
# 重启应用
pm2 restart xxyd

# 查看日志
pm2 logs xxyd

# 停止应用
pm2 stop xxyd

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 七、常见问题

### 7.1 域名无法访问
- 检查域名 A 记录是否解析到服务器 IP
- 检查服务器安全组/防火墙是否放行 80/443
- 检查 Nginx 是否运行：`sudo systemctl status nginx`

### 7.2 SSL 证书申请失败
- 确保域名已解析到服务器
- 确保 80 端口对外开放
- 查看错误日志：`sudo certbot logs` 或 `/var/log/letsencrypt/letsencrypt.log`

### 7.3 应用启动失败
- 查看 PM2 日志：`pm2 logs xxyd`
- 检查 `.env` 文件是否存在且配置正确
- 检查端口是否被占用：`sudo lsof -i :3000`

---

## 八、安全配置建议

1. 部署完成后删除服务器上的 `xxyd-server.tar.gz` 包：
   ```bash
   rm /root/xxyd-server.tar.gz
   ```

2. 禁用 root 登录，使用普通用户 + SSH 密钥登录
3. 定期更新系统补丁：`sudo apt update && sudo apt upgrade -y`
4. 在腾讯云控制台配置安全组，只开放必要端口
