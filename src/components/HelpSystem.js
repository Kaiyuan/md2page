/**
 * 帮助系统
 * 提供使用说明、快捷键提示和功能介绍
 */
export class HelpSystem {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentTab = 'guide';
        
        this.init();
    }

    /**
     * 初始化帮助系统
     */
    init() {
        this.createContainer();
        this.setupEventListeners();
    }

    /**
     * 创建帮助容器
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'help-system hidden';
        this.container.innerHTML = `
            <div class="help-overlay"></div>
            <div class="help-modal">
                <div class="help-header">
                    <h2 class="help-title">使用帮助</h2>
                    <button class="help-close" aria-label="关闭帮助">×</button>
                </div>
                
                <div class="help-tabs">
                    <button class="help-tab active" data-tab="guide">使用指南</button>
                    <button class="help-tab" data-tab="shortcuts">快捷键</button>
                    <button class="help-tab" data-tab="markdown">Markdown 语法</button>
                    <button class="help-tab" data-tab="about">关于</button>
                </div>
                
                <div class="help-content">
                    <div class="help-panel active" data-panel="guide">
                        ${this.getGuideContent()}
                    </div>
                    
                    <div class="help-panel" data-panel="shortcuts">
                        ${this.getShortcutsContent()}
                    </div>
                    
                    <div class="help-panel" data-panel="markdown">
                        ${this.getMarkdownContent()}
                    </div>
                    
                    <div class="help-panel" data-panel="about">
                        ${this.getAboutContent()}
                    </div>
                </div>
                
                <div class="help-footer">
                    <button class="help-action" id="help-demo">查看演示</button>
                    <button class="help-action secondary" id="help-reset">重置设置</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
    }

    /**
     * 获取使用指南内容
     */
    getGuideContent() {
        return `
            <div class="guide-section">
                <h3>🚀 快速开始</h3>
                <ol class="guide-steps">
                    <li>在左侧编辑器中输入 Markdown 文本</li>
                    <li>右侧预览区域会实时显示转换结果</li>
                    <li>使用工具栏按钮进行文件操作和设置</li>
                    <li>点击下载按钮保存 HTML 文件</li>
                </ol>
            </div>
            
            <div class="guide-section">
                <h3>📁 文件操作</h3>
                <div class="feature-grid">
                    <div class="feature-item">
                        <div class="feature-icon">📤</div>
                        <div class="feature-text">
                            <strong>上传文件</strong>
                            <p>支持拖拽或点击上传 .md 文件</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">💾</div>
                        <div class="feature-text">
                            <strong>下载 HTML</strong>
                            <p>生成自包含的 HTML 文件</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🖨️</div>
                        <div class="feature-text">
                            <strong>打印优化</strong>
                            <p>专为打印优化的样式</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="guide-section">
                <h3>🎨 界面功能</h3>
                <div class="feature-grid">
                    <div class="feature-item">
                        <div class="feature-icon">🌓</div>
                        <div class="feature-text">
                            <strong>主题切换</strong>
                            <p>亮色/暗色/自动主题</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">📱</div>
                        <div class="feature-text">
                            <strong>响应式设计</strong>
                            <p>完美适配各种屏幕尺寸</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">⛶</div>
                        <div class="feature-text">
                            <strong>全屏模式</strong>
                            <p>专注的编辑和预览体验</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取快捷键内容
     */
    getShortcutsContent() {
        return `
            <div class="shortcuts-section">
                <h3>⌨️ 编辑快捷键</h3>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>S</kbd>
                        <span>下载 HTML 文件</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>O</kbd>
                        <span>打开文件</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>P</kbd>
                        <span>打印预览</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>F11</kbd>
                        <span>全屏模式</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>/</kbd>
                        <span>显示/隐藏帮助</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd>
                        <span>切换主题</span>
                    </div>
                </div>
            </div>
            
            <div class="shortcuts-section">
                <h3>📝 Markdown 快捷键</h3>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>B</kbd>
                        <span>粗体文本</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>I</kbd>
                        <span>斜体文本</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>K</kbd>
                        <span>插入链接</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd>
                        <span>代码块</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Tab</kbd>
                        <span>增加缩进</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Shift</kbd> + <kbd>Tab</kbd>
                        <span>减少缩进</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取 Markdown 语法内容
     */
    getMarkdownContent() {
        return `
            <div class="markdown-section">
                <h3>📖 基础语法</h3>
                <div class="syntax-examples">
                    <div class="syntax-item">
                        <div class="syntax-title">标题</div>
                        <div class="syntax-code"># 一级标题<br>## 二级标题<br>### 三级标题</div>
                    </div>
                    
                    <div class="syntax-item">
                        <div class="syntax-title">文本样式</div>
                        <div class="syntax-code">**粗体文本**<br>*斜体文本*<br>~~删除线~~<br>\`行内代码\`</div>
                    </div>
                    
                    <div class="syntax-item">
                        <div class="syntax-title">列表</div>
                        <div class="syntax-code">- 无序列表项<br>1. 有序列表项<br>- [ ] 任务列表</div>
                    </div>
                    
                    <div class="syntax-item">
                        <div class="syntax-title">链接和图片</div>
                        <div class="syntax-code">[链接文本](URL)<br>![图片描述](图片URL)</div>
                    </div>
                    
                    <div class="syntax-item">
                        <div class="syntax-title">代码块</div>
                        <div class="syntax-code">\`\`\`javascript<br>console.log('Hello');<br>\`\`\`</div>
                    </div>
                    
                    <div class="syntax-item">
                        <div class="syntax-title">引用</div>
                        <div class="syntax-code">> 这是一个引用<br>> 可以多行</div>
                    </div>
                    
                    <div class="syntax-item">
                        <div class="syntax-title">表格</div>
                        <div class="syntax-code">| 列1 | 列2 |<br>|-----|-----|<br>| 内容 | 内容 |</div>
                    </div>
                    
                    <div class="syntax-item">
                        <div class="syntax-title">分割线</div>
                        <div class="syntax-code">---<br>或<br>***</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取关于内容
     */
    getAboutContent() {
        return `
            <div class="about-section">
                <div class="app-info">
                    <h3>📝 Markdown to HTML 转换器</h3>
                    <p class="app-description">
                        一个功能强大的在线 Markdown 编辑器和 HTML 转换工具，
                        支持实时预览、文件上传下载、主题切换等功能。
                    </p>
                </div>
                
                <div class="features-list">
                    <h4>✨ 主要特性</h4>
                    <ul>
                        <li>🔄 实时 Markdown 预览</li>
                        <li>🎨 代码语法高亮</li>
                        <li>📱 响应式设计</li>
                        <li>🌓 多主题支持</li>
                        <li>📁 文件上传下载</li>
                        <li>🖨️ 打印优化</li>
                        <li>⌨️ 快捷键支持</li>
                        <li>📊 实时统计信息</li>
                    </ul>
                </div>
                
                <div class="tech-info">
                    <h4>🛠️ 技术栈</h4>
                    <div class="tech-tags">
                        <span class="tech-tag">HTML5</span>
                        <span class="tech-tag">CSS3</span>
                        <span class="tech-tag">JavaScript</span>
                        <span class="tech-tag">Marked.js</span>
                        <span class="tech-tag">Prism.js</span>
                    </div>
                </div>
                
                <div class="version-info">
                    <p><strong>版本:</strong> 1.0.0</p>
                    <p><strong>更新时间:</strong> 2024年10月</p>
                </div>
            </div>
        `;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 关闭按钮
        const closeBtn = this.container.querySelector('.help-close');
        closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // 覆盖层点击关闭
        const overlay = this.container.querySelector('.help-overlay');
        overlay.addEventListener('click', () => {
            this.hide();
        });

        // 标签切换
        const tabs = this.container.querySelectorAll('.help-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // 操作按钮
        const demoBtn = this.container.querySelector('#help-demo');
        demoBtn.addEventListener('click', () => {
            this.showDemo();
        });

        const resetBtn = this.container.querySelector('#help-reset');
        resetBtn.addEventListener('click', () => {
            this.resetSettings();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.toggle();
            }
            
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * 切换标签
     * @param {string} tabId 标签ID
     */
    switchTab(tabId) {
        // 更新标签状态
        const tabs = this.container.querySelectorAll('.help-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // 更新面板状态
        const panels = this.container.querySelectorAll('.help-panel');
        panels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabId);
        });

        this.currentTab = tabId;
    }

    /**
     * 显示帮助
     */
    show() {
        this.container.classList.remove('hidden');
        this.isVisible = true;
        
        // 聚焦到模态框
        const modal = this.container.querySelector('.help-modal');
        modal.focus();
        
        // 触发显示事件
        const event = new CustomEvent('helpShow');
        document.dispatchEvent(event);
    }

    /**
     * 隐藏帮助
     */
    hide() {
        this.container.classList.add('hidden');
        this.isVisible = false;
        
        // 触发隐藏事件
        const event = new CustomEvent('helpHide');
        document.dispatchEvent(event);
    }

    /**
     * 切换显示/隐藏
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 显示演示
     */
    showDemo() {
        this.hide();
        
        // 触发演示事件
        const event = new CustomEvent('showDemo');
        document.dispatchEvent(event);
    }

    /**
     * 重置设置
     */
    resetSettings() {
        if (confirm('确定要重置所有设置吗？这将清除您的偏好设置。')) {
            // 清除本地存储
            localStorage.removeItem('markdown-converter-theme');
            localStorage.removeItem('markdown-converter-settings');
            
            // 触发重置事件
            const event = new CustomEvent('resetSettings');
            document.dispatchEvent(event);
            
            // 显示成功消息
            if (window.app && window.app.errorHandler) {
                window.app.errorHandler.showSuccess('设置已重置，页面将刷新');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        }
    }

    /**
     * 获取当前标签
     * @returns {string} 当前标签ID
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * 检查是否可见
     * @returns {boolean} 是否可见
     */
    isShown() {
        return this.isVisible;
    }

    /**
     * 销毁帮助系统
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // 移除事件监听器
        document.removeEventListener('keydown', this.handleKeydown);
    }
}