import { myGet } from './api'
import app from '../../backbone/app'
import { createSearchURL } from '../../backbone/utils/search'

/**
 * 商品搜索服务
 */
export const productSearchApi = {
  /**
   * 搜索商品
   * @param {Object} params - 搜索参数
   * @param {string} params.q - 搜索关键词
   * @param {string} params.category - 商品类别
   * @param {number} params.p - 页码，从0开始
   * @param {number} params.ps - 每页数量
   * @param {string} params.sortBy - 排序方式
   * @param {Object} params.filters - 过滤条件
   * @returns {Promise} 搜索结果
   */
  async searchProducts(params = {}) {
    try {
      // 检查依赖是否可用
      if (!app) {
        throw new Error('应用未初始化')
      }
      
      if (!app.searchProviders || app.searchProviders.length === 0) {
        throw new Error('搜索服务暂不可用')
      }

      // 构建搜索选项
      const searchOpts = {
        provider: app.searchProviders.at(0), // 使用默认搜索提供商
        searchType: 'listings',
        q: params.q || '*',
        p: params.p || 0,
        ps: params.ps || 12, // 聊天界面显示较少商品
        sortBy: params.sortBy || 'relevance',
        filters: {
          category: params.category || 'all',
          // nsfw: String(app.settings.get('showNsfw')),
          ...params.filters
        }
      }

      console.log('搜索参数:', searchOpts)

      // 创建搜索URL并获取数据
      const searchUrl = createSearchURL(searchOpts)
      console.log('搜索URL:', searchUrl.toString())
      
      const response = await myGet(searchUrl)
      
      // 处理搜索结果，转换为聊天界面可用的格式
      return this.transformSearchResults(response, params)
    } catch (error) {
      console.error('商品搜索失败:', error)
      
      // 提供更具体的错误信息
      let errorMessage = '商品搜索失败，请稍后重试'
      if (error.message.includes('应用未初始化')) {
        errorMessage = '系统正在初始化，请稍后重试'
      } else if (error.message.includes('搜索服务暂不可用')) {
        errorMessage = '搜索服务暂时不可用，请稍后重试'
      } else if (error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络设置'
      }
      
      throw new Error(errorMessage)
    }
  },

  /**
   * 转换搜索结果为聊天界面格式
   * @param {Object} response - 原始搜索响应
   * @param {Object} originalParams - 原始搜索参数
   * @returns {Object} 转换后的结果
   */
  transformSearchResults(response, originalParams) {
    // 兼容不同的响应格式
    let results = []
    if (response.results && response.results.results && Array.isArray(response.results.results)) {
      // Mobazha API格式: { results: { results: [...], total: 1 } }
      results = response.results.results
    } else if (response.results && Array.isArray(response.results)) {
      results = response.results
    } else if (response.listings && Array.isArray(response.listings)) {
      results = response.listings
    } else if (Array.isArray(response)) {
      results = response
    } else if (response.data && Array.isArray(response.data)) {
      results = response.data
    } else {
      console.warn('无法识别的搜索结果格式:', response)
      results = []
    }
    
    // 转换商品数据格式
    const products = results.map((item, index) => {
      // 兼容不同的数据结构
      let listing, vendor
      
      if (item.type === 'listing' && item.data) {
        // Mobazha API格式
        listing = item.data
        vendor = item.relationships?.vendor || {}
      } else {
        // 其他格式
        listing = item.listing || item || {}
        vendor = item.vendor || listing.vendor || {}
      }
      
      const thumbnail = listing.thumbnail || listing.images || {}
      
      // 处理图片URL
      let imageUrl = '/imgs/defaultAvatar.png'
      if (thumbnail.medium) {
        imageUrl = thumbnail.medium
      } else if (thumbnail.small) {
        imageUrl = thumbnail.small
      } else if (thumbnail.tiny) {
        imageUrl = thumbnail.tiny
      } else if (listing.image) {
        imageUrl = listing.image
      } else if (Array.isArray(listing.images) && listing.images.length > 0) {
        imageUrl = listing.images[0]
      }
      
      return {
        id: listing.hash || listing.id || `product_${index}`,
        name: listing.title || listing.name || '商品名称',
        price: this.formatPrice(listing.price),
        image: imageUrl,
        rating: listing.rating || Math.round((Math.random() * 2 + 3) * 10) / 10, // 使用真实评分或模拟评分 3-5星
        vendor: {
          handle: vendor.handle || '',
          peerID: vendor.peerID || vendor.id || '',
          name: vendor.name || vendor.handle || '卖家'
        },
        category: listing.categories ? listing.categories[0] : (listing.category || ''),
        description: listing.description || '',
        hash: listing.hash || listing.id,
        slug: listing.slug || listing.id
      }
    })


    
    // 获取总结果数
    let totalResults = 0
    if (response.results && typeof response.results.total === 'number') {
      totalResults = response.results.total
    } else if (typeof response.total === 'number') {
      totalResults = response.total
    } else if (typeof response.count === 'number') {
      totalResults = response.count
    } else {
      totalResults = products.length
    }

    // 判断是否有更多结果
    const hasMore = response.results?.morePages || 
                   (totalResults > ((originalParams.p || 0) + 1) * (originalParams.ps || 12))

    return {
      products,
      totalResults,
      hasMore,
      searchQuery: originalParams.q,
      category: originalParams.category,
      // 保存原始API响应，供直接使用ResultsCol解析
      rawApiResponse: response
    }
  },

  /**
   * 格式化价格显示
   * @param {Object} priceObj - 价格对象
   * @returns {string} 格式化后的价格字符串
   */
  formatPrice(priceObj) {
    if (!priceObj) return '价格面议'
    
    const { amount = 0, currency = 'CNY' } = priceObj
    const price = parseFloat(amount) || 0
    
    if (price === 0) return '价格面议'
    
    // 根据货币类型格式化价格
    switch (currency.toUpperCase()) {
      case 'CNY':
        return `¥${price.toLocaleString()}`
      case 'USD':
        return `$${price.toLocaleString()}`
      case 'EUR':
        return `€${price.toLocaleString()}`
      case 'BTC':
        return `₿${price.toFixed(8)}`
      case 'ETH':
        return `Ξ${price.toFixed(4)}`
      default:
        return `${price.toLocaleString()} ${currency}`
    }
  }

}

export default productSearchApi 