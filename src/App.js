/**
 * 主应用类
 * 负责整个应用的状态管理和组件协调
 */
export class App {
    constructor() {
        // 核心组件
        this.converter = null;
        this.fileHandler = null;
        this.themeManager = null;
        this.printOptimizer = null;
        this.errorHandler = null;
        this.codeHighlighter = null;
        
        // UI 组件
        this.inputPanel = null;
        this.previewPanel = null;
        this.themeToggle = null;
        this.panelSplitter = null;
        this.mobileTabs = null;
        
        // 应用状态
        this.currentHtmlContent = '';
        this.isInitialized = false;
        this.debounceTimer = null;
        
        // 状态管理
        this.state = {
            content: '',
            theme: 'auto',
            layout: 'desktop',
            isLoading: false,
            hasError: false,
            errorMessage: '',
            tocVisible: false,
            previewMode: 'preview'
        };
        
        // 事件监听器
        this.listeners = new Map();
        
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('初始化 md2page 应用...');
            
            // 检查依赖
            await this.checkDependencies();
            
            // 初始化核心组件
            this.initCoreComponents();
            
            // 初始化 UI 组件
            this.initUIComponents();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 初始化响应式布局
            this.initResponsiveLayout();
            
            // 加载演示内容
            this.loadDemoContent();
            
            this.isInitialized = true;
            this.setState({ isLoading: false });
            
            console.log('md2page 应用初始化完成');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.handleError('应用初始化失败', error);
        }
    }

    /**
     * 检查依赖
     */
    async checkDependencies() {
        const dependencies = [
            { name: 'marked', check: () => typeof marked !== 'undefined' },
            { name: 'Prism', check: () => typeof Prism !== 'undefined' }
        ];

        for (const dep of dependencies) {
            if (!dep.check()) {
                throw new Error(`依赖库 ${dep.name} 未加载`);
            }
        }
    }

    /**
     * 初始化核心组件
     */
    initCoreComponents() {
        this.converter = new MarkdownConverter();
        this.fileHandler = new FileHandler();
        this.themeManager = new ThemeManager();
        this.printOptimizer = new PrintOptimizer();
        this.errorHandler = new ErrorHandler();
        this.codeHighlighter = new CodeHighlighter();
        
        console.log('核心组件初始化完成');
    }

    /**
     * 初始化 UI 组件
     */
    initUIComponents() {
        // 初始化输入面板
        const inputContainer = document.getElementById('input-panel');
        if (inputContainer) {
            this.inputPanel = new InputPanel(inputContainer);
            this.inputPanel.render();
            
            // 设置内容变化回调
            this.inputPanel.setOnContentChange((content) => {
                this.handleContentChange(content);
            });
            
            // 设置错误回调
            this.inputPanel.setOnError((error) => {
                this.handleError('文件处理错误', error);
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

        console.log('UI 组件初始化完成');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 主题变化监听
        this.themeManager.addListener((event, data) => {
            if (event === 'theme-change') {
                this.handleThemeChange(data);
            }
        });

        // 下载按钮
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.handleDownload();
            });
        }

        // 打印按钮
        const printBtn = document.getElementById('print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.handlePrint();
            });
        }

        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        console.log('事件监听器设置完成');
    }

    /**
     * 初始化响应式布局
     */
    initResponsiveLayout() {
        const mainContainer = document.querySelector('.app-main');
        
        if (window.innerWidth > 768) {
            // 桌面端：初始化面板分割器
            this.initPanelSplitter();
            this.setState({ layout: 'desktop' });
        } else {
            // 移动端：初始化标签切换
            this.initMobileTabs();
            this.setState({ layout: 'mobile' });
        }
    }

    /**
     * 初始化面板分割器
     */
    initPanelSplitter() {
        const mainContainer = document.querySelector('.app-main');
        const inputPanel = document.getElementById('input-panel');
        const previewPanel = document.getElementById('preview-panel');
        
        if (mainContainer && inputPanel && previewPanel) {
            this.panelSplitter = new PanelSplitter(mainContainer, inputPanel, previewPanel);
            
            // 加载保存的面板大小
            setTimeout(() => {
                this.panelSplitter.loadSavedSizes();
            }, 100);
        }
    }

    /**
     * 初始化移动端标签
     */
    initMobileTabs() {
        const mainContainer = document.querySelector('.app-main');
        
        if (mainContainer) {
            this.mobileTabs = new MobileTabs(mainContainer);
            
            // 监听标签切换事件
            mainContainer.addEventListener('tabchange', (e) => {
                this.setState({ previewMode: e.detail.activeTab });
            });
        }
    }

    /**
     * 处理内容变化
     */
    handleContentChange(content) {
        // 防抖处理
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.updatePreview(content);
        }, 300);
    }

    /**
     * 更新预览
     */
    updatePreview(content) {
        if (!this.previewPanel) return;

        try {
            this.setState({ content, isLoading: true });

            // 验证内容
            const validation = this.converter.validateMarkdown(content);
            if (!validation.isValid) {
                this.handleValidationError(validation.errors);
                return;
            }

            // 转换 Markdown
            const htmlContent = this.converter.parseMarkdown(content);
            
            // 更新预览
            this.previewPanel.updateContent(htmlContent);
            
            // 保存当前 HTML 内容
            this.currentHtmlContent = htmlContent;
            
            // 更新按钮状态
            this.updateButtonStates(htmlContent);
            
            // 显示警告（如果有）
            if (validation.warnings.length > 0) {
                this.showWarning(validation.warnings[0]);
            } else {
                this.showSuccess('预览已更新');
            }

            this.setState({ isLoading: false, hasError: false });

        } catch (error) {
            this.handleError('预览更新失败', error);
        }
    }

    /**
     * 处理验证错误
     */
    handleValidationError(errors) {
        const errorMessage = errors.join(', ');
        this.previewPanel.updateContent(`
            <div class="error">
                <h3>内容验证失败</h3>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `);
        
        this.currentHtmlContent = '';
        this.updateButtonStates('');
        this.setState({ hasError: true, errorMessage });
        this.showError('内容验证失败');
    }

    /**
     * 更新按钮状态
     */
    updateButtonStates(htmlContent) {
        const hasContent = htmlContent && htmlContent.trim() !== '';
        
        const downloadBtn = document.getElementById('download-btn');
        const printBtn = document.getElementById('print-btn');
        
        if (downloadBtn) downloadBtn.disabled = !hasContent;
        if (printBtn) printBtn.disabled = !hasContent;
    }

    /**
     * 处理主题变化
     */
    handleThemeChange(data) {
        this.setState({ theme: data.effectiveTheme });
        
        // 同步代码高亮主题
        if (this.codeHighlighter) {
            this.codeHighlighter.syncWithAppTheme(data.effectiveTheme);
        }
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const wasMobile = this.state.layout === 'mobile';
        const isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== isMobile) {
            // 布局模式发生变化，重新初始化
            if (isMobile) {
                this.switchToMobileLayout();
            } else {
                this.switchToDesktopLayout();
            }
        }
    }

    /**
     * 切换到移动端布局
     */
    switchToMobileLayout() {
        if (this.panelSplitter) {
            this.panelSplitter.destroy();
            this.panelSplitter = null;
        }
        
        this.initMobileTabs();
        this.setState({ layout: 'mobile' });
    }

    /**
     * 切换到桌面端布局
     */
    switchToDesktopLayout() {
        if (this.mobileTabs) {
            this.mobileTabs.destroy();
            this.mobileTabs = null;
        }
        
        this.initPanelSplitter();
        this.setState({ layout: 'desktop' });
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.handleDownload();
                    break;
                case 'p':
                    e.preventDefault();
                    this.handlePrint();
                    break;
                case 't':
                    e.preventDefault();
                    if (this.themeManager) {
                        this.themeManager.toggleTheme();
                    }
                    break;
            }
        }
    }

    /**
     * 处理下载
     */
    async handleDownload() {
        if (!this.currentHtmlContent) {
            this.showWarning('没有可下载的内容，请先输入 Markdown 内容');
            return;
        }

        try {
            this.showInfo('正在生成 HTML 文件...');

            const markdownContent = this.inputPanel ? this.inputPanel.getContent() : '';
            const currentTheme = this.themeManager.getEffectiveTheme();
            
            const selfContainedHTML = this.fileHandler.createSelfContainedHTML(
                this.currentHtmlContent,
                {
                    title: this.fileHandler.generateFilename(markdownContent),
                    theme: currentTheme,
                    includeStyles: true,
                    includeTOC: true
                }
            );

            const result = this.fileHandler.downloadHTML(
                selfContainedHTML,
                this.fileHandler.generateFilename(markdownContent)
            );

            if (result.success) {
                this.showSuccess(`文件下载成功: ${result.fileName}`);
            } else {
                this.handleError('下载失败', result.error);
            }

        } catch (error) {
            this.handleError('下载过程中发生错误', error);
        }
    }

    /**
     * 处理打印
     */
    async handlePrint() {
        if (!this.currentHtmlContent) {
            this.showWarning('没有可打印的内容，请先输入 Markdown 内容');
            return;
        }

        try {
            this.showInfo('准备打印...');

            const printHTML = this.printOptimizer.createPrintPreview(this.currentHtmlContent, {
                removeInteractiveElements: true,
                addPageBreaks: true,
                optimizeImages: true,
                fontSize: '12pt',
                lineHeight: '1.4',
                margins: '2cm'
            });

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                throw new Error('无法打开打印窗口，请检查浏览器弹窗设置');
            }

            printWindow.document.write(printHTML);
            printWindow.document.close();

            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                setTimeout(() => printWindow.close(), 1000);
            };

            this.showSuccess('打印窗口已打开');

        } catch (error) {
            this.handleError('打印过程中发生错误', error);
        }
    }

    /**
     * 加载演示内容
     */
    loadDemoContent() {
        const demoMarkdown = `# md2page - Markdown 转 HTML 转换器

欢迎使用 md2page！这是一个功能强大的纯前端 Markdown 转 HTML 转换器。

## 主要功能

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

### 代码高亮
支持多种编程语言的语法高亮：

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}
\`\`\`

### 目录导航
自动生成层级化目录，支持：
- 点击跳转
- 滚动高亮
- 折叠展开

## 使用说明

1. **输入内容**：在左侧面板输入 Markdown 内容
2. **实时预览**：右侧面板会实时显示转换后的 HTML 效果
3. **切换主题**：点击右上角的主题按钮
4. **查看目录**：点击"目录"按钮显示文档结构
5. **导出文件**：点击"下载 HTML"或"打印"按钮

---

**提示**：你可以清空这些内容，开始编写自己的文档！`;

        if (this.inputPanel) {
            this.inputPanel.setContent(demoMarkdown);
            this.handleContentChange(demoMarkdown);
        }
    }

    /**
     * 状态管理
     */
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        // 触发状态变化事件
        this.emit('stateChange', { oldState, newState: this.state });
    }

    /**
     * 获取当前状态
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 事件系统
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件监听器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 错误处理
     */
    handleError(title, error) {
        console.error(title, error);
        this.setState({ hasError: true, errorMessage: error.message || error });
        
        if (this.errorHandler) {
            this.errorHandler.showError({
                title,
                message: error.message || error.toString()
            });
        }
    }

    /**
     * 消息显示
     */
    showSuccess(message) {
        if (this.statusIndicator) {
            this.statusIndicator.show(message, 'success');
        }
    }

    showError(message) {
        if (this.statusIndicator) {
            this.statusIndicator.show(message, 'error');
        }
    }

    showWarning(message) {
        if (this.statusIndicator) {
            this.statusIndicator.show(message, 'warning');
        }
    }

    showInfo(message) {
        if (this.statusIndicator) {
            this.statusIndicator.show(message, 'info');
        }
    }

    /**
     * 销毁应用
     */
    destroy() {
        // 清理定时器
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // 销毁组件
        if (this.panelSplitter) this.panelSplitter.destroy();
        if (this.mobileTabs) this.mobileTabs.destroy();
        if (this.previewPanel) this.previewPanel.destroy();
        if (this.codeHighlighter) this.codeHighlighter.destroy();

        // 清理事件监听器
        this.listeners.clear();

        console.log('应用已销毁');
    }
}