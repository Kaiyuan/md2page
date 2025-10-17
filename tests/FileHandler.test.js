/**
 * FileHandler 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileHandler } from '../src/core/FileHandler.js';

describe('FileHandler', () => {
    let fileHandler;

    beforeEach(() => {
        fileHandler = new FileHandler();
        
        // Mock DOM methods
        global.document = {
            createElement: vi.fn(() => ({
                href: '',
                download: '',
                style: { display: '' },
                click: vi.fn(),
                textContent: ''
            })),
            body: {
                appendChild: vi.fn(),
                removeChild: vi.fn()
            }
        };

        global.URL = {
            createObjectURL: vi.fn(() => 'blob:mock-url'),
            revokeObjectURL: vi.fn()
        };

        global.Blob = vi.fn();
    });

    describe('generateFilename', () => {
        it('应该从 HTML title 标签提取文件名', () => {
            const html = '<html><head><title>测试文档</title></head><body></body></html>';
            const result = fileHandler.generateFilename(html);
            
            expect(result).toBe('测试文档');
        });

        it('应该从 H1 标签提取文件名', () => {
            const html = '<h1>主要标题</h1><p>内容</p>';
            const result = fileHandler.generateFilename(html);
            
            expect(result).toBe('主要标题');
        });

        it('应该从 Markdown H1 提取文件名', () => {
            const markdown = '# Markdown 标题\n\n这是内容';
            const result = fileHandler.generateFilename(markdown);
            
            expect(result).toBe('Markdown-标题');
        });

        it('应该从 H2 标签提取文件名（如果没有 H1）', () => {
            const html = '<h2>二级标题</h2><p>内容</p>';
            const result = fileHandler.generateFilename(html);
            
            expect(result).toBe('二级标题');
        });

        it('应该处理空内容', () => {
            expect(fileHandler.generateFilename('')).toBe('markdown-document');
            expect(fileHandler.generateFilename(null)).toBe('markdown-document');
            expect(fileHandler.generateFilename(undefined)).toBe('markdown-document');
        });

        it('应该使用时间戳作为默认文件名', () => {
            const content = '没有标题的内容';
            const result = fileHandler.generateFilename(content);
            
            expect(result).toMatch(/^markdown-document-\d{8}$/);
        });
    });

    describe('sanitizeFilename', () => {
        it('应该移除不安全字符', () => {
            const unsafe = 'file<>:"/\\|?*name';
            const result = fileHandler.sanitizeFilename(unsafe);
            
            expect(result).toBe('filename');
        });

        it('应该替换空格为连字符', () => {
            const spaced = '文件 名称 测试';
            const result = fileHandler.sanitizeFilename(spaced);
            
            expect(result).toBe('文件-名称-测试');
        });

        it('应该移除 HTML 标签', () => {
            const withTags = '<strong>粗体</strong> 标题';
            const result = fileHandler.sanitizeFilename(withTags);
            
            expect(result).toBe('粗体-标题');
        });

        it('应该限制文件名长度', () => {
            const longName = 'a'.repeat(150);
            const result = fileHandler.sanitizeFilename(longName);
            
            expect(result.length).toBeLessThanOrEqual(100);
        });

        it('应该处理空文件名', () => {
            expect(fileHandler.sanitizeFilename('')).toBe('markdown-document');
            expect(fileHandler.sanitizeFilename(null)).toBe('markdown-document');
        });
    });

    describe('validateHTML', () => {
        it('应该验证有效的 HTML', () => {
            const validHTML = '<!DOCTYPE html><html><head></head><body><p>内容</p></body></html>';
            const result = fileHandler.validateHTML(validHTML);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('应该拒绝空 HTML', () => {
            const result = fileHandler.validateHTML('');
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('HTML 内容不能为空');
        });

        it('应该拒绝非字符串类型', () => {
            const result = fileHandler.validateHTML(123);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('HTML 内容不能为空');
        });

        it('应该检测缺少的 HTML 元素', () => {
            const incompleteHTML = '<p>只有段落</p>';
            const result = fileHandler.validateHTML(incompleteHTML);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('缺少 HTML 根元素');
        });

        it('应该警告缺少 DOCTYPE', () => {
            const htmlWithoutDoctype = '<html><head></head><body></body></html>';
            const result = fileHandler.validateHTML(htmlWithoutDoctype);
            
            expect(result.warnings).toContain('缺少 DOCTYPE 声明');
        });

        it('应该警告过大的文件', () => {
            const largeHTML = '<!DOCTYPE html><html><head></head><body>' + 'a'.repeat(51 * 1024 * 1024) + '</body></html>';
            const result = fileHandler.validateHTML(largeHTML);
            
            expect(result.warnings).toContain('HTML 文件过大，可能影响浏览器性能');
        });
    });

    describe('createSelfContainedHTML', () => {
        it('应该创建完整的 HTML 文档', () => {
            const content = '<h1>测试</h1><p>内容</p>';
            const result = fileHandler.createSelfContainedHTML(content, {
                title: '测试文档',
                theme: 'light'
            });
            
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<title>测试文档</title>');
            expect(result).toContain('class="theme-light"');
            expect(result).toContain('<h1>测试</h1>');
        });

        it('应该返回已完整的 HTML 文档', () => {
            const completeHTML = '<!DOCTYPE html><html><head><title>完整</title></head><body></body></html>';
            const result = fileHandler.createSelfContainedHTML(completeHTML);
            
            expect(result).toBe(completeHTML);
        });

        it('应该支持暗色主题', () => {
            const content = '<p>测试</p>';
            const result = fileHandler.createSelfContainedHTML(content, { theme: 'dark' });
            
            expect(result).toContain('class="theme-dark"');
            expect(result).toContain('#1a1a1a'); // 暗色背景
        });

        it('应该可以禁用样式', () => {
            const content = '<p>测试</p>';
            const result = fileHandler.createSelfContainedHTML(content, { includeStyles: false });
            
            expect(result).not.toContain('<style>');
        });
    });

    describe('escapeHtml', () => {
        it('应该转义 HTML 字符', () => {
            const text = '<script>alert("xss")</script>';
            const result = fileHandler.escapeHtml(text);
            
            expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
        });

        it('应该处理特殊字符', () => {
            const text = '& < > " \'';
            const result = fileHandler.escapeHtml(text);
            
            expect(result).toContain('&amp;');
            expect(result).toContain('&lt;');
            expect(result).toContain('&gt;');
        });
    });

    describe('downloadHTML', () => {
        it('应该成功下载 HTML 文件', () => {
            const htmlContent = '<html><body><h1>测试</h1></body></html>';
            const result = fileHandler.downloadHTML(htmlContent, 'test.html');
            
            expect(result.success).toBe(true);
            expect(result.fileName).toBe('test.html');
            expect(global.Blob).toHaveBeenCalledWith([htmlContent], { type: 'text/html;charset=utf-8' });
        });

        it('应该自动添加 .html 扩展名', () => {
            const htmlContent = '<html><body></body></html>';
            const result = fileHandler.downloadHTML(htmlContent, 'test');
            
            expect(result.fileName).toBe('test.html');
        });

        it('应该使用生成的文件名', () => {
            const htmlContent = '<h1>自动标题</h1>';
            const result = fileHandler.downloadHTML(htmlContent);
            
            expect(result.success).toBe(true);
            expect(result.fileName).toBe('自动标题.html');
        });

        it('应该处理下载错误', () => {
            // Mock Blob 构造函数抛出错误
            global.Blob = vi.fn(() => {
                throw new Error('Blob creation failed');
            });

            const result = fileHandler.downloadHTML('<html></html>');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Blob creation failed');
        });
    });

    describe('setDefaultFileName', () => {
        it('应该设置默认文件名', () => {
            fileHandler.setDefaultFileName('custom-default');
            const result = fileHandler.generateFilename('');
            
            expect(result).toBe('custom-default');
        });
    });

    describe('extractTitle', () => {
        it('应该提取 title 标签内容', () => {
            const html = '<title>页面标题</title>';
            const result = fileHandler.extractTitle(html);
            
            expect(result).toBe('页面标题');
        });

        it('应该提取第一个 h1 标签', () => {
            const html = '<h1>主标题</h1><h1>第二标题</h1>';
            const result = fileHandler.extractTitle(html);
            
            expect(result).toBe('主标题');
        });

        it('应该提取 Markdown 一级标题', () => {
            const markdown = '# Markdown 标题\n## 二级标题';
            const result = fileHandler.extractTitle(markdown);
            
            expect(result).toBe('Markdown 标题');
        });

        it('应该处理没有标题的情况', () => {
            const content = '只是普通文本内容';
            const result = fileHandler.extractTitle(content);
            
            expect(result).toBeNull();
        });

        it('应该忽略空白字符', () => {
            const html = '<h1>  带空格的标题  </h1>';
            const result = fileHandler.extractTitle(html);
            
            expect(result).toBe('带空格的标题');
        });
    });
});