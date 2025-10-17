/**
 * md2page 核心类库
 * 包含所有功能类，无需模块系统
 */

/**
 * Markdown 转换器
 * 负责将 Markdown 内容转换为 HTML
 */
class MarkdownConverter {
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
}

/**
 * 文件处理类
 * 负责文件的下载和生成
 */
class FileHandler {
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
            .replace(/<[^>]*>/g, '')
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100)
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
    line-height: 1.3;
}

p { margin: 1rem 0; }

code {
    background-color: ${theme === 'dark' ? '#2d2d2d' : '#f1f3f4'};
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', monospace;
}

pre {
    background-color: ${theme === 'dark' ? '#2d2d2d' : '#f8f9fa'};
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
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
}

@media print {
    body { color: #000 !important; background: #fff !important; }
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
}

/**
 * 主题管理器
 * 负责主题切换、系统主题检测和本地存储
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'auto';
        this.systemTheme = 'light';
        this.storageKey = 'md2page-theme';
        this.listeners = [];
        
        this.init();
    }

    /**
     * 初始化主题管理器
     */
    init() {
        this.detectSystemTheme();
        this.loadThemeFromStorage();
        this.applyTheme();
        this.setupSystemThemeListener();
    }

    /**
     * 检测系统主题
     */
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.systemTheme = 'dark';
        } else {
            this.systemTheme = 'light';
        }
    }

    /**
     * 从本地存储加载主题
     */
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

    /**
     * 保存主题到本地存储
     */
    saveThemeToStorage() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme);
        } catch (error) {
            console.warn('无法保存主题设置到本地存储:', error);
        }
    }

    /**
     * 获取当前主题
     * @returns {string} 当前主题
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * 获取实际应用的主题
     * @returns {string} 实际主题
     */
    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemTheme;
        }
        return this.currentTheme;
    }

    /**
     * 设置主题
     * @param {string} theme 主题名称
     */
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

    /**
     * 切换主题
     */
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    /**
     * 应用主题到 DOM
     */
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

    /**
     * 获取主题图标
     * @param {string} theme 主题名称
     * @returns {string} 主题图标
     */
    getThemeIcon(theme = this.currentTheme) {
        const icons = {
            'light': '☀️',
            'dark': '🌙',
            'auto': '🔄'
        };
        return icons[theme] || '🔄';
    }

    /**
     * 获取主题名称
     * @param {string} theme 主题名称
     * @returns {string} 主题显示名称
     */
    getThemeName(theme = this.currentTheme) {
        const names = {
            'light': '亮色主题',
            'dark': '暗色主题',
            'auto': '跟随系统'
        };
        return names[theme] || '未知主题';
    }

    /**
     * 添加主题变化监听器
     * @param {Function} callback 回调函数
     * @returns {Function} 移除监听器的函数
     */
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

    /**
     * 通知所有监听器
     * @param {string} event 事件类型
     * @param {any} data 事件数据
     */
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('主题监听器执行错误:', error);
            }
        });
    }

    /**
     * 设置系统主题变化监听器
     */
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

    /**
     * 获取主题信息
     * @returns {Object} 主题信息对象
     */
    getThemeInfo() {
        return {
            currentTheme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme(),
            systemTheme: this.systemTheme,
            icon: this.getThemeIcon(),
            name: this.getThemeName()
        };
    }
}/
**
 * 打印优化器
 * 负责优化 HTML 内容的打印显示
 */
class PrintOptimizer {
    constructor() {
        this.printStyles = null;
    }

