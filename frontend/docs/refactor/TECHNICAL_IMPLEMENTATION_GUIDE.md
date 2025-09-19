# Web3店铺技术实现指南

## 概述

本文档提供了Mobazha Web3店铺现代化重构的详细技术实现指南，包括具体的代码示例、配置文件和实现步骤。

## 项目结构

### 新的项目目录结构
```
frontend/
├── src/
│   ├── main.js                 # 应用入口
│   ├── App.vue                 # 根组件
│   ├── router/
│   │   ├── index.js           # 路由配置
│   │   └── routes.js          # 路由定义
│   ├── stores/                # Pinia状态管理
│   │   ├── index.js           # Store入口
│   │   ├── user.js            # 用户状态
│   │   ├── wallet.js          # 钱包状态
│   │   ├── shop.js            # 店铺状态
│   │   ├── marketplace.js     # 市场状态
│   │   └── cart.js            # 购物车状态
│   ├── services/              # 服务层
│   │   ├── api.js             # API客户端
│   │   ├── wallet.js          # 钱包服务
│   │   ├── payment.js         # 支付服务
│   │   └── chat.js            # 聊天服务
│   ├── components/            # 组件
│   │   ├── common/            # 通用组件
│   │   ├── shop/              # 店铺组件
│   │   ├── marketplace/       # 市场组件
│   │   ├── wallet/            # 钱包组件
│   │   └── chat/              # 聊天组件
│   ├── views/                 # 页面
│   │   ├── marketplace/       # 市场页面
│   │   ├── shop/              # 店铺页面
│   │   ├── user/              # 用户页面
│   │   └── auth/              # 认证页面
│   ├── layouts/               # 布局组件
│   ├── utils/                 # 工具函数
│   ├── styles/                # 样式文件
│   └── assets/                # 静态资源
├── public/                    # 公共资源
├── docs/                      # 文档
├── package.json               # 依赖配置
├── vite.config.js             # Vite配置
└── .env                       # 环境变量
```

## 核心配置

### 1. 主入口文件 (main.js)
```javascript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import router from './router';
import App from './App.vue';

// 创建应用实例
const app = createApp(App);

// 安装插件
app.use(createPinia());
app.use(router);
app.use(ElementPlus);

// 挂载应用
app.mount('#app');
```

### 2. Pinia Store配置 (stores/index.js)
```javascript
import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;
```

### 3. 路由配置 (router/index.js)
```javascript
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const walletStore = useWalletStore();
  
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

export default router;
```

## 状态管理实现

### 1. 用户状态管理 (stores/user.js)
```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userApi } from '@/services/api';

export const useUserStore = defineStore('user', () => {
  // 状态
  const profile = ref(null);
  const isAuthenticated = ref(false);
  const preferences = ref({});
  const avatarHashes = ref(null);
  const headerHashes = ref(null);
  const loading = ref(false);

  // 计算属性
  const userDisplayName = computed(() => profile.value?.name || 'Anonymous');
  const userAvatar = computed(() => {
    if (!avatarHashes.value) return null;
    return `/api/v1/ob/avatar/${profile.value?.id}/large`;
  });
  const userHeader = computed(() => {
    if (!headerHashes.value) return null;
    return `/api/v1/ob/header/${profile.value?.id}/large`;
  });

  // 方法
  const login = async (credentials) => {
    loading.value = true;
    try {
      const response = await userApi.login(credentials);
      profile.value = response.data;
      isAuthenticated.value = true;
      avatarHashes.value = response.data.avatarHashes;
      headerHashes.value = response.data.headerHashes;
      
      // 保存到本地存储
      localStorage.setItem('user_profile', JSON.stringify(response.data));
      localStorage.setItem('auth_token', response.data.token);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    profile.value = null;
    isAuthenticated.value = false;
    preferences.value = {};
    avatarHashes.value = null;
    headerHashes.value = null;
    
    // 清除本地存储
    localStorage.removeItem('user_profile');
    localStorage.removeItem('auth_token');
  };

  const updateProfile = async (data) => {
    loading.value = true;
    try {
      const response = await userApi.updateProfile(data);
      profile.value = { ...profile.value, ...response.data };
      
      // 更新本地存储
      localStorage.setItem('user_profile', JSON.stringify(profile.value));
      
      return response;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const loadProfileFromStorage = () => {
    const storedProfile = localStorage.getItem('user_profile');
    const token = localStorage.getItem('auth_token');
    
    if (storedProfile && token) {
      profile.value = JSON.parse(storedProfile);
      isAuthenticated.value = true;
      avatarHashes.value = profile.value.avatarHashes;
      headerHashes.value = profile.value.headerHashes;
    }
  };

  // 初始化时加载用户信息
  loadProfileFromStorage();

  return {
    // 状态
    profile,
    isAuthenticated,
    preferences,
    avatarHashes,
    headerHashes,
    loading,
    
    // 计算属性
    userDisplayName,
    userAvatar,
    userHeader,
    
    // 方法
    login,
    logout,
    updateProfile,
    loadProfileFromStorage
  };
});
```

