# Implementation Plan

- [x] 1. 项目初始化和基础结构搭建






  - 创建项目根目录结构（src、public、styles 文件夹）
  - 初始化 package.json 并安装核心依赖（Vite、marked.js、Prism.js）
  - 配置 Vite 构建工具和开发环境
  - 创建基础的 HTML 模板文件（index.html）
  - 创建主入口文件（src/main.js）
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 2. 核心 Markdown 转换功能实现
- [x] 2.1 实现 MarkdownConverter 类


  - 创建 src/core/MarkdownConverter.js 文件
  - 集成 marked.js 库进行 Markdown 解析
  - 实现 parseMarkdown() 和 generateHTML() 方法
  - 添加 Markdown 语法验证功能
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 2.2 创建基础用户界面


  - 创建 src/components/InputPanel.js 输入面板组件
  - 创建 src/components/PreviewPanel.js 预览面板组件
  - 实现双栏布局的基础 HTML 结构
  - 添加基础 CSS 样式文件
  - _Requirements: 1.1, 3.1_

- [x] 2.3 实现实时预览功能


  - 在输入面板添加文本区域和事件监听
  - 实现输入内容的实时 Markdown 解析
  - 添加防抖优化避免频繁更新
  - 在预览面板显示转换后的 HTML
  - _Requirements: 1.2_

- [x] 2.4 编写 Markdown 转换功能的单元测试


  - 创建 tests/MarkdownConverter.test.js
  - 测试各种 Markdown 语法的解析正确性
  - 测试边界情况和错误处理
  - _Requirements: 1.3, 1.4, 1.5_
- [ ] 3. 文件处理功能实现
- [x] 3.1 实现文件上传组件


  - 创建 src/components/FileUpload.js 文件上传组件
  - 实现文件选择界面和拖拽上传功能
  - 添加 .md 文件类型验证逻辑
  - 实现文件内容读取和解析功能
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 3.2 实现文件下载功能



  - 创建 src/core/FileHandler.js 文件处理类
  - 实现 HTML 文件生成和下载方法
  - 确保生成的 HTML 文件内联所有样式（自包含）
  - 添加基于内容的智能文件命名功能
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3.3 添加文件处理错误处理


  - 实现文件格式验证和用户友好的错误提示
  - 添加文件大小限制检查和处理
  - 创建错误状态显示组件
  - _Requirements: 2.4_

- [x]* 3.4 编写文件处理功能的单元测试


  - 创建 tests/FileHandler.test.js
  - 测试文件上传验证逻辑
  - 测试下载功能和文件完整性验证
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 4. 主题系统实现
- [x] 4.1 创建 CSS 变量主题系统


  - 创建 src/styles/themes.css 主题样式文件
  - 定义亮色和暗色主题的 CSS 变量
  - 实现主题切换的 CSS 类系统
  - 确保所有 UI 组件支持主题变量
  - _Requirements: 4.1, 4.5_

- [x] 4.2 实现 ThemeManager 类


  - 创建 src/core/ThemeManager.js 主题管理类
  - 实现系统主题自动检测功能（prefers-color-scheme）
  - 添加主题切换逻辑和本地存储功能
  - 实现主题变化的事件通知机制
  - _Requirements: 4.2, 4.4_

- [x] 4.3 添加主题切换界面


  - 创建 src/components/ThemeToggle.js 主题切换按钮组件
  - 在页面头部添加主题切换按钮
  - 实现主题切换的即时生效和视觉反馈
  - _Requirements: 4.3_

- [x]* 4.4 编写主题系统的单元测试



  - 创建 tests/ThemeManager.test.js
  - 测试主题切换功能和系统主题检测
  - 测试本地存储功能和事件通知
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_- [ ] 5
. 目录生成功能实现
- [ ] 5.1 实现 TOCGenerator 类
  - 创建 src/core/TOCGenerator.js 目录生成类
  - 实现标题扫描和层级化目录结构生成
  - 添加目录项 ID 生成和锚点链接功能
  - 实现目录树的 HTML 渲染方法
  - _Requirements: 5.1, 5.2_

- [ ] 5.2 创建目录导航界面
  - 创建 src/components/TableOfContents.js 目录组件
  - 实现目录的侧边栏或顶部显示
  - 添加目录项点击跳转和平滑滚动功能
  - 确保目录在不同屏幕尺寸下的适配
  - _Requirements: 5.3, 5.5_

