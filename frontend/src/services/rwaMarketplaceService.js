import { ethers } from 'ethers';
import { ElMessage } from 'element-plus';
import { events } from '../../backbone/utils/order';
import { getContractAddress, getTokenConfig, getCurrentNetworkConfig } from '../config/rwaMarketplaceConfig.js';

// RWA Marketplace合约ABI - 根据实际合约更新
const RWAMarketplaceABI = [
  // 创建订单并付款 - 根据合约实际方法签名更新
  "function createOrderAndPay(bytes32 orderId, address buyer, address seller, address rwaTokenAddress, address paymentTokenAddress, address buyerReceiveAddress, uint256 rwaTokenAmount, uint256 paymentAmount) external payable returns (bytes32)",
  
  // 发货并完成交易
  "function shipAndComplete(bytes32 orderId, address sellerReceiveAddress) external",
  
  // 取消订单
  "function cancelOrder(bytes32 orderId) external",
  
  // 获取订单信息 - 根据合约实际结构更新
  "function getOrder(bytes32 orderId) external view returns (tuple(address buyer, address seller, address rwaTokenAddress, address paymentTokenAddress, address buyerReceiveAddress, uint256 rwaTokenAmount, uint256 paymentAmount, bytes32 orderId, uint256 createdAt, uint256 completedAt, uint8 status))",
  
  // 获取买家订单列表
  "function getBuyerOrders(address buyer) external view returns (bytes32[] memory)",
  
  // 获取卖家订单列表
  "function getSellerOrders(address seller) external view returns (bytes32[] memory)",
  
  // 获取平台费用
  "function platformFee() external view returns (uint256)",
  
  // 获取合约ETH余额
  "function getETHBalance() external view returns (uint256)",
  
  // 获取合约代币余额
  "function getTokenBalance(address tokenAddress) external view returns (uint256)",
  
  // 事件 - 根据合约实际事件更新
  "event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, address rwaTokenAddress, address paymentTokenAddress, uint256 rwaTokenAmount, uint256 paymentAmount)",
  "event OrderCompleted(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 completedAt)",
  "event OrderCancelled(bytes32 indexed orderId, address indexed cancelledBy, uint256 cancelledAt)"
];

// RWA Token接口ABI
const RWATokenABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function getUnderlyingAssetType() external view returns (string memory)",
  "function getUnderlyingAssetId() external view returns (string memory)",
  "function getComplianceStatus() external view returns (bool)",
  "function getIssuer() external view returns (address)",
  "function isKYCVerified(address account) external view returns (bool)",
  "function setKYCStatus(address account, bool status) external",
  "function mint(address to, uint256 amount) external",
  "function burn(address from, uint256 amount) external"
];

// ERC20代币接口ABI
const ERC20ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string memory)",
  "function name() external view returns (string memory)"
];

