/**
 * 加载状态指示器
 * 提供各种加载状态的视觉反馈
 */
export class LoadingIndicator {
    constructor() {
        this.container = null;
        this.activeLoaders = new Map();
        this.loaderId = 0;
        
        this.init();
    }

    /**
     * 初始化加载指示器
     */
    init() {
        this.createContainer();
    }

    /**
     * 创建容器
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'loading-container';
        this.container.innerHTML = `
            <div class="loading-overlay hidden">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">加载中...</div>
                    <div class="loading-progress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="progress-text">0%</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
    }

    /**
     * 显示全屏加载
     * @param {Object} options 加载选项
     * @returns {number} 加载器ID
     */
    showFullscreen(options = {}) {
        const config = {
            text: '加载中...',
            showProgress: false,
            progress: 0,
            cancellable: false,
            onCancel: null,
            ...options
        };

        const overlay = this.container.querySelector('.loading-overlay');
        const textElement = overlay.querySelector('.loading-text');
        const progressElement = overlay.querySelector('.loading-progress');
        
        // 更新文本
        textElement.textContent = config.text;
        
        // 显示/隐藏进度条
        if (config.showProgress) {
            progressElement.style.display = 'block';
            this.updateProgress(config.progress);
        } else {
            progressElement.style.display = 'none';
        }
        
        // 显示覆盖层
        overlay.classList.remove('hidden');
        
        const id = ++this.loaderId;
        this.activeLoaders.set(id, {
            type: 'fullscreen',
            element: overlay,
            config: config
        });

        return id;
    }

    /**
     * 显示内联加载
     * @param {HTMLElement} target 目标元素
     * @param {Object} options 加载选项
     * @returns {number} 加载器ID
     */
    showInline(target, options = {}) {
        if (!target) {
            console.warn('LoadingIndicator: 目标元素不存在');
            return null;
        }

        const config = {
            text: '加载中...',
            size: 'medium',
            overlay: true,
            ...options
        };

        const loader = this.createInlineLoader(config);
        
        // 设置定位
        const targetRect = target.getBoundingClientRect();
        const targetStyle = window.getComputedStyle(target);
        
        if (targetStyle.position === 'static') {
            target.style.position = 'relative';
        }
        
        target.appendChild(loader);
        
        const id = ++this.loaderId;
        this.activeLoaders.set(id, {
            type: 'inline',
            element: loader,
            target: target,
            config: config
        });

        return id;
    }

    /**
     * 创建内联加载器
     * @param {Object} config 配置
     * @returns {HTMLElement} 加载器元素
     */
    createInlineLoader(config) {
        const loader = document.createElement('div');
        loader.className = `inline-loader ${config.overlay ? 'with-overlay' : ''}`;
        
        const sizeClass = `loader-${config.size}`;
        
        loader.innerHTML = `
            <div class="inline-loader-content ${sizeClass}">
                <div class="inline-spinner"></div>
                ${config.text ? `<div class="inline-text">${config.text}</div>` : ''}
            </div>
        `;
        
        return loader;
    }

    /**
     * 显示按钮加载状态
     * @param {HTMLElement} button 按钮元素
     * @param {Object} options 选项
     * @returns {number} 加载器ID
     */
    showButtonLoading(button, options = {}) {
        if (!button) {
            console.warn('LoadingIndicator: 按钮元素不存在');
            return null;
        }

        const config = {
            text: '处理中...',
            disableButton: true,
            ...options
        };

        // 保存原始状态
        const originalText = button.textContent;
        const originalDisabled = button.disabled;
        
        // 创建加载状态
        const spinner = document.createElement('span');
        spinner.className = 'button-spinner';
        
        button.innerHTML = '';
        button.appendChild(spinner);
        
        if (config.text) {
            const textSpan = document.createElement('span');
            textSpan.textContent = config.text;
            button.appendChild(textSpan);
        }
        
        if (config.disableButton) {
            button.disabled = true;
        }
        
        button.classList.add('loading');
        
        const id = ++this.loaderId;
        this.activeLoaders.set(id, {
            type: 'button',
            element: button,
            originalText: originalText,
            originalDisabled: originalDisabled,
            config: config
        });

        return id;
    }

    /**
     * 更新进度
     * @param {number} progress 进度值 (0-100)
     * @param {number} loaderId 加载器ID (可选)
     */
    updateProgress(progress, loaderId = null) {
        progress = Math.max(0, Math.min(100, progress));
        
        if (loaderId) {
            const loader = this.activeLoaders.get(loaderId);
            if (loader && loader.type === 'fullscreen') {
                this.updateFullscreenProgress(progress);
            }
        } else {
            // 更新当前全屏加载的进度
            this.updateFullscreenProgress(progress);
        }
    }

    /**
     * 更新全屏进度
     * @param {number} progress 进度值
     */
    updateFullscreenProgress(progress) {
        const overlay = this.container.querySelector('.loading-overlay');
        const progressFill = overlay.querySelector('.progress-fill');
        const progressText = overlay.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    /**
     * 隐藏加载器
     * @param {number} id 加载器ID
     */
    hide(id) {
        const loader = this.activeLoaders.get(id);
        if (!loader) return;

        switch (loader.type) {
            case 'fullscreen':
                this.hideFullscreen(loader);
                break;
            case 'inline':
                this.hideInline(loader);
                break;
            case 'button':
                this.hideButton(loader);
                break;
        }

        this.activeLoaders.delete(id);
    }

    /**
     * 隐藏全屏加载
     * @param {Object} loader 加载器对象
     */
    hideFullscreen(loader) {
        const overlay = loader.element;
        overlay.classList.add('hidden');
    }

    /**
     * 隐藏内联加载
     * @param {Object} loader 加载器对象
     */
    hideInline(loader) {
        const element = loader.element;
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    /**
     * 隐藏按钮加载
     * @param {Object} loader 加载器对象
     */
    hideButton(loader) {
        const button = loader.element;
        
        // 恢复原始状态
        button.textContent = loader.originalText;
        button.disabled = loader.originalDisabled;
        button.classList.remove('loading');
    }

    /**
     * 隐藏所有加载器
     */
    hideAll() {
        Array.from(this.activeLoaders.keys()).forEach(id => {
            this.hide(id);
        });
    }

    /**
     * 获取活动加载器数量
     * @returns {number} 数量
     */
    getActiveCount() {
        return this.activeLoaders.size;
    }

    /**
     * 检查是否有活动的加载器
     * @returns {boolean} 是否有活动加载器
     */
    hasActiveLoaders() {
        return this.activeLoaders.size > 0;
    }

    /**
     * 销毁加载指示器
     */
    destroy() {
        this.hideAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}