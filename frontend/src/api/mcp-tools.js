import { productSearchApi } from './product-search'

/**
 * MCP工具定义 - 让AI能够主动调用的工具
 */
export const MCP_TOOLS = {
  search_products: {
    name: 'search_products',
    description: '搜索商品。当用户表达购买意图或询问特定商品时使用此工具。',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词，例如："手机"、"iPhone"、"笔记本电脑"等'
        },
        category: {
          type: 'string',
          enum: ['all', 'digital_goods', 'physical_goods', 'services'],
          description: '商品类别：all=全部, digital_goods=数码产品, physical_goods=实体商品, services=服务'
        },
        max_results: {
          type: 'number',
          description: '最大返回结果数量，默认6个',
          minimum: 1,
          maximum: 20
        }
      },
      required: ['query']
    }
  },

  get_product_details: {
    name: 'get_product_details',
    description: '获取特定商品的详细信息。当用户询问某个具体商品的详情时使用。',
    parameters: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: '商品ID或hash'
        }
      },
      required: ['product_id']
    }
  },

  compare_products: {
    name: 'compare_products',
    description: '比较多个商品的特性和价格。当用户想要对比不同商品时使用。',
    parameters: {
      type: 'object',
      properties: {
        product_ids: {
          type: 'array',
          items: { type: 'string' },
          description: '要比较的商品ID列表'
        },
        comparison_aspects: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['price', 'features', 'rating', 'vendor']
          },
          description: '比较维度：price=价格, features=功能特性, rating=评分, vendor=卖家'
        }
      },
      required: ['product_ids']
    }
  }
}

/**
 * MCP工具执行器
 */
export class MCPToolExecutor {
  constructor() {
    this.tools = MCP_TOOLS
  }

  /**
   * 执行工具调用
   * @param {string} toolName - 工具名称
   * @param {Object} parameters - 工具参数
   * @returns {Promise<Object>} 工具执行结果
   */
  async executeTool(toolName, parameters) {
    console.log(`执行MCP工具: ${toolName}`, parameters)

    switch (toolName) {
      case 'search_products':
        return await this.searchProducts(parameters)
      
      case 'get_product_details':
        return await this.getProductDetails(parameters)
      
      case 'compare_products':
        return await this.compareProducts(parameters)
      
      default:
        throw new Error(`未知的工具: ${toolName}`)
    }
  }

  /**
   * 搜索商品工具实现
   */
  async searchProducts({ query, category = 'all', max_results = 6 }) {
    try {
      const searchResults = await productSearchApi.searchProducts({
        q: query,
        category,
        ps: max_results
      })

      return {
        success: true,
        data: {
          query,
          category,
          total_results: searchResults.totalResults,
          products: searchResults.products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            rating: product.rating,
            vendor: product.vendor,
            category: product.category,
            description: product.description
          })),
          has_more: searchResults.hasMore,
          // 添加原始API响应，供MessageList直接使用
          rawApiResponse: searchResults.rawApiResponse
        },
        message: `找到 ${searchResults.products.length} 件相关商品`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '商品搜索失败'
      }
    }
  }

  /**
   * 获取商品详情工具实现
   */
  async getProductDetails({ product_id }) {
    try {
      // 这里可以调用具体的商品详情API
      // 暂时返回模拟数据
      return {
        success: true,
        data: {
          id: product_id,
          message: '商品详情功能开发中'
        },
        message: `获取商品 ${product_id} 的详情`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '获取商品详情失败'
      }
    }
  }

  /**
   * 商品比较工具实现
   */
  async compareProducts({ product_ids, comparison_aspects = ['price', 'rating'] }) {
    try {
      // 这里可以实现商品比较逻辑
      return {
        success: true,
        data: {
          products: product_ids,
          aspects: comparison_aspects,
          message: '商品比较功能开发中'
        },
        message: `比较 ${product_ids.length} 件商品`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '商品比较失败'
      }
    }
  }

  /**
   * 获取所有可用工具的定义
   */
  getToolDefinitions() {
    return Object.values(this.tools)
  }

  /**
   * 检查工具是否存在
   */
  hasTools(toolName) {
    return toolName in this.tools
  }
}

/**
 * 为AI生成工具调用提示
 */
export function generateMCPSystemPrompt() {
  const tools = Object.values(MCP_TOOLS)
  
  return `你是一个智能购物助手，可以使用以下工具来帮助用户：

可用工具：
${tools.map(tool => `
- **${tool.name}**: ${tool.description}
  参数: ${JSON.stringify(tool.parameters.properties, null, 2)}
`).join('\n')}

## 工具使用规则：

1. **主动搜索**: 当用户表达购买意图时，主动使用 search_products 工具
2. **具体查询**: 优先理解用户需求，提取准确的搜索关键词
3. **结果解读**: 基于工具返回的真实数据生成回复
4. **用户体验**: 始终以用户友好的方式展示结果

## 示例对话流程：

用户："我想买个手机"
1. 识别购买意图
2. 调用 search_products("手机", "digital_goods") 
3. 基于搜索结果生成个性化推荐回复

用户："这几款手机哪个好？"
1. 识别比较需求
2. 调用 compare_products(product_ids, ["price", "features", "rating"])
3. 生成对比分析回复

请始终基于工具返回的真实数据来回复用户，而不是编造信息。`
}

/**
 * 解析AI的工具调用请求
 */
export function parseToolCall(aiResponse) {
  try {
    // 寻找工具调用的JSON格式
    const toolCallMatch = aiResponse.match(/\{[\s\S]*"tool"[\s\S]*\}/)
    if (toolCallMatch) {
      return JSON.parse(toolCallMatch[0])
    }

    // 寻找函数调用格式
    const functionCallMatch = aiResponse.match(/(\w+)\((.*)\)/)
    if (functionCallMatch) {
      const [, toolName, paramsStr] = functionCallMatch
      try {
        const parameters = JSON.parse(`{${paramsStr}}`)
        return { tool: toolName, parameters }
      } catch {
        return null
      }
    }

    return null
  } catch (error) {
    console.error('解析工具调用失败:', error)
    return null
  }
}

// 创建全局工具执行器实例
export const mcpToolExecutor = new MCPToolExecutor()

export default {
  MCP_TOOLS,
  MCPToolExecutor,
  generateMCPSystemPrompt,
  parseToolCall,
  mcpToolExecutor
} 