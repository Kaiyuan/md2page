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
 * 文
件处理类
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
     * @returns {string} 主题名称
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
     * 添加监听器
     * @param {Function} callback 回调函数
     * @returns {Function} 移除监听器的函数
     */
    addListener(callback) {
        if (typeof callback !== 'function') {
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
}

/**
 * 打印优化器
 */
class PrintOptimizer {
    generatePrintCSS() {
        return `@media print { body { color: #000 !important; background: #fff !important; } }`;
    }

    optimizeForPrint(htmlContent) {
        return htmlContent;
    }
}

/**
 * 错误处理组件
 */
class ErrorHandler {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    createModal() {
        if (document.getElementById('error-modal')) return;

        const modalHTML = `
            <div id="error-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="error-title">错误提示</h3>
                        <button class="modal-close" id="error-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p id="error-message"></p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('error-modal');
        
        const closeBtn = document.getElementById('error-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }
    }

    showError(options) {
        const { title = '错误提示', message = '发生了未知错误' } = options;
        
        const titleElement = document.getElementById('error-title');
        const messageElement = document.getElementById('error-message');

        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;

        this.showModal();
    }

    showFileError(message) {
        this.showError({ title: '文件处理错误', message });
    }

    showValidationErrors(errors) {
        const message = errors.length === 1 ? errors[0] : `发现 ${errors.length} 个问题:\n${errors.join('\n')}`;
        this.showError({ title: '验证失败', message });
    }

    showWarning(message) {
        this.showError({ title: '警告', message });
    }

    showSuccess(message) {
        this.showError({ title: '成功', message });
    }

    showModal() {
        if (this.modal) this.modal.style.display = 'flex';
    }

    hideModal() {
        if (this.modal) this.modal.style.display = 'none';
    }

    createStatusIndicator(container) {
        const statusHTML = `
            <div class="status-indicator" id="status-indicator" style="display: none;">
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
                const messageEl = document.getElementById('status-message');

                if (indicator && messageEl) {
                    messageEl.textContent = message;
                    indicator.style.display = 'flex';

                    if (duration > 0) {
                        setTimeout(() => indicator.style.display = 'none', duration);
                    }
                }
            },
            hide: () => {
                const indicator = document.getElementById('status-indicator');
                if (indicator) indicator.style.display = 'none';
            }
        };
    }
}

/**
 * 文件上传组件
 */
class FileUpload {
    constructor() {
        this.onFileLoad = null;
        this.onError = null;
        this.maxFileSize = 10 * 1024 * 1024;
        this.allowedExtensions = ['.md', '.markdown', '.txt'];
    }

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

        const fileInput = uploadContainer.querySelector('#file-input');
        const uploadBtn = uploadContainer.querySelector('#upload-btn');

        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFile(file);
        });

        return uploadContainer;
    }

    handleFile(file) {
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            this.handleError(validation.errors.join(', '));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.onFileLoad) {
                this.onFileLoad({
                    content: e.target.result,
                    fileName: file.name,
                    fileSize: file.size
                });
            }
        };
        reader.onerror = () => this.handleError('文件读取失败');
        reader.readAsText(file, 'UTF-8');
    }

    validateFile(file) {
        const result = { isValid: true, errors: [] };

        if (!file) {
            result.isValid = false;
            result.errors.push('未选择文件');
            return result;
        }

        if (file.size > this.maxFileSize) {
            result.isValid = false;
            result.errors.push('文件大小超过限制');
        }

        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.allowedExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExtension) {
            result.isValid = false;
            result.errors.push('不支持的文件格式');
        }

        return result;
    }

    handleError(message) {
        if (this.onError) this.onError(message);
    }

    setOnFileLoad(callback) {
        this.onFileLoad = callback;
    }

    setOnError(callback) {
        this.onError = callback;
    }
}

/**
 * 输入面板组件
 */
class InputPanel {
    constructor(container) {
        this.container = container;
        this.textarea = null;
        this.onContentChange = null;
        this.onError = null;
        this.fileUpload = new FileUpload();
    }

    render() {
        this.container.innerHTML = `
            <div class="panel-header">
                <h2>Markdown 输入</h2>
            </div>
            <div class="panel-content">
                <div class="upload-section" id="upload-section"></div>
                <textarea 
                    id="markdown-input" 
                    class="markdown-textarea"
                    placeholder="在此输入 Markdown 内容，或上传 .md 文件..."
                    spellcheck="false"
                ></textarea>
            </div>
        `;

        const uploadSection = this.container.querySelector('#upload-section');
        if (uploadSection) {
            const uploadElement = this.fileUpload.createUploadElement(uploadSection);
            uploadSection.appendChild(uploadElement);
        }

        this.fileUpload.setOnFileLoad((fileData) => {
            this.setContent(fileData.content);
            if (this.onContentChange) this.onContentChange(fileData.content);
        });

        this.fileUpload.setOnError((error) => {
            if (this.onError) this.onError(error);
        });

        this.textarea = this.container.querySelector('#markdown-input');
        if (this.textarea) {
            this.textarea.addEventListener('input', (e) => {
                if (this.onContentChange) this.onContentChange(e.target.value);
            });
        }
    }

    setContent(content) {
        if (this.textarea) this.textarea.value = content;
    }

    getContent() {
        return this.textarea ? this.textarea.value : '';
    }

    setOnContentChange(callback) {
        this.onContentChange = callback;
    }

    setOnError(callback) {
        this.onError = callback;
    }
}

/**
 * 预览面板组件
 */
class PreviewPanel {
    constructor(container) {
        this.container = container;
        this.previewContent = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="panel-header">
                <h2>HTML 预览</h2>
                <div class="preview-controls">
                    <button id="toggle-toc" class="toggle-toc" disabled>目录</button>
                </div>
            </div>
            <div class="panel-content">
                <div class="preview-content" id="preview-content">
                    <div class="preview-placeholder">
                        <p>Markdown 预览将在这里显示</p>
                    </div>
                </div>
            </div>
        `;

        this.previewContent = this.container.querySelector('#preview-content');
    }

    updateContent(htmlContent) {
        if (!this.previewContent) return;

        if (!htmlContent || htmlContent.trim() === '') {
            this.previewContent.innerHTML = `
                <div class="preview-placeholder">
                    <p>Markdown 预览将在这里显示</p>
                </div>
            `;
            return;
        }

        this.previewContent.innerHTML = htmlContent;
    }

    getContent() {
        return this.previewContent ? this.previewContent.innerHTML : '';
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
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', '切换主题');
        
        this.button = button;
        this.updateButton();
        
        button.addEventListener('click', () => {
            this.themeManager.toggleTheme();
            this.updateButton();
        });
        
        if (container) {
            container.appendChild(button);
        }
        
        return button;
    }

    updateButton() {
        if (!this.button) return;
        
        const themeInfo = this.themeManager.getThemeInfo();
        this.button.innerHTML = `<span class="theme-icon">${themeInfo.icon}</span>`;
        this.button.title = `当前: ${themeInfo.name}，点击切换`;
    }
}