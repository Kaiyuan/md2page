/**
 * TOCGenerator 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TOCGenerator } from '../src/core/TOCGenerator.js';

describe('TOCGenerator', () => {
    let tocGenerator;

    beforeEach(() => {
        tocGenerator = new TOCGenerator();
        
        // Mock DOM methods
        global.document = {
            createElement: vi.fn(() => ({
                innerHTML: '',
                querySelectorAll: vi.fn(() => []),
                textContent: '',
                id: '',
                tagName: 'H1',
                cloneNode: vi.fn(() => ({
                    querySelectorAll: vi.fn(() => []),
                    textContent: 'Test Heading'
                }))
            })),
            getElementById: vi.fn(),
            querySelector: vi.fn(),
            querySelectorAll: vi.fn(() => []),
            addEventListener: vi.fn()
        };

        global.window = {
            pageYOffset: 0,
            scrollTo: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
    });

    describe('constructor', () => {
        it('应该初始化默认属性', () => {
            expect(tocGenerator.headingSelector).toBe('h1, h2, h3, h4, h5, h6');
            expect(tocGenerator.maxDepth).toBe(6);
            expect(tocGenerator.minHeadings).toBe(2);
        });
    });

    describe('generateTOC', () => {
        it('应该处理空内容', () => {
            expect(tocGenerator.generateTOC('')).toEqual([]);
            expect(tocGenerator.generateTOC(null)).toEqual([]);
            expect(tocGenerator.generateTOC(undefined)).toEqual([]);
        });

        it('应该处理非字符串内容', () => {
            expect(tocGenerator.generateTOC(123)).toEqual([]);
            expect(tocGenerator.generateTOC({})).toEqual([]);
        });

        it('应该生成简单的目录结构', () => {
            // Mock DOM 解析
            const mockHeadings = [
                { tagName: 'H1', textContent: '标题 1', id: '' },
                { tagName: 'H2', textContent: '标题 2', id: '' },
                { tagName: 'H3', textContent: '标题 3', id: '' }
            ];

            const mockDiv = {
                innerHTML: '',
                querySelectorAll: vi.fn(() => mockHeadings)
            };

            global.document.createElement = vi.fn(() => mockDiv);

            const result = tocGenerator.generateTOC('<h1>标题 1</h1><h2>标题 2</h2><h3>标题 3</h3>');
            
            expect(result).toHaveLength(1); // 只有一个顶级项目
            expect(result[0].text).toBe('标题 1');
            expect(result[0].level).toBe(1);
            expect(result[0].children).toHaveLength(1);
            expect(result[0].children[0].text).toBe('标题 2');
            expect(result[0].children[0].children).toHaveLength(1);
        });

        it('应该处理标题数量不足的情况', () => {
            const mockHeadings = [
                { tagName: 'H1', textContent: '单个标题', id: '' }
            ];

            const mockDiv = {
                innerHTML: '',
                querySelectorAll: vi.fn(() => mockHeadings)
            };

            global.document.createElement = vi.fn(() => mockDiv);

            const result = tocGenerator.generateTOC('<h1>单个标题</h1>');
            
            expect(result).toEqual([]);
        });
    });

    describe('extractHeadingText', () => {
        it('应该提取纯文本', () => {
            const mockHeading = {
                cloneNode: vi.fn(() => ({
                    querySelectorAll: vi.fn(() => []),
                    textContent: '  测试标题  '
                }))
            };

            const result = tocGenerator.extractHeadingText(mockHeading);
            expect(result).toBe('测试标题');
        });

        it('应该移除链接标签', () => {
            const mockLink = {
                textContent: '链接文本',
                replaceWith: vi.fn()
            };

            const mockHeading = {
                cloneNode: vi.fn(() => ({
                    querySelectorAll: vi.fn(() => [mockLink]),
                    textContent: '标题 链接文本'
                }))
            };

            const result = tocGenerator.extractHeadingText(mockHeading);
            expect(mockLink.replaceWith).toHaveBeenCalledWith('链接文本');
        });
    });

    describe('generateHeadingId', () => {
        it('应该生成正确的 ID', () => {
            expect(tocGenerator.generateHeadingId('Hello World', 0)).toBe('hello-world');
            expect(tocGenerator.generateHeadingId('中文标题', 1)).toBe('中文标题');
            expect(tocGenerator.generateHeadingId('Mixed 中英文 Title', 2)).toBe('mixed-中英文-title');
        });

        it('应该处理特殊字符', () => {
            expect(tocGenerator.generateHeadingId('Title with @#$%', 0)).toBe('title-with');
            expect(tocGenerator.generateHeadingId('---Title---', 1)).toBe('title');
        });

        it('应该处理空文本', () => {
            expect(tocGenerator.generateHeadingId('', 5)).toBe('heading-5');
            expect(tocGenerator.generateHeadingId(null, 3)).toBe('heading-3');
        });

        it('应该限制长度', () => {
            const longText = 'a'.repeat(100);
            const result = tocGenerator.generateHeadingId(longText, 0);
            expect(result.length).toBeLessThanOrEqual(50);
        });
    });

    describe('buildHierarchy', () => {
        it('应该构建正确的层级结构', () => {
            const flatItems = [
                { text: 'H1', level: 1, children: [] },
                { text: 'H2-1', level: 2, children: [] },
                { text: 'H3', level: 3, children: [] },
                { text: 'H2-2', level: 2, children: [] }
            ];

            const result = tocGenerator.buildHierarchy(flatItems);
            
            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('H1');
            expect(result[0].children).toHaveLength(2);
            expect(result[0].children[0].text).toBe('H2-1');
            expect(result[0].children[0].children).toHaveLength(1);
            expect(result[0].children[0].children[0].text).toBe('H3');
            expect(result[0].children[1].text).toBe('H2-2');
        });

        it('应该处理空数组', () => {
            expect(tocGenerator.buildHierarchy([])).toEqual([]);
            expect(tocGenerator.buildHierarchy(null)).toEqual([]);
        });

        it('应该处理多个顶级项目', () => {
            const flatItems = [
                { text: 'H1-1', level: 1, children: [] },
                { text: 'H1-2', level: 1, children: [] }
            ];

            const result = tocGenerator.buildHierarchy(flatItems);
            
            expect(result).toHaveLength(2);
            expect(result[0].text).toBe('H1-1');
            expect(result[1].text).toBe('H1-2');
        });
    });

    describe('renderTOC', () => {
        it('应该渲染空目录', () => {
            expect(tocGenerator.renderTOC([])).toBe('');
            expect(tocGenerator.renderTOC(null)).toBe('');
        });

        it('应该渲染简单目录', () => {
            const tocItems = [
                { id: 'h1', text: '标题 1', level: 1, children: [] }
            ];

            const result = tocGenerator.renderTOC(tocItems);
            
            expect(result).toContain('<ul class="toc">');
            expect(result).toContain('href="#h1"');
            expect(result).toContain('标题 1');
            expect(result).toContain('</ul>');
        });

        it('应该渲染嵌套目录', () => {
            const tocItems = [
                {
                    id: 'h1',
                    text: '标题 1',
                    level: 1,
                    children: [
                        { id: 'h2', text: '标题 2', level: 2, children: [] }
                    ]
                }
            ];

            const result = tocGenerator.renderTOC(tocItems);
            
            expect(result).toContain('标题 1');
            expect(result).toContain('标题 2');
            expect(result).toContain('<ul class="toc-sub">');
        });

        it('应该支持显示编号', () => {
            const tocItems = [
                { id: 'h1', text: '标题 1', level: 1, children: [] }
            ];

            const result = tocGenerator.renderTOC(tocItems, { showNumbers: true });
            
            expect(result).toContain('1. 标题 1');
        });

        it('应该限制最大深度', () => {
            const tocItems = [
                {
                    id: 'h1',
                    text: '标题 1',
                    level: 1,
                    children: [
                        {
                            id: 'h2',
                            text: '标题 2',
                            level: 2,
                            children: [
                                { id: 'h3', text: '标题 3', level: 3, children: [] }
                            ]
                        }
                    ]
                }
            ];

            const result = tocGenerator.renderTOC(tocItems, { maxDepth: 2 });
            
            expect(result).toContain('标题 1');
            expect(result).toContain('标题 2');
            expect(result).not.toContain('标题 3');
        });
    });

    describe('escapeHtml', () => {
        it('应该转义 HTML 字符', () => {
            const mockDiv = {
                textContent: '',
                innerHTML: '&lt;script&gt;'
            };
            
            global.document.createElement = vi.fn(() => mockDiv);

            const result = tocGenerator.escapeHtml('<script>');
            expect(result).toBe('&lt;script&gt;');
        });
    });

    describe('getTOCStats', () => {
        it('应该返回空统计', () => {
            const stats = tocGenerator.getTOCStats([]);
            
            expect(stats.totalItems).toBe(0);
            expect(stats.maxDepth).toBe(0);
            expect(stats.levelCounts).toEqual({});
        });

        it('应该计算正确的统计信息', () => {
            const tocItems = [
                {
                    level: 1,
                    children: [
                        { level: 2, children: [] },
                        { level: 2, children: [] }
                    ]
                }
            ];

            const stats = tocGenerator.getTOCStats(tocItems);
            
            expect(stats.totalItems).toBe(3);
            expect(stats.maxDepth).toBe(2);
            expect(stats.levelCounts[1]).toBe(1);
            expect(stats.levelCounts[2]).toBe(2);
        });
    });

    describe('setters', () => {
        it('应该设置最小标题数量', () => {
            tocGenerator.setMinHeadings(5);
            expect(tocGenerator.minHeadings).toBe(5);
            
            tocGenerator.setMinHeadings(0);
            expect(tocGenerator.minHeadings).toBe(1); // 最小值为 1
        });

        it('应该设置最大深度', () => {
            tocGenerator.setMaxDepth(4);
            expect(tocGenerator.maxDepth).toBe(4);
            
            tocGenerator.setMaxDepth(0);
            expect(tocGenerator.maxDepth).toBe(1); // 最小值为 1
            
            tocGenerator.setMaxDepth(10);
            expect(tocGenerator.maxDepth).toBe(6); // 最大值为 6
        });
    });
});