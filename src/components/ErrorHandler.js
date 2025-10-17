/**
 * 错误处理组件
 * 负责显示用户友好的错误信息
 */

export class ErrorHandler {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    /**
     * 创建错误模态框
     */
    createModal() {
        // 检查是否已存在模态框
        if (document.getElementById('error-modal')) {
            this.modal = document.getElementById('error-modal');
            return;
        }

        // 创建模态框 HTML
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
                        <div id="error-details" class="error-details" style="display: none;">
                            <details>
                                <summary>详细信息</summary>
                                <pre id="error-stack"></pre>
                            </details>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="error-retry-btn" class="retry-btn" style="display: none;">重试</button>
                        <button id="error-ok-btn" class="ok-btn">确定</button>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('error-modal');
        
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const closeBtn = document.getElementById('error-modal-close');
        const okBtn = document.getElementById('error-ok-btn');
        const retryBtn = document.getElementById('error-retry-btn');

        // 关闭按钮
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // 确定按钮
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // 重试按钮
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.hideModal();
                if (this.retryCallback) {
                    this.retryCallback();
                }
            });
        }

        // 点击背景关闭
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        }

        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.style.display !== 'none') {
                this.hideModal();
            }
        });
    }

    /**
     * 显示错误信息
     * @param {Object} options 错误选项
     */
    showError(options) {
        const {
            title = '错误提示',
            message = '发生了未知错误',
            details = null,
            type = 'error',
            showRetry = false,
            retryCallback = null
        } = options;

        // 设置标题
        const titleElement = document.getElementById('error-title');
        if (titleElement) {
            titleElement.textContent = title;
        }

        // 设置图标
        const iconElement = document.getElementById('error-icon');
        if (iconElement) {
            iconElement.textContent = this.getIcon(type);
        }

        // 设置消息
        const messageElement = document.getElementById('error-message');
        if (messageElement) {
            messageElement.textContent = message;
        }

        // 设置详细信息
        const detailsElement = document.getElementById('error-details');
        const stackElement = document.getElementById('error-stack');
        if (details && detailsElement && stackElement) {
            stackElement.textContent = details;
            detailsElement.style.display = 'block';
        } else if (detailsElement) {
            detailsElement.style.display = 'none';
        }

        // 设置重试按钮
        const retryBtn = document.getElementById('error-retry-btn');
        if (retryBtn) {
            if (showRetry) {
                retryBtn.style.display = 'inline-block';
                this.retryCallback = retryCallback;
            } else {
                retryBtn.style.display = 'none';
                this.retryCallback = null;
            }
        }

        // 显示模态框
        this.showModal();
    }

    /**
     * 显示文件错误
     * @param {string} message 错误消息
     * @param {Object} fileInfo 文件信息
     */
    showFileError(message, fileInfo = {}) {
        const { fileName, fileSize, fileType } = fileInfo;
        
        let detailedMessage = message;
        if (fileName) {
            detailedMessage += `\n文件名: ${fileName}`;
        }
        if (fileSize) {
            detailedMessage += `\n文件大小: ${this.formatFileSize(fileSize)}`;
        }
        if (fileType) {
            detailedMessage += `\n文件类型: ${fileType}`;
        }

        this.showError({
            title: '文件处理错误',
            message: detailedMessage,
            type: 'file-error'
        });
    }

    /**
     * 显示网络错误
     * @param {string} message 错误消息
     * @param {Function} retryCallback 重试回调
     */
    showNetworkError(message, retryCallback = null) {
        this.showError({
            title: '网络错误',
            message: message,
            type: 'network-error',
            showRetry: !!retryCallback,
            retryCallback: retryCallback
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
            'network-error': '🌐',
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
            // 聚焦到确定按钮
            const okBtn = document.getElementById('error-ok-btn');
            if (okBtn) {
                setTimeout(() => okBtn.focus(), 100);
            }
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
}