# RWA Marketplace API 接口文档

## 概述

本文档描述了RWA Marketplace智能合约与前端集成的API接口。

## 基础配置

### 1. 合约地址获取

#### GET /v1/rwa/marketplace/contract-address

获取RWA Marketplace合约地址。

**请求参数：**
- `network` (可选): 网络类型 (ethereum, bsc)
- `environment` (可选): 环境类型 (mainnet, testnet)

**响应示例：**
```json
{
  "success": true,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "network": "ethereum",
  "environment": "testnet"
}
```

### 2. 网络配置获取

#### GET /v1/rwa/marketplace/network-config

获取网络配置信息。

**请求参数：**
- `chainId` (必需): 链ID

**响应示例：**
```json
{
  "success": true,
  "config": {
    "chainId": 5,
    "name": "Ethereum Goerli Testnet",
    "rpcUrl": "https://goerli.infura.io/v3/YOUR_PROJECT_ID",
    "explorer": "https://goerli.etherscan.io",
    "marketplaceContract": "0x1234567890123456789012345678901234567890",
    "paymentTokens": {
      "ETH": "0x0000000000000000000000000000000000000000",
      "USDT": "0x110a13FC3efE6A245B50102d2d79B3E76125e83"
    }
  }
}
```

## 订单管理

### 3. 创建订单

#### POST /v1/rwa/marketplace/orders

创建RWA Token订单。

**请求体：**
```json
{
  "seller": "0x1234567890123456789012345678901234567890",
  "rwaTokenAddress": "0x1234567890123456789012345678901234567890",
  "paymentTokenAddress": "0x0000000000000000000000000000000000000000",
  "buyerReceiveAddress": "0x1234567890123456789012345678901234567890",
  "rwaTokenAmount": "100000000000000000000",
  "paymentAmount": "1000000000000000000",
  "buyerAddress": "0x1234567890123456789012345678901234567890"
}
```

**响应示例：**
```json
{
  "success": true,
  "orderId": "1",
  "transactionHash": "0x1234567890123456789012345678901234567890",
  "gasUsed": "150000",
  "effectiveGasPrice": "20000000000"
}
```

### 4. 获取订单信息

#### GET /v1/rwa/marketplace/orders/{orderId}

获取订单详细信息。

**响应示例：**
```json
{
  "success": true,
  "order": {
    "orderId": "1",
    "buyer": "0x1234567890123456789012345678901234567890",
    "seller": "0x1234567890123456789012345678901234567890",
    "rwaTokenAddress": "0x1234567890123456789012345678901234567890",
    "paymentTokenAddress": "0x0000000000000000000000000000000000000000",
    "buyerReceiveAddress": "0x1234567890123456789012345678901234567890",
    "rwaTokenAmount": "100000000000000000000",
    "paymentAmount": "1000000000000000000",
    "status": "PAID",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": null
  }
}
```

### 5. 发货完成

#### POST /v1/rwa/marketplace/orders/{orderId}/ship

卖家发货并完成交易。

**请求体：**
```json
{
  "sellerAddress": "0x1234567890123456789012345678901234567890",
  "rwaTokenAddress": "0x1234567890123456789012345678901234567890",
  "rwaTokenAmount": "100000000000000000000"
}
```

**响应示例：**
```json
{
  "success": true,
  "transactionHash": "0x1234567890123456789012345678901234567890",
  "gasUsed": "120000",
  "effectiveGasPrice": "20000000000"
}
```

### 6. 取消订单

#### POST /v1/rwa/marketplace/orders/{orderId}/cancel

取消订单。

**请求体：**
```json
{
  "cancelledBy": "0x1234567890123456789012345678901234567890"
}
```

**响应示例：**
```json
{
  "success": true,
  "transactionHash": "0x1234567890123456789012345678901234567890",
  "gasUsed": "80000",
  "effectiveGasPrice": "20000000000"
}
```

### 7. 获取买家订单列表

#### GET /v1/rwa/marketplace/orders/buyer/{buyerAddress}

获取买家的订单列表。

**响应示例：**
```json
{
  "success": true,
  "orders": [
    {
      "orderId": "1",
      "status": "PAID",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "orderId": "2",
      "status": "COMPLETED",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "completedAt": "2024-01-02T01:00:00.000Z"
    }
  ]
}
```

### 8. 获取卖家订单列表

#### GET /v1/rwa/marketplace/orders/seller/{sellerAddress}