### 2. 钱包状态管理 (stores/wallet.js)
```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { walletApi } from '@/services/api';

export const useWalletStore = defineStore('wallet', () => {
  // 状态
  const isConnected = ref(false);
  const walletAddress = ref('');
  const walletType = ref('');
  const balance = ref('0');
  const receivingAccounts = ref([]);
  const selectedCurrency = ref('BTC');
  const loading = ref(false);

  // 计算属性
  const hasWallet = computed(() => isConnected.value && walletAddress.value);
  const formattedBalance = computed(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.value
    }).format(balance.value);
  });

  // 方法
  const connectWallet = async (type) => {
    loading.value = true;
    try {
      // 检查Reown组件是否可用
      if (!window.reown) {
        throw new Error('Reown wallet component not available');
      }

      // 连接钱包
      const result = await window.reown.connect(type);
      
      isConnected.value = true;
      walletAddress.value = result.address;
      walletType.value = type;
      balance.value = result.balance || '0';
      
      // 保存到本地存储
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_type', type);
      localStorage.setItem('wallet_address', result.address);
      
      return result;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const disconnectWallet = () => {
    isConnected.value = false;
    walletAddress.value = '';
    walletType.value = '';
    balance.value = '0';
    
    // 清除本地存储
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_type');
    localStorage.removeItem('wallet_address');
  };

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

  const updateReceivingAccount = async (accountId, accountData) => {
    loading.value = true;
    try {
      const response = await walletApi.updateReceivingAccount(accountId, accountData);
      const index = receivingAccounts.value.findIndex(acc => acc.id === accountId);
      if (index !== -1) {
        receivingAccounts.value[index] = response.data;
      }
      return response;
    } catch (error) {
      console.error('Failed to update receiving account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteReceivingAccount = async (accountId) => {
    loading.value = true;
    try {
      await walletApi.deleteReceivingAccount(accountId);
      receivingAccounts.value = receivingAccounts.value.filter(acc => acc.id !== accountId);
    } catch (error) {
      console.error('Failed to delete receiving account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const loadWalletFromStorage = () => {
    const isWalletConnected = localStorage.getItem('wallet_connected');
    const walletType = localStorage.getItem('wallet_type');
    const walletAddress = localStorage.getItem('wallet_address');
    
    if (isWalletConnected && walletType && walletAddress) {
      isConnected.value = true;
      walletType.value = walletType;
      walletAddress.value = walletAddress;
    }
  };

  // 初始化时加载钱包状态
  loadWalletFromStorage();

  return {
    // 状态
    isConnected,
    walletAddress,
    walletType,
    balance,
    receivingAccounts,
    selectedCurrency,
    loading,
    
    // 计算属性
    hasWallet,
    formattedBalance,
    
    // 方法
    connectWallet,
    disconnectWallet,
    fetchReceivingAccounts,
    addReceivingAccount,
    updateReceivingAccount,
    deleteReceivingAccount,
    loadWalletFromStorage
  };
});
```