    /**
     * 生成打印专用 CSS
     * @param {Object} options 选项
     * @returns {string} 打印 CSS
     */
    generatePrintCSS(options = {}) {
        const {
            pageSize = 'A4',
            margin = '2cm',
            fontSize = '12pt',
            fontFamily = '"Times New Roman", Times, serif'
        } = options;

        return `
@media print {
    @page { size: ${pageSize}; margin: ${margin}; }
    * { -webkit-print-color-adjust: exact !important; }
    body {
        font-family: ${fontFamily} !important;
        font-size: ${fontSize} !important;
        color: #000 !important;
        background: #fff !important;
    }
    .no-print, .app-header, .header-controls, button { display: none !important; }
    h1, h2, h3, h4, h5, h6 { page-break-after: avoid; color: #000 !important; }
    p { orphans: 3; widows: 3; }
    table, pre, blockquote { page-break-inside: avoid; }
}`;
    }

    /**
     * 优化 HTML 内容用于打印
     * @param {string} htmlContent HTML 内容
     * @param {Object} options 选项
     * @returns {string} 优化后的 HTML
     */
    optimizeForPrint(htmlContent, options = {}) {
        if (!htmlContent) return '';

        let optimizedHTML = htmlContent;

        // 移除交互元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = optimizedHTML;

        // 移除按钮和输入框
        const interactiveElements = tempDiv.querySelectorAll('button, input, textarea, select, script');
        interactiveElements.forEach(element => element.remove());

        return tempDiv.innerHTML;
    }
}/
**
 * 错误处理组件
 * 负责显示用户友好的错误信息
 */
class ErrorHandler {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    /**
     * 创建错误模态框
     */
    createModal() {
        if (document.getElementById('error-modal')) {
            this.modal = document.getElementById('error-modal');
            return;
        }

        const modalHTML = `
            <div id="error-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="error-title">错误提示</h3>
                        <button class="modal-close" id="error-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="error-icon" class="error-icon">⚠️</div>
                        <p id="error-message"></p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('error-modal');
        
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const closeBtn = document.getElementById('error-modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        }
    }

    /**
     * 显示错误信息
     * @param {Object} options 错误选项
     */
    showError(options) {
        const {
            title = '错误提示',
            message = '发生了未知错误',
            type = 'error'
        } = options;

        const titleElement = document.getElementById('error-title');
        const messageElement = document.getElementById('error-message');
        const iconElement = document.getElementById('error-icon');

        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        if (iconElement) iconElement.textContent = this.getIcon(type);

        this.showModal();
    }

    /**
     * 显示文件错误
     * @param {string} message 错误消息
     */
    showFileError(message) {
        this.showError({
            title: '文件处理错误',
            message: message,
            type: 'file-error'
        });
    }

    /**
     * 显示验证错误
     * @param {Array<string>} errors 错误列表
     */
    showValidationErrors(errors) {
        const message = errors.length === 1 
            ? errors[0] 
            : `发现 ${errors.length} 个问题:\n${errors.map((err, i) => `${i + 1}. ${err}`).join('\n')}`;

        this.showError({
            title: '验证失败',
            message: message,
            type: 'validation-error'
        });
    }

    /**
     * 显示警告信息
     * @param {string} message 警告消息
     */
    showWarning(message) {
        this.showError({
            title: '警告',
            message: message,
            type: 'warning'
        });
    }

    /**
     * 显示成功信息
     * @param {string} message 成功消息
     */
    showSuccess(message) {
        this.showError({
            title: '成功',
            message: message,
            type: 'success'
        });
    }

    /**
     * 获取图标
     * @param {string} type 错误类型
     * @returns {string} 图标
     */
    getIcon(type) {
        const icons = {
            'error': '❌',
            'warning': '⚠️',
            'success': '✅',
            'info': 'ℹ️',
            'file-error': '📁',
            'validation-error': '🔍'
        };
        return icons[type] || '❌';
    }

    /**
     * 显示模态框
     */
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    }

    /**
     * 隐藏模态框
     */
    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    /**
     * 创建状态提示组件
     * @param {HTMLElement} container 容器元素
     * @returns {Object} 状态提示对象
     */
    createStatusIndicator(container) {
        const statusHTML = `
            <div class="status-indicator" id="status-indicator">
                <div class="status-content">
                    <span class="status-icon" id="status-icon">ℹ️</span>
                    <span class="status-message" id="status-message">就绪</span>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', statusHTML);

        return {
            show: (message, type = 'info', duration = 3000) => {
                const indicator = document.getElementById('status-indicator');
                const icon = document.getElementById('status-icon');
                const messageEl = document.getElementById('status-message');

                if (indicator && icon && messageEl) {
                    icon.textContent = this.getIcon(type);
                    messageEl.textContent = message;
                    indicator.className = `status-indicator status-${type}`;
                    indicator.style.display = 'flex';

                    if (duration > 0) {
                        setTimeout(() => {
                            indicator.style.display = 'none';
                        }, duration);
                    }
                }
            },
            hide: () => {
                const indicator = document.getElementById('status-indicator');
                if (indicator) {
                    indicator.style.display = 'none';
                }
            }
        };
    }
}/
**
 * 输入面板组件
 * 负责 Markdown 内容的输入和文件上传
 */
