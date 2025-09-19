# RWA Token 集成指南

## 概述

本文档描述了如何在Mobazha平台中集成RWA Token（Real-World Asset Token）交易功能。该功能允许买家创建订单并付款，卖家发货后完成交易。

## 功能特性

### 买家功能
- ✅ 创建RWA Token订单并付款
- ✅ 支持ETH和ERC20代币支付
- ✅ 选择收款账户
- ✅ 查看订单状态和交易哈希

### 卖家功能
- ✅ 发货并完成RWA Token交易
- ✅ 调用智能合约转移代币
- ✅ 查看交易状态和Gas使用量

## 技术架构

### 核心组件

1. **RWA Marketplace Service** (`src/services/rwaMarketplaceService.js`)
   - 处理与智能合约的交互
   - 管理订单创建、发货、取消等操作
   - 错误处理和状态管理

2. **Purchase Component** (`src/views/modals/purchase/Purchase.vue`)
   - 买家订单创建界面
   - 支付方式选择
   - 收款账户配置

3. **FulfillOrder Component** (`src/views/modals/orderDetail/FulfillOrder.vue`)
   - 卖家发货界面
   - RWA Token充值功能
   - 交易状态显示

### 智能合约集成

#### 合约地址配置
```javascript
// 从后端获取合约地址
const response = await myGet('/v1/rwa/marketplace/contract-address');
const contractAddress = response.contractAddress;
```

#### 初始化服务
```javascript
await rwaMarketplaceService.initialize(
  walletProvider,
  walletAddress,
  'ethereum',
  contractAddress
);
```

## 使用流程

### 买家购买流程

1. **选择商品**
   - 浏览RWA Token商品
   - 选择购买数量
   - 确认价格和支付方式

2. **配置收款账户**
   - 选择接收RWA Token的账户
   - 确保账户与代币在同一区块链

3. **创建订单**
   ```javascript
   const orderData = {
     seller: sellerAddress,
     rwaTokenAddress: tokenAddress,
     paymentTokenAddress: paymentTokenAddress,
     buyerReceiveAddress: buyerAddress,
     rwaTokenAmount: amount,
     paymentAmount: paymentAmount
   };
   
   const result = await rwaMarketplaceService.createOrderAndPay(orderData);
   ```

4. **完成支付**
   - 授权代币（如需要）
   - 执行交易
   - 等待确认

### 卖家发货流程

1. **准备发货**
   - 查看订单详情
   - 确认RWA Token地址和数量

2. **执行发货**
   ```javascript
   const result = await rwaMarketplaceService.shipAndComplete(
     orderId,
     rwaTokenAddress,
     rwaTokenAmount
   );
   ```

3. **完成交易**
   - 代币转移给买家
   - 卖家收到付款（扣除平台费用）
   - 订单状态更新

## API 接口

### 订单管理

#### 创建订单并付款
```javascript
async createOrderAndPay(orderData) {
  // 生成唯一订单ID
  const orderId = this.generateOrderId('ORDER', buyerAddress, seller);
  
  // 调用合约方法
  const transaction = await this.contract.createOrderAndPay(
    orderId,
    seller,
    rwaTokenAddress,
    paymentTokenAddress,
    buyerReceiveAddress,
    rwaTokenAmount,
    paymentAmount,
    { value: paymentAmount } // ETH支付时
  );
}
```

#### 发货并完成交易
```javascript
async shipAndComplete(orderId, rwaTokenAddress, rwaTokenAmount) {
  // 授权代币
  await this.approveRWAToken(rwaTokenAddress, rwaTokenAmount);
  
  // 执行发货
  const transaction = await this.contract.shipAndComplete(orderId);
}
```

#### 获取订单信息
```javascript
async getOrder(orderId) {
  const order = await this.contract.getOrder(orderId);
  return {
    buyer: order.buyer,
    seller: order.seller,
    status: this.getOrderStatus(order.status),
    // ... 其他字段
  };
}
```

### 代币管理

#### 授权支付代币
```javascript
async approvePaymentToken(tokenAddress, amount) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, this.signer);
  const transaction = await tokenContract.approve(this.contract.address, amount);
  await transaction.wait();
}
```

