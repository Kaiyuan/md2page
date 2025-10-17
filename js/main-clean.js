/**
 * md2page - 纯前端 Markdown 转 HTML 转换器
 * 主入口文件 - 无需 Node.js，直接在浏览器中运行
 */

// 全局应用实例
let app;

// 等待 DOM 和依赖库加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 检查所有必需的依赖
    if (typeof marked === 'undefined') {
        console.error('marked.js 库未加载');
        document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">错误：marked.js 库加载失败，请检查网络连接。</div>';
        return;
    }

    // 检查类是否已定义
    if (typeof MarkdownConverter === 'undefined') {
        console.error('MarkdownConverter 类未定义');
        document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">错误：核心类库加载失败。</div>';
        return;
    }

    console.log('md2page 应用启动中...');
    
    try {
        // 创建应用实例
        app = new App();
        app.init();
    } catch (error) {
        console.error('应用初始化失败:', error);
        document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">错误：应用初始化失败 - ' + error.message + '</div>';
    }
});

/**
 * 主应用类
 */
class App extends EnhancedApp {
    constructor() {
        super();
        this.converter = new MarkdownConverter();
        this.fileHandler = new FileHandler();
        this.themeManager = new ThemeManager();
        this.printOptimizer = new PrintOptimizer();
        this.errorHandler = new ErrorHandler();
    }

    /**
     * 初始化应用
     */
    init() {
        console.log('初始化应用组件...');
        
        // 初始化组件
        this.initComponents();
        
        // 设置事件监听
        this.setupEventListeners();
        
        console.log('md2page 应用已就绪');
        
        // 加载演示内容
        this.loadDemoContent();
    }

