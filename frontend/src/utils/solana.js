import { PublicKey, TransactionInstruction } from '@solana/web3.js';

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

  // 转换程序ID
  const programId = new PublicKey(goInstruction.ProgID);

  // 转换数据字节
  const data = Buffer.from(goInstruction.DataBytes);

  // 创建并返回 TransactionInstruction
  return new TransactionInstruction({
    keys: accountKeys,
    programId,
    data
  });
}
