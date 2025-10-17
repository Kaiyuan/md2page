/**
 * 目录生成器
 * 负责从 HTML 内容中提取标题并生成层级化的目录结构
 */
export class TOCGenerator {
    constructor() {
        this.headings = [];
        this.tocHTML = '';
        this.minLevel = 1;
        this.maxLevel = 6;
    }

    /**
     * 从 HTML 内容中生成目录
     * @param {string} htmlContent HTML 内容
     * @param {Object} options 配置选项
     * @returns {Object} 目录数据和 HTML
     */
    generateTOC(htmlContent, options = {}) {
        const {
            minLevel = 1,
            maxLevel = 6,
            includeLevel = null,
            excludeLevel = null,
            addIds = true
        } = options;

        this.minLevel = minLevel;
        this.maxLevel = maxLevel;

        // 解析标题
        this.headings = this.extractHeadings(htmlContent, {
            includeLevel,
            excludeLevel,
            addIds
        });

        // 生成目录 HTML
        this.tocHTML = this.generateTOCHTML(this.headings);

        return {
            headings: this.headings,
            html: this.tocHTML,
            count: this.headings.length,
            levels: this.getLevelStats()
        };
    }

    /**
     * 从 HTML 中提取标题
     * @param {string} htmlContent HTML 内容
     * @param {Object} options 选项
     * @returns {Array} 标题数组
     */
    extractHeadings(htmlContent, options = {}) {
        const { includeLevel, excludeLevel, addIds } = options;
        const headings = [];
        
        // 创建临时 DOM 来解析 HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // 查找所有标题元素
        const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headingElements.forEach((element, index) => {
            const level = parseInt(element.tagName.charAt(1));
            
            // 检查级别过滤
            if (level < this.minLevel || level > this.maxLevel) {
                return;
            }
            
            if (includeLevel && !includeLevel.includes(level)) {
                return;
            }
            
            if (excludeLevel && excludeLevel.includes(level)) {
                return;
            }

            const text = element.textContent.trim();
            if (!text) return;

            // 生成或获取 ID
            let id = element.id;
            if (!id && addIds) {
                id = this.generateHeadingId(text, index);
                element.id = id;
            }

            headings.push({
                level,
                text,
                id,
                element,
                index
            });
        });

        return headings;
    }

    /**
     * 生成标题 ID
     * @param {string} text 标题文本
     * @param {number} index 索引
     * @returns {string} 生成的 ID
     */
    generateHeadingId(text, index) {
        // 基础 ID 生成
        let id = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留字母、数字、中文、空格和连字符
            .replace(/\s+/g, '-') // 空格转连字符
            .replace(/-+/g, '-') // 多个连字符合并
            .replace(/^-+|-+$/g, ''); // 移除首尾连字符

        // 如果 ID 为空或太短，使用备用方案
        if (!id || id.length < 2) {
            id = `heading-${index + 1}`;
        }

        // 确保 ID 唯一性
        const existingIds = this.headings.map(h => h.id).filter(Boolean);
        let finalId = id;
        let counter = 1;
        
        while (existingIds.includes(finalId)) {
            finalId = `${id}-${counter}`;
            counter++;
        }

        return finalId;
    }

    /**
     * 生成目录 HTML
     * @param {Array} headings 标题数组
     * @returns {string} 目录 HTML
     */
    generateTOCHTML(headings) {
        if (!headings || headings.length === 0) {
            return '<div class=\"toc-empty\">暂无目录</div>';
        }

        const tocTree = this.buildTOCTree(headings);
        return this.renderTOCTree(tocTree);
    }

    /**
     * 构建目录树结构
     * @param {Array} headings 标题数组
     * @returns {Array} 目录树
     */
    buildTOCTree(headings) {
        const tree = [];
        const stack = [];

        headings.forEach(heading => {
            const tocItem = {
                ...heading,
                children: []
            };

            // 找到合适的父级
            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }

            if (stack.length === 0) {
                // 顶级项目
                tree.push(tocItem);
            } else {
                // 子项目
                stack[stack.length - 1].children.push(tocItem);
            }

            stack.push(tocItem);
        });

        return tree;
    }

    /**
     * 渲染目录树为 HTML
     * @param {Array} tree 目录树
     * @param {number} depth 当前深度
     * @returns {string} HTML 字符串
     */
    renderTOCTree(tree, depth = 0) {
        if (!tree || tree.length === 0) {
            return '';
        }

        const listClass = depth === 0 ? 'toc-list' : 'toc-list-sub';
        let html = `<ul class=\"${listClass}\">`;

        tree.forEach(item => {
            const levelClass = `toc-level-${item.level}`;
            const hasChildren = item.children && item.children.length > 0;
            
            html += `<li class=\"toc-item ${levelClass}\">`;
            
            if (item.id) {
                html += `<a href=\"#${item.id}\" class=\"toc-link\" data-level=\"${item.level}\" data-id=\"${item.id}\">${this.escapeHtml(item.text)}</a>`;
            } else {
                html += `<span class=\"toc-text\" data-level=\"${item.level}\">${this.escapeHtml(item.text)}</span>`;
            }

            if (hasChildren) {
                html += this.renderTOCTree(item.children, depth + 1);
            }

            html += '</li>';
        });

        html += '</ul>';
        return html;
    }

    /**
     * 获取级别统计信息
     * @returns {Object} 级别统计
     */
    getLevelStats() {
        const stats = {};
        
        for (let i = 1; i <= 6; i++) {
            stats[`h${i}`] = 0;
        }

        this.headings.forEach(heading => {
            stats[`h${heading.level}`]++;
        });

        return stats;
    }

    /**
     * 获取目录的纯文本版本
     * @param {Array} tree 目录树
     * @param {string} indent 缩进字符
     * @returns {string} 纯文本目录
     */
    getPlainTextTOC(tree = null, indent = '') {
        if (!tree) {
            tree = this.buildTOCTree(this.headings);
        }

        let text = '';
        
        tree.forEach(item => {
            text += `${indent}- ${item.text}\n`;
            
            if (item.children && item.children.length > 0) {
                text += this.getPlainTextTOC(item.children, indent + '  ');
            }
        });

        return text;
    }

    /**
     * 查找指定 ID 的标题
     * @param {string} id 标题 ID
     * @returns {Object|null} 标题对象
     */
    findHeadingById(id) {
        return this.headings.find(heading => heading.id === id) || null;
    }

    /**
     * 获取下一个/上一个标题
     * @param {string} currentId 当前标题 ID
     * @param {string} direction 方向 ('next' 或 'prev')
     * @returns {Object|null} 标题对象
     */
    getAdjacentHeading(currentId, direction = 'next') {
        const currentIndex = this.headings.findIndex(h => h.id === currentId);
        
        if (currentIndex === -1) {
            return null;
        }

        const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (targetIndex < 0 || targetIndex >= this.headings.length) {
            return null;
        }

        return this.headings[targetIndex];
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
     * 清理资源
     */
    destroy() {
        this.headings = [];
        this.tocHTML = '';
    }
}