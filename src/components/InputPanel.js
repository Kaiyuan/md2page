/**
 * 输入面板组件
 * 负责 Markdown 内容的输入和文件上传
 */

import { FileUpload } from './FileUpload.js';

export class InputPanel {
    constructor(container) {
        this.container = container;
        this.textarea = null;
        this.onContentChange = null;
        this.fileUpload = new FileUpload();
        this.onError = null;
    }

    /**
     * 渲染输入面板
     */
    render() {
        this.container.innerHTML = `
            <div class="panel-header">
                <h2>Markdown 输入</h2>
            </div>
            <div class="panel-content">
                <div class="upload-section" id="upload-section">
                    <!-- 文件上传组件将在这里渲染 -->
                </div>
                <textarea 
                    id="markdown-input" 
                    class="markdown-textarea"
                    placeholder="在此输入 Markdown 内容，或上传 .md 文件..."
                    spellcheck="false"
                ></textarea>
            </div>
        `;

        this.setupComponents();
        this.setupEventListeners();
    }

    /**
     * 设置组件
     */
    setupComponents() {
        // 渲染文件上传组件
        const uploadSection = this.container.querySelector('#upload-section');
        if (uploadSection) {
            const uploadElement = this.fileUpload.createUploadElement(uploadSection);
            uploadSection.appendChild(uploadElement);
        }

        // 设置文件上传回调
        this.fileUpload.setOnFileLoad((fileData) => {
            this.handleFileLoad(fileData);
        });

        this.fileUpload.setOnError((error) => {
            this.handleError(error);
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        this.textarea = this.container.querySelector('#markdown-input');

        // 监听文本输入
        if (this.textarea) {
            this.textarea.addEventListener('input', (e) => {
                if (this.onContentChange) {
                    this.onContentChange(e.target.value);
                }
            });
        }
    }

    /**
     * 处理文件加载
     * @param {Object} fileData 文件数据
     */
    handleFileLoad(fileData) {
        const { content, fileName } = fileData;
        
        // 设置内容到文本区域
        this.setContent(content);
        
        // 触发内容变化回调
        if (this.onContentChange) {
            this.onContentChange(content);
        }

        // 显示成功消息
        console.log(`文件 "${fileName}" 加载成功`);
    }

    /**
     * 处理错误
     * @param {string} error 错误消息
     */
    handleError(error) {
        console.error('文件处理错误:', error);
        
        if (this.onError) {
            this.onError(error);
        } else {
            // 默认错误处理
            alert(`文件处理失败: ${error}`);
        }
    }

    /**
     * 设置内容
     * @param {string} content 内容
     */
    setContent(content) {
        if (this.textarea) {
            this.textarea.value = content;
        }
    }

    /**
     * 获取内容
     * @returns {string} 当前内容
     */
    getContent() {
        return this.textarea ? this.textarea.value : '';
    }

    /**
     * 设置内容变化回调
     * @param {Function} callback 回调函数
     */
    setOnContentChange(callback) {
        this.onContentChange = callback;
    }

    /**
     * 设置错误回调
     * @param {Function} callback 回调函数
     */
    setOnError(callback) {
        this.onError = callback;
    }
}