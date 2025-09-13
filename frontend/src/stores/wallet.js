import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWalletStore = defineStore('wallet', () => {
  // 状态
  const isConnected = ref(false)
  const address = ref('')
  const connection = ref(null)
  const walletProvider = ref(null)
  const networkType = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const isWalletConnected = computed(() => isConnected.value)
  const walletAddress = computed(() => address.value)
  const walletConnection = computed(() => connection.value)
  const walletProviderName = computed(() => walletProvider.value)
  const currentNetworkType = computed(() => networkType.value)

  // 方法
  const updateWalletState = (payload) => {
    const { 
      isConnected: connected, 
      address: addr, 
      connection: conn, 
      walletProvider: provider,
      networkType: netType
    } = payload
    
    isConnected.value = connected
    address.value = addr || ''
    connection.value = conn || null
    walletProvider.value = provider || null
    networkType.value = netType || null
    error.value = null
  }

  const checkWalletConnection = async (requiredNetworkType = null) => {
    if (!isConnected.value) {
      return false
    }
    
    // 如果指定了需要的网络类型，检查当前网络类型是否匹配
    if (requiredNetworkType && networkType.value !== requiredNetworkType) {
      return false
    }
    
    return true
  }

  const connectWallet = async (provider) => {
    loading.value = true
    error.value = null
    
    try {
      // 这里应该调用实际的钱包连接逻辑
      // 示例：const result = await walletService.connect(provider)
      
      // 模拟连接成功
      const mockResult = {
        isConnected: true,
        address: '0x1234567890abcdef...',
        connection: { provider: provider },
        walletProvider: provider,
        networkType: 'Ethereum'
      }
      
      updateWalletState(mockResult)
      return { success: true, data: mockResult }
    } catch (err) {
      error.value = err.message || '钱包连接失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const disconnectWallet = () => {
    updateWalletState({
      isConnected: false,
      address: '',
      connection: null,
      walletProvider: null,
      networkType: null
    })
  }

  const getWalletBalance = async () => {
    if (!isConnected.value) {
      throw new Error('钱包未连接')
    }
    
    try {
      // 这里应该调用实际的余额查询逻辑
      // 示例：const balance = await walletService.getBalance(address.value)
      
      // 模拟余额查询
      return {
        success: true,
        balance: '1.23456789',
        currency: 'ETH'
      }
    } catch (err) {
      error.value = err.message || '获取余额失败'
      return { success: false, error: error.value }
    }
  }

  const signMessage = async (message) => {
    if (!isConnected.value) {
      throw new Error('钱包未连接')
    }
    
    try {
      // 这里应该调用实际的消息签名逻辑
      // 示例：const signature = await walletService.signMessage(message)
      
      // 模拟签名
      return {
        success: true,
        signature: '0xabcdef123456...',
        message: message
      }
    } catch (err) {
      error.value = err.message || '消息签名失败'
      return { success: false, error: error.value }
    }
  }

  const sendTransaction = async (transaction) => {
    if (!isConnected.value) {
      throw new Error('钱包未连接')
    }
    
    loading.value = true
    error.value = null
    
    try {
      // 这里应该调用实际的交易发送逻辑
      // 示例：const result = await walletService.sendTransaction(transaction)
      
      // 模拟交易发送
      const mockResult = {
        success: true,
        txHash: '0x1234567890abcdef...',
        transaction: transaction
      }
      
      return mockResult
    } catch (err) {
      error.value = err.message || '交易发送失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    isConnected,
    address,
    connection,
    walletProvider,
    networkType,
    loading,
    error,
    
    // 计算属性
    isWalletConnected,
    walletAddress,
    walletConnection,
    walletProviderName,
    currentNetworkType,
    
    // 方法
    updateWalletState,
    checkWalletConnection,
    connectWallet,
    disconnectWallet,
    getWalletBalance,
    signMessage,
    sendTransaction,
    clearError
  }
}, {
  persist: {
    key: 'wallet',
    storage: localStorage,
    paths: ['isConnected', 'address', 'walletProvider', 'networkType']
  }
}) 