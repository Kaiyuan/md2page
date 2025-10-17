/**
 * md2page 核心类库 - 清理版本
 */

/**
 * Markdown 转换器
 */
class MarkdownConverter {
    constructor() {
        this.setupMarked();
    }

    setupMarked() {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        });

        const renderer = new marked.Renderer();
        renderer.heading = (text, level) => {
            const id = this.generateHeadingId(text);
            return `<h${level} id="${id}">${text}</h${level}>`;
        };

        marked.use({ renderer });
    }

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

        if (content.length > 1000000) {
            result.warnings.push('内容过长，可能影响性能');
        }

        return result;
    }

    generateHeadingId(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}

/**
 * 文件处理类
 */
class FileHandler {
    constructor() {
        this.defaultFileName = 'markdown-document';
    }

    downloadHTML(htmlContent, fileName = null) {
        try {
            const finalFileName = fileName || this.generateFilename(htmlContent);
            const fullFileName = finalFileName.endsWith('.html') 
                ? finalFileName 
                : `${finalFileName}.html`;

            const blob = new Blob([htmlContent], { 
                type: 'text/html;charset=utf-8' 
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = fullFileName;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

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

    generateFilename(content) {
        if (!content || typeof content !== 'string') {
            return this.defaultFileName;
        }

        let title = this.extractTitle(content);
        
        if (!title) {
            const now = new Date();
            title = `${this.defaultFileName}-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        }

        return this.sanitizeFilename(title);
    }

    extractTitle(content) {
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
            return titleMatch[1].trim();
        }

        const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match && h1Match[1]) {
            return h1Match[1].trim();
        }

        const mdH1Match = content.match(/^#\s+(.+)$/m);
        if (mdH1Match && mdH1Match[1]) {
            return mdH1Match[1].trim();
        }

        return null;
    }

    sanitizeFilename(filename) {
        if (!filename) return this.defaultFileName;

        return filename
            .replace(/<[^>]*>/g, '')
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100)
            || this.defaultFileName;
    }
}

/**
 * 主题管理器
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'auto';
        this.systemTheme = 'light';
        this.storageKey = 'md2page-theme';
        this.listeners = [];
        
        this.init();
    }

    init() {
        this.detectSystemTheme();
        this.loadThemeFromStorage();
        this.applyTheme();
        this.setupSystemThemeListener();
    }

    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.systemTheme = 'dark';
        } else {
            this.systemTheme = 'light';
        }
    }

    loadThemeFromStorage() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
                this.currentTheme = savedTheme;
            }
        } catch (error) {
            console.warn('无法从本地存储加载主题设置:', error);
        }
    }

    saveThemeToStorage() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme);
        } catch (error) {
            console.warn('无法保存主题设置到本地存储:', error);
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemTheme;
        }
        return this.currentTheme;
    }

    setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.warn(`不支持的主题: ${theme}`);
            return;
        }

        this.currentTheme = theme;
        this.applyTheme();
        this.saveThemeToStorage();
        this.notifyListeners('theme-change', {
            theme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme()
        });
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    applyTheme() {
        const effectiveTheme = this.getEffectiveTheme();
        const root = document.documentElement;
        
        root.removeAttribute('data-theme');
        
        if (effectiveTheme !== 'light') {
            root.setAttribute('data-theme', effectiveTheme);
        }
        
        document.body.className = document.body.className
            .replace(/theme-\w+/g, '')
            .trim();
        document.body.classList.add(`theme-${effectiveTheme}`);
    }

    addListener(callback) {
        if (typeof callback !== 'function') {
            console.warn('主题监听器必须是函数');
            return () => {};
        }

        this.listeners.push(callback);
        
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('主题监听器执行错误:', error);
            }
        });
    }

    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handler = (e) => {
                this.systemTheme = e.matches ? 'dark' : 'light';
                if (this.currentTheme === 'auto') {
                    this.applyTheme();
                }
            };

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handler);
            } else if (mediaQuery.addListener) {
                mediaQuery.addListener(handler);
            }
        }
    }
}

/**
 * 打印优化器
 */
class PrintOptimizer {
    constructor() {
        this.options = {
            removeInteractiveElements: true,
            addPageBreaks: true,
            optimizeImages: true,
            fontSize: '12pt',
            lineHeight: '1.4',
            margins: '2cm'
        };
    }

    createPrintPreview(htmlContent, options = {}) {
        const opts = { ...this.options, ...options };
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>打印预览</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: ${opts.lineHeight};
            font-size: ${opts.fontSize};
            margin: ${opts.margins};
            color: #000;
            background: #fff;
        }
        
        h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        
        h1 { page-break-before: always; }
        
        table, pre, blockquote {
            page-break-inside: avoid;
        }
        
        img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
        }
        
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
    }
}

/**
 * 错误处理器
 */
class ErrorHandler {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.notificationId = 0;
        this.maxNotifications = 5;
        
        this.init();
    }

    init() {
        this.createContainer();
        this.setupGlobalErrorHandlers();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.innerHTML = `
            <div class="notifications-wrapper">
                <!-- 通知将在这里动态生成 -->
            </div>
        `;
        
        document.body.appendChild(this.container);
    }

    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            this.handleGlobalError({
                title: 'JavaScript 错误',
                message: event.message,
                details: `文件: ${event.filename}:${event.lineno}:${event.colno}`,
                type: 'error',
                source: 'javascript'
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError({
                title: 'Promise 错误',
                message: event.reason?.message || '未知的 Promise 错误',
                details: event.reason?.stack || '',
                type: 'error',
                source: 'promise'
            });
        });
    }

    handleGlobalError(error) {
        console.error('全局错误:', error);
        
        const errorKey = `${error.title}-${error.message}`;
        if (this.notifications.has(errorKey)) {
            return;
        }

        this.showError(error);
    }

    showError(options = {}) {
        const config = {
            title: '错误',
            message: '发生了未知错误',
            details: '',
            type: 'error',
            duration: 5000,
            dismissible: true,
            ...options
        };

        this.showNotification(config);
    }

    showSuccess(message, options = {}) {
        const config = typeof message === 'string' 
            ? { message, ...options }
            : { ...message, ...options };

        this.showNotification({
            title: '成功',
            type: 'success',
            duration: 3000,
            dismissible: true,
            ...config
        });
    }

    showWarning(message, options = {}) {
        const config = typeof message === 'string' 
            ? { message, ...options }
            : { ...message, ...options };

        this.showNotification({
            title: '警告',
            type: 'warning',
            duration: 4000,
            dismissible: true,
            ...config
        });
    }

    showInfo(message, options = {}) {
        const config = typeof message === 'string' 
            ? { message, ...options }
            : { ...message, ...options };

        this.showNotification({
            title: '信息',
            type: 'info',
            duration: 3000,
            dismissible: true,
            ...config
        });
    }

    showNotification(config) {
        const id = ++this.notificationId;
        const notification = this.createNotification(id, config);
        
        const wrapper = this.container.querySelector('.notifications-wrapper');
        wrapper.appendChild(notification);
        
        this.notifications.set(id, {
            element: notification,
            config: config,
            timestamp: Date.now()
        });

        this.limitNotifications();

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        if (config.duration > 0) {
            setTimeout(() => {
                this.removeNotification(id);
            }, config.duration);
        }

        return id;
    }

    createNotification(id, config) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${config.type}`;
        notification.dataset.id = id;

        const icon = this.getTypeIcon(config.type);
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-icon">${icon}</div>
                    <div class="notification-title">${this.escapeHtml(config.title)}</div>
                    ${config.dismissible ? '<button class="notification-close" aria-label="关闭">×</button>' : ''}
                </div>
                <div class="notification-body">
                    <div class="notification-message">${this.escapeHtml(config.message)}</div>
                    ${config.details ? `<div class="notification-details">${this.escapeHtml(config.details)}</div>` : ''}
                </div>
            </div>
            ${config.duration > 0 ? '<div class="notification-progress"></div>' : ''}
        `;

        this.setupNotificationEvents(notification, id, config);

        return notification;
    }

    setupNotificationEvents(notification, id, config) {
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.removeNotification(id);
            });
        }

        const progressBar = notification.querySelector('.notification-progress');
        if (progressBar && config.duration > 0) {
            progressBar.style.animationDuration = `${config.duration}ms`;
        }
    }

    removeNotification(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        const { element } = notificationData;
        
        element.classList.add('hide');
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    limitNotifications() {
        if (this.notifications.size <= this.maxNotifications) return;

        const sortedNotifications = Array.from(this.notifications.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toRemove = sortedNotifications.slice(0, this.notifications.size - this.maxNotifications);
        toRemove.forEach(([id]) => {
            this.removeNotification(id);
        });
    }

    getTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearAll() {
        Array.from(this.notifications.keys()).forEach(id => {
            this.removeNotification(id);
        });
    }

    destroy() {
        this.clearAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}/**
 
* 输入面板组件
 */
class InputPanel {
    constructor(container) {
        this.container = container;
        this.textarea = null;
        this.onContentChange = null;
        this.onError = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="input-header">
                <h3>Markdown 编辑器</h3>
                <div class="input-actions">
                    <button class="btn btn-secondary" id="upload-btn">
                        📁 上传文件
                    </button>
                    <input type="file" id="file-input" accept=".md,.markdown,.txt" style="display: none;">
                </div>
            </div>
            <div class="input-content">
                <textarea id="markdown-input" placeholder="在此输入 Markdown 内容...&#10;&#10;支持的语法：&#10;# 标题&#10;**粗体** *斜体*&#10;- 列表项&#10;[链接](URL)&#10;![图片](URL)&#10;&#10;或者点击上方"上传文件"按钮加载 .md 文件"></textarea>
            </div>
        `;
        
        this.textarea = this.container.querySelector('#markdown-input');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.textarea) {
            this.textarea.addEventListener('input', (e) => {
                if (this.onContentChange) {
                    this.onContentChange(e.target.value);
                }
            });
        }

        // 文件上传
        const uploadBtn = this.container.querySelector('#upload-btn');
        const fileInput = this.container.querySelector('#file-input');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadFile(file);
                }
            });
        }

        // 拖拽上传
        if (this.textarea) {
            this.textarea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.textarea.classList.add('drag-over');
            });

