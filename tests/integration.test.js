/**
 * 集成测试
 * 测试应用的完整工作流程
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../src/main.js';

describe('App Integration', () => {
    let app;

    beforeEach(() => {
        // Mock DOM
        global.document = {
            addEventListener: vi.fn(),
            getElementById: vi.fn(() => ({
                addEventListener: vi.fn(),
                disabled: false,
                textContent: '',
                innerHTML: '',
                style: {},
                classList: {
                    add: vi.fn(),
                    remove: vi.fn(),
                    toggle: vi.fn()
                }
            })),
            querySelector: vi.fn(() => null),
            querySelectorAll: vi.fn(() => []),
            createElement: vi.fn(() => ({
                innerHTML: '',
                textContent: '',
                style: {},
                classList: {
                    add: vi.fn(),
                    remove: vi.fn()
                },
                addEventListener: vi.fn(),
                appendChild: vi.fn(),
                removeChild: vi.fn()
            })),
            head: {
                appendChild: vi.fn(),
                removeChild: vi.fn()
            },
            body: {
                appendChild: vi.fn(),
                removeChild: vi.fn(),
                className: '',
                classList: {
                    add: vi.fn(),
                    remove: vi.fn()
                }
            },
            documentElement: {
                setAttribute: vi.fn(),
                removeAttribute: vi.fn(),
                style: {
                    setProperty: vi.fn()
                }
            }
        };

        // Mock window
        global.window = {
            matchMedia: vi.fn(() => ({
                matches: false,
                addEventListener: vi.fn(),
                addListener: vi.fn()
            })),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            pageYOffset: 0,
            scrollTo: vi.fn(),
            open: vi.fn(() => ({
                document: {
                    write: vi.fn(),
                    close: vi.fn()
                },
                focus: vi.fn(),
                print: vi.fn(),
                close: vi.fn(),
                onload: null
            })),
            print: vi.fn()
        };

        // Mock localStorage
        global.localStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn()
        };

        // Mock other globals
        global.URL = {
            createObjectURL: vi.fn(() => 'blob:mock-url'),
            revokeObjectURL: vi.fn()
        };

        global.Blob = vi.fn();
        global.FileReader = vi.fn(() => ({
            readAsText: vi.fn(),
            onload: null,
            onerror: null
        }));

        global.getComputedStyle = vi.fn(() => ({
            getPropertyValue: vi.fn(() => '#ffffff')
        }));

        global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));

        app = new App();
    });

    describe('应用初始化', () => {
        it('应该成功创建应用实例', () => {
            expect(app).toBeDefined();
            expect(app.converter).toBeDefined();
            expect(app.fileHandler).toBeDefined();
            expect(app.themeManager).toBeDefined();
            expect(app.printOptimizer).toBeDefined();
            expect(app.errorHandler).toBeDefined();
        });

        it('应该初始化所有组件', () => {
            const initSpy = vi.spyOn(app, 'initComponents');
            const setupSpy = vi.spyOn(app, 'setupEventListeners');
            
            app.init();
            
            expect(initSpy).toHaveBeenCalled();
            expect(setupSpy).toHaveBeenCalled();
        });
    });

    describe('内容处理流程', () => {
        it('应该处理 Markdown 内容更新', () => {
            const testMarkdown = '# 测试标题\n\n这是测试内容。';
            
            // Mock 必要的 DOM 元素
            app.previewPanel = {
                updateContent: vi.fn()
            };
            
            app.updatePreview(testMarkdown);
            
            expect(app.currentHtmlContent).toBeTruthy();
            expect(app.previewPanel.updateContent).toHaveBeenCalled();
        });

        it('应该处理无效内容', () => {
            app.previewPanel = {
                updateContent: vi.fn()
            };
            
            const showErrorSpy = vi.spyOn(app.errorHandler, 'showValidationErrors');
            
            // 测试空内容
            app.updatePreview('');
            
            expect(showErrorSpy).toHaveBeenCalled();
        });
    });

    describe('文件操作', () => {
        it('应该处理下载请求', () => {
            app.currentHtmlContent = '<h1>测试</h1>';
            app.inputPanel = {
                getContent: vi.fn(() => '# 测试')
            };
            
            const downloadSpy = vi.spyOn(app.fileHandler, 'downloadHTML').mockReturnValue({
                success: true,
                fileName: 'test.html',
                size: 1024
            });
            
            app.handleDownload();
            
            expect(downloadSpy).toHaveBeenCalled();
        });

        it('应该处理打印请求', () => {
            app.currentHtmlContent = '<h1>测试</h1>';
            app.inputPanel = {
                getContent: vi.fn(() => '# 测试')
            };
            
            const mockWindow = {
                document: {
                    write: vi.fn(),
                    close: vi.fn()
                },
                focus: vi.fn(),
                print: vi.fn(),
                close: vi.fn(),
                onload: null
            };
            
            global.window.open = vi.fn(() => mockWindow);
            
            app.handlePrint();
            
            expect(global.window.open).toHaveBeenCalled();
            expect(mockWindow.document.write).toHaveBeenCalled();
        });
    });

    describe('错误处理', () => {
        it('应该处理下载错误', () => {
            app.currentHtmlContent = '';
            
            const showErrorSpy = vi.spyOn(app.errorHandler, 'showError');
            
            app.handleDownload();
            
            expect(showErrorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: '下载失败',
                    type: 'warning'
                })
            );
        });

        it('应该处理打印错误', () => {
            app.currentHtmlContent = '';
            
            const showErrorSpy = vi.spyOn(app.errorHandler, 'showError');
            
            app.handlePrint();
            
            expect(showErrorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: '打印失败',
                    type: 'warning'
                })
            );
        });
    });

    describe('主题管理', () => {
        it('应该初始化主题管理器', () => {
            expect(app.themeManager).toBeDefined();
            expect(app.themeManager.getCurrentTheme()).toBeDefined();
        });

        it('应该创建主题切换组件', () => {
            // Mock 容器元素
            const mockContainer = {
                appendChild: vi.fn()
            };
            
            global.document.querySelector = vi.fn(() => mockContainer);
            
            app.initComponents();
            
            expect(app.themeToggle).toBeDefined();
        });
    });

    describe('演示内容', () => {
        it('应该加载演示内容', () => {
            app.inputPanel = {
                setContent: vi.fn()
            };
            
            const debounceSpy = vi.spyOn(app, 'debouncedUpdatePreview');
            
            app.loadDemoContent();
            
            expect(app.inputPanel.setContent).toHaveBeenCalled();
            expect(debounceSpy).toHaveBeenCalled();
        });
    });
});