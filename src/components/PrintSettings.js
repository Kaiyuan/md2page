/**
 * 打印设置组件
 * 提供打印选项的用户界面
 */
export class PrintSettings {
    constructor() {
        this.modal = null;
        this.settings = {
            fontSize: '12pt',
            lineHeight: '1.4',
            margins: '2cm',
            blackAndWhite: false,
            removeInteractiveElements: true,
            addPageBreaks: true,
            optimizeImages: true
        };
        
        this.onApply = null;
        this.onCancel = null;
        
        this.init();
    }

    /**
     * 初始化打印设置组件
     */
    init() {
        this.createModal();
    }

    /**
     * 创建设置模态框
     */
    createModal() {
        if (document.getElementById('print-settings-modal')) return;

        const modalHTML = `
            <div id="print-settings-modal" class="modal print-settings-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>打印设置</h3>
                        <button class="modal-close" id="print-settings-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-grid">
                            <div class="setting-group">
                                <label for="print-font-size">字体大小</label>
                                <select id="print-font-size">
                                    <option value="10pt">10pt</option>
                                    <option value="11pt">11pt</option>
                                    <option value="12pt" selected>12pt</option>
                                    <option value="13pt">13pt</option>
                                    <option value="14pt">14pt</option>
                                </select>
                            </div>
                            
                            <div class="setting-group">
                                <label for="print-line-height">行高</label>
                                <select id="print-line-height">
                                    <option value="1.2">1.2</option>
                                    <option value="1.3">1.3</option>
                                    <option value="1.4" selected>1.4</option>
                                    <option value="1.5">1.5</option>
                                    <option value="1.6">1.6</option>
                                </select>
                            </div>
                            
                            <div class="setting-group">
                                <label for="print-margins">页边距</label>
                                <select id="print-margins">
                                    <option value="1cm">1cm</option>
                                    <option value="1.5cm">1.5cm</option>
                                    <option value="2cm" selected>2cm</option>
                                    <option value="2.5cm">2.5cm</option>
                                    <option value="3cm">3cm</option>
                                </select>
                            </div>
                            
                            <div class="setting-group checkbox-group">
                                <label>
                                    <input type="checkbox" id="print-black-white">
                                    黑白打印（节省墨水）
                                </label>
                            </div>
                            
                            <div class="setting-group checkbox-group">
                                <label>
                                    <input type="checkbox" id="print-page-breaks" checked>
                                    智能分页
                                </label>
                            </div>
                            
                            <div class="setting-group checkbox-group">
                                <label>
                                    <input type="checkbox" id="print-optimize-images" checked>
                                    优化图片
                                </label>
                            </div>
                        </div>
                        
                        <div class="preview-section">
                            <h4>预览</h4>
                            <div class="print-preview-sample">
                                <div class="sample-content">
                                    <h1>示例标题</h1>
                                    <p>这是一个段落示例，展示当前设置下的打印效果。</p>
                                    <ul>
                                        <li>列表项目 1</li>
                                        <li>列表项目 2</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="print-settings-cancel">取消</button>
                        <button class="btn btn-primary" id="print-settings-preview">预览</button>
                        <button class="btn btn-success" id="print-settings-apply">应用并打印</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('print-settings-modal');
        
        this.setupEventListeners();
        this.updatePreview();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 关闭按钮
        const closeBtn = document.getElementById('print-settings-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // 取消按钮
        const cancelBtn = document.getElementById('print-settings-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hide();
                if (this.onCancel) this.onCancel();
            });
        }

        // 预览按钮
        const previewBtn = document.getElementById('print-settings-preview');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.showPreview();
            });
        }

        // 应用按钮
        const applyBtn = document.getElementById('print-settings-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applySettings();
            });
        }

        // 设置变化监听
        const inputs = this.modal.querySelectorAll('select, input[type="checkbox"]');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateSettings();
                this.updatePreview();
            });
        });
    }

    /**
     * 显示设置模态框
     */
    show() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.loadCurrentSettings();
        }
    }

    /**
     * 隐藏设置模态框
     */
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    /**
     * 加载当前设置到界面
     */
    loadCurrentSettings() {
        const fontSizeSelect = document.getElementById('print-font-size');
        const lineHeightSelect = document.getElementById('print-line-height');
        const marginsSelect = document.getElementById('print-margins');
        const blackWhiteCheck = document.getElementById('print-black-white');
        const pageBreaksCheck = document.getElementById('print-page-breaks');
        const optimizeImagesCheck = document.getElementById('print-optimize-images');

        if (fontSizeSelect) fontSizeSelect.value = this.settings.fontSize;
        if (lineHeightSelect) lineHeightSelect.value = this.settings.lineHeight;
        if (marginsSelect) marginsSelect.value = this.settings.margins;
        if (blackWhiteCheck) blackWhiteCheck.checked = this.settings.blackAndWhite;
        if (pageBreaksCheck) pageBreaksCheck.checked = this.settings.addPageBreaks;
        if (optimizeImagesCheck) optimizeImagesCheck.checked = this.settings.optimizeImages;
    }

    /**
     * 更新设置
     */
    updateSettings() {
        const fontSizeSelect = document.getElementById('print-font-size');
        const lineHeightSelect = document.getElementById('print-line-height');
        const marginsSelect = document.getElementById('print-margins');
        const blackWhiteCheck = document.getElementById('print-black-white');
        const pageBreaksCheck = document.getElementById('print-page-breaks');
        const optimizeImagesCheck = document.getElementById('print-optimize-images');

        if (fontSizeSelect) this.settings.fontSize = fontSizeSelect.value;
        if (lineHeightSelect) this.settings.lineHeight = lineHeightSelect.value;
        if (marginsSelect) this.settings.margins = marginsSelect.value;
        if (blackWhiteCheck) this.settings.blackAndWhite = blackWhiteCheck.checked;
        if (pageBreaksCheck) this.settings.addPageBreaks = pageBreaksCheck.checked;
        if (optimizeImagesCheck) this.settings.optimizeImages = optimizeImagesCheck.checked;
    }

    /**
     * 更新预览
     */
    updatePreview() {
        const previewSample = document.querySelector('.print-preview-sample .sample-content');
        if (previewSample) {
            previewSample.style.fontSize = this.settings.fontSize;
            previewSample.style.lineHeight = this.settings.lineHeight;
            previewSample.style.color = this.settings.blackAndWhite ? '#000' : '#333';
        }
    }

    /**
     * 显示打印预览
     */
    showPreview() {
        this.updateSettings();
        if (this.onPreview) {
            this.onPreview(this.settings);
        }
    }

    /**
     * 应用设置并打印
     */
    applySettings() {
        this.updateSettings();
        this.hide();
        if (this.onApply) {
            this.onApply(this.settings);
        }
    }

    /**
     * 获取当前设置
     * @returns {Object} 当前设置
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * 设置回调函数
     * @param {Function} onApply 应用回调
     * @param {Function} onCancel 取消回调
     * @param {Function} onPreview 预览回调
     */
    setCallbacks(onApply, onCancel, onPreview) {
        this.onApply = onApply;
        this.onCancel = onCancel;
        this.onPreview = onPreview;
    }

    /**
     * 销毁组件
     */
    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }
}