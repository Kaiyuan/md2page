/**
 * 打印优化器
 * 负责优化 HTML 内容的打印显示
 */

export class PrintOptimizer {
    constructor() {
        this.printStyles = null;
        this.originalStyles = null;
    }

    /**
     * 生成打印专用 CSS
     * @param {Object} options 选项
     * @returns {string} 打印 CSS
     */
    generatePrintCSS(options = {}) {
        const {
            pageSize = 'A4',
            margin = '2cm',
            fontSize = '12pt',
            fontFamily = '"Times New Roman", Times, serif',
            lineHeight = '1.5'
        } = options;

        return `
@media print {
    @page {
        size: ${pageSize};
        margin: ${margin};
    }

    * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
    }

    body {
        font-family: ${fontFamily} !important;
        font-size: ${fontSize} !important;
        line-height: ${lineHeight} !important;
        color: #000 !important;
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    /* 隐藏不需要打印的元素 */
    .no-print,
    .app-header,
    .app-footer,
    .header-controls,
    .panel-header,
    .file-upload-container,
    .upload-section,
    .toc-container,
    .preview-controls,
    button,
    input[type="file"],
    .modal,
    .status-indicator {
        display: none !important;
    }

    /* 标题样式 */
    h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        margin-top: 1.5em !important;
        margin-bottom: 0.5em !important;
        font-weight: bold !important;
        color: #000 !important;
    }

    h1 {
        font-size: 18pt !important;
        border-bottom: 2pt solid #000;
        padding-bottom: 0.2em;
    }

    h2 {
        font-size: 16pt !important;
        border-bottom: 1pt solid #666;
        padding-bottom: 0.1em;
    }

    h3 { font-size: 14pt !important; }
    h4 { font-size: 13pt !important; }
    h5, h6 { font-size: 12pt !important; }

    /* 段落和文本 */
    p {
        margin: 0.5em 0 !important;
        text-align: justify;
        orphans: 3;
        widows: 3;
    }

    /* 列表 */
    ul, ol {
        margin: 0.5em 0 !important;
        padding-left: 1.5em !important;
    }

    li {
        margin: 0.2em 0 !important;
        page-break-inside: avoid;
    }

    /* 代码 */
    code {
        font-family: "Courier New", Courier, monospace !important;
        font-size: 10pt !important;
        background: #f5f5f5 !important;
        padding: 0.1em 0.2em !important;
        border: 1pt solid #ddd !important;
    }

    pre {
        font-family: "Courier New", Courier, monospace !important;
        font-size: 9pt !important;
        background: #f8f8f8 !important;
        border: 1pt solid #ccc !important;
        padding: 0.5em !important;
        margin: 0.5em 0 !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        page-break-inside: avoid;
    }

    /* 表格 */
    table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 0.5em 0 !important;
        font-size: 10pt !important;
        page-break-inside: avoid;
    }

    th, td {
        border: 1pt solid #000 !important;
        padding: 0.3em !important;
        text-align: left !important;
        vertical-align: top !important;
    }

    th {
        background: #f0f0f0 !important;
        font-weight: bold !important;
    }

    /* 引用块 */
    blockquote {
        margin: 1em 0 !important;
        padding: 0.5em 1em !important;
        border-left: 3pt solid #666 !important;
        background: #f9f9f9 !important;
        font-style: italic;
        page-break-inside: avoid;
    }

    /* 图片 */
    img {
        max-width: 100% !important;
        height: auto !important;
        page-break-inside: avoid;
        margin: 0.5em 0 !important;
    }

    /* 链接 */
    a {
        color: #000 !important;
        text-decoration: underline !important;
    }

    a[href]:after {
        content: " (" attr(href) ")";
        font-size: 9pt;
        color: #666;
    }
}`;
    }

    /**
     * 优化 HTML 内容用于打印
     * @param {string} htmlContent HTML 内容
     * @param {Object} options 选项
     * @returns {string} 优化后的 HTML
     */
    optimizeForPrint(htmlContent, options = {}) {
        if (!htmlContent) return '';

        const {
            removeInteractiveElements = true,
            addPageBreaks = true,
            optimizeImages = true,
            addPrintStyles = true
        } = options;

        let optimizedHTML = htmlContent;

        // 移除交互元素
        if (removeInteractiveElements) {
            optimizedHTML = this.removeInteractiveElements(optimizedHTML);
        }

        // 添加分页控制
        if (addPageBreaks) {
            optimizedHTML = this.handlePageBreaks(optimizedHTML);
        }

        // 优化图片
        if (optimizeImages) {
            optimizedHTML = this.optimizeImages(optimizedHTML);
        }

        // 添加打印样式
        if (addPrintStyles) {
            const printCSS = this.generatePrintCSS(options);
            optimizedHTML = `<style>${printCSS}</style>${optimizedHTML}`;
        }

        return optimizedHTML;
    }

