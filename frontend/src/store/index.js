import { createStore } from 'vuex'

import products from './products.module'
import cart from './cart.module';
import wallet from './modules/wallet'
import chat from './modules/chat'

// 创建 store 实例
const store = createStore({
  modules: {
    products,
    cart,
    wallet,
    chat
  },
  strict: process.env.NODE_ENV !== 'production'
})

export default store