class InputPanel {
    constructor(container) {
        this.container = container;
        this.textarea = null;
        this.onContentChange = null;
        this.onError = null;
        this.fileUpload = new FileUpload();
    }

    /**
     * 渲染输入面板
     */
    render() {
        this.container.innerHTML = `
            <div class="panel-header">
                <h2>Markdown 输入</h2>
            </div>
            <div class="panel-content">
                <div class="upload-section" id="upload-section">
                    <!-- 文件上传组件将在这里渲染 -->
                </div>
                <textarea 
                    id="markdown-input" 
                    class="markdown-textarea"
                    placeholder="在此输入 Markdown 内容，或上传 .md 文件..."
                    spellcheck="false"
                ></textarea>
            </div>
        `;

        this.setupComponents();
        this.setupEventListeners();
    }

    /**
     * 设置组件
     */
    setupComponents() {
        const uploadSection = this.container.querySelector('#upload-section');
        if (uploadSection) {
            const uploadElement = this.fileUpload.createUploadElement(uploadSection);
            uploadSection.appendChild(uploadElement);
        }

        this.fileUpload.setOnFileLoad((fileData) => {
            this.handleFileLoad(fileData);
        });

        this.fileUpload.setOnError((error) => {
            this.handleError(error);
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        this.textarea = this.container.querySelector('#markdown-input');

        if (this.textarea) {
            this.textarea.addEventListener('input', (e) => {
                if (this.onContentChange) {
                    this.onContentChange(e.target.value);
                }
            });
        }
    }

    /**
     * 处理文件加载
     * @param {Object} fileData 文件数据
     */
    handleFileLoad(fileData) {
        const { content } = fileData;
        
        this.setContent(content);
        
        if (this.onContentChange) {
            this.onContentChange(content);
        }
    }

    /**
     * 处理错误
     * @param {string} error 错误消息
     */
    handleError(error) {
        if (this.onError) {
            this.onError(error);
        } else {
            alert(`文件处理失败: ${error}`);
        }
    }

    /**
     * 设置内容
     * @param {string} content 内容
     */
    setContent(content) {
        if (this.textarea) {
            this.textarea.value = content;
        }
    }

    /**
     * 获取内容
     * @returns {string} 当前内容
     */
    getContent() {
        return this.textarea ? this.textarea.value : '';
    }

    /**
     * 设置内容变化回调
     * @param {Function} callback 回调函数
     */
    setOnContentChange(callback) {
        this.onContentChange = callback;
    }

    /**
     * 设置错误回调
     * @param {Function} callback 回调函数
     */
    setOnError(callback) {
        this.onError = callback;
    }
}/**
 *
 文件上传组件
 * 处理 .md 文件的上传和验证
 */
class FileUpload {
    constructor() {
        this.onFileLoad = null;
        this.onError = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedExtensions = ['.md', '.markdown', '.txt'];
    }

    /**
     * 创建文件上传元素
     * @param {HTMLElement} container 容器元素
     * @returns {HTMLElement} 文件上传元素
     */
    createUploadElement(container) {
        const uploadContainer = document.createElement('div');
        uploadContainer.className = 'file-upload-container';
        uploadContainer.innerHTML = `
            <input type="file" id="file-input" accept=".md,.markdown,.txt" style="display: none;">
            <button id="upload-btn" class="upload-btn">上传 .md 文件</button>
            <div class="drag-drop-area" id="drag-drop-area">
                <p>拖拽 .md 文件到此处</p>
            </div>
        `;

        this.setupEventListeners(uploadContainer);
        return uploadContainer;
    }

    /**
     * 设置事件监听器
     * @param {HTMLElement} container 容器元素
     */
    setupEventListeners(container) {
        const fileInput = container.querySelector('#file-input');
        const uploadBtn = container.querySelector('#upload-btn');
        const dragDropArea = container.querySelector('#drag-drop-area');

        // 文件选择按钮
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFile(file);
            }
        });