获取卖家的订单列表。

**响应示例：**
```json
{
  "success": true,
  "orders": [
    {
      "orderId": "1",
      "status": "PAID",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## RWA Token管理

### 9. 获取RWA Token信息

#### GET /v1/rwa/marketplace/tokens/{tokenAddress}

获取RWA Token的详细信息。

**响应示例：**
```json
{
  "success": true,
  "token": {
    "address": "0x1234567890123456789012345678901234567890",
    "name": "Real Estate Token",
    "symbol": "RET",
    "decimals": 18,
    "underlyingAssetType": "Real Estate",
    "underlyingAssetId": "RE001",
    "complianceStatus": true,
    "kycRequired": true,
    "riskLevel": 3,
    "yieldRate": 500
  }
}
```

### 10. 验证KYC状态

#### GET /v1/rwa/marketplace/tokens/{tokenAddress}/kyc/{address}

检查地址的KYC验证状态。

**响应示例：**
```json
{
  "success": true,
  "isKYCVerified": true,
  "verificationDate": "2024-01-01T00:00:00.000Z"
}
```

## 事件监听

### 11. 获取合约事件

#### GET /v1/rwa/marketplace/events

获取合约事件列表。

**请求参数：**
- `fromBlock` (可选): 起始区块
- `toBlock` (可选): 结束区块
- `eventName` (可选): 事件名称

**响应示例：**
```json
{
  "success": true,
  "events": [
    {
      "eventName": "OrderCreated",
      "orderId": "1",
      "buyer": "0x1234567890123456789012345678901234567890",
      "seller": "0x1234567890123456789012345678901234567890",
      "rwaTokenAmount": "100000000000000000000",
      "paymentAmount": "1000000000000000000",
      "blockNumber": 12345,
      "transactionHash": "0x1234567890123456789012345678901234567890"
    }
  ]
}
```

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "余额不足",
    "details": {
      "required": "1000000000000000000",
      "available": "500000000000000000"
    }
  }
}
```

### 常见错误代码

- `INSUFFICIENT_BALANCE`: 余额不足
- `INVALID_ADDRESS`: 地址无效
- `ORDER_NOT_FOUND`: 订单不存在
- `INVALID_STATUS`: 订单状态无效
- `UNAUTHORIZED`: 未授权操作
- `NETWORK_ERROR`: 网络错误
- `CONTRACT_ERROR`: 合约调用错误

## 前端集成示例

### 初始化RWA Marketplace

```javascript
import { rwaMarketplaceService } from '@/services/rwaMarketplaceService';

// 初始化服务
await rwaMarketplaceService.initialize(
  walletProvider,
  walletAddress,
  'ethereum',
  contractAddress
);
```

### 创建订单

```javascript
const orderData = {
  seller: '0x1234567890123456789012345678901234567890',
  rwaTokenAddress: '0x1234567890123456789012345678901234567890',
  paymentTokenAddress: '0x0000000000000000000000000000000000000000',
  buyerReceiveAddress: '0x1234567890123456789012345678901234567890',
  rwaTokenAmount: '100000000000000000000',
  paymentAmount: '1000000000000000000'
};

const result = await rwaMarketplaceService.createOrderAndPay(orderData);
console.log('订单创建成功:', result.orderId);
```

### 发货完成

```javascript
const result = await rwaMarketplaceService.shipAndComplete(
  orderId,
  rwaTokenAddress,
  rwaTokenAmount
);
console.log('发货完成:', result.transactionHash);
```

### 监听事件

```javascript
rwaMarketplaceService.onContractEvent('OrderCreated', (orderId, buyer, seller, rwaTokenAmount, paymentAmount) => {
  console.log('新订单创建:', { orderId, buyer, seller, rwaTokenAmount, paymentAmount });
});

rwaMarketplaceService.onContractEvent('OrderCompleted', (orderId, buyer, seller, completedAt) => {
  console.log('订单完成:', { orderId, buyer, seller, completedAt });
});
```

## 部署说明

### 1. 合约部署

1. 编译RWA Marketplace合约
2. 部署到目标网络
3. 验证合约地址
4. 更新配置文件

### 2. 前端配置

1. 更新合约地址配置
2. 配置网络参数
3. 测试合约交互
4. 部署前端应用

### 3. 监控和维护

1. 监控合约事件
2. 处理异常情况
3. 更新合约地址
4. 性能优化 