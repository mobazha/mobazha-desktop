# Web3店铺现代化重构设计文档

## 概述

本文档描述了Mobazha Web3店铺的现代化重构设计思想，旨在将现有的Vue 2 + Backbone.js架构升级为现代化的Vue 3 + Pinia架构，并深度集成Web3功能。

## 设计目标

### 1. 技术现代化
- 从Vue 2升级到Vue 3
- 从Vuex迁移到Pinia
- 移除Backbone.js依赖
- 采用Composition API
- 使用JavaScript（保持现有技术栈）

### 2. Web3深度集成
- 支持多种钱包连接（MetaMask、Phantom等）
- 集成Reown组件进行钱包管理
- 实现去中心化支付流程
- 支持多链交易

### 3. 用户体验优化
- 现代化UI设计
- 响应式布局
- 流畅的交互体验
- 直观的店铺管理界面

## 技术架构

### 核心技术栈
```
Vue 3.3+ + JavaScript + Element Plus + Pinia + Vue Router 4 + Web3集成
```

### 架构层次
```
┌─────────────────────────────────────┐
│           用户界面层 (UI Layer)      │
├─────────────────────────────────────┤
│          组件层 (Components)        │
├─────────────────────────────────────┤
│          状态管理层 (Pinia)         │
├─────────────────────────────────────┤
│          服务层 (Services)          │
├─────────────────────────────────────┤
│          API层 (HTTP/WebSocket)     │
├─────────────────────────────────────┤
│         Web3集成层 (Wallet)         │
└─────────────────────────────────────┘
```

## 状态管理设计

### Pinia Store架构

#### 1. 用户状态管理 (user.js)
```javascript
// 管理用户认证、个人信息、偏好设置
export const useUserStore = defineStore('user', () => {
  const profile = ref(null);
  const isAuthenticated = ref(false);
  const preferences = ref({});
  
  const login = async (credentials) => { /* ... */ };
  const logout = () => { /* ... */ };
  const updateProfile = async (data) => { /* ... */ };
  
  return { profile, isAuthenticated, preferences, login, logout, updateProfile };
});
```

#### 2. 钱包状态管理 (wallet.js)
```javascript
// 管理钱包连接、余额、收款账户
export const useWalletStore = defineStore('wallet', () => {
  const isConnected = ref(false);
  const walletAddress = ref('');
  const walletType = ref('');
  const balance = ref('0');
  const receivingAccounts = ref([]);
  
  const connectWallet = async (type) => { /* ... */ };
  const disconnectWallet = () => { /* ... */ };
  const fetchReceivingAccounts = async () => { /* ... */ };
  
  return { isConnected, walletAddress, balance, receivingAccounts, connectWallet };
});
```

#### 3. 店铺状态管理 (shop.js)
```javascript
// 管理商品、订单、分析数据
export const useShopStore = defineStore('shop', () => {
  const products = ref([]);
  const orders = ref([]);
  const analytics = ref({});
  
  const fetchProducts = async () => { /* ... */ };
  const createProduct = async (data) => { /* ... */ };
  const updateProduct = async (id, data) => { /* ... */ };
  
  return { products, orders, analytics, fetchProducts, createProduct };
});
```

#### 4. 市场状态管理 (marketplace.js)
```javascript
// 管理搜索、过滤、分类
export const useMarketplaceStore = defineStore('marketplace', () => {
  const searchResults = ref([]);
  const filters = ref({});
  const categories = ref([]);
  
  const searchProducts = async (query) => { /* ... */ };
  const applyFilters = async (filters) => { /* ... */ };
  
  return { searchResults, filters, categories, searchProducts, applyFilters };
});
```

#### 5. 购物车状态管理 (cart.js)
```javascript
// 管理购物车商品、数量、总价
export const useCartStore = defineStore('cart', () => {
  const items = ref([]);
  const total = computed(() => calculateTotal(items.value));
  
  const addItem = (product, quantity) => { /* ... */ };
  const removeItem = (productId) => { /* ... */ };
  const clearCart = () => { /* ... */ };
  
  return { items, total, addItem, removeItem, clearCart };
});
```

## 组件架构设计

### 1. 布局组件
```
layouts/
├── MainLayout.vue          # 主布局
├── ShopLayout.vue          # 店铺管理布局
├── MarketplaceLayout.vue   # 市场浏览布局
└── AuthLayout.vue          # 认证页面布局
```

