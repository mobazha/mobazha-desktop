import { SolanaTransactionService } from './solanaTransaction';
import { EthTransactionService } from './ethTransaction';

/**
 * 统一的交易服务管理器
 * 根据网络类型自动选择对应的交易服务实现
 */
export class UnifiedTransactionService {
  constructor() {
    this.solanaService = null;
    this.ethService = null;
    this.currentNetworkType = null;
  }

  /**
   * 初始化交易服务
   * @param {string} networkType - 网络类型 ('solana' | 'ethereum' | 'bitcoin')
   * @param {Object} connection - 连接对象 (Solana需要)
   * @param {Object} walletProvider - 钱包提供者
   * @param {string} walletAddress - 钱包地址
   */
  initialize(networkType, connection, walletProvider, walletAddress) {
    console.log(`🔧 开始初始化 ${networkType} 交易服务...`);

    if (!walletProvider || !walletAddress) {
      console.warn('UnifiedTransactionService: 缺少必要参数，无法初始化');
      return false;
    }

    this.cleanup();

    try {
      // 在清理后设置新的网络类型
      this.currentNetworkType = networkType;
      console.log(`🔧 设置网络类型为: ${networkType}`);

      switch (networkType) {
        case 'solana':
          if (!connection) {
            console.warn('Solana网络需要connection参数');
            this.currentNetworkType = null;
            return false;
          }
          this.solanaService = new SolanaTransactionService(
            connection,
            walletProvider,
            walletAddress
          );
          console.log('✅ Solana交易服务已初始化');
          break;

        case 'ethereum':
          this.ethService = new EthTransactionService(
            connection,
            walletProvider,
            walletAddress
          );
          console.log('✅ Ethereum交易服务已初始化');
          break;

        case 'bitcoin':
          // 预留Bitcoin交易服务
          console.log('🔄 Bitcoin交易服务暂未实现');
          this.currentNetworkType = null;
          return false;

        default:
          console.warn(`不支持的网络类型: ${networkType}`);
          this.currentNetworkType = null;
          return false;
      }

      console.log(`🎉 ${networkType} 交易服务初始化完成，状态:`, this.getStatus());
      return true;
    } catch (error) {
      console.error('初始化交易服务失败:', error);
      this.currentNetworkType = null;
      return false;
    }
  }

  /**
   * 执行交易
   * @param {string} transactionType - 交易类型 ('solana' | 'ethereum')
   * @param {Object} transactionData - 交易数据
   * @returns {Promise<string>} 交易签名/哈希
   */
  async executeTransaction(transactionType, transactionData) {
    console.log(`🚀 准备执行${transactionType}交易...`);
    console.log('服务状态:', this.getStatus());

    // 验证网络类型匹配
    if (transactionType !== this.currentNetworkType) {
      throw new Error(`网络类型不匹配: 当前${this.currentNetworkType}, 请求${transactionType}`);
    }

    switch (transactionType) {
      case 'solana':
        if (!this.solanaService) {
          throw new Error('Solana交易服务未初始化');
        }
        return await this.solanaService.executeTransaction(transactionData);

      case 'ethereum':
        if (!this.ethService) {
          throw new Error('Ethereum交易服务未初始化');
        }
        return await this.ethService.executeTransaction(transactionData);

      case 'bitcoin':
        throw new Error('Bitcoin交易服务暂未实现');

      default:
        throw new Error(`不支持的交易类型: ${transactionType}`);
    }
  }

  /**
   * 检查指定网络的交易服务是否已初始化
   * @param {string} networkType - 网络类型
   * @returns {boolean}
   */
  isServiceReady(networkType) {
    switch (networkType) {
      case 'solana':
        return !!this.solanaService;
      case 'ethereum':
        return !!this.ethService;
      case 'bitcoin':
        return false; // 暂未实现
      default:
        return false;
    }
  }

  /**
   * 获取当前网络类型
   * @returns {string|null}
   */
  getCurrentNetworkType() {
    return this.currentNetworkType;
  }

  /**
   * 获取当前活跃的交易服务
   * @returns {Object|null}
   */
  getCurrentService() {
    switch (this.currentNetworkType) {
      case 'solana':
        return this.solanaService;
      case 'ethereum':
        return this.ethService;
      default:
        return null;
    }
  }

  /**
   * 获取支持的网络类型列表
   * @returns {Array<string>}
   */
  getSupportedNetworks() {
    return ['solana', 'ethereum']; // bitcoin 暂未实现
  }

  /**
   * 清理所有交易服务
   */
  cleanup() {
    this.solanaService = null;
    this.ethService = null;
    this.currentNetworkType = null;
    console.log('🧹 交易服务已清理');
  }

  /**
   * 获取服务状态信息
   * @returns {Object}
   */
  getStatus() {
    return {
      currentNetworkType: this.currentNetworkType,
      services: {
        solana: !!this.solanaService,
        ethereum: !!this.ethService,
        bitcoin: false
      },
      isReady: this.isServiceReady(this.currentNetworkType)
    };
  }
} 