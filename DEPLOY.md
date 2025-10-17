# 部署说明

md2page 是一个纯前端应用，无需 Node.js 或任何后端服务，可以直接部署到任何 HTTP 服务器。

## 📁 项目文件结构

```
md2page/
├── index.html          # 主页面
├── js/                 # JavaScript 文件
│   ├── main.js        # 主应用逻辑
│   └── classes.js     # 核心类库
├── styles/            # CSS 样式文件
│   ├── main.css       # 主样式
│   ├── themes.css     # 主题样式
│   └── print.css      # 打印样式
└── README.md          # 项目说明
```

## 🚀 部署步骤

### 1. 准备文件
确保你有以下必需文件：
- `index.html`
- `js/main.js`
- `js/classes.js`
- `styles/main.css`
- `styles/themes.css`
- `styles/print.css`

### 2. 上传到服务器
将所有文件保持目录结构上传到 Web 服务器的根目录或子目录。

### 3. 访问网站
在浏览器中访问 `http://your-domain.com/index.html`

## 🌐 CDN 依赖

项目使用以下 CDN 资源（已在 index.html 中配置）：
- marked.js (Markdown 解析)
- Prism.js (代码高亮)

确保服务器可以访问外部 CDN，或者下载这些库到本地。

## 📋 服务器要求

- **最低要求**：任何能提供静态文件的 HTTP 服务器
- **推荐配置**：
  - 启用 gzip 压缩
  - 设置适当的缓存头
  - 支持 HTTPS

## 🔧 常见部署平台

### Apache
```apache
# .htaccess (可选，用于缓存优化)
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Nginx
```nginx
# nginx.conf (可选配置)
location ~* \.(css|js)$ {
    expires 1M;
    add_header Cache-Control "public, immutable";
}
```

### GitHub Pages
1. 将代码推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择主分支作为源
4. 访问 `https://username.github.io/repository-name`

### Netlify
1. 注册 Netlify 账号
2. 拖拽项目文件夹到 Netlify 部署区域
3. 或连接 GitHub 仓库进行自动部署

### Vercel
1. 注册 Vercel 账号
2. 导入 GitHub 仓库
3. 选择静态网站模板
4. 部署完成

## 🛠️ 本地测试

如果需要在本地测试，可以使用任何静态文件服务器：

### Python (推荐)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Node.js
```bash
npx serve .
```

### PHP
```bash
php -S localhost:8000
```

然后访问 `http://localhost:8000`

## ⚠️ 注意事项

1. **CORS 限制**：如果从 `file://` 协议访问可能遇到 CORS 问题，建议使用 HTTP 服务器
2. **CDN 可用性**：确保目标环境可以访问 CDN 资源
3. **浏览器兼容性**：支持现代浏览器（Chrome、Firefox、Safari、Edge）

## 🔍 故障排除

### 页面无法加载
- 检查文件路径是否正确
- 确认所有必需文件都已上传
- 检查浏览器控制台是否有错误

### 样式显示异常
- 确认 CSS 文件路径正确
- 检查服务器是否正确设置了 MIME 类型

### JavaScript 功能不工作
- 检查浏览器控制台错误
- 确认 CDN 资源可以正常加载
- 验证 JavaScript 文件完整性

## 📞 技术支持

如果遇到部署问题，请检查：
1. 浏览器开发者工具的控制台错误
2. 网络请求是否成功
3. 文件路径和权限设置

项目完全基于标准 Web 技术，应该可以在任何现代 Web 服务器上正常运行。