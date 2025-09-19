# API适配指南

## 概述

本文档详细说明了如何将现有的后端API适配到新的Vue 3 + Pinia架构中，确保功能完整性和数据一致性。

## 后端API分析

基于`gateway.go`文件分析，后端提供以下主要API模块：

### 1. 钱包相关API
```javascript
// 钱包基础功能
GET  /v1/wallet/mnemonic          // 获取助记词
GET  /v1/wallet/currencies        // 获取支持的货币

// 收款账户管理
GET  /v1/wallet/receivingaccountlist    // 获取收款账户列表
POST /v1/wallet/receivingaccount        // 添加收款账户
PUT  /v1/wallet/receivingaccount        // 更新收款账户
```

### 2. Stripe支付API
```javascript
GET  /v1/stripe/public-key        // 获取Stripe公钥
GET  /v1/stripe/connect-url       // 获取Stripe连接URL
GET  /v1/stripe/account-status    // 获取账户状态
POST /v1/stripe/payment-intent    // 创建支付意图
POST /v1/stripe/webhook           // Stripe webhook处理
```

### 3. 商品管理API
```javascript
GET  /v1/ob/listing/{listingID}   // 获取商品详情
GET  /v1/ob/listing/{peerID}/{slug} // 根据用户和slug获取商品
POST /v1/ob/listing               // 创建商品
PUT  /v1/ob/listing               // 更新商品
DELETE /v1/ob/listing/{slug}      // 删除商品
GET  /v1/ob/listingindex/{peerID} // 获取用户商品列表
GET  /v1/ob/listingindex          // 获取所有商品索引
```

### 4. 订单管理API
```javascript
// 订单基础操作
POST /v1/ob/purchases             // 创建购买订单
GET  /v1/ob/purchases             // 获取购买订单列表
GET  /v1/ob/sales                 // 获取销售订单列表
GET  /v1/ob/cases                 // 获取纠纷案例列表
POST /v1/ob/cases                 // 创建纠纷案例

// 订单详情
GET  /v1/ob/order/{orderID}       // 获取订单详情
GET  /v1/ob/case/{orderID}        // 获取纠纷详情

// 订单操作
POST /v1/ob/ordercancel           // 取消订单
POST /v1/ob/orderspend            // 订单支付
POST /v1/order/payment            // 处理支付
POST /v1/order/confirm            // 确认订单
POST /v1/order/fulfill            // 履行订单
POST /v1/order/refund             // 退款
POST /v1/order/complete           // 完成订单
```

### 5. 聊天系统API
```javascript
// 消息发送
POST /v1/ob/chatmessage           // 发送私聊消息
POST /v1/ob/groupchatmessage      // 发送群聊消息
POST /v1/ob/typingmessage         // 发送打字指示
POST /v1/ob/grouptypingmessage    // 发送群聊打字指示

// 消息获取
GET  /v1/ob/chatconversations     // 获取对话列表
GET  /v1/ob/chatmessages/{peerID} // 获取私聊消息
GET  /v1/ob/groupchatmessages/{orderID} // 获取群聊消息

// 消息管理
POST /v1/ob/markchatasread        // 标记消息已读
DELETE /v1/ob/chatmessage/{messageID} // 删除消息
DELETE /v1/ob/groupchatmessages/{orderID} // 删除群聊消息
DELETE /v1/ob/chatconversation/{peerID} // 删除对话
```

### 6. 用户管理API
```javascript
// 用户资料
GET  /v1/ob/profile/{peerID}      // 获取用户资料
POST /v1/ob/profile               // 创建/更新用户资料
PUT  /v1/ob/profile               // 更新用户资料

// 关注系统
GET  /v1/ob/followers/{peerID}    // 获取粉丝列表
GET  /v1/ob/following/{peerID}    // 获取关注列表
POST /v1/ob/follow/{peerID}       // 关注用户
POST /v1/ob/unfollow/{peerID}     // 取消关注
GET  /v1/ob/followsme/{peerID}    // 检查是否被关注
```

## API适配实现

### 1. API客户端配置

