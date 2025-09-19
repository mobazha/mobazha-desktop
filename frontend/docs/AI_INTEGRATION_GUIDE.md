# AI集成使用指南

## 🤖 概述

本系统集成了多种AI服务来增强聊天体验，包括智能意图分析、商品搜索和个性化回复生成。

## ✨ 支持的AI服务

### 1. Google Gemini
- **模型**: gemini-pro
- **优势**: 免费配额较高，响应速度快
- **获取API密钥**: https://makersuite.google.com/app/apikey

### 2. OpenAI GPT
- **模型**: gpt-3.5-turbo / gpt-4
- **优势**: 回复质量高，理解能力强
- **获取API密钥**: https://platform.openai.com/api-keys

### 3. Anthropic Claude
- **模型**: claude-3-sonnet-20240229
- **优势**: 安全性高，逻辑推理能力强
- **获取API密钥**: https://console.anthropic.com/account/keys



## 🛠 配置方法

### 方法一：环境变量配置
在项目根目录创建 `.env.local` 文件：

```bash
# Google Gemini
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI 
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Claude
VITE_CLAUDE_API_KEY=your_claude_api_key_here
```

### 方法二：界面配置
1. 点击聊天界面右上角的"AI设置"按钮
2. 选择AI服务提供商
3. 输入对应的API密钥
4. 测试连接并保存配置

## 🎯 AI功能详解

### 智能意图分析
- **识别购物意图**: 自动判断用户是否想要购买商品
- **提取关键信息**: 从用户输入中提取商品类别、品牌、价格等信息
- **生成搜索参数**: 自动构建最优的搜索查询

### 个性化回复生成
- **上下文理解**: 基于对话历史生成连贯回复
- **购物专业性**: 针对电商场景优化的回复风格
- **建议生成**: 智能生成相关的购物建议

### 商品推荐增强
- **智能描述**: AI生成的商品推荐文案
- **个性化建议**: 基于用户需求的精准推荐
- **套装方案**: 智能组合相关商品

## 📊 使用统计

系统会记录以下使用统计：
- **请求次数**: 每个AI服务的调用次数
- **Token消耗**: API使用的Token数量
- **最后使用时间**: 便于监控使用情况

## 🔧 高级配置

### 温度参数 (Temperature)
- **范围**: 0.0 - 1.0
- **推荐值**: 0.7
- **说明**: 控制AI回复的创造性，越高越有创意

### 最大回复长度 (Max Tokens)
- **范围**: 100 - 4000
- **推荐值**: 2048
- **说明**: 限制AI回复的最大长度

### 功能开关
- **意图分析**: 启用/禁用智能意图识别

## 💡 最佳实践

### 1. API密钥管理
```bash
# 推荐：使用环境变量
export VITE_GEMINI_API_KEY="your_key_here"

# 避免：硬编码在代码中
const apiKey = "AIzaSy..." // ❌ 不安全
```

### 2. 成本控制
- 优先使用免费额度较高的Gemini
- 设置合理的Token限制
- 监控使用统计

### 3. 错误处理
- 设置适当的超时时间
- 处理网络异常情况
- 配置重试机制

## 🚀 快速开始

### 1. 使用免费的Gemini服务
```bash
# 1. 获取Gemini API密钥
# 访问: https://makersuite.google.com/app/apikey

# 2. 配置环境变量
echo "VITE_GEMINI_API_KEY=your_key_here" >> .env.local

# 3. 重启开发服务器
npm run dev
```

### 2. 测试AI功能
1. 打开SmartHome聊天界面
2. 点击"AI设置"查看服务状态
3. 发送消息："我想买个手机"
4. 观察AI的智能回复和商品搜索

## 🔍 故障排除

### 常见问题

**Q: AI服务显示"连接失败"**
A: 检查API密钥格式、网络连接和服务额度

**Q: 回复质量不理想**
A: 调整温度参数或尝试不同的AI服务

**Q: 响应速度慢**
A: 减少最大Token数量或检查网络状况

**Q: 意图识别不准确**
A: 调整提示词参数或尝试不同的AI服务

### 调试技巧
- 查看浏览器控制台的详细日志
- 使用"测试连接"功能验证配置
- 检查使用统计了解服务状态

## 📈 扩展开发

### 添加新的AI服务
1. 在 `ai-services.js` 中继承 `AIServiceBase`
2. 实现 `chat` 和 `analyzeIntent` 方法
3. 在工厂中注册新服务
4. 更新配置管理器

### 自定义提示词
修改 `buildIntentAnalysisPrompt` 方法来优化意图分析效果

### 集成其他功能
- 语音识别
- 图片理解
- 多语言支持

## 📝 API参考

### AIServiceManager
```javascript
// 初始化
const manager = new AIServiceManager(config)

// 意图分析
const intent = await manager.analyzeIntent(userInput, context)

// 对话生成
const response = await manager.chat(messages, options)

// 获取状态
const status = manager.getActiveProvider()
```

### 配置结构
```javascript
const config = {
  activeProvider: 'gemini',
  gemini: {
    apiKey: 'your_key',
    model: 'gemini-pro',
    temperature: 0.7
  },
  features: {
    intentAnalysis: true
  }
}
```

## 🤝 贡献指南

欢迎提交Pull Request来改进AI集成功能：
- 添加新的AI服务支持
- 优化提示词模板
- 改进错误处理
- 增强用户体验

## 📄 许可证

本AI集成功能遵循项目的开源许可证。使用第三方AI服务时请遵守相应的服务条款。 