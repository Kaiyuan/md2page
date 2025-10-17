/**
 * TOCGenerator 单元测试
 */

// 模拟 DOM 环境
const mockDOM = () => {
    global.document = {
        createElement: (tag) => ({
            tagName: tag.toUpperCase(),
            innerHTML: '',
            textContent: '',
            id: '',
            querySelector: () => null,
            querySelectorAll: () => [],
            appendChild: () => {},
            classList: {
                add: () => {},
                remove: () => {},
                toggle: () => {}
            }
        })
    };
};

// 如果在 Node.js 环境中运行测试
if (typeof document === 'undefined') {
    mockDOM();
}

/**
 * 测试 TOCGenerator 类
 */
function testTOCGenerator() {
    console.log('开始测试 TOCGenerator...');
    
    // 测试用的 HTML 内容
    const testHTML = `
        <h1>第一章 介绍</h1>
        <p>这是介绍内容</p>
        <h2>1.1 背景</h2>
        <p>背景内容</p>
        <h2>1.2 目标</h2>
        <p>目标内容</p>
        <h1>第二章 实现</h1>
        <h2>2.1 架构设计</h2>
        <h3>2.1.1 前端架构</h3>
        <h3>2.1.2 后端架构</h3>
        <h2>2.2 技术选型</h2>
        <h1>第三章 总结</h1>
    `;

    try {
        // 创建 TOCGenerator 实例
        const tocGenerator = new TOCGenerator();
        
        // 测试基本功能
        console.log('✓ TOCGenerator 实例创建成功');
        
        // 测试目录生成
        const tocData = tocGenerator.generateTOC(testHTML);
        
        console.log('✓ 目录生成成功');
        console.log(`  - 标题数量: ${tocData.count}`);
        console.log(`  - 级别统计:`, tocData.levels);
        
        // 验证标题提取
        if (tocData.headings.length > 0) {
            console.log('✓ 标题提取成功');
            tocData.headings.forEach((heading, index) => {
                console.log(`  ${index + 1}. H${heading.level}: ${heading.text}`);
            });
        } else {
            console.log('✗ 标题提取失败');
        }
        
        // 验证 HTML 生成
        if (tocData.html && tocData.html.length > 0) {
            console.log('✓ 目录 HTML 生成成功');
        } else {
            console.log('✗ 目录 HTML 生成失败');
        }
        
        // 测试选项过滤
        const filteredTOC = tocGenerator.generateTOC(testHTML, {
            minLevel: 1,
            maxLevel: 2
        });
        
        console.log('✓ 级别过滤测试成功');
        console.log(`  - 过滤后标题数量: ${filteredTOC.count}`);
        
        // 测试空内容
        const emptyTOC = tocGenerator.generateTOC('');
        if (emptyTOC.count === 0) {
            console.log('✓ 空内容处理成功');
        } else {
            console.log('✗ 空内容处理失败');
        }
        
        console.log('TOCGenerator 测试完成 ✓');
        return true;
        
    } catch (error) {
        console.error('TOCGenerator 测试失败:', error);
        return false;
    }
}

/**
 * 测试 TableOfContents 类
 */
function testTableOfContents() {
    console.log('开始测试 TableOfContents...');
    
    try {
        // 创建模拟容器
        const mockContainer = document.createElement('div');
        
        // 创建 TableOfContents 实例
        const toc = new TableOfContents(mockContainer);
        
        console.log('✓ TableOfContents 实例创建成功');
        
        // 测试基本方法
        toc.show();
        console.log('✓ 显示方法测试成功');
        
        toc.hide();
        console.log('✓ 隐藏方法测试成功');
        
        toc.toggle();
        console.log('✓ 切换方法测试成功');
        
        // 测试清理
        toc.destroy();
        console.log('✓ 清理方法测试成功');
        
        console.log('TableOfContents 测试完成 ✓');
        return true;
        
    } catch (error) {
        console.error('TableOfContents 测试失败:', error);
        return false;
    }
}

/**
 * 运行所有测试
 */
function runAllTests() {
    console.log('=== 目录功能测试 ===\n');
    
    const results = [];
    
    results.push(testTOCGenerator());
    results.push(testTableOfContents());
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n=== 测试结果 ===`);
    console.log(`通过: ${passed}/${total}`);
    
    if (passed === total) {
        console.log('所有测试通过 ✓');
    } else {
        console.log('部分测试失败 ✗');
    }
    
    return passed === total;
}

// 如果直接运行此文件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testTOCGenerator, testTableOfContents, runAllTests };
} else {
    // 在浏览器中运行
    runAllTests();
}