/**
 * Markdown 转换器
 * 负责将 Markdown 内容转换为 HTML
 */

import { marked } from 'marked';

export class MarkdownConverter {
    constructor() {
        this.setupMarked();
    }

    /**
     * 配置 marked 解析器
     */
    setupMarked() {
        // 配置 marked 选项
        marked.setOptions({
            breaks: true,        // 支持换行符转换
            gfm: true,          // 启用 GitHub Flavored Markdown
            headerIds: true,    // 为标题生成 ID
            mangle: false       // 不混淆邮箱地址
        });

        // 自定义渲染器
        const renderer = new marked.Renderer();
        
        // 为标题添加锚点 ID
        renderer.heading = (text, level) => {
            const id = this.generateHeadingId(text);
            return `<h${level} id="${id}">${text}</h${level}>`;
        };

        marked.use({ renderer });
    }

    /**
     * 解析 Markdown 内容
     * @param {string} content Markdown 内容
     * @returns {string} 解析后的 HTML
     */
    parseMarkdown(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }

        try {
            return marked.parse(content);
        } catch (error) {
            console.error('Markdown 解析错误:', error);
            return `<p class="error">Markdown 解析失败: ${error.message}</p>`;
        }
    }

    /**
     * 生成完整的 HTML 文档
     * @param {string} parsedContent 解析后的 HTML 内容
     * @param {Object} options 生成选项
     * @returns {string} 完整的 HTML 文档
     */
    generateHTML(parsedContent, options = {}) {
        const {
            title = 'Markdown Document',
            theme = 'light',
            includeTableOfContents = false
        } = options;

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${this.getInlineStyles(theme)}
    </style>
</head>
<body class="theme-${theme}">
    ${includeTableOfContents ? this.generateTOCHTML(parsedContent) : ''}
    <div class="content">
        ${parsedContent}
    </div>
</body>
</html>`;
    }

    /**
     * 验证 Markdown 内容
     * @param {string} content Markdown 内容
     * @returns {Object} 验证结果
     */
    validateMarkdown(content) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!content) {
            result.isValid = false;
            result.errors.push('内容不能为空');
            return result;
        }

        if (typeof content !== 'string') {
            result.isValid = false;
            result.errors.push('内容必须是字符串类型');
            return result;
        }

        // 检查内容长度
        if (content.length > 1000000) { // 1MB 限制
            result.warnings.push('内容过长，可能影响性能');
        }

        return result;
    }

    /**
     * 为标题生成 ID
     * @param {string} text 标题文本
     * @returns {string} 生成的 ID
     */
    generateHeadingId(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * 生成目录 HTML
     * @param {string} htmlContent HTML 内容
     * @returns {string} 目录 HTML
     */
    generateTOCHTML(htmlContent) {
        // 这里先返回占位符，后续在 TOCGenerator 中实现
        return '<nav class="table-of-contents"><h2>目录</h2></nav>';
    }

    /**
     * 获取内联样式
     * @param {string} theme 主题名称
     * @returns {string} CSS 样式
     */
    getInlineStyles(theme) {
        return `
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
                color: ${theme === 'dark' ? '#e1e1e1' : '#333'};
                background-color: ${theme === 'dark' ? '#1a1a1a' : '#fff'};
            }
            h1, h2, h3, h4, h5, h6 { 
                margin-top: 2rem; 
                margin-bottom: 1rem; 
            }
            p { margin: 1rem 0; }
            code { 
                background-color: ${theme === 'dark' ? '#2d2d2d' : '#f5f5f5'};
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
            }
            pre { 
                background-color: ${theme === 'dark' ? '#2d2d2d' : '#f5f5f5'};
                padding: 1rem;
                border-radius: 6px;
                overflow-x: auto;
            }
            blockquote {
                border-left: 4px solid #007acc;
                margin: 1rem 0;
                padding-left: 1rem;
                color: ${theme === 'dark' ? '#b3b3b3' : '#666'};
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 1rem 0;
            }
            th, td {
                border: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
                padding: 0.5rem;
                text-align: left;
            }
            th {
                background-color: ${theme === 'dark' ? '#333' : '#f9f9f9'};
            }
        `;
    }
}