- [ ] 5.3 实现滚动监听和高亮
  - 添加页面滚动事件监听器
  - 实现当前阅读位置的目录项高亮
  - 优化滚动性能，避免频繁计算
  - _Requirements: 5.4_

- [ ]* 5.4 编写目录功能的单元测试
  - 创建 tests/TOCGenerator.test.js
  - 测试目录生成逻辑和导航功能
  - 测试滚动监听和高亮功能
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. 响应式设计实现
- [ ] 6.1 实现桌面端布局
  - 完善双栏布局样式（输入面板 + 预览面板）
  - 添加面板分割线和大小调整功能
  - 确保在大屏幕上的最佳显示效果
  - _Requirements: 3.1_

- [ ] 6.2 实现移动端适配
  - 创建移动端响应式 CSS 媒体查询
  - 实现单栏布局和标签切换模式（输入/预览）
  - 优化移动端的触摸交互和导航
  - _Requirements: 3.2, 3.5_

- [ ] 6.3 实现响应式图片和表格处理
  - 添加图片自适应缩放 CSS 规则
  - 实现表格的横向滚动和移动端优化
  - 确保内容在小屏幕上的可读性
  - _Requirements: 3.3, 3.4_

- [ ]* 6.4 编写响应式布局的测试
  - 创建 tests/responsive.test.js
  - 测试不同屏幕尺寸下的布局表现
  - 测试移动端交互功能
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_- [ 
] 7. 打印优化功能实现
- [ ] 7.1 创建 PrintOptimizer 类
  - 创建 src/core/PrintOptimizer.js 打印优化类
  - 实现打印专用 CSS 样式生成
  - 添加打印时隐藏不必要界面元素的逻辑
  - _Requirements: 6.1, 6.4_

- [ ] 7.2 优化打印样式
  - 创建 src/styles/print.css 打印样式文件
  - 实现打印字体、间距和页边距优化
  - 添加黑白配色方案和墨水节省优化
  - 实现智能分页和页面断点处理
  - _Requirements: 6.2, 6.4, 6.5_

- [ ] 7.3 处理代码块和表格的打印优化
  - 优化代码块在打印时的显示和换行
  - 确保表格在打印时不被截断或正确分页
  - 添加长内容的打印适配处理
  - _Requirements: 6.3_

- [ ]* 7.4 编写打印功能的测试
  - 创建 tests/PrintOptimizer.test.js
  - 测试打印样式生成和布局优化
  - 验证打印 CSS 的正确性
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. 代码高亮和用户界面完善
- [ ] 8.1 集成代码语法高亮
  - 集成 Prism.js 代码高亮库
  - 配置支持的编程语言和主题
  - 确保代码高亮样式与应用主题一致
  - 在 Markdown 解析中启用代码高亮功能
  - _Requirements: 1.3_

- [ ] 8.2 完善主应用界面和布局
  - 创建 src/App.js 主应用类
  - 集成所有功能组件到完整界面
  - 实现应用状态管理和组件间通信
  - 添加页面头部、工具栏和状态栏
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 8.3 实现错误处理和用户反馈
  - 创建全局错误处理机制
  - 实现用户友好的错误提示和状态显示
  - 添加加载状态指示器和进度反馈
  - 创建帮助信息和使用说明
  - _Requirements: 2.4_

- [ ]* 8.4 编写集成测试
  - 创建 tests/integration.test.js
  - 测试完整的用户工作流程
  - 测试组件间的交互和数据流
  - 验证错误处理流程的完整性
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_-
 [ ] 9. 性能优化和最终完善
- [ ] 9.1 实现性能优化
  - 添加输入防抖和节流优化
  - 实现解析结果缓存机制
  - 优化大文件处理性能和内存使用
  - 添加懒加载和代码分割优化
  - _Requirements: 1.2_

- [ ] 9.2 浏览器兼容性和 Polyfill
  - 确保主流浏览器的兼容性支持
  - 添加必要的 JavaScript Polyfill
  - 测试和修复浏览器特定问题
  - 优化在不同浏览器中的用户体验
  - _Requirements: 3.1, 4.2_

- [ ] 9.3 最终测试和用户体验优化
  - 进行完整的端到端功能测试
  - 优化用户界面细节和交互体验
  - 验证所有需求的完整实现
  - 进行性能基准测试和优化
  - 准备生产环境构建配置
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_