/**
 * 主题切换组件
 * 提供主题切换按钮和界面
 */

export class ThemeToggle {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.button = null;
        this.removeListener = null;
    }

    /**
     * 创建主题切换按钮
     * @param {HTMLElement} container 容器元素
     * @returns {HTMLElement} 主题切换按钮
     */
    createToggleButton(container) {
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', '切换主题');
        
        this.button = button;
        this.updateButton();
        
        // 添加点击事件
        button.addEventListener('click', () => {
            this.handleToggle();
        });
        
        // 监听主题变化
        this.removeListener = this.themeManager.addListener((event, data) => {
            if (event === 'theme-change') {
                this.updateButton();
            }
        });
        
        if (container) {
            container.appendChild(button);
        }
        
        return button;
    }

    /**
     * 处理主题切换
     */
    handleToggle() {
        this.themeManager.toggleTheme();
        
        // 添加视觉反馈
        if (this.button) {
            this.button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.button.style.transform = '';
            }, 150);
        }
    }

    /**
     * 更新按钮显示
     */
    updateButton() {
        if (!this.button) return;
        
        const themeInfo = this.themeManager.getThemeInfo();
        
        // 更新图标
        this.button.innerHTML = `
            <span class="theme-icon">${themeInfo.icon}</span>
        `;
        
        // 更新提示文本
        this.button.title = `当前: ${themeInfo.name}，点击切换`;
        
        // 更新 aria-label
        this.button.setAttribute('aria-label', `切换主题 (当前: ${themeInfo.name})`);
    }
}