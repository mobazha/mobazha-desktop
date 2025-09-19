 # Vue Chat 组件使用指南

## 概述

这是一个基于Vue 3和Element Plus的聊天模块，用于替换原有的Backbone.js聊天实现。

## 功能特性

- ✅ 基于Vue 3 Composition API
- ✅ 使用Element Plus UI组件
- ✅ Vuex状态管理
- ✅ 实时消息推送
- ✅ Emoji支持
- ✅ 消息格式化
- ✅ 未读消息提醒
- ✅ 响应式设计

## 组件结构

```
src/components/chat/
├── ChatContainer.vue    # 主聊天容器
├── ChatMessages.vue     # 消息列表组件
├── ChatMessage.vue      # 单条消息组件
├── ChatHead.vue         # 会话头部组件
└── README.md           # 使用说明
```

## 安装和使用

### 1. 在main.js中注册插件

```javascript
import ChatPlugin from './plugins/chat';

// 在Vue应用中使用
vueApp.use(ChatPlugin);
```

### 2. 在组件中使用

```vue
<template>
  <div>
    <!-- 聊天功能会自动挂载到页面 -->
    
    <!-- 可以通过全局方法控制聊天 -->
    <el-button @click="openChat">打开聊天</el-button>
    <el-button @click="sendMessage">发送消息</el-button>
  </div>
</template>

<script>
export default {
  methods: {
    openChat() {
      this.$chat.open();
    },
    
    async sendMessage() {
      await this.$chat.sendMessage('peerID', 'Hello World!');
    }
  }
}
</script>
```

## API 参考

### 全局方法

通过 `this.$chat` 访问：

- `open()` - 打开聊天窗口
- `close()` - 关闭聊天窗口
- `sendMessage(peerID, message)` - 发送消息
- `getConversations()` - 获取会话列表
- `selectConversation(conversation)` - 选择会话
- `getUnreadCount()` - 获取未读消息数
- `markAsRead(peerID)` - 标记会话为已读

### Vuex Store

聊天状态存储在 `chat` 模块中：

```javascript
// 获取状态
this.$store.getters['chat/conversations']
this.$store.getters['chat/currentConversation']
this.$store.getters['chat/unreadCount']

// 触发动作
this.$store.dispatch('chat/fetchConversations')
this.$store.dispatch('chat/sendMessage', { peerID, message })
this.$store.dispatch('chat/setCurrentConversation', conversation)
```

## 样式定制

聊天组件使用Element Plus的设计系统，可以通过CSS变量进行定制：

```css
:root {
  --el-color-primary: #409eff;
  --el-border-color: #e4e7ed;
  --el-text-color-primary: #303133;
}
```

## 迁移指南

### 从Backbone.js迁移

1. **移除旧的聊天代码**：
   - 删除 `backbone/views/chat/` 目录
   - 删除 `backbone/collections/ChatHeads.js`
   - 删除 `backbone/collections/ChatMessages.js`

2. **更新start.js**：
   ```javascript
   // 移除这些导入
   // import Chat from './views/chat/Chat';
   // import ChatHeads from './collections/ChatHeads';
   
   // 移除聊天初始化代码
   // const chatConvos = new ChatHeads();
   // app.chat = new Chat({ collection: chatConvos });
   ```

3. **添加新的聊天插件**：
   ```javascript
   import ChatPlugin from './plugins/chat';
   vueApp.use(ChatPlugin);
   ```

## 注意事项

1. **WebSocket连接**：确保在应用启动时正确初始化WebSocket连接
2. **消息处理**：新组件会自动处理消息格式化和emoji转换
3. **状态同步**：聊天状态通过Vuex管理，确保在页面刷新时正确恢复
4. **性能优化**：大量消息时建议实现虚拟滚动

## 故障排除

### 常见问题

1. **聊天窗口不显示**：
   - 检查是否正确注册了ChatPlugin
   - 确认DOM容器是否正确创建

2. **消息发送失败**：
   - 检查网络连接
   - 确认API端点是否正确

3. **WebSocket连接问题**：
   - 检查服务器连接状态
   - 确认WebSocket URL配置

## 更新日志

- v1.0.0 - 初始版本，基本聊天功能
- 支持消息发送/接收
- 支持会话管理
- 支持未读消息提醒