    /**
     * 移除交互元素
     * @param {string} htmlContent HTML 内容
     * @returns {string} 处理后的 HTML
     */
    removeInteractiveElements(htmlContent) {
        // 创建临时 DOM 元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // 移除按钮
        const buttons = tempDiv.querySelectorAll('button');
        buttons.forEach(button => button.remove());

        // 移除输入框
        const inputs = tempDiv.querySelectorAll('input, textarea, select');
        inputs.forEach(input => input.remove());

        // 移除脚本
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // 添加 no-print 类的元素
        const noPrintElements = tempDiv.querySelectorAll('.no-print');
        noPrintElements.forEach(element => element.remove());

        return tempDiv.innerHTML;
    }

    /**
     * 处理分页
     * @param {string} htmlContent HTML 内容
     * @returns {string} 处理后的 HTML
     */
    handlePageBreaks(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // 在 H1 标题前添加分页
        const h1Elements = tempDiv.querySelectorAll('h1');
        h1Elements.forEach((h1, index) => {
            if (index > 0) { // 第一个 H1 不需要分页
                h1.style.pageBreakBefore = 'always';
            }
        });

        // 防止标题后立即分页
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.pageBreakAfter = 'avoid';
        });

        // 防止表格和代码块被分页
        const avoidBreakElements = tempDiv.querySelectorAll('table, pre, blockquote');
        avoidBreakElements.forEach(element => {
            element.style.pageBreakInside = 'avoid';
        });

        return tempDiv.innerHTML;
    }

    /**
     * 优化图片
     * @param {string} htmlContent HTML 内容
     * @returns {string} 处理后的 HTML
     */
    optimizeImages(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        const images = tempDiv.querySelectorAll('img');
        images.forEach(img => {
            // 设置最大宽度
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            
            // 防止图片被分页截断
            img.style.pageBreakInside = 'avoid';
            
            // 添加打印友好的边距
            img.style.margin = '0.5em 0';
        });

        return tempDiv.innerHTML;
    }

    /**
     * 启用打印预览模式
     * @param {HTMLElement} container 容器元素
     */
    enablePrintPreview(container) {
        if (!container) return;

        container.classList.add('print-preview');
        
        // 应用打印样式
        if (!this.printStyles) {
            this.printStyles = document.createElement('style');
            this.printStyles.textContent = this.generatePrintCSS();
            document.head.appendChild(this.printStyles);
        }
    }

    /**
     * 禁用打印预览模式
     * @param {HTMLElement} container 容器元素
     */
    disablePrintPreview(container) {
        if (!container) return;

        container.classList.remove('print-preview');
        
        // 移除打印样式
        if (this.printStyles) {
            document.head.removeChild(this.printStyles);
            this.printStyles = null;
        }
    }

    /**
     * 打印页面
     * @param {Object} options 打印选项
     */
    printPage(options = {}) {
        const {
            title = document.title,
            beforePrint = null,
            afterPrint = null
        } = options;

        // 打印前回调
        if (beforePrint && typeof beforePrint === 'function') {
            beforePrint();
        }

        // 设置页面标题
        const originalTitle = document.title;
        document.title = title;

        // 执行打印
        window.print();

        // 恢复标题
        document.title = originalTitle;

        // 打印后回调
        if (afterPrint && typeof afterPrint === 'function') {
            afterPrint();
        }
    }

    /**
     * 获取打印设置
     * @returns {Object} 打印设置
     */
    getPrintSettings() {
        return {
            pageSize: 'A4',
            margin: '2cm',
            fontSize: '12pt',
            fontFamily: '"Times New Roman", Times, serif',
            lineHeight: '1.5',
            colorMode: 'grayscale'
        };
    }

    /**
     * 检查打印支持
     * @returns {boolean} 是否支持打印
     */
    isPrintSupported() {
        return typeof window !== 'undefined' && 'print' in window;
    }

    /**
     * 估算打印页数
     * @param {string} htmlContent HTML 内容
     * @returns {number} 估算页数
     */
    estimatePageCount(htmlContent) {
        if (!htmlContent) return 0;

        // 简单估算：基于字符数和页面容量
        const charCount = htmlContent.replace(/<[^>]*>/g, '').length;
        const charsPerPage = 2500; // A4 页面大约容纳的字符数
        
        return Math.ceil(charCount / charsPerPage);
    }

    /**
     * 生成打印友好的文件名
     * @param {string} originalName 原始文件名
     * @returns {string} 打印友好的文件名
     */
    generatePrintFilename(originalName) {
        const timestamp = new Date().toISOString().slice(0, 10);
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        return `${baseName}-print-${timestamp}`;
    }
}