/**
 * 面板分割器组件
 * 负责处理双栏布局的大小调整功能
 */
export class PanelSplitter {
    constructor(container, leftPanel, rightPanel) {
        this.container = container;
        this.leftPanel = leftPanel;
        this.rightPanel = rightPanel;
        this.splitter = null;
        this.isDragging = false;
        this.startX = 0;
        this.startLeftWidth = 0;
        this.startRightWidth = 0;
        this.minPanelWidth = 300;
        
        this.init();
    }

    /**
     * 初始化分割器
     */
    init() {
        this.createSplitter();
        this.setupEventListeners();
        this.setupResizablePanels();
    }

    /**
     * 创建分割器元素
     */
    createSplitter() {
        this.splitter = document.createElement('div');
        this.splitter.className = 'panel-splitter';
        this.splitter.setAttribute('aria-label', '拖拽调整面板大小');
        
        // 插入到两个面板之间
        this.container.insertBefore(this.splitter, this.rightPanel);
    }

    /**
     * 设置可调整大小的面板
     */
    setupResizablePanels() {
        // 添加包装类
        this.container.classList.add('resizable-panels');
        this.leftPanel.classList.add('panel-left');
        this.rightPanel.classList.add('panel-right');
        
        // 设置初始宽度（50/50 分割）
        this.resetPanelSizes();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 鼠标事件
        this.splitter.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // 触摸事件（移动端支持）
        this.splitter.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // 窗口大小变化
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        
        // 双击重置
        this.splitter.addEventListener('dblclick', this.resetPanelSizes.bind(this));
    }

    /**
     * 处理鼠标按下
     */
    handleMouseDown(e) {
        e.preventDefault();
        this.startDrag(e.clientX);
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(touch.clientX);
    }

    /**
     * 开始拖拽
     */
    startDrag(clientX) {
        this.isDragging = true;
        this.startX = clientX;
        
        // 记录初始宽度
        const containerRect = this.container.getBoundingClientRect();
        const leftRect = this.leftPanel.getBoundingClientRect();
        const rightRect = this.rightPanel.getBoundingClientRect();
        
        this.startLeftWidth = leftRect.width;
        this.startRightWidth = rightRect.width;
        this.containerWidth = containerRect.width - 8; // 减去分割器宽度
        
        // 添加拖拽状态样式
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        this.container.classList.add('dragging');
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.updatePanelSizes(e.clientX);
    }

    /**
     * 处理触摸移动
     */
    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.updatePanelSizes(touch.clientX);
    }

    /**
     * 更新面板大小
     */
    updatePanelSizes(clientX) {
        const deltaX = clientX - this.startX;
        
        // 计算新的宽度
        let newLeftWidth = this.startLeftWidth + deltaX;
        let newRightWidth = this.startRightWidth - deltaX;
        
        // 应用最小宽度限制
        if (newLeftWidth < this.minPanelWidth) {
            newLeftWidth = this.minPanelWidth;
            newRightWidth = this.containerWidth - newLeftWidth;
        }
        
        if (newRightWidth < this.minPanelWidth) {
            newRightWidth = this.minPanelWidth;
            newLeftWidth = this.containerWidth - newRightWidth;
        }
        
        // 计算百分比
        const leftPercent = (newLeftWidth / this.containerWidth) * 100;
        const rightPercent = (newRightWidth / this.containerWidth) * 100;
        
        // 应用新的宽度
        this.leftPanel.style.width = `${leftPercent}%`;
        this.rightPanel.style.width = `${rightPercent}%`;
        
        // 保存到本地存储
        this.savePanelSizes(leftPercent, rightPercent);
    }

    /**
     * 处理鼠标释放
     */
    handleMouseUp() {
        this.endDrag();
    }

    /**
     * 处理触摸结束
     */
    handleTouchEnd() {
        this.endDrag();
    }

    /**
     * 结束拖拽
     */
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // 移除拖拽状态样式
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.container.classList.remove('dragging');
    }

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
        // 延迟处理，避免频繁调用
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.adjustPanelsOnResize();
        }, 100);
    }

    /**
     * 窗口大小变化时调整面板
     */
    adjustPanelsOnResize() {
        const savedSizes = this.loadPanelSizes();
        if (savedSizes) {
            this.leftPanel.style.width = `${savedSizes.left}%`;
            this.rightPanel.style.width = `${savedSizes.right}%`;
        }
    }

    /**
     * 重置面板大小为 50/50
     */
    resetPanelSizes() {
        this.leftPanel.style.width = '50%';
        this.rightPanel.style.width = '50%';
        this.savePanelSizes(50, 50);
    }

    /**
     * 保存面板大小到本地存储
     */
    savePanelSizes(leftPercent, rightPercent) {
        try {
            const sizes = {
                left: leftPercent,
                right: rightPercent,
                timestamp: Date.now()
            };
            localStorage.setItem('md2page-panel-sizes', JSON.stringify(sizes));
        } catch (error) {
            console.warn('无法保存面板大小设置:', error);
        }
    }

    /**
     * 从本地存储加载面板大小
     */
    loadPanelSizes() {
        try {
            const saved = localStorage.getItem('md2page-panel-sizes');
            if (saved) {
                const sizes = JSON.parse(saved);
                // 检查数据有效性
                if (sizes.left && sizes.right && 
                    sizes.left > 0 && sizes.right > 0 && 
                    Math.abs(sizes.left + sizes.right - 100) < 1) {
                    return sizes;
                }
            }
        } catch (error) {
            console.warn('无法加载面板大小设置:', error);
        }
        return null;
    }

    /**
     * 初始化时加载保存的面板大小
     */
    loadSavedSizes() {
        const savedSizes = this.loadPanelSizes();
        if (savedSizes) {
            this.leftPanel.style.width = `${savedSizes.left}%`;
            this.rightPanel.style.width = `${savedSizes.right}%`;
        }
    }

    /**
     * 获取当前面板大小信息
     */
    getPanelSizes() {
        const leftRect = this.leftPanel.getBoundingClientRect();
        const rightRect = this.rightPanel.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        return {
            left: {
                width: leftRect.width,
                percent: (leftRect.width / containerRect.width) * 100
            },
            right: {
                width: rightRect.width,
                percent: (rightRect.width / containerRect.width) * 100
            }
        };
    }

    /**
     * 销毁分割器
     */
    destroy() {
        // 移除事件监听器
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        window.removeEventListener('resize', this.handleWindowResize);
        
        // 清理定时器
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // 移除DOM元素
        if (this.splitter && this.splitter.parentNode) {
            this.splitter.parentNode.removeChild(this.splitter);
        }
        
        // 移除样式类
        this.container.classList.remove('resizable-panels', 'dragging');
        this.leftPanel.classList.remove('panel-left');
        this.rightPanel.classList.remove('panel-right');
        
        // 重置样式
        this.leftPanel.style.width = '';
        this.rightPanel.style.width = '';
    }
}