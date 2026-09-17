# 部署到自己的服务器（Ubuntu / 大陆机房）

这份文档是照着做就能跑通的部署手册。命令都是逐条给的，每条都说明在干什么、
成功长什么样、失败了回头看哪一节。

## 时间线：为什么分两个阶段

**备案要等 2~3 周，所以不能等域名下来才开始。** 大陆机房的规则是：域名要解析到
大陆服务器、并在 80/443 上对外提供网站服务，必须先完成 ICP 备案。但**用 IP 直接
访问不需要备案** —— 所以先把站点跑起来（阶段一），等备案下来再绑域名（阶段二），
两件事互不阻塞。

| | 阶段一（今天就能做完） | 阶段二（备案下来后） |
|---|---|---|
| 需要的 | 一台能 SSH 的服务器 | 域名 + 备案通过 |
| 访问方式 | `http://你的IP` | `https://你的域名` |
| 做什么 | 装 Node、克隆、构建、systemd、nginx | 解析域名、换 server_name、certbot 上 HTTPS |

---

## 阶段一：让站点在服务器上跑起来

### 1. 登录服务器

```bash
ssh root@你的服务器IP
```

成功的样子：命令行提示符变成 `root@xxx:~#`。
失败：连不上就先确认 IP、端口（默认 22）、以及云控制台的安全组里放行了 22。

### 2. 确认系统和架构

```bash
cat /etc/os-release | head -2
uname -m
```

期望看到 `Ubuntu 22.04` / `24.04` 之类，以及 `x86_64`。
**如果是 `aarch64`**（ARM 架构，部分云厂商的"通用型"实例是这种），下面下载 Node 时
把文件名里的 `linux-x64` 换成 `linux-arm64` 即可。

### 3. 装 Node.js 24

Ubuntu 自带的 Node 版本偏旧（22.04 上是 v12、24.04 上是 v18），跑不了 Next 16
（要求 ≥ 20.9）。直接从 npmmirror 的 Node 二进制镜像下官方编译包，国内速度很快。

**版本选 24.21.0，和开发机保持一致** —— 两边版本一样，本地能跑服务器就能跑。

> 别用清华的 `nodejs-release` 镜像：它的 Node 同步落后将近一年，v24 只列到 24.1.0。
> npmmirror 这个镜像是跟得上的。

```bash
V=24.21.0
cd /tmp
curl -LO "https://cdn.npmmirror.com/binaries/node/v$V/node-v$V-linux-x64.tar.xz"
sudo tar -xJf "node-v$V-linux-x64.tar.xz" -C /usr/local --strip-components=1
```

验证：

```bash
node -v    # 期望 v24.21.0
npm -v     # 期望 11.x
```

以后想升级 Node，把 `V=` 换成新版本号重跑这两条就行（在
`https://cdn.npmmirror.com/binaries/node/` 能看到有哪些版本）。

解压到 `/usr/local` 意味着 node 和 npm 落在 `/usr/local/bin/` 下 —— 记住这个路径，
`deploy/blog.service` 里的 `ExecStart` 用的就是它。

### 4. 把 npm 源换成国内镜像

不换的话在国内服务器上 `npm ci` 会慢到怀疑人生，还经常中途超时失败。

**注意要写成全局配置**：`npm config set registry`（不带 `--global`）只写进当前用户的
`~/.npmrc`。而装 Node 这步是 root 在跑，待会儿真正执行 `npm ci` 的却是 `blog` 用户 ——
写进 root 的家目录等于没设。所以直接写 npm 的全局配置文件：

```bash
echo 'registry=https://registry.npmmirror.com' | sudo tee /usr/local/etc/npmrc
npm config get registry   # 期望 https://registry.npmmirror.com
```

`/usr/local/etc/npmrc` 跟着 Node 的安装前缀走（Node 装在 /usr/local），所以这台机器上
所有用户都会读到它。

### 5. 建一个专用用户，把仓库克隆下来

不用 root 跑网站服务：万一把 Node 进程打穿，普通用户能限制住影响面。

```bash
sudo apt update && sudo apt install -y git
sudo useradd -m -s /bin/bash blog       # 已经有 blog 用户就跳过这一行（id blog 看一下）
sudo su - blog          # ← 切到 blog 用户，后面的仓库操作都在这个身份下做
```

> **注意**：仓库相关的命令（clone / build / pull）一律用 `blog` 用户做，不要加
> `sudo`。用 root 做会让文件属主变成 root，之后 blog 用户构建时会报权限错误。

```bash
git clone https://github.com/Doraemon-void/blog.git ~/blog
cd ~/blog
ls        # 应看到 app/ content/ deploy/ lib/ package.json 等
```

