import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// 创建pinia实例
const pinia = createPinia()

// 配置持久化插件
const persist = createPersistedState({
  key: prefix => `mobazha_${prefix}`,
  storage: localStorage,
  auto: true
})

pinia.use(persist)

export default pinia

// 导出所有stores
export * from './cart'
export * from './chat'
export * from './products'
export * from './wallet' 