        // 拖拽事件
        this.setupDragAndDrop(dragDropArea);
    }

    /**
     * 设置拖拽上传功能
     * @param {HTMLElement} dragArea 拖拽区域
     */
    setupDragAndDrop(dragArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dragArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dragArea.addEventListener(eventName, () => {
                dragArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dragArea.addEventListener(eventName, () => {
                dragArea.classList.remove('drag-over');
            }, false);
        });

        dragArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        }, false);
    }

    /**
     * 阻止默认事件
     * @param {Event} e 事件对象
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * 处理文件
     * @param {File} file 文件对象
     */
    handleFile(file) {
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            this.handleError(validation.errors.join(', '));
            return;
        }

        this.readFile(file);
    }

    /**
     * 验证文件
     * @param {File} file 文件对象
     * @returns {Object} 验证结果
     */
    validateFile(file) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!file) {
            result.isValid = false;
            result.errors.push('未选择文件');
            return result;
        }

        if (file.size > this.maxFileSize) {
            result.isValid = false;
            result.errors.push(`文件大小超过限制 (${this.formatFileSize(this.maxFileSize)})`);
        }

        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.allowedExtensions.some(ext => 
            fileName.endsWith(ext)
        );

        if (!hasValidExtension) {
            result.isValid = false;
            result.errors.push(`不支持的文件格式，请选择 ${this.allowedExtensions.join(', ')} 文件`);
        }

        return result;
    }

    /**
     * 读取文件内容
     * @param {File} file 文件对象
     */
    readFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            
            if (typeof content !== 'string') {
                this.handleError('文件内容读取失败');
                return;
            }

            if (this.onFileLoad) {
                this.onFileLoad({
                    content: content,
                    fileName: file.name,
                    fileSize: file.size,
                    lastModified: new Date(file.lastModified)
                });
            }
        };

        reader.onerror = () => {
            this.handleError('文件读取失败');
        };

        reader.readAsText(file, 'UTF-8');
    }

    /**
     * 处理错误
     * @param {string} message 错误消息
     */
    handleError(message) {
        if (this.onError) {
            this.onError(message);
        }
    }

    /**
     * 格式化文件大小
     * @param {number} bytes 字节数
     * @returns {string} 格式化后的大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 设置文件加载回调
     * @param {Function} callback 回调函数
     */
    setOnFileLoad(callback) {
        this.onFileLoad = callback;
    }

    /**
     * 设置错误回调
     * @param {Function} callback 回调函数
     */
    setOnError(callback) {
        this.onError = callback;
    }
}/**

 * 预览面板组件
 * 负责显示转换后的 HTML 内容
 */
class PreviewPanel {
    constructor(container) {
        this.container = container;
        this.previewContent = null;
        this.tocContainer = null;
        this.tableOfContents = null;
    }

