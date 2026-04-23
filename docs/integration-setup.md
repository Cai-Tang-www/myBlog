# 集成配置清单（账号与 Key）

这份清单按“先能上线，再做自动化上传”设计。  
当前项目代码运行只需要 `.env.local` 的公开变量，不强制你先配置云厂商私钥。

## 1) GitHub Pages + 自定义域名

### 你需要准备
- 一个 GitHub 仓库（建议 `main` 作为发布分支）
- 一个域名（如 `blog.example.com`）

### 你需要操作
1. 仓库 `Settings -> Pages -> Source` 选择 `GitHub Actions`。
2. 仓库 `Settings -> Secrets and variables -> Actions -> Variables` 新建：
   - `PAGES_CUSTOM_DOMAIN=blog.example.com`
3. 域名 DNS 配置：
   - 子域名通常添加 `CNAME blog -> <username>.github.io`
4. 在 Pages 设置中填同一个自定义域名，等待证书签发。

## 2) giscus 评论

### 你需要准备
- 一个公开 GitHub 仓库（可和博客同仓库）
- 仓库开启 `Discussions`

### 你需要操作
1. 安装 [giscus app](https://github.com/apps/giscus) 到目标仓库。
2. 打开 [giscus 配置页](https://giscus.app/zh-CN) 选择仓库、分类、映射方式。
3. 从页面生成的 script 参数中复制以下值到 `.env.local`：
   - `NEXT_PUBLIC_GISCUS_REPO`（`owner/repo`）
   - `NEXT_PUBLIC_GISCUS_REPO_ID`
   - `NEXT_PUBLIC_GISCUS_CATEGORY`
   - `NEXT_PUBLIC_GISCUS_CATEGORY_ID`

## 3) 对象存储图片（七牛或火山）

### 你需要准备
- 七牛 Kodo 或 火山 TOS 任一账号
- 一个公开可访问的图片域名（建议 `img.example.com`）

### 你需要操作（共通）
1. 创建 Bucket（存储桶）。
2. 绑定自定义域名，并开启 HTTPS。
3. 在 `.env.local` 写入：
   - `NEXT_PUBLIC_IMAGE_PROVIDER=qiniu` 或 `volc`
   - `NEXT_PUBLIC_IMAGE_BASE_URL=https://img.example.com`

### 需要哪些 Key？
- 如果你只手动上传图片：不需要在本项目配置 AK/SK。
- 如果你要后续“命令行自动上传图片”：才需要云厂商 AK/SK。

## 4) 本地环境文件示例

```bash
NEXT_PUBLIC_SITE_URL=https://blog.example.com

NEXT_PUBLIC_IMAGE_PROVIDER=qiniu
NEXT_PUBLIC_IMAGE_BASE_URL=https://img.example.com

NEXT_PUBLIC_GISCUS_REPO=owner/repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxxxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxxx
```

## 5) 自检

```bash
npm run env:check
npm run dev
```

如果只缺 giscus 或对象存储变量，页面仍可运行，只是对应功能会降级为占位状态。
