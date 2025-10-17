/**
 * 文件处理类
 * 负责文件的下载和生成
 */

export class FileHandler {
    constructor() {
        this.defaultFileName = 'markdown-document';
    }

    /**
     * 下载 HTML 文件
     * @param {string} htmlContent HTML 内容
     * @param {string} fileName 文件名（可选）
     */
    downloadHTML(htmlContent, fileName = null) {
        try {
            // 生成文件名
            const finalFileName = fileName || this.generateFilename(htmlContent);
            
            // 确保文件名以 .html 结尾
            const fullFileName = finalFileName.endsWith('.html') 
                ? finalFileName 
                : `${finalFileName}.html`;

            // 创建 Blob 对象
            const blob = new Blob([htmlContent], { 
                type: 'text/html;charset=utf-8' 
            });

            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = fullFileName;
            link.style.display = 'none';

            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 清理 URL 对象
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);

            return {
                success: true,
                fileName: fullFileName,
                size: blob.size
            };

        } catch (error) {
            console.error('下载失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 生成文件名
     * @param {string} content HTML 或 Markdown 内容
     * @returns {string} 生成的文件名
     */
    generateFilename(content) {
        if (!content || typeof content !== 'string') {
            return this.defaultFileName;
        }

        // 尝试从内容中提取标题
        let title = this.extractTitle(content);
        
        if (!title) {
            // 如果没有找到标题，使用时间戳
            const now = new Date();
            title = `${this.defaultFileName}-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        }

        // 清理文件名，移除不安全字符
        return this.sanitizeFilename(title);
    }

    /**
     * 从内容中提取标题
     * @param {string} content 内容
     * @returns {string|null} 提取的标题
     */
    extractTitle(content) {
        // 尝试从 HTML 中提取 title 标签
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
            return titleMatch[1].trim();
        }

        // 尝试从 HTML 中提取第一个 h1 标签
        const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match && h1Match[1]) {
            return h1Match[1].trim();
        }

        // 尝试从 Markdown 中提取第一个一级标题
        const mdH1Match = content.match(/^#\s+(.+)$/m);
        if (mdH1Match && mdH1Match[1]) {
            return mdH1Match[1].trim();
        }

        // 尝试从 HTML 中提取第一个 h2 标签
        const h2Match = content.match(/<h2[^>]*>([^<]+)<\/h2>/i);
        if (h2Match && h2Match[1]) {
            return h2Match[1].trim();
        }

        // 尝试从 Markdown 中提取第一个二级标题
        const mdH2Match = content.match(/^##\s+(.+)$/m);
        if (mdH2Match && mdH2Match[1]) {
            return mdH2Match[1].trim();
        }

        return null;
    }

    /**
     * 清理文件名
     * @param {string} filename 原始文件名
     * @returns {string} 清理后的文件名
     */
    sanitizeFilename(filename) {
        if (!filename) return this.defaultFileName;

        return filename
            // 移除 HTML 标签
            .replace(/<[^>]*>/g, '')
            // 移除或替换不安全字符
            .replace(/[<>:"/\\|?*]/g, '')
            // 替换空格为连字符
            .replace(/\s+/g, '-')
            // 移除连续的连字符
            .replace(/-+/g, '-')
            // 移除开头和结尾的连字符
            .replace(/^-+|-+$/g, '')
            // 限制长度
            .substring(0, 100)
            // 如果为空，使用默认名称
            || this.defaultFileName;
    }

    /**
     * 验证 HTML 内容完整性
     * @param {string} htmlContent HTML 内容
     * @returns {Object} 验证结果
     */
    validateHTML(htmlContent) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!htmlContent || typeof htmlContent !== 'string') {
            result.isValid = false;
            result.errors.push('HTML 内容不能为空');
            return result;
        }

        // 检查基本 HTML 结构
        if (!htmlContent.includes('<!DOCTYPE html>')) {
            result.warnings.push('缺少 DOCTYPE 声明');
        }

        if (!htmlContent.includes('<html')) {
            result.isValid = false;
            result.errors.push('缺少 HTML 根元素');
        }

        if (!htmlContent.includes('<head>') || !htmlContent.includes('</head>')) {
            result.warnings.push('缺少 HEAD 部分');
        }

        if (!htmlContent.includes('<body>') || !htmlContent.includes('</body>')) {
            result.isValid = false;
            result.errors.push('缺少 BODY 部分');
        }

        // 检查内容长度
        if (htmlContent.length > 50 * 1024 * 1024) { // 50MB
            result.warnings.push('HTML 文件过大，可能影响浏览器性能');
        }

        return result;
    }

    /**
     * 创建自包含的 HTML 文件
     * @param {string} htmlContent HTML 内容
     * @param {Object} options 选项
     * @returns {string} 自包含的 HTML
     */
    createSelfContainedHTML(htmlContent, options = {}) {
        const {
            title = 'Markdown Document',
            theme = 'light',
            includeStyles = true
        } = options;

        // 如果已经是完整的 HTML 文档，直接返回
        if (htmlContent.includes('<!DOCTYPE html>')) {
            return htmlContent;
        }

        // 构建完整的 HTML 文档
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    ${includeStyles ? this.getEmbeddedStyles(theme) : ''}
</head>
<body class="theme-${theme}">
    <div class="content">
        ${htmlContent}
    </div>
</body>
</html>`;
    }

    /**
     * 获取嵌入式样式
     * @param {string} theme 主题
     * @returns {string} CSS 样式
     */
    getEmbeddedStyles(theme) {
        return `<style>
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    color: ${theme === 'dark' ? '#e1e1e1' : '#333'};
    background-color: ${theme === 'dark' ? '#1a1a1a' : '#fff'};
}

.content {
    max-width: 100%;
}

h1, h2, h3, h4, h5, h6 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    line-height: 1.3;
}

h1 { font-size: 2rem; }
h2 { font-size: 1.7rem; }
h3 { font-size: 1.4rem; }
h4 { font-size: 1.2rem; }
h5 { font-size: 1.1rem; }
h6 { font-size: 1rem; }

p {
    margin: 1rem 0;
}

ul, ol {
    margin: 1rem 0;
    padding-left: 2rem;
}

li {
    margin: 0.5rem 0;
}

blockquote {
    margin: 1rem 0;
    padding: 1rem;
    border-left: 4px solid #007acc;
    background-color: ${theme === 'dark' ? '#2a2a2a' : '#f8f9fa'};
    border-radius: 0 4px 4px 0;
}

code {
    background-color: ${theme === 'dark' ? '#2d2d2d' : '#f1f3f4'};
    color: ${theme === 'dark' ? '#e1e1e1' : '#333'};
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
}

pre {
    background-color: ${theme === 'dark' ? '#2d2d2d' : '#f8f9fa'};
    color: ${theme === 'dark' ? '#e1e1e1' : '#333'};
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1rem 0;
}

pre code {
    background: none;
    padding: 0;
    color: inherit;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
}

th, td {
    border: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
    padding: 0.5rem;
    text-align: left;
}

th {
    background-color: ${theme === 'dark' ? '#333' : '#f9f9f9'};
    font-weight: 600;
}

img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1rem 0;
}

a {
    color: #007acc;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

@media print {
    @page {
        margin: 2cm;
        size: A4;
    }
    
    body {
        color: #000 !important;
        background-color: #fff !important;
        font-family: "Times New Roman", Times, serif !important;
        font-size: 12pt !important;
        line-height: 1.5 !important;
    }
    
    h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        color: #000 !important;
    }
    
    h1 {
        font-size: 18pt !important;
        border-bottom: 2pt solid #000;
    }
    
    h2 {
        font-size: 16pt !important;
        border-bottom: 1pt solid #666;
    }
    
    p {
        orphans: 3;
        widows: 3;
    }
    
    table, pre, blockquote {
        page-break-inside: avoid;
    }
    
    a {
        color: #000 !important;
        text-decoration: underline !important;
    }
    
    a[href]:after {
        content: " (" attr(href) ")";
        font-size: 9pt;
        color: #666;
    }
    
    pre, code {
        background-color: #f5f5f5 !important;
        color: #000 !important;
        border: 1pt solid #ccc !important;
    }
    
    pre {
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
    }
    
    img {
        max-width: 100% !important;
        page-break-inside: avoid;
    }
}
</style>`;
    }

    /**
     * 转义 HTML 字符
     * @param {string} text 文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 设置默认文件名
     * @param {string} name 默认文件名
     */
    setDefaultFileName(name) {
        this.defaultFileName = name;
    }
}