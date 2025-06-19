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
      
      // txData.value = "0.0001"

      // 处理 value 字段
      let valueHex;
      if (txData.value && txData.value !== '0') {
        valueHex = ethers.toBeHex(ethers.parseEther(txData.value));
      }

      // 构建 eth_call 参数
      const callParams = {
        from: this.address,
        to: toAddress,
        data: txData.data,
        ...(valueHex ? { value: valueHex } : {})
      };
      
      // 先用 eth_call 方式模拟交易，检查是否有错
      try {
        await this.walletProvider.request({
          method: 'eth_call',
          params: [
            callParams,
            'latest'
          ]
        });
      } catch (callError) {
        console.error('eth_call 预执行失败:', callError);
        throw new Error('eth_call 预执行失败: ' + (callError && callError.message ? callError.message : callError));
      }

      // 构建基础交易对象，只包含必要参数
      const transaction = {
        from: this.address,
        to: toAddress,
        data: txData.data,
        ...(valueHex ? { value: valueHex } : {})
      };

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