    /**
     * 渲染预览面板
     */
    render() {
        this.container.innerHTML = `
            <div class="panel-header">
                <h2>HTML 预览</h2>
                <div class="preview-controls">
                    <button id="toggle-toc" class="toggle-toc">目录</button>
                </div>
            </div>
            <div class="panel-content">
                <div class="toc-container" id="toc-container">
                    <nav class="table-of-contents" id="table-of-contents">
                        <!-- 目录将在这里生成 -->
                    </nav>
                </div>
                <div class="preview-content" id="preview-content">
                    <div class="preview-placeholder">
                        <p>Markdown 预览将在这里显示</p>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.initTableOfContents();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        this.previewContent = this.container.querySelector('#preview-content');
        this.tocContainer = this.container.querySelector('#toc-container');
        const toggleTocBtn = this.container.querySelector('#toggle-toc');

        if (toggleTocBtn) {
            toggleTocBtn.addEventListener('click', () => {
                this.toggleTOC();
            });
        }
    }

    /**
     * 初始化目录组件
     */
    initTableOfContents() {
        const tocElement = this.container.querySelector('#table-of-contents');
        if (tocElement) {
            this.tableOfContents = new TableOfContents(tocElement);
            this.tableOfContents.render();
        }
    }

    /**
     * 更新预览内容
     * @param {string} htmlContent HTML 内容
     */
    updateContent(htmlContent) {
        if (!this.previewContent) return;

        if (!htmlContent || htmlContent.trim() === '') {
            this.previewContent.innerHTML = `
                <div class="preview-placeholder">
                    <p>Markdown 预览将在这里显示</p>
                </div>
            `;
            
            if (this.tableOfContents) {
                this.tableOfContents.updateTOC('');
            }
            return;
        }

        this.previewContent.innerHTML = htmlContent;
        
        if (this.tableOfContents) {
            this.tableOfContents.updateTOC(htmlContent);
            this.updateTOCButton();
        }
    }

    /**
     * 切换目录显示
     */
    toggleTOC() {
        if (this.tocContainer) {
            this.tocContainer.classList.toggle('visible');
        }
    }

    /**
     * 更新目录按钮状态
     */
    updateTOCButton() {
        const toggleTocBtn = this.container.querySelector('#toggle-toc');
        if (!toggleTocBtn || !this.tableOfContents) return;

        const hasTOC = this.tableOfContents.hasTOC();
        const itemCount = this.tableOfContents.getItemCount();
        
        if (hasTOC) {
            toggleTocBtn.disabled = false;
            toggleTocBtn.textContent = `目录 (${itemCount})`;
        } else {
            toggleTocBtn.disabled = true;
            toggleTocBtn.textContent = '目录';
            
            if (this.tocContainer) {
                this.tocContainer.classList.remove('visible');
            }
        }
    }

    /**
     * 获取预览内容
     * @returns {string} 当前预览的 HTML 内容
     */
    getContent() {
        return this.previewContent ? this.previewContent.innerHTML : '';
    }
}

/**
 * 主题切换组件
 * 提供主题切换按钮和界面
 */
class ThemeToggle {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.button = null;
        this.removeListener = null;
    }

    /**
     * 创建主题切换按钮
     * @param {HTMLElement} container 容器元素
     * @returns {HTMLElement} 主题切换按钮
     */
    createToggleButton(container) {
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', '切换主题');
        
        this.button = button;
        this.updateButton();
        
        button.addEventListener('click', () => {
            this.handleToggle();
        });
        
        this.removeListener = this.themeManager.addListener((event, data) => {
            if (event === 'theme-change') {
                this.updateButton();
            }
        });
        
        if (container) {
            container.appendChild(button);
        }
        
        return button;
    }

    /**
     * 处理主题切换
     */
    handleToggle() {
        this.themeManager.toggleTheme();
        
        if (this.button) {
            this.button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.button.style.transform = '';
            }, 150);
        }
    }

    /**
     * 更新按钮显示
     */
    updateButton() {
        if (!this.button) return;
        
        const themeInfo = this.themeManager.getThemeInfo();
        
        this.button.innerHTML = `
            <span class="theme-icon">${themeInfo.icon}</span>
        `;
        
        this.button.title = `当前: ${themeInfo.name}，点击切换`;
        this.button.setAttribute('aria-label', `切换主题 (当前: ${themeInfo.name})`);
    }
}

/**
 * 目录组件
 * 负责显示和管理文档目录
 */
class TableOfContents {
    constructor(container) {
        this.container = container;
        this.tocGenerator = new TOCGenerator();
        this.tocItems = [];
        this.currentContent = '';
    }

    /**
     * 渲染目录组件
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="toc-header">
                <h3 class="toc-title">目录</h3>
            </div>
            <div class="toc-content" id="toc-content">
                <div class="toc-placeholder">
                    <p>暂无目录</p>
                </div>
            </div>
        `;

        this.tocGenerator.setupTOCClicks({
            behavior: 'smooth',
            offset: 100
        });
    }

