import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { shopAPI } from '@/api/shop'

export const useShopStore = defineStore('shop', () => {
  // 状态
  const products = ref([])
  const currentProduct = ref(null)
  const storeSettings = ref({})
  const shippingOptions = ref([])
  const coupons = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const totalProducts = computed(() => products.value.length)
  const activeProducts = computed(() => 
    products.value.filter(product => product.status === 'active')
  )
  const draftProducts = computed(() => 
    products.value.filter(product => product.status === 'draft')
  )

  // 方法
  const fetchProducts = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await shopAPI.getProducts(params)
      products.value = response.products || []
      return { success: true, products: products.value }
    } catch (err) {
      error.value = err.message || '获取商品列表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (productData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await shopAPI.createProduct(productData)
      const newProduct = response.product
      products.value.push(newProduct)
      return { success: true, product: newProduct }
    } catch (err) {
      error.value = err.message || '创建商品失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (productId, productData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await shopAPI.updateProduct(productId, productData)
      const updatedProduct = response.product
      
      const index = products.value.findIndex(p => p.id === productId)
      if (index > -1) {
        products.value[index] = updatedProduct
      }
      
      return { success: true, product: updatedProduct }
    } catch (err) {
      error.value = err.message || '更新商品失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (productId) => {
    loading.value = true
    error.value = null
    
    try {
      await shopAPI.deleteProduct(productId)
      const index = products.value.findIndex(p => p.id === productId)
      if (index > -1) {
        products.value.splice(index, 1)
      }
      return { success: true }
    } catch (err) {
      error.value = err.message || '删除商品失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const getProductById = async (productId) => {
    try {
      const response = await shopAPI.getProduct(productId)
      currentProduct.value = response.product
      return { success: true, product: response.product }
    } catch (err) {
      error.value = err.message || '获取商品详情失败'
      return { success: false, error: error.value }
    }
  }

  const updateInventory = async (productId, inventoryData) => {
    try {
      const response = await shopAPI.updateInventory(productId, inventoryData)
      const updatedProduct = response.product
      
      const index = products.value.findIndex(p => p.id === productId)
      if (index > -1) {
        products.value[index] = updatedProduct
      }
      
      return { success: true, product: updatedProduct }
    } catch (err) {
      error.value = err.message || '更新库存失败'
      return { success: false, error: error.value }
    }
  }

  const uploadProductImage = async (productId, imageFile) => {
    try {
      const response = await shopAPI.uploadProductImage(productId, imageFile)
      return { success: true, image: response.image }
    } catch (err) {
      error.value = err.message || '上传图片失败'
      return { success: false, error: error.value }
    }
  }

  const fetchStoreSettings = async () => {
    try {
      const response = await shopAPI.getStoreSettings()
      storeSettings.value = response.settings || {}
      return { success: true, settings: storeSettings.value }
    } catch (err) {
      error.value = err.message || '获取店铺设置失败'
      return { success: false, error: error.value }
    }
  }

  const updateStoreSettings = async (settings) => {
    try {
      const response = await shopAPI.updateStoreSettings(settings)
      storeSettings.value = response.settings || {}
      return { success: true, settings: storeSettings.value }
    } catch (err) {
      error.value = err.message || '更新店铺设置失败'
      return { success: false, error: error.value }
    }
  }

  const fetchShippingOptions = async () => {
    try {
      const response = await shopAPI.getShippingOptions()
      shippingOptions.value = response.options || []
      return { success: true, options: shippingOptions.value }
    } catch (err) {
      error.value = err.message || '获取配送选项失败'
      return { success: false, error: error.value }
    }
  }

  const createShippingOption = async (optionData) => {
    try {
      const response = await shopAPI.createShippingOption(optionData)
      shippingOptions.value.push(response.option)
      return { success: true, option: response.option }
    } catch (err) {
      error.value = err.message || '创建配送选项失败'
      return { success: false, error: error.value }
    }
  }

  const updateShippingOption = async (optionId, optionData) => {
    try {
      const response = await shopAPI.updateShippingOption(optionId, optionData)
      const updatedOption = response.option
      
      const index = shippingOptions.value.findIndex(o => o.id === optionId)
      if (index > -1) {
        shippingOptions.value[index] = updatedOption
      }
      
      return { success: true, option: updatedOption }
    } catch (err) {
      error.value = err.message || '更新配送选项失败'
      return { success: false, error: error.value }
    }
  }

  const deleteShippingOption = async (optionId) => {
    try {
      await shopAPI.deleteShippingOption(optionId)
      const index = shippingOptions.value.findIndex(o => o.id === optionId)
      if (index > -1) {
        shippingOptions.value.splice(index, 1)
      }
      return { success: true }
    } catch (err) {
      error.value = err.message || '删除配送选项失败'
      return { success: false, error: error.value }
    }
  }

  const fetchCoupons = async () => {
    try {
      const response = await shopAPI.getCoupons()
      coupons.value = response.coupons || []
      return { success: true, coupons: coupons.value }
    } catch (err) {
      error.value = err.message || '获取优惠券失败'
      return { success: false, error: error.value }
    }
  }

  const createCoupon = async (couponData) => {
    try {
      const response = await shopAPI.createCoupon(couponData)
      coupons.value.push(response.coupon)
      return { success: true, coupon: response.coupon }
    } catch (err) {
      error.value = err.message || '创建优惠券失败'
      return { success: false, error: error.value }
    }
  }

  const updateCoupon = async (couponId, couponData) => {
    try {
      const response = await shopAPI.updateCoupon(couponId, couponData)
      const updatedCoupon = response.coupon
      
      const index = coupons.value.findIndex(c => c.id === couponId)
      if (index > -1) {
        coupons.value[index] = updatedCoupon
      }
      
      return { success: true, coupon: updatedCoupon }
    } catch (err) {
      error.value = err.message || '更新优惠券失败'
      return { success: false, error: error.value }
    }
  }

  const deleteCoupon = async (couponId) => {
    try {
      await shopAPI.deleteCoupon(couponId)
      const index = coupons.value.findIndex(c => c.id === couponId)
      if (index > -1) {
        coupons.value.splice(index, 1)
      }
      return { success: true }
    } catch (err) {
      error.value = err.message || '删除优惠券失败'
      return { success: false, error: error.value }
    }
  }

  return {
    // 状态
    products,
    currentProduct,
    storeSettings,
    shippingOptions,
    coupons,
    loading,
    error,
    
    // 计算属性
    totalProducts,
    activeProducts,
    draftProducts,
    
    // 方法
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    updateInventory,
    uploadProductImage,
    fetchStoreSettings,
    updateStoreSettings,
    fetchShippingOptions,
    createShippingOption,
    updateShippingOption,
    deleteShippingOption,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon
  }
})