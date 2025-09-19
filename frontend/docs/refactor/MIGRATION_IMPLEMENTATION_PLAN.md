# 迁移实施计划

## 概述

本文档提供了从Vue 2 + Vuex到Vue 3 + Pinia的详细迁移实施计划，确保在迁移过程中保持功能完整性和系统稳定性。

## 迁移策略

### 1. 渐进式迁移
- **并行开发**：新系统与旧系统并行运行
- **功能模块化**：按功能模块逐步迁移
- **向后兼容**：确保API接口兼容性
- **灰度发布**：逐步替换旧组件

### 2. 迁移阶段划分

#### 阶段一：基础设施搭建 (1-2周)
**目标**：建立新的技术栈基础

**任务清单：**
- [ ] 升级Vue 3和相关依赖
- [ ] 配置Vite构建工具
- [ ] 集成Element Plus
- [ ] 设置Pinia状态管理
- [ ] 配置路由系统
- [ ] 建立基础组件库
- [ ] 设置开发环境

**具体实施：**

```bash
# 1. 升级依赖
npm install vue@3 vue-router@4 pinia@3 element-plus@2

# 2. 安装开发依赖
npm install -D vite @vitejs/plugin-vue unplugin-vue-components

# 3. 配置Vite
```

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

#### 阶段二：核心功能迁移 (3-4周)
**目标**：迁移核心用户功能

**优先级排序：**
1. 用户认证和导航
2. 商品浏览和搜索
3. 购物车功能
4. 基础购买流程

**任务清单：**

**2.1 用户认证和导航 (1周)**
- [ ] 创建用户状态管理 (stores/user.js)
- [ ] 实现登录/注册功能
- [ ] 创建导航组件 (AppHeader.vue, AppSidebar.vue)
- [ ] 实现路由守卫
- [ ] 迁移用户资料页面

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  const userProfile = ref(null)
  
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      user.value = response.user
      userProfile.value = response.profile
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  const logout = () => {
    user.value = null
    userProfile.value = null
  }
  
  const fetchProfile = async () => {
    if (!user.value) return
    try {
      const profile = await authAPI.getProfile()
      userProfile.value = profile
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }
  
  return {
    user,
    userProfile,
    isAuthenticated,
    login,
    logout,
    fetchProfile
  }
})
```

**2.2 商品浏览和搜索 (1周)**
- [ ] 创建市场状态管理 (stores/marketplace.js)
- [ ] 实现搜索功能
- [ ] 创建商品列表组件
- [ ] 实现分类和过滤
- [ ] 迁移商品详情页

```javascript
// stores/marketplace.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { marketplaceAPI } from '@/api/marketplace'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const products = ref([])
  const categories = ref([])
  const filters = ref({})
  const searchQuery = ref('')
  const loading = ref(false)
  const totalCount = ref(0)
  
  const searchProducts = async (query, filterParams = {}) => {
    loading.value = true
    try {
      const response = await marketplaceAPI.searchProducts({
        query,
        ...filterParams,
        ...filters.value
      })
      products.value = response.products
      totalCount.value = response.total
      searchQuery.value = query
    } catch (error) {
      console.error('搜索商品失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  const getCategories = async () => {
    try {
      const response = await marketplaceAPI.getCategories()
      categories.value = response.categories
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }
  
  const applyFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    if (searchQuery.value) {
      searchProducts(searchQuery.value)
    }
  }
  
  return {
    products,
    categories,
    filters,
    searchQuery,
    loading,
    totalCount,
    searchProducts,
    getCategories,
    applyFilters
  }
})
```

**2.3 购物车功能 (1周)**
- [ ] 创建购物车状态管理 (stores/cart.js)
- [ ] 实现购物车组件
- [ ] 添加/删除商品功能
- [ ] 数量调整功能
- [ ] 价格计算功能

```javascript
// stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const appliedCoupons = ref([])
  
  const totalItems = computed(() => 
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )
  
  const subtotal = computed(() => 
    items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  )
  
  const discount = computed(() => 
    appliedCoupons.value.reduce((sum, coupon) => sum + coupon.discount, 0)
  )
  
  const total = computed(() => subtotal.value - discount.value)
  
  const addToCart = (product, quantity = 1) => {
    const existingItem = items.value.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity
      })
    }
  }
  
  const removeFromCart = (productId) => {
    const index = items.value.findIndex(item => item.id === productId)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }
  
  const updateQuantity = (productId, quantity) => {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId)
      } else {
        item.quantity = quantity
      }
    }
  }
  
  const clearCart = () => {
    items.value = []
    appliedCoupons.value = []
  }
  
  return {
    items,
    appliedCoupons,
    totalItems,
    subtotal,
    discount,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }
})
```

**2.4 基础购买流程 (1周)**
- [ ] 创建购买状态管理 (stores/purchase.js)
- [ ] 实现结账页面
- [ ] 支付方式选择
- [ ] 订单确认流程
- [ ] 基础支付处理

#### 阶段三：店铺管理功能迁移 (2-3周)
**目标**：迁移卖家功能

**任务清单：**

**3.1 商品管理 (1周)**
- [ ] 创建店铺状态管理 (stores/shop.js)
- [ ] 实现商品创建表单
- [ ] 商品编辑功能
- [ ] 图片上传功能
- [ ] 商品变体管理

```javascript
// stores/shop.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { shopAPI } from '@/api/shop'