```javascript
// services/api.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

// API基础配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// 创建axios实例
const httpClient = axios.create(API_CONFIG);

// 请求拦截器
httpClient.interceptors.request.use(
  (config) => {
    // 添加认证头
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加节点选择头（支持多节点）
    const nodeId = localStorage.getItem('selected_node');
    if (nodeId) {
      config.headers['X-Mobazha-Node'] = nodeId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 统一错误处理
    const status = error.response?.status;
    const message = error.response?.data?.message || '操作失败';
    
    switch (status) {
      case 401:
        // 认证失败，清除本地存储并跳转登录
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_profile');
        window.location.href = '/';
        ElMessage.error('登录已过期，请重新登录');
        break;
      case 403:
        ElMessage.error('没有权限执行此操作');
        break;
      case 404:
        ElMessage.error('请求的资源不存在');
        break;
      case 500:
        ElMessage.error('服务器错误，请稍后重试');
        break;
      default:
        ElMessage.error(message);
    }
    
    return Promise.reject(error);
  }
);
```

### 2. API服务模块

```javascript
// services/wallet.js
import httpClient from './api';

export const walletApi = {
  // 获取助记词
  getMnemonic: () => httpClient.get('/v1/wallet/mnemonic'),
  
  // 发送交易
  spend: (data) => httpClient.post('/v1/wallet/spend', data),
  
  // 获取支持的货币
  getCurrencies: () => httpClient.get('/v1/wallet/currencies'),
  
  // 收款账户管理
  getReceivingAccounts: () => httpClient.get('/v1/wallet/receivingaccountlist'),
  addReceivingAccount: (data) => httpClient.post('/v1/wallet/receivingaccount', data),
  updateReceivingAccount: (id, data) => httpClient.put('/v1/wallet/receivingaccount', { id, ...data }),
  deleteReceivingAccount: (id) => httpClient.delete(`/v1/wallet/receivingaccount/${id}`)
};

// services/stripe.js
export const stripeApi = {
  getPublicKey: () => httpClient.get('/v1/stripe/public-key'),
  getConnectUrl: () => httpClient.get('/v1/stripe/connect-url'),
  getAccountStatus: () => httpClient.get('/v1/stripe/account-status'),
  createPaymentIntent: (data) => httpClient.post('/v1/stripe/payment-intent', data),
  handleWebhook: (data) => httpClient.post('/v1/stripe/webhook', data)
};

// services/listings.js
export const listingsApi = {
  get: (id) => httpClient.get(`/v1/ob/listing/${id}`),
  getByUserAndSlug: (peerId, slug) => httpClient.get(`/v1/ob/listing/${peerId}/${slug}`),
  create: (data) => httpClient.post('/v1/ob/listing', data),
  update: (data) => httpClient.put('/v1/ob/listing', data),
  delete: (slug) => httpClient.delete(`/v1/ob/listing/${slug}`),
  getIndex: (peerId) => httpClient.get(`/v1/ob/listingindex/${peerId}`),
  getAllIndex: () => httpClient.get('/v1/ob/listingindex')
};

// services/orders.js
export const ordersApi = {
  // 订单基础操作
  createPurchase: (data) => httpClient.post('/v1/ob/purchases', data),
  getPurchases: (params) => httpClient.get('/v1/ob/purchases', { params }),
  getSales: (params) => httpClient.get('/v1/ob/sales', { params }),
  getCases: (params) => httpClient.get('/v1/ob/cases', { params }),
  createCase: (data) => httpClient.post('/v1/ob/cases', data),
  
  // 订单详情
  getOrderDetail: (orderId) => httpClient.get(`/v1/ob/order/${orderId}`),
  getCaseDetail: (orderId) => httpClient.get(`/v1/ob/case/${orderId}`),
  
  // 订单操作
  cancelOrder: (data) => httpClient.post('/v1/ob/ordercancel', data),
  spendForOrder: (data) => httpClient.post('/v1/ob/orderspend', data),
  processPayment: (data) => httpClient.post('/v1/order/payment', data),
  confirmOrder: (data) => httpClient.post('/v1/order/confirm', data),
  fulfillOrder: (data) => httpClient.post('/v1/order/fulfill', data),
  refundOrder: (data) => httpClient.post('/v1/order/refund', data),
  completeOrder: (data) => httpClient.post('/v1/order/complete', data)
};

// services/chat.js
export const chatApi = {
  // 消息发送
  sendMessage: (data) => httpClient.post('/v1/ob/chatmessage', data),
  sendGroupMessage: (data) => httpClient.post('/v1/ob/groupchatmessage', data),
  sendTyping: (data) => httpClient.post('/v1/ob/typingmessage', data),
  sendGroupTyping: (data) => httpClient.post('/v1/ob/grouptypingmessage', data),
  
  // 消息获取
  getConversations: () => httpClient.get('/v1/ob/chatconversations'),
  getMessages: (peerId, params) => httpClient.get(`/v1/ob/chatmessages/${peerId}`, { params }),
  getGroupMessages: (orderId, params) => httpClient.get(`/v1/ob/groupchatmessages/${orderId}`, { params }),
  
  // 消息管理
  markAsRead: (data) => httpClient.post('/v1/ob/markchatasread', data),
  deleteMessage: (messageId) => httpClient.delete(`/v1/ob/chatmessage/${messageId}`),
  deleteGroupMessages: (orderId) => httpClient.delete(`/v1/ob/groupchatmessages/${orderId}`),
  deleteConversation: (peerId) => httpClient.delete(`/v1/ob/chatconversation/${peerId}`)
};

// services/user.js
export const userApi = {
  // 用户资料
  getProfile: (peerId) => httpClient.get(`/v1/ob/profile/${peerId}`),
  createProfile: (data) => httpClient.post('/v1/ob/profile', data),
  updateProfile: (data) => httpClient.put('/v1/ob/profile', data),
  
  // 关注系统
  getFollowers: (peerId) => httpClient.get(`/v1/ob/followers/${peerId}`),
  getFollowing: (peerId) => httpClient.get(`/v1/ob/following/${peerId}`),
  follow: (peerId) => httpClient.post(`/v1/ob/follow/${peerId}`),
  unfollow: (peerId) => httpClient.post(`/v1/ob/unfollow/${peerId}`),
  checkFollowsMe: (peerId) => httpClient.get(`/v1/ob/followsme/${peerId}`)
};
```

