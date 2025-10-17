/**
 * 移动端标签切换组件
 * 负责在移动设备上提供输入/预览面板的切换功能
 */
export class MobileTabs {
    constructor(container) {
        this.container = container;
        this.tabs = [];
        this.panels = [];
        this.activeTabIndex = 0;
        this.tabContainer = null;
        this.panelContainer = null;
        
        this.init();
    }

    /**
     * 初始化移动端标签
     */
    init() {
        this.createTabStructure();
        this.setupEventListeners();
        this.detectMobileMode();
    }

    /**
     * 创建标签结构
     */
    createTabStructure() {
        // 创建移动端容器
        const mobileContainer = document.createElement('div');
        mobileContainer.className = 'mobile-panel-container';
        
        // 创建标签导航
        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'mobile-tabs';
        this.tabContainer.innerHTML = `
            <button class="mobile-tab active" data-panel="input">
                <span class="tab-icon">✏️</span>
                <span class="tab-text">编辑</span>
            </button>
            <button class="mobile-tab" data-panel="preview">
                <span class="tab-icon">👁️</span>
                <span class="tab-text">预览</span>
            </button>
        `;
        
        // 创建面板内容容器
        this.panelContainer = document.createElement('div');
        this.panelContainer.className = 'mobile-panel-content';
        
        // 组装结构
        mobileContainer.appendChild(this.tabContainer);
        mobileContainer.appendChild(this.panelContainer);
        
        // 将原有面板移动到移动端容器中
        this.setupMobilePanels();
        
        // 替换原有容器内容
        this.container.innerHTML = '';
        this.container.appendChild(mobileContainer);
        
        // 缓存标签元素
        this.tabs = Array.from(this.tabContainer.querySelectorAll('.mobile-tab'));
    }

    /**
     * 设置移动端面板
     */
    setupMobilePanels() {
        const inputPanel = document.getElementById('input-panel');
        const previewPanel = document.getElementById('preview-panel');
        
        if (inputPanel && previewPanel) {
            // 包装面板
            this.wrapPanel(inputPanel, 'input', true);
            this.wrapPanel(previewPanel, 'preview', false);
            
            // 移动到移动端容器
            this.panelContainer.appendChild(inputPanel.parentElement);
            this.panelContainer.appendChild(previewPanel.parentElement);
            
            this.panels = [
                { element: inputPanel.parentElement, id: 'input' },
                { element: previewPanel.parentElement, id: 'preview' }
            ];
        }
    }

    /**
     * 包装面板
     */
    wrapPanel(panel, id, isActive) {
        const wrapper = document.createElement('div');
        wrapper.className = `mobile-panel ${isActive ? 'active' : ''}`;
        wrapper.setAttribute('data-panel', id);
        
        // 将面板移动到包装器中
        panel.parentNode.insertBefore(wrapper, panel);
        wrapper.appendChild(panel);
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 标签点击事件
        this.tabContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.mobile-tab');
            if (tab) {
                const panelId = tab.getAttribute('data-panel');
                this.switchToTab(panelId);
            }
        });

        // 窗口大小变化监听
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 触摸滑动支持
        this.setupSwipeGestures();
    }

    /**
     * 设置滑动手势
     */
    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let isSwipeStarted = false;

        this.panelContainer.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isSwipeStarted = true;
        }, { passive: true });

        this.panelContainer.addEventListener('touchmove', (e) => {
            if (!isSwipeStarted) return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            // 检查是否是水平滑动
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                e.preventDefault();
            }
        }, { passive: false });

        this.panelContainer.addEventListener('touchend', (e) => {
            if (!isSwipeStarted) return;
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            // 检查滑动距离和方向
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
                if (deltaX > 0 && this.activeTabIndex > 0) {
                    // 向右滑动，切换到上一个标签
                    this.switchToTab(this.panels[this.activeTabIndex - 1].id);
                } else if (deltaX < 0 && this.activeTabIndex < this.panels.length - 1) {
                    // 向左滑动，切换到下一个标签
                    this.switchToTab(this.panels[this.activeTabIndex + 1].id);
                }
            }
            
            isSwipeStarted = false;
        }, { passive: true });
    }

    /**
     * 切换到指定标签
     */
    switchToTab(panelId) {
        const tabIndex = this.panels.findIndex(panel => panel.id === panelId);
        if (tabIndex === -1 || tabIndex === this.activeTabIndex) return;

        // 更新标签状态
        this.tabs.forEach((tab, index) => {
            tab.classList.toggle('active', index === tabIndex);
        });

        // 更新面板状态
        this.panels.forEach((panel, index) => {
            panel.element.classList.toggle('active', index === tabIndex);
        });

        this.activeTabIndex = tabIndex;

        // 触发自定义事件
        this.dispatchTabChangeEvent(panelId);
    }

    /**
     * 触发标签切换事件
     */
    dispatchTabChangeEvent(panelId) {
        const event = new CustomEvent('tabchange', {
            detail: {
                activeTab: panelId,
                activeIndex: this.activeTabIndex
            }
        });
        this.container.dispatchEvent(event);
    }

    /**
     * 检测移动端模式
     */
    detectMobileMode() {
        const isMobile = window.innerWidth <= 768;
        this.container.classList.toggle('mobile-mode', isMobile);
        return isMobile;
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const wasMobile = this.container.classList.contains('mobile-mode');
        const isMobile = this.detectMobileMode();

        // 如果从移动端切换到桌面端，需要重新初始化布局
        if (wasMobile && !isMobile) {
            this.switchToDesktopMode();
        } else if (!wasMobile && isMobile) {
            this.switchToMobileMode();
        }
    }

    /**
     * 切换到桌面端模式
     */
    switchToDesktopMode() {
        // 恢复原始布局
        const inputPanel = document.getElementById('input-panel');
        const previewPanel = document.getElementById('preview-panel');
        
        if (inputPanel && previewPanel) {
            // 移除移动端包装
            const inputWrapper = inputPanel.parentElement;
            const previewWrapper = previewPanel.parentElement;
            
            this.container.innerHTML = '';
            this.container.appendChild(inputPanel);
            this.container.appendChild(previewPanel);
            
            // 重新初始化桌面端分割器
            if (window.app && window.app.initPanelSplitter) {
                setTimeout(() => {
                    window.app.initPanelSplitter();
                }, 100);
            }
        }
    }

    /**
     * 切换到移动端模式
     */
    switchToMobileMode() {
        // 重新创建移动端结构
        this.createTabStructure();
    }

    /**
     * 获取当前活跃标签
     */
    getActiveTab() {
        return {
            id: this.panels[this.activeTabIndex].id,
            index: this.activeTabIndex
        };
    }

    /**
     * 设置标签徽章（显示通知数量等）
     */
    setBadge(tabId, count) {
        const tab = this.tabs.find(tab => tab.getAttribute('data-panel') === tabId);
        if (!tab) return;

        let badge = tab.querySelector('.tab-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'tab-badge';
            tab.appendChild(badge);
        }

        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count.toString();
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    /**
     * 销毁移动端标签
     */
    destroy() {
        // 移除事件监听器
        window.removeEventListener('resize', this.handleResize);
        
        // 恢复原始结构
        this.switchToDesktopMode();
    }
}