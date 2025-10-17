/**
 * 文件上传组件
 * 处理 .md 文件的上传和验证
 */

export class FileUpload {
    constructor() {
        this.onFileLoad = null;
        this.onError = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedExtensions = ['.md', '.markdown', '.txt'];
    }

    /**
     * 创建文件上传元素
     * @param {HTMLElement} container 容器元素
     * @returns {HTMLElement} 文件上传元素
     */
    createUploadElement(container) {
        const uploadContainer = document.createElement('div');
        uploadContainer.className = 'file-upload-container';
        uploadContainer.innerHTML = `
            <input type="file" id="file-input" accept=".md,.markdown,.txt" style="display: none;">
            <button id="upload-btn" class="upload-btn">上传 .md 文件</button>
            <div class="drag-drop-area" id="drag-drop-area">
                <p>拖拽 .md 文件到此处</p>
            </div>
        `;

        this.setupEventListeners(uploadContainer);
        return uploadContainer;
    }

    /**
     * 设置事件监听器
     * @param {HTMLElement} container 容器元素
     */
    setupEventListeners(container) {
        const fileInput = container.querySelector('#file-input');
        const uploadBtn = container.querySelector('#upload-btn');
        const dragDropArea = container.querySelector('#drag-drop-area');

        // 文件选择按钮
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFile(file);
            }
        });

        // 拖拽事件
        this.setupDragAndDrop(dragDropArea);
    }

    /**
     * 设置拖拽上传功能
     * @param {HTMLElement} dragArea 拖拽区域
     */
    setupDragAndDrop(dragArea) {
        // 防止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dragArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // 拖拽进入和离开的视觉反馈
        ['dragenter', 'dragover'].forEach(eventName => {
            dragArea.addEventListener(eventName, () => {
                dragArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dragArea.addEventListener(eventName, () => {
                dragArea.classList.remove('drag-over');
            }, false);
        });

        // 处理文件拖放
        dragArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        }, false);
    }

    /**
     * 阻止默认事件
     * @param {Event} e 事件对象
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * 处理文件
     * @param {File} file 文件对象
     */
    handleFile(file) {
        // 验证文件
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            this.handleError(validation.errors.join(', '));
            return;
        }

        // 读取文件内容
        this.readFile(file);
    }

    /**
     * 验证文件
     * @param {File} file 文件对象
     * @returns {Object} 验证结果
     */
    validateFile(file) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!file) {
            result.isValid = false;
            result.errors.push('未选择文件');
            return result;
        }

        // 检查文件大小
        if (file.size > this.maxFileSize) {
            result.isValid = false;
            result.errors.push(`文件大小超过限制 (${this.formatFileSize(this.maxFileSize)})`);
        }

        // 检查文件扩展名
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.allowedExtensions.some(ext => 
            fileName.endsWith(ext)
        );

        if (!hasValidExtension) {
            result.isValid = false;
            result.errors.push(`不支持的文件格式，请选择 ${this.allowedExtensions.join(', ')} 文件`);
        }

        // 检查文件类型
        if (file.type && !file.type.startsWith('text/')) {
            result.isValid = false;
            result.errors.push('文件必须是文本格式');
        }

        return result;
    }

    /**
     * 读取文件内容
     * @param {File} file 文件对象
     */
    readFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            
            // 验证内容
            if (typeof content !== 'string') {
                this.handleError('文件内容读取失败');
                return;
            }

            // 触发文件加载回调
            if (this.onFileLoad) {
                this.onFileLoad({
                    content: content,
                    fileName: file.name,
                    fileSize: file.size,
                    lastModified: new Date(file.lastModified)
                });
            }
        };

        reader.onerror = () => {
            this.handleError('文件读取失败');
        };

        // 以文本格式读取文件
        reader.readAsText(file, 'UTF-8');
    }

    /**
     * 处理错误
     * @param {string} message 错误消息
     */
    handleError(message) {
        console.error('文件上传错误:', message);
        
        if (this.onError) {
            this.onError(message);
        }
    }

    /**
     * 格式化文件大小
     * @param {number} bytes 字节数
     * @returns {string} 格式化后的大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 设置文件加载回调
     * @param {Function} callback 回调函数
     */
    setOnFileLoad(callback) {
        this.onFileLoad = callback;
    }

    /**
     * 设置错误回调
     * @param {Function} callback 回调函数
     */
    setOnError(callback) {
        this.onError = callback;
    }

    /**
     * 设置最大文件大小
     * @param {number} size 文件大小（字节）
     */
    setMaxFileSize(size) {
        this.maxFileSize = size;
    }

    /**
     * 设置允许的文件扩展名
     * @param {Array<string>} extensions 扩展名数组
     */
    setAllowedExtensions(extensions) {
        this.allowedExtensions = extensions;
    }
}