### 3. Pinia Store集成

```javascript
// stores/wallet.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { walletApi, stripeApi } from '@/services';

export const useWalletStore = defineStore('wallet', () => {
  const receivingAccounts = ref([]);
  const loading = ref(false);

  const fetchReceivingAccounts = async () => {
    loading.value = true;
    try {
      const response = await walletApi.getReceivingAccounts();
      receivingAccounts.value = response.data;
      return response;
    } catch (error) {
      console.error('Failed to fetch receiving accounts:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addReceivingAccount = async (accountData) => {
    loading.value = true;
    try {
      const response = await walletApi.addReceivingAccount(accountData);
      receivingAccounts.value.push(response.data);
      return response;
    } catch (error) {
      console.error('Failed to add receiving account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    receivingAccounts,
    loading,
    fetchReceivingAccounts,
    addReceivingAccount
  };
});

// stores/shop.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { listingsApi } from '@/services';

export const useShopStore = defineStore('shop', () => {
  const products = ref([]);
  const loading = ref(false);

  const fetchProducts = async (peerId) => {
    loading.value = true;
    try {
      const response = await listingsApi.getIndex(peerId);
      products.value = response.data;
      return response;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createProduct = async (productData) => {
    loading.value = true;
    try {
      const response = await listingsApi.create(productData);
      products.value.push(response.data);
      return response;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    loading,
    fetchProducts,
    createProduct
  };
});
```

## WebSocket集成

### 1. WebSocket连接管理