    /**
     * 更新目录内容
     * @param {string} htmlContent HTML 内容
     */
    updateTOC(htmlContent) {
        if (!htmlContent || htmlContent === this.currentContent) {
            return;
        }

        this.currentContent = htmlContent;
        this.tocItems = this.tocGenerator.generateTOC(htmlContent);
        this.renderTOCContent();
    }

    /**
     * 渲染目录内容
     */
    renderTOCContent() {
        const tocContent = this.container.querySelector('#toc-content');
        if (!tocContent) return;

        if (this.tocItems.length === 0) {
            tocContent.innerHTML = `
                <div class="toc-placeholder">
                    <p>暂无目录</p>
                </div>
            `;
            return;
        }

        const tocHTML = this.tocGenerator.renderTOC(this.tocItems, {
            className: 'toc-list',
            showNumbers: false,
            maxDepth: 4
        });

        const stats = this.tocGenerator.getTOCStats(this.tocItems);
        
        tocContent.innerHTML = `
            <div class="toc-stats">
                <span class="toc-count">${stats.totalItems} 个标题</span>
            </div>
            ${tocHTML}
        `;
    }

    /**
     * 获取目录项数量
     * @returns {number} 目录项数量
     */
    getItemCount() {
        return this.tocItems.length;
    }

    /**
     * 检查是否有目录
     * @returns {boolean} 是否有目录
     */
    hasTOC() {
        return this.tocItems.length > 0;
    }
}/**

 * 目录生成器
 * 负责从 HTML 内容生成目录结构
 */
class TOCGenerator {
    constructor() {
        this.headingSelector = 'h1, h2, h3, h4, h5, h6';
        this.maxDepth = 6;
        this.minHeadings = 2;
    }

    /**
     * 从 HTML 内容生成目录
     * @param {string} htmlContent HTML 内容
     * @returns {Array<Object>} 目录项数组
     */
    generateTOC(htmlContent) {
        if (!htmlContent || typeof htmlContent !== 'string') {
            return [];
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        const headings = tempDiv.querySelectorAll(this.headingSelector);
        
        if (headings.length < this.minHeadings) {
            return [];
        }

        const tocItems = Array.from(headings).map((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = this.extractHeadingText(heading);
            const id = this.generateHeadingId(text, index);

            if (!heading.id) {
                heading.id = id;
            }

            return {
                id: heading.id || id,
                text: text,
                level: level,
                element: heading,
                children: []
            };
        });

        return this.buildHierarchy(tocItems);
    }

    /**
     * 提取标题文本
     * @param {HTMLElement} heading 标题元素
     * @returns {string} 标题文本
     */
    extractHeadingText(heading) {
        const clone = heading.cloneNode(true);
        
        const links = clone.querySelectorAll('a');
        links.forEach(link => {
            link.replaceWith(link.textContent);
        });

        return clone.textContent.trim();
    }

    /**
     * 生成标题 ID
     * @param {string} text 标题文本
     * @param {number} index 索引
     * @returns {string} 生成的 ID
     */
    generateHeadingId(text, index) {
        if (!text) {
            return `heading-${index}`;
        }

        let id = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);

        if (!id || id.length < 2) {
            id = `heading-${index}`;
        }

        return id;
    }

