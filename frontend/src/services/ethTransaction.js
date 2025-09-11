import { ethers } from 'ethers';

export class EthTransactionService {
  constructor(connection, walletProvider, walletAddress) {
    this.connection = connection;
    this.walletProvider = walletProvider;
    this.walletAddress = walletAddress;
  }

  async executeTransaction(txData) {
    if (!this.walletProvider) {
      throw new Error('钱包未连接');
    }

    try {
      // 确保地址格式正确
      const toAddress = ethers.getAddress(txData.to);

      // 处理 value 字段 - 从 Wei 转换为 ETH 标准单位
      let valueHex;
      if (txData.value && txData.value !== '0') {
        // 使用 ethers.formatEther 将 Wei 转换为 ETH
        const valueInEth = ethers.formatEther(txData.value);
        console.log('转换后的 value (ETH):', valueInEth);
        
        // 使用 parseEther 将 ETH 转换为 Wei，然后转换为 hex
        const valueInWei = ethers.parseEther(valueInEth);
        // 直接使用 BigInt 转换为 hex，避免前导零问题
        valueHex = '0x' + valueInWei.toString(16);
      }

      // 构建 eth_call 参数
      // 构建基础交易对象，只包含必要参数
      const transaction = {
        from: this.walletAddress,
        to: toAddress,
        data: txData.data,
        ...(valueHex ? { value: valueHex } : {})
      };
      
      // // 先用 eth_call 方式模拟交易，检查是否有错
      // try {
      //   await this.walletProvider.request({
      //     method: 'eth_call',
      //     params: [
      //       callParams: transaction,
      //       'latest'
      //     ]
      //   });
      // } catch (callError) {
      //   console.error('eth_call 预执行失败:', callError);
      //   throw new Error('eth_call 预执行失败: ' + (callError && callError.message ? callError.message : callError));
      // }

      console.log('发送交易参数:', {
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        data: transaction.data
      });

      // 发送交易，让钱包自动处理 gas 相关参数
      const txHash = await this.walletProvider.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });

      // 等待交易被确认
      const provider = new ethers.BrowserProvider(this.walletProvider);
      const receipt = await provider.waitForTransaction(txHash);

      if (receipt && receipt.status === 1) {
        console.log('合约执行成功:', receipt);
        return txHash;
      } else {
        console.log('合约执行失败:', receipt);
        throw new Error('合约执行失败');
      }
    } catch (error) {
      console.error('交易执行失败:', error);
      throw error;
    }
  }

} 