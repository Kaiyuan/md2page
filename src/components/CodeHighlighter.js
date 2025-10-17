/**
 * 代码高亮管理器
 * 负责集成和管理 Prism.js 代码语法高亮功能
 */
export class CodeHighlighter {
    constructor() {
        this.isInitialized = false;
        this.supportedLanguages = new Set();
        this.currentTheme = 'default';
        this.themes = {
            'default': 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css',
            'dark': 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-dark.min.css',
            'tomorrow': 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css',
            'twilight': 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-twilight.min.css'
        };
        
        this.init();
    }

    /**
     * 初始化代码高亮器
     */
    init() {
        this.checkPrismAvailability();
        this.setupAutoloader();
        this.loadCommonLanguages();
        this.isInitialized = true;
    }

    /**
     * 检查 Prism.js 是否可用
     */
    checkPrismAvailability() {
        if (typeof Prism === 'undefined') {
            console.warn('Prism.js 未加载，代码高亮功能将不可用');
            return false;
        }
        return true;
    }

    /**
     * 设置自动加载器
     */
    setupAutoloader() {
        if (typeof Prism !== 'undefined' && Prism.plugins && Prism.plugins.autoloader) {
            // 配置自动加载器路径
            Prism.plugins.autoloader.languages_path = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/';
        }
    }

    /**
     * 加载常用编程语言
     */
    loadCommonLanguages() {
        const commonLanguages = [
            'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
            'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
            'html', 'css', 'scss', 'sass', 'less',
            'json', 'xml', 'yaml', 'toml', 'ini',
            'sql', 'mongodb', 'redis',
            'bash', 'powershell', 'batch', 'shell',
            'markdown', 'latex', 'dockerfile', 'nginx',
            'git', 'diff', 'log'
        ];

        commonLanguages.forEach(lang => {
            this.supportedLanguages.add(lang);
        });
    }

    /**
     * 高亮代码块
     * @param {Element} container 包含代码块的容器
     */
    highlightCodeBlocks(container) {
        if (!this.isInitialized || typeof Prism === 'undefined') {
            return;
        }

        const codeBlocks = container.querySelectorAll('pre code');
        
        codeBlocks.forEach(codeBlock => {
            this.highlightCodeBlock(codeBlock);
        });
    }

    /**
     * 高亮单个代码块
     * @param {Element} codeBlock 代码块元素
     */
    highlightCodeBlock(codeBlock) {
        if (!codeBlock || typeof Prism === 'undefined') {
            return;
        }

        // 检测语言
        const language = this.detectLanguage(codeBlock);
        
        if (language) {
            // 添加语言类名
            codeBlock.className = `language-${language}`;
            
            // 应用高亮
            try {
                Prism.highlightElement(codeBlock);
                
                // 添加语言标签
                this.addLanguageLabel(codeBlock, language);
                
                // 添加复制按钮
                this.addCopyButton(codeBlock);
                
                // 添加行号（如果需要）
                this.addLineNumbers(codeBlock);
                
            } catch (error) {
                console.warn(`代码高亮失败 (${language}):`, error);
            }
        }
    }

    /**
     * 检测代码语言
     * @param {Element} codeBlock 代码块元素
     * @returns {string|null} 检测到的语言
     */
    detectLanguage(codeBlock) {
        // 1. 从类名中检测
        const className = codeBlock.className;
        const langMatch = className.match(/language-(\w+)/);
        if (langMatch) {
            return langMatch[1];
        }

        // 2. 从父元素的 data 属性检测
        const pre = codeBlock.parentElement;
        if (pre && pre.dataset.language) {
            return pre.dataset.language;
        }

        // 3. 从代码内容自动检测
        const code = codeBlock.textContent;
        return this.autoDetectLanguage(code);
    }

