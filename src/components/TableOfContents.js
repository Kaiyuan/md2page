/**
 * 目录组件
 * 负责显示目录、处理点击跳转和滚动高亮
 */
import { TOCGenerator } from '../core/TOCGenerator.js';

export class TableOfContents {
    constructor(container) {
        this.container = container;
        this.tocGenerator = new TOCGenerator();
        this.tocContainer = null;
        this.tocContent = null;
        this.currentActiveId = null;
        this.isVisible = false;
        this.scrollTimeout = null;
        this.headingOffsets = new Map();
        
        this.init();
    }

    /**
     * 初始化目录组件
     */
    init() {
        this.createTOCStructure();
        this.setupEventListeners();
    }

    /**
     * 创建目录结构
     */
    createTOCStructure() {
        if (!this.container) return;

        // 创建目录容器
        this.tocContainer = document.createElement('div');
        this.tocContainer.className = 'toc-container';
        this.tocContainer.innerHTML = `
            <div class="toc-header">
                <h3 class="toc-title">目录</h3>
                <button class="toc-collapse" aria-label="折叠目录">−</button>
            </div>
            <div class="toc-stats" style="display: none;">
                <span class="toc-count">0 个标题</span>
            </div>
            <div class="toc-content">
                <div class="toc-placeholder">
                    暂无目录内容
                </div>
            </div>
        `;

        this.tocContent = this.tocContainer.querySelector('.toc-content');
        this.container.appendChild(this.tocContainer);
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 折叠按钮事件
        const collapseBtn = this.tocContainer.querySelector('.toc-collapse');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.toggleCollapse();
            });
        }

        // 目录链接点击事件（事件委托）
        this.tocContent.addEventListener('click', (e) => {
            const link = e.target.closest('.toc-link');
            if (link) {
                e.preventDefault();
                this.handleTOCClick(link);
            }
        });

        // 滚动监听
        this.setupScrollListener();
    }

    /**
     * 设置滚动监听器
     */
    setupScrollListener() {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateActiveHeading();
                    ticking = false;
                });
                ticking = true;
            }
        };

        // 监听预览面板的滚动
        const previewContent = document.querySelector('.preview-content');
        if (previewContent) {
            previewContent.addEventListener('scroll', handleScroll, { passive: true });
        }

        // 也监听窗口滚动（备用）
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * 更新目录内容
     * @param {string} htmlContent HTML 内容
     * @param {Object} options 选项
     */
    updateTOC(htmlContent, options = {}) {
        if (!htmlContent || !htmlContent.trim()) {
            this.showEmptyState();
            return;
        }

        try {
            // 生成目录
            const tocData = this.tocGenerator.generateTOC(htmlContent, options);
            
            if (tocData.count === 0) {
                this.showEmptyState();
                return;
            }

            // 更新目录内容
            this.tocContent.innerHTML = tocData.html;
            
            // 更新统计信息
            this.updateStats(tocData);
            
            // 缓存标题位置
            this.cacheHeadingOffsets();
            
            // 显示目录
            this.show();
            
        } catch (error) {
            console.error('更新目录失败:', error);
            this.showErrorState();
        }
    }

    /**
     * 显示空状态
     */
    showEmptyState() {
        this.tocContent.innerHTML = `
            <div class="toc-placeholder">
                <p>暂无目录内容</p>
                <small>文档中没有找到标题</small>
            </div>
        `;
        this.updateStats({ count: 0, levels: {} });
        this.hide();
    }

    /**
     * 显示错误状态
     */
    showErrorState() {
        this.tocContent.innerHTML = `
            <div class="toc-placeholder toc-error">
                <p>目录生成失败</p>
                <small>请检查文档格式</small>
            </div>
        `;
    }

    /**
     * 更新统计信息
     * @param {Object} tocData 目录数据
     */
    updateStats(tocData) {
        const statsElement = this.tocContainer.querySelector('.toc-stats');
        const countElement = this.tocContainer.querySelector('.toc-count');
        
        if (statsElement && countElement) {
            if (tocData.count > 0) {
                countElement.textContent = `${tocData.count} 个标题`;
                statsElement.style.display = 'block';
            } else {
                statsElement.style.display = 'none';
            }
        }
    }

    /**
     * 缓存标题位置
     */
    cacheHeadingOffsets() {
        this.headingOffsets.clear();
        
        const previewContent = document.querySelector('.preview-content');
        if (!previewContent) return;

        const headings = previewContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach(heading => {
            if (heading.id) {
                const rect = heading.getBoundingClientRect();
                const containerRect = previewContent.getBoundingClientRect();
                const offset = rect.top - containerRect.top + previewContent.scrollTop;
                
                this.headingOffsets.set(heading.id, {
                    element: heading,
                    offset: offset,
                    level: parseInt(heading.tagName.charAt(1))
                });
            }
        });
    }

    /**
     * 更新当前活跃的标题
     */
    updateActiveHeading() {
        if (this.headingOffsets.size === 0) return;

        const previewContent = document.querySelector('.preview-content');
        if (!previewContent) return;

        const scrollTop = previewContent.scrollTop;
        const containerHeight = previewContent.clientHeight;
        const threshold = containerHeight * 0.3; // 30% 的位置作为阈值

        let activeId = null;
        let closestDistance = Infinity;

        // 找到最接近阈值位置的标题
        this.headingOffsets.forEach((data, id) => {
            const distance = Math.abs(data.offset - (scrollTop + threshold));
            
            if (data.offset <= scrollTop + threshold && distance < closestDistance) {
                closestDistance = distance;
                activeId = id;
            }
        });

        // 如果没有找到合适的，使用第一个可见的标题
        if (!activeId) {
            this.headingOffsets.forEach((data, id) => {
                if (data.offset >= scrollTop && data.offset <= scrollTop + containerHeight) {
                    if (!activeId) {
                        activeId = id;
                    }
                }
            });
        }

        // 更新高亮
        if (activeId !== this.currentActiveId) {
            this.setActiveHeading(activeId);
        }
    }

    /**
     * 设置活跃标题
     * @param {string} headingId 标题 ID
     */
    setActiveHeading(headingId) {
        // 移除之前的高亮
        const prevActive = this.tocContent.querySelector('.toc-link.active');
        if (prevActive) {
            prevActive.classList.remove('active');
        }

        // 添加新的高亮
        if (headingId) {
            const newActive = this.tocContent.querySelector(`[data-id="${headingId}"]`);
            if (newActive) {
                newActive.classList.add('active');
                
                // 滚动到可见区域
                this.scrollToVisible(newActive);
            }
        }

        this.currentActiveId = headingId;
    }

    /**
     * 滚动目录项到可见区域
     * @param {Element} element 目录项元素
     */
    scrollToVisible(element) {
        if (!element || !this.tocContent) return;

        const containerRect = this.tocContent.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const isVisible = (
            elementRect.top >= containerRect.top &&
            elementRect.bottom <= containerRect.bottom
        );

        if (!isVisible) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    /**
     * 处理目录链接点击
     * @param {Element} link 链接元素
     */
    handleTOCClick(link) {
        const targetId = link.getAttribute('data-id');
        if (!targetId) return;

        const previewContent = document.querySelector('.preview-content');
        const targetElement = previewContent?.querySelector(`#${targetId}`);
        
        if (targetElement) {
            // 平滑滚动到目标位置
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // 立即更新高亮（不等待滚动完成）
            this.setActiveHeading(targetId);
        }
    }

    /**
     * 切换折叠状态
     */
    toggleCollapse() {
        const content = this.tocContainer.querySelector('.toc-content');
        const button = this.tocContainer.querySelector('.toc-collapse');
        
        if (content && button) {
            const isCollapsed = content.style.display === 'none';
            
            content.style.display = isCollapsed ? 'block' : 'none';
            button.textContent = isCollapsed ? '−' : '+';
            button.setAttribute('aria-label', isCollapsed ? '折叠目录' : '展开目录');
        }
    }

    /**
     * 显示目录
     */
    show() {
        if (this.tocContainer) {
            this.tocContainer.classList.add('visible');
            this.isVisible = true;
        }
    }

    /**
     * 隐藏目录
     */
    hide() {
        if (this.tocContainer) {
            this.tocContainer.classList.remove('visible');
            this.isVisible = false;
        }
    }

    /**
     * 切换显示状态
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
     * @returns {Object} 目录相关数据
     */
    getTOCData() {
        return {
            headings: this.tocGenerator.headings,
            count: this.tocGenerator.headings.length,
            isVisible: this.isVisible,
            currentActive: this.currentActiveId
        };
    }

    /**
     * 清理资源
     */
    destroy() {
        // 移除事件监听器
        const previewContent = document.querySelector('.preview-content');
        if (previewContent) {
            previewContent.removeEventListener('scroll', this.updateActiveHeading);
        }
        
        window.removeEventListener('scroll', this.updateActiveHeading);

        // 清理定时器
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        // 清理数据
        this.headingOffsets.clear();
        this.tocGenerator.destroy();

        // 移除 DOM 元素
        if (this.tocContainer && this.tocContainer.parentNode) {
            this.tocContainer.parentNode.removeChild(this.tocContainer);
        }
    }
}