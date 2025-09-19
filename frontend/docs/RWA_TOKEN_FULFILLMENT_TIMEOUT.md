# RWA Token 15分钟发货超时功能设计文档

## 功能概述

对于RWA Token商品，当卖家接受订单后，需要在15分钟内进行fulfill提供RWA Token，否则交易关闭并退款。计时从OrderConfirmation开始。

## 设计原则

1. **用户体验优先**：提供清晰的视觉反馈和倒计时显示
2. **渐进式警告**：根据剩余时间显示不同级别的警告
3. **实时更新**：每秒更新倒计时显示
4. **多语言支持**：支持中英文显示

## 技术实现

### 1. 倒计时逻辑

#### 时间计算
- **开始时间**：OrderConfirmation的timestamp
- **截止时间**：开始时间 + 15分钟
- **剩余时间**：截止时间 - 当前时间

#### 显示格式
- **格式**：MM:SS（分钟:秒）
- **示例**：14:59, 09:30, 00:45
- **更新频率**：每秒更新一次
- **动态更新**：实时显示剩余时间，包括秒数

#### 状态分类
- **正常状态** (normal)：剩余时间 > 10分钟
- **警告状态** (warning)：剩余时间 5-10分钟
- **紧急状态** (urgent)：剩余时间 < 5分钟
- **过期状态** (expired)：剩余时间 <= 0

### 2. UI组件实现

#### FulfillOrder.vue
- 在RWA Token发货页面顶部显示倒计时
- 实时更新剩余时间
- 根据状态显示不同的颜色和动画效果
- **订单完成后自动隐藏倒计时**

#### Summary.vue
- 在订单详情页面显示倒计时
- 只在卖家查看且订单已确认但未完成时显示
- 与发货页面保持一致的视觉风格
- **订单完成后自动隐藏倒计时**

### 3. 多语言支持

#### 英文翻译
```json
{
  "rwaFulfillmentTimeout": "RWA Token Fulfillment Timeout",
  "rwaFulfillmentTimeRemaining": "Time remaining to fulfill RWA Token:",
  "rwaFulfillmentExpired": "RWA Token fulfillment time has expired",
  "rwaFulfillmentExpiredMessage": "The 15-minute fulfillment window has expired. The order will be automatically cancelled and refunded.",
  "rwaFulfillmentUrgent": "Urgent: Complete RWA Token transfer within"
}
```

#### 中文翻译
```json
{
  "rwaFulfillmentTimeout": "RWA代币发货超时",
  "rwaFulfillmentTimeRemaining": "剩余发货时间：",
  "rwaFulfillmentExpired": "RWA代币发货时间已过期",
  "rwaFulfillmentExpiredMessage": "15分钟发货窗口已过期。订单将自动取消并退款。",
  "rwaFulfillmentUrgent": "紧急：请在以下时间内完成RWA代币转移"
}
```

### 4. 视觉设计