export const useShopStore = defineStore('shop', () => {
  const products = ref([])
  const currentProduct = ref(null)
  const loading = ref(false)
  
  const fetchProducts = async () => {
    loading.value = true
    try {
      const response = await shopAPI.getProducts()
      products.value = response.products
    } catch (error) {
      console.error('获取商品列表失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  const createProduct = async (productData) => {
    try {
      const response = await shopAPI.createProduct(productData)
      products.value.push(response.product)
      return { success: true, product: response.product }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  const updateProduct = async (productId, productData) => {
    try {
      const response = await shopAPI.updateProduct(productId, productData)
      const index = products.value.findIndex(p => p.id === productId)
      if (index > -1) {
        products.value[index] = response.product
      }
      return { success: true, product: response.product }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  const deleteProduct = async (productId) => {
    try {
      await shopAPI.deleteProduct(productId)
      const index = products.value.findIndex(p => p.id === productId)
      if (index > -1) {
        products.value.splice(index, 1)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  return {
    products,
    currentProduct,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  }
})
```

**3.2 订单管理 (1周)**
- [ ] 创建订单状态管理 (stores/orders.js)
- [ ] 实现订单列表页面
- [ ] 订单详情查看
- [ ] 订单状态更新
- [ ] 基础订单操作

**3.3 店铺设置 (1周)**
- [ ] 创建设置状态管理 (stores/settings.js)
- [ ] 店铺信息设置
- [ ] 配送选项管理
- [ ] 支付方式设置
- [ ] 店铺页面自定义

#### 阶段四：高级功能迁移 (2-3周)
**目标**：迁移复杂功能

**任务清单：**

**4.1 聊天系统 (1周)**
- [ ] 创建聊天状态管理 (stores/chat.js)
- [ ] 实现WebSocket连接
- [ ] 消息发送和接收
- [ ] 实时通知
- [ ] 聊天界面优化

```javascript
// stores/chat.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatAPI } from '@/api/chat'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref([])
  const unreadCount = computed(() => 
    conversations.value.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
  )
  
  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations()
      conversations.value = response.conversations
    } catch (error) {
      console.error('获取对话列表失败:', error)
    }
  }
  
  const fetchMessages = async (conversationId) => {
    try {
      const response = await chatAPI.getMessages(conversationId)
      messages.value = response.messages
      currentConversation.value = conversationId
    } catch (error) {
      console.error('获取消息失败:', error)
    }
  }
  
  const sendMessage = async (conversationId, message) => {
    try {
      const response = await chatAPI.sendMessage(conversationId, message)
      messages.value.push(response.message)
      return { success: true, message: response.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  const markAsRead = async (conversationId) => {
    try {
      await chatAPI.markAsRead(conversationId)
      const conversation = conversations.value.find(c => c.id === conversationId)
      if (conversation) {
        conversation.unreadCount = 0
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
  
  return {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead
  }
})
```

**4.2 纠纷处理系统 (1周)**
- [ ] 创建纠纷状态管理 (stores/disputes.js)
- [ ] 纠纷创建流程
- [ ] 纠纷处理界面
- [ ] 仲裁流程
- [ ] 资金释放机制

**4.3 评价系统 (1周)**
- [ ] 创建评价状态管理 (stores/reviews.js)
- [ ] 评价创建和编辑
- [ ] 评价展示
- [ ] 评分计算
- [ ] 声誉系统

#### 阶段五：优化和测试 (1-2周)
**目标**：系统优化和全面测试

**任务清单：**
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 单元测试编写
- [ ] 集成测试
- [ ] 用户体验测试
- [ ] 兼容性测试

## 技术实施细节

### 1. 组件迁移策略

#### 1.1 渐进式组件替换
```javascript
// 旧组件包装器
// components/LegacyWrapper.vue
<template>
  <div>
    <!-- 条件渲染：新组件或旧组件 -->
    <NewComponent v-if="useNewComponent" v-bind="$props" v-on="$listeners" />
    <OldComponent v-else v-bind="$props" v-on="$listeners" />
  </div>
</template>

<script>
import { ref } from 'vue'
import NewComponent from './NewComponent.vue'
import OldComponent from './OldComponent.vue'

export default {
  name: 'LegacyWrapper',
  components: { NewComponent, OldComponent },
  props: {
    // 继承所有props
  },
  setup() {
    // 通过配置或特性开关控制使用哪个组件
    const useNewComponent = ref(false)
    
    return { useNewComponent }
  }
}
</script>
```

#### 1.2 数据迁移策略
```javascript
// utils/migration.js
export class DataMigration {
  // 从Vuex迁移到Pinia
  static migrateFromVuex(vuexState, piniaStore) {
    // 数据格式转换
    const convertedData = this.convertDataFormat(vuexState)
    
    // 更新Pinia store
    Object.assign(piniaStore, convertedData)
  }
  
  // 数据格式转换
  static convertDataFormat(vuexData) {
    // 根据具体数据结构进行转换
    return {
      // 转换后的数据
    }
  }
  
  // 向后兼容的数据访问
  static createCompatibilityLayer(oldAPI, newStore) {
    return {
      // 提供旧的API接口，内部调用新的store
      getState: () => newStore.$state,
      commit: (mutation, payload) => newStore[mutation](payload),
      dispatch: (action, payload) => newStore[action](payload)
    }
  }
}
```

### 2. API适配层

#### 2.1 API服务封装
```javascript
// api/index.js
import { createAPI } from '@/utils/api'

// 创建API实例
const api = createAPI({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 处理认证失败
      store.dispatch('auth/logout')
    }
    return Promise.reject(error)
  }
)

export default api
```

#### 2.2 模块化API服务
```javascript
// api/shop.js
import api from './index'

export const shopAPI = {
  // 商品管理
  getProducts: (params) => api.get('/v1/ob/listing', { params }),
  createProduct: (data) => api.post('/v1/ob/listing', data),
  updateProduct: (id, data) => api.put(`/v1/ob/listing/${id}`, data),
  deleteProduct: (id) => api.delete(`/v1/ob/listing/${id}`),
  
  // 订单管理
  getOrders: (params) => api.get('/v1/ob/sales', { params }),
  getOrder: (id) => api.get(`/v1/ob/order/${id}`),
  fulfillOrder: (id, data) => api.post(`/v1/order/fulfill`, { orderId: id, ...data }),
  
  // 店铺设置
  getStoreSettings: () => api.get('/v1/ob/profile'),
  updateStoreSettings: (data) => api.put('/v1/ob/profile', data),
  
  // 收款账户
  getReceivingAccounts: () => api.get('/v1/wallet/receivingaccountlist'),
  addReceivingAccount: (data) => api.post('/v1/wallet/receivingaccount', data),
  updateReceivingAccount: (data) => api.put('/v1/wallet/receivingaccount', data)
}
```

### 3. 状态管理迁移

#### 3.1 Store工厂函数
```javascript
// stores/factory.js
import { defineStore } from 'pinia'

export function createStore(name, initialState = {}) {
  return defineStore(name, () => {
    const state = ref(initialState)
    
    // 通用CRUD操作
    const setState = (newState) => {
      Object.assign(state.value, newState)
    }
    
    const resetState = () => {
      Object.assign(state.value, initialState)
    }
    
    return {
      state,
      setState,
      resetState
    }
  })
}
```

#### 3.2 持久化存储
```javascript
// stores/plugins/persist.js
import { watch } from 'vue'

export function createPersistPlugin(stores) {
  stores.forEach(store => {
    // 从localStorage恢复状态
    const savedState = localStorage.getItem(`store_${store.$id}`)
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        Object.assign(store.$state, parsedState)
      } catch (error) {
        console.error('恢复状态失败:', error)
      }
    }
    
    // 监听状态变化并保存
    watch(
      () => store.$state,
      (newState) => {
        localStorage.setItem(`store_${store.$id}`, JSON.stringify(newState))
      },
      { deep: true }
    )
  })
}
```

## 测试策略

### 1. 单元测试
```javascript
// tests/unit/stores/shop.spec.js
import { setActivePinia, createPinia } from 'pinia'
import { useShopStore } from '@/stores/shop'
import { shopAPI } from '@/api/shop'

// Mock API
jest.mock('@/api/shop')

describe('Shop Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should fetch products successfully', async () => {
    const store = useShopStore()
    const mockProducts = [{ id: 1, title: 'Test Product' }]
    
    shopAPI.getProducts.mockResolvedValue({ products: mockProducts })
    
    await store.fetchProducts()
    
    expect(store.products).toEqual(mockProducts)
    expect(store.loading).toBe(false)
  })
  
  it('should create product successfully', async () => {
    const store = useShopStore()
    const productData = { title: 'New Product', price: 100 }
    const mockResponse = { product: { id: 1, ...productData } }
    
    shopAPI.createProduct.mockResolvedValue(mockResponse)
    
    const result = await store.createProduct(productData)
    
    expect(result.success).toBe(true)
    expect(store.products).toContain(mockResponse.product)
  })
})
```

### 2. 集成测试
```javascript
// tests/integration/purchase-flow.spec.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PurchaseFlow from '@/components/PurchaseFlow.vue'

describe('Purchase Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should complete purchase flow successfully', async () => {
    const wrapper = mount(PurchaseFlow)
    
    // 添加商品到购物车
    await wrapper.find('[data-test="add-to-cart"]').trigger('click')
    
    // 进入结账流程
    await wrapper.find('[data-test="checkout"]').trigger('click')
    
    // 填写支付信息
    await wrapper.find('[data-test="payment-method"]').setValue('credit_card')
    
    // 提交订单
    await wrapper.find('[data-test="submit-order"]').trigger('click')
    
    // 验证订单完成
    expect(wrapper.find('[data-test="order-complete"]').exists()).toBe(true)
  })
})
```

## 部署策略

### 1. 灰度发布
```javascript
// utils/feature-flags.js
export const featureFlags = {
  useNewCart: process.env.VUE_APP_USE_NEW_CART === 'true',
  useNewCheckout: process.env.VUE_APP_USE_NEW_CHECKOUT === 'true',
  useNewProductManagement: process.env.VUE_APP_USE_NEW_PRODUCT_MANAGEMENT === 'true'
}

export function isFeatureEnabled(feature) {
  return featureFlags[feature] || false
}
```

### 2. 回滚机制
```javascript
// utils/rollback.js
export class RollbackManager {
  constructor() {
    this.rollbackPoints = new Map()
  }
  
  // 创建回滚点
  createRollbackPoint(name, data) {
    this.rollbackPoints.set(name, {
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data))
    })
  }
  
  // 执行回滚
  rollback(name) {
    const rollbackPoint = this.rollbackPoints.get(name)
    if (rollbackPoint) {
      // 恢复数据
      Object.assign(window.__APP_STATE__, rollbackPoint.data)
      return true
    }
    return false
  }
  
  // 清理回滚点
  cleanup(olderThan = 24 * 60 * 60 * 1000) { // 默认24小时
    const now = Date.now()
    for (const [name, point] of this.rollbackPoints.entries()) {
      if (now - point.timestamp > olderThan) {
        this.rollbackPoints.delete(name)
      }
    }
  }
}
```

## 监控和日志

### 1. 性能监控
```javascript
// utils/performance.js
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
  }
  
  // 开始计时
  startTimer(name) {
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    })
  }
  
  // 结束计时
  endTimer(name) {
    const metric = this.metrics.get(name)
    if (metric) {
      metric.endTime = performance.now()
      metric.duration = metric.endTime - metric.startTime
      
      // 记录性能数据
      console.log(`Performance: ${name} took ${metric.duration}ms`)
      
      // 发送到监控服务
      this.sendMetric(name, metric.duration)
    }
  }
  
  // 发送指标到监控服务
  sendMetric(name, duration) {
    // 实现监控数据发送逻辑
  }
}
```

### 2. 错误监控
```javascript
// utils/error-handler.js
export class ErrorHandler {
  constructor() {
    this.setupGlobalErrorHandling()
  }
  
  setupGlobalErrorHandling() {
    // 全局错误处理
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'global')
    })
    
    // Promise错误处理
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'promise')
    })
  }
  
  handleError(error, context) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // 记录错误
    console.error('Error occurred:', errorInfo)
    
    // 发送到错误监控服务
    this.sendErrorReport(errorInfo)
  }
  
  sendErrorReport(errorInfo) {
    // 实现错误报告发送逻辑
  }
}
```

## 总结

这个详细的迁移实施计划提供了：

1. **清晰的阶段划分**：将迁移过程分为5个阶段，每个阶段都有明确的目标和任务
2. **具体的技术实现**：提供了详细的代码示例和配置
3. **完整的测试策略**：包括单元测试和集成测试
4. **可靠的部署方案**：支持灰度发布和回滚机制
5. **完善的监控体系**：性能监控和错误处理

通过这个计划，可以确保迁移过程的顺利进行，同时保持系统的稳定性和功能的完整性。 