            this.textarea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.textarea.classList.remove('drag-over');
            });

            this.textarea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.textarea.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.loadFile(files[0]);
                }
            });
        }
    }

    loadFile(file) {
        if (!file.name.match(/\.(md|markdown|txt)$/i)) {
            if (this.onError) {
                this.onError('请选择 .md、.markdown 或 .txt 文件');
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.setContent(e.target.result);
            if (this.onContentChange) {
                this.onContentChange(e.target.result);
            }
        };
        reader.onerror = () => {
            if (this.onError) {
                this.onError('文件读取失败');
            }
        };
        reader.readAsText(file);
    }

    setOnContentChange(callback) {
        this.onContentChange = callback;
    }

    setOnError(callback) {
        this.onError = callback;
    }

    getContent() {
        return this.textarea ? this.textarea.value : '';
    }

    setContent(content) {
        if (this.textarea) {
            this.textarea.value = content;
        }
    }
}

/**
 * 预览面板组件
 */
class PreviewPanel {
    constructor(container) {
        this.container = container;
        this.contentDiv = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="preview-header">
                <h3>预览</h3>
                <div class="preview-actions">
                    <button class="btn btn-secondary" id="toc-btn" title="显示目录">
                        📋 目录
                    </button>
                </div>
            </div>
            <div class="preview-content" id="preview-content">
                <div class="preview-placeholder">
                    <h2>👋 欢迎使用 md2page</h2>
                    <p>在左侧编辑器中输入 Markdown 内容，这里会实时显示预览效果。</p>
                    <p>你可以：</p>
                    <ul>
                        <li>直接在左侧输入 Markdown 文本</li>
                        <li>点击"上传文件"按钮选择 .md 文件</li>
                        <li>拖拽文件到编辑器区域</li>
                    </ul>
                </div>
            </div>
            <div class="toc-sidebar" id="toc-sidebar">
                <!-- 目录将在这里生成 -->
            </div>
        `;
        
        this.contentDiv = this.container.querySelector('#preview-content');
        this.tocSidebar = this.container.querySelector('#toc-sidebar');
        this.toc = new TableOfContents(this.tocSidebar);
        
        this.setupTOCButton();
    }

    /**
     * 设置目录按钮
     */
    setupTOCButton() {
        const tocBtn = this.container.querySelector('#toc-btn');
        if (tocBtn) {
            tocBtn.addEventListener('click', () => {
                if (this.toc) {
                    this.toc.toggle();
                }
            });
        }
    }

    updateContent(htmlContent) {
        if (this.contentDiv) {
            if (htmlContent && htmlContent.trim()) {
                this.contentDiv.innerHTML = htmlContent;
                
                // 高亮代码块
                if (typeof Prism !== 'undefined') {
                    Prism.highlightAllUnder(this.contentDiv);
                }
                
                // 生成目录
                if (this.toc) {
                    const tocData = this.toc.render(htmlContent);
                    
                    // 更新目录按钮状态
                    const tocBtn = this.container.querySelector('#toc-btn');
                    if (tocBtn) {
                        if (tocData.count > 0) {
                            tocBtn.textContent = `📋 目录 (${tocData.count})`;
                            tocBtn.disabled = false;
                            tocBtn.title = `显示目录 - 找到 ${tocData.count} 个标题`;
                        } else {
                            tocBtn.textContent = '📋 目录';
                            tocBtn.disabled = true;
                            tocBtn.title = '没有找到标题';
                        }
                    }
                }
            } else {
                this.contentDiv.innerHTML = `
                    <div class="preview-placeholder">
                        <h2>👋 欢迎使用 md2page</h2>
                        <p>在左侧编辑器中输入 Markdown 内容，这里会实时显示预览效果。</p>
                    </div>
                `;
                
                // 清空目录
                if (this.toc) {
                    this.toc.clear();
                }
                
                // 重置目录按钮
                const tocBtn = this.container.querySelector('#toc-btn');
                if (tocBtn) {
                    tocBtn.textContent = '📋 目录';
                    tocBtn.disabled = true;
                    tocBtn.title = '没有找到标题';
                }
            }
        }
    }
}

/**
 * 主题切换组件
 */
class ThemeToggle {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.button = null;
    }

    createToggleButton(container) {
        this.button = document.createElement('button');
        this.button.className = 'btn btn-secondary theme-toggle-btn';
        this.button.innerHTML = `
            <span class="theme-icon">${this.getThemeIcon()}</span>
            <span class="theme-text">${this.getThemeName()}</span>
        `;
        
        this.button.addEventListener('click', () => {
            this.themeManager.toggleTheme();
            this.updateButton();
        });

        container.insertBefore(this.button, container.firstChild);
        return this.button;
    }

    updateButton() {
        if (this.button) {
            const icon = this.button.querySelector('.theme-icon');
            const text = this.button.querySelector('.theme-text');
            
            if (icon) icon.textContent = this.getThemeIcon();
            if (text) text.textContent = this.getThemeName();
        }
    }

    getThemeIcon() {
        const theme = this.themeManager.getCurrentTheme();
        const icons = {
            'light': '☀️',
            'dark': '🌙',
            'auto': '🔄'
        };
        return icons[theme] || '🔄';
    }

    getThemeName() {
        const theme = this.themeManager.getCurrentTheme();
        const names = {
            'light': '亮色',
            'dark': '暗色',
            'auto': '自动'
        };
        return names[theme] || '自动';
    }
}

/**
 * 增强的应用基类
 */
class EnhancedApp {
    constructor() {
        this.converter = null;
        this.fileHandler = null;
        this.themeManager = null;
        this.printOptimizer = null;
        this.errorHandler = null;
        this.inputPanel = null;
        this.previewPanel = null;
        this.themeToggle = null;
        this.debounceTimer = null;
        this.currentHtmlContent = '';
    }

    /**
     * 处理内容变化
     * @param {string} content Markdown 内容
     */
    handleContentChange(content) {
        // 验证内容
        if (this.converter) {
            const validation = this.converter.validateMarkdown(content);
            
            if (!validation.isValid) {
                if (this.previewPanel) {
                    this.previewPanel.updateContent(`
                        <div class="validation-error">
                            <h3>❌ 内容验证失败</h3>
                            <ul>
                                ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        </div>
                    `);
                }
                this.currentHtmlContent = '';
                
                const downloadBtn = document.getElementById('download-btn');
                const printBtn = document.getElementById('print-btn');
                if (downloadBtn) downloadBtn.disabled = true;
                if (printBtn) printBtn.disabled = true;
                
                return;
            }

            // 转换 Markdown
            const htmlContent = this.converter.parseMarkdown(content);
            this.currentHtmlContent = htmlContent;
            
            // 更新预览
            if (this.previewPanel) {
                this.previewPanel.updateContent(htmlContent);
            }
            
            // 启用按钮
            const downloadBtn = document.getElementById('download-btn');
            const printBtn = document.getElementById('print-btn');
            if (downloadBtn) downloadBtn.disabled = !content.trim();
            if (printBtn) printBtn.disabled = !content.trim();
        }
    }
}/**

 * 目录生成器
 * 负责从HTML内容中提取标题并生成目录
 */
class TOCGenerator {
    constructor() {
        this.headings = [];
        this.tocHtml = '';
    }

    /**
     * 从HTML内容生成目录
     * @param {string} htmlContent HTML内容
     * @returns {Object} 目录数据
     */
    generateTOC(htmlContent) {
        if (!htmlContent) {
            return {
                html: '',
                headings: [],
                count: 0
            };
        }

        // 创建临时DOM来解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // 提取所有标题
        const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        this.headings = [];

        headingElements.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = heading.textContent.trim();
            const id = heading.id || this.generateHeadingId(text, index);
            
            // 确保标题有ID
            if (!heading.id) {
                heading.id = id;
            }

            this.headings.push({
                level: level,
                text: text,
                id: id,
                element: heading
            });
        });

        // 生成目录HTML
        this.tocHtml = this.generateTOCHTML();

        return {
            html: this.tocHtml,
            headings: this.headings,
            count: this.headings.length
        };
    }

    /**
     * 生成目录HTML
     * @returns {string} 目录HTML
     */
    generateTOCHTML() {
        if (this.headings.length === 0) {
            return '<p class="toc-empty">没有找到标题</p>';
        }

        let html = '<ul class="toc-list">';
        let currentLevel = 0;
        let openLists = [];

        this.headings.forEach((heading, index) => {
            const { level, text, id } = heading;

            // 处理层级变化
            if (level > currentLevel) {
                // 需要开启新的层级
                for (let i = currentLevel; i < level; i++) {
                    if (i > 0) {
                        html += '<ul class="toc-list-sub">';
                        openLists.push('ul');
                    }
                }
            } else if (level < currentLevel) {
                // 需要关闭一些层级
                const levelsToClose = currentLevel - level;
                for (let i = 0; i < levelsToClose; i++) {
                    if (openLists.length > 0) {
                        html += '</ul>';
                        openLists.pop();
                    }
                }
            }

            // 添加目录项
            html += `
                <li class="toc-item toc-level-${level}">
                    <a href="#${id}" class="toc-link" data-id="${id}" data-level="${level}">
                        ${this.escapeHtml(text)}
                    </a>
                </li>
            `;

            currentLevel = level;
        });

        // 关闭所有打开的列表
        while (openLists.length > 0) {
            html += '</ul>';
            openLists.pop();
        }

        html += '</ul>';
        return html;
    }

    /**
     * 为标题生成ID
     * @param {string} text 标题文本
     * @param {number} index 索引
     * @returns {string} 生成的ID
     */
    generateHeadingId(text, index = 0) {
        let id = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 移除特殊字符，保留中文、英文、数字、空格、连字符
            .replace(/\s+/g, '-') // 空格转连字符
            .replace(/-+/g, '-') // 多个连字符合并为一个
            .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符

        // 如果ID为空或太短，使用默认格式
        if (!id || id.length < 2) {
            id = `heading-${index + 1}`;
        }

        return id;
    }

    /**
     * 转义HTML字符
     * @param {string} text 文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取当前标题列表
     * @returns {Array} 标题列表
     */
    getHeadings() {
        return this.headings;
    }

    /**
     * 清空目录数据
     */
    clear() {
        this.headings = [];
        this.tocHtml = '';
    }
}

/**
 * 目录导航组件
 */
class TableOfContents {
    constructor(container) {
        this.container = container;
        this.tocGenerator = new TOCGenerator();
        this.isVisible = false;
        this.currentActiveId = null;
    }

    /**
     * 渲染目录
     * @param {string} htmlContent HTML内容
     */
    render(htmlContent) {
        const tocData = this.tocGenerator.generateTOC(htmlContent);
        
        if (tocData.count === 0) {
            this.container.innerHTML = `
                <div class="toc-container">
                    <div class="toc-header">
                        <h3 class="toc-title">目录</h3>
                        <button class="toc-close" aria-label="关闭目录">×</button>
                    </div>
                    <div class="toc-content">
                        <p class="toc-empty">没有找到标题</p>
                    </div>
                </div>
            `;
        } else {
            this.container.innerHTML = `
                <div class="toc-container">
                    <div class="toc-header">
                        <h3 class="toc-title">目录 (${tocData.count})</h3>
                        <button class="toc-close" aria-label="关闭目录">×</button>
                    </div>
                    <div class="toc-content">
                        ${tocData.html}
                    </div>
                </div>
            `;
        }

        this.setupEventListeners();
        return tocData;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 关闭按钮
        const closeBtn = this.container.querySelector('.toc-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // 目录链接点击事件
        const tocLinks = this.container.querySelectorAll('.toc-link');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-id');
                this.scrollToHeading(targetId);
                
                // 移动端点击后自动隐藏目录
                if (window.innerWidth <= 768) {
                    setTimeout(() => this.hide(), 300);
                }
            });
        });
    }

    /**
     * 滚动到指定标题
     * @param {string} headingId 标题ID
     */
    scrollToHeading(headingId) {
        const targetElement = document.getElementById(headingId);
        if (targetElement) {
            // 平滑滚动到目标位置
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // 更新活动状态
            this.setActiveHeading(headingId);

            // 添加高亮效果
            targetElement.classList.add('heading-highlight');
            setTimeout(() => {
                targetElement.classList.remove('heading-highlight');
            }, 2000);
        }
    }

    /**
     * 设置活动标题
     * @param {string} headingId 标题ID
     */
    setActiveHeading(headingId) {
        // 移除之前的活动状态
        const prevActive = this.container.querySelector('.toc-link.active');
        if (prevActive) {
            prevActive.classList.remove('active');
        }

        // 设置新的活动状态
        const newActive = this.container.querySelector(`[data-id="${headingId}"]`);
        if (newActive) {
            newActive.classList.add('active');
            this.currentActiveId = headingId;
        }
    }

    /**
     * 显示目录
     */
    show() {
        this.container.classList.add('visible');
        this.isVisible = true;
        
        // 添加遮罩层
        if (!document.querySelector('.toc-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'toc-overlay';
            overlay.addEventListener('click', () => this.hide());
            document.body.appendChild(overlay);
        }
        
        document.body.classList.add('toc-open');
    }

    /**
     * 隐藏目录
     */
    hide() {
        this.container.classList.remove('visible');
        this.isVisible = false;
        
        // 移除遮罩层
        const overlay = document.querySelector('.toc-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        document.body.classList.remove('toc-open');
    }

    /**
     * 切换显示/隐藏
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 获取目录数据
     * @returns {Object} 目录数据
     */
    getTOCData() {
        return {
            headings: this.tocGenerator.getHeadings(),
            html: this.tocGenerator.tocHtml,
            count: this.tocGenerator.headings.length
        };
    }

    /**
     * 清空目录
     */
    clear() {
        this.container.innerHTML = '';
        this.tocGenerator.clear();
        this.currentActiveId = null;
        this.isVisible = false;
    }
}