## 服务层实现

### 1. API客户端 (services/api.js)
```javascript
import axios from 'axios';
import { ElMessage } from 'element-plus';

// API配置
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      window.location.href = '/';
      ElMessage.error('登录已过期，请重新登录');
    } else if (error.response?.status === 403) {
      ElMessage.error('没有权限执行此操作');
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试');
    } else {
      ElMessage.error(error.response?.data?.message || '操作失败');
    }
    return Promise.reject(error);
  }
);

// API端点
const API_ENDPOINTS = {
  // 用户相关
  USER: {
    LOGIN: '/v1/ob/profile',
    UPDATE_PROFILE: '/v1/ob/profile',
    GET_PROFILE: '/v1/ob/profile'
  },
  
  // 钱包相关
  WALLET: {
    RECEIVING_ACCOUNTS: '/v1/wallet/receivingaccountlist',
    ADD_RECEIVING_ACCOUNT: '/v1/wallet/receivingaccount',
    UPDATE_RECEIVING_ACCOUNT: '/v1/wallet/receivingaccount',
    DELETE_RECEIVING_ACCOUNT: '/v1/wallet/receivingaccount',
    CURRENCIES: '/v1/wallet/currencies'
  },
  
  // 商品相关
  LISTINGS: {
    GET: '/v1/ob/listing',
    CREATE: '/v1/ob/listing',
    UPDATE: '/v1/ob/listing',
    DELETE: '/v1/ob/listing',
    INDEX: '/v1/ob/listingindex'
  },
  
  // 订单相关
  ORDERS: {
    PURCHASES: '/v1/ob/purchases',
    SALES: '/v1/ob/sales',
    CASES: '/v1/ob/cases',
    ORDER_DETAIL: '/v1/ob/order',
    CASE_DETAIL: '/v1/ob/case'
  },
  
  // 聊天相关
  CHAT: {
    SEND_MESSAGE: '/v1/ob/chatmessage',
    GROUP_MESSAGE: '/v1/ob/groupchatmessage',
    TYPING: '/v1/ob/typingmessage',
    GROUP_TYPING: '/v1/ob/grouptypingmessage',
    MARK_READ: '/v1/ob/markchatasread',
    CONVERSATIONS: '/v1/ob/chatconversations',
    MESSAGES: '/v1/ob/chatmessages',
    GROUP_MESSAGES: '/v1/ob/groupchatmessages'
  }
};

// API服务
export const userApi = {
  login: (credentials) => httpClient.post(API_ENDPOINTS.USER.LOGIN, credentials),
  updateProfile: (data) => httpClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, data),
  getProfile: (peerId) => httpClient.get(`${API_ENDPOINTS.USER.GET_PROFILE}/${peerId}`)
};

export const walletApi = {
  getReceivingAccounts: () => httpClient.get(API_ENDPOINTS.WALLET.RECEIVING_ACCOUNTS),
  addReceivingAccount: (data) => httpClient.post(API_ENDPOINTS.WALLET.ADD_RECEIVING_ACCOUNT, data),
  updateReceivingAccount: (id, data) => httpClient.put(API_ENDPOINTS.WALLET.UPDATE_RECEIVING_ACCOUNT, { id, ...data }),
  deleteReceivingAccount: (id) => httpClient.delete(`${API_ENDPOINTS.WALLET.DELETE_RECEIVING_ACCOUNT}/${id}`),
  getCurrencies: () => httpClient.get(API_ENDPOINTS.WALLET.CURRENCIES)
};

export const listingsApi = {
  get: (id) => httpClient.get(`${API_ENDPOINTS.LISTINGS.GET}/${id}`),
  create: (data) => httpClient.post(API_ENDPOINTS.LISTINGS.CREATE, data),
  update: (data) => httpClient.put(API_ENDPOINTS.LISTINGS.UPDATE, data),
  delete: (slug) => httpClient.delete(`${API_ENDPOINTS.LISTINGS.DELETE}/${slug}`),
  getIndex: (peerId) => httpClient.get(`${API_ENDPOINTS.LISTINGS.INDEX}/${peerId}`)
};

export const ordersApi = {
  getPurchases: (params) => httpClient.get(API_ENDPOINTS.ORDERS.PURCHASES, { params }),
  getSales: (params) => httpClient.get(API_ENDPOINTS.ORDERS.SALES, { params }),
  getCases: (params) => httpClient.get(API_ENDPOINTS.ORDERS.CASES, { params }),
  getOrderDetail: (orderId) => httpClient.get(`${API_ENDPOINTS.ORDERS.ORDER_DETAIL}/${orderId}`),
  getCaseDetail: (orderId) => httpClient.get(`${API_ENDPOINTS.ORDERS.CASE_DETAIL}/${orderId}`)
};

export const chatApi = {
  sendMessage: (data) => httpClient.post(API_ENDPOINTS.CHAT.SEND_MESSAGE, data),
  sendGroupMessage: (data) => httpClient.post(API_ENDPOINTS.CHAT.GROUP_MESSAGE, data),
  sendTyping: (data) => httpClient.post(API_ENDPOINTS.CHAT.TYPING, data),
  sendGroupTyping: (data) => httpClient.post(API_ENDPOINTS.CHAT.GROUP_TYPING, data),
  markAsRead: (data) => httpClient.post(API_ENDPOINTS.CHAT.MARK_READ, data),
  getConversations: () => httpClient.get(API_ENDPOINTS.CHAT.CONVERSATIONS),
  getMessages: (peerId, params) => httpClient.get(`${API_ENDPOINTS.CHAT.MESSAGES}/${peerId}`, { params }),
  getGroupMessages: (orderId, params) => httpClient.get(`${API_ENDPOINTS.CHAT.GROUP_MESSAGES}/${orderId}`, { params })
};

export default httpClient;
```