export class RWAMarketplaceService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
    this.rwaTokenContract = null;
    this.paymentTokenContract = null;
    this.networkType = null;
  }

  /**
   * 初始化服务
   * @param {Object} walletProvider - 钱包提供者
   * @param {string} networkType - 网络类型 ('ethereum' | 'solana')
   * @param {string} contractAddress - 合约地址（可选，如果不提供则使用默认Sepolia地址）
   */
  async initialize(walletProvider, networkType, contractAddress = null) {
    try {
      this.networkType = networkType;
      
      // 如果没有提供合约地址，使用Sepolia测试网地址
      if (!contractAddress) {
        contractAddress = getContractAddress('rwaMarketplace');
        console.log('🔧 使用Sepolia测试网合约地址:', contractAddress);
      }
      
      if (networkType === 'ethereum') {
        await this.initializeEthereum(walletProvider, contractAddress);
      } else if (networkType === 'solana') {
        await this.initializeSolana(walletProvider, contractAddress);
      } else {
        throw new Error(`不支持的网络类型: ${networkType}`);
      }
      
      console.log('✅ RWA Marketplace服务初始化成功');
      return true;
    } catch (error) {
      console.error('❌ RWA Marketplace服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化以太坊网络
   */
  async initializeEthereum(walletProvider, contractAddress) {
    // 创建provider和signer (ethers v6)
    this.provider = new ethers.BrowserProvider(walletProvider);
    this.signer = await this.provider.getSigner();
    
    // 创建合约实例
    this.contract = new ethers.Contract(contractAddress, RWAMarketplaceABI, this.signer);
    
    // 保存合约地址到实例属性，确保可以访问
    this.contractAddress = contractAddress;

    // 验证合约地址
    const code = await this.provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('合约地址无效');
    }
  }

  /**
   * 生成唯一的订单ID
   * @param {string} prefix - 订单前缀
   * @param {string} buyerAddress - 买家地址
   * @param {string} sellerAddress - 卖家地址
   * @param {number} timestamp - 时间戳
   * @returns {string} 订单ID
   */
  generateOrderId(orderId) {
    return ethers.keccak256(ethers.toUtf8Bytes(orderId));
  }

  /**
   * 创建订单并付款
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 订单结果
   */
  async createOrderAndPay(orderData) {
    try {
      const {
        orderId,
        seller,
        rwaTokenAddress,
        paymentTokenAddress,
        buyerReceiveAddress,
        rwaTokenAmount,
        paymentAmount
      } = orderData;

      // 验证参数
      this.validateOrderData(orderData);

      // 检查用户余额
      await this.checkUserBalance(paymentTokenAddress, paymentAmount);

      const txOrderId = this.generateOrderId(orderId);

      let transaction;
      
      if (paymentTokenAddress === ethers.ZeroAddress) {
        // ETH支付
        transaction = await this.contract.createOrderAndPay(
          txOrderId,
          this.signer.getAddress(), // buyer
          seller,
          rwaTokenAddress,
          paymentTokenAddress,
          buyerReceiveAddress,
          rwaTokenAmount,
          paymentAmount,
          { value: paymentAmount }
        );
      } else {
        // ERC20代币支付
        // 首先授权Marketplace合约使用代币
        await this.approvePaymentToken(paymentTokenAddress, paymentAmount);
        
        transaction = await this.contract.createOrderAndPay(
          txOrderId,
          this.signer.getAddress(), // buyer
          seller,
          rwaTokenAddress,
          paymentTokenAddress,
          buyerReceiveAddress,
          rwaTokenAmount,
          paymentAmount
        );
      }

      // 等待交易确认
      const receipt = await transaction.wait();
      
      // 打印收据信息用于调试
      console.log('🔧 交易收据信息:', {
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        status: receipt.status,
        events: receipt.events,
        logs: receipt.logs
      });
      
      // 使用辅助方法从收据中获取交易信息
      const transactionHash = this.getTransactionHashFromReceipt(receipt);

      return {
        success: true,
        orderId,
        transactionHash: transactionHash,
        status: receipt.status || 1,
        logs: receipt.logs || [],
      };

    } catch (error) {
      console.error('创建订单失败:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * 发货并完成交易
   * @param {string} orderId - 订单ID
   * @param {string} rwaTokenAddress - RWA Token地址
   * @param {string} rwaTokenAmount - RWA Token数量
   * @param {string} sellerReceiveAddress - 卖家收款地址
   * @returns {Promise<Object>} 交易结果
   */
  async shipAndComplete(orderId, rwaTokenAddress, rwaTokenAmount, sellerReceiveAddress) {
    try {
      // 授权Marketplace合约使用RWA Token
      await this.approveRWAToken(rwaTokenAddress, rwaTokenAmount);

      // 执行发货完成交易
      const transaction = await this.contract.shipAndComplete(orderId, sellerReceiveAddress);
      const receipt = await transaction.wait();

      const transactionHash = this.getTransactionHashFromReceipt(receipt);

      // 打印收据信息用于调试
      console.log('🔧 发货完成交易收据信息:', {
        transactionHash,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        status: receipt.status,
        events: receipt.events,
        logs: receipt.logs
      });

      return {
        success: true,
        transactionHash,
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '0',
        effectiveGasPrice: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : '0'
      };

    } catch (error) {
      console.error('发货完成失败:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * 取消订单
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 交易结果
   */
  async cancelOrder(orderId) {
    try {
      const transaction = await this.contract.cancelOrder(orderId);
      const receipt = await transaction.wait();

      // 打印收据信息用于调试
      console.log('🔧 取消订单交易收据信息:', {
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        status: receipt.status,
        events: receipt.events,
        logs: receipt.logs
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '0',
        effectiveGasPrice: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : '0'
      };

    } catch (error) {
      console.error('取消订单失败:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * 获取订单信息
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 订单信息
   */
  async getOrder(orderId) {
    try {
      if (!this.contract) {
        throw new Error('RWA Marketplace服务未初始化，请先调用initialize方法');
      }
      
      const txOrderId = this.generateOrderId(orderId);
      const order = await this.contract.getOrder(txOrderId);
      
      return {
        buyer: order.buyer,
        seller: order.seller,
        rwaTokenAddress: order.rwaTokenAddress,
        paymentTokenAddress: order.paymentTokenAddress,
        buyerReceiveAddress: order.buyerReceiveAddress,
        rwaTokenAmount: order.rwaTokenAmount ? order.rwaTokenAmount.toString() : '0',
        paymentAmount: order.paymentAmount ? order.paymentAmount.toString() : '0',
        orderId: order.orderId ? order.orderId.toString() : orderId,
        createdAt: order.createdAt ? new Date(Number(order.createdAt) * 1000) : new Date(),
        completedAt: order.completedAt && Number(order.completedAt) > 0 ? new Date(Number(order.completedAt) * 1000) : null,
        status: this.getOrderStatus(order.status)
      };

    } catch (error) {
      console.error('获取订单信息失败:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * 获取买家订单列表
   * @param {string} buyerAddress - 买家地址
   * @returns {Promise<Array>} 订单ID列表
   */
  async getBuyerOrders(buyerAddress) {
    try {
      if (!this.contract) {
        throw new Error('RWA Marketplace服务未初始化，请先调用initialize方法');
      }
      
      const orderIds = await this.contract.getBuyerOrders(buyerAddress);
      return orderIds.map(id => id ? id.toString() : '');
    } catch (error) {
      console.error('获取买家订单列表失败:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * 获取卖家订单列表
   * @param {string} sellerAddress - 卖家地址
   * @returns {Promise<Array>} 订单ID列表
   */
  async getSellerOrders(sellerAddress) {
    try {
      if (!this.contract) {
        throw new Error('RWA Marketplace服务未初始化，请先调用initialize方法');
      }
      
      const orderIds = await this.contract.getSellerOrders(sellerAddress);
      return orderIds.map(id => id ? id.toString() : '');
    } catch (error) {
      console.error('获取卖家订单列表失败:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * 授权支付代币
   * @param {string} tokenAddress - 代币地址
   * @param {string} amount - 授权数量
   */
  async approvePaymentToken(tokenAddress, amount) {
    try {
      if (!this.contractAddress) {
        throw new Error('合约地址未设置，请先初始化RWA Marketplace服务');
      }
      
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, this.signer);
      
      // 检查当前授权额度
      const signerAddress = await this.signer.getAddress();
      const allowance = await tokenContract.allowance(signerAddress, this.contractAddress);
      
      // 在 ethers v6 中，allowance 是 BigInt，需要转换为 BigInt 进行比较
      const allowanceBigInt = BigInt(allowance.toString());
      const amountBigInt = BigInt(amount);
      
      if (allowanceBigInt < amountBigInt) {
        // 需要授权
        console.log('🔧 开始执行授权交易...');
        const transaction = await tokenContract.approve(this.contractAddress, amount);
        await transaction.wait();
        console.log('✅ 支付代币授权成功');
      } else {
        console.log('✅ 已有足够授权额度，无需重新授权');
      }
    } catch (error) {
      console.error('支付代币授权失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户余额
   * @param {string} tokenAddress - 代币地址
   * @param {string} amount - 需要支付的金额
   */
  async checkUserBalance(tokenAddress, amount) {
    try {
      const signerAddress = await this.signer.getAddress();
      
      if (tokenAddress === ethers.ZeroAddress) {
        // 检查ETH余额
        const balance = await this.provider.getBalance(signerAddress);
        const requiredAmount = BigInt(amount);
        
        console.log('🔧 ETH余额检查:');
        console.log('🔧 当前余额:', balance.toString());
        console.log('🔧 需要金额:', requiredAmount.toString());
        
        if (balance < requiredAmount) {
          throw new Error(`ETH余额不足。当前余额: ${ethers.formatEther(balance)} ETH，需要: ${ethers.formatEther(requiredAmount)} ETH`);
        }
      } else {
        // 检查ERC20代币余额
        const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, this.provider);
        const balance = await tokenContract.balanceOf(signerAddress);
        const requiredAmount = BigInt(amount);
        
        console.log('🔧 代币余额检查:');
        console.log('🔧 代币地址:', tokenAddress);
        console.log('🔧 当前余额:', balance.toString());
        console.log('🔧 需要金额:', requiredAmount.toString());
        
        if (balance < requiredAmount) {
          // 获取代币信息以显示更友好的错误信息
          const [symbol, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals()
          ]);
          
          const balanceFormatted = ethers.formatUnits(balance, decimals);
          const requiredFormatted = ethers.formatUnits(requiredAmount, decimals);
          
          throw new Error(`${symbol}余额不足。当前余额: ${balanceFormatted} ${symbol}，需要: ${requiredFormatted} ${symbol}`);
        }
      }
      
      console.log('✅ 余额检查通过');
    } catch (error) {
      console.error('余额检查失败:', error);
      throw error;
    }
  }

  /**
   * 授权RWA Token
   * @param {string} tokenAddress - RWA Token地址
   * @param {string} amount - 授权数量
   */
  async approveRWAToken(tokenAddress, amount) {
    try {
      console.log('🔧 开始授权RWA Token...');
      console.log('🔧 RWA Token地址:', tokenAddress);
      console.log('🔧 授权金额:', amount);
      console.log('🔧 合约地址:', this.contractAddress);
      
      if (!this.contractAddress) {
        throw new Error('合约地址未设置，请先初始化RWA Marketplace服务');
      }
      
      const tokenContract = new ethers.Contract(tokenAddress, RWATokenABI, this.signer);
      
      // 检查当前授权额度
      const signerAddress = await this.signer.getAddress();
      const allowance = await tokenContract.allowance(signerAddress, this.contractAddress);
      
      // 在 ethers v6 中，allowance 是 BigInt，需要转换为 BigInt 进行比较
      const allowanceBigInt = BigInt(allowance.toString());
      const amountBigInt = BigInt(amount);
      
      console.log('🔧 当前授权额度:', allowance.toString());
      console.log('🔧 需要授权金额:', amount);
      
      if (allowanceBigInt < amountBigInt) {
        // 需要授权
        console.log('🔧 开始执行授权交易...');
        const transaction = await tokenContract.approve(this.contractAddress, amount);
        await transaction.wait();
        console.log('✅ RWA Token授权成功');
      } else {
        console.log('✅ 已有足够授权额度，无需重新授权');
      }
    } catch (error) {
      console.error('RWA Token授权失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户代币余额
   * @param {string} tokenAddress - 代币地址
   * @returns {Promise<Object>} 余额信息
   */
  async getUserTokenBalance(tokenAddress) {
    try {
      const signerAddress = await this.signer.getAddress();
      
      if (tokenAddress === ethers.ZeroAddress) {
        // 获取ETH余额
        const balance = await this.provider.getBalance(signerAddress);
        return {
          symbol: 'ETH',
          balance: balance.toString(),
          formattedBalance: ethers.formatEther(balance),
          decimals: 18
        };
      } else {
        // 获取ERC20代币余额
        const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, this.provider);
        const [balance, symbol, decimals, name] = await Promise.all([
          tokenContract.balanceOf(signerAddress),
          tokenContract.symbol(),
          tokenContract.decimals(),
          tokenContract.name()
        ]);
        
        return {
          symbol,
          name,
          balance: balance.toString(),
          formattedBalance: ethers.formatUnits(balance, decimals),
          decimals
        };
      }
    } catch (error) {
      console.error('获取用户代币余额失败:', error);
      throw error;
    }
  }

  /**
   * 获取RWA Token信息
   * @param {string} tokenAddress - RWA Token地址
   * @returns {Promise<Object>} Token信息
   */
  async getRWATokenInfo(tokenAddress) {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, RWATokenABI, this.provider);
      const signerAddress = await this.signer.getAddress();
      
      const [
        underlyingAssetType,
        underlyingAssetId,
        complianceStatus,
        issuer,
        isKYCVerified
      ] = await Promise.all([
        tokenContract.getUnderlyingAssetType(),
        tokenContract.getUnderlyingAssetId(),
        tokenContract.getComplianceStatus(),
        tokenContract.getIssuer(),
        tokenContract.isKYCVerified(signerAddress)
      ]);

      return {
        underlyingAssetType,
        underlyingAssetId,
        complianceStatus,
        issuer,
        isKYCVerified
      };
    } catch (error) {
      console.error('获取RWA Token信息失败:', error);
      throw error;
    }
  }

  /**
   * 验证订单数据
   * @param {Object} orderData - 订单数据
   */
  validateOrderData(orderData) {
    const {
      seller,
      rwaTokenAddress,
      buyerReceiveAddress,
      rwaTokenAmount,
      paymentAmount
    } = orderData;

    if (!seller || !ethers.isAddress(seller)) {
      throw new Error('卖家地址无效');
    }
    
    if (!rwaTokenAddress || !ethers.isAddress(rwaTokenAddress)) {
      throw new Error('RWA Token地址无效');
    }
    
    if (!buyerReceiveAddress || !ethers.isAddress(buyerReceiveAddress)) {
      throw new Error('买家接收地址无效');
    }

    if (!rwaTokenAmount || BigInt(rwaTokenAmount) <= 0n) {
      throw new Error('RWA Token数量必须大于0');
    }

    if (!paymentAmount || BigInt(paymentAmount) <= 0n) {
      throw new Error('支付金额必须大于0');
    }
  }

  /**
   * 获取订单状态
   * @param {number} status - 状态码
   * @returns {string} 状态描述
   */
  getOrderStatus(status) {
    const statusMap = {
      0: 'PAID',      // 买家已付款，等待卖家发货
      1: 'COMPLETED', // 交易完成
      2: 'CANCELLED'  // 订单取消
    };
    return statusMap[status] || 'UNKNOWN';
  }

  /**
   * 处理合约错误
   * @param {Error} error - 错误对象
   * @returns {Error} 处理后的错误
   */
  handleContractError(error) {
    let message = '合约调用失败';
    
    if (error.code === 4001) {
      message = '用户拒绝交易';
    } else if (error.code === -32603) {
      message = '网络错误，请检查网络连接';
    } else if (error.message.includes('insufficient funds')) {
      message = '余额不足';
    } else if (error.message.includes('transfer amount exceeds balance')) {
      message = '代币余额不足，请检查您的代币余额';
    } else if (error.message.includes('execution reverted')) {
      // 检查是否是余额不足的错误
      if (error.message.includes('ERC20: transfer amount exceeds balance')) {
        message = '代币余额不足，请检查您的代币余额';
      } else if (error.message.includes('ERC20: insufficient allowance')) {
        message = '代币授权额度不足，请重新授权';
      } else {
        message = '交易执行失败，请检查参数';
      }
    } else if (error.message.includes('nonce too low')) {
      message = '交易nonce错误，请重试';
    } else if (error.message.includes('Order ID already exists')) {
      message = '订单ID已存在，请重试';
    } else if (error.message.includes('Not the buyer')) {
      message = '只有买家可以执行此操作';
    } else if (error.message.includes('Not the seller')) {
      message = '只有卖家可以执行此操作';
    } else if (error.message.includes('Invalid order status')) {
      message = '订单状态无效';
    } else if (error.message.includes('Zero address not allowed')) {
      message = '零地址不允许';
    } else if (error.message.includes('Amount must be greater than 0')) {
      message = '金额必须大于0';
    } else {
      message = error.message || '未知错误';
    }

    const customError = new Error(message);
    customError.originalError = error;
    return customError;
  }

  /**
   * 监听合约事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  onContractEvent(eventName, callback) {
    if (!this.contract) {
      throw new Error('合约未初始化');
    }

    this.contract.on(eventName, callback);
  }

  /**
   * 移除事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  offContractEvent(eventName, callback) {
    if (!this.contract) {
      return;
    }

    this.contract.off(eventName, callback);
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
    
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
    this.rwaTokenContract = null;
    this.paymentTokenContract = null;
    this.networkType = null;
  }

  /**
   * 从交易收据中获取交易哈希
   * @param {Object} receipt - 交易收据
   * @returns {string} 交易哈希
   */
  getTransactionHashFromReceipt(receipt) {
    // 首先尝试从收据本身获取
    if (receipt.transactionHash) {
      return receipt.transactionHash;
    }
    
    // 如果收据中没有，尝试从logs中获取
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        if (log.transactionHash) {
          return log.transactionHash;
        }
      }
    }
    
    return 'unknown';
  }
}

// 创建单例实例
export const rwaMarketplaceService = new RWAMarketplaceService(); 