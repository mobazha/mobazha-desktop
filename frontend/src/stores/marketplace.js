import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { marketplaceAPI } from '@/api/marketplace'

export const useMarketplaceStore = defineStore('marketplace', () => {
  // 状态
  const products = ref([])
  const categories = ref([])
  const filters = ref({
    category: '',
    priceRange: { min: 0, max: null },
    condition: '',
    location: '',
    sortBy: 'relevance'
  })
  const searchQuery = ref('')
  const loading = ref(false)
  const totalCount = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const error = ref(null)

  // 计算属性
  const hasMore = computed(() => 
    products.value.length < totalCount.value
  )

  const filteredProducts = computed(() => {
    let result = products.value

    // 应用价格过滤
    if (filters.value.priceRange.min > 0) {
      result = result.filter(product => 
        parseFloat(product.price) >= filters.value.priceRange.min
      )
    }
    if (filters.value.priceRange.max) {
      result = result.filter(product => 
        parseFloat(product.price) <= filters.value.priceRange.max
      )
    }

    // 应用条件过滤
    if (filters.value.condition) {
      result = result.filter(product => 
        product.condition === filters.value.condition
      )
    }

    // 应用分类过滤
    if (filters.value.category) {
      result = result.filter(product => 
        product.category === filters.value.category
      )
    }

    return result
  })

  // 方法
  const searchProducts = async (query = '', resetPage = true) => {
    loading.value = true
    error.value = null
    
    if (resetPage) {
      currentPage.value = 1
    }
    
    try {
      const response = await marketplaceAPI.searchProducts({
        query,
        page: currentPage.value,
        pageSize: pageSize.value,
        ...filters.value
      })
      
      if (resetPage) {
        products.value = response.products || []
      } else {
        products.value.push(...(response.products || []))
      }
      
      totalCount.value = response.total || 0
      searchQuery.value = query
      
      return { success: true, data: response }
    } catch (err) {
      error.value = err.message || '搜索商品失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const loadMoreProducts = async () => {
    if (loading.value || !hasMore.value) return
    
    currentPage.value++
    await searchProducts(searchQuery.value, false)
  }

  const getCategories = async () => {
    try {
      const response = await marketplaceAPI.getCategories()
      categories.value = response.categories || []
      return { success: true, categories: categories.value }
    } catch (err) {
      console.error('获取分类失败:', err)
      return { success: false, error: err.message }
    }
  }

  const applyFilters = async (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1
    await searchProducts(searchQuery.value, true)
  }

  const clearFilters = async () => {
    filters.value = {
      category: '',
      priceRange: { min: 0, max: null },
      condition: '',
      location: '',
      sortBy: 'relevance'
    }
    currentPage.value = 1
    await searchProducts(searchQuery.value, true)
  }

  const sortProducts = async (sortBy) => {
    filters.value.sortBy = sortBy
    currentPage.value = 1
    await searchProducts(searchQuery.value, true)
  }

  const getProductById = async (productId) => {
    try {
      const response = await marketplaceAPI.getProduct(productId)
      return { success: true, product: response.product }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const getRelatedProducts = async (productId) => {
    try {
      const response = await marketplaceAPI.getRelatedProducts(productId)
      return { success: true, products: response.products }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const getVendorProducts = async (vendorId, params = {}) => {
    try {
      const response = await marketplaceAPI.getVendorProducts(vendorId, params)
      return { success: true, products: response.products, total: response.total }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const resetSearch = () => {
    products.value = []
    searchQuery.value = ''
    currentPage.value = 1
    totalCount.value = 0
    error.value = null
  }

  return {
    // 状态
    products,
    categories,
    filters,
    searchQuery,
    loading,
    totalCount,
    currentPage,
    pageSize,
    error,
    
    // 计算属性
    hasMore,
    filteredProducts,
    
    // 方法
    searchProducts,
    loadMoreProducts,
    getCategories,
    applyFilters,
    clearFilters,
    sortProducts,
    getProductById,
    getRelatedProducts,
    getVendorProducts,
    resetSearch
  }
})