### 2. 钱包服务 (services/wallet.js)
```javascript
class WalletService {
  constructor() {
    this.supportedWallets = {
      metamask: 'MetaMask',
      phantom: 'Phantom',
      walletconnect: 'WalletConnect'
    };
  }
  
  async connect(walletType) {
    if (!window.reown) {
      throw new Error('Reown wallet component not available');
    }
    
    try {
      const result = await window.reown.connect(walletType);
      return result;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }
  
  async disconnect() {
    if (!window.reown) {
      throw new Error('Reown wallet component not available');
    }
    
    try {
      await window.reown.disconnect();
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      throw error;
    }
  }
  
  async signMessage(message) {
    if (!window.reown) {
      throw new Error('Reown wallet component not available');
    }
    
    try {
      return await window.reown.signMessage(message);
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }
  
  async sendTransaction(transaction) {
    if (!window.reown) {
      throw new Error('Reown wallet component not available');
    }
    
    try {
      return await window.reown.sendTransaction(transaction);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }
  
  async getBalance() {
    if (!window.reown) {
      throw new Error('Reown wallet component not available');
    }
    
    try {
      return await window.reown.getBalance();
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }
  
  async switchNetwork(network) {
    if (!window.reown) {
      throw new Error('Reown wallet component not available');
    }
    
    try {
      return await window.reown.switchNetwork(network);
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  }
}

export default new WalletService();
```

## 组件实现

