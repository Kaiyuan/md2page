/**
 * 响应式内容处理器
 * 负责处理图片、表格等内容的响应式适配
 */
export class ResponsiveContent {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isSmallScreen = window.innerWidth <= 480;
        
        this.init();
    }

    /**
     * 初始化响应式内容处理器
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const wasMobile = this.isMobile;
        const wasSmallScreen = this.isSmallScreen;
        
        this.isMobile = window.innerWidth <= 768;
        this.isSmallScreen = window.innerWidth <= 480;
        
        // 如果屏幕尺寸类别发生变化，重新处理内容
        if (wasMobile !== this.isMobile || wasSmallScreen !== this.isSmallScreen) {
            this.processAllContent();
        }
    }

    /**
     * 处理预览内容
     * @param {Element} container 预览容器
     */
    processContent(container) {
        if (!container) return;

        this.processImages(container);
        this.processTables(container);
        this.processCodeBlocks(container);
        this.processLists(container);
    }

    /**
     * 处理所有内容
     */
    processAllContent() {
        const previewContent = document.querySelector('.preview-content');
        if (previewContent) {
            this.processContent(previewContent);
        }
    }

    /**
     * 处理图片
     * @param {Element} container 容器元素
     */
    processImages(container) {
        const images = container.querySelectorAll('img');
        
        images.forEach(img => {
            // 确保图片响应式
            if (!img.style.maxWidth) {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }

            // 添加加载错误处理
            img.addEventListener('error', () => {
                this.handleImageError(img);
            });

            // 添加点击放大功能
            img.addEventListener('click', () => {
                this.showImageModal(img);
            });

            // 懒加载支持
            if ('loading' in HTMLImageElement.prototype) {
                img.loading = 'lazy';
            }
        });

        // 处理图片画廊
        this.createImageGallery(container);
    }

    /**
     * 处理图片加载错误
     * @param {Element} img 图片元素
     */
    handleImageError(img) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <span class="placeholder-icon">🖼️</span>
                <span class="placeholder-text">图片加载失败</span>
                <small class="placeholder-url">${img.src}</small>
            </div>
        `;
        
        img.parentNode.replaceChild(placeholder, img);
    }

    /**
     * 显示图片模态框
     * @param {Element} img 图片元素
     */
    showImageModal(img) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-backdrop">
                <div class="image-modal-content">
                    <img src="${img.src}" alt="${img.alt || ''}" />
                    <button class="image-modal-close">&times;</button>
                </div>
            </div>
        `;

        // 添加样式
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            cursor: zoom-out;
        `;

        const modalImg = modal.querySelector('img');
        modalImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        `;

        const closeBtn = modal.querySelector('.image-modal-close');
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // 事件监听
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.body.removeChild(modal);
        });

        document.body.appendChild(modal);
    }

    /**
     * 创建图片画廊
     * @param {Element} container 容器元素
     */
    createImageGallery(container) {
        const images = container.querySelectorAll('img');
        
        // 如果有多张图片，创建画廊布局
        if (images.length > 2) {
            const gallery = document.createElement('div');
            gallery.className = 'image-gallery';
            
            // 将连续的图片移动到画廊中
            let currentGallery = null;
            
            images.forEach(img => {
                const nextSibling = img.nextElementSibling;
                const prevSibling = img.previousElementSibling;
                
                // 检查是否应该加入画廊
                if (nextSibling && nextSibling.tagName === 'IMG' || 
                    prevSibling && prevSibling.tagName === 'IMG') {
                    
                    if (!currentGallery) {
                        currentGallery = gallery.cloneNode();
                        img.parentNode.insertBefore(currentGallery, img);
                    }
                    
                    currentGallery.appendChild(img);
                } else {
                    currentGallery = null;
                }
            });
        }
    }

    /**
     * 处理表格
     * @param {Element} container 容器元素
     */
    processTables(container) {
        const tables = container.querySelectorAll('table');
        
        tables.forEach(table => {
            this.wrapTable(table);
            this.addTableFeatures(table);
        });
    }

    /**
     * 包装表格以支持滚动
     * @param {Element} table 表格元素
     */
    wrapTable(table) {
        // 检查是否已经被包装
        if (table.parentElement.classList.contains('table-container')) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'table-container';
        
        // 在移动端添加额外的类
        if (this.isMobile) {
            wrapper.classList.add('table-mobile');
        }
        
        if (this.isSmallScreen) {
            wrapper.classList.add('table-small');
        }

        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    }

    /**
     * 添加表格功能
     * @param {Element} table 表格元素
     */
    addTableFeatures(table) {
        // 添加表格标题（如果有）
        this.addTableCaption(table);
        
        // 在小屏幕上添加数据标签
        if (this.isSmallScreen) {
            this.addDataLabels(table);
        }
        
        // 添加排序功能（可选）
        this.addTableSorting(table);
    }

    /**
     * 添加表格标题
     * @param {Element} table 表格元素
     */
    addTableCaption(table) {
        if (table.caption) return;
        
        // 查找表格前的标题
        let prevElement = table.parentElement.previousElementSibling;
        while (prevElement) {
            if (prevElement.tagName && prevElement.tagName.match(/^H[1-6]$/)) {
                const caption = document.createElement('caption');
                caption.textContent = prevElement.textContent;
                caption.style.captionSide = 'top';
                caption.style.textAlign = 'left';
                caption.style.fontWeight = 'bold';
                caption.style.padding = '0.5rem';
                table.insertBefore(caption, table.firstChild);
                break;
            }
            prevElement = prevElement.previousElementSibling;
        }
    }

    /**
     * 为小屏幕添加数据标签
     * @param {Element} table 表格元素
     */
    addDataLabels(table) {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent);
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (headers[index]) {
                    cell.setAttribute('data-label', headers[index]);
                }
            });
        });
        
        // 添加卡片样式类
        table.classList.add('table-cards');
    }

    /**
     * 添加表格排序功能
     * @param {Element} table 表格元素
     */
    addTableSorting(table) {
        const headers = table.querySelectorAll('th');
        
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.style.userSelect = 'none';
            header.setAttribute('data-sort', 'none');
            
            header.addEventListener('click', () => {
                this.sortTable(table, index);
            });
        });
    }

    /**
     * 排序表格
     * @param {Element} table 表格元素
     * @param {number} columnIndex 列索引
     */
    sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const header = table.querySelectorAll('th')[columnIndex];
        const currentSort = header.getAttribute('data-sort');
        
        // 确定排序方向
        const isAscending = currentSort !== 'asc';
        
        // 排序行
        rows.sort((a, b) => {
            const aText = a.cells[columnIndex].textContent.trim();
            const bText = b.cells[columnIndex].textContent.trim();
            
            // 尝试数字排序
            const aNum = parseFloat(aText);
            const bNum = parseFloat(bText);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return isAscending ? aNum - bNum : bNum - aNum;
            }
            
            // 文本排序
            return isAscending ? 
                aText.localeCompare(bText) : 
                bText.localeCompare(aText);
        });
        
        // 重新插入排序后的行
        rows.forEach(row => tbody.appendChild(row));
        
        // 更新排序状态
        table.querySelectorAll('th').forEach(th => th.setAttribute('data-sort', 'none'));
        header.setAttribute('data-sort', isAscending ? 'asc' : 'desc');
    }

    /**
     * 处理代码块
     * @param {Element} container 容器元素
     */
    processCodeBlocks(container) {
        const codeBlocks = container.querySelectorAll('pre code');
        
        codeBlocks.forEach(code => {
            // 添加复制按钮
            this.addCopyButton(code);
            
            // 添加语言标签
            this.addLanguageLabel(code);
        });
    }

    /**
     * 添加复制按钮
     * @param {Element} code 代码元素
     */
    addCopyButton(code) {
        const pre = code.parentElement;
        if (pre.querySelector('.copy-button')) return;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = '复制';
        copyButton.style.cssText = `
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            background: var(--button-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        `;
        
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(code.textContent).then(() => {
                copyButton.textContent = '已复制';
                setTimeout(() => {
                    copyButton.textContent = '复制';
                }, 2000);
            });
        });
        
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
    }

    /**
     * 添加语言标签
     * @param {Element} code 代码元素
     */
    addLanguageLabel(code) {
        const pre = code.parentElement;
        const className = code.className;
        const languageMatch = className.match(/language-(\w+)/);
        
        if (languageMatch && !pre.querySelector('.language-label')) {
            const label = document.createElement('span');
            label.className = 'language-label';
            label.textContent = languageMatch[1];
            label.style.cssText = `
                position: absolute;
                top: 0.5rem;
                left: 0.5rem;
                background: var(--primary-color);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: bold;
            `;
            
            pre.appendChild(label);
        }
    }

    /**
     * 处理列表
     * @param {Element} container 容器元素
     */
    processLists(container) {
        const lists = container.querySelectorAll('ul, ol');
        
        lists.forEach(list => {
            // 添加折叠功能（对于嵌套列表）
            this.addListCollapse(list);
        });
    }

    /**
     * 添加列表折叠功能
     * @param {Element} list 列表元素
     */
    addListCollapse(list) {
        const nestedLists = list.querySelectorAll('ul, ol');
        
        if (nestedLists.length > 0) {
            list.classList.add('collapsible-list');
            
            // 为有子列表的项目添加折叠按钮
            const items = list.querySelectorAll('li');
            items.forEach(item => {
                const childList = item.querySelector('ul, ol');
                if (childList) {
                    const toggle = document.createElement('span');
                    toggle.className = 'list-toggle';
                    toggle.textContent = '▼';
                    toggle.style.cssText = `
                        cursor: pointer;
                        margin-right: 0.5rem;
                        transition: transform 0.2s ease;
                        display: inline-block;
                    `;
                    
                    toggle.addEventListener('click', () => {
                        const isCollapsed = childList.style.display === 'none';
                        childList.style.display = isCollapsed ? 'block' : 'none';
                        toggle.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
                    });
                    
                    item.insertBefore(toggle, item.firstChild);
                }
            });
        }
    }

    /**
     * 销毁响应式内容处理器
     */
    destroy() {
        window.removeEventListener('resize', this.handleResize);
    }
}