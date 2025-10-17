/**
 * 预览面板组件
 * 负责显示转换后的 HTML 内容
 */

import { TableOfContents } from './TableOfContents.js';

export class PreviewPanel {
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

        // 目录切换按钮
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
            
            // 清空目录
            if (this.tableOfContents) {
                this.tableOfContents.updateTOC('');
            }
            return;
        }

        this.previewContent.innerHTML = htmlContent;
        
        // 更新目录
        if (this.tableOfContents) {
            this.tableOfContents.updateTOC(htmlContent);
            
            // 根据是否有目录来显示/隐藏目录按钮
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
            toggleTocBtn.title = `显示/隐藏目录 (${itemCount} 个标题)`;
        } else {
            toggleTocBtn.disabled = true;
            toggleTocBtn.textContent = '目录';
            toggleTocBtn.title = '当前内容没有标题';
            
            // 隐藏目录容器
            if (this.tocContainer) {
                this.tocContainer.classList.remove('visible');
            }
        }
    }

    /**
     * 更新目录
     * @param {string} tocHTML 目录 HTML
     */
    updateTOC(tocHTML) {
        // 这个方法保留用于向后兼容，但现在使用 TableOfContents 组件
        console.warn('updateTOC 方法已废弃，请使用 TableOfContents 组件');
    }

    /**
     * 获取预览内容
     * @returns {string} 当前预览的 HTML 内容
     */
    getContent() {
        return this.previewContent ? this.previewContent.innerHTML : '';
    }
}