```javascript
// services/websocket.js
class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(nodeId = null) {
    const wsUrl = nodeId 
      ? `ws://localhost:8080/ws/${nodeId}`
      : 'ws://localhost:8080/ws';
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(data) {
    // 处理不同类型的消息
    if (data.chatMessage) {
      // 处理聊天消息
      this.emit('chatMessage', data.chatMessage);
    } else if (data.messageTyping) {
      // 处理打字指示
      this.emit('typing', data.messageTyping);
    } else if (data.orderUpdate) {
      // 处理订单更新
      this.emit('orderUpdate', data.orderUpdate);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  emit(event, data) {
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

export default new WebSocketService();
```

### 2. 在组件中使用WebSocket

```javascript
// components/chat/ChatContainer.vue
import { onMounted, onUnmounted } from 'vue';
import WebSocketService from '@/services/websocket';

export default {
  setup() {
    const handleChatMessage = (event) => {
      const message = event.detail;
      // 处理新消息
      console.log('New chat message:', message);
    };

    const handleTyping = (event) => {
      const typing = event.detail;
      // 处理打字指示
      console.log('User typing:', typing);
    };

    onMounted(() => {
      // 连接WebSocket
      WebSocketService.connect();
      
      // 监听事件
      window.addEventListener('chatMessage', handleChatMessage);
      window.addEventListener('typing', handleTyping);
    });

    onUnmounted(() => {
      // 清理事件监听
      window.removeEventListener('chatMessage', handleChatMessage);
      window.removeEventListener('typing', handleTyping);
      
      // 断开WebSocket连接
      WebSocketService.disconnect();
    });
  }
};
```

## 数据格式适配

### 1. 请求数据格式

```javascript
// 商品创建请求
const createListingRequest = {
  title: "商品标题",
  description: "商品描述",
  price: {
    amount: 100,
    currencyCode: "BTC"
  },
  images: [
    {
      filename: "image1.jpg",
      image: "base64_encoded_image_data"
    }
  ],
  tags: ["tag1", "tag2"],
  categories: ["electronics"],
  condition: "new",
  format: "PHYSICAL_GOOD"
};

// 订单创建请求
const createOrderRequest = {
  listingId: "listing_id",
  quantity: 1,
  shippingAddress: {
    name: "收货人姓名",
    address: "收货地址",
    city: "城市",
    state: "省份",
    postalCode: "邮编",
    country: "国家"
  },
  paymentMethod: {
    type: "crypto",
    currency: "BTC"
  }
};
```

### 2. 响应数据格式

```javascript
// 商品响应数据
const listingResponse = {
  id: "listing_id",
  title: "商品标题",
  description: "商品描述",
  price: {
    amount: 100,
    currencyCode: "BTC"
  },
  images: [
    {
      filename: "image1.jpg",
      hash: "image_hash"
    }
  ],
  vendor: {
    peerID: "vendor_id",
    name: "卖家名称",
    avatarHashes: {
      tiny: "avatar_hash_tiny",
      small: "avatar_hash_small",
      medium: "avatar_hash_medium",
      large: "avatar_hash_large",
      original: "avatar_hash_original"
    }
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
};

// 订单响应数据
const orderResponse = {
  id: "order_id",
  listing: listingResponse,
  buyer: {
    peerID: "buyer_id",
    name: "买家名称"
  },
  vendor: {
    peerID: "vendor_id",
    name: "卖家名称"
  },
  quantity: 1,
  total: {
    amount: 100,
    currencyCode: "BTC"
  },
  status: "PENDING",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
};
```

## 错误处理

### 1. 统一错误处理

```javascript
// utils/errorHandler.js
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    throw new ApiError(data.message || '请求失败', status, data.code);
  } else if (error.request) {
    throw new ApiError('网络连接失败', 0, 'NETWORK_ERROR');
  } else {
    throw new ApiError(error.message, 0, 'UNKNOWN_ERROR');
  }
};
```

### 2. 在Store中使用错误处理

```javascript
// stores/shop.js
import { handleApiError } from '@/utils/errorHandler';

export const useShopStore = defineStore('shop', () => {
  const error = ref(null);

  const fetchProducts = async (peerId) => {
    try {
      error.value = null;
      const response = await listingsApi.getIndex(peerId);
      products.value = response.data;
      return response;
    } catch (err) {
      error.value = handleApiError(err);
      throw error.value;
    }
  };

  return {
    error,
    fetchProducts
  };
});
```

## 总结

这个API适配指南提供了完整的后端API集成方案，包括：

1. **完整的API映射**: 覆盖所有后端接口
2. **统一的错误处理**: 提供一致的错误处理机制
3. **WebSocket集成**: 支持实时通信
4. **数据格式适配**: 确保前后端数据一致性
5. **状态管理集成**: 与Pinia Store完美结合

通过这些适配，可以确保新架构与现有后端API的完美兼容，同时提供更好的开发体验和用户体验。 