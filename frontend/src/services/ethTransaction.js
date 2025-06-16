import { ethers } from 'ethers';

export class EthTransactionService {
  constructor(walletProvider, address) {
    this.walletProvider = walletProvider;
    this.address = address;
  }

  async executeTransaction(txData) {
    if (!this.walletProvider) {
      throw new Error('钱包未连接');
    }

    try {
      // 确保地址格式正确
      const toAddress = ethers.getAddress(txData.to);
      
      txData.value = "0.0001"
      
      // 构建基础交易对象，只包含必要参数
      const transaction = {
        from: this.address,
        to: toAddress,
        data: txData.data,
        value: txData.value ? ethers.toBeHex(ethers.parseEther(txData.value)) : '0x0'
      };

      console.log('发送交易参数:', {
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        data: transaction.data
      });

      // 发送交易，让钱包自动处理 gas 相关参数
      const tx = await this.walletProvider.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });

      return tx;
    } catch (error) {
      console.error('交易执行失败:', error);
      throw error;
    }
  }

} 