/**
 * ThemeManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeManager } from '../src/core/ThemeManager.js';

describe('ThemeManager', () => {
    let themeManager;
    let mockLocalStorage;
    let mockMatchMedia;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn()
        };
        global.localStorage = mockLocalStorage;

        // Mock matchMedia
        mockMatchMedia = vi.fn(() => ({
            matches: false,
            media: '(prefers-color-scheme: dark)',
            addEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn()
        }));
        global.window = { matchMedia: mockMatchMedia };

        // Mock document
        global.document = {
            documentElement: {
                setAttribute: vi.fn(),
                removeAttribute: vi.fn(),
                style: {
                    setProperty: vi.fn()
                }
            },
            body: {
                className: '',
                classList: {
                    add: vi.fn(),
                    remove: vi.fn()
                }
            }
        };

        // Mock getComputedStyle
        global.getComputedStyle = vi.fn(() => ({
            getPropertyValue: vi.fn(() => '#ffffff')
        }));

        themeManager = new ThemeManager();
    });

    afterEach(() => {
        if (themeManager) {
            themeManager.destroy();
        }
    });

    describe('constructor', () => {
        it('应该初始化默认属性', () => {
            expect(themeManager.currentTheme).toBe('auto');
            expect(themeManager.systemTheme).toBe('light');
            expect(themeManager.storageKey).toBe('md2page-theme');
            expect(themeManager.listeners).toEqual([]);
        });
    });

    describe('detectSystemTheme', () => {
        it('应该检测亮色系统主题', () => {
            mockMatchMedia.mockReturnValue({ matches: false });
            
            themeManager.detectSystemTheme();
            
            expect(themeManager.systemTheme).toBe('light');
        });

        it('应该检测暗色系统主题', () => {
            mockMatchMedia.mockReturnValue({ matches: true });
            
            themeManager.detectSystemTheme();
            
            expect(themeManager.systemTheme).toBe('dark');
        });

        it('应该处理不支持 matchMedia 的情况', () => {
            global.window.matchMedia = undefined;
            
            themeManager.detectSystemTheme();
            
            expect(themeManager.systemTheme).toBe('light');
        });
    });

    describe('loadThemeFromStorage', () => {
        it('应该从本地存储加载有效主题', () => {
            mockLocalStorage.getItem.mockReturnValue('dark');
            
            themeManager.loadThemeFromStorage();
            
            expect(themeManager.currentTheme).toBe('dark');
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('md2page-theme');
        });

        it('应该忽略无效主题', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid');
            
            themeManager.loadThemeFromStorage();
            
            expect(themeManager.currentTheme).toBe('auto');
        });

        it('应该处理本地存储错误', () => {
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            themeManager.loadThemeFromStorage();
            
            expect(consoleSpy).toHaveBeenCalled();
            expect(themeManager.currentTheme).toBe('auto');
            
            consoleSpy.mockRestore();
        });
    });

    describe('saveThemeToStorage', () => {
        it('应该保存主题到本地存储', () => {
            themeManager.currentTheme = 'dark';
            
            themeManager.saveThemeToStorage();
            
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('md2page-theme', 'dark');
        });

        it('应该处理保存错误', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            themeManager.saveThemeToStorage();
            
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('getCurrentTheme', () => {
        it('应该返回当前主题', () => {
            themeManager.currentTheme = 'dark';
            
            expect(themeManager.getCurrentTheme()).toBe('dark');
        });
    });

    describe('getEffectiveTheme', () => {
        it('应该返回系统主题当设置为 auto', () => {
            themeManager.currentTheme = 'auto';
            themeManager.systemTheme = 'dark';
            
            expect(themeManager.getEffectiveTheme()).toBe('dark');
        });

        it('应该返回设置的主题当不是 auto', () => {
            themeManager.currentTheme = 'light';
            themeManager.systemTheme = 'dark';
            
            expect(themeManager.getEffectiveTheme()).toBe('light');
        });
    });

    describe('setTheme', () => {
        it('应该设置有效主题', () => {
            const applySpy = vi.spyOn(themeManager, 'applyTheme');
            const saveSpy = vi.spyOn(themeManager, 'saveThemeToStorage');
            
            themeManager.setTheme('dark');
            
            expect(themeManager.currentTheme).toBe('dark');
            expect(applySpy).toHaveBeenCalled();
            expect(saveSpy).toHaveBeenCalled();
        });

        it('应该拒绝无效主题', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            themeManager.setTheme('invalid');
            
            expect(consoleSpy).toHaveBeenCalledWith('不支持的主题: invalid');
            expect(themeManager.currentTheme).toBe('auto');
            
            consoleSpy.mockRestore();
        });

        it('应该通知监听器', () => {
            const listener = vi.fn();
            themeManager.addListener(listener);
            
            themeManager.setTheme('dark');
            
            expect(listener).toHaveBeenCalledWith('theme-change', expect.objectContaining({
                theme: 'dark',
                effectiveTheme: 'dark'
            }));
        });
    });

    describe('toggleTheme', () => {
        it('应该循环切换主题', () => {
            const setSpy = vi.spyOn(themeManager, 'setTheme');
            
            // auto -> light
            themeManager.currentTheme = 'auto';
            themeManager.toggleTheme();
            expect(setSpy).toHaveBeenCalledWith('light');
            
            // light -> dark
            themeManager.currentTheme = 'light';
            themeManager.toggleTheme();
            expect(setSpy).toHaveBeenCalledWith('dark');
            
            // dark -> auto
            themeManager.currentTheme = 'dark';
            themeManager.toggleTheme();
            expect(setSpy).toHaveBeenCalledWith('auto');
        });
    });

    describe('applyTheme', () => {
        it('应该应用亮色主题', () => {
            themeManager.currentTheme = 'light';
            
            themeManager.applyTheme();
            
            expect(document.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
            expect(document.body.classList.add).toHaveBeenCalledWith('theme-light');
        });

        it('应该应用暗色主题', () => {
            themeManager.currentTheme = 'dark';
            
            themeManager.applyTheme();
            
            expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
            expect(document.body.classList.add).toHaveBeenCalledWith('theme-dark');
        });
    });

    describe('getThemeIcon', () => {
        it('应该返回正确的主题图标', () => {
            expect(themeManager.getThemeIcon('light')).toBe('☀️');
            expect(themeManager.getThemeIcon('dark')).toBe('🌙');
            expect(themeManager.getThemeIcon('auto')).toBe('🔄');
            expect(themeManager.getThemeIcon('invalid')).toBe('🔄');
        });
    });

    describe('getThemeName', () => {
        it('应该返回正确的主题名称', () => {
            expect(themeManager.getThemeName('light')).toBe('亮色主题');
            expect(themeManager.getThemeName('dark')).toBe('暗色主题');
            expect(themeManager.getThemeName('auto')).toBe('跟随系统');
            expect(themeManager.getThemeName('invalid')).toBe('未知主题');
        });
    });

    describe('addListener', () => {
        it('应该添加监听器', () => {
            const callback = vi.fn();
            
            const removeListener = themeManager.addListener(callback);
            
            expect(themeManager.listeners).toContain(callback);
            expect(typeof removeListener).toBe('function');
        });

        it('应该返回移除监听器的函数', () => {
            const callback = vi.fn();
            
            const removeListener = themeManager.addListener(callback);
            removeListener();
            
            expect(themeManager.listeners).not.toContain(callback);
        });

        it('应该处理非函数监听器', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const removeListener = themeManager.addListener('not a function');
            
            expect(consoleSpy).toHaveBeenCalledWith('主题监听器必须是函数');
            expect(typeof removeListener).toBe('function');
            
            consoleSpy.mockRestore();
        });
    });

    describe('getCSSVariable', () => {
        it('应该获取 CSS 变量值', () => {
            const mockGetPropertyValue = vi.fn(() => '  #ffffff  ');
            global.getComputedStyle = vi.fn(() => ({
                getPropertyValue: mockGetPropertyValue
            }));
            
            const result = themeManager.getCSSVariable('primary-color');
            
            expect(mockGetPropertyValue).toHaveBeenCalledWith('--primary-color');
            expect(result).toBe('#ffffff');
        });
    });

    describe('setCSSVariable', () => {
        it('应该设置 CSS 变量值', () => {
            themeManager.setCSSVariable('primary-color', '#ff0000');
            
            expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--primary-color', '#ff0000');
        });
    });

    describe('supportsSystemTheme', () => {
        it('应该检测系统主题支持', () => {
            mockMatchMedia.mockReturnValue({ media: '(prefers-color-scheme: dark)' });
            
            expect(themeManager.supportsSystemTheme()).toBe(true);
        });

        it('应该检测不支持系统主题', () => {
            mockMatchMedia.mockReturnValue({ media: 'not all' });
            
            expect(themeManager.supportsSystemTheme()).toBe(false);
        });

        it('应该处理没有 matchMedia 的情况', () => {
            global.window.matchMedia = undefined;
            
            expect(themeManager.supportsSystemTheme()).toBe(false);
        });
    });

    describe('supportsLocalStorage', () => {
        it('应该检测本地存储支持', () => {
            expect(themeManager.supportsLocalStorage()).toBe(true);
        });

        it('应该检测不支持本地存储', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage not supported');
            });
            
            expect(themeManager.supportsLocalStorage()).toBe(false);
        });
    });

    describe('reset', () => {
        it('应该重置主题设置', () => {
            themeManager.currentTheme = 'dark';
            const applySpy = vi.spyOn(themeManager, 'applyTheme');
            const listener = vi.fn();
            themeManager.addListener(listener);
            
            themeManager.reset();
            
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('md2page-theme');
            expect(themeManager.currentTheme).toBe('auto');
            expect(applySpy).toHaveBeenCalled();
            expect(listener).toHaveBeenCalledWith('theme-reset', expect.any(Object));
        });
    });
});