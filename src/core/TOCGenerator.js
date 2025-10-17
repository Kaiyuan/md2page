/**
 * 目录生成器
 * 负责从 HTML 内容生成目录结构
 */

export class TOCGenerator {
    constructor() {
        this.headingSelector = 'h1, h2, h3, h4, h5, h6';
        this.maxDepth = 6;
        this.minHeadings = 2; // 最少标题数量才显示目录
    }

    /**
     * 从 HTML 内容生成目录
     * @param {string} htmlContent HTML 内容
     * @returns {Array<Object>} 目录项数组
     */
    generateTOC(htmlContent) {
        if (!htmlContent || typeof htmlContent !== 'string') {
            return [];
        }

        // 创建临时 DOM 元素来解析 HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // 查找所有标题元素
        const headings = tempDiv.querySelectorAll(this.headingSelector);
        
        if (headings.length < this.minHeadings) {
            return [];
        }

        // 转换为目录项数组
        const tocItems = Array.from(headings).map((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = this.extractHeadingText(heading);
            const id = this.generateHeadingId(text, index);

            // 确保标题有 ID
            if (!heading.id) {
                heading.id = id;
            }

            return {
                id: heading.id || id,
                text: text,
                level: level,
                element: heading,
                children: []
            };
        });

        // 构建层级结构
        return this.buildHierarchy(tocItems);
    }

    /**
     * 提取标题文本
     * @param {HTMLElement} heading 标题元素
     * @returns {string} 标题文本
     */
    extractHeadingText(heading) {
        // 移除可能的链接标签，只保留文本
        const clone = heading.cloneNode(true);
        
        // 移除所有链接
        const links = clone.querySelectorAll('a');
        links.forEach(link => {
            link.replaceWith(link.textContent);
        });

        // 移除其他可能的标签，保留纯文本
        return clone.textContent.trim();
    }

    /**
     * 生成标题 ID
     * @param {string} text 标题文本
     * @param {number} index 索引
     * @returns {string} 生成的 ID
     */
    generateHeadingId(text, index) {
        if (!text) {
            return `heading-${index}`;
        }

        // 生成 URL 友好的 ID
        let id = text
            .toLowerCase()
            // 保留中文字符和字母数字
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            // 移除开头和结尾的连字符
            .replace(/^-+|-+$/g, '')
            // 限制长度
            .substring(0, 50);

        // 如果 ID 为空或太短，使用索引
        if (!id || id.length < 2) {
            id = `heading-${index}`;
        }

        return id;
    }

    /**
     * 构建层级结构
     * @param {Array<Object>} tocItems 扁平的目录项数组
     * @returns {Array<Object>} 层级化的目录项数组
     */
    buildHierarchy(tocItems) {
        if (!tocItems || tocItems.length === 0) {
            return [];
        }

        const result = [];
        const stack = [];

        tocItems.forEach(item => {
            // 清空 children 数组
            item.children = [];

            // 找到合适的父级
            while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
                stack.pop();
            }

            if (stack.length === 0) {
                // 顶级项目
                result.push(item);
            } else {
                // 子项目
                stack[stack.length - 1].children.push(item);
            }

            stack.push(item);
        });