    /**
     * 自动检测代码语言
     * @param {string} code 代码内容
     * @returns {string|null} 检测到的语言
     */
    autoDetectLanguage(code) {
        if (!code || code.trim().length === 0) {
            return null;
        }

        const patterns = {
            'javascript': [
                /\b(function|const|let|var|=>|console\.log)\b/,
                /\b(import|export|require)\b/,
                /\b(async|await|Promise)\b/
            ],
            'typescript': [
                /\b(interface|type|enum)\b/,
                /:\s*(string|number|boolean|any)\b/,
                /\bimport.*from\b/
            ],
            'python': [
                /\b(def|class|import|from|if __name__)\b/,
                /\b(print|len|range|enumerate)\b/,
                /^\s*#.*$/m
            ],
            'java': [
                /\b(public|private|protected|class|interface)\b/,
                /\b(String|int|boolean|void)\b/,
                /System\.out\.println/
            ],
            'csharp': [
                /\b(using|namespace|class|public|private)\b/,
                /\b(string|int|bool|void)\b/,
                /Console\.WriteLine/
            ],
            'html': [
                /<\/?[a-z][\s\S]*>/i,
                /<!DOCTYPE/i,
                /<html|<head|<body/i
            ],
            'css': [
                /\{[^}]*\}/,
                /[.#][\w-]+\s*\{/,
                /@media|@import|@keyframes/
            ],
            'json': [
                /^\s*[\{\[]/,
                /:\s*[\"\'\d\{\[]/,
                /^\s*[\}\]]\s*$/m
            ],
            'sql': [
                /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b/i,
                /\b(CREATE|ALTER|DROP|TABLE)\b/i,
                /\b(JOIN|INNER|LEFT|RIGHT)\b/i
            ],
            'bash': [
                /^#!/,
                /\$\w+/,
                /\b(echo|cd|ls|grep|awk|sed)\b/
            ]
        };

        for (const [language, regexes] of Object.entries(patterns)) {
            if (regexes.some(regex => regex.test(code))) {
                return language;
            }
        }

        return null;
    }

    /**
     * 添加语言标签
     * @param {Element} codeBlock 代码块元素
     * @param {string} language 语言名称
     */
    addLanguageLabel(codeBlock, language) {
        const pre = codeBlock.parentElement;
        if (!pre || pre.querySelector('.code-language-label')) {
            return;
        }

        const label = document.createElement('span');
        label.className = 'code-language-label';
        label.textContent = this.getLanguageDisplayName(language);
        
        // 设置样式
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
            z-index: 1;
        `;

        pre.style.position = 'relative';
        pre.appendChild(label);
    }

    /**
     * 添加复制按钮
     * @param {Element} codeBlock 代码块元素
     */
    addCopyButton(codeBlock) {
        const pre = codeBlock.parentElement;
        if (!pre || pre.querySelector('.code-copy-button')) {
            return;
        }

        const button = document.createElement('button');
        button.className = 'code-copy-button';
        button.textContent = '复制';
        button.setAttribute('aria-label', '复制代码');
        
        // 设置样式
        button.style.cssText = `
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
            z-index: 1;
        `;

        // 点击事件
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                button.textContent = '已复制';
                button.style.background = 'var(--success-color)';
                button.style.color = 'white';
                
                setTimeout(() => {
                    button.textContent = '复制';
                    button.style.background = 'var(--button-bg)';
                    button.style.color = '';
                }, 2000);
            } catch (error) {
                console.warn('复制失败:', error);
                button.textContent = '复制失败';
                setTimeout(() => {
                    button.textContent = '复制';
                }, 2000);
            }
        });

        // 鼠标悬停效果
        pre.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });
        
        pre.addEventListener('mouseleave', () => {
            button.style.opacity = '0.7';
        });

        pre.appendChild(button);
    }

    /**
     * 添加行号
     * @param {Element} codeBlock 代码块元素
     */
    addLineNumbers(codeBlock) {
        const pre = codeBlock.parentElement;
        if (!pre || pre.classList.contains('line-numbers')) {
            return;
        }

        // 检查是否需要行号（代码行数超过5行）
        const lines = codeBlock.textContent.split('\n');
        if (lines.length <= 5) {
            return;
        }

        pre.classList.add('line-numbers');
        
        // 如果 Prism 的行号插件可用，使用它
        if (typeof Prism !== 'undefined' && Prism.plugins && Prism.plugins.lineNumbers) {
            Prism.plugins.lineNumbers.resize(pre);
        }
    }

    /**
     * 获取语言显示名称
     * @param {string} language 语言代码
     * @returns {string} 显示名称
     */
    getLanguageDisplayName(language) {
        const displayNames = {
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'python': 'Python',
            'java': 'Java',
            'csharp': 'C#',
            'cpp': 'C++',
            'c': 'C',
            'php': 'PHP',
            'ruby': 'Ruby',
            'go': 'Go',
            'rust': 'Rust',
            'swift': 'Swift',
            'kotlin': 'Kotlin',
            'scala': 'Scala',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'sass': 'Sass',
            'less': 'Less',
            'json': 'JSON',
            'xml': 'XML',
            'yaml': 'YAML',
            'toml': 'TOML',
            'ini': 'INI',
            'sql': 'SQL',
            'mongodb': 'MongoDB',
            'redis': 'Redis',
            'bash': 'Bash',
            'powershell': 'PowerShell',
            'batch': 'Batch',
            'shell': 'Shell',
            'markdown': 'Markdown',
            'latex': 'LaTeX',
            'dockerfile': 'Dockerfile',
            'nginx': 'Nginx',
            'git': 'Git',
            'diff': 'Diff',
            'log': 'Log'
        };

        return displayNames[language] || language.toUpperCase();
    }

    /**
     * 切换主题
     * @param {string} theme 主题名称
     */
    switchTheme(theme) {
        if (!this.themes[theme]) {
            console.warn(`不支持的代码高亮主题: ${theme}`);
            return;
        }

        // 移除旧的主题样式
        const oldLink = document.querySelector('link[data-prism-theme]');
        if (oldLink) {
            oldLink.remove();
        }

        // 添加新的主题样式
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.themes[theme];
        link.setAttribute('data-prism-theme', theme);
        document.head.appendChild(link);

        this.currentTheme = theme;
    }

    /**
     * 根据应用主题自动切换代码高亮主题
     * @param {string} appTheme 应用主题 ('light' 或 'dark')
     */
    syncWithAppTheme(appTheme) {
        const themeMapping = {
            'light': 'default',
            'dark': 'dark'
        };

        const codeTheme = themeMapping[appTheme] || 'default';
        this.switchTheme(codeTheme);
    }

    /**
     * 获取支持的语言列表
     * @returns {Array} 支持的语言数组
     */
    getSupportedLanguages() {
        return Array.from(this.supportedLanguages).sort();
    }

    /**
     * 重新高亮所有代码块
     * @param {Element} container 容器元素
     */
    rehighlightAll(container = document) {
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(container);
        }
    }

    /**
     * 销毁代码高亮器
     */
    destroy() {
        // 移除主题样式
        const themeLink = document.querySelector('link[data-prism-theme]');
        if (themeLink) {
            themeLink.remove();
        }
    }
}