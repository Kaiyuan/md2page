/**
 * FileUpload 组件单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileUpload } from '../src/components/FileUpload.js';

describe('FileUpload', () => {
    let fileUpload;
    let mockContainer;

    beforeEach(() => {
        fileUpload = new FileUpload();
        
        // Mock DOM elements
        mockContainer = {
            appendChild: vi.fn(),
            querySelector: vi.fn()
        };

        // Mock FileReader
        global.FileReader = vi.fn(() => ({
            readAsText: vi.fn(),
            onload: null,
            onerror: null,
            result: null
        }));

        // Mock File
        global.File = vi.fn();
    });

    describe('constructor', () => {
        it('应该初始化默认属性', () => {
            expect(fileUpload.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
            expect(fileUpload.allowedExtensions).toEqual(['.md', '.markdown', '.txt']);
            expect(fileUpload.onFileLoad).toBeNull();
            expect(fileUpload.onError).toBeNull();
        });
    });

    describe('validateFile', () => {
        it('应该验证有效的 .md 文件', () => {
            const mockFile = {
                name: 'test.md',
                size: 1024,
                type: 'text/markdown'
            };

            const result = fileUpload.validateFile(mockFile);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('应该拒绝空文件', () => {
            const result = fileUpload.validateFile(null);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('未选择文件');
        });

        it('应该拒绝过大的文件', () => {
            const mockFile = {
                name: 'large.md',
                size: 20 * 1024 * 1024, // 20MB
                type: 'text/markdown'
            };

            const result = fileUpload.validateFile(mockFile);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('文件大小超过限制'))).toBe(true);
        });

        it('应该拒绝不支持的文件格式', () => {
            const mockFile = {
                name: 'test.pdf',
                size: 1024,
                type: 'application/pdf'
            };

            const result = fileUpload.validateFile(mockFile);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('不支持的文件格式'))).toBe(true);
        });

        it('应该接受 .markdown 扩展名', () => {
            const mockFile = {
                name: 'test.markdown',
                size: 1024,
                type: 'text/markdown'
            };

            const result = fileUpload.validateFile(mockFile);
            
            expect(result.isValid).toBe(true);
        });

        it('应该接受 .txt 扩展名', () => {
            const mockFile = {
                name: 'test.txt',
                size: 1024,
                type: 'text/plain'
            };

            const result = fileUpload.validateFile(mockFile);
            
            expect(result.isValid).toBe(true);
        });

        it('应该拒绝非文本文件类型', () => {
            const mockFile = {
                name: 'test.md',
                size: 1024,
                type: 'image/png'
            };

            const result = fileUpload.validateFile(mockFile);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('文件必须是文本格式');
        });
    });

    describe('formatFileSize', () => {
        it('应该格式化字节数', () => {
            expect(fileUpload.formatFileSize(0)).toBe('0 Bytes');
            expect(fileUpload.formatFileSize(1024)).toBe('1 KB');
            expect(fileUpload.formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(fileUpload.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
        });

        it('应该处理小数', () => {
            expect(fileUpload.formatFileSize(1536)).toBe('1.5 KB'); // 1.5KB
            expect(fileUpload.formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
        });
    });

    describe('readFile', () => {
        it('应该成功读取文件', () => {
            const mockFile = {
                name: 'test.md',
                size: 1024,
                lastModified: Date.now()
            };

            const mockReader = {
                readAsText: vi.fn(),
                onload: null,
                onerror: null,
                result: '# 测试内容'
            };

            global.FileReader = vi.fn(() => mockReader);

            const onFileLoadSpy = vi.fn();
            fileUpload.setOnFileLoad(onFileLoadSpy);

            fileUpload.readFile(mockFile);

            // 模拟文件读取成功
            mockReader.onload({ target: { result: '# 测试内容' } });

            expect(mockReader.readAsText).toHaveBeenCalledWith(mockFile, 'UTF-8');
            expect(onFileLoadSpy).toHaveBeenCalledWith({
                content: '# 测试内容',
                fileName: 'test.md',
                fileSize: 1024,
                lastModified: expect.any(Date)
            });
        });

        it('应该处理文件读取错误', () => {
            const mockFile = { name: 'test.md' };
            const mockReader = {
                readAsText: vi.fn(),
                onload: null,
                onerror: null
            };

            global.FileReader = vi.fn(() => mockReader);

            const onErrorSpy = vi.fn();
            fileUpload.setOnError(onErrorSpy);

            fileUpload.readFile(mockFile);

            // 模拟文件读取失败
            mockReader.onerror();

            expect(onErrorSpy).toHaveBeenCalledWith('文件读取失败');
        });

        it('应该处理非字符串内容', () => {
            const mockFile = { name: 'test.md' };
            const mockReader = {
                readAsText: vi.fn(),
                onload: null,
                onerror: null
            };

            global.FileReader = vi.fn(() => mockReader);

            const onErrorSpy = vi.fn();
            fileUpload.setOnError(onErrorSpy);

            fileUpload.readFile(mockFile);

            // 模拟读取到非字符串内容
            mockReader.onload({ target: { result: null } });

            expect(onErrorSpy).toHaveBeenCalledWith('文件内容读取失败');
        });
    });

    describe('handleFile', () => {
        it('应该处理有效文件', () => {
            const mockFile = {
                name: 'test.md',
                size: 1024,
                type: 'text/markdown'
            };

            const readFileSpy = vi.spyOn(fileUpload, 'readFile');
            
            fileUpload.handleFile(mockFile);

            expect(readFileSpy).toHaveBeenCalledWith(mockFile);
        });

        it('应该拒绝无效文件', () => {
            const mockFile = {
                name: 'test.pdf',
                size: 1024,
                type: 'application/pdf'
            };

            const onErrorSpy = vi.fn();
            fileUpload.setOnError(onErrorSpy);

            fileUpload.handleFile(mockFile);

            expect(onErrorSpy).toHaveBeenCalled();
        });
    });

    describe('setters', () => {
        it('应该设置文件加载回调', () => {
            const callback = vi.fn();
            fileUpload.setOnFileLoad(callback);
            
            expect(fileUpload.onFileLoad).toBe(callback);
        });

        it('应该设置错误回调', () => {
            const callback = vi.fn();
            fileUpload.setOnError(callback);
            
            expect(fileUpload.onError).toBe(callback);
        });

        it('应该设置最大文件大小', () => {
            fileUpload.setMaxFileSize(5 * 1024 * 1024); // 5MB
            
            expect(fileUpload.maxFileSize).toBe(5 * 1024 * 1024);
        });

        it('应该设置允许的扩展名', () => {
            const extensions = ['.md', '.txt'];
            fileUpload.setAllowedExtensions(extensions);
            
            expect(fileUpload.allowedExtensions).toEqual(extensions);
        });
    });

    describe('preventDefaults', () => {
        it('应该阻止默认事件', () => {
            const mockEvent = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            };

            fileUpload.preventDefaults(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
        });
    });
});