### 2. 通用组件
```
components/
├── common/
│   ├── AppHeader.vue       # 应用头部
│   ├── AppSidebar.vue      # 侧边栏
│   ├── LoadingSpinner.vue  # 加载动画
│   ├── ErrorBoundary.vue   # 错误边界
│   └── ConfirmDialog.vue   # 确认对话框
├── ui/
│   ├── ProductCard.vue     # 商品卡片
│   ├── PriceDisplay.vue    # 价格显示
│   ├── RatingStars.vue     # 评分星级
│   └── ImageGallery.vue    # 图片画廊
└── forms/
    ├── ProductForm.vue     # 商品表单
    ├── OrderForm.vue       # 订单表单
    └── ProfileForm.vue     # 个人资料表单
```

### 3. 业务组件
```
components/
├── shop/
│   ├── ShopHeader.vue      # 店铺头部
│   ├── ProductGrid.vue     # 商品网格
│   ├── ProductDetail.vue   # 商品详情
│   ├── ShopStats.vue       # 店铺统计
│   ├── OrderList.vue       # 订单列表
│   └── Analytics.vue       # 数据分析
├── marketplace/
│   ├── SearchBar.vue       # 搜索栏
│   ├── FilterPanel.vue     # 过滤面板
│   ├── CategoryNav.vue     # 分类导航
│   ├── ProductList.vue     # 商品列表
│   └── SortOptions.vue     # 排序选项
├── wallet/
│   ├── WalletConnect.vue   # 钱包连接
│   ├── BalanceDisplay.vue  # 余额显示
│   ├── ReceivingAccounts.vue # 收款账户
│   └── TransactionHistory.vue # 交易历史
└── chat/
    ├── ChatContainer.vue   # 聊天容器
    ├── MessageList.vue     # 消息列表
    ├── MessageInput.vue    # 消息输入
    └── TypingIndicator.vue # 打字指示器
```

## 页面结构设计

### 1. 市场浏览页面
```
views/marketplace/
├── Home.vue               # 首页
├── Search.vue             # 搜索页
├── Category.vue           # 分类页
├── Product.vue            # 商品详情页
└── Shop.vue               # 店铺页面
```

### 2. 店铺管理页面
```
views/shop/
├── Dashboard.vue          # 店铺仪表板
├── Products.vue           # 商品管理
├── Orders.vue             # 订单管理
├── Analytics.vue          # 数据分析
├── Settings.vue           # 店铺设置
└── ReceivingAccounts.vue  # 收款账户管理
```

### 3. 用户中心页面
```
views/user/
├── Profile.vue            # 个人资料
├── Orders.vue             # 我的订单
├── Favorites.vue          # 收藏夹
├── Settings.vue           # 用户设置
└── Wallet.vue             # 钱包管理
```

## Web3集成设计

### 1. 钱包连接架构
```javascript
// 钱包连接服务
class WalletService {
  constructor() {
    this.supportedWallets = {
      metamask: 'MetaMask',
      phantom: 'Phantom',
      walletconnect: 'WalletConnect'
    };
  }
  
  async connect(walletType) {
    // 使用Reown组件连接钱包
    const result = await window.reown.connect(walletType);
    return result;
  }
  
  async disconnect() {
    await window.reown.disconnect();
  }
  
  async signMessage(message) {
    return await window.reown.signMessage(message);
  }
  
  async sendTransaction(transaction) {
    return await window.reown.sendTransaction(transaction);
  }
}
```

### 2. 支付流程设计
```javascript
// 支付服务
class PaymentService {
  async createOrder(orderData) {
    // 创建订单
    const order = await api.post('/v1/ob/purchases', orderData);
    return order;
  }
  
  async processPayment(orderId, paymentData) {
    // 处理支付
    const payment = await api.post('/v1/order/payment', {
      orderId,
      ...paymentData
    });
    return payment;
  }
  
  async confirmOrder(orderId) {
    // 确认订单
    const confirmation = await api.post('/v1/order/confirm', { orderId });
    return confirmation;
  }
}
```

