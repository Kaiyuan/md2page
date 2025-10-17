/**
 * md2page 主入口文件
 */

import { MarkdownConverter } from './core/MarkdownConverter.js';
import { FileHandler } from './core/FileHandler.js';
import { ThemeManager } from './core/ThemeManager.js';
import { PrintOptimizer } from './core/PrintOptimizer.js';
import { InputPanel } from './components/InputPanel.js';
import { PreviewPanel } from './components/PreviewPanel.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { ErrorHandler } from './components/ErrorHandler.js';

class App {
    constructor() {
        this.converter = new MarkdownConverter();
        this.fileHandler = new FileHandler();
        this.themeManager = new ThemeManager();
        this.printOptimizer = new PrintOptimizer();
        this.errorHandler = new ErrorHandler();
        this.inputPanel = null;
        this.previewPanel = null;
        this.themeToggle = null;
        this.debounceTimer = null;
        this.currentHtmlContent = '';
        this.statusIndicator = null;
    }

    /**
     * 初始化应用
     */
    init() {
        console.log('md2page 应用启动中...');
        
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
                this.errorHandler.showFileError(error);
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

        // 初始化状态指示器
        const footerContainer = document.querySelector('.app-footer') || document.body;
        this.statusIndicator = this.errorHandler.createStatusIndicator(footerContainer);
    }

    /**
     * 设置事件监听器
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
            this.updatePreview(content);
        }, 300); // 300ms 防抖延迟
    }

    /**
     * 更新预览内容
     * @param {string} content Markdown 内容
     */
    updatePreview(content) {
        if (!this.previewPanel) return;

        const downloadBtn = document.getElementById('download-btn');
        const printBtn = document.getElementById('print-btn');

        // 验证内容
        const validation = this.converter.validateMarkdown(content);
        if (!validation.isValid) {
            console.warn('Markdown 验证失败:', validation.errors);
            this.errorHandler.showValidationErrors(validation.errors);
            this.previewPanel.updateContent(`
                <div class="error">
                    <h3>内容验证失败</h3>
                    <ul>
                        ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `);
            this.currentHtmlContent = '';
            if (downloadBtn) downloadBtn.disabled = true;
            if (printBtn) printBtn.disabled = true;
            if (this.statusIndicator) {
                this.statusIndicator.show('内容验证失败', 'error');
            }
            return;
        }

        // 转换 Markdown
        const htmlContent = this.converter.parseMarkdown(content);
        
        // 更新预览
        this.previewPanel.updateContent(htmlContent);
        
        // 保存当前 HTML 内容用于下载
        this.currentHtmlContent = htmlContent;
        
        // 启用按钮
        const hasContent = htmlContent && htmlContent.trim() !== '';
        if (downloadBtn) {
            downloadBtn.disabled = !hasContent;
        }
        if (printBtn) {
            printBtn.disabled = !hasContent;
        }

        // 显示警告（如果有）
        if (validation.warnings.length > 0) {
            console.warn('Markdown 警告:', validation.warnings);
            if (this.statusIndicator) {
                this.statusIndicator.show(validation.warnings[0], 'warning');
            }
        } else if (this.statusIndicator) {
            this.statusIndicator.show('预览已更新', 'success', 2000);
        }
    }

    /**
     * 处理下载
     */
    handleDownload() {
        if (!this.currentHtmlContent) {
            this.errorHandler.showError({
                title: '下载失败',
                message: '没有可下载的内容，请先输入 Markdown 内容',
                type: 'warning'
            });
            return;
        }

        try {
            if (this.statusIndicator) {
                this.statusIndicator.show('正在生成 HTML 文件...', 'info', 0);
            }

            // 获取原始 Markdown 内容用于生成文件名
            const markdownContent = this.inputPanel ? this.inputPanel.getContent() : '';
            
            // 创建自包含的 HTML
            const currentTheme = this.themeManager.getEffectiveTheme();
            const selfContainedHTML = this.fileHandler.createSelfContainedHTML(
                this.currentHtmlContent,
                {
                    title: this.fileHandler.generateFilename(markdownContent),
                    theme: currentTheme,
                    includeStyles: true
                }
            );

            // 验证 HTML
            const validation = this.fileHandler.validateHTML(selfContainedHTML);
            if (!validation.isValid) {
                console.error('HTML 验证失败:', validation.errors);
                this.errorHandler.showValidationErrors(validation.errors);
                if (this.statusIndicator) {
                    this.statusIndicator.show('HTML 生成失败', 'error');
                }
                return;
            }

            // 显示警告（如果有）
            if (validation.warnings.length > 0) {
                this.errorHandler.showWarning(validation.warnings.join('\n'));
            }

            // 下载文件
            const result = this.fileHandler.downloadHTML(
                selfContainedHTML,
                this.fileHandler.generateFilename(markdownContent)
            );

            if (result.success) {
                console.log(`文件下载成功: ${result.fileName} (${result.size} bytes)`);
                this.errorHandler.showSuccess(`文件下载成功: ${result.fileName}`);
                if (this.statusIndicator) {
                    this.statusIndicator.show(`下载完成: ${result.fileName}`, 'success');
                }
            } else {
                this.errorHandler.showError({
                    title: '下载失败',
                    message: result.error,
                    type: 'error',
                    showRetry: true,
                    retryCallback: () => this.handleDownload()
                });
                if (this.statusIndicator) {
                    this.statusIndicator.show('下载失败', 'error');
                }
            }

        } catch (error) {
            console.error('下载过程中发生错误:', error);
            this.errorHandler.showError({
                title: '下载失败',
                message: `下载过程中发生错误: ${error.message}`,
                details: error.stack,
                type: 'error',
                showRetry: true,
                retryCallback: () => this.handleDownload()
            });
            if (this.statusIndicator) {
                this.statusIndicator.show('下载失败', 'error');
            }
        }
    }