### 1. 主布局组件 (layouts/MainLayout.vue)
```vue
<template>
  <div class="main-layout">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 聊天组件 -->
    <ChatContainer />
    
    <!-- 全局模态框 -->
    <GlobalModals />
  </div>
</template>

<script>
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import AppHeader from '@/components/layout/AppHeader.vue';
import ChatContainer from '@/components/chat/ChatContainer.vue';
import GlobalModals from '@/components/modals/GlobalModals.vue';

export default {
  name: 'MainLayout',
  components: {
    AppHeader,
    ChatContainer,
    GlobalModals
  },
  setup() {
    const userStore = useUserStore();
    const walletStore = useWalletStore();

    return {
      userStore,
      walletStore
    };
  }
};
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: var(--bg-color-page);
}
</style>
```

### 2. 导航栏组件 (components/layout/AppHeader.vue)
```vue
<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo和搜索 -->
      <div class="header-left">
        <router-link to="/" class="logo">
          <img src="@/assets/logo.png" alt="Mobazha" />
        </router-link>
        
        <div class="search-container">
          <el-input
            v-model="searchQuery"
            placeholder="搜索商品..."
            @keyup.enter="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="header-nav">
        <router-link to="/marketplace" class="nav-item">
          <el-icon><Shop /></el-icon>
          <span>市场</span>
        </router-link>
        
        <router-link to="/shop" class="nav-item" v-if="userStore.isAuthenticated">
          <el-icon><Store /></el-icon>
          <span>我的店铺</span>
        </router-link>
        
        <router-link to="/orders" class="nav-item" v-if="userStore.isAuthenticated">
          <el-icon><Document /></el-icon>
          <span>订单</span>
        </router-link>
      </nav>

      <!-- 用户操作区 -->
      <div class="header-right">
        <!-- 购物车 -->
        <el-badge :value="cartStore.itemCount" class="cart-badge">
          <el-button @click="showCart" class="cart-btn">
            <el-icon><ShoppingCart /></el-icon>
          </el-button>
        </el-badge>

        <!-- 钱包连接 -->
        <el-dropdown @command="handleWalletCommand" v-if="!walletStore.isConnected">
          <el-button type="primary">
            <el-icon><Wallet /></el-icon>
            连接钱包
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="metamask">MetaMask</el-dropdown-item>
              <el-dropdown-item command="phantom">Phantom</el-dropdown-item>
              <el-dropdown-item command="walletconnect">WalletConnect</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 用户菜单 -->
        <el-dropdown @command="handleUserCommand" v-if="userStore.isAuthenticated">
          <div class="user-avatar">
            <el-avatar :src="userStore.userAvatar" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人资料</el-dropdown-item>
              <el-dropdown-item command="receiving-accounts">收款账户</el-dropdown-item>
              <el-dropdown-item command="settings">设置</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { useCartStore } from '@/stores/cart';
import { ElMessage } from 'element-plus';

export default {
  name: 'AppHeader',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const walletStore = useWalletStore();
    const cartStore = useCartStore();
    
    const searchQuery = ref('');

    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        router.push({
          name: 'Search',
          query: { q: searchQuery.value }
        });
      }
    };

    const handleWalletCommand = async (command) => {
      try {
        await walletStore.connectWallet(command);
        ElMessage.success('钱包连接成功');
      } catch (error) {
        ElMessage.error('钱包连接失败');
      }
    };

    const handleUserCommand = (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile');
          break;
        case 'receiving-accounts':
          router.push('/receiving-accounts');
          break;
        case 'settings':
          router.push('/settings');
          break;
        case 'logout':
          userStore.logout();
          router.push('/');
          break;
      }
    };

    const showCart = () => {
      // 显示购物车侧边栏
    };

    return {
      searchQuery,
      userStore,
      walletStore,
      cartStore,
      handleSearch,
      handleWalletCommand,
      handleUserCommand,
      showCart
    };
  }
};
</script>

<style lang="scss" scoped>
.app-header {
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  img {
    height: 32px;
  }
}

.search-container {
  width: 300px;
}

.header-nav {
  display: flex;
  gap: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: var(--border-radius-md);
  text-decoration: none;
  color: var(--text-regular);
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--bg-color-page);
    color: var(--primary-color);
  }
  
  &.router-link-active {
    color: var(--primary-color);
    background: var(--primary-color);
    color: white;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-badge {
  .cart-btn {
    padding: 8px;
  }
}

.user-avatar {
  cursor: pointer;
}
</style>
```

