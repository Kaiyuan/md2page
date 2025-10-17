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
}