### 3. 收款账户管理
```javascript
// 收款账户服务
class ReceivingAccountService {
  async getAccounts() {
    return await api.get('/v1/wallet/receivingaccountlist');
  }
  
  async addAccount(accountData) {
    return await api.post('/v1/wallet/receivingaccount', accountData);
  }
  
  async updateAccount(accountId, accountData) {
    return await api.put('/v1/wallet/receivingaccount', {
      id: accountId,
      ...accountData
    });
  }
  
  async deleteAccount(accountId) {
    return await api.delete(`/v1/wallet/receivingaccount/${accountId}`);
  }
}
```

## API适配设计

### 1. API服务层
```javascript
// API配置
const API_CONFIG = {
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// API端点映射
const API_ENDPOINTS = {
  // 钱包相关
  WALLET: {
    SPEND: '/v1/wallet/spend',
    MNEMONIC: '/v1/wallet/mnemonic',
    CURRENCIES: '/v1/wallet/currencies',
    RECEIVING_ACCOUNTS: '/v1/wallet/receivingaccountlist',
    ADD_RECEIVING_ACCOUNT: '/v1/wallet/receivingaccount',
    UPDATE_RECEIVING_ACCOUNT: '/v1/wallet/receivingaccount'
  },
  
  // Stripe支付
  STRIPE: {
    PUBLIC_KEY: '/v1/stripe/public-key',
    CONNECT_URL: '/v1/stripe/connect-url',
    ACCOUNT_STATUS: '/v1/stripe/account-status',
    PAYMENT_INTENT: '/v1/stripe/payment-intent',
    WEBHOOK: '/v1/stripe/webhook'
  },
  
  // 商品管理
  LISTINGS: {
    GET: '/v1/ob/listing/{listingID}',
    CREATE: '/v1/ob/listing',
    UPDATE: '/v1/ob/listing',
    DELETE: '/v1/ob/listing/{slug}',
    INDEX: '/v1/ob/listingindex/{peerID}'
  },
  
  // 订单管理
  ORDERS: {
    PURCHASES: '/v1/ob/purchases',
    SALES: '/v1/ob/sales',
    CASES: '/v1/ob/cases',
    ORDER_DETAIL: '/v1/ob/order/{orderID}',
    CASE_DETAIL: '/v1/ob/case/{orderID}'
  },
  
  // 聊天系统
  CHAT: {
    SEND_MESSAGE: '/v1/ob/chatmessage',
    GROUP_MESSAGE: '/v1/ob/groupchatmessage',
    TYPING: '/v1/ob/typingmessage',
    GROUP_TYPING: '/v1/ob/grouptypingmessage',
    MARK_READ: '/v1/ob/markchatasread',
    CONVERSATIONS: '/v1/ob/chatconversations',
    MESSAGES: '/v1/ob/chatmessages/{peerID}',
    GROUP_MESSAGES: '/v1/ob/groupchatmessages/{orderID}'
  }
};
```

### 2. HTTP客户端
```javascript
// HTTP客户端配置
import axios from 'axios';

const httpClient = axios.create(API_CONFIG);

// 请求拦截器
httpClient.interceptors.request.use(
  (config) => {
    // 添加认证头
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加节点选择头
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
    if (error.response?.status === 401) {
      // 处理认证失败
      store.dispatch('user/logout');
      router.push('/login');
    }
    return Promise.reject(error);
  }
);
```

## 路由设计

### 1. 路由配置
```javascript
const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/marketplace/Home.vue')
      },
      {
        path: 'marketplace',
        name: 'Marketplace',
        component: () => import('@/views/marketplace/Marketplace.vue')
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/marketplace/Search.vue')
      },
      {
        path: 'product/:id',
        name: 'Product',
        component: () => import('@/views/marketplace/Product.vue')
      },
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('@/views/shop/Shop.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/Orders.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/user/Profile.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'receiving-accounts',
        name: 'ReceivingAccounts',
        component: () => import('@/views/ReceivingAccounts.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/user/Settings.vue'),
        meta: { requiresAuth: true }
      }
    ]
  }
];
```

### 2. 路由守卫
```javascript
// 路由守卫配置
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  // 检查认证要求
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/');
    return;
  }
  
  // 检查钱包连接要求
  if (to.meta.requiresWallet && !walletStore.isConnected) {
    next('/wallet-connect');
    return;
  }
  
  next();
});
```

## 设计系统