#### 授权RWA Token
```javascript
async approveRWAToken(tokenAddress, amount) {
  const tokenContract = new ethers.Contract(tokenAddress, RWATokenABI, this.signer);
  const transaction = await tokenContract.approve(this.contract.address, amount);
  await transaction.wait();
}
```

## 错误处理

### 常见错误类型

1. **用户拒绝交易**
   ```javascript
   if (error.code === 4001) {
     message = '用户拒绝交易';
   }
   ```

2. **余额不足**
   ```javascript
   if (error.message.includes('insufficient funds')) {
     message = '余额不足';
   }
   ```

3. **订单ID已存在**
   ```javascript
   if (error.message.includes('Order ID already exists')) {
     message = '订单ID已存在，请重试';
   }
   ```

4. **权限不足**
   ```javascript
   if (error.message.includes('Not the buyer')) {
     message = '只有买家可以执行此操作';
   }
   ```

### 错误处理最佳实践

```javascript
try {
  const result = await rwaMarketplaceService.createOrderAndPay(orderData);
  console.log('✅ 订单创建成功:', result);
} catch (error) {
  console.error('❌ 订单创建失败:', error);
  ElMessage.error(error.message || '订单创建失败');
}
```

## 多语言支持

### 中文翻译
```json
{
  "purchase": {
    "rwaToken": {
      "title": "RWA代币购买",
      "description": "购买真实世界资产代币",
      "tokenInfo": "代币信息",
      "blockchain": "区块链",
      "tokenAddress": "代币地址",
      "tokenAmount": "代币数量",
      "paymentMethod": "支付方式",
      "receivingAccount": "收款账户",
      "orderStatus": "订单状态",
      "transactionHash": "交易哈希",
      "gasUsed": "Gas使用量"
    }
  }
}
```

### 英文翻译
```json
{
  "purchase": {
    "rwaToken": {
      "title": "RWA Token Purchase",
      "description": "Purchase Real World Asset Tokens",
      "tokenInfo": "Token Information",
      "blockchain": "Blockchain",
      "tokenAddress": "Token Address",
      "tokenAmount": "Token Amount",
      "paymentMethod": "Payment Method",
      "receivingAccount": "Receiving Account",
      "orderStatus": "Order Status",
      "transactionHash": "Transaction Hash",
      "gasUsed": "Gas Used"
    }
  }
}
```

## 测试

### 运行测试
```javascript
import { testRWAMarketplaceService } from './services/rwaMarketplaceService.test.js';

// 在浏览器控制台中运行
testRWAMarketplaceService();
```

### 测试覆盖范围
- ✅ 订单ID生成
- ✅ 参数验证
- ✅ 错误处理
- ✅ 合约方法调用
- ✅ 事件监听

## 部署注意事项

### 环境配置
1. 确保智能合约已部署
2. 配置正确的合约地址
3. 设置网络环境（测试网/主网）

### 安全考虑
1. 验证合约地址的有效性
2. 检查用户钱包连接状态
3. 处理交易失败的情况
4. 保护用户私钥安全

### 性能优化
1. 使用适当的Gas限制
2. 优化交易确认时间
3. 实现错误重试机制
4. 缓存合约状态

## 故障排除

### 常见问题

1. **合约初始化失败**
   - 检查网络连接
   - 验证合约地址
   - 确认钱包连接状态

2. **交易失败**
   - 检查余额是否充足
   - 确认Gas费用设置
   - 验证代币授权状态

3. **订单状态异常**
   - 检查订单ID格式
   - 确认交易确认状态
   - 验证合约事件

### 调试工具
```javascript
// 启用详细日志
console.log('RWA Marketplace Debug:', {
  contractAddress,
  walletAddress,
  networkType,
  orderData
});
```

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 实现基本的RWA Token购买功能
- ✅ 支持ETH和ERC20代币支付
- ✅ 添加卖家发货功能
- ✅ 集成智能合约交互
- ✅ 实现错误处理和状态管理
- ✅ 添加多语言支持

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request
