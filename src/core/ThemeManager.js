/**
 * 主题管理器
 * 负责主题切换、系统主题检测和本地存储
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = 'auto';
        this.systemTheme = 'light';
        this.storageKey = 'md2page-theme';
        this.listeners = [];
        
        this.init();
    }

    /**
     * 初始化主题管理器
     */
    init() {
        // 检测系统主题
        this.detectSystemTheme();
        
        // 从本地存储加载主题偏好
        this.loadThemeFromStorage();
        
        // 应用主题
        this.applyTheme();
        
        // 监听系统主题变化
        this.setupSystemThemeListener();
    }

    /**
     * 检测系统主题
     */
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.systemTheme = 'dark';
        } else {
            this.systemTheme = 'light';
        }
    }

    /**
     * 设置系统主题变化监听器
     */
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // 现代浏览器使用 addEventListener
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', (e) => {
                    this.systemTheme = e.matches ? 'dark' : 'light';
                    this.notifyListeners('system-theme-change', this.systemTheme);
                    
                    // 如果当前是自动模式，重新应用主题
                    if (this.currentTheme === 'auto') {
                        this.applyTheme();
                    }
                });
            } 
            // 旧浏览器使用 addListener
            else if (mediaQuery.addListener) {
                mediaQuery.addListener((e) => {
                    this.systemTheme = e.matches ? 'dark' : 'light';
                    this.notifyListeners('system-theme-change', this.systemTheme);
                    
                    if (this.currentTheme === 'auto') {
                        this.applyTheme();
                    }
                });
            }
        }
    }

    /**
     * 从本地存储加载主题
     */
    loadThemeFromStorage() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
                this.currentTheme = savedTheme;
            }
        } catch (error) {
            console.warn('无法从本地存储加载主题设置:', error);
        }
    }

    /**
     * 保存主题到本地存储
     */
    saveThemeToStorage() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme);
        } catch (error) {
            console.warn('无法保存主题设置到本地存储:', error);
        }
    }

    /**
     * 获取当前主题
     * @returns {string} 当前主题 ('light', 'dark', 'auto')
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * 获取实际应用的主题
     * @returns {string} 实际主题 ('light' 或 'dark')
     */
    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemTheme;
        }
        return this.currentTheme;
    }

    /**
     * 设置主题
     * @param {string} theme 主题名称 ('light', 'dark', 'auto')
     */
    setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.warn(`不支持的主题: ${theme}`);
            return;
        }

        const previousTheme = this.currentTheme;
        const previousEffectiveTheme = this.getEffectiveTheme();
        
        this.currentTheme = theme;
        
        // 应用主题
        this.applyTheme();
        
        // 保存到本地存储
        this.saveThemeToStorage();
        
        // 通知监听器
        this.notifyListeners('theme-change', {
            theme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme(),
            previousTheme: previousTheme,
            previousEffectiveTheme: previousEffectiveTheme
        });
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    /**
     * 应用主题到 DOM
     */
    applyTheme() {
        const effectiveTheme = this.getEffectiveTheme();
        const root = document.documentElement;
        
        // 移除所有主题类
        root.removeAttribute('data-theme');
        
        // 应用新主题
        if (effectiveTheme !== 'light') {
            root.setAttribute('data-theme', effectiveTheme);
        }
        
        // 更新 body 类名（用于兼容性）
        document.body.className = document.body.className
            .replace(/theme-\w+/g, '')
            .trim();
        document.body.classList.add(`theme-${effectiveTheme}`);
    }

    /**
     * 获取主题图标
     * @param {string} theme 主题名称
     * @returns {string} 主题图标
     */
    getThemeIcon(theme = this.currentTheme) {
        const icons = {
            'light': '☀️',
            'dark': '🌙',
            'auto': '🔄'
        };
        return icons[theme] || '🔄';
    }

    /**
     * 获取主题名称
     * @param {string} theme 主题名称
     * @returns {string} 主题显示名称
     */
    getThemeName(theme = this.currentTheme) {
        const names = {
            'light': '亮色主题',
            'dark': '暗色主题',
            'auto': '跟随系统'
        };
        return names[theme] || '未知主题';
    }

    /**
     * 添加主题变化监听器
     * @param {Function} callback 回调函数
     * @returns {Function} 移除监听器的函数
     */
    addListener(callback) {
        if (typeof callback !== 'function') {
            console.warn('主题监听器必须是函数');
            return () => {};
        }

        this.listeners.push(callback);
        
        // 返回移除监听器的函数
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * 通知所有监听器
     * @param {string} event 事件类型
     * @param {any} data 事件数据
     */
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('主题监听器执行错误:', error);
            }
        });
    }

    /**
     * 获取主题 CSS 变量值
     * @param {string} variableName CSS 变量名（不包含 --）
     * @returns {string} CSS 变量值
     */
    getCSSVariable(variableName) {
        const root = document.documentElement;
        return getComputedStyle(root).getPropertyValue(`--${variableName}`).trim();
    }

    /**
     * 设置主题 CSS 变量
     * @param {string} variableName CSS 变量名（不包含 --）
     * @param {string} value CSS 变量值
     */
    setCSSVariable(variableName, value) {
        const root = document.documentElement;
        root.style.setProperty(`--${variableName}`, value);
    }

    /**
     * 检查是否支持系统主题检测
     * @returns {boolean} 是否支持
     */
    supportsSystemTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all';
    }

    /**
     * 检查是否支持本地存储
     * @returns {boolean} 是否支持
     */
    supportsLocalStorage() {
        try {
            const test = '__theme_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取主题信息
     * @returns {Object} 主题信息对象
     */
    getThemeInfo() {
        return {
            currentTheme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme(),
            systemTheme: this.systemTheme,
            supportsSystemTheme: this.supportsSystemTheme(),
            supportsLocalStorage: this.supportsLocalStorage(),
            icon: this.getThemeIcon(),
            name: this.getThemeName()
        };
    }

    /**
     * 重置主题设置
     */
    reset() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('无法清除主题设置:', error);
        }
        
        this.currentTheme = 'auto';
        this.applyTheme();
        
        this.notifyListeners('theme-reset', this.getThemeInfo());
    }

    /**
     * 销毁主题管理器
     */
    destroy() {
        this.listeners = [];
        // 注意：无法移除 matchMedia 监听器，因为我们没有保存引用
        // 这在实际应用中通常不是问题，因为 ThemeManager 通常是单例
    }
}