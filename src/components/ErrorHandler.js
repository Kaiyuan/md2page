/**
 * 全局错误处理器
 * 提供统一的错误处理、用户反馈和状态显示功能
 */
export class ErrorHandler {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.notificationId = 0;
        this.maxNotifications = 5;
        
        this.init();
    }

    /**
     * 初始化错误处理器
     */
    init() {
        this.createContainer();
        this.setupGlobalErrorHandlers();
    }

    /**
     * 创建通知容器
     */
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

    /**
     * 设置全局错误处理器
     */
    setupGlobalErrorHandlers() {
        // 捕获未处理的 JavaScript 错误
        window.addEventListener('error', (event) => {
            this.handleGlobalError({
                title: 'JavaScript 错误',
                message: event.message,
                details: `文件: ${event.filename}:${event.lineno}:${event.colno}`,
                type: 'error',
                source: 'javascript'
            });
        });

        // 捕获未处理的 Promise 拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError({
                title: 'Promise 错误',
                message: event.reason?.message || '未知的 Promise 错误',
                details: event.reason?.stack || '',
                type: 'error',
                source: 'promise'
            });
        });

        // 捕获资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleGlobalError({
                    title: '资源加载失败',
                    message: `无法加载资源: ${event.target.src || event.target.href}`,
                    type: 'warning',
                    source: 'resource'
                });
            }
        }, true);
    }

    /**
     * 处理全局错误
     * @param {Object} error 错误信息
     */
    handleGlobalError(error) {
        console.error('全局错误:', error);
        
        // 避免重复显示相同的错误
        const errorKey = `${error.title}-${error.message}`;
        if (this.notifications.has(errorKey)) {
            return;
        }

        this.showError(error);
    }

    /**
     * 显示错误通知
     * @param {Object} options 错误选项
     */
    showError(options = {}) {
        const config = {
            title: '错误',
            message: '发生了未知错误',
            details: '',
            type: 'error',
            duration: 5000,
            dismissible: true,
            actions: [],
            ...options
        };

        this.showNotification(config);
    }

    /**
     * 显示成功通知
     * @param {string|Object} message 消息或配置对象
     */
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

    /**
     * 显示警告通知
     * @param {string|Object} message 消息或配置对象
     */
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

    /**
     * 显示信息通知
     * @param {string|Object} message 消息或配置对象
     */
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

    /**
     * 显示通知
     * @param {Object} config 通知配置
     */
    showNotification(config) {
        const id = ++this.notificationId;
        const notification = this.createNotification(id, config);
        
        // 添加到容器
        const wrapper = this.container.querySelector('.notifications-wrapper');
        wrapper.appendChild(notification);
        
        // 存储通知引用
        this.notifications.set(id, {
            element: notification,
            config: config,
            timestamp: Date.now()
        });

        // 限制通知数量
        this.limitNotifications();

        // 触发入场动画
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // 自动移除
        if (config.duration > 0) {
            setTimeout(() => {
                this.removeNotification(id);
            }, config.duration);
        }

        return id;
    }

    /**
     * 创建通知元素
     * @param {number} id 通知ID
     * @param {Object} config 通知配置
     * @returns {HTMLElement} 通知元素
     */
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
                ${config.actions && config.actions.length > 0 ? this.createActionsHtml(config.actions) : ''}
            </div>
            ${config.duration > 0 ? '<div class="notification-progress"></div>' : ''}
        `;

        // 添加事件监听器
        this.setupNotificationEvents(notification, id, config);

        return notification;
    }

    /**
     * 创建操作按钮HTML
     * @param {Array} actions 操作列表
     * @returns {string} HTML字符串
     */
    createActionsHtml(actions) {
        const actionsHtml = actions.map(action => 
            `<button class="notification-action" data-action="${action.id}">${this.escapeHtml(action.label)}</button>`
        ).join('');

        return `<div class="notification-actions">${actionsHtml}</div>`;
    }

    /**
     * 设置通知事件监听器
     * @param {HTMLElement} notification 通知元素
     * @param {number} id 通知ID
     * @param {Object} config 通知配置
     */
    setupNotificationEvents(notification, id, config) {
        // 关闭按钮
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.removeNotification(id);
            });
        }

        // 操作按钮
        const actionBtns = notification.querySelectorAll('.notification-action');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = e.target.dataset.action;
                const action = config.actions.find(a => a.id === actionId);
                if (action && action.handler) {
                    action.handler();
                }
                
                // 执行操作后自动关闭通知
                if (action && action.autoClose !== false) {
                    this.removeNotification(id);
                }
            });
        });

        // 进度条动画
        const progressBar = notification.querySelector('.notification-progress');
        if (progressBar && config.duration > 0) {
            progressBar.style.animationDuration = `${config.duration}ms`;
        }

        // 点击通知体关闭（可选）
        if (config.clickToClose) {
            notification.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-actions, .notification-close')) {
                    this.removeNotification(id);
                }
            });
        }
    }

    /**
     * 移除通知
     * @param {number} id 通知ID
     */
    removeNotification(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        const { element } = notificationData;
        
        // 触发退场动画
        element.classList.add('hide');
        
        // 动画完成后移除元素
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * 限制通知数量
     */
    limitNotifications() {
        if (this.notifications.size <= this.maxNotifications) return;

        // 移除最旧的通知
        const sortedNotifications = Array.from(this.notifications.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toRemove = sortedNotifications.slice(0, this.notifications.size - this.maxNotifications);
        toRemove.forEach(([id]) => {
            this.removeNotification(id);
        });
    }

    /**
     * 获取类型图标
     * @param {string} type 通知类型
     * @returns {string} 图标HTML
     */
    getTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
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
     * 清除所有通知
     */
    clearAll() {
        Array.from(this.notifications.keys()).forEach(id => {
            this.removeNotification(id);
        });
    }

    /**
     * 获取当前通知数量
     * @returns {number} 通知数量
     */
    getNotificationCount() {
        return this.notifications.size;
    }

    /**
     * 销毁错误处理器
     */
    destroy() {
        this.clearAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        // 移除全局事件监听器
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('unhandledrejection', this.handleGlobalError);
    }
}