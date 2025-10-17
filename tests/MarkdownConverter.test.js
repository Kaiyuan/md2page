/**
 * MarkdownConverter 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownConverter } from '../src/core/MarkdownConverter.js';

describe('MarkdownConverter', () => {
    let converter;

    beforeEach(() => {
        converter = new MarkdownConverter();
    });

    describe('parseMarkdown', () => {
        it('应该正确解析基础 Markdown 语法', () => {
            const markdown = '# 标题\n\n这是一个段落。';
            const result = converter.parseMarkdown(markdown);
            
            expect(result).toContain('<h1 id="标题">标题</h1>');
            expect(result).toContain('<p>这是一个段落。</p>');
        });

        it('应该处理空内容', () => {
            expect(converter.parseMarkdown('')).toBe('');
            expect(converter.parseMarkdown(null)).toBe('');
            expect(converter.parseMarkdown(undefined)).toBe('');
        });

        it('应该处理代码块', () => {
            const markdown = '```javascript\nconsole.log("hello");\n```';
            const result = converter.parseMarkdown(markdown);
            
            expect(result).toContain('<pre>');
            expect(result).toContain('<code');
            expect(result).toContain('console.log("hello");');
        });

        it('应该处理列表', () => {
            const markdown = '- 项目 1\n- 项目 2\n- 项目 3';
            const result = converter.parseMarkdown(markdown);
            
            expect(result).toContain('<ul>');
            expect(result).toContain('<li>项目 1</li>');
            expect(result).toContain('<li>项目 2</li>');
        });

        it('应该处理链接', () => {
            const markdown = '[链接文本](https://example.com)';
            const result = converter.parseMarkdown(markdown);
            
            expect(result).toContain('<a href="https://example.com">链接文本</a>');
        });

        it('应该处理表格', () => {
            const markdown = '| 列1 | 列2 |\n|-----|-----|\n| 值1 | 值2 |';
            const result = converter.parseMarkdown(markdown);
            
            expect(result).toContain('<table>');
            expect(result).toContain('<th>列1</th>');
            expect(result).toContain('<td>值1</td>');
        });

        it('应该处理解析错误', () => {
            // 模拟解析错误的情况
            const invalidInput = { invalid: 'object' };
            const result = converter.parseMarkdown(invalidInput);
            
            expect(result).toContain('class="error"');
            expect(result).toContain('Markdown 解析失败');
        });
    });

    describe('validateMarkdown', () => {
        it('应该验证有效内容', () => {
            const result = converter.validateMarkdown('# 有效的 Markdown');
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('应该拒绝空内容', () => {
            const result = converter.validateMarkdown('');
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('内容不能为空');
        });

        it('应该拒绝非字符串类型', () => {
            const result = converter.validateMarkdown(123);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('内容必须是字符串类型');
        });

        it('应该警告过长内容', () => {
            const longContent = 'a'.repeat(1000001);
            const result = converter.validateMarkdown(longContent);
            
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('内容过长，可能影响性能');
        });
    });

    describe('generateHeadingId', () => {
        it('应该生成正确的标题 ID', () => {
            expect(converter.generateHeadingId('Hello World')).toBe('hello-world');
            expect(converter.generateHeadingId('中文标题')).toBe('中文标题');
            expect(converter.generateHeadingId('Mixed 中英文 Title')).toBe('mixed-中英文-title');
        });

        it('应该处理特殊字符', () => {
            expect(converter.generateHeadingId('Title with @#$%')).toBe('title-with');
            expect(converter.generateHeadingId('---Title---')).toBe('title');
        });
    });

    describe('generateHTML', () => {
        it('应该生成完整的 HTML 文档', () => {
            const content = '<h1>测试</h1><p>内容</p>';
            const result = converter.generateHTML(content, {
                title: '测试文档',
                theme: 'light'
            });
            
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<title>测试文档</title>');
            expect(result).toContain('class="theme-light"');
            expect(result).toContain('<h1>测试</h1>');
        });

        it('应该使用默认选项', () => {
            const content = '<p>测试</p>';
            const result = converter.generateHTML(content);
            
            expect(result).toContain('<title>Markdown Document</title>');
            expect(result).toContain('class="theme-light"');
        });

        it('应该支持暗色主题', () => {
            const content = '<p>测试</p>';
            const result = converter.generateHTML(content, { theme: 'dark' });
            
            expect(result).toContain('class="theme-dark"');
            expect(result).toContain('#1a1a1a'); // 暗色背景
        });
    });

    describe('getInlineStyles', () => {
        it('应该返回亮色主题样式', () => {
            const styles = converter.getInlineStyles('light');
            
            expect(styles).toContain('#333'); // 亮色文字
            expect(styles).toContain('#fff'); // 亮色背景
        });

        it('应该返回暗色主题样式', () => {
            const styles = converter.getInlineStyles('dark');
            
            expect(styles).toContain('#e1e1e1'); // 暗色文字
            expect(styles).toContain('#1a1a1a'); // 暗色背景
        });
    });
});