### 6. 写构建环境变量，然后构建

`NEXT_PUBLIC_SITE_URL` 决定 canonical、sitemap、RSS 和分享卡片里的绝对地址。
**它是在 `next build` 时被写死进产物的**（不是运行时读），所以必须在构建之前就设好。

阶段一先用 IP（诚实一点，此刻确实只能用 IP 访问到它）。**把 `你的服务器IP` 换成
真实 IP**，例如：

```bash
cat > ~/blog/.env.production <<'EOF'
NEXT_PUBLIC_SITE_URL=http://123.45.67.89
EOF
```

> 这个文件被 `.gitignore` 排除了，不会被提交，所以每次换机器部署都要重新写一次。
> 阶段二把域名备案下来后，改这里的值再重新构建。

```bash
cd ~/blog
npm ci          # 按 package-lock.json 精确安装，比 npm install 更可复现
npm run build
```

成功的样子：最后打印出 `Route (app)` 表格和一堆 `○ /△ /ƒ` 标记，没有 `Error`。
**如果构建中途被 Killed**：内存不够（Next 构建峰值能吃到 1G+），跳到文末
「构建被 Killed」那一节加 swap。

> 构建时**不应该**再看到 `NEXT_PUBLIC_SITE_URL 未设置` 的警告 —— 看到了说明第 6 步
> 那个文件没写成功或者位置不对。

### 7. 先在前台试跑一次

```bash
npm run start
```

成功的样子：`▲ Next.js 16.3.5` 和 `✓ Ready in xxx ms`。
**保持这个终端不动**，另开一个终端（或让云控制台的"远程连接"再开一个）验证：

```bash
curl -sI http://127.0.0.1:3000 | head -1     # 期望 HTTP/1.1 200 OK
```

确认没问题后回到第一个终端按 `Ctrl+C` 停掉，**然后 `exit` 退出 blog 用户回到 root** ——
后面几步要 `sudo`，而 `blog` 这个用户故意没有 sudo 权限（不给网站进程的用户提权能力）。

### 8. 装成 systemd 常驻服务

做了这一步，进程崩了会自动重启，服务器重启后网站也会自己起来。

```bash
sudo cp /home/blog/blog/deploy/blog.service /etc/systemd/system/blog.service
sudo systemctl daemon-reload
sudo systemctl enable --now blog
sudo systemctl status blog        # 应显示 active (running)，按 q 退出
```

再验一次（这次是后台服务在应答）：

```bash
curl -sI http://127.0.0.1:3000 | head -1
```

如果 `status` 里是 `activating` 然后 `failed`，看日志：

```bash
sudo journalctl -u blog -n 50
```

最常见的原因是 `ExecStart` 里的 npm 路径不对 —— 用 `which npm` 看真实路径，
然后 `sudo nano /etc/systemd/system/blog.service` 改那一行，改完再
`daemon-reload` + `restart`。

### 9. 装 nginx 做反向代理

Next 官方建议前面挂一层反向代理，而不是让 `next start` 直接对公网。

```bash
sudo apt install -y nginx
sudo cp /home/blog/blog/deploy/nginx-blog.conf /etc/nginx/sites-available/blog
sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t                     # 期望 syntax is ok / test is successful
sudo systemctl reload nginx
```

> `rm -f .../sites-enabled/default` 这步别漏：Ubuntu 自带的默认站点也是
> `listen 80; server_name _;`，和我们这份撞名，nginx 会报警告并可能命中错的那一份。

从服务器内部验证（这次走的是 80 端口）：

```bash
curl -sI http://127.0.0.1/ | head -1     # 期望 200
```

### 10. 放行 80 端口，从外网访问

**这一步不在服务器上做，在云厂商的网页控制台里做**：找到「安全组 / 防火墙」，
在**入方向**规则里放行 TCP **80** 端口。

> **只放行 80，不要放行 3000。** Node 进程监听的 3000 现在能被公网直连（它默认
> 绑所有网卡），只要安全组不放行，外面就连不上 —— nginx 从本机 127.0.0.1:3000
> 反代过去不受影响。放行了 3000 等于绕过 nginx 把 Node 直接暴露给公网，白白丢掉
> 反代这层的防护。

这是新手最常卡住的地方：服务器上一切正常、内部 `curl` 也是 200，但外面就是打不开 ——
原因通常就是安全组没放行。

然后在你自己的电脑上打开：

```
http://你的服务器IP
```

能看到博客就说明上线了。此时只有你自己知道这个 IP，搜索引擎还不会收录它。

---

## 阶段二：绑定域名（备案下来之后）

### 11. 买域名 + 实名认证

