/**
 * 目录组件
 * 负责显示和管理文档目录
 */

import { TOCGenerator } from '../core/TOCGenerator.js';

export class TableOfContents {
    constructor(container) {
        this.container = container;
        this.tocGenerator = new TOCGenerator();
        this.tocItems = [];
        this.isVisible = false;
        this.scrollSpyCleanup = null;
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
                <button class="toc-collapse" id="toc-collapse" title="折叠目录">
                    <span class="collapse-icon">−</span>
                </button>
            </div>
            <div class="toc-content" id="toc-content">
                <div class="toc-placeholder">
                    <p>暂无目录</p>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const collapseBtn = this.container.querySelector('#toc-collapse');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.toggleCollapse();
            });
        }

        // 设置目录点击事件
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

        // 生成目录项
        this.tocItems = this.tocGenerator.generateTOC(htmlContent);

        // 渲染目录
        this.renderTOCContent();

        // 设置滚动监听
        this.setupScrollSpy();
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

        // 生成目录 HTML
        const tocHTML = this.tocGenerator.renderTOC(this.tocItems, {
            className: 'toc-list',
            showNumbers: false,
            maxDepth: 4
        });

        // 添加统计信息
        const stats = this.tocGenerator.getTOCStats(this.tocItems);
        
        tocContent.innerHTML = `
            <div class="toc-stats">
                <span class="toc-count">${stats.totalItems} 个标题</span>
            </div>
            ${tocHTML}
        `;
    }

    /**
     * 设置滚动监听
     */
    setupScrollSpy() {
        // 清理之前的监听器
        if (this.scrollSpyCleanup) {
            this.scrollSpyCleanup();
        }

        if (this.tocItems.length === 0) return;

        // 设置新的滚动监听
        this.scrollSpyCleanup = this.tocGenerator.setupScrollSpy(this.tocItems, {
            offset: 120,
            activeClass: 'active'
        });
    }

    /**
     * 切换折叠状态
     */
    toggleCollapse() {
        const tocContent = this.container.querySelector('#toc-content');
        const collapseIcon = this.container.querySelector('.collapse-icon');
        
        if (!tocContent || !collapseIcon) return;

        const isCollapsed = tocContent.style.display === 'none';
        
        if (isCollapsed) {
            tocContent.style.display = '';
            collapseIcon.textContent = '−';
            this.container.classList.remove('collapsed');
        } else {
            tocContent.style.display = 'none';
            collapseIcon.textContent = '+';
            this.container.classList.add('collapsed');
        }
    }

    /**
     * 显示目录
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.isVisible = true;
        }
    }

    /**
     * 隐藏目录
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
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

    /**
     * 销毁组件
     */
    destroy() {
        if (this.scrollSpyCleanup) {
            this.scrollSpyCleanup();
            this.scrollSpyCleanup = null;
        }
        
        this.tocItems = [];
        this.currentContent = '';
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}