## 页面实现

### 1. 收款账户管理页面 (views/ReceivingAccounts.vue)
```vue
<template>
  <div class="receiving-accounts">
    <div class="page-header">
      <h2>收款账户管理</h2>
      <el-button type="primary" @click="showAddAccountDialog">
        添加收款账户
      </el-button>
    </div>

    <!-- 账户列表 -->
    <el-row :gutter="24">
      <el-col :span="8" v-for="account in receivingAccounts" :key="account.id">
        <el-card class="account-card">
          <div class="account-header">
            <el-icon :class="getCurrencyIcon(account.currency)">
              {{ getCurrencySymbol(account.currency) }}
            </el-icon>
            <span class="currency-name">{{ account.currency }}</span>
            <el-tag :type="account.status === 'active' ? 'success' : 'warning'">
              {{ account.status }}
            </el-tag>
          </div>
          
          <div class="account-details">
            <p><strong>地址:</strong> {{ account.address }}</p>
            <p v-if="account.label"><strong>标签:</strong> {{ account.label }}</p>
          </div>
          
          <div class="account-actions">
            <el-button size="small" @click="editAccount(account)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAccount(account)">删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑账户对话框 -->
    <el-dialog
      v-model="accountDialogVisible"
      :title="isEditing ? '编辑收款账户' : '添加收款账户'"
      width="500px"
    >
      <el-form :model="accountForm" :rules="accountRules" ref="accountFormRef">
        <el-form-item label="货币类型" prop="currency">
          <el-select v-model="accountForm.currency" placeholder="选择货币">
            <el-option
              v-for="currency in supportedCurrencies"
              :key="currency.code"
              :label="currency.name"
              :value="currency.code"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="收款地址" prop="address">
          <el-input v-model="accountForm.address" placeholder="输入收款地址" />
        </el-form-item>
        
        <el-form-item label="标签" prop="label">
          <el-input v-model="accountForm.label" placeholder="账户标签（可选）" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAccount" :loading="saving">
          {{ isEditing ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'ReceivingAccounts',
  setup() {
    const walletStore = useWalletStore();
    const accountDialogVisible = ref(false);
    const isEditing = ref(false);
    const saving = ref(false);
    const accountFormRef = ref();
    
    const accountForm = reactive({
      currency: '',
      address: '',
      label: ''
    });

    const accountRules = {
      currency: [{ required: true, message: '请选择货币类型', trigger: 'change' }],
      address: [{ required: true, message: '请输入收款地址', trigger: 'blur' }]
    };

    const supportedCurrencies = [
      { code: 'BTC', name: 'Bitcoin' },
      { code: 'ETH', name: 'Ethereum' },
      { code: 'SOL', name: 'Solana' },
      { code: 'USDT', name: 'Tether' }
    ];

    const receivingAccounts = ref([]);

    onMounted(async () => {
      await loadReceivingAccounts();
    });

    const loadReceivingAccounts = async () => {
      try {
        await walletStore.fetchReceivingAccounts();
        receivingAccounts.value = walletStore.receivingAccounts;
      } catch (error) {
        ElMessage.error('加载收款账户失败');
      }
    };

    const showAddAccountDialog = () => {
      isEditing.value = false;
      resetForm();
      accountDialogVisible.value = true;
    };

    const editAccount = (account) => {
      isEditing.value = true;
      Object.assign(accountForm, account);
      accountDialogVisible.value = true;
    };

    const saveAccount = async () => {
      try {
        await accountFormRef.value.validate();
        saving.value = true;
        
        if (isEditing.value) {
          await walletStore.updateReceivingAccount(accountForm.id, accountForm);
          ElMessage.success('账户更新成功');
        } else {
          await walletStore.addReceivingAccount(accountForm);
          ElMessage.success('账户添加成功');
        }
        
        accountDialogVisible.value = false;
        await loadReceivingAccounts();
      } catch (error) {
        ElMessage.error('操作失败');
      } finally {
        saving.value = false;
      }
    };

    const deleteAccount = async (account) => {
      try {
        await ElMessageBox.confirm('确定要删除这个收款账户吗？', '确认删除');
        await walletStore.deleteReceivingAccount(account.id);
        ElMessage.success('账户删除成功');
        await loadReceivingAccounts();
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败');
        }
      }
    };

    const resetForm = () => {
      Object.assign(accountForm, {
        currency: '',
        address: '',
        label: ''
      });
    };

    const getCurrencyIcon = (currency) => {
      const icons = {
        BTC: 'BitcoinIcon',
        ETH: 'EthereumIcon',
        SOL: 'SolanaIcon',
        USDT: 'TetherIcon'
      };
      return icons[currency] || 'CurrencyIcon';
    };

    const getCurrencySymbol = (currency) => {
      const symbols = {
        BTC: '₿',
        ETH: 'Ξ',
        SOL: '◎',
        USDT: '$'
      };
      return symbols[currency] || currency;
    };

    return {
      accountDialogVisible,
      isEditing,
      saving,
      accountForm,
      accountFormRef,
      accountRules,
      supportedCurrencies,
      receivingAccounts,
      showAddAccountDialog,
      editAccount,
      saveAccount,
      deleteAccount,
      getCurrencyIcon,
      getCurrencySymbol
    };
  }
};
</script>

<style lang="scss" scoped>
.receiving-accounts {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
    color: var(--text-primary);
  }
}

.account-card {
  margin-bottom: 16px;
  
  .account-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .currency-name {
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .account-details {
    margin-bottom: 16px;
    
    p {
      margin: 4px 0;
      color: var(--text-regular);
    }
  }
  
  .account-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
```