在**支持备案**的注册商买（阿里云、腾讯云都行）。买完要做「域名实名认证」，
上传身份证，一般 1~3 天通过。**实名认证没通过就不能提交备案。**

### 12. 备案

去你买服务器那家云厂商的「备案」系统里提交：

- **主体信息**：你本人的身份证、手机号
- **网站信息**：域名、网站名称、服务内容（选"个人博客"）
- **备案服务号**：从控制台申请。它要求服务器是**包年包月**、且剩余时长满足要求
  （常见是 ≥ 3 个月，各厂商略有差异）—— 如果你的服务器是按量付费或快到期了，
  先续费再申请

流程：云厂商初审（1~2 个工作日）→ 提交管局审核（常见 2~3 周）。

**期间网站照常能用，只是要用 IP 访问。** 备案通过之前，用域名访问大陆服务器
的 80/443 会被拦，这不是你配置错了。

### 13. 域名解析 + 换 server_name

备案通过后：

1. 在域名控制台加一条 **A 记录**，把 `blog.你的域名` 指向服务器 IP
2. 把 nginx 配置里的 `server_name _;` 改成你的域名：

```bash
sudo nano /etc/nginx/sites-available/blog
# 把 server_name _; 改成：server_name blog.你的域名;
sudo nginx -t && sudo systemctl reload nginx
```

验证解析生效（在你自己的电脑上）：

```bash
ping blog.你的域名        # 应显示你的服务器 IP
curl -sI http://blog.你的域名 | head -1   # 期望 200
```

### 14. 上 HTTPS

证书用 Let's Encrypt，免费且自动续期。它需要域名能从公网访问到 80 端口 ——
所以必须等备案通过、解析生效之后再配。

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d blog.你的域名
```

按提示输入邮箱、同意条款。certbot 会**自动改** `/etc/nginx/sites-available/blog`，
加上 443 的 server 块和证书路径，并把 HTTP 跳转到 HTTPS。

验证续期也会正常工作（这一步经常被跳过，等到 90 天后证书过期才发现续期坏了）：

```bash
sudo certbot renew --dry-run
```

### 15. 改回真实域名并重新构建

阶段一临时写的是 IP，现在改成域名，让 canonical / sitemap / RSS 里的地址正确：

```bash
sudo su - blog
cd ~/blog
cat > .env.production <<'EOF'
NEXT_PUBLIC_SITE_URL=https://blog.你的域名
EOF
npm run build
exit
sudo systemctl restart blog
```

验证：打开 `https://blog.你的域名/feed.xml`，里面的链接应该都是 https 的域名了。

---

## 以后更新内容

每次写完新随笔/笔记推送到 GitHub 之后，在服务器上：

```bash
sudo su - blog
cd ~/blog
git pull
npm ci                 # 只有在 package-lock.json 变了的时候才必须，跑一下无害
npm run build
exit
sudo systemctl restart blog
```

Windows 本地要不要先跑 `npm run check:content`？要 —— 那个脚本能在 1 秒内一次
列出所有内容错误，比在服务器上等构建失败再排查快得多。

---

## 出问题怎么查

**页面打不开，先分清是服务器内部还是外部的问题：**

```bash
curl -sI http://127.0.0.1/ | head -1        # 服务器内部走 nginx
curl -sI http://127.0.0.1:3000 | head -1    # 直连 Node，绕过 nginx
```

- 两个都通 → 问题在**安全组**或防火墙，不是你的配置
- 3000 通、80 不通 → nginx 没起来或配置没生效：`sudo nginx -t`、`sudo systemctl status nginx`
- 两个都不通 → Node 服务挂了：`sudo systemctl status blog`、`sudo journalctl -u blog -n 50`

**页面是 502 Bad Gateway**：nginx 活着但连不上 Node，通常是 blog 服务没起来或者
端口不是 3000。看 `sudo journalctl -u blog -n 50`。

**日志里有 `EADDRINUSE`（端口被占用）**：说明第 7 步那个前台 `npm run start` 还占着
3000 端口没停掉。`ps aux | grep next` 找到进程杀掉，或者 `sudo systemctl restart blog`
前先确认没有前台进程在跑。

**构建被 Killed（内存不够）**：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab   # 重启后仍然生效
free -h                                                       # 确认 Swap 有 2G
```

**改了 `.env.production` 但页面上的地址没变**：这个变量是构建期写死的，
必须重新 `npm run build` 再 `restart`，重启服务本身不会让它生效。

**权限错误（EACCES / 无法写入 .next）**：说明之前用 root 动过仓库文件。

```bash
sudo chown -R blog:blog /home/blog/blog
```

以后记住：仓库操作都用 `blog` 用户。
