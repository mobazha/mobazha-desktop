import { Transaction, PublicKey } from '@solana/web3.js';
import { convertSolanaGoInstruction, confirmTransaction } from '@/utils/solana';

export class SolanaTransactionService {
  constructor(connection, walletProvider, walletAddress) {
    this.connection = connection;
    this.walletProvider = walletProvider;
    this.walletAddress = walletAddress;
  }

  async executeTransaction(instructions) {
    if (!this.connection) {
      throw new Error('未连接到 Solana 网络');
    }

    if (!this.walletProvider) {
      throw new Error('钱包未连接');
    }

    try {
      const transaction = new Transaction();

      instructions.forEach(instruction => {
        const convertedInstruction = convertSolanaGoInstruction(instruction);
        transaction.add(convertedInstruction);
      });

      const wallet = new PublicKey(this.walletAddress);
      if (!wallet) throw Error('wallet provider is not available');

      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet;

      try {
        const simulation = await this.connection.simulateTransaction(transaction);
        console.log('交易模拟结果:', {
          err: simulation.value.err,
          logs: simulation.value.logs,
          accounts: simulation.value.accounts
        });

        if (simulation.value.err) {
          const errorInfo = simulation.value.err;
          let errorMessage = '交易模拟失败: ';
          
          if (Array.isArray(errorInfo)) {
            const [instructionIndex, error] = errorInfo;
            errorMessage += `指令 ${instructionIndex} 执行失败: `;
            errorMessage += JSON.stringify(error);
          } else {
            errorMessage += JSON.stringify(errorInfo);
          }

          if (simulation.value.logs) {
            errorMessage += '\n执行日志:\n' + simulation.value.logs.join('\n');
          }

          throw new Error(errorMessage);
        }

        if (simulation.value.logs) {
          console.log('交易模拟日志:', simulation.value.logs);
        }
      } catch (error) {
        console.error('交易模拟失败:', error);
        throw new Error('交易模拟失败，可能存在风险: ' + error.message);
      }

      // 打印交易详情
      console.log('准备签名交易:');
      console.log('交易账户数量:', transaction.instructions.length);
      console.log('交易费用支付者:', transaction.feePayer?.toBase58());
      console.log('最近区块哈希:', transaction.recentBlockhash);

      // 检查钱包余额
      const balance = await this.connection.getBalance(wallet);
      console.log('钱包余额:', balance, 'lamports');
      if (balance < 5000) { // 最小余额要求
        throw new Error('钱包余额不足');
      }

      // 尝试签名交易
      const signature = await this.walletProvider.signAndSendTransaction(transaction);
      console.log('交易已签名并发送，签名:', signature);

      console.log('等待交易确认...');
      const confirmation = await confirmTransaction(this.connection, signature, {
        maxRetries: 10,
        retryInterval: 2000
      });
            
      const status = await this.connection.getSignatureStatus(signature);
      if (status.value?.err) {
        throw new Error(`交易执行失败: ${JSON.stringify(status.value.err)}`);
      }
            
      console.log('交易确认成功:', confirmation);
      return signature;
    } catch (error) {
      throw error;
    }
  }
} 