### 1. 色彩系统
```scss
// 主色调
:root {
  --primary-color: #409eff;
  --primary-light: #79bbff;
  --primary-dark: #337ecc;
  
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  --info-color: #909399;
  
  // 中性色
  --text-primary: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --text-placeholder: #c0c4cc;
  
  // 背景色
  --bg-color: #ffffff;
  --bg-color-page: #f2f3f5;
  --bg-color-overlay: #ffffff;
  
  // 边框色
  --border-color: #dcdfe6;
  --border-color-light: #e4e7ed;
  --border-color-lighter: #ebeef5;
  --border-color-extra-light: #f2f6fc;
}
```

### 2. 间距系统
```scss
// 间距变量
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
}
```

### 3. 圆角系统
```scss
// 圆角变量
:root {
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-full: 50%;
}
```

### 4. 阴影系统
```scss
// 阴影变量
:root {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
}
```

## 响应式设计

### 1. 断点系统
```scss
// 断点变量
$breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
);

// 响应式混入
@mixin respond-to($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

### 2. 网格系统
```scss
// 12列网格系统
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--spacing-md);
}

@for $i from 1 through 12 {
  .col-#{$i} {
    grid-column: span $i;
  }
}

// 响应式列
@include respond-to(sm) {
  @for $i from 1 through 12 {
    .col-sm-#{$i} {
      grid-column: span $i;
    }
  }
}
```

## 性能优化策略

### 1. 代码分割
```javascript
// 路由级别的代码分割
const ShopDashboard = () => import('@/views/shop/Dashboard.vue');

// 组件级别的代码分割
const ProductCard = defineAsyncComponent(() => 
  import('@/components/shop/ProductCard.vue')
);
```

### 2. 虚拟滚动
```vue
<!-- 长列表优化 -->
<template>
  <el-virtual-list
    :data="products"
    :item-size="200"
    :height="600"
  >
    <template #default="{ item }">
      <ProductCard :product="item" />
    </template>
  </el-virtual-list>
</template>
```

### 3. 图片懒加载
```vue
<template>
  <el-image
    :src="product.image"
    lazy
    :preview-src-list="product.images"
  />
</template>
```

### 4. 缓存策略
```javascript
// API缓存
const cache = new Map();

const cachedApiCall = async (key, apiCall) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await apiCall();
  cache.set(key, result);
  return result;
};
```

## 迁移策略

### 第一阶段：基础架构 (1-2周)
1. 创建新的Vue 3项目结构
2. 配置Pinia状态管理
3. 设置路由系统
4. 集成Element Plus
5. 配置Web3集成

### 第二阶段：核心功能 (2-3周)
1. 迁移用户认证系统
2. 实现钱包连接功能
3. 创建收款账户管理
4. 重构导航栏
5. 迁移基础组件

### 第三阶段：业务功能 (3-4周)
1. 迁移商品管理
2. 重构订单系统
3. 优化聊天功能
4. 完善支付流程
5. 迁移搜索功能

### 第四阶段：优化和测试 (1-2周)
1. 性能优化
2. 用户体验改进
3. 全面测试
4. 部署上线
5. 文档完善

## 风险评估

### 1. 技术风险
- **Vue 3兼容性**: 部分第三方库可能不兼容Vue 3
- **Web3集成复杂性**: 多钱包支持可能增加复杂性
- **性能问题**: 大量数据渲染可能影响性能

### 2. 业务风险
- **用户体验**: 重构期间可能影响用户体验
- **数据迁移**: 现有数据迁移可能存在风险
- **功能缺失**: 重构过程中可能暂时缺失某些功能

### 3. 缓解措施
- 渐进式迁移，保持功能连续性
- 充分测试，确保数据安全
- 准备回滚方案，降低风险

## 总结

这个现代化重构方案将帮助Mobazha Web3店铺：

1. **技术升级**: 采用最新的Vue 3技术栈，提升开发效率和代码质量
2. **Web3集成**: 深度集成Web3功能，支持多钱包和多链交易
3. **用户体验**: 现代化的UI设计和流畅的交互体验
4. **可维护性**: 清晰的架构设计和模块化组件
5. **可扩展性**: 为未来功能扩展奠定良好基础

通过这个重构，Mobazha将成为一个真正的现代化Web3电商平台，为用户提供安全、便捷、高效的购物体验。 