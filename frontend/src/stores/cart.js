import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 本地存储操作函数
function updateLocalStorage(cart) {
  localStorage.setItem('cart', JSON.stringify(cart))
}

function getCartFromLocalStorage() {
  const cart = localStorage.getItem('cart')
  return cart ? JSON.parse(cart) : {}
}

export const useCartStore = defineStore('cart', () => {
  // 状态
  const cart = ref(getCartFromLocalStorage())
  const items = ref([])
  const appliedCoupons = ref([])
  const loading = ref(false)

  // 计算属性
  const totalItems = computed(() => 
    items.value.reduce((sum, item) => sum + (item.quantity || 1), 0)
  )

  const subtotal = computed(() => 
    items.value.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0
      const quantity = item.quantity || 1
      return sum + (price * quantity)
    }, 0)
  )

  const discount = computed(() => 
    appliedCoupons.value.reduce((sum, coupon) => {
      if (coupon.type === 'percentage') {
        return sum + (subtotal.value * coupon.value / 100)
      } else if (coupon.type === 'fixed') {
        return sum + coupon.value
      }
      return sum
    }, 0)
  )

  const total = computed(() => Math.max(0, subtotal.value - discount.value))

  const isEmpty = computed(() => items.value.length === 0)

  // 从Vuex迁移的方法
  function updateCart(newCart) {
    cart.value = newCart
    updateLocalStorage(newCart)
  }

  // 购物车操作方法
  const addToCart = (product, quantity = 1, options = {}) => {
    const existingItem = items.value.find(item => 
      item.id === product.id && 
      JSON.stringify(item.options) === JSON.stringify(options)
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        quantity,
        options,
        addedAt: Date.now()
      })
    }
  }

  const removeFromCart = (itemId) => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }

  const updateQuantity = (itemId, quantity) => {
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(itemId)
      } else {
        item.quantity = quantity
      }
    }
  }

  const clearCart = () => {
    items.value = []
    appliedCoupons.value = []
    cart.value = {}
    updateLocalStorage({})
  }

  const applyCoupon = (couponCode) => {
    // 这里应该调用API验证优惠券
    const coupon = {
      code: couponCode,
      type: 'percentage', // 或 'fixed'
      value: 10, // 示例值
      description: `${couponCode} 优惠券`
    }
    
    const existingCoupon = appliedCoupons.value.find(c => c.code === couponCode)
    if (!existingCoupon) {
      appliedCoupons.value.push(coupon)
    }
    
    return { success: true, coupon }
  }

  const removeCoupon = (couponCode) => {
    const index = appliedCoupons.value.findIndex(c => c.code === couponCode)
    if (index > -1) {
      appliedCoupons.value.splice(index, 1)
    }
  }

  const getItemCount = (productId) => {
    const item = items.value.find(item => item.id === productId)
    return item ? item.quantity : 0
  }

  const moveToWishlist = (itemId) => {
    // 这里可以集成愿望清单功能
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      // 添加到愿望清单的逻辑
      removeFromCart(itemId)
    }
  }

  return {
    // 状态
    cart,
    items,
    appliedCoupons,
    loading,
    
    // 计算属性
    totalItems,
    subtotal,
    discount,
    total,
    isEmpty,
    
    // 方法
    updateCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    getItemCount,
    moveToWishlist
  }
}, {
  persist: {
    key: 'cart',
    storage: localStorage,
    paths: ['cart', 'items', 'appliedCoupons']
  }
})