    /**
     * 初始化组件
     */
    initComponents() {
        // 初始化输入面板
        const inputContainer = document.getElementById('input-panel');
        if (inputContainer) {
            this.inputPanel = new InputPanel(inputContainer);
            this.inputPanel.render();
            
            // 设置错误处理回调
            this.inputPanel.setOnError((error) => {
                this.errorHandler.showError({
                    title: '文件错误',
                    message: error
                });
            });
        }

        // 初始化预览面板
        const previewContainer = document.getElementById('preview-panel');
        if (previewContainer) {
            this.previewPanel = new PreviewPanel(previewContainer);
            this.previewPanel.render();
        }

        // 初始化主题切换
        const themeContainer = document.querySelector('.header-controls');
        if (themeContainer) {
            this.themeToggle = new ThemeToggle(this.themeManager);
            this.themeToggle.createToggleButton(themeContainer);
        }
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        if (this.inputPanel) {
            // 设置内容变化回调，使用防抖优化
            this.inputPanel.setOnContentChange((content) => {
                this.debouncedUpdatePreview(content);
            });
        }

        // 打印按钮事件
        const printBtn = document.getElementById('print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.handlePrint();
            });
        }

        // 下载按钮事件
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.handleDownload();
            });
        }
    }

    /**
     * 防抖更新预览
     * @param {string} content Markdown 内容
     */
    debouncedUpdatePreview(content) {
        // 清除之前的定时器
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // 设置新的定时器
        this.debounceTimer = setTimeout(() => {
            this.handleContentChange(content);
        }, 300); // 300ms 防抖延迟
    }

    /**
     * 处理下载
     */
    handleDownload() {
        if (!this.currentHtmlContent) {
            this.errorHandler.showError({
                title: '下载失败',
                message: '没有可下载的内容，请先输入 Markdown 内容'
            });
            return;
        }

        try {
            // 获取原始 Markdown 内容用于生成标题
            const markdownContent = this.inputPanel ? this.inputPanel.getContent() : '';
            
            // 创建完整的 HTML 文档
            const fullHtml = this.createFullHtmlDocument(this.currentHtmlContent, markdownContent);
            
            // 下载文件
            const result = this.fileHandler.downloadHTML(
                fullHtml,
                this.fileHandler.generateFilename(markdownContent)
            );

            if (result.success) {
                console.log(`文件下载成功: ${result.fileName} (${result.size} bytes)`);
                this.errorHandler.showSuccess(`文件下载成功: ${result.fileName}`);
            } else {
                this.errorHandler.showError({
                    title: '下载失败',
                    message: result.error
                });
            }

        } catch (error) {
            console.error('下载失败:', error);
            this.errorHandler.showError({
                title: '下载失败',
                message: `下载过程中发生错误: ${error.message}`
            });
        }
    }

    /**
     * 处理打印
     */
    handlePrint() {
        if (!this.currentHtmlContent) {
            this.errorHandler.showError({
                title: '打印失败',
                message: '没有可打印的内容，请先输入 Markdown 内容'
            });
            return;
        }

        try {
            // 使用 PrintOptimizer 创建打印预览
            const printHTML = this.printOptimizer.createPrintPreview(this.currentHtmlContent, {
                removeInteractiveElements: true,
                addPageBreaks: true,
                optimizeImages: true,
                fontSize: '12pt',
                lineHeight: '1.4',
                margins: '2cm'
            });

            // 创建临时打印窗口
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                throw new Error('无法打开打印窗口，请检查浏览器弹窗设置');
            }

            // 写入打印预览内容
            printWindow.document.write(printHTML);
            printWindow.document.close();

            // 等待内容加载完成后打印
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                
                // 打印完成后关闭窗口
                setTimeout(() => {
                    printWindow.close();
                }, 1000);
            };

        } catch (error) {
            console.error('打印失败:', error);
            this.errorHandler.showError({
                title: '打印失败',
                message: `打印过程中发生错误: ${error.message}`
            });
        }
    }

    /**
     * 创建完整的HTML文档
     * @param {string} htmlContent HTML内容
     * @param {string} markdownContent 原始Markdown内容
     * @returns {string} 完整的HTML文档
     */
    createFullHtmlDocument(htmlContent, markdownContent) {
        const title = this.fileHandler.extractTitle(markdownContent) || 'Markdown Document';
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            line-height: 1.3;
        }
        
        h1 { border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
        
        code {
            background: #f1f3f4;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        pre {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
        }
        
        pre code {
            background: none;
            padding: 0;
        }
        
        blockquote {
            border-left: 4px solid #007acc;
            margin: 1rem 0;
            padding: 1rem;
            background: #f8f9fa;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 0.75rem;
            text-align: left;
        }
        
        th {
            background: #f9f9f9;
            font-weight: 600;
        }
        
        img {
            max-width: 100%;
            height: auto;
        }
        
        @media print {
            body { margin: 0; padding: 1rem; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
    }

    /**
     * 加载演示内容
     */
    loadDemoContent() {
        const demoMarkdown = `# md2page - Markdown 转 HTML 转换器

欢迎使用 md2page！这是一个功能强大的纯前端 Markdown 转 HTML 转换器。

## 🚀 主要功能

### 实时预览
- 支持标准 Markdown 语法
- 实时转换和预览
- 防抖优化，性能流畅

### 文件处理
- **上传功能**：支持拖拽上传 .md 文件
- **下载功能**：生成自包含的 HTML 文件
- **智能命名**：根据内容自动生成文件名

### 主题系统
- 🌞 亮色主题
- 🌙 暗色主题  
- 🔄 跟随系统

## 📝 支持的语法

### 标题
\`\`\`markdown
# 一级标题
## 二级标题
### 三级标题
\`\`\`

### 文本样式
- **粗体文本**
- *斜体文本*
- \`行内代码\`

### 列表
1. 有序列表项
2. 另一个列表项

- 无序列表项
- 另一个无序列表项

### 链接和图片
[链接文本](https://example.com)

### 代码块
\`\`\`javascript
function hello() {
    console.log('Hello, md2page!');
}
\`\`\`

### 引用
> 这是一个引用块
> 可以包含多行内容

### 表格
| 功能 | 状态 | 描述 |
|------|------|------|
| Markdown 解析 | ✅ | 支持标准语法 |
| 实时预览 | ✅ | 防抖优化 |
| 文件上传 | ✅ | 拖拽支持 |

## 🎯 使用方法

1. **输入内容**：在左侧编辑器中输入 Markdown 文本
2. **查看预览**：右侧会实时显示转换结果
3. **上传文件**：点击"上传文件"按钮或拖拽文件到编辑器
4. **下载HTML**：点击"下载 HTML"按钮保存文件
5. **打印文档**：点击"打印"按钮进行打印

---

**提示**：你可以清空这些内容，开始编写自己的文档！`;

        // 设置演示内容
        if (this.inputPanel) {
            this.inputPanel.setContent(demoMarkdown);
            // 触发内容更新
            this.debouncedUpdatePreview(demoMarkdown);
        }
    }
}