    /**
     * 构建层级结构
     * @param {Array<Object>} tocItems 扁平的目录项数组
     * @returns {Array<Object>} 层级化的目录项数组
     */
    buildHierarchy(tocItems) {
        if (!tocItems || tocItems.length === 0) {
            return [];
        }

        const result = [];
        const stack = [];

        tocItems.forEach(item => {
            item.children = [];

            while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
                stack.pop();
            }

            if (stack.length === 0) {
                result.push(item);
            } else {
                stack[stack.length - 1].children.push(item);
            }

            stack.push(item);
        });

        return result;
    }

    /**
     * 渲染目录 HTML
     * @param {Array<Object>} tocItems 目录项数组
     * @param {Object} options 渲染选项
     * @returns {string} 目录 HTML
     */
    renderTOC(tocItems, options = {}) {
        const {
            className = 'toc',
            showNumbers = false,
            maxDepth = this.maxDepth,
            currentDepth = 1
        } = options;

        if (!tocItems || tocItems.length === 0 || currentDepth > maxDepth) {
            return '';
        }

        let html = `<ul class="${className}${currentDepth === 1 ? '' : '-sub'}">`;

        tocItems.forEach((item, index) => {
            const hasChildren = item.children && item.children.length > 0;
            const number = showNumbers ? `${index + 1}. ` : '';
            
            html += `
                <li class="toc-item toc-level-${item.level}" data-level="${item.level}">
                    <a href="#${item.id}" class="toc-link" data-target="${item.id}">
                        ${number}${this.escapeHtml(item.text)}
                    </a>
            `;

            if (hasChildren && currentDepth < maxDepth) {
                html += this.renderTOC(item.children, {
                    ...options,
                    currentDepth: currentDepth + 1
                });
            }

            html += '</li>';
        });

        html += '</ul>';
        return html;
    }

    /**
     * 设置目录点击事件
     * @param {Object} options 选项
     */
    setupTOCClicks(options = {}) {
        const {
            behavior = 'smooth',
            offset = 80
        } = options;

        document.addEventListener('click', (e) => {
            const tocLink = e.target.closest('.toc-link');
            if (!tocLink) return;

            e.preventDefault();
            
            const targetId = tocLink.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                this.scrollToElement(targetElement, { behavior, offset });
            }
        });
    }

    /**
     * 滚动到指定元素
     * @param {HTMLElement} element 目标元素
     * @param {Object} options 滚动选项
     */
    scrollToElement(element, options = {}) {
        const {
            behavior = 'smooth',
            offset = 80
        } = options;

        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const targetPosition = elementTop - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: behavior
        });
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
     * 获取目录统计信息
     * @param {Array<Object>} tocItems 目录项数组
     * @returns {Object} 统计信息
     */
    getTOCStats(tocItems) {
        if (!tocItems || tocItems.length === 0) {
            return {
                totalItems: 0,
                maxDepth: 0,
                levelCounts: {}
            };
        }

        const stats = {
            totalItems: 0,
            maxDepth: 0,
            levelCounts: {}
        };

        const countItems = (items) => {
            items.forEach(item => {
                stats.totalItems++;
                stats.maxDepth = Math.max(stats.maxDepth, item.level);
                stats.levelCounts[item.level] = (stats.levelCounts[item.level] || 0) + 1;
                
                if (item.children && item.children.length > 0) {
                    countItems(item.children);
                }
            });
        };

        countItems(tocItems);
        return stats;
    }
}