    /**
     * 处理打印
     */
    handlePrint() {
        if (!this.currentHtmlContent) {
            this.errorHandler.showError({
                title: '打印失败',
                message: '没有可打印的内容，请先输入 Markdown 内容',
                type: 'warning'
            });
            return;
        }

        try {
            if (this.statusIndicator) {
                this.statusIndicator.show('准备打印...', 'info', 2000);
            }

            // 获取原始 Markdown 内容用于生成标题
            const markdownContent = this.inputPanel ? this.inputPanel.getContent() : '';
            const title = this.fileHandler.generateFilename(markdownContent);

            // 优化打印内容
            const optimizedContent = this.printOptimizer.optimizeForPrint(this.currentHtmlContent, {
                removeInteractiveElements: true,
                addPageBreaks: true,
                optimizeImages: true,
                addPrintStyles: false // 我们已经有了打印样式
            });

            // 创建临时打印窗口
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                throw new Error('无法打开打印窗口，请检查浏览器弹窗设置');
            }

            // 生成完整的打印页面
            const printHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.fileHandler.escapeHtml(title)}</title>
    <style>
        ${this.printOptimizer.generatePrintCSS()}
    </style>
</head>
<body>
    <div class="content">
        ${optimizedContent}
    </div>
</body>
</html>`;

            // 写入内容并打印
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

            if (this.statusIndicator) {
                this.statusIndicator.show('打印窗口已打开', 'success');
            }

        } catch (error) {
            console.error('打印过程中发生错误:', error);
            this.errorHandler.showError({
                title: '打印失败',
                message: `打印过程中发生错误: ${error.message}`,
                details: error.stack,
                type: 'error'
            });
            if (this.statusIndicator) {
                this.statusIndicator.show('打印失败', 'error');
            }
        }
    }

    /**
     * 加载演示内容
     */
    loadDemoContent() {
        const demoMarkdown = `# md2page - Markdown 转 HTML 转换器

欢迎使用 md2page！这是一个功能强大的纯前端 Markdown 转 HTML 转换器。

## 主要功能

### 1. 实时预览
- 支持标准 Markdown 语法
- 实时转换和预览
- 防抖优化，性能流畅

### 2. 文件处理
- **上传功能**：支持拖拽上传 .md 文件
- **下载功能**：生成自包含的 HTML 文件
- **智能命名**：根据内容自动生成文件名

### 3. 主题系统
- 🌞 亮色主题
- 🌙 暗色主题  
- 🔄 跟随系统

### 4. 目录导航
自动生成层级化目录，支持：
- 点击跳转
- 滚动高亮
- 折叠展开

## 代码示例

\`\`\`javascript
// 这是一个 JavaScript 代码示例
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

## 表格支持

| 功能 | 状态 | 说明 |
|------|------|------|
| Markdown 解析 | ✅ | 支持标准语法 |
| 主题切换 | ✅ | 三种主题模式 |
| 文件上传 | ✅ | 拖拽上传 |
| 目录生成 | ✅ | 自动生成 |
| 打印优化 | ✅ | 专业打印样式 |

## 引用示例

> 这是一个引用块的示例。md2page 支持各种 Markdown 语法，包括引用、列表、代码块等。

## 列表示例

**无序列表：**
- 项目一
- 项目二
  - 子项目 2.1
  - 子项目 2.2
- 项目三

**有序列表：**
1. 第一步：输入或上传 Markdown 内容
2. 第二步：查看实时预览
3. 第三步：下载或打印 HTML 文件

## 使用说明

1. **输入内容**：在左侧面板输入 Markdown 内容，或点击"上传 .md 文件"按钮
2. **实时预览**：右侧面板会实时显示转换后的 HTML 效果
3. **切换主题**：点击右上角的主题按钮切换显示模式
4. **查看目录**：点击"目录"按钮显示文档结构
5. **导出文件**：点击"下载 HTML"或"打印"按钮导出内容

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

// 等待 DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

// 导出供测试使用
export { App };