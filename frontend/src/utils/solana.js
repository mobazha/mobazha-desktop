import { PublicKey, TransactionInstruction } from '@solana/web3.js';

/**
 * 确认交易状态
 * @param {Connection} connection - Solana 连接实例
 * @param {string} signature - 交易签名
 * @param {Object} options - 配置选项
 * @param {number} options.maxRetries - 最大重试次数，默认10
 * @param {number} options.retryInterval - 重试间隔（毫秒），默认2000
 * @returns {Promise<Object>} - 交易状态
 */
export async function confirmTransaction(connection, signature, options = {}) {
  //  // 等待交易确认
  //  const confirmation = await this.connection.confirmTransaction(signature);
  // console.log('Transaction confirmation:', confirmation);

  const { maxRetries = 10, retryInterval = 2000 } = options;
  let retries = 0;
  let confirmation = null;

  while (retries < maxRetries) {
    try {
      // 使用 getSignatureStatus 检查交易状态
      const status = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: false
      });
      
      console.log(`Retry ${retries + 1} status:`, status);
      
      if (status && status.value && status.value.confirmationStatus === 'confirmed') {
        confirmation = status;
        break;
      }
      
      // 等待一段时间再重试
      await new Promise(resolve => setTimeout(resolve, retryInterval));
      retries++;
    } catch (error) {
      console.warn(`Retry ${retries + 1} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
      retries++;
    }
  }

  if (!confirmation) {
    throw new Error('交易确认超时');
  }

  return confirmation;
}

/**
 * 将 Solana Go 的指令转换为 JavaScript 的 TransactionInstruction
 * @param {Object} goInstruction - Solana Go 的指令对象
 * @returns {TransactionInstruction} - JavaScript 的 TransactionInstruction 实例
 */
export function convertSolanaGoInstruction(goInstruction) {
  // 转换账户键
  const accountKeys = goInstruction.AccountValues.map(account => {
    return {
      pubkey: new PublicKey(account.PublicKey),
      isSigner: account.IsSigner,
      isWritable: account.IsWritable
    };
  });

  // 将 base64 字符串转换为 Buffer
  let data;
  try {
    // 检查是否是 base64 字符串
    if (typeof goInstruction.DataBytes === 'string') {
      data = Buffer.from(goInstruction.DataBytes, 'base64');
    } else if (goInstruction.DataBytes instanceof Uint8Array) {
      data = Buffer.from(goInstruction.DataBytes);
    } else {
      throw new Error('Unsupported DataBytes format');
    }

    const programId = new PublicKey(goInstruction.ProgID);
    
    // 创建并返回 TransactionInstruction
    return new TransactionInstruction({
      keys: accountKeys,
      programId,
      data
    });
  } catch (error) {
    console.error('Error converting instruction data:', error);
    throw error;
  }
}