## 配置文件

### 1. Vite配置 (vite.config.js)
```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8088,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          elementPlus: ['element-plus'],
          web3: ['@reown/appkit']
        }
      }
    }
  }
});
```

### 2. 环境变量 (.env)
```bash
# API配置
VITE_API_BASE_URL=http://localhost:8080/api

# Web3配置
VITE_WEB3_PROJECT_ID=your_project_id
VITE_WEB3_NETWORK=mainnet

# 其他配置
VITE_APP_TITLE=Mobazha Web3 Shop
VITE_APP_VERSION=3.0.0
```

### 3. 包依赖 (package.json)
```json
{
  "name": "mobazha-web3-shop",
  "version": "3.0.0",
  "scripts": {
    "dev": "vite --host --port 8088",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.4",
    "vue-router": "^4.2.4",
    "pinia": "^2.1.6",
    "element-plus": "^2.3.9",
    "@element-plus/icons-vue": "^2.1.0",
    "@reown/appkit": "^1.7.9",
    "axios": "^1.4.0",
    "mitt": "^3.0.1"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.3",
    "vite": "^4.4.4",
    "sass": "^1.64.1"
  }
}
```

## 部署指南

### 1. 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 2. 生产环境
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 3. Docker部署
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 总结

这个技术实现指南提供了完整的Web3店铺重构方案，包括：

1. **完整的项目结构**: 清晰的文件组织和模块划分
2. **详细的状态管理**: 使用Pinia管理应用状态
3. **Web3集成**: 完整的钱包连接和支付流程
4. **组件化设计**: 可复用的组件架构
5. **API适配**: 与后端API的完整集成
6. **配置管理**: 开发和生产环境的配置

通过这个实现方案，可以成功将现有的Vue 2 + Backbone.js架构升级为现代化的Vue 3 + Pinia架构，并深度集成Web3功能。 