        return result;
    }

    /**
     * 渲染目录 HTML
     * @param {Array<Object>} tocItems 目录项数组
     * @param {Object} options 渲染选项
     * @returns {string} 目录 HTML
     */
    renderTOC(tocItems, options = {}) {
        const {
            className = 'toc',
            showNumbers = false,
            maxDepth = this.maxDepth,
            currentDepth = 1
        } = options;

        if (!tocItems || tocItems.length === 0 || currentDepth > maxDepth) {
            return '';
        }

        let html = `<ul class="${className}${currentDepth === 1 ? '' : '-sub'}">`;

        tocItems.forEach((item, index) => {
            const hasChildren = item.children && item.children.length > 0;
            const number = showNumbers ? `${index + 1}. ` : '';
            
            html += `
                <li class="toc-item toc-level-${item.level}" data-level="${item.level}">
                    <a href="#${item.id}" class="toc-link" data-target="${item.id}">
                        ${number}${this.escapeHtml(item.text)}
                    </a>
            `;

            // 递归渲染子项目
            if (hasChildren && currentDepth < maxDepth) {
                html += this.renderTOC(item.children, {
                    ...options,
                    currentDepth: currentDepth + 1
                });
            }

            html += '</li>';
        });

        html += '</ul>';
        return html;
    }

    /**
     * 设置滚动监听
     * @param {Array<Object>} tocItems 目录项数组
     * @param {Object} options 选项
     */
    setupScrollSpy(tocItems, options = {}) {
        const {
            offset = 100,
            activeClass = 'active',
            container = window
        } = options;

        if (!tocItems || tocItems.length === 0) {
            return;
        }

        // 获取所有标题元素
        const headings = tocItems.map(item => {
            const element = document.getElementById(item.id);
            return element ? { element, id: item.id } : null;
        }).filter(Boolean);

        if (headings.length === 0) {
            return;
        }

        let ticking = false;

        const updateActiveHeading = () => {
            const scrollTop = container === window 
                ? window.pageYOffset || document.documentElement.scrollTop
                : container.scrollTop;

            let activeHeading = null;

            // 找到当前可见的标题
            for (let i = headings.length - 1; i >= 0; i--) {
                const heading = headings[i];
                const rect = heading.element.getBoundingClientRect();
                const elementTop = container === window 
                    ? rect.top + scrollTop
                    : rect.top + container.scrollTop;

                if (scrollTop >= elementTop - offset) {
                    activeHeading = heading;
                    break;
                }
            }

            // 更新目录项的激活状态
            this.updateTOCActiveState(activeHeading ? activeHeading.id : null, activeClass);
            
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateActiveHeading);
                ticking = true;
            }
        };

        // 添加滚动监听
        container.addEventListener('scroll', onScroll, { passive: true });

        // 初始更新
        updateActiveHeading();

        // 返回清理函数
        return () => {
            container.removeEventListener('scroll', onScroll);
        };
    }

    /**
     * 更新目录激活状态
     * @param {string} activeId 当前激活的标题 ID
     * @param {string} activeClass 激活状态的 CSS 类名
     */
    updateTOCActiveState(activeId, activeClass = 'active') {
        // 移除所有激活状态
        const allTocLinks = document.querySelectorAll('.toc-link');
        allTocLinks.forEach(link => {
            link.classList.remove(activeClass);
            const listItem = link.closest('.toc-item');
            if (listItem) {
                listItem.classList.remove(activeClass);
            }
        });

        // 添加当前激活状态
        if (activeId) {
            const activeLink = document.querySelector(`.toc-link[data-target="${activeId}"]`);
            if (activeLink) {
                activeLink.classList.add(activeClass);
                const listItem = activeLink.closest('.toc-item');
                if (listItem) {
                    listItem.classList.add(activeClass);
                }
            }
        }
    }

    /**
     * 设置目录点击事件
     * @param {Object} options 选项
     */
    setupTOCClicks(options = {}) {
        const {
            behavior = 'smooth',
            offset = 80
        } = options;

        // 使用事件委托处理点击
        document.addEventListener('click', (e) => {
            const tocLink = e.target.closest('.toc-link');
            if (!tocLink) return;

            e.preventDefault();
            
            const targetId = tocLink.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                this.scrollToElement(targetElement, { behavior, offset });
            }
        });
    }

    /**
     * 滚动到指定元素
     * @param {HTMLElement} element 目标元素
     * @param {Object} options 滚动选项
     */
    scrollToElement(element, options = {}) {
        const {
            behavior = 'smooth',
            offset = 80
        } = options;

        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const targetPosition = elementTop - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: behavior
        });
    }

    /**
     * 转义 HTML 字符
     * @param {string} text 文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取目录统计信息
     * @param {Array<Object>} tocItems 目录项数组
     * @returns {Object} 统计信息
     */
    getTOCStats(tocItems) {
        if (!tocItems || tocItems.length === 0) {
            return {
                totalItems: 0,
                maxDepth: 0,
                levelCounts: {}
            };
        }

        const stats = {
            totalItems: 0,
            maxDepth: 0,
            levelCounts: {}
        };

        const countItems = (items) => {
            items.forEach(item => {
                stats.totalItems++;
                stats.maxDepth = Math.max(stats.maxDepth, item.level);
                stats.levelCounts[item.level] = (stats.levelCounts[item.level] || 0) + 1;
                
                if (item.children && item.children.length > 0) {
                    countItems(item.children);
                }
            });
        };

        countItems(tocItems);
        return stats;
    }

    /**
     * 设置最小标题数量
     * @param {number} count 最小数量
     */
    setMinHeadings(count) {
        this.minHeadings = Math.max(1, count);
    }

    /**
     * 设置最大深度
     * @param {number} depth 最大深度
     */
    setMaxDepth(depth) {
        this.maxDepth = Math.max(1, Math.min(6, depth));
    }
}