#### 颜色方案
- **正常状态**：绿色背景 (#e8f5e8)，绿色边框 (#28a745)
- **警告状态**：黄色背景 (#fff3cd)，黄色边框 (#ffc107)
- **紧急状态**：红色背景 (#f8d7da)，红色边框 (#dc3545)
- **过期状态**：红色背景 (#f8d7da)，红色边框 (#dc3545)

#### 动画效果
- **警告状态**：2秒脉冲动画
- **紧急状态**：1秒脉冲动画
- **过期状态**：无动画

### 5. 倒计时器实现

#### 定时器管理
```javascript
// 启动倒计时器
startRwaFulfillmentTimer() {
  if (!this.shouldShowRwaFulfillmentTimer) {
    this.stopRwaFulfillmentTimer();
    return;
  }

  this.stopRwaFulfillmentTimer(); // 先清除之前的定时器

  this.rwaFulfillmentTimer = setInterval(() => {
    // 只更新timerKey来触发倒计时显示更新，而不是整个组件
    this.rwaFulfillmentTimerKey++;
    
    // 如果时间已过期或订单已完成，停止定时器
    if (this.isRwaFulfillmentExpired || this.isOrderFulfilled) {
      this.stopRwaFulfillmentTimer();
    }
  }, 1000); // 每秒更新一次，确保秒数动态更新
}

// 停止倒计时器
stopRwaFulfillmentTimer() {
  if (this.rwaFulfillmentTimer) {
    clearInterval(this.rwaFulfillmentTimer);
    this.rwaFulfillmentTimer = null;
  }
}
```

#### 性能优化
```javascript
// 在data中添加响应式key
data() {
  return {
    rwaFulfillmentTimerKey: 0, // 倒计时器key，用于触发响应式更新
  };
}

// 计算属性依赖key来触发更新
rwaFulfillmentTimeRemainingFormatted() {
  // 依赖timerKey来触发响应式更新
  this.rwaFulfillmentTimerKey;
  
  // ... 时间计算逻辑
}

// 模板中使用key确保只有倒计时部分重新渲染
<span class="timeRemaining" :key="rwaFulfillmentTimerKey">
  {{ rwaFulfillmentTimeRemainingFormatted }}
</span>
```

#### 计算属性
```javascript
// 检查订单是否已完成fulfill
isOrderFulfilled() {
  if (this.model && this.model.get('orderFulfillments')) {
    return this.model.get('orderFulfillments').length > 0;
  }
  return false;
}

// 判断是否应该显示倒计时
shouldShowRwaFulfillmentTimer() {
  return this.isRwaTokenOrder && 
         this.orderConfirmationTime && 
         !this.isOrderFulfilled;
}

// 计算剩余时间
rwaFulfillmentTimeRemainingFormatted() {
  if (!this.rwaFulfillmentDeadline || this.isRwaFulfillmentExpired) {
    return null;
  }

  const remaining = this.rwaFulfillmentDeadline - Date.now();
  const minutes = Math.floor(remaining / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  
  // 确保秒数始终显示两位数，格式为 MM:SS
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 计算状态类名
rwaFulfillmentStatusClass() {
  if (this.isRwaFulfillmentExpired) {
    return 'expired';
  }
  
  const remaining = this.rwaFulfillmentDeadline - Date.now();
  if (remaining < 5 * 60 * 1000) { // 少于5分钟
    return 'urgent';
  } else if (remaining < 10 * 60 * 1000) { // 少于10分钟
    return 'warning';
  }
  return 'normal';
}
```

## 使用场景

### 1. 卖家发货页面
- 显示15分钟倒计时（格式：MM:SS）
- **实时动态更新秒数**
- 提供紧迫性提示
- 过期后显示自动取消信息
- **订单完成后自动隐藏倒计时**

### 2. 订单详情页面
- 卖家查看订单时显示倒计时（格式：MM:SS）
- **实时动态更新秒数**
- 买家查看时隐藏倒计时
- **订单完成后自动隐藏倒计时**

### 3. 订单状态变化
- **订单确认后**：开始显示15分钟倒计时
- **订单完成fulfill后**：立即隐藏倒计时，停止定时器
- **订单过期后**：显示过期信息，停止定时器

## 后续扩展

### 1. 后台自动处理
- 实现后台定时任务检查过期订单
- 自动取消过期订单并退款
- 发送通知给相关用户

### 2. 通知系统
- 时间即将到期时发送提醒通知
- 订单过期时发送取消通知
- 支持邮件、短信等多种通知方式

### 3. 配置化
- 支持不同商品类型设置不同的超时时间
- 支持卖家自定义超时时间
- 支持平台管理员调整全局超时设置

## 注意事项

1. **时区处理**：确保时间计算基于服务器时区
2. **性能优化**：
   - 使用响应式key而不是`$forceUpdate()`来更新倒计时
   - 只更新倒计时显示部分，避免整个组件重新渲染
   - 避免过多的定时器影响性能
3. **内存管理**：及时清理定时器避免内存泄漏
4. **用户体验**：提供清晰的视觉反馈和操作指引
